'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { Card } from '@/components/ui/card';
import { httpClient } from '@/lib/api/http-client';
import Link from 'next/link';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (session?.user?.id) {
        try {
          const accessToken = (session as any).user.accessToken;
          const headers = { Authorization: `Bearer ${accessToken}` };
          const data = await httpClient.get<any>(`/api/users/messages/count`, { headers });
          setMessagesCount(data?.count || 0);
        } catch (error) {
          console.error("Error fetching messages", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session) fetchMessages();
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
            <Link href="/profile" className="text-purple-500 hover:underline font-bold text-lg">
              &larr; Retour au profil
            </Link>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-8">Mes Messages</h1>
          
          {messagesCount === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium">Votre messagerie est vide.</p>
              <p className="text-sm mt-2">Vous n'avez aucune conversation en cours.</p>
            </Card>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <p className="text-lg font-medium">Vous avez {messagesCount} message(s).</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
