import { SpecimenSettings } from "./types";

export const commonBlue: SpecimenSettings = {
  scale: "0.15 0.15 0.15",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 15000; easing: linear; loop: true",
  innerAnimation:
    "property: position; to: 0 0 0.05; dur: 1500; easing: easeInOutSine; dir: alternate; loop: true",
  minScale: 0.1,
  maxScale: 0.3,
};
