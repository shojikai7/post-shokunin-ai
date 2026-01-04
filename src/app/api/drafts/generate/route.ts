import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTextModel } from '@/lib/gemini/client';
import { buildPostGenerationPrompt, buildImagePromptGenerationPrompt } from '@/lib/gemini/prompts';
import { CHANNEL_CONFIGS, type Channel, type Profile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, inputText, eventInfo, language, channels } = body;

    // Validate input
    if (!profileId || !inputText || !channels?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create draft
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        profile_id: profileId,
        input_text: inputText,
        event_info: eventInfo,
        language,
        selected_channels: channels,
        is_saved: false,
      })
      .select()
      .single();

    if (draftError || !draft) {
      console.error('Draft creation error:', draftError);
      return NextResponse.json(
        { error: 'Failed to create draft' },
        { status: 500 }
      );
    }

    // Generate variants for each channel
    const variants: Record<string, {
      id: string;
      postText: string;
      hashtags: string[];
      rawPrompt: string;
      structuredPrompt: string;
    }> = {};

    const model = getTextModel();

    for (const channelId of channels as Channel[]) {
      try {
        // Generate post text and hashtags
        const postPrompt = buildPostGenerationPrompt(
          profile as unknown as Profile,
          eventInfo ? `${eventInfo.title}\n${eventInfo.description}\n${inputText}` : inputText,
          channelId
        );

        const postResult = await model.generateContent(postPrompt);
        const postResponse = postResult.response.text();
        
        // Parse JSON response
        let postData: { postText: string; hashtags: string[] };
        try {
          // Extract JSON from response (might be wrapped in markdown)
          const jsonMatch = postResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            postData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        } catch {
          // Fallback: use raw text
          postData = {
            postText: postResponse.substring(0, CHANNEL_CONFIGS.find(c => c.id === channelId)?.maxTextLength || 280),
            hashtags: [],
          };
        }

        // Generate image prompt
        const imagePromptPrompt = buildImagePromptGenerationPrompt(
          profile as unknown as Profile,
          postData.postText,
          channelId
        );

        const imagePromptResult = await model.generateContent(imagePromptPrompt);
        const imagePromptResponse = imagePromptResult.response.text();

        let imagePromptData: { rawPrompt: string; structuredPrompt: string };
        try {
          const jsonMatch = imagePromptResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            imagePromptData = {
              rawPrompt: parsed.rawPrompt || parsed.prompt || '',
              structuredPrompt: parsed.structuredPrompt || JSON.stringify(parsed),
            };
          } else {
            throw new Error('No JSON found');
          }
        } catch {
          imagePromptData = {
            rawPrompt: imagePromptResponse.substring(0, 500),
            structuredPrompt: '',
          };
        }

        // Save variant to database
        const { data: variant, error: variantError } = await supabase
          .from('channel_variants')
          .insert({
            draft_id: draft.id,
            channel: channelId,
            post_text: postData.postText,
            hashtags: postData.hashtags,
            raw_prompt: imagePromptData.rawPrompt,
            structured_prompt: imagePromptData.structuredPrompt,
            image_spec: {
              aspectRatio: CHANNEL_CONFIGS.find(c => c.id === channelId)?.aspectRatio || '1:1',
            },
          })
          .select()
          .single();

        if (variantError) {
          console.error(`Variant creation error for ${channelId}:`, variantError);
          continue;
        }

        variants[channelId] = {
          id: variant.id,
          postText: postData.postText,
          hashtags: postData.hashtags,
          rawPrompt: imagePromptData.rawPrompt,
          structuredPrompt: imagePromptData.structuredPrompt,
        };

      } catch (error) {
        console.error(`Error generating variant for ${channelId}:`, error);
        // Continue with other channels even if one fails
      }
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'variant.generate',
      details: {
        draft_id: draft.id,
        channels: channels,
        variant_count: Object.keys(variants).length,
      },
    });

    return NextResponse.json({
      draftId: draft.id,
      variants,
    });

  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

