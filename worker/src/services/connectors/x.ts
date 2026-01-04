import axios from 'axios';

interface PostContent {
  text: string;
  hashtags: string[];
  imageUrl?: string;
}

interface XTokens {
  accessToken: string;
  refreshToken?: string;
}

interface PublishResult {
  success: boolean;
  postId: string;
  url?: string;
}

const X_API_BASE = 'https://api.twitter.com/2';

export async function publishToX(
  content: PostContent,
  tokens: XTokens
): Promise<PublishResult> {
  console.log('Publishing to X (Twitter)...');

  try {
    // Build tweet text with hashtags
    const hashtagText = content.hashtags.map(t => `#${t}`).join(' ');
    const tweetText = `${content.text}\n\n${hashtagText}`.substring(0, 280);

    let mediaId: string | undefined;

    // Upload image if provided
    if (content.imageUrl) {
      mediaId = await uploadMedia(content.imageUrl, tokens);
    }

    // Create tweet
    const tweetPayload: Record<string, unknown> = {
      text: tweetText,
    };

    if (mediaId) {
      tweetPayload.media = {
        media_ids: [mediaId],
      };
    }

    const response = await axios.post(
      `${X_API_BASE}/tweets`,
      tweetPayload,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const tweetId = response.data.data.id;

    return {
      success: true,
      postId: tweetId,
      url: `https://twitter.com/i/status/${tweetId}`,
    };

  } catch (error) {
    console.error('X publish error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        throw new Error('auth_expired: X access token is invalid or expired');
      }
      if (status === 429) {
        throw new Error('rate_limited: X rate limit exceeded');
      }
    }

    throw error;
  }
}

async function uploadMedia(imageUrl: string, tokens: XTokens): Promise<string> {
  // Download image
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
  });
  const imageBuffer = Buffer.from(imageResponse.data);

  // Upload to Twitter media endpoint (v1.1)
  const formData = new FormData();
  formData.append('media', new Blob([imageBuffer]), 'image.png');

  const uploadResponse = await axios.post(
    'https://upload.twitter.com/1.1/media/upload.json',
    formData,
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    }
  );

  return uploadResponse.data.media_id_string;
}

export async function refreshXToken(refreshToken: string): Promise<XTokens> {
  // Implement token refresh logic
  throw new Error('Not implemented');
}

