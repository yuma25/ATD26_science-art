/**
 * Loggerユーティリティの定義
 * サーバー側で発生したイベントやエラーを、後から分析しやすい「構造化ログ（JSON形式）」として出力します。
 */
export const Logger = {
  /**
   * info: 一般的な情報の記録
   * 正常な動作（ページの閲覧、データの保存など）を記録します。
   * @param action - 何が起きたかを示す識別子（例: "PAGE_VIEW"）
   * @param details - 補足情報（ユーザーIDやデバイス情報など）
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
   * error: エラーの記録
   * 予期せぬ不具合や、データベース接続エラーなどを記録します。
   * @param action - エラーが発生した場所や処理
   * @param error - エラーオブジェクトまたはメッセージ
   * @param details - 補足情報
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
   * discovery: 冒険の進捗（標本の発見）に特化したログ
   * 誰がどの標本を見つけたかを記録します。
   */
  discovery(userId: string, badgeId: string, badgeName: string) {
    this.info("SPECIMEN_DISCOVERED", {
      explorer: userId,
      specimen_id: badgeId,
      specimen_name: badgeName,
    });
  },

  /**
   * missionComplete: 全ての標本を見つけた（ミッション完了）のログ
   */
  missionComplete(userId: string) {
    this.info("MISSION_COMPLETE", {
      explorer: userId,
    });
  },
};
/**
 * [A: 一般的な情報の記録]
 * Logger.info("API_ACCESS", { path: "/api/v1/badges" });
 * -> 出力: {"level":"INFO","timestamp":"2026-04-30T...","action":"API_ACCESS","path":"/api/v1/badges"}
 *
 * [B: 標本発見の記録]
 * Logger.discovery("user_123", "b01", "蝶");
 * -> 出力: {"level":"INFO","timestamp":"...","action":"SPECIMEN_DISCOVERED","explorer":"user_123","specimen_id":"b01","specimen_name":"蝶"}
 *
 * [C: エラーの記録]
 * Logger.error("DB_ERROR", new Error("Timeout"), { retry: true });
 * -> 出力: {"level":"ERROR","timestamp":"...","action":"DB_ERROR","error":"Timeout","retry":true}
 */
