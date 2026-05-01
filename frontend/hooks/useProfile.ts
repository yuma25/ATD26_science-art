import useSWR from "swr";
import { BadgeService } from "@backend/services/badgeService";

/**
 * 【プロフィール管理フック】
 * ユーザーのプロフィール情報を取得し、更新機能を提供します。
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
    profile: data,
    isLoading,
    isError: error,
    updateProfile,
    refresh: mutate,
  };
}
