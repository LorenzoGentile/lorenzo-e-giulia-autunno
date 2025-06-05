import React, { useState, ChangeEvent } from 'react';

// TODO: Replace with your actual Supabase client import
// import { supabase } from '../lib/supabaseClient'; 

// Mock Supabase client for demonstration - REMOVE THIS and use your actual client
const supabase = {
  storage: {
    from: (bucketName: string) => ({
      upload: async (filePath: string, file: File, options?: any) => {
        console.log(`Mock uploading ${filePath} to ${bucketName} with options:`, options);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simulate a successful upload
        return { data: { path: filePath }, error: null };
        // To simulate an error:
        // return { data: null, error: { message: 'Mock upload failed due to network issue.' } };
      },
    }),
  },
  // Mock auth if you need user information
  // auth: {
  //   getUser: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
  // }
};

interface NewPhotoUploaderProps {
  // You can add props here if needed, e.g., onUploadSuccess callback
  // onUploadSuccess?: (filePath: string) => void;
  // userId?: string; // Pass if not relying on Supabase auth context here
}

const NewPhotoUploader: React.FC<NewPhotoUploaderProps> = (props) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/heic'];
  const acceptedExtensions = '.jpg,.jpeg,.png,.heic';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    const file = event.target.files?.[0];

    if (file) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      // HEIC files might have 'application/octet-stream' or other generic MIME types
      // So, we check extension for HEIC, and MIME type for others.
      if (!acceptedMimeTypes.includes(file.type) && fileExtension !== '.heic') {
        setError(`Invalid file type. Please upload a JPEG, PNG, or HEIC image. Detected type: ${file.type || 'unknown'}`);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        event.target.value = ''; // Clear the input
        return;
      }
      
      setSelectedFile(file);

      // Revoke previous object URL if one exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);

    } else {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
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
      // Example: Get user ID from Supabase auth if needed for the path
      // const { data: { user } } = await supabase.auth.getUser();
      // const userId = user?.id || 'anonymous_user';
      // const fileName = `${userId}/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

      // Using a generic path for now
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileName = `${Date.now()}_${sanitizedFileName}`;
      const filePath = `public/${fileName}`; // 'public' is often a default or common folder. Adjust if your bucket structure is different.

      const { data, error: uploadError } = await supabase.storage
        .from('wedding_photos') // Your specified bucket name
        .upload(filePath, selectedFile, {
          cacheControl: '3600', // Optional: Cache control header
          upsert: false,       // Optional: Set to true to overwrite existing files with the same path
        });

      if (uploadError) {
        throw uploadError;
      }

      if (data) {
        setSuccessMessage(`Photo uploaded successfully! Path: ${data.path}`);
        // props.onUploadSuccess?.(data.path);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        // Consider clearing the file input visually, though state reset should suffice
        // const fileInput = document.getElementById('photo-uploader-input') as HTMLInputElement;
        // if (fileInput) fileInput.value = '';
      } else {
        // This case should ideally be covered by uploadError, but as a fallback:
        setError('Upload completed but no data returned. Please check Supabase.');
      }
    } catch (e: any) {
      setError(`Upload failed: ${e.message || 'An unknown error occurred.'}`);
      console.error('Upload error details:', e);
    } finally {
      setUploading(false);
    }
  };

  // Cleanup object URL when component unmounts or previewUrl changes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '500px', margin: '20px auto' }}>
      <h3 style={{ marginTop: 0 }}>Upload Your Photo</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="photo-uploader-input">Choose an image (JPEG, PNG, HEIC):</label>
        <input
          id="photo-uploader-input"
          type="file"
          accept={acceptedExtensions}
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'block', marginTop: '5px' }}
        />
      </div>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}

      {previewUrl && selectedFile && (
        <div style={{ margin: '20px 0', border: '1px solid #eee', padding: '10px' }}>
          <h4>Preview:</h4>
          <img 
            src={previewUrl} 
            alt="Selected preview" 
            style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '10px auto' }} 
          />
          <p><strong>Filename:</strong> {selectedFile.name}</p>
          <p><strong>Type:</strong> {selectedFile.type || 'N/A (check extension for HEIC)'}</p>
          <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      {selectedFile && (
        <button 
          onClick={handleUpload} 
          disabled={uploading} 
          style={{ 
            padding: '10px 15px', 
            backgroundColor: uploading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: uploading ? 'not-allowed' : 'pointer' 
          }}
        >
          {uploading ? 'Uploading...' : 'Upload to Wedding Photos'}
        </button>
      )}
    </div>
  );
};

export default NewPhotoUploader; 