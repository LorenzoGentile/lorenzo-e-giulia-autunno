# Photo Storage Setup Guide

This guide explains how to set up and manage the photo storage system for your wedding website.

## Overview

The wedding website uses two Supabase storage buckets:

1. **`our-photos`** - Pre-selected photos by the couple (Lorenzo & Giulia)
2. **`wedding-photos`** - Photos uploaded by guests during the wedding

## Setting Up Storage Buckets

### 1. Create the `our-photos` bucket

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called `our-photos`
4. Set the bucket to **public** (so photos can be displayed without authentication)
5. Configure the bucket policies:

```sql
-- Allow public read access to our-photos bucket
CREATE POLICY "Public read access for our-photos" ON storage.objects
FOR SELECT USING (bucket_id = 'our-photos');

-- Allow authenticated users to upload to our-photos (for admin use)
CREATE POLICY "Authenticated upload to our-photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'our-photos' AND auth.role() = 'authenticated');
```

### 2. Create the `wedding-photos` bucket

1. Create a new bucket called `wedding-photos`
2. Set the bucket to **public** (so uploaded photos can be displayed)
3. Configure the bucket policies:

```sql
-- Allow public read access to wedding-photos bucket
CREATE POLICY "Public read access for wedding-photos" ON storage.objects
FOR SELECT USING (bucket_id = 'wedding-photos');

-- Allow authenticated users to upload to wedding-photos
CREATE POLICY "Authenticated upload to wedding-photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wedding-photos' AND auth.role() = 'authenticated');
```

## Uploading Photos to `our-photos`

### Method 1: Using Supabase Dashboard
1. Go to Storage > our-photos in your Supabase dashboard
2. Upload your selected photos directly
3. Recommended file naming: use descriptive names like `proposal-day.jpg`, `first-vacation.jpg`, etc.

### Method 2: Using the Supabase CLI
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to your project
supabase login

# Upload photos
supabase storage cp ./local-photos/* supabase://our-photos/
```

### Method 3: Programmatically
```typescript
import { supabase } from '@/integrations/supabase/client';

const uploadOurPhoto = async (file: File, filename: string) => {
  const { data, error } = await supabase.storage
    .from('our-photos')
    .upload(filename, file);
    
  if (error) {
    console.error('Error uploading photo:', error);
    return;
  }
  
  console.log('Photo uploaded successfully:', data);
};
```

## Photo Naming Conventions

For better automatic caption generation, use descriptive filenames:

- `proposal-day.jpg` → "Proposal day"
- `first-vacation-together.jpg` → "First vacation together"
- `anniversary-dinner.jpg` → "Anniversary dinner"
- `hiking-adventure.jpg` → "Hiking adventure"

## File Formats and Sizes

- **Supported formats**: JPG, PNG, WebP
- **Recommended size**: 800-1200px width for optimal loading
- **Maximum file size**: 5MB per photo
- **Recommended aspect ratio**: 4:3 or 16:9 for best display in the carousel

## How the Gallery Works

### Current Implementation
1. The `Gallery` component fetches photos from the `our-photos` bucket
2. Photos are displayed in a responsive carousel
3. Captions are automatically generated from filenames or use default Italian captions
4. If the bucket is empty or there's an error, fallback placeholder images are shown

### Future Wedding Day Feature
- Guests will be able to upload photos to the `wedding-photos` bucket
- These photos will be displayed in a separate gallery section
- The existing `PhotoUpload` and `PhotoGallery` components handle this functionality

## Troubleshooting

### Photos not loading
1. Check that the `our-photos` bucket exists and is public
2. Verify the bucket policies allow public read access
3. Ensure photos are properly uploaded to the bucket
4. Check browser console for any error messages

### Upload issues
1. Verify file size is under 5MB
2. Check that the file format is supported (JPG, PNG, WebP)
3. Ensure proper authentication for admin uploads

### Caption issues
- Captions are generated from filenames
- Use descriptive filenames for better captions
- Special characters and numbers in filenames may result in default captions

## Storage Costs

Supabase storage pricing (as of 2024):
- First 1GB: Free
- Additional storage: $0.021 per GB per month
- Bandwidth: $0.09 per GB

For a typical wedding photo collection (50-100 photos at ~2MB each), you'll likely stay within the free tier.

## Security Considerations

- The `our-photos` bucket is public for display purposes
- Only authenticated users can upload to either bucket
- Guest uploads are tracked in the database with user associations
- Consider implementing file type validation and virus scanning for production use

## Next Steps

1. Create both storage buckets in your Supabase dashboard
2. Upload your selected photos to the `our-photos` bucket
3. Test the gallery display on your website
4. Prepare for the wedding day photo upload feature

The system is now ready to display your pre-selected photos and will be ready for guest uploads during your wedding! 