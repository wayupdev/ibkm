"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { removeTripMember } from "../actions";

export default function RemoveMemberButton({
  tripId,
  profileId,
}: { tripId: string; profileId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-secondary"
      disabled={pending}
      onClick={() => start(async () => { await removeTripMember(tripId, profileId); router.refresh(); })}
      aria-label="Retirer"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
