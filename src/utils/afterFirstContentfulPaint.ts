type Cleanup = () => void;

/**
 * Run work just after the browser reports its first contentful paint.
 *
 * PerformancePaintTiming is supported by the browsers where the distinction
 * matters most. The double-rAF fallback still preserves a paint opportunity
 * in browsers that do not expose paint timing entries.
 */
export function afterFirstContentfulPaint(callback: () => void): Cleanup {
  let cancelled = false;
  let firstFrame: number | null = null;
  let secondFrame: number | null = null;
  let observer: PerformanceObserver | null = null;

  const runAfterFrame = () => {
    if (cancelled || firstFrame !== null) return;

    firstFrame = window.requestAnimationFrame(() => {
      firstFrame = null;
      if (!cancelled) callback();
    });
  };

  const runAfterTwoFrames = () => {
    if (cancelled || firstFrame !== null) return;

    firstFrame = window.requestAnimationFrame(() => {
      firstFrame = null;
      secondFrame = window.requestAnimationFrame(() => {
        secondFrame = null;
        if (!cancelled) callback();
      });
    });
  };

  const alreadyPainted = window.performance
    .getEntriesByType("paint")
    .some((entry) => entry.name === "first-contentful-paint");

  if (alreadyPainted) {
    runAfterFrame();
  } else if ("PerformanceObserver" in window) {
    observer = new PerformanceObserver((list) => {
      const didPaint = list
        .getEntries()
        .some((entry) => entry.name === "first-contentful-paint");
      if (!didPaint) return;

      observer?.disconnect();
      observer = null;
      runAfterFrame();
    });

    try {
      observer.observe({ type: "paint", buffered: true });
    } catch {
      observer.disconnect();
      observer = null;
      runAfterTwoFrames();
    }
  } else {
    runAfterTwoFrames();
  }

  return () => {
    cancelled = true;
    observer?.disconnect();
    if (firstFrame !== null) window.cancelAnimationFrame(firstFrame);
    if (secondFrame !== null) window.cancelAnimationFrame(secondFrame);
  };
}
