// ========================================
// Database Types
// ========================================

export type Channel = 'x' | 'instagram' | 'tiktok' | 'gbp' | 'note';

export type JobType = 'preview' | 'final';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type AssetType = 'logo' | 'product_photo' | 'store_photo' | 'font' | 'template';

export type PublishProvider = 'x' | 'meta' | 'tiktok' | 'google';
export type PublishStatus = 'pending' | 'succeeded' | 'failed';

export type GBPPostType = 'STANDARD' | 'EVENT' | 'OFFER';

// ========================================
// Tone Settings
// ========================================

export interface ToneSettings {
  formality: 'formal' | 'casual'; // 敬体/常体
  emojiUsage: 'none' | 'moderate' | 'heavy';
  endingStyle: string; // 語尾スタイル（例：「〜ます」「〜だよ」）
  hardness: 1 | 2 | 3 | 4 | 5; // 1=柔らかい, 5=硬い
  ctaStrength: 1 | 2 | 3 | 4 | 5; // 1=控えめ, 5=強い
}

export interface ReplacementRule {
  from: string;
  to: string;
}

export interface ToneConfig extends ToneSettings {
  ngWords: string[];
  replacements: ReplacementRule[];
}

// ========================================
// Campaign Info
// ========================================

export interface CampaignInfo {
  name: string;
  startDate?: string;
  endDate?: string;
  price?: string;
  benefits?: string;
  description?: string;
}

// ========================================
// Event Info (for GBP)
// ========================================

export interface EventInfo {
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
}

// ========================================
// Image Spec
// ========================================

export interface ImageSpec {
  templateId?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
}

// ========================================
// Profile
// ========================================

export interface Profile {
  id: string;
  userId: string;
  brandName: string;
  descriptionShort: string;
  descriptionLong: string;
  targetAudience: string;
  strengths: string;
  prohibitedExpressions: string[];
  campaignInfo: CampaignInfo | null;
  referenceUrls: string[];
  toneSettings: ToneConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  brandName: string;
  descriptionShort: string;
  descriptionLong: string;
  targetAudience: string;
  strengths: string;
  prohibitedExpressions: string;
  campaignName?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignPrice?: string;
  campaignBenefits?: string;
  referenceUrls: string;
  toneFormality: 'formal' | 'casual';
  toneEmojiUsage: 'none' | 'moderate' | 'heavy';
  toneEndingStyle: string;
  toneHardness: number;
  toneCtaStrength: number;
  ngWords: string;
}

// ========================================
// Brand Asset
// ========================================

export interface BrandAsset {
  id: string;
  profileId: string;
  type: AssetType;
  storagePath: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    color?: string;
    fontFamily?: string;
  };
  createdAt: string;
}

// ========================================
// Draft
// ========================================

export interface Draft {
  id: string;
  profileId: string;
  inputText: string;
  eventInfo: EventInfo | null;
  language: 'ja' | 'en';
  selectedChannels: Channel[];
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Channel Variant
// ========================================

export interface ChannelVariant {
  id: string;
  draftId: string;
  channel: Channel;
  postText: string;
  hashtags: string[];
  imageSpec: ImageSpec;
  rawPrompt: string;
  structuredPrompt: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Generation Job
// ========================================

export interface GenerationJob {
  id: string;
  variantId: string;
  type: JobType;
  status: JobStatus;
  idempotencyKey: string;
  errorCode?: string;
  errorDetail?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Output Asset
// ========================================

export interface OutputAsset {
  id: string;
  variantId: string;
  kind: JobType;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  storagePath: string;
  publicUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

// ========================================
// Publish Connection
// ========================================

export interface PublishConnection {
  id: string;
  userId: string;
  provider: PublishProvider;
  encryptedTokens: string; // encrypted JSON
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Publish Attempt
// ========================================

export interface PublishAttempt {
  id: string;
  variantId: string;
  provider: PublishProvider;
  status: PublishStatus;
  response?: Record<string, unknown>;
  errorCode?: string;
  errorDetail?: string;
  createdAt: string;
}

// ========================================
// Audit Log
// ========================================

export type AuditAction = 
  | 'auth.login'
  | 'auth.logout'
  | 'profile.create'
  | 'profile.update'
  | 'profile.delete'
  | 'draft.create'
  | 'variant.generate'
  | 'job.start'
  | 'job.complete'
  | 'job.fail'
  | 'publish.attempt'
  | 'publish.success'
  | 'publish.fail'
  | 'connection.create'
  | 'connection.revoke'
  | 'asset.upload'
  | 'asset.delete';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  details: Record<string, unknown>;
  createdAt: string;
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ========================================
// Error Codes
// ========================================

export type ErrorCode =
  | 'AUTH_EXPIRED'
  | 'AUTH_REVOKED'
  | 'RATE_LIMITED'
  | 'INVALID_MEDIA_REQUIREMENTS'
  | 'DOMAIN_NOT_VERIFIED'
  | 'PPA_REQUIRED'
  | 'AUDIT_REQUIRED'
  | 'TEMPORARY_FAILURE'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

// ========================================
// Media Size Config
// ========================================

export interface MediaSizeConfig {
  channel: Channel;
  aspectRatio: string;
  width: number;
  height: number;
}

export const MEDIA_SIZES: MediaSizeConfig[] = [
  { channel: 'x', aspectRatio: '16:9', width: 1200, height: 675 },
  { channel: 'instagram', aspectRatio: '1:1', width: 1080, height: 1080 },
  { channel: 'tiktok', aspectRatio: '9:16', width: 1080, height: 1920 },
  { channel: 'gbp', aspectRatio: '4:3', width: 1200, height: 900 },
  { channel: 'note', aspectRatio: '16:9', width: 1280, height: 720 },
];

// ========================================
// Channel Config
// ========================================

export interface ChannelConfig {
  id: Channel;
  name: string;
  nameJa: string;
  maxTextLength: number;
  maxHashtags: number;
  supportsApiPost: boolean;
  aspectRatio: string;
}

export const CHANNEL_CONFIGS: ChannelConfig[] = [
  { id: 'x', name: 'X', nameJa: 'X (Twitter)', maxTextLength: 280, maxHashtags: 5, supportsApiPost: true, aspectRatio: '16:9' },
  { id: 'instagram', name: 'Instagram', nameJa: 'Instagram', maxTextLength: 2200, maxHashtags: 30, supportsApiPost: true, aspectRatio: '1:1' },
  { id: 'tiktok', name: 'TikTok', nameJa: 'TikTok', maxTextLength: 2200, maxHashtags: 10, supportsApiPost: false, aspectRatio: '9:16' },
  { id: 'gbp', name: 'GBP', nameJa: 'Googleビジネスプロフィール', maxTextLength: 1500, maxHashtags: 0, supportsApiPost: true, aspectRatio: '4:3' },
  { id: 'note', name: 'Note', nameJa: 'note', maxTextLength: 10000, maxHashtags: 10, supportsApiPost: false, aspectRatio: '16:9' },
];

