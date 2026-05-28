"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedStatValueProps = {
  value: number;
  suffix: string;
  className: string;
  suffixClassName: string;
  duration?: number;
};

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function AnimatedStatValue({
  value,
  suffix,
  className,
  suffixClassName,
  duration = 1300,
}: AnimatedStatValueProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const node = nodeRef.current;

    if (!node) {
      return;
    }

    function startAnimation() {
      if (hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;

      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setDisplayValue(value);
        return;
      }

      const startTime = performance.now();

      function tick(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        setDisplayValue(Math.round(value * easeOutCubic(progress)));

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    }

    if (typeof IntersectionObserver === "undefined") {
      animationFrameRef.current = window.requestAnimationFrame(startAnimation);

      return () => {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.35,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [duration, value]);

  return (
    <div ref={nodeRef} className={className} aria-label={`${value}${suffix}`}>
      <span>{displayValue}</span>
      <span className={suffixClassName}>{suffix}</span>
    </div>
  );
}
