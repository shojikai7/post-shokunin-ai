import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateImage } from '../services/image-generator';
import { uploadToStorage } from '../services/storage';

interface GenerationJobData {
  jobId: string;
  variantId: string;
  type: 'preview' | 'final';
  prompt: string;
  channel: string;
  aspectRatio: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleGenerationJob(data: GenerationJobData) {
  const { jobId, variantId, type, prompt, channel, aspectRatio } = data;

  console.log(`Processing ${type} generation job ${jobId} for variant ${variantId}`);

  try {
    // Update job status to running
    await supabase
      .from('generation_jobs')
      .update({ status: 'running' })
      .eq('id', jobId);

    // Determine dimensions based on channel
    const dimensions = getDimensions(channel, type);

    // Generate image using Gemini
    const imageBuffer = await generateImage({
      prompt,
      width: dimensions.width,
      height: dimensions.height,
      quality: type === 'final' ? 'high' : 'low',
    });

    // Upload to Supabase Storage
    const storagePath = `generated/${variantId}/${type}.png`;
    const publicUrl = await uploadToStorage(imageBuffer, storagePath);

    // Create output asset
    const { data: asset, error: assetError } = await supabase
      .from('output_assets')
      .insert({
        variant_id: variantId,
        kind: type,
        width: dimensions.width,
        height: dimensions.height,
        format: 'png',
        storage_path: storagePath,
        public_url: publicUrl,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (assetError) {
      throw new Error(`Failed to create output asset: ${assetError.message}`);
    }

    // Update job status to succeeded
    await supabase
      .from('generation_jobs')
      .update({ status: 'succeeded' })
      .eq('id', jobId);

    console.log(`Job ${jobId} completed successfully`);

    return {
      success: true,
      assetId: asset.id,
      publicUrl,
    };

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);

    // Update job status to failed
    await supabase
      .from('generation_jobs')
      .update({
        status: 'failed',
        error_code: 'GENERATION_ERROR',
        error_detail: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', jobId);

    throw error;
  }
}

function getDimensions(channel: string, type: 'preview' | 'final'): { width: number; height: number } {
  const channelDimensions: Record<string, { width: number; height: number }> = {
    x: { width: 1200, height: 675 },
    instagram: { width: 1080, height: 1080 },
    tiktok: { width: 1080, height: 1920 },
    gbp: { width: 1200, height: 900 },
    note: { width: 1280, height: 720 },
  };

  const base = channelDimensions[channel] || { width: 1024, height: 1024 };

  // Preview uses half resolution
  if (type === 'preview') {
    return {
      width: Math.round(base.width / 2),
      height: Math.round(base.height / 2),
    };
  }

  return base;
}

