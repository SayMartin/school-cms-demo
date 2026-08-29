"use client";

import { useState } from "react";
import { Button } from "@/components/button";

// Click-to-load, not a plain <iframe>. Google's maps embed sets cookies and
// receives the visitor's IP the moment the page renders, which would make
// /privacy wrong on two counts — it promises that reading a page sets no
// cookie, and that Google Fonts is the only third party a page load reaches.
// Nothing is requested from Google until someone asks for the map.
export function MapEmbed({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative mt-3 w-full overflow-hidden border border-gray-200 bg-gray-50"
      style={{ aspectRatio: "7/3" }}
    >
      {loaded ? (
        <iframe
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer"
          title={title}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="max-w-md text-sm text-gray-600">
            The map is loaded from Google Maps. Opening it sends your IP address to
            Google and lets Google set cookies in your browser.
          </p>
          <Button variant="outline-green" size="sm" onClick={() => setLoaded(true)}>
            Load the map
          </Button>
        </div>
      )}
    </div>
  );
}
