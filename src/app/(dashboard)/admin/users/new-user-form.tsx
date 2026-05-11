"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Copy, Check } from "lucide-react";
import { createUser } from "./actions";

export default function NewUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await createUser(formData);
      if (res?.error) { setError(res.error); return; }
      const name = `${formData.get("first_name")} ${formData.get("last_name")}`;
      const email = String(formData.get("email") ?? "");
      setCreatedInfo({ name, email, password: res.tempPassword! });
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  };

  const copyPassword = async () => {
    if (!createdInfo) return;
    await navigator.clipboard.writeText(createdInfo.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <button className="btn-primary" onClick={() => { setOpen(true); setError(null); }}>
        <Plus className="w-4 h-4" /> Nouveau compte
      </button>

      {/* Persistent success toast — survives modal close */}
      {createdInfo && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] card border-l-4 border-l-accent-500 p-4 shadow-soft">
          <button
            onClick={() => setCreatedInfo(null)}
            className="absolute top-2 right-2 text-slate-400 hover:text-ink"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="tagline text-accent-600">Compte créé</p>
          <p className="font-display font-semibold mt-1">{createdInfo.name}</p>
          <p className="text-xs text-slate-500 mt-1">{createdInfo.email}</p>
          <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-lg p-2">
            <code className="text-sm font-mono flex-1 truncate">{createdInfo.password}</code>
            <button onClick={copyPassword} className="btn-ghost px-2 py-1">
              {copied ? <Check className="w-4 h-4 text-accent-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mot de passe temporaire à transmettre à l'utilisateur. Il ne sera plus affiché.
          </p>
        </div>
      )}

      {!open ? null : (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
          <form ref={formRef} action={onSubmit} className="card w-full max-w-md p-6 space-y-3">
            <h2 className="font-display font-semibold text-lg">Créer un compte</h2>
            <div className="grid grid-cols-2 gap-3">
              <input name="first_name" required placeholder="Prénom" className="input" />
              <input name="last_name" required placeholder="Nom" className="input" />
            </div>
            <input name="email" required type="email" placeholder="Email" className="input" />
            <div className="grid grid-cols-2 gap-3">
              <select name="role" required defaultValue="parent" className="input">
                <option value="admin">Administrateur</option>
                <option value="parent">Parent</option>
                <option value="child">Jeune</option>
              </select>
              <input name="phone" placeholder="Téléphone (facultatif)" className="input" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" disabled={pending}>
                {pending ? "Création…" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
