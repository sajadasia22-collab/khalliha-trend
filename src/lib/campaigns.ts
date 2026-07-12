import type { ComponentType } from "react";
import { CampaignCategory, CampaignStatus, Platform } from "../generated/prisma/enums";
import {
  TikTokIcon,
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
  XIcon,
  ThreadsIcon,
  FileTextIcon,
  GoogleDriveIcon,
  DropboxIcon,
  OneDriveIcon,
} from "../components/ui/icons";

export const platformLabels: Record<Platform, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
  X: "X (تويتر)",
  THREADS: "Threads",
};

export const platformIcons: Record<Platform, ComponentType<{ className?: string }>> = {
  TIKTOK: TikTokIcon,
  INSTAGRAM: InstagramIcon,
  FACEBOOK: FacebookIcon,
  YOUTUBE: YouTubeIcon,
  X: XIcon,
  THREADS: ThreadsIcon,
};

export const categoryLabels: Record<CampaignCategory, string> = {
  PRODUCT: "منتجات",
  BEAUTY: "جمال وعناية",
  FOOD: "طعام ومشروبات",
  FASHION: "أزياء",
  TECH: "تقنية",
  ENTERTAINMENT: "ترفيه",
  GAMING: "ألعاب",
  OTHER: "أخرى",
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  DRAFT: "مسودة",
  PENDING_REVIEW: "قيد مراجعة الإدارة",
  NEEDS_CHANGES: "بحاجة لتعديلات",
  PENDING_FUNDING: "بانتظار التمويل",
  SCHEDULED: "مجدولة",
  ACTIVE: "نشطة",
  PAUSED: "متوقفة مؤقتاً",
  BUDGET_LOW: "الميزانية منخفضة",
  BUDGET_EXHAUSTED: "الميزانية مستنفدة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
  REJECTED: "مرفوضة",
  ARCHIVED: "مؤرشفة",
};

export function formatBudget(amount: bigint, currency: string): string {
  return `${amount.toLocaleString("ar-IQ", { numberingSystem: "latn" })} ${currency}`;
}

export function lowestCpm(rates: { cpmMinorUnits: bigint }[]): bigint | null {
  if (rates.length === 0) {
    return null;
  }
  return rates.reduce(
    (min, rate) => (rate.cpmMinorUnits < min ? rate.cpmMinorUnits : min),
    rates[0].cpmMinorUnits,
  );
}

export type AssetSource = "upload" | "google_drive" | "dropbox" | "onedrive";

/** Infers the picker source a campaign asset link was added through — the DB
 * only stores the raw url/label (no sourceType column), so this is the one
 * place both the brand's edit form and the creator-facing display derive it
 * from, by matching the same closed set of domains the picker offers. */
export function detectAssetSource(url: string): AssetSource {
  if (url.includes("dropbox.com")) return "dropbox";
  if (url.includes("onedrive.live.com") || url.includes("sharepoint.com"))
    return "onedrive";
  if (url.includes("assets.khallihatrend.com")) return "upload";
  return "google_drive";
}

export const assetSourceLabels: Record<AssetSource, string> = {
  upload: "ملف مرفوع",
  google_drive: "غوغل درايف",
  dropbox: "دروب بوكس",
  onedrive: "ون درايف",
};

export const assetSourceIcons: Record<
  AssetSource,
  ComponentType<{ className?: string }>
> = {
  upload: FileTextIcon,
  google_drive: GoogleDriveIcon,
  dropbox: DropboxIcon,
  onedrive: OneDriveIcon,
};

export function budgetProgress(reservedBudget: bigint, totalBudget: bigint): number {
  if (totalBudget <= 0n) {
    return 0;
  }
  const ratio = Number(reservedBudget) / Number(totalBudget);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

type SerializableRate = {
  platform: Platform;
  cpmMinorUnits: bigint;
  minimumQualifiedViews: bigint;
  maximumReward: bigint;
};

type SerializableAsset = { id: string; url: string; label: string };

export function serializeCampaignFull(campaign: {
  id: string;
  brandId: string;
  title: string;
  summary: string;
  terms: string;
  category: CampaignCategory;
  thumbnailUrl: string | null;
  minTrustScore: number;
  status: CampaignStatus;
  currency: string;
  totalBudget: bigint;
  reservedBudget: bigint;
  startsAt: Date | null;
  endsAt: Date | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rates: SerializableRate[];
  assets: SerializableAsset[];
}) {
  return {
    id: campaign.id,
    brandId: campaign.brandId,
    title: campaign.title,
    summary: campaign.summary,
    terms: campaign.terms,
    category: campaign.category,
    thumbnailUrl: campaign.thumbnailUrl,
    minTrustScore: campaign.minTrustScore,
    status: campaign.status,
    currency: campaign.currency,
    totalBudget: campaign.totalBudget.toString(),
    reservedBudget: campaign.reservedBudget.toString(),
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    reviewNote: campaign.reviewNote,
    reviewedAt: campaign.reviewedAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    rates: campaign.rates.map((rate) => ({
      platform: rate.platform,
      cpmMinorUnits: rate.cpmMinorUnits.toString(),
      minimumQualifiedViews: rate.minimumQualifiedViews.toString(),
      maximumReward: rate.maximumReward.toString(),
    })),
    assets: campaign.assets.map((asset) => ({
      id: asset.id,
      url: asset.url,
      label: asset.label,
    })),
  };
}
