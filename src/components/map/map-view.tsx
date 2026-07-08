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

// Point rouge pulsant — position de l'utilisateur
const userIcon = L.divIcon({
  html: `
    <div style="position:relative;width:28px;height:28px;">
      <div style="
        position:absolute;inset:0;
        background:rgba(220,38,38,0.25);
        border-radius:50%;
        animation:pulse-red 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:16px;height:16px;
        background:#DC2626;
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(220,38,38,0.6);
      "></div>
    </div>
    <style>
      @keyframes pulse-red{
        0%{transform:scale(0.6);opacity:1}
        100%{transform:scale(2.6);opacity:0}
      }
    </style>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
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
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
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

    // Cleanup: stop any running animation before removing to avoid
    // "_leaflet_pos" crash when _onZoomTransitionEnd fires post-unmount.
    return () => {
      if (mapRef.current) {
        mapRef.current.stop();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // 2. Update center and zoom when they change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: false });
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

    // Ajuste la vue pour montrer TOUS les marqueurs (sauf si un itinéraire est affiché,
    // qui gère son propre cadrage). Sans ça, des marqueurs pouvaient être hors écran.
    if (mapRef.current && markers.length > 0 && (!route || route.length === 0)) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      if (markers.length === 1) {
        mapRef.current.setView(markers[0].position, 15);
      } else {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: false });
      }
    }
  }, [markers]);

  // 4. Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Add new user marker and center map on user if no results markers
    if (userLocation) {
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup('<div style="font-weight:600;color:#4285F4">📍 Vous êtes ici</div>')
        .addTo(mapRef.current);

      // Centrer sur l'utilisateur si aucun résultat n'est affiché
      if (markers.length === 0) {
        mapRef.current.setView(userLocation, 15);
      }
    }
  }, [userLocation, markers.length]);

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
      const routeGroup = L.layerGroup().addTo(mapRef.current);
      routeLayerRef.current = routeGroup;

      let outerColor = '#1E3A8A'; // Dark Blue
      let innerColor = '#3B82F6'; // Bright Blue
      let dashArray: string | undefined = undefined;

      if (transportMode === 'walking') {
        outerColor = '#064E3B'; // Dark Green
        innerColor = '#10B981'; // Bright Green
        dashArray = '10, 10';
      } else if (transportMode === 'cycling') {
        outerColor = '#4C1D95'; // Dark Purple
        innerColor = '#8B5CF6'; // Bright Purple
      }

      // Outer shadow/border line
      L.polyline(route, {
        color: outerColor,
        weight: 8,
        opacity: 0.5,
      }).addTo(routeGroup);

      // Inner visible line
      const innerLine = L.polyline(route, {
        color: innerColor,
        weight: 4,
        opacity: 1.0,
        dashArray: dashArray,
      }).addTo(routeGroup);

      // Fit bounds to show the entire route
      mapRef.current.fitBounds(innerLine.getBounds(), {
        padding: [50, 50],
        maxZoom: 16,
        animate: false,
      });
    }
  }, [route, transportMode]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full z-0"
      style={{ minHeight: '300px' }}
    />
  );
};

export default MapView;