
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CountdownTimer from '@/components/CountdownTimer';
import OurStory from '@/components/OurStory';
import EventDetails from '@/components/EventDetails';
import RsvpForm from '@/components/RsvpForm';
import Gallery from '@/components/Gallery';
import GiftRegistry from '@/components/GiftRegistry';
import Footer from '@/components/Footer';

const Index = () => {
  // Smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = target.getAttribute('href')?.substring(1);
        const element = document.getElementById(id || '');
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 80, // Adjust for navbar height
            behavior: 'smooth',
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-cover bg-center relative" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjJ8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=1600&q=60')`
      }}>
        <div className="absolute inset-0 bg-autumn-burgundy opacity-20"></div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white font-playfair mb-6">
            Lorenzo & Giulia
          </h1>
          <p className="text-2xl md:text-3xl text-white font-light mb-12 font-montserrat">
            Vi invitiamo al nostro matrimonio
          </p>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-3xl mx-auto">
            <CountdownTimer />
          </div>
        </div>
      </section>
      
      {/* Our Story Section */}
      <OurStory />
      
      {/* Quote Section */}
      <section className="py-20 bg-autumn-burgundy text-white">
        <div className="container mx-auto px-4">
          <blockquote className="max-w-4xl mx-auto text-center">
            <p className="text-2xl md:text-3xl italic font-playfair mb-6">
              "L'amore non consiste nel guardarsi l'un l'altro, ma nel guardare insieme nella stessa direzione."
            </p>
            <footer className="text-autumn-amber">— Antoine de Saint-Exupéry</footer>
          </blockquote>
        </div>
      </section>
      
      {/* Event Details Section */}
      <EventDetails />
      
      {/* RSVP Section */}
      <RsvpForm />
      
      {/* Gallery Section */}
      <Gallery />
      
      {/* Gift Registry Section */}
      <GiftRegistry />
      
      {/* Footer */}
      <Footer />
    </>
  );
};

export default Index;
