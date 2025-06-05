import React, { useEffect, useState } from 'react';
import { Image } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchOurPhotos, testBucketAccess, type OurPhoto } from '@/lib/storage';
import { toast } from 'sonner';

const Gallery = () => {
  const [photos, setPhotos] = useState<OurPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<any>(null);
  const isMobile = useIsMobile();

  // Temporarily expose test function for debugging
  useEffect(() => {
    (window as any).testBucketAccess = testBucketAccess;
    (window as any).fetchOurPhotos = fetchOurPhotos;
    
    return () => {
      delete (window as any).testBucketAccess;
      delete (window as any).fetchOurPhotos;
    };
  }, []);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setIsLoading(true);
        const ourPhotos = await fetchOurPhotos();
        console.log('Loaded photos:', ourPhotos);
        setPhotos(ourPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
        toast.error('Errore nel caricamento delle foto', {
          description: 'Non è stato possibile caricare le foto. Riprova più tardi.'
        });
        
        // Fallback to placeholder photos if our-photos bucket is empty or has errors
        const fallbackPhotos: OurPhoto[] = [
          {
            id: 'fallback-1',
            url: 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
            caption: 'La nostra prima vacanza insieme',
            filename: 'fallback-1.jpg'
          },
          {
            id: 'fallback-2',
            url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YXV0dW1ufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
            caption: 'Passeggiando tra i campi',
            filename: 'fallback-2.jpg'
          },
          {
            id: 'fallback-3',
            url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8YXV0dW1ufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
            caption: 'Il nostro posto preferito',
            filename: 'fallback-3.jpg'
          }
        ];
        setPhotos(fallbackPhotos);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  useEffect(() => {
    if (!api || photos.length === 0) return;

    // Auto-scroll every 3 seconds (increased from 2 seconds for better UX)
    const autoplayInterval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => {
      clearInterval(autoplayInterval);
    };
  }, [api, photos.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );
    
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item) => observer.observe(item));
    
    return () => {
      galleryItems.forEach((item) => observer.unobserve(item));
    };
  }, [photos]);

  if (isLoading) {
    return (
      <div className="section-container" id="galleria">
        <h2 className="section-title">La Nostra Galleria</h2>
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-autumn-amber h-12 w-12 mb-4"></div>
            <div className="h-4 bg-autumn-amber rounded w-32 mb-2"></div>
            <div className="h-3 bg-autumn-amber rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container" id="galleria">
      <h2 className="section-title">La Nostra Galleria</h2>
      
      {photos.length === 0 ? (
        <div className="text-center py-12 autumn-card">
          <Image className="w-16 h-16 text-autumn-amber mx-auto mb-4" />
          <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">
            Galleria in preparazione
          </h3>
          <p className="text-gray-600">
            Stiamo caricando le nostre foto più belle. Torna presto per vederle!
          </p>
        </div>
      ) : (
        <>
          <div className="relative mt-10 px-4">
            <Carousel setApi={setApi} opts={{ loop: true }}>
              <CarouselContent>
                {photos.map((photo) => (
                  <CarouselItem key={photo.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 gallery-item timeline-item-animate photo-gallery-item h-full">
                      <div className="aspect-w-4 aspect-h-3 h-60">
                        <img 
                          src={photo.url} 
                          alt={photo.caption}
                          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback image if photo fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60';
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                        <p className="text-white text-center font-medium">{photo.caption}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-7" />
                <CarouselNext className="-right-7" />
              </div>
            </Carousel>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-gray-700 mb-6">
              Condividi le tue foto del nostro matrimonio usando l'hashtag:
            </p>
            <div className="inline-block autumn-card py-3 px-6">
              <span className="text-autumn-burgundy text-2xl font-playfair">#LorenzoEGiulia2025</span>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <div className="flex items-center autumn-card py-3 px-6">
              <Image className="w-6 h-6 text-autumn-terracotta mr-3" />
              <span className="text-gray-700">Aggiungeremo altre foto dopo il grande giorno!</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Gallery;
