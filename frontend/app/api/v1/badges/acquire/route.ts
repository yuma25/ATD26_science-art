import { NextResponse } from "next/server";
import { BadgeService } from "@backend/services/badgeService";
import { AcquireBadgeRequestSchema } from "@backend/types";

/**
 * 【標本獲得API】
 * 冒険者が新しい標本を発見した際に、その記録をデータベースに保存します。
 * 重複したリクエスト（すでに獲得済みの標本）に対しても、エラーではなく
 * 成功レスポンスを返す「冪等性（べきとうせい）」を備えています。
 */

export async function POST(request: Request) {
  try {
    // 1. リクエストボディの厳密な検証
    const body = await request.json();
    const result = AcquireBadgeRequestSchema.safeParse(body);

    if (!result.success) {
      console.warn(
        "⚠️ [API_BADGES_ACQUIRE] バリデーション失敗:",
        result.error.format(),
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message:
              "標本の記録に必要な情報が正しくありません。日誌の形式を確認してください。",
            details: result.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { userId, badgeId } = result.data;

    // 2. 標本サービスを使用して、獲得記録の保存を試みます
    const { data, error } = await BadgeService.acquireBadge(userId, badgeId);

    // 3. 重複チェック（PostgreSQL の一意制約違反: エラーコード 23505）
    // 💡 既に獲得済みの場合、サービス層から特別なフラグやエラーコードが返されます
    if (error?.code === "23505") {
      console.log(
        `ℹ️ [API_BADGES_ACQUIRE] 重複リクエストを許容: user=${userId}, badge=${badgeId}`,
      );
      return NextResponse.json({
        success: true,
        data: {
          status: "ALREADY_ACQUIRED",
          message: "この標本はすでにあなたのジャーナルに記録されています。",
        },
      });
    }

    // 4. その他のデータベースエラー
    if (error) {
      throw error;
    }

    // 5. 正常終了：保存された獲得記録を返します
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error("❌ [API_BADGES_ACQUIRE_ERROR]:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message:
            "大地の記憶（データベース）への書き込み中に予期せぬエラーが発生しました。時間を置いて再度お試しください。",
        },
      },
      { status: 500 },
    );
  }
}
