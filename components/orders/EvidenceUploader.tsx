"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { btnSmallOutline } from "@/components/auth/ui";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_PHOTO_LABEL } from "./shared";

export interface UploadedPhoto {
  key: string;
  url: string; // server path, e.g. /uploads/requests/x.png
  preview: string; // local object URL
  name: string;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function EvidenceUploader({
  photos,
  onChange,
  onBusyChange,
}: {
  photos: UploadedPhoto[];
  onChange: (next: UploadedPhoto[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const pendingRef = useRef(0);

  useEffect(() => {
    onBusyChange?.(uploading > 0);
  }, [uploading, onBusyChange]);

  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    []
  );

  const upload = async (files: File[]) => {
    const problems: string[] = [];
    const room = MAX_PHOTOS - photosRef.current.length - pendingRef.current;
    const accepted: File[] = [];
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) problems.push(`${f.name}: wrong file type. Use a JPEG, PNG or WebP photo.`);
      else if (f.size > MAX_PHOTO_BYTES) problems.push(`${f.name}: too large. The maximum size is ${MAX_PHOTO_LABEL}.`);
      else if (accepted.length >= room) problems.push(`${f.name}: not added. You can attach up to ${MAX_PHOTOS} photos.`);
      else accepted.push(f);
    }
    setErrors(problems);
    if (accepted.length === 0) return;
    pendingRef.current += accepted.length;
    setUploading((n) => n + accepted.length);
    for (const file of accepted) {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/v1/requests/evidence", { method: "POST", body: form, credentials: "include" });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.data?.url) {
          setErrors((e) => [...e, `${file.name}: ${body?.message || "the photo could not be uploaded."}`]);
        } else {
          const next = [
            ...photosRef.current,
            { key: `${Date.now()}-${Math.random()}`, url: body.data.url as string, preview: URL.createObjectURL(file), name: file.name },
          ];
          photosRef.current = next;
          onChange(next);
        }
      } catch {
        setErrors((e) => [...e, `${file.name}: network error, the photo was not uploaded.`]);
      } finally {
        pendingRef.current -= 1;
        setUploading((n) => n - 1);
      }
    }
  };

  const remove = (key: string) => {
    const gone = photos.find((p) => p.key === key);
    if (gone) URL.revokeObjectURL(gone.preview);
    onChange(photos.filter((p) => p.key !== key));
    inputRef.current?.focus();
  };

  const full = photos.length + uploading >= MAX_PHOTOS;

  return (
    <div>
      <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-ink">
        Photos (optional)
      </label>
      <p id={`${inputId}-hint`} className="mb-2 text-sm text-ink-secondary">
        Up to {MAX_PHOTOS} photos, JPEG, PNG or WebP, {MAX_PHOTO_LABEL} each. Photos of a defect or damage help us review faster.
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={full}
        aria-describedby={`${inputId}-hint`}
        data-testid="evidence-input"
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = "";
          if (files.length) void upload(files);
        }}
      />
      <button type="button" disabled={full} onClick={() => inputRef.current?.click()} className={btnSmallOutline}>
        <ImagePlus className="w-4 h-4" aria-hidden="true" />
        Add photos
      </button>
      {uploading > 0 && (
        <p role="status" className="mt-2 flex items-center gap-2 text-sm text-ink-secondary">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Uploading {uploading} {uploading === 1 ? "photo" : "photos"}...
        </p>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1 text-sm text-error">
          {errors.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3" aria-label="Attached photos">
          {photos.map((p) => (
            <li key={p.key} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt={`Preview of ${p.name}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(p.key)}
                aria-label={`Remove photo ${p.name}`}
                className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center text-on-inverse"
              >
                <span className="w-7 h-7 flex items-center justify-center bg-inverse rounded-full">
                  <X className="w-4 h-4" aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
