"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { mediaUrl, PLACEHOLDER_BALL_IMAGE_KEY } from "@/lib/r2/client";

type MediaItem = { key: string; url: string };

type Props = {
  value: string | null;
  onChange: (key: string | null) => void;
  prefix: string;
  label?: string;
  required?: boolean;
  srcResolver?: (key: string) => string;
  showLibraryPicker?: boolean;
  heroPreview?: boolean;
  placeholderKey?: string;
  enabled?: boolean;
};

export function ImageUpload({
  value,
  onChange,
  prefix,
  label = "ChooseImage",
  required = false,
  srcResolver = mediaUrl,
  showLibraryPicker = true,
  heroPreview = false,
  placeholderKey = PLACEHOLDER_BALL_IMAGE_KEY,
  enabled = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerImages, setPickerImages] = useState<MediaItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", prefix);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }
      const { key } = (await res.json()) as { key: string };
      onChange(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function openPicker() {
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const res = await fetch(
        `/api/media-list?prefix=${encodeURIComponent(prefix)}`,
      );
      const data = (await res.json()) as MediaItem[];
      setPickerImages(data);
    } catch {
      setPickerImages([]);
    } finally {
      setPickerLoading(false);
    }
  }

  function selectFromLibrary(key: string) {
    onChange(key);
    setPickerOpen(false);
  }

  return (
    <div className={`relative ${!enabled ? "pointer-events-none opacity-40 cursor-not-allowed" : ""}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {!value && placeholderKey && (
        <div className="mt-2 relative inline-block h-40 w-full max-w-xs overflow-hidden border border-gray-200 opacity-40">
          <Image src={srcResolver(placeholderKey)} alt="" fill className="object-cover" unoptimized />
          <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-sm text-white">Default image</span>
        </div>
      )}

      {value &&
        (heroPreview ? (
          <div
            className="mt-2 relative w-full max-w-sm aspect-video border border-gray-200"
            style={{
              backgroundImage: `url(${srcResolver(value)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded bg-white/80 px-1.5 py-0.5 text-red-600 hover:bg-white transition-colors shadow-sm"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-2 relative inline-block h-40 w-full max-w-xs overflow-hidden border border-gray-200">
            <Image
              src={srcResolver(value)}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded bg-white/80 px-1.5 py-0.5s text-red-600 hover:bg-white transition-colors shadow-sm"
            >
              Remove
            </button>
          </div>
        ))}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2  hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading…" : value ? "Change image" : "Upload"}
        </button>

        {showLibraryPicker && (
          <button
            type="button"
            onClick={openPicker}
            className="rounded-md border border-gray-300 bg-white px-4 py-2  hover:bg-gray-50 transition-colors"
          >
            From R2 ({prefix}/)
          </button>
        )}

        {value && (
          <span className="font-mono truncate max-w-[200px]">{value}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1 text-red-600">{error}</p>}

      {/* Library picker */}
      {pickerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setPickerOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-160 rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <span>
                R2 library —{" "}
                <span className="font-mono text-gray-600">{prefix}/</span>
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-gray-600 hover:text-gray-600"
              >
                X
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {pickerLoading ? (
                <p className="py-4 text-center">Loading…</p>
              ) : pickerImages.length === 0 ? (
                <p className="py-4 text-center">
                  No images found under{" "}
                  <span className="font-mono">{prefix}/</span>
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {pickerImages.map((img) => (
                    <button
                      key={img.key}
                      type="button"
                      title={img.key}
                      onClick={() => selectFromLibrary(img.key)}
                      className={`relative aspect-square overflow-hidden rounded border-2 transition-colors hover:border-brand-green-dark ${
                        value === img.key
                          ? "border-brand-green-dark"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={img.key}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
