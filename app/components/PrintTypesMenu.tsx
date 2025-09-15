import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  image_url: string;
};

const PrintTypesMenu = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url");

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="relative group bg-white  shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {/* Content Container */}
              <div className="p-4 bg-[#636255]">
                <h3 className="text-white font-medium text-lg mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                  {product.name}
                </h3>
                <p className="text-gray-300 text-sm font-medium">
                   Starting from: <span className=" font-bold">50 SAR</span>
                </p>
                
                {/* Yellow Button */}
                <button 
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-l-sm bg-yellow-400 hover:bg-yellow-500 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group-hover:scale-110"
                  onClick={() => {/* Does nothing as requested */}}
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
      </div>
    </div>
  );
};

export default PrintTypesMenu;