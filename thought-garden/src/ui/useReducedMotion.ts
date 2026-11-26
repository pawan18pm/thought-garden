import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// One shared AccessibilityInfo subscription for the whole app (every animated
// button reads this), instead of one native listener + query per component.
let current = false;
let started = false;
const listeners = new Set<() => void>();

function publish(v: boolean) {
  if (v === current) return;
  current = v;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  try {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(publish)
      .catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', publish);
  } catch {
    // no accessibility module (tests, web): assume motion is fine
  }
}

function subscribe(l: () => void) {
  start();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const read = () => current;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, read);
}

/** Kick off the first query early (root layout) so the first screen already knows. */
export function primeReducedMotion(): void {
  start();
}
