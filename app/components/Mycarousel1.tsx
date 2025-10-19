"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Product {
  id: number;
  name: string;
  image_url: string;
  type: string;
}

interface MyCarousel1Props {
  type: "Roland" | "Digital" | "Sign" | "Laser" | "Wood" | "Reprint";
}

const MyCarousel1: React.FC<MyCarousel1Props> = ({ type }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, type")
        .ilike("type", type);

      if (error) {
        console.error("Supabase fetch error:", error);
      } else {
        setProducts(data ?? []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [type]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636255]"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4"></div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">
          No {type} Products Available
        </h3>
        <p className="text-gray-500">
          {type} products will appear here once they are added to the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-[#636255] mb-2">
          {type} Products
        </h2>
        <div className="h-1 w-24 bg-yellow-500 rounded-full"></div>
      </div>

      <Carousel className="w-full relative">
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <Link
                href={`/product/${product.id}`}
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="bg-[#636255] p-4 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    <h3 className="text-white font-semibold text-lg line-clamp-2 group-hover:text-yellow-400 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">
                      View Details →
                    </p>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {products.length > 4 && (
          <>
            <CarouselPrevious className="left-0 -translate-x-1/2 bg-[#636255] text-white hover:bg-[#4a4940] border-none shadow-lg" />
            <CarouselNext className="right-0 translate-x-1/2 bg-[#636255] text-white hover:bg-[#4a4940] border-none shadow-lg" />
          </>
        )}
      </Carousel>

      <div className="mt-4 text-center text-gray-600 text-sm">
        {products.length} {products.length === 1 ? 'product' : 'products'} available
      </div>
    </div>
  );
};

export default MyCarousel1;