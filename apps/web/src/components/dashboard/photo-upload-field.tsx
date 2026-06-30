"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { DASHBOARD_EL } from "@/content/dashboard-el";

export function PhotoUploadField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadEnabled, setUploadEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p = DASHBOARD_EL.photos;

  useEffect(() => {
    void fetch("/api/photos/config")
      .then((res) => res.json())
      .then((data: { uploadEnabled?: boolean }) => setUploadEnabled(Boolean(data.uploadEnabled)))
      .catch(() => setUploadEnabled(false));
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/photos/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? p.uploadFailed);
        return;
      }
      onChange(data.url);
    } catch {
      setError(p.uploadFailed);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <span className="block text-sm font-medium text-brand-navy">{p.label}</span>
      {value ? (
        <div className="mt-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={p.urlPlaceholder}
              className="w-full rounded-button border border-slate-200 px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className={`inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 ${buttonClass("secondary", "sm")}`}
            >
              <X className="h-3.5 w-3.5" />
              {p.remove}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {uploadEnabled ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className={`inline-flex items-center gap-2 ${buttonClass("secondary", "sm")}`}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? p.uploading : p.uploadButton}
              </button>
              <p className="text-xs text-slate-500">{p.uploadHint}</p>
            </>
          ) : null}
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={uploadEnabled ? p.urlOptional : p.urlPlaceholder}
            className="w-full rounded-button border border-slate-200 px-3 py-2 text-sm"
          />
          {!uploadEnabled ? <p className="text-xs text-slate-500">{p.urlOnlyHint}</p> : null}
        </div>
      )}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
