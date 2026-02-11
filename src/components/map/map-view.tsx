'use client';

import React, { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface MapViewProps {
  center: [number, number];
  zoom: number;
  markers: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
  }>;
  userLocation?: [number, number];
  route?: Array<[number, number]>;
  transportMode?: 'driving' | 'walking' | 'cycling';
}

// Custom icons
const productIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzA2NjZGRiI+PHBhdGggZD0iTTEyIDJDNy41ODMgMiA0IDUuNTgzIDQgMTBjMCA1LjIxMyA3IDEwIDggMTBzOC00Ljc4NyA4LTEwYzAtNC40MTctMy41ODMtOC04LTh6bTAgMTJhNCA0IDAgMTEtMC0wIDQgNCAwIDAxMCAweiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0VGNDQ0NCI+PHBhdGggZD0iTTEyIDJDNy41ODMgMiA0IDUuNTgzIDQgMTBjMCA1LjIxMyA3IDEwIDggMTBzOC00Ljc4NyA4LTEwYzAtNC40MTctMy41ODMtOC04LTh6bTAgMTJhNCA0IDAgMTEtMC0wIDQgNCAwIDAxMCAweiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom,
  markers,
  userLocation,
  route,
  transportMode = 'driving',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // 1. Initialize the map ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    // If there's already a map on this container, remove it first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Force a resize after a short delay to fix grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Cleanup: remove map on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // 2. Update center and zoom when they change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // 3. Update markers when they change
  useEffect(() => {
    if (!markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers
    markers.forEach((marker) => {
      const leafletMarker = L.marker(marker.position, { icon: productIcon });
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${marker.title}</h3>
          ${marker.description ? `<p class="text-sm text-gray-600 mt-1">${marker.description}</p>` : ''}
        </div>
      `;
      leafletMarker.bindPopup(popupContent, { className: 'rounded-lg shadow-lg' });
      markersLayerRef.current!.addLayer(leafletMarker);
    });
  }, [markers]);

  // 4. Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Add new user marker
    if (userLocation) {
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
        .bindPopup('Votre position')
        .addTo(mapRef.current);
    }
  }, [userLocation]);

  // 5. Update route
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // Add new route
    if (route && route.length > 0) {
      routeLayerRef.current = L.polyline(route, {
        color: '#0666FF',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapRef.current);
    }
  }, [route]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full z-0"
      style={{ minHeight: '300px' }}
    />
  );
};

export default MapView;