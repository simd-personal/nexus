'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Two animated "fill" bars racing: a human reading the pile vs Sunny.
 * Restarts whenever it scrolls into view.
 */
export function SpeedShowcase() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRun(false);
            requestAnimationFrame(() => setRun(true));
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="spd-wrap">
      <div className="spd-row">
        <div className="spd-meta">
          <span className="spd-name">Reading it yourself</span>
          <span className="spd-time spd-time-slow">~3 hours</span>
        </div>
        <div className="spd-bar">
          <div className={`spd-fill spd-fill-slow ${run ? 'spd-go' : ''}`} />
        </div>
      </div>

      <div className="spd-row">
        <div className="spd-meta">
          <span className="spd-name spd-name-hot">With Sunny</span>
          <span className="spd-time spd-time-fast">~20 seconds</span>
        </div>
        <div className="spd-bar">
          <div className={`spd-fill spd-fill-fast ${run ? 'spd-go' : ''}`} />
        </div>
      </div>
    </div>
  );
}
