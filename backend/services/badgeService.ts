import { supabase, supabaseAdmin } from "../lib/supabase";
import { Badge, BadgeSchema, UserBadge } from "../types";

export const BadgeService = {
  /**
   * すべてのバッジ情報を取得する
   */
  async getAllBadges(): Promise<Badge[]> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/badges");
        const data = await res.json();
        return (data || []).map((badge: unknown) => BadgeSchema.parse(badge));
      } catch (e) {
        console.error("[BadgeService/Client] API fetch failed:", e);
        return [];
      }
    }

    const client = supabaseAdmin || supabase;
    if (!client) return [];

    const { data, error } = await client
      .from("badges")
      .select("*")
      .order("target_index");
    if (error) return [];
    return (data || []).map((badge: unknown) => BadgeSchema.parse(badge));
  },

  /**
   * プロフィール情報を取得する（人数確認用）
   */
  async getProfile(userId: string) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/profile/get?userId=${userId}`);
        return await res.json();
      } catch {
        return null;
      }
    }

    const client = supabaseAdmin || supabase;
    if (!client) return null;

    // 💡 修正：single() -> maybeSingle() に変更。
    // データがなくても 406 エラーを出さず、正常に null を返すようにします。
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[BadgeService] getProfile error:", error.message);
      return null;
    }
    return data;
  },

  /**
   * プロフィール（利用人数）を更新する
   */
  async updateProfile(userId: string, updates: { party_size?: number }) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, updates }),
        });
        const data = await res.json();
        return data.success;
      } catch {
        return false;
      }
    }

    const client = supabaseAdmin || supabase;
    if (!client) return false;

    // 💡 修正：UPSERT 時に既存の値を破壊しないように、更新項目のみを含める
    const { error } = await client.from("profiles").upsert(
      {
        id: userId,
        ...updates,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("[BadgeService] updateProfile error:", error.message);
    }

    return !error;
  },

  /**
   * 獲得済みのバッジID一覧を取得
   */
  async getAcquiredBadgeIds(userId: string): Promise<string[]> {
    const rows = await this.getAcquiredBadges(userId);
    return rows.map((r) => r.badge_id);
  },

  /**
   * 獲得履歴の取得
   */
  async getAcquiredBadges(
    userId: string,
  ): Promise<{ badge_id: string; acquired_at: string }[]> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/badges/acquired?userId=${userId}`);
        return await res.json();
      } catch {
        return [];
      }
    }
    const client = supabaseAdmin || supabase;
    if (!client) return [];
    const { data } = await client
      .from("user_badges")
      .select("badge_id, acquired_at")
      .eq("user_id", userId);
    return data || [];
  },

  /**
   * バッジの獲得
   */
  async acquireBadge(
    userId: string,
    badgeId: string,
  ): Promise<UserBadge | null> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/badges/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, badgeId }),
      });
      return await res.json();
    }

    const client = supabaseAdmin || supabase;
    if (!client) return null;

    await client.from("profiles").upsert({ id: userId }, { onConflict: "id" });
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from("user_badges")
      .insert([{ user_id: userId, badge_id: badgeId, acquired_at: jstNow }])
      .select()
      .single();
    if (error) return null;
    return data;
  },
};
