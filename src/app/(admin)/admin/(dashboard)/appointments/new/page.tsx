import { AdminNewAppointmentWizard } from "./wizard";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { searchAdminAppointmentPatientsForWizard } from "@/modules/appointments/admin-wizard";
import { requireOwnerAdminAal2User } from "@/modules/auth/guards";
import { getPricingCatalog } from "@/modules/pricing/service";

type AdminNewAppointmentPageProps = {
  searchParams: Promise<{
    date?: string | string[];
  }>;
};

function getInitialDate(value?: string | string[]) {
  const date = Array.isArray(value) ? value[0] : value;
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
}

export default async function AdminNewAppointmentPage({
  searchParams,
}: AdminNewAppointmentPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminAal2User();

  const [catalog, query, initialPatientsResult] = await Promise.all([
    getPricingCatalog(),
    searchParams,
    searchAdminAppointmentPatientsForWizard(""),
  ]);
  const services = catalog.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.items
        .filter((service) => service.visible && service.bookable && !service.archivedAt)
        .map((service) => ({
          categoryDescription: category.description ?? "",
          categoryKey: category.slug,
          categoryName: category.name,
          categorySortOrder: category.sortOrder,
          description: service.description ?? service.subtitle ?? "",
          durationMinutes: service.durationMinutes ?? 60,
          id: service.id,
          priceLabel: service.priceLabel,
          slug: service.slug,
          title: service.title,
        })),
    ),
  );

  return (
    <AdminNewAppointmentWizard
      initialDate={getInitialDate(query.date)}
      initialPatients={initialPatientsResult.ok ? initialPatientsResult.data : []}
      services={services}
    />
  );
}
