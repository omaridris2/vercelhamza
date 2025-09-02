import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-yellow-400 shadow-lg fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-gray-800 text-xl font-bold hover:text-gray-600 transition-colors">
              MyApp
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-gray-800 hover:bg-yellow-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-gray-800 hover:bg-yellow-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/services"
                className="text-gray-800 hover:bg-yellow-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Services
              </Link>
              <Link
                href="/contact"
                className="text-gray-800 hover:bg-yellow-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="bg-yellow-400 inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-gray-900 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-yellow-300">
          <Link
            href="/"
            className="text-gray-800 hover:bg-yellow-200 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-gray-800 hover:bg-yellow-200 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
          >
            About
          </Link>
          <Link
            href="/services"
            className="text-gray-800 hover:bg-yellow-200 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
          >
            Services
          </Link>
          <Link
            href="/contact"
            className="text-gray-800 hover:bg-yellow-200 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
