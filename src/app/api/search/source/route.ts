import { NextResponse } from 'next/server';

import { getCacheTime, getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import { normalizeSearchResults } from '@/lib/searchRank';
import { yellowWords } from '@/lib/yellow';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const resourceId = searchParams.get('resourceId');

  if (!query || !resourceId) {
    return NextResponse.json(
      { results: [], error: '缺少必要参数: q 或 resourceId' },
      { status: 400 }
    );
  }

  const config = await getConfig();
  const apiSites = config.SourceConfig.filter((site) => !site.disabled);
  const targetSite = apiSites.find((site) => site.key === resourceId);

  if (!targetSite) {
    return NextResponse.json(
      { results: [], error: `未找到指定的视频源: ${resourceId}` },
      { status: 404 }
    );
  }

  try {
    let results = await searchFromApi(targetSite, query);
    if (!config.SiteConfig.DisableYellowFilter) {
      results = results.filter((result) => {
        const typeName = result.type_name || '';
        return !yellowWords.some((word: string) => typeName.includes(word));
      });
    }

    const cacheTime = await getCacheTime();
    return NextResponse.json(
      {
        results: normalizeSearchResults(results, query),
        source: { key: targetSite.key, name: targetSite.name },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        results: [],
        error: error instanceof Error ? error.message : '搜索失败',
      },
      { status: 500 }
    );
  }
}
