import useSWR from "swr";
import { BadgeService } from "@backend/services/badgeService";

/**
 * 【プロフィール管理フック】
 * ユーザーのプロフィール情報を取得し、更新機能を提供します。
 *
 * @param {string | undefined} userId - 対象のユーザーID（UUID）
 */
export function useProfile(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `api/profile/${userId}` : null,
    () => BadgeService.getProfile(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分間キャッシュ
    },
  );

  /**
   * プロフィールを更新し、キャッシュを最新の状態にします。
   *
   * @param {Object} updates - 更新内容（パーティ人数など）
   * @param {number} [updates.party_size] - パーティ人数
   * @returns {Promise<boolean>} 更新に成功したかどうか
   */
  const updateProfile = async (updates: { party_size?: number }) => {
    if (!userId) return false;
    const success = await BadgeService.updateProfile(userId, updates);
    if (success) {
      // キャッシュを再取得（または手動更新）して画面に反映
      mutate();
    }
    return success;
  };

  return {
    /** プロフィールデータ */
    profile: data,
    /** 読み込み中フラグ */
    isLoading,
    /** エラー情報 */
    isError: error,
    /** プロフィール更新関数 */
    updateProfile,
    /** データを再取得（リフレッシュ）する関数 */
    refresh: mutate,
  };
}
