'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { HeaderPublic } from '@/components/layout/header-public';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);

    // Example settings state
    const [notificationsEmail, setNotificationsEmail] = useState(true);
    const [notificationsPush, setNotificationsPush] = useState(true);
    const [language, setLanguage] = useState('fr');

    // Removed auto-redirect
    // useEffect(() => {
    //     if (status === 'unauthenticated') {
    //         router.push('/auth');
    //     }
    // }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            toast.success("Paramètres enregistrés avec succès !");
        }, 800);
    };

    if (status === 'unauthenticated') {
        return (
            <ConditionalLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                fullWidth
                            >
                                Se connecter maintenant
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => router.push('/')}
                                fullWidth
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Paramètres</h1>
                        <p className="text-gray-600 dark:text-gray-400">Gérez vos préférences et votre compte</p>
                    </div>

                    <div className="space-y-6">

                        {/* Section 1: Apparence */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apparence</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Personnalisez l'interface</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-900 dark:text-white">Mode Sombre</span>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition shadow-sm ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Notifications */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos alertes</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Emails promotionnels</span>
                                    <input
                                        type="checkbox"
                                        checked={notificationsEmail}
                                        onChange={(e) => setNotificationsEmail(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                </div>
                                <hr className="border-gray-100 dark:border-gray-700" />
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Notifications Push</span>
                                    <input
                                        type="checkbox"
                                        checked={notificationsPush}
                                        onChange={(e) => setNotificationsPush(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Compte */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compte</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Informations personnelles</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur</label>
                                    <input
                                        type="text"
                                        value={session?.user?.name || ''}
                                        disabled
                                        className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-none cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={session?.user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-none cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    Se déconnecter
                                </Button>
                            </div>
                        </div>

                        {/* Section 4: Sécurité */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sécurité</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Mot de passe et authentification</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                setLoading(true);
                                // Simulate API call
                                setTimeout(() => {
                                    setLoading(false);
                                    toast.success("Mot de passe mis à jour avec succès !");
                                    // Reset fields would go here
                                }, 1500);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={loading}
                                    >
                                        Changer le mot de passe
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSave}
                                disabled={loading}
                                className="min-w-[200px]"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Enregistrement...</span>
                                    </div>
                                ) : (
                                    'Enregistrer les modifications'
                                )}
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </ConditionalLayout>
    );
}
