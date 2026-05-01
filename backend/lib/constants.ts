/**
 * 【標本設定定数】
 * このファイルでは、ARで表示される標本（3Dモデル）の大きさや動きのデータを定義しています。
 */

/**
 * 標本ごとの個別設定を定義するインターフェース
 * 初心者向けメモ：インターフェースは「データの設計図」のようなものです。
 */
export interface SpecimenSettings {
  scale: string; // A-Frameでの初期サイズ（例: "1 1 1"）
  outerAnimation: string; // 外側の回転などの動き
  innerAnimation: string; // 内側の浮遊などの動き
  minScale: number; // AR画面でカメラが最も近づいた時のサイズ（最小値）
  maxScale: number; // AR画面でカメラが最も遠い時のサイズ（最大値）
}

/**
 * --- 標本リストの定義 ---
 * 各標本の名前をキーにして、それぞれの見た目や動きの設定をまとめています。
 * 「冒険者のフィールドジャーナル」の世界観に合わせた標本たちが並びます。
 */
export const SPECIMEN_SETTINGS: Record<string, SpecimenSettings> = {
  // 1. 普通の青い蝶
  "Common Blue": {
    scale: "5.0 5.0 5.0",
    outerAnimation:
      "property: rotation; to: 0 0 360; dur: 15000; easing: linear; loop: true",
    innerAnimation:
      "property: position; to: 0 0 0.2; dur: 1500; easing: easeInOutSine; dir: alternate; loop: true",
    minScale: 3.0,
    maxScale: 8.0,
  },
  // 2. リヴァイアサン（クジラ）
  Leviathan: {
    scale: "0.07 0.07 0.07",
    outerAnimation:
      "property: rotation; to: 0 0 360; dur: 40000; easing: linear; loop: true",
    innerAnimation:
      "property: position; to: 0 0 0.3; dur: 8000; easing: easeInOutSine; dir: alternate; loop: true",
    minScale: 0.04,
    maxScale: 0.1,
  },
  // 3. ヤドカリ
  Shellcrab: {
    scale: "0.08 0.08 0.08",
    outerAnimation:
      "property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true",
    innerAnimation:
      "property: position; to: 0 0.1 0; dur: 3000; easing: easeInOutQuad; dir: alternate; loop: true",
    minScale: 0.05,
    maxScale: 0.12,
  },
  // 4. アンティークな剣
  "Antique Sword": {
    scale: "0.06 0.06 0.06",
    outerAnimation:
      "property: rotation; to: 0 0 360; dur: 10000; easing: linear; loop: true",
    innerAnimation:
      "property: position; to: 0 0 0.15; dur: 2000; easing: easeInOutSine; dir: alternate; loop: true",
    minScale: 0.03,
    maxScale: 0.08,
  },
  // 5. 大波（浮世絵風）
  "Great Wave": {
    scale: "0.025 0.025 0.025",
    outerAnimation:
      "property: rotation; to: 0 0 360; dur: 25000; easing: linear; loop: true",
    innerAnimation:
      "property: rotation; from: 80 -10 -5; to: 100 10 5; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
    minScale: 0.015,
    maxScale: 0.04,
  },
  // 6. ミズクラゲ
  "Moon Jelly": {
    scale: "0.08 0.08 0.08",
    outerAnimation:
      "property: rotation; to: 0 0 360; dur: 60000; easing: linear; loop: true",
    innerAnimation:
      "property: scale; to: 0.1 0.1 0.1; dur: 4000; easing: easeInOutQuad; dir: alternate; loop: true",
    minScale: 0.05,
    maxScale: 0.12,
  },
};

/**
 * --- デフォルト設定 ---
 * 新しい標本が追加された際や、設定が見つからない場合に使用される標準的な設定です。
 */
export const DEFAULT_SETTINGS: SpecimenSettings = {
  scale: "0.05 0.05 0.05",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 20000; easing: linear; loop: true",
  innerAnimation:
    "property: position; to: 0 0 0.1; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true",
  minScale: 0.03,
  maxScale: 0.08,
};

/**
 * --- 設定取得用関数 ---
 * 標本の名前から、その標本の設定を安全に取り出すためのツールです。
 *
 * @param name 標本の名前
 * @returns その標本の設定、またはデフォルト設定
 */
export const getSpecimenSettings = (name: string): SpecimenSettings => {
  // 名前がリストにあるか確認し、なければデフォルトを返します（早期リターンのような考え方）
  return SPECIMEN_SETTINGS[name] || DEFAULT_SETTINGS;
};
