import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import PageHeader from "@/components/page-header";
import NewTripForm from "./new-trip-form";

export default async function NewTripPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <div className="mb-4">
        <Link href="/trips" className="btn-secondary p-2 inline-flex">
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <PageHeader
        eyebrow="Administration"
        title="Nouveau séjour"
        subtitle="Créez un nouvel espace séjour. Vous pourrez ensuite ajouter des informations, des documents et choisir qui y a accès."
      />

      <NewTripForm />
    </div>
  );
}
