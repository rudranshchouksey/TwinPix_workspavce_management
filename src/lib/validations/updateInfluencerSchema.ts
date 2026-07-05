import { z } from "zod";

// ─── Status values matching Prisma InfluencerStatus enum ─────
const INFLUENCER_STATUSES = [
  "NEW_LEAD",
  "CONTACTED",
  "REPLIED",
  "NEGOTIATING",
  "ACTIVE",
  "ONBOARDED",
  "BLACKLISTED",
] as const;

// ─── Structured metadata stored in negotiationTerms JSON ─────
export const extendedMetadataSchema = z.object({
  postRate: z.coerce.number().min(0, "Post rate cannot be negative").optional().nullable(),
  packageRate: z.coerce.number().min(0, "Package rate cannot be negative").optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  socialLinks: z.object({
    youtube: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
    facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  }).optional().default({}),
  notesHistory: z.array(z.object({
    previousNotes: z.string(),
    changedAt: z.string(),
  })).optional().default([]),
});

export type ExtendedMetadata = z.infer<typeof extendedMetadataSchema>;

// ─── Main update schema ──────────────────────────────────────
export const updateInfluencerSchema = z.object({
  // Basic Information
  influencerName: z.string().optional().nullable(),
  instagramHandle: z
    .string()
    .min(1, "Instagram username is required")
    .max(100)
    .transform((val) => val.replace(/^@/, "").trim().toLowerCase()),
  category: z.string().min(1, "Category is required"),
  profileDescription: z.string().optional().nullable(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .regex(/^$|^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format")
    .optional()
    .nullable()
    .or(z.literal("")),
  location: z.string().optional().nullable(),
  profileLink: z
    .string()
    .url("Invalid website URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().optional().nullable(),
  assignedManagerId: z.string().optional().nullable().or(z.literal("")),

  // Rates (existing Prisma columns)
  reelRate: z.coerce.number().min(0, "Reel rate cannot be negative").optional().nullable(),
  storyRate: z.coerce.number().min(0, "Story rate cannot be negative").optional().nullable(),

  // Pipeline
  status: z.enum(INFLUENCER_STATUSES).default("NEW_LEAD"),

  // Image
  profileImage: z.string().optional().nullable(),

  // Extended metadata (stored as JSON in negotiationTerms)
  extendedMetadata: extendedMetadataSchema.optional(),
});

export type UpdateInfluencerInput = z.infer<typeof updateInfluencerSchema>;

// ─── Helpers ─────────────────────────────────────────────────

/** Parse the negotiationTerms JSON into ExtendedMetadata safely */
export function parseExtendedMetadata(negotiationTerms: string | null | undefined): ExtendedMetadata {
  if (!negotiationTerms) {
    return { tags: [], socialLinks: {}, notesHistory: [] };
  }
  try {
    const parsed = JSON.parse(negotiationTerms);
    const result = extendedMetadataSchema.safeParse(parsed);
    return result.success ? result.data : { tags: [], socialLinks: {}, notesHistory: [] };
  } catch {
    return { tags: [], socialLinks: {}, notesHistory: [] };
  }
}

/** Serialize ExtendedMetadata back to JSON string */
export function serializeExtendedMetadata(metadata: ExtendedMetadata): string {
  return JSON.stringify(metadata);
}

/** Status display config */
export const STATUS_CONFIG = [
  { value: "NEW_LEAD", label: "New Lead", color: "bg-sky-50 text-sky-700 border-sky-200", dot: "#0ea5e9" },
  { value: "CONTACTED", label: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "#f59e0b" },
  { value: "REPLIED", label: "Replied", color: "bg-violet-50 text-violet-700 border-violet-200", dot: "#8b5cf6" },
  { value: "NEGOTIATING", label: "Negotiating", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "#f97316" },
  { value: "ACTIVE", label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "#10b981" },
  { value: "ONBOARDED", label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "#10b981" },
  { value: "BLACKLISTED", label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", dot: "#ef4444" },
] as const;

/** Category presets */
export const CATEGORY_PRESETS = [
  "Fashion", "Beauty", "Travel", "Food", "Fitness",
  "Technology", "Lifestyle", "Education", "Gaming",
  "Music", "Art", "Photography", "Comedy", "Health",
  "Finance", "Business", "Sports", "Automotive",
  "Entertainment", "Parenting",
];

export const PAYMENT_METHODS = [
  "Bank Transfer", "UPI", "PayPal", "Crypto", "Other",
];

export const CURRENCIES = [
  { value: "INR", label: "₹ INR" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
];
