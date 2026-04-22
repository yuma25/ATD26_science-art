import { supabase, supabaseAdmin } from "../lib/supabase";
import { Badge, BadgeSchema, UserBadge } from "../types";
import { Logger } from "../../server/lib/logger";

export const BadgeService = {
  /**
   * すべてのバッジ情報を取得する
   * ※確実に取得するためAdmin権限を使用
   */
  async getAllBadges(): Promise<Badge[]> {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("badges")
      .select("*")
      .order("target_index", { ascending: true });

    if (error) {
      Logger.error("FETCH_BADGES_FAILED", error);
      return [];
    }

    console.log(`[Service] Fetched raw data count: ${data?.length || 0}`);

    try {
      return (data || []).map((badge) => BadgeSchema.parse(badge));
    } catch (e) {
      console.warn("[Service] Zod validation failed, returning raw data:", e);
      return (data || []) as Badge[];
    }
  },

  /**
   * ユーザーが獲得したバッジのID一覧を取得する
   */
  async getAcquiredBadgeIds(userId: string): Promise<string[]> {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    if (error) {
      Logger.error("FETCH_ACQUIRED_BADGES_FAILED", error, { userId });
      return [];
    }

    return (data || []).map((row) => row.badge_id);
  },

  /**
   * バッジを獲得（保存）する
   */
  async acquireBadge(
    userId: string,
    badgeId: string,
  ): Promise<UserBadge | null> {
    const client = supabaseAdmin || supabase;

    // 日本時間のタイムスタンプ
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from("user_badges")
      .insert([
        {
          user_id: userId,
          badge_id: badgeId,
          acquired_at: jstNow,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return null; // 重複
      Logger.error("ACQUIRE_BADGE_FAILED", error, { userId, badgeId });
      return null;
    }

    Logger.info("ACQUIRE_BADGE_SUCCESS", { userId, badgeId });
    return data;
  },
};
