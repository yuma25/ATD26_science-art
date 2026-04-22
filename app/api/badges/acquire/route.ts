import { NextResponse, NextRequest } from "next/server";
import { BadgeService } from "../../../../backend/services/badgeService";
import { Logger } from "../../../../server/lib/logger";

/**
 * 新しいバッジを獲得（保存）する API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, badgeId } = body;

    console.log(
      `[API/acquire] Received request: user=${userId}, badge=${badgeId}`,
    );

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: "userId and badgeId are required" },
        { status: 400 },
      );
    }

    // BadgeService 経由で DB に保存
    const result = await BadgeService.acquireBadge(userId, badgeId);

    if (!result) {
      console.error(`[API/acquire] Save failed: BadgeService returned null`);
      return NextResponse.json(
        {
          error:
            "Could not save discovery. Profile may not exist or Badge ID is wrong.",
        },
        { status: 500 },
      );
    }

    console.log(`[API/acquire] Save SUCCESS: user=${userId}, badge=${badgeId}`);
    return NextResponse.json(result);
  } catch (error) {
    Logger.error("API_ACQUIRE_POST_FAILED", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
