import { connection } from "next/server";

import { CmsPreviewBridge } from "@/components/site/cms-preview-bridge";
import { CookieConsentModal } from "@/components/site/cookie-consent-modal";
import { PublicFooter } from "@/components/site/public-footer";
import { PublicHeader } from "@/components/site/public-header";
import { PublicLegacyThemeAssets } from "@/components/site/public-legacy-theme-assets";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <>
      <PublicLegacyThemeAssets />

      <div className="page_wrapper public-page-wrapper">
        <div className="public-content-shell">
          <PublicHeader />
          <main className="page_content">{children}</main>
          <PublicFooter />
          <CmsPreviewBridge />
        </div>
        <CookieConsentModal />
      </div>
    </>
  );
}
