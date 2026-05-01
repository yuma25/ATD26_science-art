import useSWR from "swr";
import { BadgeService } from "@backend/services/badgeService";

/**
 * 【標本データ取得フック】
 * 全ての標本マスターデータを取得し、キャッシュ管理します。
 */
export function useBadges() {
  const { data, error, isLoading, mutate } = useSWR(
    "api/badges",
    () => BadgeService.getAllBadges(),
    {
      revalidateOnFocus: false, // 画面が戻った時の自動更新をオフ（節約）
      dedupingInterval: 60000, // 1分間はキャッシュを再利用
    },
  );

  return {
    badges: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * 【獲得済み標本取得フック】
 * 特定ユーザーの獲得履歴を取得・管理します。
 */
export function useAcquiredBadges(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `api/badges/acquired/${userId}` : null,
    () => BadgeService.getAcquiredBadges(userId!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    },
  );

  return {
    acquiredBadges: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
