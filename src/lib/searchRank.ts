import { SearchResult } from './types';

const NOISE_WORDS = [
  '解说',
  '讲解',
  '预告',
  '预告片',
  '花絮',
  '片段',
  '混剪',
  '速看',
  '一口气',
  '看完',
  '看剧',
  '剧情',
  '彩蛋',
  '幕后',
  '先导',
  '短剧',
  '小剧场',
  'reaction',
  'trailer',
];

const PUNCTUATION_PATTERN =
  /[\s·・.。,:：;；!！?？'"“”‘’`~、/\\|()[\]{}<>《》【】「」『』_-]+/g;

export function normalizeSearchText(value = '') {
  return value.toLowerCase().replace(PUNCTUATION_PATTERN, '');
}

function parseYear(year?: string) {
  const parsed = Number.parseInt(year || '', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function containsNoiseWord(value: string) {
  const normalized = normalizeSearchText(value);
  return NOISE_WORDS.some((word) => normalized.includes(word));
}

function userIsSearchingNoise(query: string) {
  return containsNoiseWord(query);
}

function getNoisePenalty(item: SearchResult, query: string) {
  if (userIsSearchingNoise(query)) return 0;

  const title = item.title || '';
  const typeName = item.type_name || '';
  const className = item.class || '';
  let penalty = 0;

  if (containsNoiseWord(title)) penalty += 60;
  if (containsNoiseWord(typeName)) penalty += 40;
  if (containsNoiseWord(className)) penalty += 30;

  return penalty;
}

export function getSearchResultScore(item: SearchResult, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(item.title);

  if (!normalizedQuery || !normalizedTitle) return 0;

  let score = 0;

  if (normalizedTitle === normalizedQuery) {
    score += 220;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 150;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 105;
  } else {
    const queryChars = Array.from(new Set(normalizedQuery.split('')));
    const matchedChars = queryChars.filter((char) =>
      normalizedTitle.includes(char)
    ).length;
    score += (matchedChars / Math.max(queryChars.length, 1)) * 45;
  }

  const extraTitleLength = Math.max(
    normalizedTitle.length - normalizedQuery.length,
    0
  );
  score -= Math.min(extraTitleLength * 2, 55);

  score -= getNoisePenalty(item, query);

  if (item.episodes?.length > 0) score += 12;
  if (item.year && item.year !== 'unknown') score += 8;
  if (item.douban_id) score += 6;

  return score;
}

export function isLowQualitySearchResult(item: SearchResult, query: string) {
  if (userIsSearchingNoise(query)) return false;

  const hasNoise =
    containsNoiseWord(item.title) ||
    containsNoiseWord(item.type_name || '') ||
    containsNoiseWord(item.class || '');

  return hasNoise && getSearchResultScore(item, query) < 90;
}

export function filterLowQualitySearchResults(
  results: SearchResult[],
  query: string
) {
  const hasStrongCleanResult = results.some(
    (item) =>
      !isLowQualitySearchResult(item, query) &&
      getSearchResultScore(item, query) >= 115
  );

  if (!hasStrongCleanResult) return results;

  return results.filter((item) => !isLowQualitySearchResult(item, query));
}

export function sortSearchResults(results: SearchResult[], query: string) {
  return [...results].sort((a, b) => {
    const scoreDelta =
      getSearchResultScore(b, query) - getSearchResultScore(a, query);
    if (scoreDelta !== 0) return scoreDelta;

    const yearDelta = parseYear(b.year) - parseYear(a.year);
    if (yearDelta !== 0) return yearDelta;

    return `${a.title}-${a.source_name}`.localeCompare(
      `${b.title}-${b.source_name}`,
      'zh-CN'
    );
  });
}

export function normalizeSearchResults(results: SearchResult[], query: string) {
  return sortSearchResults(
    filterLowQualitySearchResults(results, query),
    query
  );
}
