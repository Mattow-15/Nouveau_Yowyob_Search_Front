import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { ProductDetailClient } from '@/components/search/detail/product-detail-client';
import { fetchProductForSSR } from '@/lib/api/product-detail.server';
import type { SearchResult } from '@/types/search';

const SITE_URL = 'https://search.yowyob.com';

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Schema.org LocalBusiness — pour les rich results (étoiles, adresse) sur Google.
 *  openingHours volontairement omis : la donnée brute (chaîne "Lundi: 9h-18h | ...")
 *  n'est pas assez structurée pour être convertie en openingHoursSpecification fiable
 *  sans risquer d'émettre des données structurées invalides. */
function buildLocalBusinessJsonLd(product: SearchResult, id: string) {
  const name = product.title || product.name || 'Fiche';
  const lat = product.latitude ?? product.location?.lat;
  const lng = product.longitude ?? product.location?.lng;
  const reviewCount = product.reviewsCount ?? product.reviewCount;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url: `${SITE_URL}/search/${id}`,
  };

  if (product.description) jsonLd.description = product.description;
  if (product.imageUrl?.startsWith('http')) jsonLd.image = product.imageUrl;
  if (product.phone) jsonLd.telephone = product.phone;
  if (product.website) jsonLd.sameAs = [product.website];
  if (product.priceLevel != null) jsonLd.priceRange = '€'.repeat(Math.min(product.priceLevel + 1, 4));

  if (product.street || product.city) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      ...(product.street ? { streetAddress: product.street } : {}),
      ...(product.city ? { addressLocality: product.city } : {}),
      addressCountry: 'CM',
    };
  }

  if (lat != null && lng != null) {
    jsonLd.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  }

  if (product.rating && product.rating > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: reviewCount && reviewCount > 0 ? reviewCount : 1,
    };
  }

  return jsonLd;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductForSSR(id);

  if (!product) {
    return { title: 'Fiche introuvable — Yowyob Search' };
  }

  const name = product.title || product.name || 'Fiche';
  const description = product.description
    || [name, product.category, product.city].filter(Boolean).join(' · ')
    || `Découvrez ${name} sur Yowyob Search.`;

  return {
    title: `${name}${product.city ? ` — ${product.city}` : ''} — Yowyob Search`,
    description,
    openGraph: {
      title: name,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchProductForSSR(id);

  if (!product) notFound();

  const jsonLd = buildLocalBusinessJsonLd(product, id);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        // JSON.stringify échappe déjà les guillemets ; on neutralise en plus toute
        // séquence "</script" pour empêcher une donnée métier de fermer prématurément
        // la balise (les noms/adresses viennent de tiers, pas de contenu qu'on contrôle).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script/gi, '<\\/script') }}
      />
      <ConditionalLayout>
        <ProductDetailClient product={product} />
      </ConditionalLayout>
    </>
  );
}
