import Link from "next/link";

export const metadata = { title: "Mentions légales — IBKM" };

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose prose-slate">
      <h1>Mentions légales</h1>
      <p>
        Cette plateforme est éditée par l'association IBKM.
        Pour toute question, veuillez contacter l'administrateur de l'association.
      </p>
      <h2>Hébergement</h2>
      <p>Vercel Inc. et Supabase Inc.</p>
      <p><Link href="/login">← Retour</Link></p>
    </div>
  );
}
