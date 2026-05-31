import { useState, useRef } from "react";

export function useDebounceSearch(onFlush?: () => void, delay = 400) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDebouncedSearch(value);
      onFlush?.();
    }, delay);
  }

  return { search, debouncedSearch, handleSearch };
}
