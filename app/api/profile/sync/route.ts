import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "../../../../backend/lib/supabase";

/**
 * サーバー側でプロフィールを確実に同期する API
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (!supabaseAdmin) {
      console.error(
        "❌ SUPABASE_SERVICE_ROLE_KEY is missing in server environment",
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // 管理者権限で RLS をバイパスして書き込む
    const { error } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("❌ Profile sync failed in API:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Profile synced successfully via API:", userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
