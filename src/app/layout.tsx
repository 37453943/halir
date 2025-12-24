import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ReactNode } from "react";

export const metadata = {
  title: "Halir Perfumery",
  description: "Buy exclusive perfumes online",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
