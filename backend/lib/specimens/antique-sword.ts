import { SpecimenSettings } from "./types";

export const antiqueSword: SpecimenSettings = {
  scale: "0.12 0.12 0.12",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 10000; easing: linear; loop: true",
  innerAnimation:
    "property: position; to: 0 0 0.05; dur: 2000; easing: easeInOutSine; dir: alternate; loop: true",
  minScale: 0.08,
  maxScale: 0.25,
};
