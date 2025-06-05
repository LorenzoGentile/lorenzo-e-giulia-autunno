import React, { useState, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Image, Upload, X } from 'lucide-react';

// Mock Supabase client for demonstration if not set up
const mockSupabase = {
  storage: {
    from: (bucketName: string) => ({
      upload: async (filePath: string, file: File) => {
        console.log(`Mock uploading ${filePath} to ${bucketName}...`);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simulate a successful upload
        // return { data: { path: filePath }, error: null };
        // Simulate an error
        // return { data: null, error: { message: 'Mock upload failed' } };
        // Simulate successful upload for now
        return { data: { path: filePath }, error: null };
      },
    }),
  },
};

interface PhotoUploadProps {
  // userId: string; // Or get from Supabase auth session
}

const PhotoUpload: React.FC<PhotoUploadProps> = (/*{ userId }*/) => {
  const { user, isInvitedGuest } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/heic'];
  const acceptedExtensions = '.jpg,.jpeg,.png,.heic';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    const file = event.target.files?.[0];

    if (file) {
      if (!acceptedTypes.includes(file.type) && !acceptedExtensions.includes(file.name.substring(file.name.lastIndexOf('.')).toLowerCase())) {
        // A simple check for HEIC based on extension if type is not specific enough (e.g., application/octet-stream)
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (fileExtension !== '.heic') {
            setError(`Invalid file type. Please upload a JPEG, PNG, or HEIC image. Type detected: ${file.type || 'unknown'}`);
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Ensure you have the user's ID for creating a unique path if needed
      // For example, if you want to store images in a user-specific folder:
      // const userId = supabase.auth.user()?.id; // This is an example, actual usage depends on your auth setup
      // if (!userId) {
      //   setError('User not authenticated.');
      //   setUploading(false);
      //   return;
      // }
      // const filePath = `public/${userId}/${Date.now()}_${selectedFile.name}`;
      
      // Generic path for now
      const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `public/${fileName}`; // Supabase storage typically uses 'public' for publicly accessible files or other RLS-protected paths

      const { data, error: uploadError } = await mockSupabase.storage
        .from('wedding-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false, // Set to true if you want to overwrite files with the same name
        });

      if (uploadError) {
        throw uploadError;
      }

      if (data) {
        setSuccessMessage(`Photo uploaded successfully! Path: ${data.path}`);
        setSelectedFile(null);
        setPreviewUrl(null);
        // Optionally, call a function to refresh a list of photos or notify parent component
      }
    } catch (e: any) {
      setError(`Upload failed: ${e.message || 'Unknown error'}`);
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto autumn-card">
      <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-playfair text-autumn-burgundy mb-2">Condividi i Tuoi Momenti</h3>
          <p className="text-gray-600 mb-4">
            Carica le tue foto del matrimonio da condividere con tutti gli ospiti
          </p>
        </div>
        
        {!previewUrl ? (
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
                accept={acceptedExtensions}
                onChange={handleFileChange}
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
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
            >
              <X className="w-4 h-4" />
            </Button>
            <img 
              src={previewUrl} 
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
            disabled={!selectedFile || uploading}
            className="autumn-button"
          >
            {uploading ? 'Caricamento in corso...' : 'Carica Foto'}
          </Button>
        </div>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {successMessage && <p className="text-green-500 mt-2">{successMessage}</p>}
    </div>
  );
};

export default PhotoUpload;
