"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTripDocument } from "../actions";

export default function DeleteTripDocButton({
  tripId,
  docId,
}: { tripId: string; docId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-secondary"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer ce document ?")) return;
        start(async () => { await deleteTripDocument(tripId, docId); router.refresh(); });
      }}
      aria-label="Supprimer"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
