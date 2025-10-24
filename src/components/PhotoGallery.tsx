
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image, Loader2 } from 'lucide-react';

type WeddingPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  shooting_time: string | null;
};

const PhotoGallery = () => {
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<WeddingPhoto | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerTarget = useRef(null);
  
  const PHOTOS_PER_PAGE = 20;

  const fetchPhotos = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const from = pageNum * PHOTOS_PER_PAGE;
      const to = from + PHOTOS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('wedding_photos')
        .select('*', { count: 'exact' })
        .order('shooting_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      if (pageNum === 0) {
        setPhotos(data || []);
      } else {
        setPhotos(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((count || 0) > (pageNum + 1) * PHOTOS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos', {
        description: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos(0);
  }, [fetchPhotos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchPhotos(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, fetchPhotos]);

  const openPhotoModal = (photo: WeddingPhoto) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-autumn-amber h-12 w-12 mb-2"></div>
          <div className="h-4 bg-autumn-amber rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 autumn-card">
        <Image className="w-16 h-16 text-autumn-amber mx-auto mb-4" />
        <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">
          Nessuna foto ancora
        </h3>
        <p className="text-gray-600">
          Sii il primo a condividere un ricordo! Le foto caricate appariranno qui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => openPhotoModal(photo)}
          >
            <div className="aspect-w-4 aspect-h-3">
              <img 
                src={photo.image_url} 
                alt={photo.caption || 'Wedding photo'}
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            {photo.caption && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                <p className="text-white text-center font-medium">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-autumn-amber">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Caricamento altre foto...</span>
            </div>
          )}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={closePhotoModal}>
          <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1"
              onClick={closePhotoModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <img 
                src={selectedPhoto.image_url} 
                alt={selectedPhoto.caption || 'Wedding photo'}
                className="max-h-[80vh] mx-auto object-contain"
              />
              {selectedPhoto.caption && (
                <div className="p-4 bg-white">
                  <p className="text-gray-800">{selectedPhoto.caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
