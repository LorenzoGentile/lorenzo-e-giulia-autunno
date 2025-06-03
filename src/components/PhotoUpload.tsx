
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Image, Upload, X } from 'lucide-react';

const PhotoUpload = () => {
  const { user, isInvitedGuest } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedImage(null);
      setPreview(null);
      return;
    }

    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.includes('image/')) {
      toast.error('File type not supported', {
        description: 'Please select an image file (JPEG, PNG, etc.)'
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please select an image smaller than 5MB'
      });
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Clean up preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  const clearImage = () => {
    setSelectedImage(null);
    setPreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isInvitedGuest) {
      toast.error('Authentication required', {
        description: 'You must be logged in as an invited guest to upload photos'
      });
      return;
    }
    
    if (!selectedImage) {
      toast.error('No image selected', {
        description: 'Please select an image to upload'
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Get guest ID
      const { data: guestData, error: guestError } = await supabase
        .from('invited_guests')
        .select('id')
        .eq('email', user.email)
        .single();
        
      if (guestError) throw guestError;
      
      if (!guestData) {
        throw new Error('Guest information not found');
      }
      
      // Generate a unique file name
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('wedding_photos')
        .upload(filePath, selectedImage);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: publicURLData } = supabase.storage
        .from('wedding_photos')
        .getPublicUrl(filePath);
        
      // Save to wedding_photos table
      const { error: saveError } = await supabase
        .from('wedding_photos')
        .insert({
          guest_id: guestData.id,
          image_url: publicURLData.publicUrl,
          caption
        });
        
      if (saveError) throw saveError;
      
      toast.success('Photo uploaded successfully!', {
        description: 'Thank you for sharing your memory!'
      });
      
      // Reset form
      setSelectedImage(null);
      setPreview(null);
      setCaption('');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error.message || 'An error occurred while uploading the photo'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto autumn-card">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">Condividi i Tuoi Momenti</h3>
          <p className="text-gray-600 mb-4">
            Carica le tue foto del matrimonio da condividere con tutti gli ospiti
          </p>
        </div>
        
        {!preview ? (
          <div className="border-2 border-dashed border-autumn-amber rounded-lg p-8 text-center">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-10 h-10 text-autumn-terracotta mb-2" />
              <span className="text-sm text-gray-500 mb-2">
                Clicca per selezionare o trascina un'immagine
              </span>
              <span className="text-xs text-gray-400">
                JPG, PNG fino a 5MB
              </span>
              <Input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="relative">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 rounded-full"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
            <img 
              src={preview} 
              alt="Preview" 
              className="mx-auto max-h-80 rounded-lg object-contain"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione (opzionale)
          </label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Aggiungi una descrizione alla tua foto..."
            className="w-full px-4 py-3 rounded-md border border-autumn-amber focus:outline-none focus:ring-2 focus:ring-autumn-terracotta"
          />
        </div>
        
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!selectedImage || isUploading}
            className="autumn-button"
          >
            {isUploading ? 'Caricamento in corso...' : 'Carica Foto'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PhotoUpload;
