import { CmsPreviewBridge } from "@/components/site/cms-preview-bridge";
import { CookieConsentModal } from "@/components/site/cookie-consent-modal";
import { PublicFooter } from "@/components/site/public-footer";
import { PublicHeader } from "@/components/site/public-header";
import { PublicLegacyThemeAssets } from "@/components/site/public-legacy-theme-assets";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
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
