"use client";

import React from "react";

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number
) {
  const callbackRef = React.useRef(callback);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = React.useRef<TArgs | null>(null);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const flush = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!pendingArgsRef.current) {
      return;
    }

    const args = pendingArgsRef.current;
    pendingArgsRef.current = null;
    callbackRef.current(...args);
  }, []);

  React.useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const debounced = React.useCallback(
    (...args: TArgs) => {
      pendingArgsRef.current = args;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        pendingArgsRef.current = null;
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );

  return { debounced, flush };
}
