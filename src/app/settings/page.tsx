"use client";

import { useEffect, useState } from "react";

type Settings = {
  name: string;
  handle: string;
  photoFile: string | null;
  focalX: number;
  focalY: number;
  zoom: number;
};

const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setSettings(body.settings);
      })
      .catch((e: Error) => setMessage({ kind: "error", text: e.message }));
  }, []);

  if (!settings) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10 text-sm text-muted">
        {message?.text ?? "Loading…"}
      </main>
    );
  }

  async function save() {
    const { name, handle, focalX, focalY, zoom } = settings!;
    const r = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handle, focalX, focalY, zoom }),
    });
    const body = await r.json();
    if (r.ok) setSettings(body.settings);
    setMessage(
      r.ok
        ? { kind: "ok", text: "Saved. New renders will use these settings." }
        : { kind: "error", text: body.error },
    );
  }

  async function upload(file: File) {
    const form = new FormData();
    form.append("photo", file);
    const r = await fetch("/api/settings/photo", { method: "POST", body: form });
    const body = await r.json();
    if (r.ok) {
      setSettings(body.settings);
      setPhotoVersion((v) => v + 1);
    }
    setMessage(
      r.ok
        ? { kind: "ok", text: "Photo uploaded. Your original file is untouched." }
        : { kind: "error", text: body.error },
    );
  }

  const pos = `${settings.focalX}% ${settings.focalY}%`;
  const slider = (
    key: "focalX" | "focalY" | "zoom",
    label: string,
    min: number,
    max: number,
    step: number,
  ) => (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}: {settings[key]}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[key]}
        onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
      />
    </label>
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Display name
          <input
            className={field}
            value={settings.name}
            maxLength={40}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Instagram handle
          <input
            className={field}
            value={settings.handle}
            maxLength={31}
            onChange={(e) => setSettings({ ...settings, handle: e.target.value })}
          />
        </label>
      </section>

      <section className="grid gap-6 rounded-xl border border-border bg-surface p-6 sm:grid-cols-[220px_1fr]">
        <div className="aspect-[438/500] overflow-hidden rounded-2xl bg-border">
          {settings.photoFile ? (
            // eslint-disable-next-line @next/next/no-img-element -- local uploaded photo
            <img
              src={`/api/settings/photo?v=${photoVersion}`}
              alt="Creator photo crop preview"
              className="h-full w-full object-cover"
              style={{
                objectPosition: pos,
                transform: `scale(${settings.zoom})`,
                transformOrigin: pos,
              }}
            />
          ) : (
            <p className="p-4 text-sm text-muted">
              No photo yet. Carousels use the photo-free cover.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Creator photo (JPEG, PNG or WebP, up to 8 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          {slider("focalX", "Horizontal focus (%)", 0, 100, 1)}
          {slider("focalY", "Vertical focus (%)", 0, 100, 1)}
          {slider("zoom", "Zoom", 1, 2, 0.05)}
          <p className="text-xs text-muted">The cover never places text over the photo.</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Save settings
        </button>
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`text-sm ${message.kind === "error" ? "text-danger" : "text-accent"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </main>
  );
}
