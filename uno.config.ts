import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  theme: {
    fontFamily: {
      display: "var(--font-display), Georgia, serif",
      hand: "var(--font-hand), cursive",
      sans: "var(--font-sans), Inter, sans-serif",
    },
    colors: {
      bg: "#FFF8F3",
      ink: "#43263A",
      inksoft: "#7A5B6E",
      rose: "#D64560",
      rosedeep: "#B03052",
      rosesoft: "#F6DCE2",
      rosemist: "#FBE9EE",
      gold: "#C9973F",
      goldsoft: "#F3E3C3",
      line: "#F0DCE0",
      dusk0: "#1C0F22",
      dusk1: "#3A1533",
      dusk2: "#6E2748",
      dusk3: "#B34A5E",
    },
  },
});
