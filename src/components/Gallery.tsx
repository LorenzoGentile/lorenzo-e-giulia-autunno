
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

const Gallery = () => {
  // For placeholder images, we'll use placeholder URLs
  const photos = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
      caption: 'La nostra prima vacanza insieme'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YXV0dW1ufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
      caption: 'Passeggiando tra i campi'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8YXV0dW1ufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
      caption: 'Il nostro posto preferito'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjJ8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
      caption: 'Le nostre escursioni'
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTh8fGF1dHVtbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
      caption: 'Il giorno della proposta'
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1517594422361-5eeb8ae275a9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGl0YWx5JTIwdmluZXlhcmR8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
      caption: 'Il nostro primo anniversario'
    }
  ];

  const [api, setApi] = useState<any>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!api) return;

    // Auto-scroll every 2 seconds
    const autoplayInterval = setInterval(() => {
      api.scrollNext();
    }, 2000);

    return () => {
      clearInterval(autoplayInterval);
    };
  }, [api]);

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
  }, []);

  return (
    <div className="section-container" id="galleria">
      <h2 className="section-title">La Nostra Galleria</h2>
      
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
    </div>
  );
};

export default Gallery;
