import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRFlow — HR & Internal Communication Management Platform",
  description:
    "A modern, centralized platform for employee administration, hierarchical department structures, attendance tracking, leave workflows, and secure internal communications.",
  keywords: [
    "HRFlow",
    "Human Resources",
    "Employee Management",
    "Department Hierarchy",
    "Attendance Tracking",
    "Leave Management",
    "Internal Messaging",
  ],
  authors: [{ name: "HRFlow Engineering Team" }],
  // icons: {
  //   icon: "/icon.svg",
  // },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
