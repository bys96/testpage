"use client";
import { Provider } from "react-redux";
import { store } from "@/store";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Provider store={store}>{children}</Provider>
      </body>
    </html>
  );
}
