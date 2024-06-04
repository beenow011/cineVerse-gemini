import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Providers from "@/components/Providers";
import { Header } from "@/components/Header";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Toaster } from "@/components/ui/toaster";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <Providers>
          <body className={inter.className}>
            <WavyBackground className=" justify-start items-start">



              <Toaster />
              <Header />
              {children}</WavyBackground></body>
        </Providers>
      </html>
    </ClerkProvider>
  );
}
