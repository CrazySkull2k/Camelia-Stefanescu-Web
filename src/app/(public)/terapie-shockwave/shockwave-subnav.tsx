import { shockwaveNavigation } from "@/content/shockwave-content";
import { SectionSubnav } from "@/components/site/section-subnav";

type ShockwaveSubnavProps = {
  currentHref: string;
};

export function ShockwaveSubnav({ currentHref }: ShockwaveSubnavProps) {
  return (
    <SectionSubnav
      ariaLabel="Subcategorii Terapie Shockwave"
      currentHref={currentHref}
      items={shockwaveNavigation}
    />
  );
}
