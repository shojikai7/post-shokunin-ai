'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ProfileFormData, ToneConfig, CampaignInfo } from '@/types';

export async function createProfile(formData: ProfileFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  const toneSettings: ToneConfig = {
    formality: formData.toneFormality,
    emojiUsage: formData.toneEmojiUsage,
    endingStyle: formData.toneEndingStyle,
    hardness: formData.toneHardness as 1 | 2 | 3 | 4 | 5,
    ctaStrength: formData.toneCtaStrength as 1 | 2 | 3 | 4 | 5,
    ngWords: formData.ngWords.split('\n').filter(w => w.trim()),
    replacements: [],
  };

  const campaignInfo: CampaignInfo | null = formData.campaignName
    ? {
        name: formData.campaignName,
        startDate: formData.campaignStartDate,
        endDate: formData.campaignEndDate,
        price: formData.campaignPrice,
        benefits: formData.campaignBenefits,
      }
    : null;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      brand_name: formData.brandName,
      description_short: formData.descriptionShort,
      description_long: formData.descriptionLong,
      target_audience: formData.targetAudience,
      strengths: formData.strengths,
      prohibited_expressions: formData.prohibitedExpressions.split('\n').filter(e => e.trim()),
      campaign_info: campaignInfo,
      reference_urls: formData.referenceUrls.split('\n').filter(u => u.trim()),
      tone_settings: toneSettings,
    })
    .select()
    .single();

  if (error) {
    console.error('Profile creation error:', error);
    return { error: 'プロファイルの作成に失敗しました' };
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'profile.create',
    details: { profile_id: data.id, brand_name: formData.brandName },
  });

  revalidatePath('/profiles');
  redirect('/profiles');
}

export async function updateProfile(profileId: string, formData: ProfileFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  const toneSettings: ToneConfig = {
    formality: formData.toneFormality,
    emojiUsage: formData.toneEmojiUsage,
    endingStyle: formData.toneEndingStyle,
    hardness: formData.toneHardness as 1 | 2 | 3 | 4 | 5,
    ctaStrength: formData.toneCtaStrength as 1 | 2 | 3 | 4 | 5,
    ngWords: formData.ngWords.split('\n').filter(w => w.trim()),
    replacements: [],
  };

  const campaignInfo: CampaignInfo | null = formData.campaignName
    ? {
        name: formData.campaignName,
        startDate: formData.campaignStartDate,
        endDate: formData.campaignEndDate,
        price: formData.campaignPrice,
        benefits: formData.campaignBenefits,
      }
    : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      brand_name: formData.brandName,
      description_short: formData.descriptionShort,
      description_long: formData.descriptionLong,
      target_audience: formData.targetAudience,
      strengths: formData.strengths,
      prohibited_expressions: formData.prohibitedExpressions.split('\n').filter(e => e.trim()),
      campaign_info: campaignInfo,
      reference_urls: formData.referenceUrls.split('\n').filter(u => u.trim()),
      tone_settings: toneSettings,
    })
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    return { error: 'プロファイルの更新に失敗しました' };
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'profile.update',
    details: { profile_id: profileId, brand_name: formData.brandName },
  });

  revalidatePath('/profiles');
  redirect('/profiles');
}

export async function deleteProfile(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Profile deletion error:', error);
    return { error: 'プロファイルの削除に失敗しました' };
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'profile.delete',
    details: { profile_id: profileId },
  });

  revalidatePath('/profiles');
  return { success: true };
}

export async function getProfile(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();

  return data;
}

