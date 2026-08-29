import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Agent 任務管理看板 | 雲端非同步通用工作流',
  description: '基於 Kanban 看板的雲端非同步 AI Agent 任務管理系統，支援需求沉澱、定時輪詢、多輪審核與反饋閉環。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
