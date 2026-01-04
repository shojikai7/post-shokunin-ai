import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MEDIA_SIZES, type Channel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variantId, prompt, channel } = body as {
      variantId: string;
      prompt: string;
      channel: Channel;
    };

    if (!variantId || !prompt || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: variant } = await supabase
      .from('channel_variants')
      .select('*, drafts!inner(*, profiles!inner(*))')
      .eq('id', variantId)
      .single();

    if (!variant || variant.drafts.profiles.user_id !== user.id) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const mediaSize = MEDIA_SIZES.find((m) => m.channel === channel);
    const idempotencyKey = `${variantId}-final-${Date.now()}`;

    // Create generation job
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        variant_id: variantId,
        type: 'final',
        status: 'queued',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // In production, this would trigger a Cloud Run job via Pub/Sub
    // For MVP/demo, we'll simulate with a higher quality placeholder
    
    // Simulate final image generation
    const placeholderUrl = `https://placehold.co/${mediaSize?.width || 1024}x${mediaSize?.height || 1024}/7C3AED/white?text=Final+${channel.toUpperCase()}`;

    // Update job status
    await supabase
      .from('generation_jobs')
      .update({ status: 'succeeded' })
      .eq('id', job.id);

    // Create output asset
    const { data: asset } = await supabase
      .from('output_assets')
      .insert({
        variant_id: variantId,
        kind: 'final',
        width: mediaSize?.width || 1024,
        height: mediaSize?.height || 1024,
        format: 'png',
        storage_path: `generated/${user.id}/${variantId}/final.png`,
        public_url: placeholderUrl,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    // Increment usage count
    await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_type: 'generation',
    });

    return NextResponse.json({
      jobId: job.id,
      finalUrl: placeholderUrl,
      assetId: asset?.id,
    });

  } catch (error) {
    console.error('Final generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

