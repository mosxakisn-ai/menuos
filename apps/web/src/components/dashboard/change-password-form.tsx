"use client";

import { useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

export function ChangePasswordForm({ compact = false }: { compact?: boolean }) {
  const { d } = useDashboardCopy();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFlash({ type: "success", text: d.changePassword.success });
      } else {
        showFromResponse(data, false, res.status);
      }
    } catch {
      setFlash({ type: "error", text: d.billing.networkError });
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length >= 8 &&
    newPassword === confirmPassword;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={compact ? "space-y-3" : "space-y-4"}>
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={compact ? "space-y-3" : "space-y-4"}>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>{d.changePassword.current}</span>
          <input
            className={dashboardFieldClass}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder={FORM_PLACEHOLDERS.passwordCurrent}
            required
          />
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>{d.changePassword.new}</span>
          <input
            className={dashboardFieldClass}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            placeholder={FORM_PLACEHOLDERS.passwordNew}
            required
          />
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>{d.changePassword.confirm}</span>
          <input
            className={dashboardFieldClass}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            placeholder={FORM_PLACEHOLDERS.passwordNew}
            required
          />
        </label>
      </div>
      <button type="submit" disabled={saving || !canSubmit} className={`h-10 w-full sm:w-auto ${buttonClass("primary", "md")}`}>
        {saving ? d.changePassword.saving : d.changePassword.submit}
      </button>
    </form>
  );
}
