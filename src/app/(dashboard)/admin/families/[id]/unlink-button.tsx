"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { unlinkParent } from "../actions";

export default function UnlinkButton({
  familyId, profileId,
}: { familyId: string; profileId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-secondary"
      disabled={pending}
      onClick={() => start(async () => { await unlinkParent(familyId, profileId); router.refresh(); })}
    >
      <X className="w-4 h-4" /> Retirer
    </button>
  );
}
