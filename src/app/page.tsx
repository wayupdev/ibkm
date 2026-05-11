import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Compass, Share2, Sparkles, LogIn } from "lucide-react";
import Logo from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

const values = [
  {
    icon: BookOpen,
    title: "Apprendre",
    suffix: "avec passion",
    body: "Acquérir les savoirs fondamentaux et développer sa curiosité au contact d'éducateurs engagés.",
  },
  {
    icon: Compass,
    title: "Comprendre",
    suffix: "avec plaisir",
    body: "Donner du sens aux apprentissages et accompagner chaque jeune dans la construction de sa pensée.",
  },
  {
    icon: Share2,
    title: "Partager",
    suffix: "avec respect",
    body: "Construire un collectif fondé sur l'écoute, le dialogue et la fraternité.",
  },
  {
    icon: Sparkles,
    title: "Transmettre",
    suffix: "avec bienveillance",
    body: "Faire vivre les valeurs de l'association et préparer la génération suivante.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const memberHref = user ? "/feed" : "/login";
  const memberLabel = user ? "Mon espace" : "Espace membres";

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Logo size="sm" />
          <nav className="flex items-center gap-2">
            <Link href="#valeurs" className="btn-ghost hidden sm:inline-flex">Nos valeurs</Link>
            <Link href="#association" className="btn-ghost hidden sm:inline-flex">L'association</Link>
            <Link href={memberHref} className="btn-primary">
              <LogIn className="w-4 h-4" /> {memberLabel}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(900px circle at 15% 20%, #ffe2cf 0%, transparent 55%), radial-gradient(700px circle at 90% 80%, #fff4ec 0%, transparent 55%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="tagline mb-4">Association loi 1901</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Inspirer la jeunesse,<br />
              <span className="text-brand-500">éveiller les talents</span>.
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Être membre d'Inspired by KM est une chance et un engagement permanent.
              Notre plateforme accompagne familles, jeunes et responsables au quotidien.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={memberHref} className="btn-primary">
                {memberLabel} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#valeurs" className="btn-secondary">
                Découvrir nos valeurs
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-ink text-white p-10 relative overflow-hidden shadow-soft">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(500px circle at 30% 20%, #f96100 0%, transparent 55%), radial-gradient(400px circle at 80% 90%, #009807 0%, transparent 55%)",
                }}
              />
              <div className="relative h-full flex flex-col justify-between">
                <Image
                  src="/brand/logo-km.png"
                  alt="Inspired by KM"
                  width={180}
                  height={66}
                  className="brightness-0 invert"
                />
                <div>
                  <p className="tagline text-white/70">Notre philosophie</p>
                  <p className="font-display font-bold text-3xl mt-3 leading-tight">
                    Apprendre.<br />Comprendre.<br />Partager.<br />Transmettre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="valeurs" className="py-16 sm:py-24 bg-[#f9f9f9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="tagline mb-3">Nos quatre piliers</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-12 max-w-2xl">
            Quatre valeurs qui guident chacune de nos actions.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, suffix, body }) => (
              <article key={title} className="card p-6 hover:-translate-y-1 transition">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-xl text-ink">
                  {title} <span className="text-brand-500 font-normal">{suffix}</span>
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Association */}
      <section id="association" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="tagline mb-3">L'association</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl">
            Une plateforme pour relier familles, jeunes et responsables.
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Annonces, documents administratifs, photos des sorties et messagerie
            sécurisée : tous les outils de la vie associative en un seul endroit.
            La protection des mineurs est au cœur de nos pratiques (consentement
            parental pour les photos, messagerie modérée).
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={memberHref} className="btn-primary">
              {memberLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/rgpd" className="btn-secondary">
              Protection des données
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" variant="white" />
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Inspired by KM — Association loi 1901
          </p>
          <div className="flex gap-4 text-sm text-white/80">
            <Link href="/legal" className="hover:text-brand-400">Mentions légales</Link>
            <Link href="/rgpd" className="hover:text-brand-400">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
