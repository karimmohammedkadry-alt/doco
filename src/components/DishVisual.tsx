import React, { useState } from 'react';
import { Coffee, Flame, UtensilsCrossed } from 'lucide-react';
import type { MenuItem } from '../types/doko';

interface DishVisualProps {
  item: Pick<MenuItem, 'name' | 'image' | 'accentKind' | 'category'>;
  className?: string;
}

export const DishVisual: React.FC<DishVisualProps> = ({ item, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (item.image && !failed) {
    return (
      <img
        src={item.image}
        alt={item.name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
      />
    );
  }

  // Bespoke crisp white & red editorial illustration for non-photo secondary slots
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-red-50/70 p-6 text-center ${className}`}
    >
      <svg
        viewBox="0 0 180 120"
        className="h-24 w-36 text-red-600/90 transition-transform duration-500 group-hover:scale-105"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="90" cy="60" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.35" />
        <circle cx="90" cy="60" r="34" fill="#DC2626" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.5" />
        {item.accentKind === 'drink' ? (
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M72 42h36l-5 44a4 4 0 0 1-4 3H81a4 4 0 0 1-4-3l-5-44Z" />
            <path d="M95 30l-5 12" />
            <path d="M75 56h30" strokeOpacity="0.5" />
          </g>
        ) : (
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M62 64c0-14 12-24 28-24s28 10 28 24H62Z" />
            <path d="M58 72h64" />
            <path d="M64 78c4 4 48 4 52 0" />
          </g>
        )}
      </svg>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        {item.accentKind === 'drink' ? (
          <Coffee className="h-3.5 w-3.5 text-red-600" />
        ) : item.accentKind === 'burger' ? (
          <Flame className="h-3.5 w-3.5 text-red-600" />
        ) : (
          <UtensilsCrossed className="h-3.5 w-3.5 text-red-600" />
        )}
        <span>{item.category}</span>
      </div>
    </div>
  );
};
