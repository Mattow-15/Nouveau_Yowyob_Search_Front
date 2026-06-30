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

const MapView = dynamic(() => import('@/components/map/map-view'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
            Chargement de la carte...
        </div>
    )
});

// ── Helpers ────────────────────────────────────────────────────────────────

function getPriceSymbols(level?: number): string {
    if (level === undefined || level === null) return '';
    return '$'.repeat(Math.min(level + 1, 4));
}

function OpenStatusBadge({ openNow }: { openNow?: boolean }) {
    if (openNow === undefined || openNow === null) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
            openNow
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
            <span className={`w-2 h-2 rounded-full ${openNow ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {openNow ? 'Ouvert maintenant' : 'Fermé'}
        </span>
    );
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
        <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
                <span key={i} className={`text-lg ${
                    i <= full ? 'text-yellow-400'
                    : i === full + 1 && half ? 'text-yellow-300'
                    : 'text-gray-300'
                }`}>★</span>
            ))}
            <span className="ml-1 font-bold text-gray-900 dark:text-white">{rating.toFixed(1)}</span>
            {count && <span className="text-sm text-gray-500">({count} avis)</span>}
        </div>
    );
}

// ── Composant principal ────────────────────────────────────────────────────

export default function ProductDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    const [product, setProduct] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [productActualLocation, setProductActualLocation] = useState<[number, number] | null>(null);
    const [route, setRoute] = useState<Array<[number, number]> | null>(null);
    const [calculatingRoute, setCalculatingRoute] = useState(false);
    const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
    const [routeDetails, setRouteDetails] = useState<{ distance: number; duration: number } | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showAllHours, setShowAllHours] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await searchService.getProductById(id as string);
                if (data) {
                    setProduct(data);
                    const pLat = data.latitude || data.location?.lat || 3.848;
                    const pLng = data.longitude || data.location?.lng || 11.5021;
                    setProductActualLocation([pLat, pLng]);
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

    const handleGetDirections = React.useCallback(async () => {
        if (!product) return;
        setCalculatingRoute(true);
        setRouteDetails(null);
        try {
            let location = userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null;
            if (!location) location = await geoService.getIpLocation();
            if (!location) { toast.error("Impossible de déterminer votre position"); return; }
            setUserLocation([location.lat, location.lng]);

            const productLat = productActualLocation?.[0] || 3.848;
            const productLng = productActualLocation?.[1] || 11.5021;

            const routeInfo = await geoService.getRoute(
                { lat: location.lat, lng: location.lng },
                { lat: productLat, lng: productLng },
                transportMode
            );

            if (routeInfo?.polyline) {
                try {
                    const points = JSON.parse(routeInfo.polyline);
                    setRoute(points);
                    setRouteDetails({ distance: routeInfo.distance, duration: routeInfo.duration });
                } catch {
                    setRoute([[location.lat, location.lng], [productLat, productLng]]);
                }
                toast.success('Itinéraire calculé !');
            }
        } catch (error) {
            console.error("Error getting directions:", error);
            toast.error("Erreur lors du calcul de l'itinéraire");
        } finally {
            setCalculatingRoute(false);
        }
    }, [product, userLocation, transportMode, productActualLocation]);

    useEffect(() => {
        if (route && userLocation) handleGetDirections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transportMode]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Chargement des détails...</p>
            </div>
        );
    }

    if (!product) return null;

    // Images : imageUrl Google Places ou images existantes
    const images: string[] = product.imageUrl
        ? [product.imageUrl, ...(product.images || []).filter(i => i !== product.imageUrl)]
        : (product.images || []);

    // Horaires : split par " | "
    const hoursLines = product.openingHours
        ? product.openingHours.split(' | ')
        : [];

    return (
        <>
            {session ? (
                <HeaderAuthenticated userName={session.user?.name || undefined} />
            ) : (
                <HeaderPublic />
            )}

            <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                    {/* Retour */}
                    <button
                        onClick={() => window.history.length > 1 ? router.back() : router.push('/search')}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Retour aux résultats
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                        {/* ── Colonne gauche : Images ───────────────────────── */}
                        <div className="space-y-4">
                            <div className="rounded-3xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800 aspect-square relative">
                                {images.length > 0 ? (
                                    <img
                                        src={images[activeImageIndex]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-8xl">
                                        {product.category === 'restaurant' ? '🍽️'
                                            : product.category === 'pharmacy' ? '💊'
                                            : product.category === 'bank' ? '🏦'
                                            : product.category === 'hospital' ? '🏥'
                                            : '🏪'}
                                    </div>
                                )}

                                {/* Badge source */}
                                {product.source === 'google_places' && (
                                    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow-md flex items-center gap-1">
                                        <span>📍</span> Google Places
                                    </div>
                                )}

                                {/* Badge statut ouvert */}
                                <div className="absolute top-4 right-4">
                                    <OpenStatusBadge openNow={product.openNow} />
                                </div>
                            </div>

                            {/* Miniatures */}
                            {images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImageIndex(i)}
                                            className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                                                i === activeImageIndex
                                                    ? 'border-blue-600 shadow-lg'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            <img src={img} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Horaires d'ouverture */}
                            {hoursLines.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        🕒 Horaires d'ouverture
                                    </h3>
                                    <div className="space-y-1.5">
                                        {(showAllHours ? hoursLines : hoursLines.slice(0, 3)).map((line, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {line.split(':')[0]}
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {line.split(':').slice(1).join(':')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {hoursLines.length > 3 && (
                                        <button
                                            onClick={() => setShowAllHours(!showAllHours)}
                                            className="mt-2 text-xs text-blue-600 hover:underline"
                                        >
                                            {showAllHours ? 'Voir moins' : `Voir tous les horaires (${hoursLines.length})`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Colonne droite : Détails ──────────────────────── */}
                        <div className="flex flex-col gap-6">

                            {/* En-tête */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                        {product.category}
                                    </span>
                                    {product.priceLevel !== undefined && product.priceLevel !== null && (
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                            · {getPriceSymbols(product.priceLevel)}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
                                    {product.title}
                                </h1>

                                {/* Note */}
                                {product.rating && product.rating > 0 && (
                                    <div className="mb-3">
                                        <StarRating rating={product.rating} count={product.reviewsCount} />
                                    </div>
                                )}

                                {/* Adresse */}
                                {(product.street || product.city) && (
                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                                        <span className="text-blue-500 mt-0.5">📍</span>
                                        <span>
                                            {[product.street, product.city].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}

                                {/* Téléphone */}
                                {product.phone && (
                                    <a
                                        href={`tel:${product.phone}`}
                                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 w-fit"
                                    >
                                        <span>📞</span> {product.phone}
                                    </a>
                                )}

                                {/* Site web */}
                                {product.website && (
                                    <a
                                        href={product.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 w-fit"
                                    >
                                        <span>🌐</span>
                                        {product.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Résumé des avis Google (reviewsSummary) */}
                            {product.reviewsSummary && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-800">
                                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-3 flex items-center gap-2">
                                        💬 Avis des clients
                                    </h3>
                                    <div className="space-y-3">
                                        {product.reviewsSummary.split(' || ').filter(Boolean).map((review, i) => {
                                            const parts = review.split(':');
                                            const author = parts[0]?.trim();
                                            const text = parts.slice(1).join(':').trim();
                                            return (
                                                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
                                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                        {author}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
                                                        "{text}"
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Boutons d'action */}
                            <div className="flex flex-col gap-3">
                                {/* Voir sur Google Maps */}
                                {product.googleMapsUrl && (
                                    <a
                                        href={product.googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all"
                                    >
                                        <span>🗺️</span>
                                        Voir sur Google Maps
                                    </a>
                                )}

                                {/* Téléphoner */}
                                {product.phone && (
                                    <a
                                        href={`tel:${product.phone}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                                    >
                                        <span>📞</span>
                                        Appeler maintenant
                                    </a>
                                )}
                            </div>

                            {/* Itinéraire */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    🧭 Itinéraire
                                </h3>

                                {/* Mode de transport */}
                                <div className="flex gap-2 mb-4">
                                    {(['driving', 'walking'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setTransportMode(mode)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                transportMode === mode
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                            }`}
                                        >
                                            {mode === 'driving' ? '🚗 Voiture' : '🚶 À pied'}
                                        </button>
                                    ))}
                                </div>

                                {/* Résultats de l'itinéraire */}
                                {routeDetails && (
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                                            <div className="text-xs text-gray-500 mb-1">Distance</div>
                                            <div className="text-xl font-black text-blue-600">
                                                {(routeDetails.distance / 1000).toFixed(1)}
                                                <span className="text-sm font-medium text-gray-400"> km</span>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center">
                                            <div className="text-xs text-gray-500 mb-1">Durée</div>
                                            <div className="text-xl font-black text-green-600">
                                                {Math.round(routeDetails.duration / 60)}
                                                <span className="text-sm font-medium text-gray-400"> min</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        if (!route && !calculatingRoute) handleGetDirections();
                                        document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    disabled={calculatingRoute}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {calculatingRoute ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Calcul en cours...
                                        </>
                                    ) : (
                                        '📍 Montrer l\'itinéraire'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Carte ─────────────────────────────────────────────── */}
                    <div id="map-section" className="mt-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                📍 Localisation
                            </h2>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Commerce
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Vous
                                </span>
                            </div>
                        </div>
                        <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <MapView
                                center={productActualLocation || [3.848, 11.5021]}
                                zoom={15}
                                markers={[{
                                    id: product.id,
                                    position: productActualLocation || [3.848, 11.5021],
                                    title: product.title ?? product.name ?? '',
                                    description: product.city || ''
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
