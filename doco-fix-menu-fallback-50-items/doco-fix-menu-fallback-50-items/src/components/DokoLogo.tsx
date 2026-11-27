import React from 'react';

interface DokoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DokoLogo: React.FC<DokoLogoProps> = ({ size = 'md', className = '' }) => {
  const dims =
    size === 'sm'
      ? 'h-10 w-24'
      : size === 'lg'
      ? 'h-24 w-48'
      : 'h-14 w-32';

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-black ${dims} ${className}`}
    >
      <img
        src="/assets/aistudio/WhatsApp_Image_2026-11-27_at_10.20.57_PM_322dd566.jpeg"
        alt="DOKO Restaurant"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain"
      />
    </div>
  );
};
