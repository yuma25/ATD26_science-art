import { NextResponse } from "next/server";
import { BadgeService } from "../../../../backend/services/badgeService";

export async function POST(request: Request) {
  try {
    const { userId, updates } = await request.json();
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // 管理者権限で実行されるため RLS を回避可能
    const success = await BadgeService.updateProfile(userId, updates);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("API_PROFILE_UPDATE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
