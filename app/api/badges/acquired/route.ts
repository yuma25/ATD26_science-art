import { NextResponse, NextRequest } from "next/server";
import { BadgeService } from "../../../../backend/services/badgeService";
import { Logger } from "../../../../server/lib/logger";

/**
 * ユーザーが獲得済みのバッジID一覧を取得する API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const ids = await BadgeService.getAcquiredBadgeIds(userId);
    return NextResponse.json(ids);
  } catch (error) {
    Logger.error("API_ACQUIRED_GET_FAILED", error, { userId });
    return NextResponse.json(
      { error: "Failed to fetch acquired IDs" },
      { status: 500 },
    );
  }
}
