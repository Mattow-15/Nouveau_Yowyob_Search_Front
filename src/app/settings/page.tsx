'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { httpClient } from '@/lib/api/http-client';
import { Footer } from '@/components/layout/footer';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Settings state
    const [notificationsEmail, setNotificationsEmail] = useState(true);
    const [notificationsPush, setNotificationsPush] = useState(true);

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Load settings from local storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedEmail = localStorage.getItem('yowyob_notif_email');
            const savedPush = localStorage.getItem('yowyob_notif_push');
            if (savedEmail !== null) setNotificationsEmail(savedEmail === 'true');
            if (savedPush !== null) setNotificationsPush(savedPush === 'true');
        }
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleSaveSettings = () => {
        setLoadingSettings(true);
        // Save to localStorage to persist across reloads
        localStorage.setItem('yowyob_notif_email', String(notificationsEmail));
        localStorage.setItem('yowyob_notif_push', String(notificationsPush));
        
        setTimeout(() => {
            setLoadingSettings(false);
            toast.success("Vos préférences ont été sauvegardées !");
        }, 600);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoadingPassword(true);
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
            
            toast.success("Votre mot de passe a été modifié avec succès !");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error("Password change error:", error);
            toast.error(`Erreur : ${error.message || "Mot de passe actuel incorrect"}`);
        } finally {
            setLoadingPassword(false);
        }
    };

    if (status === 'unauthenticated') {
        return (
            <ConditionalLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Accès Restreint</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Vous devez être connecté pour accéder aux paramètres de votre compte et personnaliser votre expérience.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => router.push('/auth')}
                                className="w-full font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Se connecter maintenant
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => router.push('/')}
                                className="w-full font-bold active:scale-95 transition-all"
                            >
                                Retour à l'accueil
                            </Button>
                        </div>
                    </div>
                </div>
            </ConditionalLayout>
        );
    }

    return (
        <ConditionalLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-8 pb-12 px-6 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl font-black text-white mb-2 drop-shadow-md">Paramètres du Compte</h1>
                        <p className="text-blue-100 font-medium text-sm max-w-xl mx-auto">
                            Gérez vos préférences de confidentialité, de sécurité et d'apparence.
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 -mt-6 space-y-6">
                    
                    {/* Section 1: Apparence */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 rounded-2xl text-purple-600 dark:text-purple-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apparence</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Personnalisez l'interface utilisateur</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <div className="flex items-center gap-4">
                                <span className="font-semibold text-gray-900 dark:text-white">Thème Sombre (Dark Mode)</span>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition shadow-sm ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}>
                                    {theme === 'dark' ? (
                                        <svg className="w-4 h-4 m-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                                    ) : (
                                        <svg className="w-4 h-4 m-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path></svg>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Notifications */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 rounded-2xl text-blue-600 dark:text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos alertes et communications</p>
                            </div>
                        </div>

                        <div className="space-y-4 p-2">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <span className="block font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">Emails promotionnels</span>
                                    <span className="text-sm text-gray-500">Recevez nos offres et actualités.</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={notificationsEmail}
                                        onChange={(e) => setNotificationsEmail(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            
                            <hr className="border-gray-100 dark:border-gray-700/50" />
                            
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <span className="block font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">Notifications Push</span>
                                    <span className="text-sm text-gray-500">Alertes sur les nouveaux produits.</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={notificationsPush}
                                        onChange={(e) => setNotificationsPush(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                        
                        <div className="flex justify-end pt-6 mt-4 border-t border-gray-100 dark:border-gray-700">
                            <Button
                                variant="primary"
                                onClick={handleSaveSettings}
                                disabled={loadingSettings}
                                className="font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {loadingSettings ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sauvegarde...</span>
                                    </div>
                                ) : (
                                    'Enregistrer les préférences'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Section 3: Compte */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900/40 rounded-2xl text-green-600 dark:text-green-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mon Compte</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Informations de base</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom d'utilisateur</label>
                                <input
                                    type="text"
                                    value={session?.user?.name || ''}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-not-allowed font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={session?.user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-not-allowed font-medium"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <div>
                                <h3 className="font-bold text-red-800 dark:text-red-400">Déconnexion</h3>
                                <p className="text-sm text-red-600/80 dark:text-red-400/80">Fermer votre session actuelle</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-900/50 font-bold"
                            >
                                Se déconnecter
                            </Button>
                        </div>
                    </div>

                    {/* Section 4: Sécurité */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 border-t-4 border-t-red-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/40 rounded-2xl text-red-600 dark:text-red-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sécurité du Compte</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Modifier votre mot de passe</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mot de passe actuel</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        placeholder="Min. 6 caractères"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        placeholder="Min. 6 caractères"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={loadingPassword}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    {loadingPassword ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Mise à jour...</span>
                                        </div>
                                    ) : (
                                        'Mettre à jour le mot de passe'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
            <Footer />
        </ConditionalLayout>
    );
}
