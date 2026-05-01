/**
 * 【キャッシュサービス】
 * Redis (Upstash) を使用して、高負荷なクエリ結果や頻繁に参照されるデータを一時保存します。
 * データベースへの負荷を軽減し、レスポンス速度を向上させます。
 */

export const CacheService = {
  /**
   * --- データの取得 ---
   * @param key - キャッシュキー
   */
  async get<T>(key: string): Promise<T | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return null;

    try {
      const res = await fetch(`${url}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.result ? (JSON.parse(data.result) as T) : null;
    } catch (e) {
      console.warn(`[CacheService] Get Error (key: ${key}):`, e);
      return null;
    }
  },

  /**
   * --- データの保存 ---
   * @param key - キャッシュキー
   * @param value - 保存するデータ
   * @param ttl - 有効期限（秒）
   */
  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return false;

    try {
      await fetch(`${url}/set/${key}?ex=${ttl}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(value),
      });
      return true;
    } catch (e) {
      console.warn(`[CacheService] Set Error (key: ${key}):`, e);
      return false;
    }
  },

  /**
   * --- キャッシュの削除 ---
   */
  async delete(key: string): Promise<void> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return;

    try {
      await fetch(`${url}/del/${key}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn(`[CacheService] Delete Error (key: ${key}):`, e);
    }
  },
};
