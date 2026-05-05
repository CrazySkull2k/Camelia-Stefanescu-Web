import Link from "next/link";

import styles from "./section-subnav.module.css";

type SectionSubnavItem = {
  href: string;
  id: string;
  label: string;
};

type SectionSubnavProps = {
  ariaLabel: string;
  currentHref: string;
  items: readonly SectionSubnavItem[];
};

export function SectionSubnav({ ariaLabel, currentHref, items }: SectionSubnavProps) {
  return (
    <nav aria-label={ariaLabel} className={styles.subnav}>
      <ul className={styles.subnavList}>
        {items.map((item) => {
          const active = currentHref === item.href;

          return (
            <li key={item.id}>
              <Link
                aria-current={active ? "page" : undefined}
                className={`${styles.subnavLink}${active ? ` ${styles.subnavLinkActive}` : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
