import { nutritionNavigation } from "@/content/nutrition-content";

import { SectionSubnav } from "./section-subnav";

type NutritionSubnavProps = {
  currentHref: string;
};

export function NutritionSubnav({ currentHref }: NutritionSubnavProps) {
  return (
    <SectionSubnav
      ariaLabel="Subcategorii Nutritie"
      currentHref={currentHref}
      items={nutritionNavigation}
    />
  );
}
