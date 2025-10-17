import { Barlow } from "next/font/google";

export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

export const fonts = {
  sans: barlow.style.fontFamily,
} as const;
