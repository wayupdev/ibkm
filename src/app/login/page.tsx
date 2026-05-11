"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/feed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message?.toLowerCase().includes("invalid")
            ? "Identifiants invalides."
            : `Erreur : ${error.message}`,
        );
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(
        "Connexion au serveur impossible. Vérifiez votre réseau ou désactivez vos extensions de navigateur (bloqueur de pub, anti-traceur).",
      );
      console.error("[login] signIn failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual side */}
      <div className="hidden lg:flex relative bg-ink text-white p-12 flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(900px circle at 20% 10%, #f96100 0%, transparent 50%), radial-gradient(700px circle at 90% 90%, #009807 0%, transparent 55%)",
          }}
        />
        <Logo variant="white" />
        <div className="relative">
          <p className="tagline text-white/80">Notre philosophie</p>
          <h2 className="font-display font-bold text-4xl mt-3 leading-tight">
            Apprendre.<br />Comprendre.<br />Partager.<br />Transmettre.
          </h2>
          <p className="mt-6 text-white/70 max-w-md">
            L'espace numérique de l'association : annonces, documents, photos
            et messagerie sécurisée pour les familles et les jeunes.
          </p>
        </div>
        <div className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Inspired by KM
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 bg-[#f9f9f9]">
        <div className="card w-full max-w-md p-8">
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo />
          </div>

          <p className="tagline mb-2">Espace membres</p>
          <h1 className="font-display font-bold text-3xl mb-1">Connexion</h1>
          <p className="text-sm text-slate-500 mb-6">
            Identifiez-vous avec votre email et votre mot de passe.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required autoComplete="email"
                className="input"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password" required autoComplete="current-password"
                className="input"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-xs text-slate-500 space-x-3">
            <Link href="/legal" className="hover:text-brand-500">Mentions légales</Link>
            <span>·</span>
            <Link href="/rgpd" className="hover:text-brand-500">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
