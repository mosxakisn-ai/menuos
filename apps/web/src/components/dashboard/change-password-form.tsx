"use client";

import { useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { DASHBOARD_EL } from "@/content/dashboard-el";

export function ChangePasswordForm() {
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
        setFlash({ type: "success", text: data.message ?? DASHBOARD_EL.changePassword.success });
      } else {
        showFromResponse(data, false);
      }
    } catch {
      setFlash({ type: "error", text: "Σφάλμα δικτύου." });
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
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <label className="block text-sm">
        <span className={dashboardLabelClass}>{DASHBOARD_EL.changePassword.current}</span>
        <input
          className={dashboardFieldClass}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="block text-sm">
        <span className={dashboardLabelClass}>{DASHBOARD_EL.changePassword.new}</span>
        <input
          className={dashboardFieldClass}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="block text-sm">
        <span className={dashboardLabelClass}>{DASHBOARD_EL.changePassword.confirm}</span>
        <input
          className={dashboardFieldClass}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>
      <button type="submit" disabled={saving || !canSubmit} className={buttonClass("primary", "sm")}>
        {saving ? DASHBOARD_EL.changePassword.saving : DASHBOARD_EL.changePassword.submit}
      </button>
    </form>
  );
}
