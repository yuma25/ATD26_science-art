import { supabase, supabaseAdmin } from "../lib/supabase";
import { Badge, BadgeSchema, UserBadge, UserBadgeSchema } from "../types";

/**
 * 【標本（バッジ）サービス】
 * データベース（Supabase）とのデータのやり取りを管理する中心的なクラスです。
 * 実行環境（ブラウザ/サーバー）を判別し、最適な通信経路を自動選択します。
 */
export const BadgeService = {
  /**
   * --- すべての標本情報を取得 ---
   * データベースに登録されているすべての標本データを取得します。
   * クライアント側（ブラウザ）では内部API経由、サーバー側では直接DBから取得します。
   * 
   * @param {AbortSignal} [signal] - リクエストを中断するためのシグナル
   * @returns {Promise<Badge[]>} 標本データの配列。エラー時は空配列を返します。
   */
  async getAllBadges(signal?: AbortSignal): Promise<Badge[]> {
    // 1. クライアント側（ブラウザ）で実行されている場合、専用の内部APIを呼び出します
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/v1/badges", { signal });
        const result = await res.json();

        if (result.success) {
          return (result.data || []).map((badge: unknown) =>
            BadgeSchema.parse(badge),
          );
        }
        return [];
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return [];
        const message = e instanceof Error ? e.message : "不明なエラー";
        console.warn("[BadgeService/Client] 標本取得を中断:", message);
        return [];
      }
    }

    // 2. サーバー側で実行されている場合、直接データベースに問い合わせます
    const client = supabaseAdmin || supabase;
    if (!client) return [];

    const { data, error } = await client
      .from("badges")
      .select("id, name, artist, model_url, image_url, target_index")
      .order("target_index");
    
    if (error) {
      console.error("[BadgeService/Server] DB取得エラー:", error.message);
      return [];
    }

    return (data || []).map((badge: unknown) => BadgeSchema.parse(badge));
  },

  /**
   * --- ユーザープロフィールの取得 ---
   * 指定されたユーザーIDに対応するプロフィール情報（パーティ人数、景品交換フラグなど）を取得します。
   * 
   * @param {string} userId - 取得対象のユーザーID（UUID）
   * @param {AbortSignal} [signal] - リクエストを中断するためのシグナル
   * @returns {Promise<any | null>} プロフィールデータ。見つからない場合やエラー時は null を返します。
   */
  async getProfile(userId: string, signal?: AbortSignal) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/v1/profile/get?userId=${userId}`, {
          signal,
        });
        const result = await res.json();
        return result.success ? result.data : null;
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return null;
        return null;
      }
    }

    const client = supabaseAdmin || supabase;
    if (!client) return null;

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[BadgeService] プロフィール取得エラー:", error.message);
      return null;
    }
    return data;
  },

  /**
   * --- 標本の獲得を記録 ---
   * ユーザーが標本を発見したことをデータベースに記録します。
   * プロフィールが存在しない場合は自動的に作成します。
   * 
   * @param {string} userId - 獲得したユーザーのID
   * @param {string} badgeId - 獲得対象の標本ID
   * @returns {Promise<{data: UserBadge | null, error: any}>} 登録されたデータ、またはエラーオブジェクト
   */
  async acquireBadge(userId: string, badgeId: string) {
    // 1. クライアント側（ブラウザ）で実行されている場合、専用のAPIエンドポイントを呼び出します
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/v1/badges/acquire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, badgeId }),
        });
        const result = await res.json();
        return {
          data: result.success ? result.data : null,
          error: result.success ? null : result.error,
        };
      } catch (e: unknown) {
        console.error("[BadgeService/Client] 標本獲得の記録に失敗:", e);
        return { data: null, error: e };
      }
    }

    // 2. サーバー側で実行されている場合、直接データベースに問い合わせます
    const client = supabaseAdmin || supabase;
    if (!client)
      throw new Error("データベースクライアントが初期化されていません。");

    // 💡 外部キー制約エラー (23503) 対策: プロフィールの存在を確認し、なければ作成
    try {
      const { data: profile } = await client
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        console.log(`🆕 Profile not found for ${userId}, creating now...`);
        await client.from("profiles").upsert({ id: userId });
      }
    } catch (e) {
      console.warn("⚠️ Profile check failed, proceeding anyway:", e);
    }

    // 重複登録を試み、エラーをキャッチしてAPI側に委ねます
    const { data, error } = await client
      .from("user_badges")
      .insert({
        user_id: userId,
        badge_id: badgeId,
      })
      .select()
      .single();

    return { data: data ? UserBadgeSchema.parse(data) : null, error };
  },

  /**
   * --- 獲得済み標本リストを取得 ---
   * 指定されたユーザーがこれまでに獲得したすべての標本記録を取得します。
   * 
   * @param {string} userId - 取得対象のユーザーID
   * @param {AbortSignal} [signal] - リクエストを中断するためのシグナル
   * @returns {Promise<UserBadge[]>} 獲得済み標本データの配列
   */
  async getAcquiredBadges(
    userId: string,
    signal?: AbortSignal,
  ): Promise<UserBadge[]> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/v1/badges/acquired?userId=${userId}`, {
          signal,
        });
        const result = await res.json();
        if (result.success) {
          return (result.data || []).map((b: unknown) =>
            UserBadgeSchema.parse(b),
          );
        }
        return [];
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return [];
        return [];
      }
    }

    const client = supabaseAdmin || supabase;
    if (!client) return [];

    const { data, error } = await client
      .from("user_badges")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("[BadgeService] 獲得履歴取得エラー:", error.message);
      return [];
    }

    return (data || []).map((b: unknown) => UserBadgeSchema.parse(b));
  },

  /**
   * --- 獲得済み標本のIDリストのみを取得 ---
   * ユーザーが獲得済みの標本IDを配列形式で取得します。
   * フロントエンドでの重複チェックや表示切り替えに利用します。
   * 
   * @param {string} userId - 取得対象のユーザーID
   * @param {AbortSignal} [signal] - リクエストを中断するためのシグナル
   * @returns {Promise<string[]>} 獲得済み標本ID（文字列）の配列
   */
  async getAcquiredBadgeIds(
    userId: string,
    signal?: AbortSignal,
  ): Promise<string[]> {
    const acquired = await this.getAcquiredBadges(userId, signal);
    return acquired.map((b) => b.badge_id);
  },

  /**
   * --- プロフィールの更新 ---
   * ユーザーのプロフィール情報（パーティ人数や景品交換状況など）を更新します。
   * 
   * @param {string} userId - 更新対象のユーザーID
   * @param {Object} updates - 更新内容
   * @param {number} [updates.party_size] - パーティ（グループ）の人数
   * @param {boolean} [updates.is_exchanged] - 景品交換が完了したかどうか
   * @returns {Promise<boolean>} 更新に成功した場合は true、失敗した場合は false を返します。
   */
  async updateProfile(
    userId: string,
    updates: { party_size?: number; is_exchanged?: boolean },
  ) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/v1/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, updates }),
        });
        const result = await res.json();
        return result.success;
      } catch {
        return false;
      }
    }

    const client = supabaseAdmin || supabase;
    if (!client) return false;

    const { error } = await client.from("profiles").upsert({
      id: userId,
      ...updates,
    });

    if (error) {
      console.error("[BadgeService] プロフィール更新エラー:", error.message);
      return false;
    }
    return true;
  },
};
