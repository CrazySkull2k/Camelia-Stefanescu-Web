import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { resolvePublicMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils/dates";
import type { BlogPost } from "@/modules/blog/types";

import styles from "./blog-index.module.css";

type BlogIndexProps = {
  posts: BlogPost[];
  search?: string;
};

const DEFAULT_BLOG_COVER = "/site/theme/assets/images/blogs/blog_image_1-min.jpg";

export function BlogIndex({ posts, search }: BlogIndexProps) {
  return (
    <>
      <PageHero
        title="Blog"
        trail={[
          { href: "/", label: "Acasa" },
          { label: "Blog" },
        ]}
      />

      <section className={`blog_section section_space_lg ${styles.blogIndex}`}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className={`row ${styles.cardsGrid}`}>
                {posts.length ? (
                  posts.map((post) => {
                    const image = resolvePublicMediaUrl(post.image) ?? DEFAULT_BLOG_COVER;

                    return (
                      <div className={`col-md-6 ${styles.cardColumn}`} key={post.id}>
                        <div className={`blog_item ${styles.card}`}>
                          <div className="blog_image">
                            <Link
                              className={`blog_image_wrap ${styles.imageWrap}`}
                              href={`/blog/${post.slug}`}
                            >
                              <Image
                                src={image}
                                alt={post.title}
                                className={styles.cardImage}
                                width={520}
                                height={360}
                              />
                            </Link>
                          </div>
                          <div className={`blog_content ${styles.cardContent}`}>
                            <h3 className="item_title">
                              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                            </h3>
                            <p className={styles.excerpt}>{post.excerpt ?? ""}</p>
                            <Link className="btn-link" href={`/blog/${post.slug}`}>
                              <span className="btn_text">Citeste mai mult</span>
                              <span className="btn_icon">
                                <i className="fa-solid fa-arrow-up-right" />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>Nu s-au gasit articole pentru filtrul selectat.</p>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <aside className="sidebar ps-lg-4">
                <form action="/blog" method="get" className="form-group">
                  <input
                    id="sidebar_search"
                    className="form-control"
                    type="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Cauta..."
                  />
                  <button type="submit" className="input_icon">
                    <i className="fa-regular fa-magnifying-glass" />
                  </button>
                </form>

                <div className="sidebar_widget">
                  <h3 className="sidebar_widget_title">
                    <span className="title_icon">
                      <Image
                        src="/site/theme/assets/images/site_logo/favourite_icon.svg"
                        alt=""
                        width={16}
                        height={16}
                      />
                    </span>
                    <span className="title_text">Articole recente</span>
                  </h3>
                  <ul className="reecommended_post_group unordered_list_block">
                    {posts.slice(0, 3).map((post) => {
                      const image = resolvePublicMediaUrl(post.image) ?? DEFAULT_BLOG_COVER;

                      return (
                        <li key={post.id}>
                          <div className={`blog_item_small ${styles.smallCard}`}>
                            <div className={`blog_image ${styles.smallImageShell}`}>
                              <Link
                                className={`blog_image_wrap ${styles.smallImageWrap}`}
                                href={`/blog/${post.slug}`}
                              >
                                <Image
                                  src={image}
                                  alt={post.title}
                                  className={styles.smallImage}
                                  width={110}
                                  height={86}
                                />
                              </Link>
                            </div>
                            <div className="blog_content">
                              <h3 className="item_title">
                                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                              </h3>
                              <ul className="post_meta unordered_list">
                                <li>{formatDate(post.createdAt)}</li>
                              </ul>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
