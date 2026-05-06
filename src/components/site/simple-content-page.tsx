import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";

type ContentSection = {
  title: string;
  body?: string;
  bullets?: string[];
};

type SimpleContentPageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  trail: Array<{ href?: string; label: string }>;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
  sections?: ContentSection[];
  image?: string;
  imageAlt?: string;
  conclusion?: string;
  cta?: {
    title: string;
    body: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  };
};

export function SimpleContentPage({
  eyebrow,
  title,
  description,
  trail,
  intro,
  paragraphs,
  bullets,
  sections,
  image,
  imageAlt,
  conclusion,
  cta,
}: SimpleContentPageProps) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        trail={trail}
      />

      <section className="service_details_section section_space_lg">
        <div className="container">
          <div className="row align-items-center justify-content-lg-between">
            {image ? (
              <div className="col-lg-5 order-lg-last">
                <div className="image_widget">
                  <Image
                    src={image}
                    alt={imageAlt ?? title}
                    className="h-auto w-full"
                    width={640}
                    height={720}
                  />
                </div>
              </div>
            ) : null}

            <div className={image ? "col-lg-7" : "col-lg-8 mx-auto"}>
              <div className="details_content">
                {intro ? <p>{intro}</p> : null}
                {paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {bullets?.length ? (
                  <ul className="info_list unordered_list_block mb-4">
                    {bullets.map((bullet) => (
                      <li key={bullet}>
                        <span className="info_icon">
                          <i className="fa-light fa-circle-check" />
                        </span>
                        <span className="info_text">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {sections?.map((section) => (
                  <div key={section.title}>
                    <h3 className="details_info_title">{section.title}</h3>
                    {section.body ? <p>{section.body}</p> : null}
                    {section.bullets?.length ? (
                      <ul className="info_list unordered_list_block mb-4">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>
                            <span className="info_icon">
                              <i className="fa-light fa-circle-check" />
                            </span>
                            <span className="info_text">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}

                {conclusion ? <p>{conclusion}</p> : null}

                {cta ? (
                  <div className="btn_wrap pb-0 mt-4">
                    <Link className="btn btn-primary" href={cta.primaryHref}>
                      <span className="btn_text" data-text={cta.primaryLabel}>
                        {cta.primaryLabel}
                      </span>
                      <span className="btn_icon">
                        <i className="fa-solid fa-arrow-up-right" />
                      </span>
                    </Link>
                    {cta.secondaryHref && cta.secondaryLabel ? (
                      <Link className="btn btn-outline-secondary ms-3" href={cta.secondaryHref}>
                        <span className="btn_text" data-text={cta.secondaryLabel}>
                          {cta.secondaryLabel}
                        </span>
                        <span className="btn_icon">
                          <i className="fa-solid fa-arrow-up-right" />
                        </span>
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
