import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import type { Announcement, Trip, TripMessage } from "@/lib/types";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "no-reply@example.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function notifyNewAnnouncement(a: Announcement) {
  if (!resendApiKey) return; // notifications désactivées si pas de clé
  const resend = new Resend(resendApiKey);
  const admin = createAdminClient();

  // Find recipient profiles based on audience + email_notifications.
  const roles = a.audience === "all"
    ? ["admin", "parent", "child"]
    : a.audience === "parents" ? ["parent"]
    : ["child"];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name")
    .in("role", roles)
    .eq("email_notifications", true);

  if (!profiles || profiles.length === 0) return;

  // Look up emails via auth.admin.getUserById
  const recipients: { email: string; first_name: string }[] = [];
  for (const p of profiles) {
    const { data } = await admin.auth.admin.getUserById(p.id);
    if (data.user?.email) recipients.push({ email: data.user.email, first_name: p.first_name });
  }
  if (recipients.length === 0) return;

  // Send (one email per recipient, no Bcc to keep emails private).
  await Promise.allSettled(recipients.map((r) =>
    resend.emails.send({
      from: fromEmail,
      to: r.email,
      subject: `[IBKM] ${a.title}`,
      html: `
        <p>Bonjour ${escapeHtml(r.first_name)},</p>
        <p>Une nouvelle annonce a été publiée :</p>
        <h2 style="margin:0 0 8px 0">${escapeHtml(a.title)}</h2>
        <p style="white-space:pre-wrap">${escapeHtml(a.body)}</p>
        <p><a href="${siteUrl}/feed">Voir sur la plateforme</a></p>
        <hr/>
        <p style="font-size:12px;color:#666">
          Vous recevez cet email car vous êtes inscrit(e) à l'espace de l'association.
          <a href="${siteUrl}/profile">Gérer mes préférences</a>
        </p>
      `,
    }),
  ));
}

export async function notifyNewTripMessage(trip: Trip, message: TripMessage) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const admin = createAdminClient();

  // Trip members + the author's name (admins always see their own trips, but
  // we still want to include any admin members so they get the email too).
  const [{ data: memberRows }, { data: author }] = await Promise.all([
    admin.from("trip_members").select("profile_id").eq("trip_id", trip.id),
    admin.from("profiles").select("first_name, last_name").eq("id", message.created_by).single(),
  ]);

  const memberIds = (memberRows ?? []).map((r) => r.profile_id);
  if (memberIds.length === 0) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name")
    .in("id", memberIds)
    .eq("email_notifications", true);

  if (!profiles || profiles.length === 0) return;

  const recipients: { email: string; first_name: string }[] = [];
  for (const p of profiles) {
    const { data } = await admin.auth.admin.getUserById(p.id);
    if (data.user?.email) recipients.push({ email: data.user.email, first_name: p.first_name });
  }
  if (recipients.length === 0) return;

  const authorName = author ? `${author.first_name} ${author.last_name}` : "Un administrateur";

  await Promise.allSettled(recipients.map((r) =>
    resend.emails.send({
      from: fromEmail,
      to: r.email,
      subject: `[IBKM] ${trip.title} — nouveau message`,
      html: `
        <p>Bonjour ${escapeHtml(r.first_name)},</p>
        <p>${escapeHtml(authorName)} a publié un nouveau message dans le séjour
          <strong>${escapeHtml(trip.title)}</strong> :</p>
        <p style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px;color:#333">${escapeHtml(message.body)}</p>
        <p><a href="${siteUrl}/trips/${trip.id}">Voir le séjour</a></p>
        <hr/>
        <p style="font-size:12px;color:#666">
          Vous recevez cet email car vous êtes inscrit(e) à ce séjour.
          <a href="${siteUrl}/profile">Gérer mes préférences</a>
        </p>
      `,
    }),
  ));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}
