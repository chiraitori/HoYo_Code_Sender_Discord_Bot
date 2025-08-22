import { useEffect, useLayoutEffect } from 'react';

// Use useLayoutEffect on client, useEffect on server to prevent hydration mismatch
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
