import axios from 'axios';

interface PostContent {
  text: string;
  hashtags: string[];
  imageUrl?: string;
}

interface MetaTokens {
  accessToken: string;
  pageId: string;
  instagramAccountId: string;
}

interface PublishResult {
  success: boolean;
  postId: string;
  url?: string;
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

export async function publishToInstagram(
  content: PostContent,
  tokens: MetaTokens
): Promise<PublishResult> {
  console.log('Publishing to Instagram...');

  if (!content.imageUrl) {
    throw new Error('Image is required for Instagram posts');
  }

  try {
    // Build caption with hashtags
    const hashtagText = content.hashtags.map(t => `#${t}`).join(' ');
    const caption = `${content.text}\n\n${hashtagText}`;

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `${GRAPH_API_BASE}/${tokens.instagramAccountId}/media`,
      {
        image_url: content.imageUrl,
        caption,
        access_token: tokens.accessToken,
      }
    );

    const containerId = containerResponse.data.id;

    // Step 2: Wait for container to be ready (poll status)
    await waitForContainerReady(containerId, tokens.accessToken);

    // Step 3: Publish the container
    const publishResponse = await axios.post(
      `${GRAPH_API_BASE}/${tokens.instagramAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: tokens.accessToken,
      }
    );

    const postId = publishResponse.data.id;

    // Get permalink
    const mediaResponse = await axios.get(
      `${GRAPH_API_BASE}/${postId}`,
      {
        params: {
          fields: 'permalink',
          access_token: tokens.accessToken,
        },
      }
    );

    return {
      success: true,
      postId,
      url: mediaResponse.data.permalink,
    };

  } catch (error) {
    console.error('Instagram publish error:', error);

    if (axios.isAxiosError(error)) {
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 190) {
        throw new Error('auth_expired: Instagram access token is invalid or expired');
      }
      if (errorCode === 4) {
        throw new Error('rate_limited: Instagram rate limit exceeded');
      }
      if (errorCode === 36003) {
        throw new Error('invalid_media: Image does not meet Instagram requirements');
      }
    }

    throw error;
  }
}

async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts: number = 10
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(
      `${GRAPH_API_BASE}/${containerId}`,
      {
        params: {
          fields: 'status_code',
          access_token: accessToken,
        },
      }
    );

    const status = response.data.status_code;
    
    if (status === 'FINISHED') {
      return;
    }
    
    if (status === 'ERROR') {
      throw new Error('Container processing failed');
    }

    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Container processing timeout');
}

