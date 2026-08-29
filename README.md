# AI Agent 任務管理看板 (AI Agent Task Kanban System)

> 🚀 **擺脫單一對話框上下文淹沒，將 AI Agent 開發與通用任務轉向「看板非同步工作流」。**

本專案參考影片實踐理念，將 AI 任務從即時對話轉移至結構化看板。透過**積壓池（Backlog）**、**待辦池（To-Do）**、**執行中（In Progress）**、**審核中（In Review）**與**已完成（Done）**五大狀態，落實 **Human-in-the-loop（人機反饋閉環）** 與 **非同步非阻塞執行**。

---

## 🌟 核心設計原則

1. **防護閘門（積壓事項 Backlog）**：
   - 隨手記錄靈感、選題或外部自動匯入的資料。
   - **AI 不會主動碰觸此欄位**，直到人類確認需求成熟並移入「待辦事項」，避免半成品直接觸發執行。

2. **非同步自動化輪詢（To-Do 認領池）**：
   - 雲端 Worker（Vercel Cron）定時每 5 分鐘輪詢 `/api/worker/poll`，自動認領待辦任務並調用 LLM API。
   - 人類無需盯著對話框等待，也不受限於 AI Token 刷新週期。

3. **審核與二次迭代閉環（In-Review 反饋機制）**：
   - AI 完成後將交付成果（Markdown 結構化報告、關鍵要點、建議下一步）附於卡片內。
   - 人類可在卡片留下反饋並一鍵「退回待辦」，AI 下次輪詢將自動讀取前次成果與人類意見進行修訂。

4. **跨對話上下文聚合（Task-Centric Context）**：
   - 每張卡片可綁定多個對話 Session 連結與外部參考文檔，告別翻找混亂對話紀錄的困擾。

5. **被動靜默收集（Ingestion Webhook）**：
   - 提供 `/api/tasks/ingest` 端點，可透過瀏覽器外掛、Telegram Bot、iOS 捷徑或 GitHub Webhook 隨時將點讚與靈感自動塞入 Backlog。

---

## 📁 專案目錄結構

```text
ai-agent-kanban/
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts              # 任務清單與建立 API
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts          # 任務狀態更新/刪除
│   │   │   │   └── comments/route.ts # 人類反饋評論 API
│   │   │   └── ingest/route.ts       # 外部靈感 Webhook 收集端點
│   │   └── worker/
│   │       └── poll/route.ts         # 雲端定時輪詢與 AI 執行器 (Cron)
│   ├── layout.tsx
│   ├── page.tsx                      # 看板主頁
│   └── globals.css
├── components/
│   ├── KanbanBoard.tsx               # 看板主控制器 (含即時輪詢與拖曳)
│   ├── KanbanColumn.tsx              # 看板欄位
│   ├── TaskCard.tsx                  # 任務卡片
│   ├── TaskDetailModal.tsx           # 任務詳情、Markdown 成果與反饋抽屜
│   ├── NewTaskModal.tsx              # 快速建立任務彈窗
│   └── Header.tsx                    # 狀態概況與手動觸發按鈕
├── lib/
│   ├── types.ts                      # 核心資料結構定義
│   ├── db.ts                         # 本地 JSON / 雲端 DB 資料庫操作層
│   └── ai-agent.ts                   # 通用任務 AI Agent 執行引擎
├── prisma/
│   └── schema.prisma                 # Prisma ORM Schema
├── schema.sql                        # Supabase / PostgreSQL 初始化腳本
├── vercel.json                       # Vercel Cron 排程配置
└── .env.example
```

---

## 🚀 快速上手 (本機零配置運行)

本專案內建**零配置資料庫相容層**，無需事先安裝 PostgreSQL 即可直接執行：

```bash
# 1. 複製專案
git clone <your-repo>
cd ai-agent-kanban

# 2. 安裝依賴
npm install

# 3. 配置環境變數
cp .env.example .env.local
# 在 .env.local 中填入您的 OPENAI_API_KEY 或 GEMINI_API_KEY

# 4. 啟動開發伺服器
npm run dev
```

開啟瀏覽器造訪 `http://localhost:3000` 即可開始使用！

---

## ☁️ 雲端部署指引 (Vercel + Supabase)

### 步驟 1：建立 Supabase 雲端資料庫
1. 前往 [Supabase](https://supabase.com) 免費建立新專案。
2. 進入 **SQL Editor**，複製專案根目錄下的 `schema.sql` 內容貼上並執行（RUN），完成資料表與索引建立。
3. 在 **Project Settings -> Database** 取得 PostgreSQL Connection String。

### 步驟 2：部署至 Vercel
1. 將專案 Push 至您的 GitHub 專案庫。
2. 前往 [Vercel](https://vercel.com) 匯入該專案。
3. 在專案 **Environment Variables** 新增：
   - `DATABASE_URL`: Supabase 連線字串（如使用 Prisma/Postgres）
   - `OPENAI_API_KEY`: 您的 LLM API Key（或配置相應的模型 Base URL）
   - `AI_MODEL`: `gpt-4o-mini` 或其他相容模型名稱
   - `CRON_SECRET`: 自訂的 Cron 安全金鑰字串
4. 點擊 **Deploy** 完成部署。

### 步驟 3：Vercel Cron 自動輪詢驗證
- 專案內建 `vercel.json`，部署後 Vercel 會自動建立每 5 分鐘執行一次的排程。
- 您也可以隨時在網頁右上角點擊 **「立即執行」** 按鈕進行手動觸發。

---

## 🔌 外部靈感與選題收集 (Webhook Ingest)

若您想從 iOS 捷徑、Telegram 機器人或瀏覽器擴充功能自動將收藏內容寫入「積壓事項」：

```bash
curl -X POST https://your-domain.vercel.app/api/tasks/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "調研 2026 最新開源 AI Agent 框架",
    "description": "整理社群討論中推薦的開源架構與評比",
    "sourceUrl": "https://example.com/article",
    "sourceType": "Twitter / X",
    "tags": ["AI", "選題調研"]
  }'
```
所有透過此端點匯入的內容均會**預設進入「積壓事項 (Backlog)」**，確保人類把關權限。
