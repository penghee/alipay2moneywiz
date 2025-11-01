import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../providers/Providers";
import WithSidebarLayout from "./with-sidebar-layout";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "家庭财务管理",
  description: "管理您的家庭资产和财务",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>
          <WithSidebarLayout>{children}</WithSidebarLayout>
        </Providers>
      </body>
    </html>
  );
}
