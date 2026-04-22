/**
 * 構造化ログを出力するためのユーティリティ
 */
export const Logger = {
  /**
   * 一般的な情報の記録
   */
  info(action: string, details: Record<string, unknown> = {}) {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        action,
        ...details,
      }),
    );
  },

  /**
   * エラーの記録
   */
  error(action: string, error: unknown, details: Record<string, unknown> = {}) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        action,
        error: error instanceof Error ? error.message : String(error),
        ...details,
      }),
    );
  },

  /**
   * 冒険の進捗（発見など）に特化したログ
   */
  discovery(userId: string, badgeId: string, badgeName: string) {
    this.info("SPECIMEN_DISCOVERED", {
      explorer: userId,
      specimen_id: badgeId,
      specimen_name: badgeName,
    });
  },

  /**
   * ミッション完了のログ
   */
  missionComplete(userId: string) {
    this.info("MISSION_COMPLETE", {
      explorer: userId,
    });
  },
};
