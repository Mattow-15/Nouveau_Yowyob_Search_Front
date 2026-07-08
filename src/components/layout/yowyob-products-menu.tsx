'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { YOWYOB_SERVICES } from '@/lib/constants/yowyob-services';
import { cn } from '@/lib/utils';

interface YowyobProductsMenuProps {
  className?: string;
}

export const YowyobProductsMenu: React.FC<YowyobProductsMenuProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Yowyob Products — services de l'écosystème"
        title="Yowyob Products"
        className={cn(
          'p-2.5 rounded-full transition-colors',
          open
            ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
        )}
      >
        <LayoutGrid className="w-5 h-5" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl shadow-black/10 dark:shadow-black/40 z-[60] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Yowyob Products</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Accéder aux services de l&apos;écosystème
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 p-3">
            {YOWYOB_SERVICES.map((service) => {
              const content = (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-xl group-hover:scale-105 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all">
                    {service.emoji}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight mt-2 line-clamp-2">
                    {service.name}
                  </span>
                </>
              );

              const itemClass =
                'group flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors';

              if (service.external) {
                return (
                  <a
                    key={service.id}
                    href={service.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    title={service.description}
                    className={itemClass}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={service.id}
                  href={service.href}
                  role="menuitem"
                  title={service.description}
                  className={itemClass}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
