import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className = '' }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error || !src) {
    return (
      <div
        className={`w-full h-full min-h-[180px] bg-warm-200 text-ink-500 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-warm-300 flex items-center justify-center mb-2 text-ink-600">
          <ImageOff className="w-6 h-6" />
        </div>
        <p className="text-xs font-medium text-ink-600 line-clamp-2 px-2">{alt || 'Image Preview'}</p>
        <span className="text-[10px] text-ink-400 mt-1">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-warm-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
