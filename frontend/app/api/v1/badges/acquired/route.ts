import { NextResponse } from "next/server";
import { BadgeService } from "@backend/services/badgeService";
import { UserBadgeSchema } from "@backend/types";

/**
 * 【獲得済み標本取得API】
 * 特定のユーザーがこれまでに獲得したすべての標本記録を取得します。
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_USER_ID",
          message: "冒険者の識別情報が見つかりません。",
        },
      },
      { status: 400 },
    );
  }

  try {
    // 1. 獲得履歴の取得
    const data = await BadgeService.getAcquiredBadges(userId);

    // 2. データの検証（部分的な失敗を許容せず、全体を検証）
    const validatedData = data.map((item) => UserBadgeSchema.parse(item));

    return NextResponse.json({
      success: true,
      data: validatedData,
    });
  } catch (error) {
    console.error("❌ [API_ACQUIRED_GET_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "これまでの発見記録を取得できませんでした。",
        },
      },
      { status: 500 },
    );
  }
}
