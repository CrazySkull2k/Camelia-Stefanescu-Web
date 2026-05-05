/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";

import { resolvePublicMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils/dates";
import type { BlogPost } from "@/modules/blog/types";

import styles from "./blog-post.module.css";

type BlogPostViewProps = {
  post: BlogPost;
};

const DEFAULT_BLOG_COVER = "/site/theme/assets/images/blogs/blog_image_1-min.jpg";
const AUTHOR_IMAGE = "/site/about/doctor.jpg";

function splitTitle(title: string) {
  const [first, ...rest] = title.split(":");

  if (!rest.length) {
    return { accent: "", main: title };
  }

  return {
    accent: rest.join(":").trim(),
    main: `${first.trim()}:`,
  };
}

function getImage(post: BlogPost) {
  return resolvePublicMediaUrl(post.image) ?? DEFAULT_BLOG_COVER;
}

function FillImage({
  alt,
  className = "",
  priority,
  sizes,
  src,
}: {
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
  src: string;
}) {
  if (/^https?:\/\//i.test(src) && !src.includes("/storage/v1/object/public/")) {
    return (
      <img
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        src={src}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={`object-cover ${className}`}
      fill
      priority={priority}
      sizes={sizes}
      src={src}
    />
  );
}

export function BlogPostView({ post }: BlogPostViewProps) {
  const image = getImage(post);
  const { accent, main } = splitTitle(post.title);
  const eyebrow = post.categoryName
    ? `Insights - ${post.categoryName}`
    : "Insights - Editorial medical";

  return (
    <main className={styles.article}>
      <article className="mx-auto max-w-5xl px-5 pb-24 pt-20 sm:px-8 lg:pt-24">
        <header className="mb-14 text-center sm:mb-16">
          <div className={`${styles.label} mb-6 text-[#735a42]`}>{eyebrow}</div>
          <h1 className="mx-auto max-w-5xl font-serif text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-[#31332c] sm:text-6xl lg:text-7xl">
            {main}
            {accent ? (
              <>
                {" "}
                <span className="italic">{accent}</span>
              </>
            ) : null}
          </h1>
        </header>

        <div className="relative mb-16 aspect-[16/9] overflow-hidden rounded-[2rem] bg-[#efeee6] shadow-[0px_22px_70px_rgba(49,51,44,0.10)] sm:mb-20">
          <FillImage
            alt={post.title}
            priority
            sizes="(min-width: 1024px) 896px, 100vw"
            src={image}
          />
        </div>

        {post.tags?.length ? (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {post.tags.map((tag) => (
              <span
                className="rounded-full bg-[#f9f3ea] px-4 py-2 text-xs font-bold text-[#5f5b55]"
                key={tag.slug}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}

        {post.excerpt ? (
          <p className="mx-auto mb-12 max-w-3xl text-center text-xl leading-9 text-[#31332c]">
            {post.excerpt}
          </p>
        ) : null}

        <div
          className={`${styles.body} mx-auto max-w-3xl`}
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <div className="mx-auto mt-16 max-w-3xl border-t border-[#b1b3a9]/25 pt-6">
          <p className={`${styles.label} text-[#797c73]`}>
            Publicat pe {formatDate(post.createdAt)}
          </p>
        </div>

        <section className="mt-16 border-t border-[#b1b3a9]/25 pt-16 sm:pt-20">
          <div className="flex flex-col items-center gap-10 rounded-[3rem] bg-[#f5f4ed] p-8 shadow-[0px_18px_52px_rgba(49,51,44,0.06)] sm:p-12 md:flex-row md:items-center md:gap-12">
            <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-48 sm:w-48">
              <Image
                alt="Dr. Camelia Stefanescu"
                className="object-cover"
                fill
                sizes="192px"
                src={AUTHOR_IMAGE}
              />
            </div>
            <div className="text-center md:text-left">
              <span className={`${styles.label} text-[#735a42]`}>
                Autor si consultant
              </span>
              <h2 className="mt-2 font-serif text-4xl leading-none text-[#31332c]">
                Dr. Camelia Stefanescu
              </h2>
              <p className="mt-5 max-w-2xl text-base italic leading-8 text-[#5e6058]">
                Cu experienta in nutritie clinica, diagnoza celulara si terapii
                complementare, Dr. Stefanescu imbina rigoarea medicala cu o abordare
                calda, orientata catre recomandari personalizate si sustenabile.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  className={`${styles.label} rounded-full bg-[#31332c] px-7 py-3 !text-[#fff7f3] shadow-[0px_12px_28px_rgba(49,51,44,0.18)] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3]`}
                  href="/about"
                >
                  Vezi profilul
                </Link>
                <Link
                  className={`${styles.label} rounded-full border border-[#797c73]/45 px-7 py-3 !text-[#31332c] transition hover:bg-[#e8e9e0] hover:!text-[#31332c]`}
                  href="/contact"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
