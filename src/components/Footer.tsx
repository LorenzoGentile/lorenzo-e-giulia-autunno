import React from 'react';
import { Heart } from 'lucide-react';
const Footer = () => {
  return <footer className="text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-3">
            <h2 className="font-playfair text-3xl mb-1 text-[#af7d58]/[0.99]">Lorenzo & Giulia</h2>
            <div className="flex items-center justify-center">
              <span className="inline-block h-px w-8 bg-autumn-amber mx-3"></span>
              <Heart className="w-5 h-5 text-[#af7d58]/[0.99]" fill="currentColor" />
              <span className="inline-block h-px w-8 bg-autumn-amber mx-3"></span>
            </div>
            <p className="mt-1 text-[#af7d58]/[0.99]">19 Ottobre 2025</p>
          </div>
          
          <div className="w-full max-w-md flex justify-center mb-3">
            <a href="#" className="mx-2 text-[#af7d58]/[0.99] hover:text-autumn-cream transition-colors">
              Home
            </a>
            <a href="#storia" className="mx-2 text-[#af7d58]/[0.99] hover:text-autumn-cream transition-colors">
              La Nostra Storia
            </a>
            <a href="#dettagli" className="mx-2 text-[#af7d58]/[0.99] hover:text-autumn-cream transition-colors">
              Dettagli
            </a>
            <a href="#rsvp" className="mx-2 text-[#af7d58]/[0.99] hover:text-autumn-cream transition-colors">
              RSVP
            </a>
          </div>
          
          <p className="text-sm text-[#af7d58]/[0.99] opacity-70 text-center mt-1">
            &copy; {new Date().getFullYear()} - Lorenzo & Giulia - Con amore ❤️
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;