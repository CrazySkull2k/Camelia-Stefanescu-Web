import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { resolvePublicMediaUrl } from "@/lib/media";
import {
  getCmsCards,
  getCmsImage,
  getCmsList,
  getCmsSection,
  getCmsText,
} from "@/modules/cms/content-helpers";
import { shouldUseCmsDraftPreview, type CmsPreviewSearchParams } from "@/modules/cms/preview";
import { getEditablePageContent } from "@/modules/cms/service";

type StatItem = Record<string, unknown> & {
  label?: unknown;
  value?: unknown;
};

type CertificateItem = Record<string, unknown> & {
  image?: unknown;
  title?: unknown;
};

type FaqItem = Record<string, unknown> & {
  answer?: unknown;
  question?: unknown;
};

function getCardImage(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { alt: "", src: "" };
  }

  const image = value as { alt?: unknown; src?: unknown };
  return {
    alt: typeof image.alt === "string" ? image.alt : "",
    src: typeof image.src === "string" ? image.src : "",
  };
}

type AboutPageProps = {
  searchParams: Promise<CmsPreviewSearchParams>;
};

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const query = await searchParams;
  const content = await getEditablePageContent("about", {
    preview: shouldUseCmsDraftPreview(query, "about"),
  });
  const hero = getCmsSection(content, "hero");
  const intro = getCmsSection(content, "intro");
  const purpose = getCmsSection(content, "purpose");
  const credentials = getCmsList(intro, "credentials");
  const stats = getCmsCards<StatItem>(getCmsSection(content, "stats"), "items");
  const certificates = getCmsCards<CertificateItem>(
    getCmsSection(content, "certificates"),
    "items",
  );
  const faq = getCmsCards<FaqItem>(getCmsSection(content, "faq"), "items");
  const introImage = getCmsImage(intro, "image");

  return (
    <>
      <PageHero
        eyebrow={getCmsText(hero, "eyebrow") || undefined}
        title={getCmsText(hero, "title")}
        description={getCmsText(hero, "description") || undefined}
        trail={[
          { href: "/", label: "Acasa" },
          { label: "Despre mine" },
        ]}
      />

      <section className="about_section section_space_lg" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="row align-items-center justify-content-lg-between">
            <div className="col-lg-6 order-lg-last">
              <div className="image_widget">
                <Image
                  src={
                    resolvePublicMediaUrl(introImage.src) ??
                    "/site/theme/assets/images/about/about_image_1-min.jpg"
                  }
                  alt={introImage.alt || getCmsText(intro, "title")}
                  width={640}
                  height={720}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero_content_wrap">
                <h1 className="heading_text" style={{ lineHeight: "70px" }}>
                  {getCmsText(intro, "title")}
                </h1>
                <br />
                <ul className="info_list unordered_list_block mb-4">
                  {credentials.map((credential) => (
                    <li key={credential} style={{ lineHeight: "40px" }}>
                      <span className="info_icon">
                        <i className="fa-light fa-circle-check" />
                      </span>
                      <span className="info_text">{credential}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="service_details_section section_space_lg" style={{ paddingBottom: "3%" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="details_content text-center">
                <h2 className="details_item_title">{getCmsText(purpose, "title")}</h2>
                {getCmsList(purpose, "paragraphs").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="row justify-content-center text-center mb-5">
            {stats.map((stat) => (
              <div className="col-lg-3 col-md-4 col-sm-6" key={String(stat.label)}>
                <div className="counter_item">
                  <div className="counter_value mb-0">{String(stat.value ?? "")}</div>
                  <hr />
                  <p className="counter_description mb-0">{String(stat.label ?? "")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="row justify-content-center mb-5">
            {certificates.map((certificate, index) => {
              const image = getCardImage(certificate.image);
              const src = resolvePublicMediaUrl(image.src);

              return (
              <div className="col-lg-4 col-md-6" key={`${image.src}-${index}`}>
                <div className="image_widget mb-4">
                  <Image
                    src={src ?? "/site/about/certificate-1.jpg"}
                    alt={image.alt || String(certificate.title ?? `Certificare ${index + 1}`)}
                    width={480}
                    height={360}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              </div>
            );
            })}
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="details_content">
                <h3 className="details_info_title">Intrebari frecvente</h3>
                {faq.map((entry) => (
                  <div key={String(entry.question)}>
                    <h4 className="details_info_title">{String(entry.question ?? "")}</h4>
                    <p>{String(entry.answer ?? "")}</p>
                  </div>
                ))}
                <div className="btn_wrap pb-0 mt-4">
                  <Link className="btn btn-primary" href="/programare">
                    <span className="btn_text" data-text="Programare">
                      Programare
                    </span>
                    <span className="btn_icon">
                      <i className="fa-solid fa-arrow-up-right" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
