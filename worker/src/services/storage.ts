import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'generated-media';

export async function uploadToStorage(
  buffer: Buffer,
  path: string
): Promise<string> {
  console.log(`Uploading to storage: ${path}`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function deleteFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

