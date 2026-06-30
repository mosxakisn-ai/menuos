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
  ORDER: "Παραγγελία",
};
type Venue = { id: string; name: string };
type OrderPayload = {
  lines: Array<{ name: string; quantity: number; unitPrice: string }>;
  total: string;
};
type WaiterCall = {
  id: string;
  type: string;
  tableNumber: string | null;
  roomNumber: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderPayload | null;
};

function isOrderUpdated(call: WaiterCall): boolean {
  if (call.type !== "ORDER") return false;
  return new Date(call.updatedAt).getTime() - new Date(call.createdAt).getTime() > 1500;
}

export function WaiterPanel({ venues, initialVenueId }: { venues: Venue[]; initialVenueId?: string }) {
  const resolvedInitial =
    initialVenueId && venues.some((v) => v.id === initialVenueId)
      ? initialVenueId
      : (venues[0]?.id ?? "");
  const [venueId, setVenueId] = useState(resolvedInitial);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [updatingCallId, setUpdatingCallId] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const load = useCallback(async () => {
    if (!venueId) return;
    const res = await fetch(`/api/waiter-call?venueId=${venueId}`);
    const data = await res.json();
    if (res.ok) {
      setCalls(data.calls ?? []);
      setPendingCount(data.pendingCount ?? 0);
    } else {
      setCalls([]);
      setPendingCount(0);
    }
  }, [venueId]);

  useEffect(() => {
    setCalls([]);
    setPendingCount(0);
  }, [venueId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function updateStatus(callId: string, status: "ACKNOWLEDGED" | "COMPLETED") {
    if (updatingCallId) return;
    setUpdatingCallId(callId);
    try {
      const res = await fetch(`/api/waiter-call/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) await load();
    } finally {
      setUpdatingCallId(null);
    }
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
          <span className="text-sm text-slate-500">Ανανέωση κάθε 5 δευτ.</span>
        )}
      </div>

      {calls.length === 0 ? (
        <Card className="border-dashed text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-brand-navy">Καμία ενεργή κλήση</p>
          <p className="mt-1 text-sm text-slate-500">
            Όταν πελάτης στείλει παραγγελία, καλέσει σερβιτόρο ή ζητήσει λογαριασμό από το QR menu, θα εμφανιστεί εδώ.
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
                      {isOrderUpdated(call) && call.status === "PENDING" ? (
                        <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                          Νέα πιάτα
                        </span>
                      ) : null}
                    </p>
                    {call.type === "ORDER" && call.orderItems?.lines?.length ? (
                      <ul className="mt-3 space-y-1 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700">
                        {call.orderItems.lines.map((line, i) => (
                          <li key={`${line.name}-${i}`} className="flex justify-between gap-2">
                            <span>
                              {line.quantity}× {line.name}
                            </span>
                            <span className="font-medium">
                              €{(Number(line.unitPrice) * line.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                        <li className="flex justify-between border-t border-slate-100 pt-1 font-bold text-brand-navy">
                          <span>Σύνολο</span>
                          <span>€{call.orderItems.total}</span>
                        </li>
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {call.status === "PENDING" ? (
                      <button
                        type="button"
                        disabled={updatingCallId !== null}
                        onClick={() => void updateStatus(call.id, "ACKNOWLEDGED")}
                        className={buttonClass("primary", "sm")}
                      >
                        Πήγαινε
                      </button>
                    ) : null}
                    {call.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        disabled={updatingCallId !== null}
                        onClick={() => void updateStatus(call.id, "COMPLETED")}
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
