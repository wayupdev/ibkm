import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/page-header";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const profile = await requireProfile();
  return (
    <div>
      <PageHeader
        eyebrow="Mon espace"
        title="Mon profil"
        subtitle="Vos informations personnelles et préférences."
      />
      <ProfileForm profile={profile} />
    </div>
  );
}
