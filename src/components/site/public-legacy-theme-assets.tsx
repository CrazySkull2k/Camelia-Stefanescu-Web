/* eslint-disable @next/next/no-css-tags */
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
  const shouldLoadLegacyTheme = !exactDesignRoutes.has(pathname);

  if (!shouldLoadLegacyTheme) {
    return null;
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
