"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CloseButton } from "../../components/layout/CloseButton";

/**
 * 【作品詳細ビューワー】
 * 獲得した絵画作品を 2D 画像で詳細に鑑賞するための画面です。
 * 3D モデルではなく、実際の絵画の画像を表示します。
 */

function ViewerContent() {
  const searchParams = useSearchParams();

  // URLパラメータから情報を取得
  const imageUrl =
    searchParams.get("image") || "/images/paintings/painting_0.jpg";
  const name = searchParams.get("name") || "作品";
  const artist = searchParams.get("artist") || "";

  return (
    <div className="fixed inset-0 bg-[#1a1512] flex flex-col items-center justify-center overflow-hidden">
      {/* 1. 背景の装飾（ギャラリーのような雰囲気） */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#3e2f28,transparent)]" />
      {/* 2. ヘッダー UI */}
      <div className="absolute top-0 left-0 right-0 z-50 p-8 flex justify-center w-full">
        <div className="text-center space-y-1 w-full max-w-[90vw] overflow-hidden">
          <h1
            className={`text-white/90 font-black uppercase tracking-[0.3em] italic whitespace-nowrap px-4 ${
              name.length > 12 ? "text-[10px]" : "text-sm"
            }`}
          >
            {name}
          </h1>
          {artist && (
            <p
              className={`text-white/60 font-bold uppercase tracking-[0.1em] whitespace-nowrap px-4 ${
                artist.length > 15 ? "text-[8px]" : "text-[10px]"
              }`}
            >
              {artist}
            </p>
          )}
          <div className="h-[1px] w-12 bg-amber-400/50 mx-auto mt-2" />
        </div>
      </div>

      <CloseButton />
      {/* 3. メイン画像表示（豪華な額縁演出） */}
      <div className="relative z-10 p-2 sm:p-4 bg-gradient-to-br from-[#d4af37] via-[#f9e4b7] to-[#8c6d31] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] border border-[#b8860b]/30">
        {/* 外枠の装飾ライン */}
        <div className="absolute inset-2 border border-[#8c6d31]/50 pointer-events-none" />

        {/* 内側のダークフレーム（木枠） */}
        <div className="relative p-1 bg-[#1a120f] shadow-2xl">
          {/* 作品を引き立てる白のマット（パスマルテュ） */}
          <div className="bg-[#f2f2f2] p-4 sm:p-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] border border-[#d1d1d1]">
            <div className="relative bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={name}
                className="max-w-[75vw] max-h-[55vh] object-contain block"
              />

              {/* 画像へのわずかな落ち影とガラスの反射風演出 */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_5px_15px_rgba(0,0,0,0.1)] bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
            </div>
          </div>
        </div>

        {/* 額縁全体の光沢・質感演出 */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent)] mix-blend-overlay" />
        <div className="absolute inset-0 pointer-events-none border-[0.5px] border-white/20" />
      </div>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#1a1512]" />}>
      <ViewerContent />
    </Suspense>
  );
}
