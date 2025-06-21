
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import CountdownTimer from '@/components/CountdownTimer';
import OurStory from '@/components/OurStory';
import EventDetails from '@/components/EventDetails';
import RsvpForm from '@/components/RsvpForm';
import Gallery from '@/components/Gallery';
import GiftRegistry from '@/components/GiftRegistry';
import Footer from '@/components/Footer';

const Index = () => {
  const { user, isInvitedGuest } = useAuth();

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
        backgroundImage: `url('/top_background.svg')`
      }}>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-autumn-dark-brown font-playfair mb-6">
            Lorenzo & Giulia
          </h1>
          <p className="text-2xl md:text-3xl text-autumn-dark-brown font-light mb-12 font-montserrat">
            Vi invitiamo al nostro matrimonio
          </p>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-3xl mx-auto">
            <CountdownTimer />
            
            {/* Members Area CTA for authenticated users */}
            {user && isInvitedGuest && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Card className="autumn-card">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-playfair text-autumn-burgundy flex items-center justify-center gap-2">
                      <Users className="w-5 h-5" />
                      Area Riservata Invitati
                    </CardTitle>
                    <CardDescription>
                      Accedi alla tua area personale per gestire RSVP e foto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <Heart className="w-8 h-8 text-autumn-terracotta mx-auto mb-1" />
                        <span className="text-xs font-medium text-gray-600">RSVP</span>
                      </div>
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-autumn-terracotta mx-auto mb-1" />
                        <span className="text-xs font-medium text-gray-600">Galleria</span>
                      </div>
                      <div className="text-center">
                        <Users className="w-8 h-8 text-autumn-terracotta mx-auto mb-1" />
                        <span className="text-xs font-medium text-gray-600">Carica</span>
                      </div>
                    </div>
                    <Link to="/members">
                      <Button className="autumn-button w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Accedi all'Area Riservata
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
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
      
      {/* RSVP Section - Show simplified version for non-authenticated users */}
      {!user || !isInvitedGuest ? (
        <div className="section-container bg-autumn-cream bg-opacity-10" id="rsvp">
          <h2 className="section-title">RSVP</h2>
          <RsvpForm />
        </div>
      ) : (
        <div className="section-container bg-autumn-cream bg-opacity-10" id="rsvp">
          <h2 className="section-title">RSVP</h2>
          <div className="text-center">
            <Card className="autumn-card max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl font-playfair text-autumn-burgundy">
                  Sei già registrato!
                </CardTitle>
                <CardDescription>
                  Gestisci il tuo RSVP dalla tua area personale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/members">
                  <Button className="autumn-button">
                    <Users className="w-4 h-4 mr-2" />
                    Vai all'Area Riservata
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
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
