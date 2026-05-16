import { SpecimenSettings } from "./types";

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

import { commonBlue } from "./common-blue";
import { leviathan } from "./leviathan";
import { shellcrab } from "./shellcrab";
import { antiqueSword } from "./antique-sword";
import { greatWave } from "./great-wave";
import { moonJelly } from "./moon-jelly";

/**
 * --- 作品リストの定義 ---
 * 各作品の名前をキーにして、AR表示用の設定をマッピングします。
 */
export const SPECIMEN_SETTINGS: Record<string, SpecimenSettings> = {
  sample: commonBlue,
  お母さんの初水族館: leviathan,
  ちょっと不思議な海の冒険: shellcrab,
  海底の奥: antiqueSword,
  よすが: greatWave,
  遊々海月: moonJelly,
};

/**
 * --- 設定取得用関数 ---
 */
export const getSpecimenSettings = (name: string): SpecimenSettings => {
  return SPECIMEN_SETTINGS[name] || DEFAULT_SETTINGS;
};

export * from "./types";
