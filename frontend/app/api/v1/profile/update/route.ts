import { NextResponse } from "next/server";
import { BadgeService } from "@backend/services/badgeService";
import { UpdateProfileRequestSchema } from "@backend/types";

/**
 * 【ユーザープロフィール更新API】
 * 冒険者の設定（パーティ人数など）を更新します。
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = UpdateProfileRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "更新内容が正しくありません。",
            details: result.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { userId, updates } = result.data;

    const success = await BadgeService.updateProfile(userId, updates);

    return NextResponse.json({
      success,
      data: success ? { message: "プロフィールを更新しました" } : null,
    });
  } catch (error) {
    console.error("❌ [API_PROFILE_UPDATE_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "プロフィールの更新に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
