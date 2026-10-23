"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Props = {
  text: string;
};

export default function MobileMarqueeText({
  text,
}: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLSpanElement>(null);

  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const parent = viewport.current;
    const child = content.current;

    if (!parent || !child) return;

    function measure() {
      const currentParent = viewport.current;
      const currentChild = content.current;

      if (!currentParent || !currentChild) {
        return;
      }

      const next = Math.max(
        0,
        currentChild.scrollWidth -
          currentParent.clientWidth,
      );

      setOverflow((previous) =>
        previous === next ? previous : next,
      );
    }

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(parent);
    observer.observe(child);

    return () => {
      observer.disconnect();
    };
  }, [text]);

  const duration =
    Math.min(
      13,
      Math.max(6, overflow / 18 + 5),
    ) / 1.03;

  const style = {
    "--frostiq-marquee-offset": `-${overflow}px`,
    animationDuration: `${duration}s`,
  } as CSSProperties;

  return (
    <div
      ref={viewport}
      className="min-w-0 w-full overflow-hidden"
      title={text}
    >
      <style>{`
        @keyframes frostiq-episode-marquee {
          0%, 16% {
            transform: translateX(0);
          }

          84%, 100% {
            transform: translateX(
              var(--frostiq-marquee-offset)
            );
          }
        }

        .frostiq-marquee {
          animation-name: frostiq-episode-marquee;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .frostiq-marquee {
            animation: none !important;
          }
        }
      `}</style>

      <span
        ref={content}
        style={style}
        className={`inline-block max-w-none whitespace-nowrap text-[13px] font-semibold leading-5 text-white ${
          overflow > 0
            ? "frostiq-marquee"
            : ""
        }`}
      >
        {text}
      </span>
    </div>
  );
}