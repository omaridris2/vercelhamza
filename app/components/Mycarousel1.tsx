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

import { supabase } from "@/lib/supabaseClient"; // adjust path as needed

interface Product {
  id: number;
  name: string;
  image_url: string;
}

const MyCarousel1 = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url");

      if (error) {
        console.error("Supabase fetch error:", error);
      } else {
        setProducts(data ?? []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex justify-center mt-8">
      <Carousel className="w-full max-w-7xl relative">
        <CarouselContent>
          {products
  .filter(p => p.id != null && !isNaN(Number(p.id)))
  .map((product) => (
    <CarouselItem
      key={product.id}
      className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/4"
    >
      <Link
        href={`/product/${product.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center p-4 cursor-pointer hover:scale-105 transition-transform"
      >
        
        <img
          src={product.image_url}
          alt={product.name}
          className="w-60 h-60 object-cover "
        />
        <div className="w-60 h-30 bg-[#636255] shadow-md p-2 flex justify-start items-center">
       <span className="text-white">{product.name}</span>
       <span className="text-white">{product.name}</span>
       </div>
      </Link>
    </CarouselItem>
))}

        </CarouselContent>

        <CarouselPrevious className="-left-4 text-black" />
        <CarouselNext className="-right-4 text-black" />
      </Carousel>
    </div>
  );
};

export default MyCarousel1;