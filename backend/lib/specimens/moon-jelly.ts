import { SpecimenSettings } from "./types";

export const moonJelly: SpecimenSettings = {
  scale: "0.15 0.15 0.15",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 60000; easing: linear; loop: true",
  innerAnimation:
    "property: scale; to: 0.02 0.02 0.02; dur: 4000; easing: easeInOutQuad; dir: alternate; loop: true",
  minScale: 0.1,
  maxScale: 0.3,
};
