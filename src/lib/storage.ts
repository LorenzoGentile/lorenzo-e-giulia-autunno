import { supabase } from '@/integrations/supabase/client';

export interface OurPhoto {
  id: string;
  url: string;
  caption: string;
  filename: string;
}

export interface WeddingPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  guest_id: string;
}

/**
 * Fetch photos from the our-photos bucket
 * These are pre-selected photos by the couple
 */
export const fetchOurPhotos = async (): Promise<OurPhoto[]> => {
  try {
    console.log('Fetching photos from our-photos bucket...');
    
    // List all files in the our-photos bucket
    const { data: files, error: listError } = await supabase.storage
      .from('our-photos')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    console.log('Raw files response:', { files, listError });

    if (listError) {
      console.error('Error listing our photos:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found in our-photos bucket');
      return [];
    }

    console.log('Files found:', files);

    // Filter out directories and system files
    const imageFiles = files.filter(file => {
      const isFile = file.name && !file.name.includes('.emptyFolderPlaceholder');
      const isImage = file.name && /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
      console.log(`File: ${file.name}, isFile: ${isFile}, isImage: ${isImage}`);
      return isFile && isImage;
    });

    console.log('Filtered image files:', imageFiles);

    if (imageFiles.length === 0) {
      console.log('No image files found after filtering');
      return [];
    }

    // Get public URLs for all files
    const photos: OurPhoto[] = imageFiles.map((file, index) => {
      console.log(`Processing file: ${file.name}`);
      
      const { data: publicUrlData } = supabase.storage
        .from('our-photos')
        .getPublicUrl(file.name);

      console.log(`Public URL for ${file.name}:`, publicUrlData.publicUrl);

      return {
        id: `our-photo-${index}`,
        url: publicUrlData.publicUrl,
        caption: getPhotoCaption(file.name),
        filename: file.name
      };
    });

    console.log('Final photos array:', photos);
    return photos;
  } catch (error) {
    console.error('Error fetching our photos:', error);
    throw error;
  }
};

/**
 * Generate captions based on filename or return default captions
 */
const getPhotoCaption = (filename: string): string => {
  // Remove file extension and clean up filename
  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  
  // Default captions for common photo types
  const defaultCaptions = [
    'La nostra prima vacanza insieme',
    'Passeggiando tra i campi',
    'Il nostro posto preferito',
    'Le nostre escursioni',
    'Il giorno della proposta',
    'Il nostro primo anniversario',
    'Momenti speciali insieme',
    'I nostri ricordi più belli'
  ];

  // If filename contains meaningful words, use it as caption
  if (cleanName.length > 3 && !cleanName.match(/^\d+$/)) {
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  // Otherwise, return a random default caption
  return defaultCaptions[Math.floor(Math.random() * defaultCaptions.length)];
};

/**
 * Fetch wedding photos uploaded by guests
 * This will be used in the future for the wedding_photos functionality
 */
export const fetchWeddingPhotos = async (): Promise<WeddingPhoto[]> => {
  try {
    const { data, error } = await supabase
      .from('wedding_photos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching wedding photos:', error);
    throw error;
  }
};

/**
 * Upload a photo to the wedding_photos bucket
 * This will be used by guests during the wedding
 */
export const uploadWeddingPhoto = async (
  file: File, 
  guestId: string, 
  caption?: string
): Promise<string> => {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${guestId}/${fileName}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('wedding_photos')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: publicURLData } = supabase.storage
      .from('wedding_photos')
      .getPublicUrl(filePath);
      
    // Save to wedding_photos table
    const { error: saveError } = await supabase
      .from('wedding_photos')
      .insert({
        guest_id: guestId,
        image_url: publicURLData.publicUrl,
        caption: caption || null
      });
      
    if (saveError) throw saveError;
    
    return publicURLData.publicUrl;
  } catch (error) {
    console.error('Error uploading wedding photo:', error);
    throw error;
  }
};

/**
 * Test function to verify bucket access
 * This can be called from the console to debug bucket issues
 */
export const testBucketAccess = async () => {
  try {
    console.log('Testing bucket access...');
    
    // Test if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets, 'Error:', bucketsError);
    
    // Test if we can access our-photos bucket specifically
    const { data: files, error: listError } = await supabase.storage
      .from('our-photos')
      .list();
    
    console.log('our-photos bucket contents:', files, 'Error:', listError);
    
    // Test getting a public URL for a known file
    if (files && files.length > 0) {
      const firstFile = files[0];
      const { data: urlData } = supabase.storage
        .from('our-photos')
        .getPublicUrl(firstFile.name);
      
      console.log(`Public URL for ${firstFile.name}:`, urlData.publicUrl);
    }
    
    return { buckets, files, listError };
  } catch (error) {
    console.error('Bucket access test failed:', error);
    return { error };
  }
}; 