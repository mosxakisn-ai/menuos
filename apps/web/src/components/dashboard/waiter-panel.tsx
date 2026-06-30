"use client";

import { Bell, Check, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Σε αναμονή",
  ACKNOWLEDGED: "Σε εξέλιξη",
  COMPLETED: "Ολοκληρώθηκε",
  CANCELED: "Ακυρώθηκε",
};

const TYPE_LABELS: Record<string, string> = {
  WAITER: "Κλήση σερβιτόρου",
  BILL: "Λογαριασμός",
};
type Venue = { id: string; name: string };
type WaiterCall = {
  id: string;
  type: string;
  tableNumber: string | null;
  roomNumber: string | null;
  status: string;
  createdAt: string;
};

export function WaiterPanel({ venues, initialVenueId }: { venues: Venue[]; initialVenueId?: string }) {
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const load = useCallback(async () => {
    if (!venueId) return;
    const res = await fetch(`/api/waiter-call?venueId=${venueId}`);
    const data = await res.json();
    if (res.ok) {
      setCalls(data.calls ?? []);
      setPendingCount(data.pendingCount ?? 0);
    }
  }, [venueId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function updateStatus(callId: string, status: "ACKNOWLEDGED" | "COMPLETED") {
    const res = await fetch(`/api/waiter-call/${callId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await load();
  }

  if (venues.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Φτιάξε πρώτα κατάστημα για να λαμβάνεις κλήσεις από πελάτες.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className="flex flex-wrap items-center gap-4">
        <label className="block text-sm">
          <span className="font-medium text-brand-navy">{DASHBOARD_EL.venue}</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-1 block min-w-[200px] rounded-button border border-slate-200 px-3 py-2.5"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        {pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            <Bell className="h-4 w-4" />
            {pendingCount} σε αναμονή
          </span>
        ) : (
          <span className="text-sm text-slate-500">Ανανέωση κάθε 8 δευτ.</span>
        )}
      </div>

      {calls.length === 0 ? (
        <Card className="border-dashed text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-brand-navy">Καμία ενεργή κλήση</p>
          <p className="mt-1 text-sm text-slate-500">
            Όταν πελάτης πατήσει «Κλήση σερβιτόρου» ή «Λογαριασμός» στο κινητό, θα εμφανιστεί εδώ με τον αριθμό τραπεζιού.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {calls.map((call) => (
            <li key={call.id}>
              <Card
                className={
                  call.status === "PENDING" ? "border-amber-200 bg-amber-50/50" : "border-slate-200"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-navy">
                      {TYPE_LABELS[call.type] ?? call.type}
                      {" · "}
                      {call.tableNumber ? `Τραπέζι ${call.tableNumber}` : null}
                      {call.roomNumber ? `Δωμάτιο ${call.roomNumber}` : null}
                      {!call.tableNumber && !call.roomNumber ? "Χωρίς τραπέζι" : null}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {new Date(call.createdAt).toLocaleString("el-GR")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {STATUS_LABELS[call.status] ?? call.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {call.status === "PENDING" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(call.id, "ACKNOWLEDGED")}
                        className={buttonClass("primary", "sm")}
                      >
                        Πήγαινε
                      </button>
                    ) : null}
                    {call.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(call.id, "COMPLETED")}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Ολοκλήρωση
                      </button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
