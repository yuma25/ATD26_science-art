import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@backend/lib/supabase";

/**
 * 【プロフィール同期API】
 * ユーザーがアプリを開いた際に、プロフィールの存在確認と最終アクセス日時の更新をサーバー側で行います。
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_USER_ID", message: "ユーザーIDが必要です" },
        },
        { status: 400 },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_CONFIG_MISSING",
            message: "サーバーの設定に問題があります",
          },
        },
        { status: 500 },
      );
    }

    const { error } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("❌ [API_PROFILE_SYNC_FAILED]:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: { code: "DB_ERROR", message: error.message },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [API_PROFILE_SYNC_CRITICAL_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "サーバー内部でエラーが発生しました",
        },
      },
      { status: 500 },
    );
  }
}
