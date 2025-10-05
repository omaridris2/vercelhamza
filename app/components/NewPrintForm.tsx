'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
type CubeType = "Roland" | "Digital" | "Sing" | "Laser" | "Wood" | "Reprint";
type Menu = {
  id?: number;
  name: string;
  options: { id?: number; option: string; price: number }[];
};

type ProductData = {
  id: number;
  name: string;
  image_url: string | null;
  type: string;
  product_menus: {
    id: number;
    name: string;
    product_menu_options: {
      id: number;
      option_name: string;
      price: number;
    }[];
  }[];
};

type AddPrintFormProps = {
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  productData?: ProductData;
};

const CUBE_TYPES: CubeType[] = ["Roland", "Digital", "Sing", "Laser", "Wood", "Reprint"];

const AddPrintForm = ({ onClose, onSuccess, editMode = false, productData }: AddPrintFormProps) => {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [keepExistingImage, setKeepExistingImage] = useState(true);
  const [type, setType] = useState<CubeType | "">("");

  // Initialize form with existing data in edit mode
  useEffect(() => {
    if (editMode && productData) {
      setName(productData.name);
      setType(productData.type as CubeType);
      setPreviewUrl(productData.image_url);
      
      // Transform product menus to form format
      const transformedMenus = productData.product_menus.map(menu => ({
        id: menu.id,
        name: menu.name,
        options: menu.product_menu_options.map(opt => ({
          id: opt.id,
          option: opt.option_name,
          price: opt.price
        }))
      }));
      setMenus(transformedMenus);
    }
  }, [editMode, productData]);

  useEffect(() => {
    return () => {
      if (previewUrl && !editMode) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, editMode]);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (previewUrl && !editMode) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setImageFile(null);
        return;
      }

      setImageFile(file);
      setKeepExistingImage(false);
      setError(null);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const generateFileName = (file: File): string => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `product_${timestamp}_${randomStr}.${fileExt}`;
  };

  const addMenu = () => {
    setMenus([...menus, { name: '', options: [{ option: '', price: 0 }] }]);
  };

  const removeMenu = (menuIndex: number) => {
    const updated = menus.filter((_, index) => index !== menuIndex);
    setMenus(updated);
  };

  const addOption = (menuIndex: number) => {
    const updated = [...menus];
    updated[menuIndex].options.push({ option: '', price: 0 });
    setMenus(updated);
  };

  const removeOption = (menuIndex: number, optionIndex: number) => {
    const updated = [...menus];
    updated[menuIndex].options = updated[menuIndex].options.filter((_, index) => index !== optionIndex);
    setMenus(updated);
  };

  const updateMenu = (menuIndex: number, value: string) => {
    const updated = [...menus];
    updated[menuIndex].name = value;
    setMenus(updated);
  };

  const updateOption = (menuIndex: number, optionIndex: number, field: 'option' | 'price', value: string) => {
    const updated = [...menus];
    if (field === 'price') {
      updated[menuIndex].options[optionIndex].price = parseFloat(value) || 0;
    } else {
      updated[menuIndex].options[optionIndex].option = value;
    }
    setMenus(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!editMode && !imageFile) {
      setError('Product image is required');
      return;
    }

    if (editMode && !keepExistingImage && !imageFile) {
      setError('Please select a new image or keep the existing one');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = productData?.image_url || null;

      // Handle image upload if new image selected
      if (imageFile) {
        const fileName = generateFileName(imageFile);
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        if (!uploadData?.path) {
          throw new Error('Upload succeeded but no file path returned');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        if (!publicUrl) {
          throw new Error('Failed to get public URL for uploaded image');
        }

        imageUrl = publicUrl;

        // Delete old image if in edit mode
        if (editMode && productData?.image_url) {
          const oldPath = productData.image_url.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('product-images').remove([oldPath]);
          }
        }
      }

      if (editMode && productData) {
        // UPDATE MODE
        const { error: productError } = await supabase
          .from('products')
          .update({ 
            name: name.trim(), 
            image_url: imageUrl,
            type: type
          })
          .eq('id', productData.id);

        if (productError) {
          throw new Error(`Failed to update product: ${productError.message}`);
        }

        // Delete all existing menus and options
        const { error: deleteError } = await supabase
          .from('product_menus')
          .delete()
          .eq('product_id', productData.id);

        if (deleteError) {
          console.error('Error deleting old menus:', deleteError);
        }

        // Insert updated menus and options
        for (const menu of menus) {
          if (!menu.name.trim()) continue;

          const { data: menuData, error: menuError } = await supabase
            .from('product_menus')
            .insert([{ 
              product_id: productData.id, 
              name: menu.name.trim() 
            }])
            .select()
            .single();

          if (menuError) {
            console.error('Menu insert error:', menuError);
            continue;
          }

          const validOptions = menu.options.filter(opt => opt.option.trim());
          
          if (validOptions.length > 0) {
            const optionsToInsert = validOptions.map(opt => ({
              menu_id: menuData.id,
              option_name: opt.option.trim(),
              price: opt.price
            }));

            const { error: optionsError } = await supabase
              .from('product_menu_options')
              .insert(optionsToInsert);

            if (optionsError) {
              console.error('Options insert error:', optionsError);
            }
          }
        }
      } else {
        // CREATE MODE (original logic)
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert([{ 
            name: name.trim(), 
            image_url: imageUrl ,
            type: type
          }])
          .select('*')
          .single();

        if (productError) {
          if (imageFile) {
            const fileName = imageUrl?.split('/').pop();
            if (fileName) {
              await supabase.storage.from('product-images').remove([fileName]);
            }
          }
          throw new Error(`Failed to save product: ${productError.message}`);
        }

        for (const menu of menus) {
          if (!menu.name.trim()) continue;

          const { data: menuData, error: menuError } = await supabase
            .from('product_menus')
            .insert([{ 
              product_id: product.id, 
              name: menu.name.trim() 
            }])
            .select()
            .single();

          if (menuError) {
            console.error('Menu insert error:', menuError);
            continue;
          }

          const validOptions = menu.options.filter(opt => opt.option.trim());
          
          if (validOptions.length > 0) {
            const optionsToInsert = validOptions.map(opt => ({
              menu_id: menuData.id,
              option_name: opt.option.trim(),
              price: opt.price
            }));

            const { error: optionsError } = await supabase
              .from('product_menu_options')
              .insert(optionsToInsert);

            if (optionsError) {
              console.error('Options insert error:', optionsError);
            }
          }
        }
      }

      resetForm();
      onSuccess?.();
      onClose();

    } catch (err: unknown) {
      console.error('Error saving product:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setImageFile(null);
    setMenus([]);
    setError(null);
    if (previewUrl && !editMode) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-0 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text">
              {editMode ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-gray-500 mt-1">
              {editMode ? 'Update product details and options' : 'Create a new product with customizable options'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label htmlFor="productName" className="block text-sm font-semibold text-gray-800">
                Product Name *
              </label>
              
              <input
                id="productName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                placeholder="Enter a descriptive product name"
                maxLength={100}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
  <label htmlFor="productType" className="block text-sm font-semibold text-gray-800">
    Cube Type *
  </label>
  <select
    id="productType"
    value={type}
    onChange={(e) => setType(e.target.value as CubeType)}
    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
    required
    disabled={loading}
  >
    <option value="">Select type</option>
    {CUBE_TYPES.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
  </select>
</div>

            <div className="space-y-2">
              <label htmlFor="productImage" className="block text-sm font-semibold text-gray-800">
                Product Image {!editMode && '*'}
              </label>
              <div className="relative">
                <input
                  id="productImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-yellow-50 file:to-orange-50 file:text-yellow-700 hover:file:from-yellow-100 hover:file:to-orange-100 disabled:opacity-50 transition-all duration-200"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Supported: JPEG, PNG, WebP • Max size: 5MB
              </p>
              
              {previewUrl && (
                <div className="mt-4">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Product preview"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Product Options</h3>
                <p className="text-sm text-gray-500">Add dropdown menus for size, color, variations, etc.</p>
              </div>
              <button
                type="button"
                onClick={addMenu}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                disabled={loading}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Menu
                </span>
              </button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {menus.map((menu, menuIndex) => (
                <div key={menuIndex} className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                      {menuIndex + 1}
                    </div>
                    <input
                      type="text"
                      placeholder="Menu name (e.g., Size, Color, Material)"
                      value={menu.name}
                      onChange={(e) => updateMenu(menuIndex, e.target.value)}
                      className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 disabled:bg-gray-50 font-medium"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeMenu(menuIndex)}
                      className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 flex items-center justify-center transition-all duration-200"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {menu.options.map((opt, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Option (e.g., Small, Red, Cotton)"
                          value={opt.option}
                          onChange={(e) => updateOption(menuIndex, optionIndex, 'option', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-50"
                          disabled={loading}
                        />
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={opt.price}
                            onChange={(e) => updateOption(menuIndex, optionIndex, 'price', e.target.value)}
                            className="w-24 border border-gray-300 rounded-lg px-3 py-2 pl-7 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-50"
                            disabled={loading}
                          />
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(menuIndex, optionIndex)}
                          className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 flex items-center justify-center transition-all duration-200"
                          disabled={loading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addOption(menuIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors duration-200"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {menus.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-600 mb-2">No product options yet</h4>
                <p className="text-gray-500 text-sm">Add dropdown menus to let customers choose product variations</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Error:</span>
                <span className="ml-1">{error}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              disabled={loading || !name.trim() || (!editMode && !imageFile)}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editMode ? 'Updating Product...' : 'Creating Product...'}
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editMode ? 'Update Product' : 'Save Product'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPrintForm;