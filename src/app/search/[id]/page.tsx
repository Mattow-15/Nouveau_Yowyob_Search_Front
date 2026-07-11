import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { ProductDetailClient } from '@/components/search/detail/product-detail-client';
import { fetchProductForSSR } from '@/lib/api/product-detail.server';

interface PageProps {
  params: Promise<{ id: string }>;
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

  return (
    <ConditionalLayout>
      <ProductDetailClient product={product} />
    </ConditionalLayout>
  );
}
