
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PhotoReactions from './PhotoReactions';
import PhotoComments from './PhotoComments';
import { Image, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type WeddingPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  invited_guests?: {
    name: string;
  };
};

const PHOTOS_PER_PAGE = 12;

const InfinitePhotoGallery = () => {
  const { user, isInvitedGuest } = useAuth();
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<WeddingPhoto | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos(true);
  }, []);

  const fetchPhotos = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = reset ? 0 : photos.length;
      
      const { data, error } = await supabase
        .from('wedding_photos')
        .select(`
          *,
          invited_guests (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + PHOTOS_PER_PAGE - 1);

      if (error) throw error;

      const newPhotos = data || [];
      
      if (reset) {
        setPhotos(newPhotos);
      } else {
        setPhotos(prev => [...prev, ...newPhotos]);
      }

      setHasMore(newPhotos.length === PHOTOS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 &&
      hasMore &&
      !loadingMore
    ) {
      fetchPhotos(false);
    }
  }, [hasMore, loadingMore, photos.length]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !user || !isInvitedGuest) return;

    setUploading(true);

    try {
      const { data: guestData, error: guestError } = await supabase
        .from('invited_guests')
        .select('id')
        .eq('email', user.email)
        .single();

      if (guestError) throw guestError;

      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${guestData.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wedding_photos')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('wedding_photos')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('wedding_photos')
        .insert({
          guest_id: guestData.id,
          image_url: publicURLData.publicUrl,
          caption: uploadCaption || null
        });

      if (insertError) throw insertError;

      toast.success('Photo uploaded successfully!');
      setUploadFile(null);
      setUploadCaption('');
      setShowUploadForm(false);
      fetchPhotos(true);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-autumn-amber h-12 w-12 mb-2"></div>
          <div className="h-4 bg-autumn-amber rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {user && isInvitedGuest && (
        <div className="autumn-card">
          {!showUploadForm ? (
            <Button
              onClick={() => setShowUploadForm(true)}
              className="w-full autumn-button flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Share a Photo</span>
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-playfair text-autumn-burgundy">Share a Photo</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadFile(null);
                    setUploadCaption('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />

              {uploadFile && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <Textarea
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                disabled={uploading}
              />

              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="w-full autumn-button"
              >
                {uploading ? 'Uploading...' : 'Share Photo'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 autumn-card">
          <Image className="w-16 h-16 text-autumn-amber mx-auto mb-4" />
          <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">
            No photos yet
          </h3>
          <p className="text-gray-600">
            Be the first to share a memory!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {photos.map((photo) => (
            <div key={photo.id} className="autumn-card space-y-4">
              {/* Photo Header */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-autumn-amber rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {photo.invited_guests?.name?.charAt(0) || 'G'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-autumn-burgundy">
                    {photo.invited_guests?.name || 'Guest'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Photo */}
              <div className="relative">
                <img
                  src={photo.image_url}
                  alt={photo.caption || 'Wedding photo'}
                  className="w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </div>

              {/* Caption */}
              {photo.caption && (
                <p className="text-gray-700">{photo.caption}</p>
              )}

              {/* Reactions and Comments */}
              <div className="flex items-center justify-between pt-2">
                <PhotoReactions photoId={photo.id} />
                <PhotoComments photoId={photo.id} />
              </div>
            </div>
          ))}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex items-center space-x-2">
                <div className="rounded-full bg-autumn-amber h-2 w-2"></div>
                <div className="rounded-full bg-autumn-amber h-2 w-2"></div>
                <div className="rounded-full bg-autumn-amber h-2 w-2"></div>
              </div>
            </div>
          )}

          {!hasMore && photos.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>You've seen all the photos!</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.caption || 'Wedding photo'}
                className="w-full max-h-[70vh] object-contain"
              />
              
              <div className="p-4 space-y-4">
                {selectedPhoto.caption && (
                  <p className="text-gray-800">{selectedPhoto.caption}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <PhotoReactions photoId={selectedPhoto.id} />
                  <PhotoComments photoId={selectedPhoto.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfinitePhotoGallery;
