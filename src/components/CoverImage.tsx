import { useState, type ReactNode } from "react";
import { coverAngle, coverGradient } from "../lib/cover";

const loadedUrls = new Set<string>();
const missingUrls = new Set<string>();

type CoverImageProps = {
  seed: string;
  /** Photo candidates in priority order; the first one that exists is used. */
  photos?: string[];
  /** Large decorative text shown on the generated cover (hidden when a photo is used). */
  initials?: string;
  className?: string;
  children?: ReactNode;
};

export default function CoverImage({ seed, photos = [], initials, className = "h-36", children }: CoverImageProps) {
  const [, rerender] = useState(0);
  // Missing files are remembered, so each URL is requested at most once per page load.
  const url = photos.find((candidate) => !missingUrls.has(candidate));
  const loaded = Boolean(url && loadedUrls.has(url));
  const angle = coverAngle(seed);

  return (
    <div
      className={`relative overflow-hidden text-white ${className}`}
      style={{ backgroundImage: coverGradient(seed) }}
    >
      {!loaded && (
        <>
          <div
            aria-hidden
            className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10"
            style={{ transform: `rotate(${angle}deg)` }}
          />
          <div aria-hidden className="absolute right-12 -bottom-16 w-40 h-40 rounded-full bg-black/10" />
          <div aria-hidden className="absolute left-1/3 top-4 w-16 h-16 rounded-full bg-white/10" />
          {initials && (
            <span
              aria-hidden
              className="absolute right-5 bottom-1 text-7xl font-black tracking-tight text-white/25 select-none leading-none"
            >
              {initials}
            </span>
          )}
        </>
      )}
      {url && (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          onLoad={() => {
            loadedUrls.add(url);
            rerender((count) => count + 1);
          }}
          onError={() => {
            missingUrls.add(url);
            rerender((count) => count + 1);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {loaded && <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />}
      {children && <div className="relative h-full">{children}</div>}
    </div>
  );
}
