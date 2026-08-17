'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AuctionGalleryProps {
  title: string;
  images: string[];
  inWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export default function AuctionGallery({
  title,
  images,
  inWatchlist,
  onToggleWatchlist,
}: AuctionGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(images[0] || '');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
        {selectedImage && (
          <Image
            src={selectedImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}
        <button
          type="button"
          onClick={onToggleWatchlist}
          className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full shadow hover:bg-white transition"
          aria-label="Toggle Watchlist"
        >
          {inWatchlist ? '❤️' : '🤍'}
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                selectedImage === img
                  ? 'border-purple-600'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`${title} preview ${idx + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}