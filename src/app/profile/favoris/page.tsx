'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { Card } from '@/components/ui/card';
import { httpClient } from '@/lib/api/http-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import Link from 'next/link';

export default function FavorisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (session?.user?.id) {
        try {
          const accessToken = (session as any).user.accessToken;
          const headers = { Authorization: `Bearer ${accessToken}` };
          const data = await httpClient.get<any[]>(API_ENDPOINTS.USER_FAVORITES, { headers });
          setFavorites(data || []);
        } catch (error) {
          console.error("Error fetching favorites", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session) fetchFavorites();
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <HeaderAuthenticated userName={session.user?.name || undefined} />
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/profile" className="text-cyan-500 hover:underline font-bold text-lg">
              &larr; Retour au profil
            </Link>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8">Mes Favoris</h1>
          
          {favorites.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-lg font-medium">Vous n'avez pas encore d'annonces favorites.</p>
              <p className="text-sm mt-2">Explorez le catalogue et mettez en favori les annonces qui vous intéressent.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {favorites.map((item, idx) => (
                <Card key={idx} className="p-6">
                  Contenu Favori
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
