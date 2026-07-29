#!/usr/bin/env node
/**
 * 片源健康检测脚本
 * - 探测 config.json 中现有源，移除确认死掉的（连接失败/超时/5xx/返回 HTML 错误页）
 * - 探测 scripts/candidates.json 候选池，添加确认健康的源
 * - 仅当确有变化时写回 config.json，并通过 $GITHUB_OUTPUT 输出 changed 标记
 *
 * 注意：GitHub Actions 运行在数据中心 IP，部分站点会被 Cloudflare 拦截（403/429/503），
 * 这类“结果不明确”的源不会被移除也不会被添加，以避免误删可用源。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'config.json');
const candidatesPath = path.join(root, 'scripts', 'candidates.json');

const TIMEOUT = 12000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 探测单个 api 端点一次，返回 { status: 'ok' | 'dead' | 'unknown', reason, retryable } */
async function probeOnce(api) {
  const sep = api.includes('?') ? '&' : '?';
  const url = `${api}${sep}ac=list&pg=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'application/json, text/xml, */*' },
    });
    clearTimeout(timer);
    const text = await res.text();
    if (res.status >= 500) return { status: 'dead', reason: `http ${res.status}` };
    // 数据中心 IP 常被 Cloudflare 拦截，结果不明确 → 不处理，避免误删
    if (res.status === 403 || res.status === 429 || res.status === 503)
      return { status: 'unknown', reason: `http ${res.status}` };
    if (res.status >= 400) return { status: 'dead', reason: `http ${res.status}` };

    const body = text.trim();
    if (/^<!doctype|^<html/i.test(body)) return { status: 'dead', reason: 'html 错误页' };
    if (/<rss|<\?xml|<list/.test(body)) return { status: 'ok', reason: 'xml' };
    try {
      const j = JSON.parse(body);
      if (typeof j.code !== 'undefined' || Array.isArray(j.list) || j.rss)
        return { status: 'ok', reason: 'json' };
    } catch {
      /* ignore */
    }
    return { status: 'unknown', reason: '无法识别的返回体' };
  } catch (e) {
    clearTimeout(timer);
    // 连接级错误/超时为瞬时抖动，可重试
    return {
      status: 'dead',
      reason: e.name === 'AbortError' ? 'timeout' : `error: ${e.message}`,
      retryable: true,
    };
  }
}

/** 带一次重试的探测：网络级错误/超时重试一次，降低 CI 误删率 */
async function probe(api) {
  const r1 = await probeOnce(api);
  if (r1.status !== 'dead' || !r1.retryable) return r1;
  await sleep(1500);
  return probeOnce(api);
}

/** 限制并发的 map */
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8')).candidates || [];
  const sites = config.api_site || {};

  console.log(`[检测] 现有源 ${Object.keys(sites).length} 个，候选池 ${candidates.length} 个`);

  // 1) 探测现有源
  const existingKeys = Object.keys(sites);
  const existingResults = await mapPool(existingKeys, 6, async (k) => ({
    k,
    r: await probe(sites[k].api),
  }));

  const kept = {};
  const removed = [];
  for (const { k, r } of existingResults) {
    if (r.status === 'dead') {
      removed.push({ key: k, name: sites[k].name, reason: r.reason });
      console.log(`  ✗ 移除 ${sites[k].name} (${k}): ${r.reason}`);
    } else {
      kept[k] = sites[k];
      if (r.status === 'unknown') console.log(`  ? 保留(结果不明) ${sites[k].name} (${k}): ${r.reason}`);
    }
  }

  // 2) 探测候选池，仅添加健康的且不存在的
  const added = [];
  const existingApis = new Set(Object.values(sites).map((s) => s.api));
  const toTest = candidates.filter(
    (c) => !kept[c.key] && !existingApis.has(c.api)
  );
  const candResults = await mapPool(toTest, 6, async (c) => ({ c, r: await probe(c.api) }));
  for (const { c, r } of candResults) {
    if (r.status === 'ok') {
      kept[c.key] = { api: c.api, name: c.name, detail: c.detail };
      added.push({ key: c.key, name: c.name });
      console.log(`  ✓ 新增 ${c.name} (${c.key})`);
    } else if (r.status === 'dead') {
      console.log(`  - 跳过(不可用) ${c.name} (${c.key}): ${r.reason}`);
    }
  }

  const changed = removed.length > 0 || added.length > 0;
  if (!changed) {
    console.log('[结果] 无变化');
    return;
  }

  if (process.env.DRY_RUN) {
    console.log(`[DRY_RUN] 将移除 ${removed.length} 个、新增 ${added.length} 个（不写文件）`);
  } else {
    config.api_site = kept;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`[结果] 已写回 config.json：移除 ${removed.length} 个，新增 ${added.length} 个`);
  }

  // 输出给 GitHub Actions
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    fs.appendFileSync(ghOutput, `changed=true\n`);
    fs.appendFileSync(ghOutput, `added_count=${added.length}\n`);
    fs.appendFileSync(ghOutput, `removed_count=${removed.length}\n`);
  }
}

main().catch((e) => {
  console.error('脚本异常:', e);
  process.exit(1);
});
