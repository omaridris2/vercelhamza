 'use client';

import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabaseClient';

type ProductMenuOption = {
  id: number;
  option_name: string;
  price: number;
};

type ProductMenu = {
  id: number;
  name: string;
  product_menu_options: ProductMenuOption[];
};

type Product = {
  id: number;
  name: string;
  image_url: string;
  product_menus: ProductMenu[];
};

interface ProductPageClientProps {
  product: Product;
}

const ProductPageClient = ({ product }: { product: Product }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, ProductMenuOption>>({});

  const handleSelect = (menuId: number, option: ProductMenuOption) => {
    setSelectedOptions(prev => ({ ...prev, [menuId]: option }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-8">

    </div>
  );
};

// Server Component
// Server Component
export default async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const productId = Number(id);

  if (isNaN(productId)) {
    return <div className="p-6 text-center">Invalid Product ID</div>;
  }

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      image_url,
      base_price,
      product_menus (
        id,
        name,
        product_menu_options (
          id,
          option_name,
          price
        )
      )
    `)
    .eq("id", productId)
    .single();

  if (error || !product) {
    return <div className="p-6 text-center">Product not found</div>;
  }

  return <ProductPageClient product={product as Product} />;
}
