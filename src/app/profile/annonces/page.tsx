'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { Card } from '@/components/ui/card';
import { httpClient } from '@/lib/api/http-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import Link from 'next/link';

export default function AnnoncesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchListings = async () => {
      if (session?.user?.id) {
        try {
          const accessToken = (session as any).user.accessToken;
          const headers = { Authorization: `Bearer ${accessToken}` };
          const data = await httpClient.get<any[]>(API_ENDPOINTS.LISTINGS_BY_SELLER(session.user.id), { headers });
          setListings(data || []);
        } catch (error) {
          console.error("Error fetching listings", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session) fetchListings();
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
            <Link href="/profile" className="text-blue-500 hover:underline font-bold text-lg">
              &larr; Retour au profil
            </Link>
          </div>
          <h1 className="text-3xl font-black gradient-text mb-8">Mes Annonces</h1>
          
          {listings.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              <p className="text-lg font-medium">Vous n'avez pas encore publié d'annonces.</p>
              <Link href="/merchant/products">
                <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                  Créer une annonce
                </button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {listings.map((item, idx) => (
                <Card key={idx} className="p-6">
                  <h3 className="text-xl font-bold mb-2">{item.title || 'Annonce sans titre'}</h3>
                  <p className="text-gray-600 mb-4">{item.description || 'Aucune description fournie.'}</p>
                  <p className="font-black text-blue-600">{item.price ? `${item.price} FCFA` : 'Prix sur demande'}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
