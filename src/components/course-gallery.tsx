"use client";

import Image from "next/image";
import { useState } from "react";
import { mediaUrl } from "@/lib/r2/client";

const BATCH = 6;

export function CourseGallery({ imageKeys }: { imageKeys: string[] }) {
  const [visible, setVisible] = useState(BATCH);
  if (imageKeys.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4">Bilder</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {imageKeys.slice(0, visible).map((key) => (
          <div
            key={key}
            className="relative aspect-square w-full overflow-hidden"
          >
            <Image
              src={mediaUrl(key)}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
      {visible < imageKeys.length && (
        <button
          onClick={() => setVisible((v) => v + BATCH)}
          className="mt-4 text-sm font-medium text-brand-green-dark hover:underline"
        >
          Visa fler bilder ↓ ({imageKeys.length - visible} kvar)
        </button>
      )}
    </section>
  );
}
