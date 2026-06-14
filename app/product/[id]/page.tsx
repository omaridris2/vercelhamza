// app/product/[id]/page.tsx
import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductPageClient from './ProductPageClient';

type ProductMenuOption = {
  id: number;
  option_name: string;
  price: number;
  price_type: 'fixed' | 'percentage';
};

type ProductMenu = {
  id: number;
  name: string;
  product_menu_options: ProductMenuOption[];
};

type Product = {
  id: number;
  name: string;
  image_url: string | null;
  product_menus: ProductMenu[];
};

interface PageProps {
  params: { id: string };
}

export default async function ProductPage({ params }: PageProps) {
  const { id: productId } = await params;

  if (!productId) {
    return <div className="p-6 text-center">Invalid Product ID</div>;
  }

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      image_url,
      product_menus (
        id,
        name,
        product_menu_options (
          id,
          option_name,
          price,
          price_type
        )
      )
    `)
    .eq('id', productId)
    .single();

  if (error || !product) {
    return <div className="p-6 text-center">Product not found</div>;
  }

  return <ProductPageClient product={product as Product} />;
}
