import { z } from "zod";

/**
 * 標本（バッジ）の検証スキーマ
 */
export const BadgeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  model_url: z.string().min(1),
  target_index: z.number().int().min(0),
  created_at: z.string().optional(),
});

/**
 * ユーザー獲得バッジの検証スキーマ
 */
export const UserBadgeSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1),
  badge_id: z.string().min(1),
  acquired_at: z.string(),
});

// TypeScript 型の抽出
export type Badge = z.infer<typeof BadgeSchema>;
export type UserBadge = z.infer<typeof UserBadgeSchema>;

export interface BadgeServiceResponse<T> {
  data: T | null;
  error: Error | null;
}
