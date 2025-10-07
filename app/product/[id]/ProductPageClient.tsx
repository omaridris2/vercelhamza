'use client';

import React, { useState, useMemo } from 'react';
import { addToCart } from '@/app/actions/orderActions';
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

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  amount: number;
  expiration_date: string;
  use_limit: number;
  times_used: number;
  is_active: boolean;
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
  
  // Discount code states
  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSelect = (menuId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [menuId]: optionId,
    }));
  };

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
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

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    
    const subtotal = basePrice * quantity;
    
    if (appliedDiscount.type === 'Percentage') {
      return (subtotal * appliedDiscount.amount) / 100;
    } else {
      // Fixed discount
      return appliedDiscount.amount;
    }
  }, [appliedDiscount, basePrice, quantity]);

  const totalPrice = useMemo(() => {
    const subtotal = basePrice * quantity;
    return Math.max(0, subtotal - discountAmount);
  }, [basePrice, quantity, discountAmount]);

  const allOptionsSelected = useMemo(() => {
    return product.product_menus.every((menu) => selectedOptions[menu.id] !== null);
  }, [selectedOptions, product]);

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidating(true);
    setDiscountError(null);

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        setDiscountError('Invalid discount code');
        setAppliedDiscount(null);
        return;
      }

      // Validate discount code
      if (!data.is_active) {
        setDiscountError('This discount code is no longer active');
        setAppliedDiscount(null);
        return;
      }

      if (new Date(data.expiration_date) < new Date()) {
        setDiscountError('This discount code has expired');
        setAppliedDiscount(null);
        return;
      }

      if (data.times_used >= data.use_limit) {
        setDiscountError('This discount code has reached its usage limit');
        setAppliedDiscount(null);
        return;
      }

      // Success - apply discount
      setAppliedDiscount(data);
      setDiscountError(null);
    } catch (err) {
      console.error('Error validating discount code:', err);
      setDiscountError('Failed to validate discount code');
      setAppliedDiscount(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError(null);
  };

  const handleAddToCart = async () => {
    if (!allOptionsSelected) return;

    setIsSubmitting(true);
    try {
      const selectedOptionIds = Object.values(selectedOptions).filter(
        (id): id is number => id !== null
      );

      // If discount is applied, increment the times_used
      

      const result = await addToCart({
        product_id: product.id,
        quantity,
        price: totalPrice,
        selected_option_ids: selectedOptionIds,
        discount_code_id: appliedDiscount?.id,
      });

      if (result.success) {
        alert(result.message || 'Added to cart successfully!');
        
        // Reset selections
        setSelectedOptions(
          Object.fromEntries(product.product_menus.map((menu) => [menu.id, null]))
        );
        setQuantity(1);
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError(null);
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

              {/* Discount Code Section */}
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Have a discount code?
                </h3>
                
                {!appliedDiscount ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        setDiscountError(null);
                      }}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isValidating}
                    />
                    <button
                      onClick={validateDiscountCode}
                      disabled={isValidating || !discountCode.trim()}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                        isValidating || !discountCode.trim()
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isValidating ? 'Validating...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border-2 border-green-500 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-semibold text-green-900">
                          Code Applied: {appliedDiscount.code}
                        </p>
                        <p className="text-sm text-green-700">
                          {appliedDiscount.type === 'Percentage' 
                            ? `${appliedDiscount.amount}% off` 
                            : `$${appliedDiscount.amount.toFixed(2)} off`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeDiscount}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {discountError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {discountError}
                  </p>
                )}
              </div>

              {/* Summary Bar */}
              <div className="border-t-2 border-slate-200 pt-8">
                {/* Price Breakdown */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${(basePrice * quantity).toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedDiscount.code}):</span>
                      <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

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