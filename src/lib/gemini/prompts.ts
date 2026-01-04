import type { Profile, Channel, ToneConfig } from '@/types';

// ========================================
// System Prompts
// ========================================

export const SYSTEM_PROMPT_POST_GENERATION = `あなたはSNSマーケティングの専門家です。
小規模事業者向けに、各SNSプラットフォームに最適化された投稿文とハッシュタグを生成します。

以下の点を必ず守ってください：
1. 指定されたトーン・スタイルに従う
2. 禁止表現は絶対に使用しない
3. 文字数制限を厳守
4. ハッシュタグは指定数以内
5. プラットフォームの特性に合わせた最適化`;

export const SYSTEM_PROMPT_IMAGE_PROMPT = `あなたは画像生成AIプロンプトの専門家です。
SNS投稿用の画像を生成するための、詳細で効果的なプロンプトを作成します。

以下の点を必ず守ってください：
1. 英語で出力
2. 具体的で詳細な描写
3. スタイル、構図、色調を明確に指定
4. ブランドイメージに合致
5. SNSで目を引くビジュアル`;

// ========================================
// Prompt Builders
// ========================================

export function buildToneDescription(tone: ToneConfig): string {
  const formalityText = tone.formality === 'formal' ? '敬体（です・ます調）' : '常体（だ・である調）';
  const emojiText = {
    none: '絵文字なし',
    moderate: '絵文字を適度に使用',
    heavy: '絵文字を積極的に使用',
  }[tone.emojiUsage];
  const hardnessText = ['とても柔らかく親しみやすい', 'やや柔らかい', '標準的', 'やや硬め', 'フォーマルで硬め'][tone.hardness - 1];
  const ctaText = ['控えめなCTA', 'やや控えめ', '標準的なCTA', 'やや強め', '積極的で強いCTA'][tone.ctaStrength - 1];

  return `
- 文体: ${formalityText}
- 語尾スタイル: ${tone.endingStyle || '標準'}
- 絵文字: ${emojiText}
- トーンの硬さ: ${hardnessText}
- CTAの強さ: ${ctaText}`;
}

export function buildChannelConstraints(channel: Channel): string {
  const constraints: Record<Channel, string> = {
    x: `
- 文字数: 140文字以内（日本語）
- ハッシュタグ: 3〜5個
- 簡潔で印象的な表現
- リンクやメンションを考慮`,
    instagram: `
- キャプション: 最大2200文字（推奨300〜500文字）
- ハッシュタグ: 10〜30個（投稿末尾に配置）
- 絵文字を効果的に使用
- ストーリー性のある文章`,
    tiktok: `
- キャプション: 最大2200文字（推奨100〜300文字）
- ハッシュタグ: 5〜10個
- トレンドを意識
- 若年層向けのカジュアルな表現`,
    gbp: `
- 文字数: 最大1500文字（推奨250〜500文字）
- ハッシュタグ: 不要
- ビジネス向けのフォーマルな表現
- 店舗/サービスの価値を明確に`,
    note: `
- 本文: 記事形式で500〜2000文字
- ハッシュタグ: 5〜10個
- 読みやすい段落構成
- 見出しや箇条書きを活用`,
  };
  return constraints[channel];
}

export function buildPostGenerationPrompt(
  profile: Profile,
  inputText: string,
  channel: Channel
): string {
  const prohibitedList = profile.prohibitedExpressions.length > 0
    ? profile.prohibitedExpressions.join('、')
    : 'なし';

  const campaignInfo = profile.campaignInfo
    ? `
【キャンペーン情報】
- 名称: ${profile.campaignInfo.name}
- 期間: ${profile.campaignInfo.startDate || '未設定'} 〜 ${profile.campaignInfo.endDate || '未設定'}
- 価格/特典: ${profile.campaignInfo.price || ''} ${profile.campaignInfo.benefits || ''}`
    : '';

  return `${SYSTEM_PROMPT_POST_GENERATION}

【ブランド情報】
- ブランド名: ${profile.brandName}
- サービス説明（短）: ${profile.descriptionShort}
- ターゲット: ${profile.targetAudience}
- 強み: ${profile.strengths}
${campaignInfo}

【トーン設定】
${buildToneDescription(profile.toneSettings)}

【禁止表現】
${prohibitedList}

【投稿プラットフォーム: ${channel.toUpperCase()}】
${buildChannelConstraints(channel)}

【投稿したい内容】
${inputText}

---

上記の情報を元に、${channel.toUpperCase()}向けの投稿を生成してください。

出力形式（JSON）:
{
  "postText": "投稿本文",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2", ...]
}

注意：
- 禁止表現は絶対に使用しないでください
- ブランドのトーンに合わせてください
- JSON形式で出力してください`;
}

export function buildImagePromptGenerationPrompt(
  profile: Profile,
  postText: string,
  channel: Channel
): string {
  const aspectRatioMap: Record<Channel, string> = {
    x: '16:9 (横長)',
    instagram: '1:1 (正方形)',
    tiktok: '9:16 (縦長)',
    gbp: '4:3 (横長)',
    note: '16:9 (横長)',
  };

  return `${SYSTEM_PROMPT_IMAGE_PROMPT}

【ブランド情報】
- ブランド名: ${profile.brandName}
- サービス: ${profile.descriptionShort}
- ターゲット: ${profile.targetAudience}

【投稿文】
${postText}

【画像仕様】
- プラットフォーム: ${channel.toUpperCase()}
- アスペクト比: ${aspectRatioMap[channel]}
- 用途: SNS投稿のメイン画像

---

上記の情報を元に、画像生成AIに渡すプロンプトを生成してください。

出力形式（JSON）:
{
  "rawPrompt": "英語の詳細なプロンプト（200〜500語）",
  "structuredPrompt": "構造化されたプロンプト要素",
  "negativePrompt": "除外したい要素（英語）",
  "style": "推奨スタイル（例: professional, minimal, vibrant等）"
}

注意：
- プロンプトは英語で出力
- ブランドイメージに合致する視覚表現
- SNSで目を引く構図を提案
- JSON形式で出力してください`;
}

