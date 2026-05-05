import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { legacyServiceOfferings } from "../src/modules/pricing/data";

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function loadMainHtml(filename: string) {
  const source = await readFile(
    path.join(process.cwd(), "src", "content", "legacy", filename),
    "utf8",
  );
  const match = source.match(/<main class="page_content">([\s\S]*?)<\/main>/i);
  return match?.[1] ?? "";
}

async function main() {
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const pages = [
    ["home", "/", "Acasa", "index.html"],
    ["about", "/about", "Despre mine", "about.html"],
    ["contact", "/contact", "Contact", "contact.html"],
    ["preturi", "/preturi", "Preturi", "preturi.html"],
    ["servicii-nutritie", "/serviciinutritie", "Servicii nutritie", "serviciinutritie.html"],
    ["stop-dieta", "/stopdieta", "Stop Dieta", "stopdieta.html"],
    ["detox-fiziologic", "/detox", "Detox fiziologic", "detox.html"],
    ["diagnoza-celulara", "/diagnozacel", "Diagnoza Celulara", "diagnozacel.html"],
    ["termeni", "/termeni", "Termeni", "termeni.html"],
  ] as const;

  for (const [pageKey, slug, title, fileName] of pages) {
    const page = await supabase
      .from("site_pages")
      .upsert({
        page_key: pageKey,
        slug,
        title,
        is_published: true,
      }, { onConflict: "page_key" })
      .select("id")
      .single();

    if (page.error || !page.data) {
      throw page.error ?? new Error(`Could not upsert page ${pageKey}`);
    }

    await supabase.from("site_sections").upsert({
      page_id: page.data.id,
      section_key: "main",
      section_type: "html",
      sort_order: 1,
      content: { html: await loadMainHtml(fileName) },
      is_published: true,
    }, { onConflict: "page_id,section_key" });
  }

  await supabase.from("service_categories").upsert([
    {
      id: "diagnoza-celulara",
      slug: "diagnoza-celulara",
      name: "Diagnoza Celulara",
      description: "Analiza functionala si metabolica",
      sort_order: 1,
      is_visible: true,
    },
    {
      id: "nutritie",
      slug: "nutritie",
      name: "Nutritie",
      description: "Evaluari si programe nutritionale",
      sort_order: 2,
      is_visible: true,
    },
  ], { onConflict: "id" });

  for (const service of legacyServiceOfferings) {
    const numericPrice = Number.parseFloat(service.priceLabel.replace(/[^\d.]/g, "")) || 0;
    await supabase.from("service_offerings").upsert({
      id: service.id,
      category_id: service.categoryKey,
      slug: service.slug,
      name: service.title,
      description: service.description ?? service.features.join(" | "),
      notes: service.subtitle ?? null,
      price_amount: numericPrice,
      currency_code: "RON",
      duration_minutes: service.durationMinutes ?? null,
      is_bookable: service.bookable,
      is_visible: service.visible,
      sort_order: 1,
    }, { onConflict: "id" });
  }

  console.log(`Imported ${pages.length} pages and ${legacyServiceOfferings.length} services.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
