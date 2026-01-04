import { createClient } from '@supabase/supabase-js';
import { publishToX } from '../services/connectors/x';
import { publishToInstagram } from '../services/connectors/instagram';
import { publishToGBP } from '../services/connectors/gbp';

interface PublishJobData {
  attemptId: string;
  variantId: string;
  provider: 'x' | 'meta' | 'google' | 'tiktok';
  userId: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handlePublishJob(data: PublishJobData) {
  const { attemptId, variantId, provider, userId } = data;

  console.log(`Processing publish job ${attemptId} for variant ${variantId} to ${provider}`);

  try {
    // Get variant with post text and image
    const { data: variant, error: variantError } = await supabase
      .from('channel_variants')
      .select(`
        *,
        output_assets (
          id,
          kind,
          public_url
        )
      `)
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      throw new Error('Variant not found');
    }

    // Get user's connection for this provider
    const { data: connection, error: connectionError } = await supabase
      .from('publish_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (connectionError || !connection) {
      throw new Error(`No ${provider} connection found for user`);
    }

    // Get final image URL
    const finalAsset = variant.output_assets?.find((a: { kind: string }) => a.kind === 'final');
    const imageUrl = finalAsset?.public_url;

    // Build post content
    const postContent = {
      text: variant.post_text,
      hashtags: variant.hashtags,
      imageUrl,
    };

    // Decrypt tokens (in production, use proper encryption)
    const tokens = JSON.parse(connection.encrypted_tokens);

    // Publish based on provider
    let result;
    switch (provider) {
      case 'x':
        result = await publishToX(postContent, tokens);
        break;
      case 'meta':
        result = await publishToInstagram(postContent, tokens);
        break;
      case 'google':
        result = await publishToGBP(postContent, tokens);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Update attempt as successful
    await supabase
      .from('publish_attempts')
      .update({
        status: 'succeeded',
        post_id: result.postId,
        response: result,
      })
      .eq('id', attemptId);

    console.log(`Publish ${attemptId} completed successfully`);

    return {
      success: true,
      postId: result.postId,
    };

  } catch (error) {
    console.error(`Publish ${attemptId} failed:`, error);

    // Determine error code
    let errorCode = 'TEMPORARY_FAILURE';
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('token')) {
        errorCode = 'AUTH_EXPIRED';
      } else if (error.message.includes('rate')) {
        errorCode = 'RATE_LIMITED';
      }
    }

    // Update attempt as failed
    await supabase
      .from('publish_attempts')
      .update({
        status: 'failed',
        error_code: errorCode,
        error_detail: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', attemptId);

    throw error;
  }
}

