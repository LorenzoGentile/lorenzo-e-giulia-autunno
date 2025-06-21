
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Heart, Camera, Upload } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RsvpForm from '@/components/RsvpForm';
import PhotoGallery from '@/components/PhotoGallery';
import PhotoUpload from '@/components/PhotoUpload';

const Members = () => {
  const navigate = useNavigate();
  const { user, isInvitedGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('rsvp');

  // Redirect if not logged in or not an invited guest
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!isInvitedGuest) {
      navigate('/');
    }
  }, [user, isInvitedGuest, navigate]);

  if (!user || !isInvitedGuest) {
    return null; // Will redirect
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="min-h-[40vh] bg-cover bg-center relative py-20" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YXV0dW1ufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=1600&q=60')`
      }}>
        <div className="absolute inset-0 bg-autumn-burgundy opacity-20"></div>
        <div className="container mx-auto px-4 z-10 text-center relative">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-playfair mb-4">
            Area Riservata
          </h1>
          <p className="text-xl md:text-2xl text-white font-light mb-8 font-montserrat">
            Benvenuto/a, {user.email?.split('@')[0]}!
          </p>
          <div className="flex items-center justify-center text-white">
            <User className="w-6 h-6 mr-2" />
            <span className="text-lg">Invitato Verificato</span>
          </div>
        </div>
      </section>

      {/* Members Area Content */}
      <section className="section-container">
        <div className="max-w-6xl mx-auto">
          <Card className="autumn-card mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-playfair text-autumn-burgundy">
                La Tua Area Personale
              </CardTitle>
              <CardDescription className="text-lg">
                Gestisci il tuo RSVP, visualizza e carica foto del nostro matrimonio
              </CardDescription>
            </CardHeader>
          </Card>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="rsvp" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">RSVP</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Galleria</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Carica</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="rsvp" className="space-y-6">
              <Card className="autumn-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-playfair text-autumn-burgundy flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5" />
                    Conferma la Tua Presenza
                  </CardTitle>
                  <CardDescription>
                    Gestisci la tua risposta all'invito
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-autumn-cream bg-opacity-30 rounded-lg p-6">
                    <RsvpForm />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="gallery" className="space-y-6">
              <Card className="autumn-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-playfair text-autumn-burgundy flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" />
                    Galleria Foto Condivise
                  </CardTitle>
                  <CardDescription>
                    Visualizza tutte le foto caricate dagli invitati
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoGallery />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-6">
              <Card className="autumn-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-playfair text-autumn-burgundy flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    Carica le Tue Foto
                  </CardTitle>
                  <CardDescription>
                    Condividi i tuoi ricordi del nostro matrimonio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoUpload />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="autumn-card text-center">
              <CardContent className="p-6">
                <Heart className="w-12 h-12 text-autumn-terracotta mx-auto mb-4" />
                <h3 className="font-playfair text-lg font-semibold text-autumn-burgundy mb-2">
                  RSVP Veloce
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Conferma o modifica la tua presenza
                </p>
                <Button 
                  onClick={() => setActiveTab('rsvp')}
                  variant="outline"
                  size="sm"
                  className="border-autumn-terracotta text-autumn-terracotta hover:bg-autumn-terracotta hover:text-white"
                >
                  Vai al RSVP
                </Button>
              </CardContent>
            </Card>

            <Card className="autumn-card text-center">
              <CardContent className="p-6">
                <Camera className="w-12 h-12 text-autumn-terracotta mx-auto mb-4" />
                <h3 className="font-playfair text-lg font-semibold text-autumn-burgundy mb-2">
                  Vedi Foto
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Esplora i ricordi condivisi
                </p>
                <Button 
                  onClick={() => setActiveTab('gallery')}
                  variant="outline"
                  size="sm"
                  className="border-autumn-terracotta text-autumn-terracotta hover:bg-autumn-terracotta hover:text-white"
                >
                  Apri Galleria
                </Button>
              </CardContent>
            </Card>

            <Card className="autumn-card text-center">
              <CardContent className="p-6">
                <Upload className="w-12 h-12 text-autumn-terracotta mx-auto mb-4" />
                <h3 className="font-playfair text-lg font-semibold text-autumn-burgundy mb-2">
                  Carica Foto
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Condividi i tuoi momenti speciali
                </p>
                <Button 
                  onClick={() => setActiveTab('upload')}
                  variant="outline"
                  size="sm"
                  className="border-autumn-terracotta text-autumn-terracotta hover:bg-autumn-terracotta hover:text-white"
                >
                  Carica Ora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default Members;
