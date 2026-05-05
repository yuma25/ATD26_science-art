import { SpecimenSettings } from "./types";

import { commonBlue } from "./common-blue";
import { leviathan } from "./leviathan";
import { shellcrab } from "./shellcrab";
import { antiqueSword } from "./antique-sword";
import { greatWave } from "./great-wave";
import { moonJelly } from "./moon-jelly";

/**
 * --- 標本リストの定義 ---
 * 各標本の名前をキーにして、それぞれの設定をマッピングします。
 */
export const SPECIMEN_SETTINGS: Record<string, SpecimenSettings> = {
  蝶: commonBlue,
  クジラ: leviathan,
  ヤドカリ: shellcrab,
  剣: antiqueSword,
  波: greatWave,
  クラゲ: moonJelly,
};

/**
 * --- デフォルト設定 ---
 */
export const DEFAULT_SETTINGS: SpecimenSettings = {
  scale: "0.3 0.3 0.3",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 20000; easing: linear; loop: true",
  innerAnimation:
    "property: position; to: 0 0 0.05; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true",
  minScale: 0.1,
  maxScale: 1.0,
};

/**
 * --- 設定取得用関数 ---
 */
export const getSpecimenSettings = (name: string): SpecimenSettings => {
  return SPECIMEN_SETTINGS[name] || DEFAULT_SETTINGS;
};

export * from "./types";
