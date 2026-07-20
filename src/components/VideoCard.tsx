/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckCircle, Heart, Link, PlayCircleIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteFavorite,
  deletePlayRecord,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

import { ImagePlaceholder } from '@/components/ImagePlaceholder';

interface VideoCardProps {
  id?: string;
  source?: string;
  title?: string;
  query?: string;
  poster?: string;
  episodes?: number;
  source_name?: string;
  progress?: number;
  year?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  currentEpisode?: number;
  douban_id?: string;
  onDelete?: () => void;
  rate?: string;
  items?: SearchResult[];
  type?: string;
}

function getPosterReliabilityScore(posterUrl: string) {
  try {
    const { hostname, port } = new URL(posterUrl);
    if (hostname === 'www.imgzy360.com' && port === '7788') return -20;
    if (hostname === 'pic.lzzypic.com') return -10;
  } catch {
    return -30;
  }
  return 0;
}

export default function VideoCard({
  id,
  title = '',
  query = '',
  poster = '',
  episodes,
  source,
  source_name,
  progress = 0,
  year,
  from,
  currentEpisode,
  douban_id,
  onDelete,
  rate,
  items,
  type = '',
}: VideoCardProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [useOriginalImage, setUseOriginalImage] = useState(false);
  const [posterIndex, setPosterIndex] = useState(0);

  const isAggregate = from === 'search' && !!items?.length;

  const aggregateData = useMemo(() => {
    if (!isAggregate || !items) return null;
    const countMap = new Map<string | number, number>();
    const episodeCountMap = new Map<number, number>();
    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1);
      }
      const len = item.episodes?.length || 0;
      if (len > 0) {
        episodeCountMap.set(len, (episodeCountMap.get(len) || 0) + 1);
      }
    });

    const getMostFrequent = <T extends string | number>(
      map: Map<T, number>
    ) => {
      let maxCount = 0;
      let result: T | undefined;
      map.forEach((cnt, key) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          result = key;
        }
      });
      return result;
    };

    return {
      first: items[0],
      mostFrequentDoubanId: getMostFrequent(countMap),
      mostFrequentEpisodes: getMostFrequent(episodeCountMap) || 0,
      sourceCount: new Set(items.map((item) => `${item.source}-${item.id}`))
        .size,
      posterCandidates: Array.from(
        new Set(items.map((item) => item.poster).filter(Boolean))
      ).sort(
        (a, b) => getPosterReliabilityScore(b) - getPosterReliabilityScore(a)
      ),
    };
  }, [isAggregate, items]);

  const actualTitle = aggregateData?.first.title ?? title;
  const actualPoster = aggregateData?.first.poster ?? poster;
  const actualSource = aggregateData?.first.source ?? source;
  const actualId = aggregateData?.first.id ?? id;
  const actualDoubanId = String(
    aggregateData?.mostFrequentDoubanId ?? douban_id
  );
  const actualEpisodes = aggregateData?.mostFrequentEpisodes ?? episodes;
  const actualYear = aggregateData?.first.year ?? year;
  const actualSourceName = aggregateData?.first.source_name ?? source_name;
  const actualQuery = query || '';
  const actualSearchType = isAggregate
    ? aggregateData?.first.episodes?.length === 1
      ? 'movie'
      : 'tv'
    : type;
  const posterCandidates = useMemo(() => {
    if (aggregateData?.posterCandidates?.length) {
      return aggregateData.posterCandidates;
    }
    return actualPoster ? [actualPoster] : [];
  }, [actualPoster, aggregateData?.posterCandidates]);
  const currentPoster = posterCandidates[posterIndex] || actualPoster;
  const imageSrc =
    useOriginalImage || !currentPoster
      ? currentPoster
      : processImageUrl(currentPoster);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
    setUseOriginalImage(false);
    setPosterIndex(0);
  }, [posterCandidates]);

  // 获取收藏状态
  useEffect(() => {
    if (from === 'douban' || !actualSource || !actualId) return;

    const fetchFavoriteStatus = async () => {
      try {
        const fav = await isFavorited(actualSource, actualId);
        setFavorited(fav);
      } catch (err) {
        throw new Error('检查收藏状态失败');
      }
    };

    fetchFavoriteStatus();

    // 监听收藏状态更新事件
    const storageKey = generateStorageKey(actualSource, actualId);
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, any>) => {
        // 检查当前项目是否在新的收藏列表中
        const isNowFavorited = !!newFavorites[storageKey];
        setFavorited(isNowFavorited);
      }
    );

    return unsubscribe;
  }, [from, actualSource, actualId]);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (from === 'douban' || !actualSource || !actualId) return;
      try {
        if (favorited) {
          // 如果已收藏，删除收藏
          await deleteFavorite(actualSource, actualId);
          setFavorited(false);
        } else {
          // 如果未收藏，添加收藏
          await saveFavorite(actualSource, actualId, {
            title: actualTitle,
            source_name: source_name || '',
            year: actualYear || '',
            cover: actualPoster,
            total_episodes: actualEpisodes ?? 1,
            save_time: Date.now(),
          });
          setFavorited(true);
        }
      } catch (err) {
        throw new Error('切换收藏状态失败');
      }
    },
    [
      from,
      actualSource,
      actualId,
      actualTitle,
      source_name,
      actualYear,
      actualPoster,
      actualEpisodes,
      favorited,
    ]
  );

  const handleDeleteRecord = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (from !== 'playrecord' || !actualSource || !actualId) return;
      try {
        await deletePlayRecord(actualSource, actualId);
        onDelete?.();
      } catch (err) {
        throw new Error('删除播放记录失败');
      }
    },
    [from, actualSource, actualId, onDelete]
  );

  const handleClick = useCallback(() => {
    const playParams = new URLSearchParams();

    if (from === 'douban') {
      playParams.set('title', actualTitle.trim());
      if (actualYear) playParams.set('year', actualYear);
      if (actualSearchType) playParams.set('stype', actualSearchType);
      router.push(`/play?${playParams.toString()}`);
    } else if (actualSource && actualId) {
      playParams.set('source', actualSource);
      playParams.set('id', actualId);
      playParams.set('title', actualTitle);
      if (actualYear) playParams.set('year', actualYear);
      if (actualQuery) playParams.set('stitle', actualQuery.trim());
      if (actualSearchType) playParams.set('stype', actualSearchType);
      router.push(`/play?${playParams.toString()}`);
    }
  }, [
    from,
    actualSource,
    actualId,
    router,
    actualTitle,
    actualYear,
    actualQuery,
    actualSearchType,
  ]);

  const config = useMemo(() => {
    const configs = {
      playrecord: {
        showSourceName: true,
        showProgress: true,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: true,
        showDoubanLink: false,
        showRating: false,
      },
      favorite: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: false,
        showDoubanLink: false,
        showRating: false,
      },
      search: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: !isAggregate,
        showCheckCircle: false,
        showDoubanLink: !!actualDoubanId,
        showRating: false,
      },
      douban: {
        showSourceName: false,
        showProgress: false,
        showPlayButton: true,
        showHeart: false,
        showCheckCircle: false,
        showDoubanLink: true,
        showRating: !!rate,
      },
    };
    return configs[from] || configs.search;
  }, [from, isAggregate, actualDoubanId, rate]);

  const typeLabel =
    actualSearchType === 'tv'
      ? '剧集'
      : actualSearchType === 'movie'
      ? '电影'
      : actualEpisodes && actualEpisodes > 1
      ? '剧集'
      : '电影';

  const detailBadges = useMemo(() => {
    const badges: string[] = [];
    if (actualYear && actualYear !== 'unknown') badges.push(actualYear);
    badges.push(typeLabel);
    if (actualEpisodes && actualEpisodes > 1) {
      badges.push(`${actualEpisodes}集`);
    }
    if (isAggregate && aggregateData?.sourceCount) {
      badges.push(`${aggregateData.sourceCount}源`);
    }
    return badges;
  }, [
    actualEpisodes,
    actualYear,
    aggregateData?.sourceCount,
    isAggregate,
    typeLabel,
  ]);

  return (
    <div
      className='group relative w-full rounded-lg bg-transparent cursor-pointer transition-all duration-500 ease-in-out hover:scale-[1.03] hover:z-[500] hover:drop-shadow-[0_0_12px_rgba(82,99,255,0.4)]'
      onClick={handleClick}
    >
      {/* 海报容器 */}
      <div className='relative aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-gray-200/50 dark:ring-white/5 group-hover:ring-neon/40 dark:group-hover:ring-neon/50 transition-all duration-500'>
        {/* 骨架屏 */}
        {(!imageLoaded || imageFailed) && (
          <ImagePlaceholder aspectRatio='aspect-[2/3]' failed={imageFailed} />
        )}
        {/* 图片 */}
        {imageSrc && !imageFailed && (
          <Image
            src={imageSrc}
            alt={actualTitle}
            fill
            className='object-cover'
            referrerPolicy='no-referrer'
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (!useOriginalImage && currentPoster) {
                setUseOriginalImage(true);
                return;
              }
              if (posterIndex < posterCandidates.length - 1) {
                setPosterIndex((prev) => prev + 1);
                setUseOriginalImage(false);
                setImageLoaded(false);
                return;
              }
              setImageFailed(true);
            }}
          />
        )}

        {/* 悬浮遮罩 */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100' />

        {/* 播放按钮 */}
        {config.showPlayButton && (
          <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 ease-in-out delay-75 group-hover:opacity-100 group-hover:scale-100'>
            <PlayCircleIcon
              size={50}
              strokeWidth={0.8}
              className='text-white fill-transparent transition-all duration-300 ease-out hover:fill-neon hover:scale-[1.1]'
            />
          </div>
        )}

        {/* 操作按钮 */}
        {(config.showHeart || config.showCheckCircle) && (
          <div className='absolute bottom-3 right-3 flex gap-3 opacity-0 translate-y-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-y-0'>
            {config.showCheckCircle && (
              <CheckCircle
                onClick={handleDeleteRecord}
                size={20}
                className='text-white transition-all duration-300 ease-out hover:stroke-neon hover:scale-[1.1]'
              />
            )}
            {config.showHeart && (
              <Heart
                onClick={handleToggleFavorite}
                size={20}
                className={`transition-all duration-300 ease-out ${
                  favorited
                    ? 'fill-red-600 stroke-red-600'
                    : 'fill-transparent stroke-white hover:stroke-red-400'
                } hover:scale-[1.1]`}
              />
            )}
          </div>
        )}

        {/* 徽章 */}
        {config.showRating && rate && (
          <div className='absolute top-2 right-2 bg-neon text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(82,99,255,0.5)] transition-all duration-300 ease-out group-hover:scale-110'>
            {rate}
          </div>
        )}

        {actualEpisodes && actualEpisodes > 1 && (
          <div className='absolute top-2 right-2 bg-neon/90 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-[0_0_8px_rgba(82,99,255,0.4)] transition-all duration-300 ease-out group-hover:scale-110'>
            {currentEpisode
              ? `${currentEpisode}/${actualEpisodes}`
              : actualEpisodes}
          </div>
        )}

        {/* 豆瓣链接 */}
        {config.showDoubanLink && actualDoubanId && (
          <a
            href={`https://movie.douban.com/subject/${actualDoubanId}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='absolute top-2 left-2 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out delay-100 group-hover:opacity-100 group-hover:translate-x-0'
          >
            <div className='bg-neon text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(82,99,255,0.4)] hover:bg-neon-light hover:scale-[1.1] transition-all duration-300 ease-out'>
              <Link size={16} />
            </div>
          </a>
        )}
      </div>

      {/* 进度条 */}
      {config.showProgress && progress !== undefined && (
        <div className='mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
          <div
            className='h-full bg-neon transition-all duration-500 ease-out'
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 标题与来源 */}
      <div className='mt-2 text-center'>
        <div className='relative'>
          <span className='block text-sm font-semibold truncate text-gray-800 dark:text-gray-100 transition-colors duration-300 ease-in-out group-hover:text-cyan peer'>
            {actualTitle}
          </span>
          {/* 自定义 tooltip */}
          <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 ease-out delay-100 whitespace-nowrap pointer-events-none'>
            {actualTitle}
            <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800'></div>
          </div>
        </div>
        {from === 'search' && detailBadges.length > 0 && (
          <div className='mt-1 flex flex-wrap items-center justify-center gap-1 text-[11px] leading-4 text-gray-500 dark:text-gray-400'>
            {detailBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        )}
        {config.showSourceName && actualSourceName && (
          <span className='block text-xs text-gray-500 dark:text-gray-400 mt-1'>
            <span className='inline-block border rounded px-2 py-0.5 border-gray-300 dark:border-gray-600/60 transition-all duration-300 ease-in-out group-hover:border-neon/60 group-hover:text-cyan'>
              {actualSourceName}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
