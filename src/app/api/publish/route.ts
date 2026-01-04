import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Channel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variantId, channel } = body as {
      variantId: string;
      channel: Channel;
    };

    if (!variantId || !channel) {
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

    // Map channel to provider
    const providerMap: Record<Channel, string> = {
      x: 'x',
      instagram: 'meta',
      tiktok: 'tiktok',
      gbp: 'google',
      note: 'note', // Note doesn't support API posting
    };

    const provider = providerMap[channel];

    // Check if user has connected this provider
    const { data: connection } = await supabase
      .from('publish_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (!connection && channel !== 'note') {
      return NextResponse.json(
        { 
          error: 'Not connected',
          errorCode: 'AUTH_REQUIRED',
          message: `${channel}アカウントが連携されていません。設定から連携してください。`,
        },
        { status: 400 }
      );
    }

    // Create publish attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('publish_attempts')
      .insert({
        variant_id: variantId,
        provider,
        status: 'pending',
      })
      .select()
      .single();

    if (attemptError) {
      return NextResponse.json(
        { error: 'Failed to create publish attempt' },
        { status: 500 }
      );
    }

    try {
      // In production, this would call the actual SNS API
      // For MVP, we simulate a successful publish
      
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update attempt as successful
      await supabase
        .from('publish_attempts')
        .update({
          status: 'succeeded',
          post_id: `simulated-${Date.now()}`,
          response: { simulated: true },
        })
        .eq('id', attempt.id);

      // Increment usage count
      await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_type: 'publish',
      });

      // Create audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'publish.success',
        details: {
          variant_id: variantId,
          channel,
          attempt_id: attempt.id,
        },
      });

      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
        postId: `simulated-${Date.now()}`,
      });

    } catch (publishError) {
      // Update attempt as failed
      await supabase
        .from('publish_attempts')
        .update({
          status: 'failed',
          error_code: 'TEMPORARY_FAILURE',
          error_detail: publishError instanceof Error ? publishError.message : 'Unknown error',
        })
        .eq('id', attempt.id);

      // Create audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'publish.fail',
        details: {
          variant_id: variantId,
          channel,
          attempt_id: attempt.id,
          error: publishError instanceof Error ? publishError.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        { 
          error: 'Publish failed',
          errorCode: 'TEMPORARY_FAILURE',
          message: '投稿に失敗しました。もう一度お試しください。',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

