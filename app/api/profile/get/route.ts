import { NextResponse } from "next/server";
import { BadgeService } from "../../../../backend/services/badgeService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const profile = await BadgeService.getProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("API_PROFILE_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
