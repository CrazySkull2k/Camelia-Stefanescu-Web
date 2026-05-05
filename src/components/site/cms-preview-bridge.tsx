"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { resolvePublicMediaUrl } from "@/lib/media";

type TextOverride = {
  label?: string;
  text: string;
};

type ImageOverride = {
  alt: string;
  label?: string;
  src: string;
};

type OverridePayload = {
  imageOverrides?: Record<string, ImageOverride>;
  textOverrides?: Record<string, TextOverride>;
};

const TEXT_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "blockquote",
  "cite",
  "figcaption",
  "label",
  "span",
  "strong",
  "em",
  "small",
  "a",
  "button",
].join(",");

function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function getElementPath(root: Element, element: Element) {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== root) {
    const parentElement: HTMLElement | null = current.parentElement;

    if (!parentElement) {
      break;
    }

    const currentTagName = current.tagName;
    const siblings = Array.from(parentElement.children).filter(
      (sibling): sibling is Element => sibling.tagName === currentTagName,
    );
    const index = siblings.indexOf(current) + 1;
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
    current = parentElement;
  }

  return parts.join(">");
}

function getPreviewContext() {
  if (typeof window === "undefined") {
    return {
      interactive: false,
      preview: false,
      previewedPage: null as string | null,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const previewedPage = searchParams.get("previewed_page");
  const preview = searchParams.get("cms_preview") === "1" && Boolean(previewedPage);

  return {
    interactive: preview && window.self !== window.top,
    preview,
    previewedPage,
  };
}

function createLabel(element: Element, fallback: string) {
  const ariaLabel = element.getAttribute("aria-label");
  const text = normalizeText(element.textContent);
  const base = ariaLabel || text || fallback;

  return base.length > 72 ? `${base.slice(0, 72)}...` : base;
}

function withVersionPrefix(root: Element, element: Element, value: string) {
  const versionHost = element.closest("[data-cms-override-version]");
  const version =
    versionHost && root.contains(versionHost)
      ? versionHost.getAttribute("data-cms-override-version")
      : root.getAttribute("data-cms-override-version");
  return version ? `${version}|${value}` : value;
}

function isEditableTextElement(element: Element) {
  const text = normalizeText(element.textContent);

  if (!text) {
    return false;
  }

  if (element.closest("header, footer, nav, script, style, noscript, svg")) {
    return false;
  }

  const childTextCandidate = Array.from(element.children).some(
    (child) => child.matches(TEXT_SELECTOR) && normalizeText(child.textContent),
  );

  return !childTextCandidate;
}

function annotatePage(preview: boolean, overrides: OverridePayload) {
  const main = document.querySelector("main.page_content, main");

  if (!main) {
    return;
  }

  let style = document.getElementById("camelia-cms-bridge-style");

  if (preview && !style) {
    style = document.createElement("style");
    style.id = "camelia-cms-bridge-style";
    document.head.appendChild(style);
  }

  if (style) {
    style.textContent = preview
      ? `
        [data-cms-live-id] {
          outline: 1.5px dotted rgba(115, 90, 66, 0.78) !important;
          outline-offset: 5px !important;
          border-radius: 10px !important;
          cursor: pointer !important;
          transition: outline-color .2s ease, box-shadow .2s ease !important;
        }
        [data-cms-live-id]:hover,
        [data-cms-live-selected="true"] {
          outline: 2px solid rgba(115, 90, 66, .98) !important;
          box-shadow: 0 0 0 7px rgba(255, 220, 189, .3) !important;
        }
      `
      : "";
  }

  const textOverrides = overrides.textOverrides ?? {};
  const imageOverrides = overrides.imageOverrides ?? {};

  main.querySelectorAll("[data-cms-live-id]").forEach((element) => {
    element.removeAttribute("data-cms-live-id");
    element.removeAttribute("data-cms-live-kind");
    element.removeAttribute("data-cms-live-label");
    element.removeAttribute("data-cms-live-selected");
  });

  Array.from(main.querySelectorAll(TEXT_SELECTOR))
    .filter(isEditableTextElement)
    .forEach((element) => {
      const id = withVersionPrefix(main, element, `text:${getElementPath(main, element)}`);
      const override = textOverrides[id];

      if (override?.text) {
        element.textContent = override.text;
      }

      if (!preview) {
        return;
      }

      element.setAttribute("data-cms-live-id", id);
      element.setAttribute("data-cms-live-kind", "text");
      element.setAttribute("data-cms-live-label", override?.label || createLabel(element, "Text"));
      if (element instanceof HTMLElement) {
        element.tabIndex = 0;
      }
    });

  Array.from(main.querySelectorAll("img")).forEach((image) => {
    if (image.closest("header, footer, nav")) {
      return;
    }

    const id = withVersionPrefix(main, image, `image:${getElementPath(main, image)}`);
    const override = imageOverrides[id];

    if (override?.src) {
      image.src = resolvePublicMediaUrl(override.src) ?? override.src;
      image.alt = override.alt;
    }

    if (!preview) {
      return;
    }

    image.setAttribute("data-cms-live-id", id);
    image.setAttribute("data-cms-live-kind", "image");
    image.setAttribute("data-cms-live-label", override?.label || image.alt || "Imagine");
    image.tabIndex = 0;
  });
}

function getSelectedPayload(element: Element) {
  const id = element.getAttribute("data-cms-live-id") ?? "";
  const kind = element.getAttribute("data-cms-live-kind") === "image" ? "image" : "text";
  const label = element.getAttribute("data-cms-live-label") ?? "Element";

  if (kind === "image" && element instanceof HTMLImageElement) {
    return {
      alt: element.alt,
      id,
      kind,
      label,
      src: element.getAttribute("src") ?? "",
    };
  }

  return {
    id,
    kind,
    label,
    text: element.textContent ?? "",
  };
}

export function CmsPreviewBridge() {
  const pathname = usePathname();
  const overridesRef = useRef<OverridePayload>({});

  useEffect(() => {
    let cancelled = false;
    const previewContext = getPreviewContext();

    async function loadOverrides() {
      try {
        const params = new URLSearchParams({
          path: window.location.pathname,
          preview: previewContext.preview ? "1" : "0",
        });

        if (previewContext.previewedPage) {
          params.set("previewed_page", previewContext.previewedPage);
        }

        const response = await fetch(
          `/api/cms/overrides?${params.toString()}`,
          { cache: "no-store" },
        );
        const overrides = (await response.json()) as OverridePayload;

        if (cancelled) {
          return;
        }

        overridesRef.current = overrides;
        annotatePage(previewContext.interactive, overridesRef.current);
      } catch {
        annotatePage(previewContext.interactive, overridesRef.current);
      }
    }

    loadOverrides();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const previewContext = getPreviewContext();

    if (!previewContext.interactive) {
      annotatePage(false, overridesRef.current);
      return;
    }

    function handleSelect(event: Event) {
      const target =
        event.target instanceof Element
          ? event.target.closest("[data-cms-live-id]")
          : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      document.querySelectorAll("[data-cms-live-selected]").forEach((element) => {
        element.removeAttribute("data-cms-live-selected");
      });
      target.setAttribute("data-cms-live-selected", "true");

      window.parent.postMessage(
        {
          item: getSelectedPayload(target),
          type: "camelia-cms-select",
        },
        window.location.origin,
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      handleSelect(event);
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "camelia-cms-overrides") {
        return;
      }

      overridesRef.current = {
        imageOverrides: event.data.imageOverrides ?? {},
        textOverrides: event.data.textOverrides ?? {},
      };
      annotatePage(true, overridesRef.current);
    }

    document.addEventListener("pointerdown", handleSelect, true);
    document.addEventListener("click", handleSelect, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("message", handleMessage);
    annotatePage(true, overridesRef.current);

    return () => {
      document.removeEventListener("pointerdown", handleSelect, true);
      document.removeEventListener("click", handleSelect, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("message", handleMessage);
    };
  }, [pathname]);

  return null;
}
