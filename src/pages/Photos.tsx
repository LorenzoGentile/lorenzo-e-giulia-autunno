
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoGallery from '@/components/PhotoGallery';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Photos = () => {
  const { user, isInvitedGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('gallery');
  
  return (
    <>
      <Navbar />
      
      <section className="min-h-[50vh] bg-cover bg-center relative py-20" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjJ8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=1600&q=60')`
      }}>
        <div className="absolute inset-0 bg-autumn-burgundy opacity-20"></div>
        <div className="container mx-auto px-4 z-10 text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold text-white font-playfair mb-6">
            La Nostra Galleria
          </h1>
          <p className="text-xl md:text-2xl text-white font-light mb-12 font-montserrat">
            Condividi e guarda i ricordi del nostro matrimonio
          </p>
        </div>
      </section>
      
      <section className="section-container" id="photos">
        <div className="max-w-6xl mx-auto">
          <Tabs 
            defaultValue="gallery" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-8"
          >
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="gallery" className="text-lg px-6">Galleria</TabsTrigger>
                {(user && isInvitedGuest) && (
                  <TabsTrigger value="upload" className="text-lg px-6">Carica Foto</TabsTrigger>
                )}
              </TabsList>
            </div>
            
            <TabsContent value="gallery">
              <PhotoGallery />
            </TabsContent>
            
            {(user && isInvitedGuest) && (
              <TabsContent value="upload">
                <PhotoUpload />
              </TabsContent>
            )}
          </Tabs>
          
          {!user && (
            <div className="autumn-card text-center py-8 mt-8">
              <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">
                Vuoi condividere le tue foto?
              </h3>
              <p className="text-gray-600 mb-4">
                Accedi con l'email del tuo invito per caricare le tue foto
              </p>
              <Button
                onClick={() => window.location.href = '/auth'}
                className="autumn-button"
              >
                Accedi
              </Button>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default Photos;
