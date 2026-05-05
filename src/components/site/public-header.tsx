"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { shockwaveNavigation } from "@/content/shockwave-content";

import { PublicAccountMenu } from "./public-account-menu";
import styles from "./public-header.module.css";

type NavLink = {
  href: string;
  id: string;
  label: string;
};

type NavDropdown = {
  children: NavLink[];
  id: string;
  label: string;
};

type NavItem = NavLink | NavDropdown;

const navigationItems: NavItem[] = [
  { href: "/", id: "home", label: "Acasa" },
  {
    children: [
      { href: "/serviciinutritie", id: "nutrition-services", label: "Servicii de Nutritie" },
      { href: "/stopdieta", id: "stop-dieta", label: "Stop Dieta Online" },
      { href: "/detox", id: "detox", label: "Detox Fiziologic" },
    ],
    id: "nutrition",
    label: "Nutritie",
  },
  {
    children: [...shockwaveNavigation],
    id: "shockwave",
    label: "Terapie Shockwave",
  },
  { href: "/diagnozacel", id: "cell-diagnosis", label: "Diagnoza Celulara" },
  { href: "/preturi", id: "pricing", label: "Preturi" },
  { href: "/about", id: "about", label: "Despre Mine" },
  { href: "/blog", id: "blog", label: "Blog" },
];

const mobileLinks: NavLink[] = [{ href: "/contact", id: "mobile-contact", label: "Contact" }];

function isDropdown(item: NavItem): item is NavDropdown {
  return "children" in item;
}

function isActivePath(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type PublicHeaderInnerProps = {
  pathname: string;
};

function PublicHeaderInner({ pathname }: PublicHeaderInnerProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setIsSticky(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenDropdownId(null);
        setIsMobileOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header
      className={`site_header ${styles.header}${isSticky ? ` ${styles.sticky}` : ""}`}
      ref={headerRef}
    >
      <div className={styles.inner}>
        <Link aria-label="Dr. Camelia Stefanescu" className={styles.logoLink} href="/">
          <Image
            alt="Dr. Camelia Stefanescu"
            className={styles.logo}
            height={54}
            priority
            src="/site/brand/logo.png"
            width={248}
          />
        </Link>

        <nav aria-label="Navigatie principala" className={styles.desktopNav}>
          <ul className={styles.desktopNavList}>
            {navigationItems.map((item) => {
              if (!isDropdown(item)) {
                const active = isActivePath(pathname, item.href);

                return (
                  <li key={item.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`${styles.desktopLink}${active ? ` ${styles.activeLink}` : ""}`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const expanded = openDropdownId === item.id;
              const active = item.children.some((child) => isActivePath(pathname, child.href));

              return (
                <li
                  className={styles.desktopDropdown}
                  key={item.id}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setOpenDropdownId((current) => (current === item.id ? null : current));
                    }
                  }}
                  onFocusCapture={() => setOpenDropdownId(item.id)}
                  onMouseEnter={() => setOpenDropdownId(item.id)}
                  onMouseLeave={() =>
                    setOpenDropdownId((current) => (current === item.id ? null : current))
                  }
                >
                  <button
                    aria-expanded={expanded}
                    aria-haspopup="true"
                    className={`${styles.desktopLink} ${styles.dropdownTrigger}${active ? ` ${styles.activeLink}` : ""}`}
                    type="button"
                    onClick={() =>
                      setOpenDropdownId((current) => (current === item.id ? null : item.id))
                    }
                  >
                    {item.label}
                  </button>

                  <ul
                    aria-label={item.label}
                    className={`${styles.dropdownMenu}${expanded ? ` ${styles.dropdownMenuOpen}` : ""}`}
                  >
                    {item.children.map((child) => {
                      const childActive = isActivePath(pathname, child.href);

                      return (
                        <li key={child.id}>
                          <Link
                            aria-current={childActive ? "page" : undefined}
                            className={`${styles.dropdownLink}${childActive ? ` ${styles.dropdownLinkActive}` : ""}`}
                            href={child.href}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}

          </ul>
        </nav>

        <div className={styles.utilityGroup}>
          <Link className={styles.bookingButton} href="/programare">
            Programari
          </Link>
          <Link className={styles.contactButton} href="/contact">
            Contact
          </Link>
          <PublicAccountMenu />
        </div>

        <div className={styles.actions}>
          <button
            aria-controls="mobile-menu"
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? "Inchide meniul" : "Deschide meniul"}
            className={styles.mobileToggle}
            type="button"
            onClick={() => setIsMobileOpen((current) => !current)}
          >
            <span className={styles.mobileToggleBar} />
            <span className={styles.mobileToggleBar} />
            <span className={styles.mobileToggleBar} />
          </button>
        </div>
      </div>

      <div
        className={`${styles.mobilePanel}${isMobileOpen ? ` ${styles.mobilePanelOpen}` : ""}`}
        id="mobile-menu"
      >
        <nav aria-label="Navigatie mobila" className={styles.mobileNav}>
          <ul className={styles.mobileNavList}>
            {navigationItems.map((item) => {
              if (!isDropdown(item)) {
                const active = isActivePath(pathname, item.href);

                return (
                  <li key={item.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`${styles.mobileLink}${active ? ` ${styles.mobileLinkActive}` : ""}`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const expanded = openDropdownId === item.id;
              const active = item.children.some((child) => isActivePath(pathname, child.href));

              return (
                <li className={styles.mobileDropdown} key={item.id}>
                  <button
                    aria-expanded={expanded}
                    className={`${styles.mobileLink} ${styles.mobileDropdownTrigger}${active ? ` ${styles.mobileLinkActive}` : ""}`}
                    type="button"
                    onClick={() =>
                      setOpenDropdownId((current) => (current === item.id ? null : item.id))
                    }
                  >
                    {item.label}
                  </button>

                  <ul
                    className={`${styles.mobileDropdownMenu}${expanded ? ` ${styles.mobileDropdownMenuOpen}` : ""}`}
                  >
                    {item.children.map((child) => {
                      const childActive = isActivePath(pathname, child.href);

                      return (
                        <li key={child.id}>
                          <Link
                            aria-current={childActive ? "page" : undefined}
                            className={`${styles.mobileDropdownLink}${childActive ? ` ${styles.dropdownLinkActive}` : ""}`}
                            href={child.href}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.mobileActions}>
          <Link className={styles.mobilePrimaryAction} href="/programare">
            Programari
          </Link>
          <PublicAccountMenu variant="mobile" />

          {mobileLinks.map((item) => (
            <Link
              className={styles.mobileSecondaryAction}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}

          <a className={styles.mobilePhone} href="tel:0745090750">
            0745 090 750
          </a>
        </div>
      </div>
    </header>
  );
}

export function PublicHeader() {
  const pathname = usePathname();

  return <PublicHeaderInner key={pathname} pathname={pathname} />;
}
