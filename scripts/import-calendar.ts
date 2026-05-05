import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function parseLegacyEvent(input: { summary?: string | null; description?: string | null }) {
  const summary = input.summary ?? "";
  const description = input.description ?? "";
  const name = summary.replace(/^Programare:\s*/i, "").trim();
  const phoneMatch = description.match(/(?:Telefon|📞)\s*:?\s*(.+)/i);
  const serviceMatch = description.match(/(?:Serviciu|🧾)\s*:?\s*(.+)/i);

  return {
    name,
    phone: phoneMatch?.[1]?.trim() ?? "",
    service: serviceMatch?.[1]?.trim() ?? "",
  };
}

async function main() {
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const auth = new google.auth.JWT({
    email: env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const { data } = await calendar.events.list({
    calendarId: env("GOOGLE_CALENDAR_ID"),
    timeMin: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  let imported = 0;

  for (const event of data.items ?? []) {
    if (!event.start?.dateTime || !event.end?.dateTime || !event.id) {
      continue;
    }

    const parsed = parseLegacyEvent({
      summary: event.summary,
      description: event.description,
    });

    const normalizedPhone = parsed.phone ? normalizePhone(parsed.phone) : null;
    const existingPatient = normalizedPhone
      ? await supabase
          .from("patients")
          .select("id")
          .eq("normalized_phone", normalizedPhone)
          .maybeSingle()
      : { data: null };

    const patient = existingPatient.data?.id
      ? { data: { id: existingPatient.data.id }, error: null }
      : await supabase
          .from("patients")
          .insert({
            full_name: parsed.name || "Pacient importat",
            normalized_name: (parsed.name || "Pacient importat").toLowerCase(),
            phone: parsed.phone || null,
            normalized_phone: normalizedPhone,
          })
          .select("id")
          .single();

    if (patient.error || !patient.data) {
      continue;
    }

    await supabase.from("appointments").upsert({
      patient_id: patient.data.id,
      resource_id: "primary-resource",
      service_offering_id: null,
      start_at: event.start.dateTime,
      end_at: event.end.dateTime,
      timezone: "Europe/Bucharest",
      status: "confirmed",
      source: "legacy_google_calendar",
      google_calendar_id: env("GOOGLE_CALENDAR_ID"),
      google_event_id: event.id,
      sync_status: "synced",
      requested_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "google_event_id" });

    imported += 1;
  }

  console.log(`Imported ${imported} calendar events.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
