import { NextResponse } from "next/server";
import { BadgeService } from "../../../backend/services/badgeService";
import { Logger } from "../../../server/lib/logger";

/**
 * すべての標本（バッジ）を取得する API
 */
export async function GET() {
  try {
    const badges = await BadgeService.getAllBadges();
    return NextResponse.json(badges);
  } catch (error) {
    Logger.error("API_BADGES_GET_FAILED", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 },
    );
  }
}
