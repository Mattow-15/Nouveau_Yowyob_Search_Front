'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

/** Bouton "Rejoindre Yowyob" — masqué si déjà connecté. Isolé en client component
 * pour que les pages qui l'utilisent (about, ...) restent des Server Components. */
export function JoinCtaButton() {
  const { data: session } = useSession();
  if (session) return null;

  return (
    <Link href="/auth">
      <button className="px-8 py-4 bg-transparent text-white font-bold rounded-2xl border-2 border-white hover:bg-white/10 dark:hover:bg-white/20 transition-all">
        Rejoindre Yowyob
      </button>
    </Link>
  );
}
