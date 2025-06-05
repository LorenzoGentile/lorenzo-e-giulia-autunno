import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Image, Upload, X } from 'lucide-react';

// Mock Supabase client for demonstration if not set up
// const mockSupabase = {
//   storage: {
//     from: (bucketName: string) => ({
//       upload: async (filePath: string, file: File) => {
//         console.log(`Mock uploading ${filePath} to ${bucketName}...`);
//         // Simulate upload delay
//         await new Promise(resolve => setTimeout(resolve, 1500));
//         // Simulate a successful upload
//         // return { data: { path: filePath }, error: null };
//         // Simulate an error
//         // return { data: null, error: { message: 'Mock upload failed' } };
//         // Simulate successful upload for now
//         return { data: { path: filePath }, error: null };
//       },
//     }),
//   },
// };

interface PhotoUploadProps {
  // userId: string; // Or get from Supabase auth session
}

const PhotoUpload: React.FC<PhotoUploadProps> = (/*{ userId }*/) => {
  const { user, isInvitedGuest } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/heic'];
  const acceptedExtensions = '.jpg,.jpeg,.png,.heic';
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // Ref to hold current previewUrls for cleanup in useEffect, as state in cleanup might be stale
  const previewUrlsRef = useRef(previewUrls);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      if (previewUrlsRef.current) {
        previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      }
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    const newFilesFromInput = event.target.files;

    // Revoke any existing preview URLs before processing new files
    if (previewUrls) {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    }

    if (newFilesFromInput && newFilesFromInput.length > 0) {
      const validFiles: File[] = [];
      const currentPreviewUrls: string[] = [];
      const invalidFileMessages: string[] = [];

      Array.from(newFilesFromInput).forEach(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!acceptedTypes.includes(file.type) && fileExtension !== '.heic') {
          invalidFileMessages.push(`Skipped ${file.name}: Invalid type. Only JPEG, PNG, HEIC.`);
        } else if (file.size > MAX_FILE_SIZE_BYTES) {
          invalidFileMessages.push(`Skipped ${file.name}: Too large (max ${MAX_FILE_SIZE_MB}MB).`);
        } else {
          validFiles.push(file);
          currentPreviewUrls.push(URL.createObjectURL(file));
        }
      });

      setSelectedFiles(validFiles.length > 0 ? validFiles : null);
      setPreviewUrls(currentPreviewUrls.length > 0 ? currentPreviewUrls : null);

      if (invalidFileMessages.length > 0) {
        const errorMsg = invalidFileMessages.join('\n');
        toast.error(errorMsg, { duration: 5000 });
        setError(errorMsg); // Show inline as well if desired
      }
      
      if (validFiles.length === 0 && newFilesFromInput.length > 0) {
        toast.info('No valid files were selected.');
      } else if (validFiles.length > 0 && invalidFileMessages.length === 0) {
        // Optionally, toast for successfully added files
        // toast.success(`${validFiles.length} file(s) ready for preview.`);
      }

    } else { // No files selected or input cleared
      setSelectedFiles(null);
      setPreviewUrls(null);
    }
    // Clear the file input's value to allow re-selecting the same file(s)
    event.target.value = '';
  };
  
  const clearSelection = () => {
    if (previewUrls) {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    }
    setSelectedFiles(null);
    setPreviewUrls(null);
    setError(null);
    setSuccessMessage(null);
    // Also clear the file input if you can get a ref to it, or rely on event.target.value = '' in handleFileChange
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload.');
      return;
    }

    if (!user || !isInvitedGuest) {
      toast.error('Authentication required. Please log in as an invited guest.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    let guestId: string;
    try {
      const { data: guestData, error: guestError } = await supabase
        .from('invited_guests')
        .select('id')
        .eq('email', user.email)
        .single();
      if (guestError) throw guestError;
      if (!guestData) throw new Error('Invited guest information not found for your account.');
      guestId = guestData.id;
    } catch (e: any) {
      toast.error(`Failed to verify guest status: ${e.message || 'Unknown error'}`);
      setUploading(false);
      return;
    }

    let successfulUploadCount = 0;
    const individualUploadErrors: { fileName: string, message: string }[] = [];

    for (const file of selectedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const sanitizedFileNameBase = file.name.substring(0, file.name.lastIndexOf('.'))
                                        .replace(/[^a-zA-Z0-9_.-]/g, '_');
        // Add a small random string to further ensure uniqueness for batch uploads
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const uniqueFileName = `${Date.now()}_${sanitizedFileNameBase}_${randomSuffix}.${fileExt}`;
        const filePath = `${guestId}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wedding_photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicURLData } = supabase.storage
          .from('wedding_photos')
          .getPublicUrl(filePath);

        if (!publicURLData || !publicURLData.publicUrl) {
          await supabase.storage.from('wedding_photos').remove([filePath]).catch(console.error); // Attempt cleanup
          throw new Error('Could not retrieve public URL for the uploaded image.');
        }
        const imageUrl = publicURLData.publicUrl;

        const { error: insertError } = await supabase
          .from('wedding_photos')
          .insert({
            guest_id: guestId,
            image_url: imageUrl,
            caption: caption || null, // Same caption for all files in this batch
          });

        if (insertError) {
          await supabase.storage.from('wedding_photos').remove([filePath]).catch(console.error); // Attempt cleanup
          throw new Error(insertError.message);
        }
        successfulUploadCount++;
      } catch (e: any) {
        console.error(`Upload failed for ${file.name}:`, e);
        individualUploadErrors.push({ fileName: file.name, message: e.message || 'Unknown error' });
      }
    }

    setUploading(false);

    if (successfulUploadCount > 0) {
      toast.success(`${successfulUploadCount} photo${successfulUploadCount > 1 ? 's' : ''} uploaded successfully! Thank you.`);
    }
    if (individualUploadErrors.length > 0) {
      const errorSummary = individualUploadErrors.map(err => `${err.fileName}: ${err.message}`).join('\n');
      toast.error(`Failed to upload ${individualUploadErrors.length} photo${individualUploadErrors.length > 1 ? 's' : ''}. Check details.`, { duration: 7000 });
      setError(`Some uploads failed:\n${errorSummary}`);
    }

    // Reset form state regardless of partial success/failure to avoid re-uploading successful ones
    // Or, you could filter selectedFiles to keep only failed ones for a retry mechanism (more complex)
    if (previewUrls) { // Revoke all original preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));
    }
    setSelectedFiles(null);
    setPreviewUrls(null);
    setCaption('');
    
    // Also clear the file input visually
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (successfulUploadCount > 0 && individualUploadErrors.length === 0) {
        setSuccessMessage(`${successfulUploadCount} photo${successfulUploadCount > 1 ? 's' : ''} uploaded!`);
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
        
        {(!previewUrls || previewUrls.length === 0) ? (
          <div className="border-2 border-dashed border-autumn-amber rounded-lg p-8 text-center">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-10 h-10 text-autumn-terracotta mb-2" />
              <span className="text-sm text-gray-500 mb-2">
                Clicca per selezionare o trascina immagini
              </span>
              <span className="text-xs text-gray-400">
                JPG, PNG, HEIC fino a ${MAX_FILE_SIZE_MB}MB ciascuna
              </span>
              <Input 
                type="file" 
                accept={acceptedExtensions}
                onChange={handleFileChange}
                className="hidden"
                multiple // Allow multiple file selection
              />
            </label>
          </div>
        ) : (
          // Display multiple previews
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  {/* Optionally, add a way to remove individual files before upload here */}
                </div>
              ))}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="w-full" 
              >
                <X className="w-4 h-4 mr-2" /> Svuota Selezione
            </Button>
          </div>
        )}
        
        <div>
          <label htmlFor="caption-input" className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione (opzionale, si applicherà a tutte le foto caricate)
          </label>
          <Textarea
            id="caption-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Aggiungi una descrizione..."
            className="w-full px-4 py-3 rounded-md border border-autumn-amber focus:outline-none focus:ring-2 focus:ring-autumn-terracotta"
            disabled={uploading}
          />
        </div>
        
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
            className="autumn-button"
          >
            {uploading 
              ? `Caricamento ${selectedFiles?.length || 0} foto...` 
              : `Carica ${selectedFiles?.length || 0} Foto`}
          </Button>
        </div>
      </form>

      {/* Keep inline error/success for detailed messages if needed, toast is primary */}
      {error && <p className="text-red-500 mt-2 whitespace-pre-line">{error}</p>}
      {successMessage && <p className="text-green-500 mt-2">{successMessage}</p>}
    </div>
  );
};

export default PhotoUpload;
