import Link from "next/link";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  trail?: Array<{
    href?: string;
    label: string;
  }>;
  align?: "left" | "center";
};

export function PageHero({
  eyebrow,
  title,
  description,
  trail,
  align = "left",
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section className="page_banner decoration_wrapper">
      <div className="container">
        <div
          className={`row align-items-center${
            centered ? " justify-content-center text-center" : ""
          }`}
        >
          <div className={centered ? "col-lg-10" : "col-lg-6"}>
            {eyebrow ? (
              <p className="section_heading_description mb-2">{eyebrow}</p>
            ) : null}
            <h1 className="page_title mb-0">{title}</h1>
            {description ? <p className="mt-3 mb-0">{description}</p> : null}
          </div>
          {trail?.length ? (
            <div className={centered ? "col-lg-10 mt-4" : "col-lg-6"}>
              <ul
                className={`breadcrumb_nav unordered_list ${
                  centered
                    ? "justify-content-center"
                    : "justify-content-lg-end justify-content-center"
                }`}
              >
                {trail.map((item, index) => (
                  <li key={`${item.label}-${index}`}>
                    {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
