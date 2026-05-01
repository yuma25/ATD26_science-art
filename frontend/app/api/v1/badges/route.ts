import { NextResponse } from "next/server";
import { BadgeService } from "@backend/services/badgeService";
import { BadgeSchema } from "@backend/types";

/**
 * 【標本データ取得API】
 * データベースに登録されているすべての標本情報を取得するためのエンドポイントです。
 */

export async function GET() {
  try {
    // 1. 標本サービスを使用して、データベースから全件取得を試みます
    const badges = await BadgeService.getAllBadges();

    // 2. 取得したデータを検証し、標準化された形式で返します
    const validatedBadges = badges.map((b) => BadgeSchema.parse(b));

    return NextResponse.json({
      success: true,
      data: validatedBadges,
    });
  } catch (error) {
    // 3. 異常系：エラー内容をログに記録し、標準化されたエラー形式を返します
    console.error("❌ [API_BADGES_GET_ERROR]:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message:
            "標本データの取得に失敗しました。冒険を続けるには、通信環境を確認してください。",
        },
      },
      { status: 500 },
    );
  }
}
