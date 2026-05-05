import "server-only";

import { Resend } from "resend";

import { AppointmentAdminEmail } from "@/components/email/appointment-admin-email";
import { AppointmentIntakeCompletedEmail } from "@/components/email/appointment-intake-completed-email";
import { AppointmentReceivedEmail } from "@/components/email/appointment-received-email";
import { AppointmentStatusEmail } from "@/components/email/appointment-status-email";
import { getResendEnv, hasResendEnv, hasSupabaseEnv } from "@/lib/env/server";
import { createAppointmentResumeToken } from "@/lib/security/appointment-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getResendClient() {
  const env = getResendEnv();
  return {
    env,
    resend: new Resend(env.RESEND_API_KEY),
  };
}

async function persistEmailMessage(input: {
  templateKey: string;
  recipient: string;
  relatedEntityType: string;
  relatedEntityId: string;
  providerMessageId?: string | null;
  status: string;
  errorMessage?: string | null;
}) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("email_messages").insert({
    template_key: input.templateKey,
    recipient_email: input.recipient,
    related_entity_type: input.relatedEntityType,
    related_entity_id: input.relatedEntityId,
    provider_message_id: input.providerMessageId ?? null,
    status: input.status,
    error_message: input.errorMessage ?? null,
  });
}

export async function sendAppointmentEmails(input: {
  appointmentId: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  startLabel: string;
  isFirstVisit: boolean;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  publicReferenceCode: string;
  resumeUrl: string;
  intakeStatus: "not_required" | "required_pending" | "submitted";
  notifyAdmin?: boolean;
}) {
  if (!hasResendEnv()) {
    return;
  }

  const { env, resend } = getResendClient();
  const resumeAccessToken = createAppointmentResumeToken({
    appointmentId: input.appointmentId,
    email: input.email,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const emailResumeUrl = new URL("/programare/reia", input.resumeUrl);
  emailResumeUrl.searchParams.set("token", resumeAccessToken.value);
  const statusLabel = input.status === "confirmed" ? "Confirmata" : "Cerere primita";
  const intakeStatusLabel =
    input.intakeStatus === "submitted"
      ? "Completat"
      : input.intakeStatus === "required_pending"
        ? "In asteptare"
        : "Nu este necesar";

  const patientResult = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [input.email],
    subject:
      input.status === "confirmed"
        ? "Programarea ta a fost confirmata"
        : "Cererea ta de programare a fost primita",
    react: AppointmentReceivedEmail({
      name: input.name,
      service: input.service,
      startLabel: input.startLabel,
      statusLabel,
      publicReferenceCode: input.publicReferenceCode,
      resumeUrl: emailResumeUrl.toString(),
      requiresIntake: input.intakeStatus === "required_pending",
    }),
  });

  await persistEmailMessage({
    templateKey: "appointment-received-patient",
    recipient: input.email,
    relatedEntityType: "appointment",
    relatedEntityId: input.appointmentId,
    providerMessageId: patientResult.data?.id ?? null,
    status: patientResult.error ? "failed" : "sent",
    errorMessage: patientResult.error?.message ?? null,
  });

  if (input.notifyAdmin === false) {
    return;
  }

  const adminResult = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [env.ADMIN_NOTIFICATION_EMAIL],
    subject: "Programare noua in platforma",
    react: AppointmentAdminEmail({
      name: input.name,
      email: input.email,
      phone: input.phone,
      service: input.service,
      startLabel: input.startLabel,
      statusLabel,
      publicReferenceCode: input.publicReferenceCode,
      intakeStatusLabel,
      isFirstVisit: input.isFirstVisit,
    }),
  });

  await persistEmailMessage({
    templateKey: "appointment-received-admin",
    recipient: env.ADMIN_NOTIFICATION_EMAIL,
    relatedEntityType: "appointment",
    relatedEntityId: input.appointmentId,
    providerMessageId: adminResult.data?.id ?? null,
    status: adminResult.error ? "failed" : "sent",
    errorMessage: adminResult.error?.message ?? null,
  });
}

export async function sendAppointmentIntakeCompletedEmail(input: {
  appointmentId: string;
  email: string;
  name: string;
  service: string;
  startLabel: string;
}) {
  if (!hasResendEnv()) {
    return;
  }

  const { env, resend } = getResendClient();
  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [input.email],
    subject: "Chestionarul tau a fost trimis",
    react: AppointmentIntakeCompletedEmail({
      name: input.name,
      service: input.service,
      startLabel: input.startLabel,
    }),
  });

  await persistEmailMessage({
    templateKey: "appointment-intake-completed",
    recipient: input.email,
    relatedEntityType: "appointment",
    relatedEntityId: input.appointmentId,
    providerMessageId: result.data?.id ?? null,
    status: result.error ? "failed" : "sent",
    errorMessage: result.error?.message ?? null,
  });
}

function appointmentStatusCopy(status: "pending" | "confirmed" | "cancelled" | "completed") {
  switch (status) {
    case "confirmed":
      return {
        subject: "Programarea ta a fost confirmata",
        statusLabel: "Confirmata",
        message: "Programarea ta a fost confirmata de cabinet.",
      };
    case "cancelled":
      return {
        subject: "Programarea ta a fost anulata",
        statusLabel: "Anulata",
        message:
          "Programarea ta a fost anulata. Te rugam sa revii cu o noua solicitare daca doresti reprogramare.",
      };
    case "completed":
      return {
        subject: "Programarea ta a fost marcata ca finalizata",
        statusLabel: "Finalizata",
        message: "Iti multumim. Programarea a fost marcata ca finalizata.",
      };
    default:
      return {
        subject: "Programarea ta a fost actualizata",
        statusLabel: "In curs de procesare",
        message: "Programarea ta a fost actualizata si este in continuare in procesare.",
      };
  }
}

export async function sendAppointmentStatusUpdateEmail(input: {
  appointmentId: string;
  email: string;
  name: string;
  service: string;
  startLabel: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}) {
  if (!hasResendEnv()) {
    return;
  }

  const { env, resend } = getResendClient();
  const copy = appointmentStatusCopy(input.status);

  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [input.email],
    subject: copy.subject,
    react: AppointmentStatusEmail({
      name: input.name,
      service: input.service,
      startLabel: input.startLabel,
      statusLabel: copy.statusLabel,
      message: copy.message,
    }),
  });

  await persistEmailMessage({
    templateKey: "appointment-status-patient",
    recipient: input.email,
    relatedEntityType: "appointment",
    relatedEntityId: input.appointmentId,
    providerMessageId: result.data?.id ?? null,
    status: result.error ? "failed" : "sent",
    errorMessage: result.error?.message ?? null,
  });
}
