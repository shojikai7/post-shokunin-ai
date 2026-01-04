import axios from 'axios';

interface PostContent {
  text: string;
  hashtags: string[];
  imageUrl?: string;
  eventInfo?: {
    title: string;
    startDate: string;
    endDate: string;
  };
  offerInfo?: {
    couponCode: string;
    termsConditions: string;
  };
}

interface GBPTokens {
  accessToken: string;
  locationId: string; // Format: locations/{locationId}
}

interface PublishResult {
  success: boolean;
  postId: string;
  url?: string;
}

const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';

export async function publishToGBP(
  content: PostContent,
  tokens: GBPTokens
): Promise<PublishResult> {
  console.log('Publishing to Google Business Profile...');

  try {
    // Determine post type
    let postType: 'STANDARD' | 'EVENT' | 'OFFER' = 'STANDARD';
    if (content.eventInfo) {
      postType = 'EVENT';
    } else if (content.offerInfo) {
      postType = 'OFFER';
    }

    // Build local post payload
    const localPost: Record<string, unknown> = {
      languageCode: 'ja',
      summary: content.text.substring(0, 1500),
      topicType: postType,
    };

    // Add media if provided
    if (content.imageUrl) {
      localPost.media = [
        {
          mediaFormat: 'PHOTO',
          sourceUrl: content.imageUrl,
        },
      ];
    }

    // Add event details if applicable
    if (postType === 'EVENT' && content.eventInfo) {
      localPost.event = {
        title: content.eventInfo.title,
        schedule: {
          startDate: parseDate(content.eventInfo.startDate),
          endDate: parseDate(content.eventInfo.endDate),
        },
      };
    }

    // Add offer details if applicable
    if (postType === 'OFFER' && content.offerInfo) {
      localPost.offer = {
        couponCode: content.offerInfo.couponCode,
        termsConditions: content.offerInfo.termsConditions,
      };
    }

    // Create local post
    const response = await axios.post(
      `${GBP_API_BASE}/${tokens.locationId}/localPosts`,
      localPost,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const postId = response.data.name;

    return {
      success: true,
      postId,
    };

  } catch (error) {
    console.error('GBP publish error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      if (status === 401) {
        throw new Error('auth_expired: GBP access token is invalid or expired');
      }
      if (status === 429) {
        throw new Error('rate_limited: GBP rate limit exceeded');
      }
      if (status === 403) {
        throw new Error('permission_denied: Not authorized to post to this location');
      }
    }

    throw error;
  }
}

function parseDate(dateString: string): { year: number; month: number; day: number } {
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

