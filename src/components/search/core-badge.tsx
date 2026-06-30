/**
 * Insigne « Données du core » — marque les résultats issus du backend de
 * production YowYob (le core), avec une icône de certification.
 */

'use client';

import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface CoreBadgeProps {
  className?: string;
}

export function CoreBadge({ className = '' }: CoreBadgeProps) {
  return (
    <span
      title="Donnée certifiée provenant du core YowYob (backend de production)"
      className={`inline-flex items-center gap-1 bg-blue-600 text-white rounded-full px-2.5 py-0.5 text-[11px] font-medium ${className}`}
    >
      <BadgeCheck size={12} />
      Données du core
    </span>
  );
}
