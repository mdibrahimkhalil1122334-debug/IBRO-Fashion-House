import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "IBRO Fashion House | Fashion & Store",
  description: "IBRO Fashion House online clothing store and product management."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><body>{children}</body></html>;
}
