'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

interface SuggestionItem {
  text: string;
  type: 'related';
  icon?: React.ReactNode;
}

export default function SearchSuggestions({
  query,
  isVisible,
  onSelect,
  onClose,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖定时器
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 用于中止旧请求
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestionsFromAPI = useCallback(async (searchQuery: string) => {
    // 每次请求前取消上一次的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`,
        {
          signal: controller.signal,
        }
      );
      if (response.ok) {
        const data = await response.json();
        const apiSuggestions = data.suggestions.map(
          (item: { text: string }) => ({
            text: item.text,
            type: 'related' as const,
          })
        );
        setSuggestions(apiSuggestions);
        setSelectedIndex(-1);
      }
    } catch (err: unknown) {
      // 类型保护判断 err 是否是 Error 类型
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          // 不是取消请求导致的错误才清空
          setSuggestions([]);
          setSelectedIndex(-1);
        }
      } else {
        // 如果 err 不是 Error 类型，也清空提示
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    }
  }, []);

  // 防抖触发
  const debouncedFetchSuggestions = useCallback(
    (searchQuery: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        if (searchQuery.trim() && isVisible) {
          fetchSuggestionsFromAPI(searchQuery);
        } else {
          setSuggestions([]);
          setSelectedIndex(-1);
        }
      }, 300); //300ms
    },
    [isVisible, fetchSuggestionsFromAPI]
  );

  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }
    debouncedFetchSuggestions(query);

    // 清理定时器
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, isVisible, debouncedFetchSuggestions]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelect(suggestions[selectedIndex].text);
          } else {
            onSelect(query);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, query, suggestions, selectedIndex, onSelect, onClose]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className='absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto'
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`related-${suggestion.text}`}
          onClick={() => onSelect(suggestion.text)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3 ${
            selectedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <span className='flex-1 text-sm text-gray-700 dark:text-gray-300 truncate'>
            {suggestion.text}
          </span>
        </button>
      ))}
    </div>
  );
}
