'use client'

import React, { useState, useEffect, useMemo } from 'react';
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
  image_url: string | null; 
  product_menus: ProductMenu[];
};

const Product29Page = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected options per menu
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({});

  // Fetch product 29 on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
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
                price
              )
            )
          `)
          .eq('id', 29)
          .single();

        if (error || !data) {
          setError('Product not found');
        } else {
          setProduct(data as Product);
          // Initialize selected options
          const initialSelections = Object.fromEntries(
            data.product_menus.map((menu: ProductMenu) => [menu.id, null])
          );
          setSelectedOptions(initialSelections);
        }
      } catch (err) {
        setError('Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  const handleSelect = (menuId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [menuId]: Number(optionId),
    }));
  };

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    return product.product_menus.reduce((sum, menu) => {
      const selectedId = selectedOptions[menu.id];
      if (!selectedId) return sum;
      const selectedOpt = menu.product_menu_options.find(
        (opt) => Number(opt.id) === selectedId
      );
      return sum + (selectedOpt?.price || 0);
    }, 0);
  }, [selectedOptions, product]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error || !product) return <div className="p-6 text-center">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
      <img 
        src={product.image_url || ''} 
        alt={product.name} 
        className="w-64 h-64 object-cover rounded-lg shadow-md my-4" 
      />

      <div className="w-full max-w-md mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Menus</h2>
        {product.product_menus.map((menu) => (
          <div key={menu.id} className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
            <h3 className="text-lg font-medium text-gray-700">{menu.name}</h3>
            <ul className="mt-2 space-y-2">
              {menu.product_menu_options.map((opt) => (
                <li key={opt.id} className="flex justify-between items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`menu-${menu.id}`}
                      value={opt.id}
                      checked={selectedOptions[menu.id] === opt.id}
                      onChange={() => handleSelect(menu.id, opt.id)}
                    />
                    <span>{opt.option_name}</span>
                  </label>
                  <span className="font-semibold">${opt.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xl font-bold text-gray-900">
        Total: ${totalPrice.toFixed(2)}
      </div>

      <div className="mt-4 text-gray-700">
        <h3 className="font-medium">Selected Options:</h3>
        <pre className="text-sm bg-gray-200 p-2 rounded">
          {JSON.stringify(selectedOptions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default Product29Page;
