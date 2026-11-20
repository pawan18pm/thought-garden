import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Module-level cache so a freshly mounted component doesn't start with a wrong `false`.
let cached = false;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(cached);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        cached = v;
        if (alive) setReduced(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      cached = v;
      setReduced(v);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
