'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HeaderPublic } from '@/components/layout/header-public';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { searchService } from '@/lib/api/search-service';
import { geoService } from '@/lib/api/geo-service';
import { SearchResult } from '@/types/search';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

// Dynamic import for MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map/map-view'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">Chargement de la carte...</div>
});

export default function ProductDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    const [product, setProduct] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [route, setRoute] = useState<Array<[number, number]> | null>(null);
    const [calculatingRoute, setCalculatingRoute] = useState(false);

    const [showContactInfo, setShowContactInfo] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await searchService.getProductById(id as string);
                if (data) {
                    setProduct(data);
                } else {
                    toast.error("Produit non trouvé");
                    router.push('/search');
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Erreur lors du chargement du produit");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id, router]);

    const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
    const [routeDetails, setRouteDetails] = useState<{ distance: number, duration: number } | null>(null);

    const handleGetDirections = React.useCallback(async () => {
        if (!product || !product.location) return;

        setCalculatingRoute(true);
        // Reset details when recalculating
        setRouteDetails(null);
        try {
            // 1. Get user location (try browser first, then IP)
            // If we already have user location, use it
            let location = userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null;

            if (!location) {
                try {
                    location = await geoService.getCurrentPosition();
                } catch (e) {
                    console.warn("Browser geo failed, trying IP...", e);
                    location = await geoService.getIpLocation();
                }
            }

            if (!location) {
                toast.error("Impossible de déterminer votre position");
                return;
            }

            setUserLocation([location.lat, location.lng]);

            // 2. Get route
            const routeInfo = await geoService.getRoute(
                { lat: location.lat, lng: location.lng },
                { lat: product.location.lat, lng: product.location.lng },
                transportMode
            );

            if (routeInfo && routeInfo.polyline) {
                // If it's a JSON string of points [[lat, lng], ...]
                try {
                    const points = JSON.parse(routeInfo.polyline);
                    setRoute(points);
                    setRouteDetails({ distance: routeInfo.distance, duration: routeInfo.duration });
                } catch {
                    // If it's something else, fallback to direct line
                    setRoute([[location.lat, location.lng], [product.location.lat, product.location.lng]]);
                }
                toast.success(`Itinéraire (${transportMode === 'driving' ? 'voiture' : transportMode === 'walking' ? 'à pied' : 'vélo'}) calculé !`);
            }
        } catch (error) {
            console.error("Error getting directions:", error);
            toast.error("Erreur lors du calcul de l'itinéraire");
        } finally {
            setCalculatingRoute(false);
        }
    }, [product, userLocation, transportMode]);

    // Recalculate route when transport mode changes if we already have a route
    useEffect(() => {
        if (route && userLocation) {
            handleGetDirections();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transportMode]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Chargement des détails...</p>
            </div>
        );
    }

    if (!product) return null;

    return (
        <>
            {session ? (
                <HeaderAuthenticated userName={session.user?.name || undefined} />
            ) : (
                <HeaderPublic />
            )}

            <main className="min-h-screen bg-white dark:bg-gray-900 pb-20 relative">
                {/* Contact Modal */}
                {showContactInfo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full relative transform transition-all scale-100">
                            <button
                                onClick={() => setShowContactInfo(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">
                                    {product.shop.name.charAt(0)}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.shop.name}</h2>
                                <p className="text-sm text-gray-500">{product.shop.description}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Service Client</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{product.shop.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                                        <p className="font-semibold text-gray-900 dark:text-white break-all">{product.shop.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Adresse</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{product.shop.address}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowContactInfo(false)}
                                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Breadcrumb / Back button */}
                    <button
                        onClick={() => {
                            // Use browser back if there's history, otherwise go to search page
                            if (window.history.length > 1) {
                                router.back();
                            } else {
                                router.push('/search');
                            }
                        }}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 group"
                    >
                        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Retour aux résultats
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Column: Images & Key Info */}
                        <div className="space-y-8">
                            <div className="rounded-3xl overflow-hidden shadow-2xl bg-gray-100 aspect-square relative group">
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 right-4">
                                    <span className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full font-bold shadow-lg">
                                        {product.type.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img, i) => (
                                    <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-blue-600 cursor-pointer transition-all shadow-md">
                                        <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Details & Shop */}
                        <div className="flex flex-col h-full">
                            <div className="flex-1">
                                <div className="mb-2 text-sm font-medium text-blue-600 uppercase tracking-widest">{product.category}</div>
                                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{product.name}</h1>

                                {/* City & Quartier */}
                                {(product.city || product.quartier) && (
                                    <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
                                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-base font-medium">
                                            {[product.quartier, product.city].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mb-6">
                                    {product.price && product.price > 0 ? (
                                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(product.price)}
                                        </div>
                                    ) : (
                                        <div className="text-xl font-medium text-gray-500 italic">Prix non spécifié</div>
                                    )}
                                    {product.rating > 0 && (
                                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full font-semibold">
                                            ★ {product.rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>

                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                    {product.description}
                                </p>

                                {/* Shop Card */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xl">
                                            {product.shop.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{product.shop.name}</div>
                                            <div className="text-sm text-gray-500">{product.shop.address}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowContactInfo(true)}
                                        className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-blue-600 dark:text-blue-400"
                                    >
                                        Contacter le vendeur
                                    </button>
                                </div>
                            </div>




                            {/* Routing Controls */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
                                    </svg>
                                    Itinéraire
                                </h3>

                                {/* Transport Mode Selection */}
                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => setTransportMode('driving')}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${transportMode === 'driving'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                                        </svg>
                                        Voiture
                                    </button>
                                    <button
                                        onClick={() => setTransportMode('walking')}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${transportMode === 'walking'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L11 9l-4-1.5L9 2M16 3l-5 6h-2a2 2 0 00-2 2v6" />
                                        </svg>
                                        À pied
                                    </button>
                                </div>

                                {/* Results Display (Hidden until calculated) */}
                                {routeDetails && (
                                    <div className="mb-6 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                                        <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Distance</div>
                                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                {(routeDetails.distance / 1000).toFixed(1)} <span className="text-sm font-medium text-gray-400">km</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Durée</div>
                                            <div className="text-2xl font-black text-green-600 dark:text-green-400">
                                                {Math.round(routeDetails.duration / 60)} <span className="text-sm font-medium text-gray-400">min</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleGetDirections}
                                        disabled={calculatingRoute}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {calculatingRoute ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Calcul en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                Calculer l&apos;itinéraire
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (!route && !calculatingRoute) handleGetDirections(); // Auto-calc if not ready
                                            // Scroll to map
                                            document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="w-full py-3.5 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Montrer l&apos;itinéraire
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div id="map-section" className="mt-16 bg-white dark:bg-gray-900 rounded-4xl border border-gray-100 dark:border-gray-800 p-8 shadow-inner relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Localisation</h2>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div> Produit
                                <div className="w-3 h-3 rounded-full bg-red-500 ml-4"></div> Vous
                            </div>
                        </div>

                        <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
                            <MapView
                                center={[product.location?.lat || 3.848, product.location?.lng || 11.5021]}
                                zoom={14}
                                markers={[{
                                    id: product.id,
                                    position: [product.location?.lat || 3.848, product.location?.lng || 11.5021],
                                    title: product.name,
                                    description: product.shop.name
                                }]}
                                userLocation={userLocation || undefined}
                                route={route || undefined}
                                transportMode={transportMode}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
