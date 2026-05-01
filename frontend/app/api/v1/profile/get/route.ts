import { NextResponse } from "next/server";
import { BadgeService } from "@backend/services/badgeService";

/**
 * 【ユーザープロフィール取得API】
 * 特定のユーザーのプロフィール情報（人数設定など）を取得します。
 */

export async function GET(request: Request) {
  try {
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

    const profile = await BadgeService.getProfile(userId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("❌ [API_PROFILE_GET_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "プロフィールの読み込みに失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
