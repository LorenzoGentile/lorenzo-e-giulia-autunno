
import React, { useState } from 'react';
import InfinitePhotoGallery from './InfinitePhotoGallery';
import { fetchOurPhotos, OurPhoto } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image } from 'lucide-react';

const PhotoGallery = () => {
  const [ourPhotos, setOurPhotos] = useState<OurPhoto[]>([]);
  const [loadingOurPhotos, setLoadingOurPhotos] = useState(false);
  const [selectedOurPhoto, setSelectedOurPhoto] = useState<OurPhoto | null>(null);

  const loadOurPhotos = async () => {
    if (ourPhotos.length > 0) return; // Already loaded
    
    setLoadingOurPhotos(true);
    try {
      const photos = await fetchOurPhotos();
      setOurPhotos(photos);
    } catch (error) {
      console.error('Error loading our photos:', error);
    } finally {
      setLoadingOurPhotos(false);
    }
  };

  return (
    <div>
      <Tabs defaultValue="guests" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="guests">Guest Photos</TabsTrigger>
            <TabsTrigger value="couple" onClick={loadOurPhotos}>Our Photos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="guests">
          <InfinitePhotoGallery />
        </TabsContent>

        <TabsContent value="couple">
          {loadingOurPhotos ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full bg-autumn-amber h-12 w-12 mb-2"></div>
                <div className="h-4 bg-autumn-amber rounded w-24"></div>
              </div>
            </div>
          ) : ourPhotos.length === 0 ? (
            <div className="text-center py-12 autumn-card">
              <Image className="w-16 h-16 text-autumn-amber mx-auto mb-4" />
              <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">
                Our Photos Coming Soon
              </h3>
              <p className="text-gray-600">
                We'll be sharing our favorite moments here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ourPhotos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => setSelectedOurPhoto(photo)}
                >
                  <div className="aspect-w-4 aspect-h-3">
                    <img 
                      src={photo.url} 
                      alt={photo.caption}
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    <p className="text-white text-center font-medium">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Our Photos Modal */}
          {selectedOurPhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedOurPhoto(null)}>
              <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1"
                  onClick={() => setSelectedOurPhoto(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="bg-white rounded-lg overflow-hidden">
                  <img 
                    src={selectedOurPhoto.url} 
                    alt={selectedOurPhoto.caption}
                    className="max-h-[80vh] mx-auto object-contain"
                  />
                  <div className="p-4 bg-white">
                    <p className="text-gray-800">{selectedOurPhoto.caption}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhotoGallery;
