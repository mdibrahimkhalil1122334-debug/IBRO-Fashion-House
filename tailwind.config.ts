import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#171717", muted: "#737373", paper: "#f7f6f3", gold: "#b9975b" } } },
  plugins: []
};
export default config;
