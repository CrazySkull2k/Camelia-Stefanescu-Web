"use client";

import { useEffect, useState } from "react";

const ABOUT_VIDEO_URL = "https://www.youtube-nocookie.com/embed/6LOu0Bi6tI8?autoplay=1&rel=0";

export function AboutVideoLightbox() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="about_video_icon">
        <button
          aria-label="Reda video despre Dr. Camelia Stefanescu"
          className="video_play_btn border-0"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          <i className="fa-duotone fa-play" />
        </button>
      </div>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-4 py-8"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Inchide video"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl leading-none text-[#31332c] shadow-lg"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
            <div className="aspect-video w-full">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
                referrerPolicy="strict-origin-when-cross-origin"
                src={ABOUT_VIDEO_URL}
                title="Video Dr. Camelia Stefanescu"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
