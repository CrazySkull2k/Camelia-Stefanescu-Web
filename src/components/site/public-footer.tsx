import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Facebook, Instagram } from "lucide-react";

import styles from "./public-footer.module.css";

const footerLinks = [
  { href: "/", label: "Acasa" },
  { href: "/serviciinutritie", label: "Servicii Nutritie" },
  { href: "/terapie-shockwave", label: "Terapie Shockwave" },
  { href: "/preturi", label: "Preturi" },
  { href: "/about", label: "Despre Mine" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/termeni", label: "Termeni" },
];

function TikTokIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M14.6 3.2v9.85a4.82 4.82 0 1 1-4.82-4.82c.34 0 .68.04 1 .11v3.3a1.74 1.74 0 1 0 .54 1.26V3.2h3.28Zm0 0c.37 2.34 1.94 4.18 4.2 4.83v3.1c-1.55-.05-3.04-.53-4.2-1.36"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

const socialLinks = [
  {
    href: "https://www.tiktok.com/",
    icon: TikTokIcon,
    label: "Urmareste-ne pe TikTok",
    title: "TikTok",
  },
  {
    href: "https://www.instagram.com/",
    icon: Instagram,
    label: "Urmareste-ne pe Instagram",
    title: "Instagram",
  },
  {
    href: "https://www.facebook.com/",
    icon: Facebook,
    label: "Urmareste-ne pe Facebook",
    title: "Facebook",
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div aria-hidden="true" className={styles.glowOne} />
      <div aria-hidden="true" className={styles.glowTwo} />

      <div className={styles.shell}>
        <div className={styles.introGrid}>
          <section className={styles.brandPanel} aria-labelledby="footer-title">
            <p className={styles.eyebrow}>Medicina. Nutritie. Echilibru celular.</p>
            <h2 className={styles.title} id="footer-title">
              Dr. Camelia Stefanescu
            </h2>
            <p className={styles.description}>
              O abordare calda si riguroasa pentru nutritie, diagnoza celulara si terapii
              complementare, cu recomandari clare si personalizate.
            </p>
          </section>

          <section className={styles.ctaPanel} aria-labelledby="footer-cta-title">
            <div className={styles.ctaIcon} aria-hidden="true">
              <CalendarCheck />
            </div>
            <div>
              <p className={styles.ctaKicker}>Urmatorul pas</p>
              <h2 className={styles.ctaTitle} id="footer-cta-title">
                Programeaza o consultatie
              </h2>
              <p className={styles.ctaCopy}>
                Alege intervalul potrivit si continua cu formularul de evaluare, totul
                intr-un flux simplu.
              </p>
            </div>
            <Link className={styles.ctaLink} href="/programare">
              Programare
            </Link>
          </section>
        </div>

        <nav aria-label="Linkuri footer" className={styles.nav}>
          {footerLinks.map((link) => (
            <Link className={styles.navLink} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.contactGrid}>
          {socialLinks.map((item) => {
            const Icon = item.icon;

            return (
              <a
                aria-label={item.label}
                className={styles.contactCard}
                href={item.href}
                key={item.title}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className={styles.contactIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span>
                  <span className={styles.contactTitle}>Social</span>
                  <span className={styles.contactLabel}>{item.title}</span>
                </span>
              </a>
            );
          })}
        </div>

        <div aria-hidden="true" className={styles.brandWord}>
          CAMELIA
        </div>

        <div className={styles.logoRail}>
          <div aria-hidden="true" className={styles.railLine} />
          <Link aria-label="Dr. Camelia Stefanescu - Acasa" className={styles.logoCard} href="/">
            <Image
              alt=""
              className={styles.logo}
              height={70}
              src="/site/brand/logo-white.png"
              width={185}
            />
          </Link>
        </div>

        <div className={styles.bottomBar}>
          <p>&copy; {year} Dr. Camelia Stefanescu. Toate drepturile rezervate.</p>
          <p>Global Diagnostics - nutritie integrativa - diagnoza celulara</p>
        </div>
      </div>
    </footer>
  );
}
