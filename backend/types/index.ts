import { z } from "zod";

/**
 * 【データ型の定義と検証】
 * アプリケーションで扱うデータの「形」を定義し、正しくないデータが入らないようにチェック（検証）します。
 */

/**
 * --- 標本（バッジ）の設計図 ---
 */
export const BadgeSchema = z.object({
  id: z.string().uuid(), // 固有のID（UUID形式）
  name: z.string().min(1, "名前は必須です"), // 標本の名前
  description: z.string().default(""), // 標本の解説文
  model_url: z
    .string()
    .url("有効なURLを入力してください")
    .or(z.string().regex(/^\/.*$/, "相対パスは / から始めてください")), // モデルのパス
  target_index: z.number().int().min(0), // ARマーカーの番号
  created_at: z.string().optional(), // 登録日時（DB形式の差異を許容）
});

/**
 * --- ユーザー獲得記録の設計図 ---
 */
export const UserBadgeSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().min(1, "ユーザーIDは必須です"),
  badge_id: z.string().uuid("標本IDが正しくありません"),
  acquired_at: z.string(), // 獲得日時（DB形式の差異を許容）
});

/**
 * --- API通信の標準化 ---
 */

// エラー内容の定義
export const ApiErrorSchema = z.object({
  code: z.string(), // エラーコード（例: "NOT_FOUND", "AUTH_REQUIRED"）
  message: z.string(), // ユーザー向けのメッセージ
  details: z.any().optional(), // 開発用デバッグ情報
});

// 成功・失敗を含む共通レスポンス形式
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      success: z.literal(false),
      error: ApiErrorSchema,
    }),
  ]);
}

/**
 * --- TypeScript用の型定義 ---
 */
export type Badge = z.infer<typeof BadgeSchema>;
export type UserBadge = z.infer<typeof UserBadgeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// 具体的なレスポンス型
export type BadgeListResponse = z.infer<
  ReturnType<typeof createApiResponseSchema<z.ZodArray<typeof BadgeSchema>>>
>;
export type ProfileResponse = z.infer<
  ReturnType<typeof createApiResponseSchema<z.ZodAny>>
>;

/**
 * --- リクエストボディの検証 ---
 */
export const AcquireBadgeRequestSchema = z.object({
  userId: z.string().min(1),
  badgeId: z.string().uuid(),
});

export const UpdateProfileRequestSchema = z.object({
  userId: z.string().min(1),
  updates: z.object({
    party_size: z.number().int().min(1).max(10).optional(),
  }),
});
