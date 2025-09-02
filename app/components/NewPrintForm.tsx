'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type AddProductFormProps = {
  onClose: () => void;
  onSuccess?: () => void;
};

const AddProductForm = ({ onClose, onSuccess }: AddProductFormProps) => {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up preview URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  // Handle image selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Clean up previous preview
    if (previewUrl) {
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
      setError(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Generate unique filename
  const generateFileName = (file: File): string => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `product_${timestamp}_${randomStr}.${fileExt}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (!imageFile) {
      setError('Product image is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload image to Supabase storage
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

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      // 3. Insert product into database
      const { error: insertError, data: insertData } = await supabase
        .from('products')
        .insert([{
          name: name.trim(),
          image_url: publicUrl
        }])
        .select('*')
        .single();

      if (insertError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('product-images')
          .remove([uploadData.path]);
        
        throw new Error(`Failed to save product: ${insertError.message}`);
      }

      // Success - reset form and close
      resetForm();
      onSuccess?.();
      onClose();

    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setImageFile(null);
    setError(null);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name Input */}
          <div>
            <label 
              htmlFor="productName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Product Name *
            </label>
            <input
              id="productName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter product name"
              maxLength={100}
              required
              disabled={loading}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label 
              htmlFor="productImage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Product Image *
            </label>
            <input
              id="productImage"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 disabled:opacity-50"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, WebP (max 5MB)
            </p>
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-3">
                <img 
                  src={previewUrl} 
                  alt="Product preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              disabled={loading || !name.trim() || !imageFile}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;