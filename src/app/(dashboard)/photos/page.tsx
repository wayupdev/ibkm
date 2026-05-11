import Image from "next/image";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/page-header";
import type { RecipientOption } from "@/components/recipient-picker";
import UploadPhotoForm from "./upload-form";

export default async function PhotosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  const photoIds = (photos ?? []).map((p) => p.id);
  const { data: recipientsRows } = photoIds.length
    ? await supabase
        .from("photo_recipients")
        .select("photo_id, profile_id, profile:profiles!photo_recipients_profile_id_fkey(id, first_name, last_name, role)")
        .in("photo_id", photoIds)
    : { data: [] as { photo_id: string; profile: RecipientOption | RecipientOption[] | null }[] };

  const recipientsByPhoto = new Map<string, RecipientOption[]>();
  for (const row of recipientsRows ?? []) {
    const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!p) continue;
    const list = recipientsByPhoto.get(row.photo_id) ?? [];
    list.push(p);
    recipientsByPhoto.set(row.photo_id, list);
  }

  let people: RecipientOption[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .neq("id", profile.id)
      .order("role")
      .order("last_name");
    people = (data ?? []) as RecipientOption[];
  }

  const items = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data: signed } = await supabase
        .storage.from("photos")
        .createSignedUrl(p.storage_path, 60 * 60);
      return {
        ...p,
        url: signed?.signedUrl ?? null,
        recipients: recipientsByPhoto.get(p.id) ?? [],
      };
    }),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Transmettre"
        title="Galerie photo"
        subtitle="Les moments forts de l'association — diffusés avec le consentement des familles."
      />

      {profile.role === "admin" && <UploadPhotoForm people={people} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        {items.map((p) => {
          const targeted = p.recipients.length > 0;
          return (
            <figure key={p.id} className="card overflow-hidden">
              {p.url && (
                <div className="relative aspect-square">
                  <Image
                    src={p.url}
                    alt={p.caption ?? "Photo de l'association"}
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {targeted && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 text-brand-700 text-[10px] px-2 py-0.5 shadow">
                      <Users className="w-3 h-3" />
                      {profile.role === "admin" ? p.recipients.length : "à vous"}
                    </span>
                  )}
                </div>
              )}
              {(p.caption || (targeted && profile.role === "admin")) && (
                <figcaption className="p-2 text-xs text-slate-600 truncate">
                  {p.caption}
                  {targeted && profile.role === "admin" && (
                    <span className="block text-slate-500">
                      → {p.recipients.map((r: RecipientOption) => `${r.first_name} ${r.last_name}`).join(", ")}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-slate-500 col-span-full">Aucune photo pour le moment.</p>
        )}
      </div>
    </div>
  );
}
