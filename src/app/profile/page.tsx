/**
 * Profile page
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-07
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { httpClient } from '@/lib/api/http-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [listingCount, setListingCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'security'>('overview');

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phoneNumber: '',
    address: '',
    city: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const accessToken = (session as any)?.user?.accessToken;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  const fetchData = React.useCallback(async () => {
    if (session?.user?.id && accessToken) {
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const profile = await httpClient.get<any>(API_ENDPOINTS.USER_PROFILE, { headers });
        setProfileData(profile);
        setFormData({
          firstName: profile?.firstName || session.user?.name?.split(' ')[0] || '',
          lastName: profile?.lastName || session.user?.name?.split(' ').slice(1).join(' ') || '',
          bio: profile?.bio || '',
          phoneNumber: profile?.phoneNumber || '',
          address: profile?.address || '',
          city: profile?.city || ''
        });

        const listings = await httpClient.get<any[]>(API_ENDPOINTS.LISTINGS_BY_SELLER(session.user.id), { headers });
        setListingCount(listings?.length || 0);

        try {
          const favorites = await httpClient.get<any[]>(API_ENDPOINTS.USER_FAVORITES, { headers });
          setFavoriteCount(favorites?.length || 0);
        } catch (e) {
          console.warn("Favoris indisponibles");
        }

        try {
          const messages = await httpClient.get<any>(`/api/users/messages/count`, { headers });
          setMessageCount(messages?.count || 0);
        } catch (e) {
          console.warn("Messages indisponibles");
        }
      } catch (error: any) {
        console.error("Error fetching profile data", error);
        toast.error("Échec du chargement des données. Veuillez vous reconnecter.");
      }
    }
  }, [session, accessToken]);

  useEffect(() => {
    if (session && accessToken) fetchData();
  }, [session, accessToken, fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!session?.user) throw new Error("Non authentifié");
      const accessToken = (session as any).user.accessToken as string;
      const userId = (session as any).user?.id || '';
      
      const headers: Record<string, string> = { 
        Authorization: `Bearer ${accessToken}`
      };
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      await httpClient.put(API_ENDPOINTS.USER_PROFILE, formData, { headers });
      toast.success("Profil mis à jour avec succès !");
      setProfileData({ ...profileData, ...formData });
      setActiveTab('overview');
    } catch (error: any) {
      console.error("Save error details:", error);
      toast.error(`Erreur lors de la sauvegarde : ${error.message || "Serveur inaccessible"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!session?.user) throw new Error("Non authentifié");
      const accessToken = (session as any).user.accessToken as string;
      const userId = (session as any).user?.id || '';
      
      const headers: Record<string, string> = { 
        Authorization: `Bearer ${accessToken}`
      };
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      await httpClient.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { headers });
      
      toast.success("Mot de passe modifié avec succès !");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('overview');
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(`Erreur : ${error.message || "Mot de passe actuel incorrect"}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const displayName = profileData?.firstName
    ? `${profileData.firstName} ${profileData.lastName || ''}`
    : session.user?.name;

  return (
    <>
      <HeaderAuthenticated userName={session.user?.name || undefined} />
      <div className="min-h-screen pb-16 bg-gray-50 dark:bg-gray-900">
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-48 w-full relative">
          <div className="absolute -bottom-16 left-0 right-0 max-w-5xl mx-auto px-6 flex items-end gap-6">
            <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full p-2 shadow-2xl flex-shrink-0 relative">
               <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-5xl font-black">
                 {displayName?.[0]?.toUpperCase() || 'U'}
               </div>
            </div>
            <div className="mb-2 hidden sm:block">
               <h1 className="text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">{displayName}</h1>
               <p className="text-gray-600 dark:text-gray-300 font-medium">{session.user?.email}</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 mt-20">
          <div className="sm:hidden mb-6 text-center">
             <h1 className="text-2xl font-black text-gray-900 dark:text-white">{displayName}</h1>
             <p className="text-gray-500 dark:text-gray-400 font-medium">{session.user?.email}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1 space-y-2">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Aperçu
              </button>
              <button 
                onClick={() => setActiveTab('edit')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'edit' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Modifier le profil
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'security' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                Sécurité
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link href="/profile/annonces" className="transition-transform hover:-translate-y-1">
                      <Card className="p-6 text-center border-b-4 border-blue-500 h-full shadow-sm">
                        <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">{listingCount}</div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Annonces</p>
                      </Card>
                    </Link>
                    <Link href="/profile/favoris" className="transition-transform hover:-translate-y-1">
                      <Card className="p-6 text-center border-b-4 border-cyan-400 h-full shadow-sm">
                        <div className="text-4xl font-black text-cyan-600 dark:text-cyan-400 mb-2">{favoriteCount}</div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Favoris</p>
                      </Card>
                    </Link>
                    <Link href="/profile/messages" className="transition-transform hover:-translate-y-1">
                      <Card className="p-6 text-center border-b-4 border-purple-500 h-full shadow-sm">
                        <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">{messageCount}</div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Messages</p>
                      </Card>
                    </Link>
                  </div>

                  <Card className="p-8 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">À propos de moi</h2>
                    {profileData?.bio ? (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{profileData.bio}</p>
                    ) : (
                      <p className="text-gray-400 italic mb-8">Aucune biographie renseignée.</p>
                    )}
                    
                    <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">Coordonnées</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-blue-600">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-bold">Téléphone</p>
                           <p className="font-semibold text-gray-900 dark:text-white">{profileData?.phoneNumber || 'Non renseigné'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-blue-600">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-bold">Localisation</p>
                           <p className="font-semibold text-gray-900 dark:text-white">{[profileData?.address, profileData?.city].filter(Boolean).join(', ') || 'Non renseignée'}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <Card className="p-8 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Modifier mes informations</h2>
                    <form onSubmit={handleSave} className="grid gap-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Prénom</label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Prénom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom</label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Nom"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Biographie</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="Parlez-nous de vous..."
                          rows={4}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Ex: +237 600 000 000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ville</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Ville"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Adresse détaillée</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="Adresse complète"
                        />
                      </div>

                      <div className="flex justify-end pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                        >
                          {isSaving ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sauvegarde...</>
                          ) : (
                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Enregistrer les modifications</>
                          )}
                        </button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <Card className="p-8 shadow-sm border-t-4 border-red-500">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                      Sécurité du compte
                    </h2>
                    <p className="text-gray-500 mb-8">Modifiez votre mot de passe pour sécuriser votre compte. Assurez-vous d'utiliser un mot de passe fort.</p>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mot de passe actuel</label>
                        <input
                          type="password"
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50"
                          value={passwordData.currentPassword}
                          onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="************"
                          required
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
                        <input
                          type="password"
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50"
                          value={passwordData.newPassword}
                          onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Nouveau mot de passe secret"
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirmer le nouveau mot de passe</label>
                        <input
                          type="password"
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50"
                          value={passwordData.confirmPassword}
                          onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirmer"
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div className="pt-6">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 active:scale-95 flex items-center justify-center gap-2"
                        >
                          {isChangingPassword ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Modification...</>
                          ) : (
                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> Modifier le mot de passe</>
                          )}
                        </button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}