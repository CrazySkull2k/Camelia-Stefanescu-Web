/* eslint-disable @next/next/no-css-tags, @next/next/no-page-custom-font */
"use client";

import { usePathname } from "next/navigation";

const exactDesignRoutes = new Set([
  "/",
  "/serviciinutritie",
  "/stopdieta",
  "/detox",
  "/diagnozacel",
  "/terapie-shockwave/ce-este-terapia-shockwave",
  "/terapie-shockwave/ce-putem-trata",
  "/terapie-shockwave/mod-tratament",
]);

export function PublicLegacyThemeAssets() {
  const pathname = usePathname();
  const isExactDesignRoute = exactDesignRoutes.has(pathname);

  if (isExactDesignRoute) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="/site/theme/assets/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/fontawesome.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/animate.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/slick.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/slick-theme.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/magnific-popup.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/odometer.min.css" />
      <link rel="stylesheet" href="/site/theme/assets/css/style.css" />

      <div className="backtotop">
        <a href="#" className="scroll" aria-label="Inapoi sus">
          <i className="fa-solid fa-arrow-up" />
        </a>
      </div>
    </>
  );
}
