import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AddPrintForm from "./NewPrintForm";

type Product = {
  id: string;
  name: string;
  image_url: string;
  type: string;
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

interface PrintTypesMenuProps {
  filterType?: string;
}

const PrintTypesMenu = ({ filterType }: PrintTypesMenuProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, image_url, type");

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on filterType prop
  const displayProducts = filterType 
    ? products.filter(product => product.type === filterType)
    : products;

  const handleEdit = async (productId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        image_url,
        type,
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
      .eq('id', productId)
      .single();

    if (error) {
      console.error("Error fetching product details:", error);
    } else if (data) {
      setEditingProduct(data as unknown as ProductData);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get all menu IDs for this product
      const { data: menus } = await supabase
        .from('product_menus')
        .select('id')
        .eq('product_id', productId);

      if (menus && menus.length > 0) {
        const menuIds = menus.map(m => m.id);
        
        // Step 2: Delete all options for these menus
        const { error: optionsError } = await supabase
          .from('product_menu_options')
          .delete()
          .in('menu_id', menuIds);

        if (optionsError) throw optionsError;
      }

      // Step 3: Delete all menus for this product
      const { error: menusError } = await supabase
        .from('product_menus')
        .delete()
        .eq('product_id', productId);

      if (menusError) throw menusError;

      // Step 4: Get the product image URL before deleting
      const { data: product } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      // Step 5: Delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      // Step 6: Delete image from storage (optional cleanup)
      if (product?.image_url && product.image_url !== 'left empty') {
        const imagePath = product.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage
            .from('product-images')
            .remove([imagePath]);
        }
      }

      // Refresh the list
      fetchProducts();
      
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500">
              {filterType 
                ? `No products available in the ${filterType} category.` 
                : 'No products available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <div 
                key={product.id} 
                className="relative group bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all duration-200"
                      title="Delete product"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Content Container */}
                <div className="p-4 bg-[#636255]">
                  <h3 className="text-white font-medium text-lg mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                    {product.name}
                  </h3>
                  <p className="text-gray-300 text-sm font-medium">
                    {product.type}
                  </p>
                  
                  {/* Yellow Button */}
                  <button 
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-l-sm bg-yellow-400 hover:bg-yellow-500 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group-hover:scale-110"
                    onClick={() => handleEdit(product.id)}
                    disabled={loading}
                  >
                    <svg 
                      className="w-5 h-5 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <AddPrintForm
          editMode={true}
          productData={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            fetchProducts(); // Refresh the products list
          }}
        />
      )}
    </div>
  );
};

export default PrintTypesMenu;