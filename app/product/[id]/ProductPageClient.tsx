'use client';

import React, { useState, useMemo } from 'react';
import { addToCart } from '@/app/actions/orderActions';

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

interface Props {
  product: Product;
}

const ProductPageClient = ({ product }: Props) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>(
    () => Object.fromEntries(product.product_menus.map((menu) => [menu.id, null]))
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (menuId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [menuId]: optionId,
    }));
  };

  const handleQuantityChange = (value: number) => {
    if (value < 1) return; // prevent 0 or negative
    setQuantity(value);
  };

  const basePrice = useMemo(() => {
    return product.product_menus.reduce((sum, menu) => {
      const selectedId = selectedOptions[menu.id];
      if (!selectedId) return sum;
      const selectedOpt = menu.product_menu_options.find(
        (opt) => opt.id === selectedId
      );
      return sum + (selectedOpt?.price || 0);
    }, 0);
  }, [selectedOptions, product]);

  const totalPrice = useMemo(() => basePrice * quantity, [basePrice, quantity]);

  const allOptionsSelected = useMemo(() => {
    return product.product_menus.every((menu) => selectedOptions[menu.id] !== null);
  }, [selectedOptions, product]);

  const handleAddToCart = async () => {
    if (!allOptionsSelected) return;

    setIsSubmitting(true);
    try {
      // Get selected option IDs
      const selectedOptionIds = Object.values(selectedOptions).filter(
        (id): id is number => id !== null
      );

      const result = await addToCart({
        product_id: product.id,
        quantity,
        price: totalPrice,
        selected_option_ids: selectedOptionIds,
      });

      if (result.success) {
        alert(result.message || 'Added to cart successfully!');
        
        // Reset selections
        setSelectedOptions(
          Object.fromEntries(product.product_menus.map((menu) => [menu.id, null]))
        );
        setQuantity(1);
      } else {
        alert(result.error || 'Failed to add to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine grid columns based on number of menus
  const getGridClass = () => {
    const count = product.product_menus.length;
    if (count <= 2) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Product Section with Image + Config */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <div className="flex flex-col md:flex-row gap-10">
            
            {/* LEFT: Product Image */}
            <div className="flex-shrink-0 md:w-1/3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-auto object-cover rounded-xl shadow-md"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-slate-200 rounded-xl">
                  <span className="text-slate-500">No image available</span>
                </div>
              )}
            </div>

            {/* RIGHT: Config Options */}
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Configuration Options
                </h2>
                <p className="text-slate-600">
                  Please select an option for each category ({product.product_menus.length}{' '}
                  {product.product_menus.length === 1 ? 'option' : 'options'})
                </p>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                {product.name}
              </h1>

              {/* Dynamic Grid of Dropdowns */}
              <div className={`grid ${getGridClass()} gap-6 mb-8`}>
                {product.product_menus.map((menu, index) => {
                  const isSelected = selectedOptions[menu.id] !== null;
                  const selectedOption = menu.product_menu_options.find(
                    (opt) => opt.id === selectedOptions[menu.id]
                  );

                  return (
                    <div key={menu.id} className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-sm font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            {index + 1}
                          </span>
                          <span className="text-base">{menu.name}</span>
                        </div>
                      </label>

                      <select
                        className={`w-full px-4 py-3 border-2 rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                        value={selectedOptions[menu.id] ?? ''}
                        onChange={(e) => handleSelect(menu.id, Number(e.target.value))}
                      >
                        <option value="">Choose an option...</option>
                        {menu.product_menu_options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.option_name} (+${opt.price.toFixed(2)})
                          </option>
                        ))}
                      </select>

                      {isSelected && selectedOption && (
                        <p className="mt-2 text-sm text-blue-600 font-medium">
                          ✓ {selectedOption.option_name} - ${selectedOption.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary Bar */}
              <div className="border-t-2 border-slate-200 pt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-slate-700">Quantity:</span>
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300"
                        onClick={() => handleQuantityChange(quantity - 1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        min={1}
                        onChange={(e) => handleQuantityChange(Number(e.target.value))}
                        className="w-16 text-center border-l border-r focus:outline-none"
                      />
                      <button
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300"
                        onClick={() => handleQuantityChange(quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-slate-700">
                      Total Price:
                    </span>
                    <span className="text-3xl font-bold text-slate-900">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!allOptionsSelected || isSubmitting}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 min-w-[200px] ${
                      allOptionsSelected && !isSubmitting
                        ? 'bg-[#636255] hover:bg-yellow-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting
                      ? 'Adding...'
                      : allOptionsSelected
                      ? 'Add to Cart'
                      : `Select ${
                          product.product_menus.filter((m) => !selectedOptions[m.id]).length
                        } More`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPageClient;