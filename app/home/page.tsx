import React from 'react'

import NavBar from "../components/Navbar";
import Footer from "../components/Footer";


import MyCarousel1 from '../components/Mycarousel1';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"  suppressHydrationWarning>
      <body>
        
        <NavBar />
        <MyCarousel1 />
        <MyCarousel1 />
        <MyCarousel1 />
        <Footer />
        
        <main>{children}</main>

        
      </body>
    </html>
  )
}
