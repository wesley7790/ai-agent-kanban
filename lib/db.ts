import fs from 'fs';
import path from 'path';
import { Task, TaskComment, ConversationLink, TaskStatus } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data file exists with default sample tasks
function ensureDataFile(): Task[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialTasks: Task[] = [
      {
        id: 'task_001',
        title: '分析 2026 最新開源 AI Agent 框架對比 (LangChain vs LlamaIndex vs AutoGen)',
        description: '調研目前主流開源 Agent 框架在多 Agent 協同、工具調用延遲、以及長文本上下文管理上的優缺點，整理成結構化報告。',
        status: 'todo',
        priority: 'high',
        taskType: 'research',
        tags: ['AI Agent', '架構調研', '技術選型'],
        comments: [
          {
            id: 'c_01',
            author: 'user',
            authorName: 'User',
            content: '請著重在「非同步執行」與「狀態持久化」這兩個維度的比較。',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        conversationLinks: [
          {
            id: 'link_01',
            title: '參考：Agent 框架討論串',
            url: 'https://github.com/topics/ai-agent',
            type: 'doc'
          }
        ],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'task_002',
        title: '整理團隊週會自動化選題提案（AI & 開發工具方向）',
        description: '從近期熱門話題中篩選 3~5 個適合做成技術分享或影音教學的選題，需包含目標受眾、核心價值、以及實作難度評估。',
        status: 'backlog',
        priority: 'medium',
        taskType: 'planning',
        tags: ['選題調研', '內容企劃'],
        comments: [],
        conversationLinks: [],
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        updatedAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: 'task_003',
        title: '撰寫 Next.js App Router 與 Server Actions 最佳實踐指南',
        description: '整理一套適用於生產環境的 Next.js 架構規範，包含錯誤處理、樂觀更新（Optimistic Updates）與快取重置（Revalidation）。',
        status: 'in_review',
        priority: 'medium',
        taskType: 'writing',
        tags: ['Next.js', 'React', '開發規範'],
        deliverable: {
          summary: '已完成 Next.js App Router 與 Server Actions 最佳實踐指南，涵蓋架構、資料快取、錯誤邊界與表單驗證四大核心模組。',
          contentMarkdown: `# Next.js App Router & Server Actions 生產規範

## 1. 架構原則
- 遵循 **Colocation** 原則，將元件、樣式與 Actions 模組化就近放置。
- 嚴格區分 **Server Components (RSC)** 與 **Client Components ('use client')**，將 Client 邊界推到最小葉節點。

## 2. Server Actions 最佳實踐
1. **輸入驗證**：在 Actions 入口使用 Zod 解析並嚴格校驗 FormData / JSON。
2. **狀態回傳格式**：統一使用 \`{ success: boolean, data?: T, error?: string }\` 規範。
3. **快取重置**：異動成功後調用 \`revalidatePath()\` 或 \`revalidateTag()\`。

## 3. 推薦範例代碼
\`\`\`typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export async function createTaskAction(formData: FormData) {
  const parsed = TaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  // 寫入資料庫邏輯...
  revalidatePath('/dashboard');
  return { success: true };
}
\`\`\`
`,
          keyTakeaways: [
            '優先在 RSC 抓取資料，減少 Client Bundle 大小',
            'Server Actions 務必加入 Zod 驗證與 Try-Catch 錯誤攔截',
            '善用 revalidatePath 實現精準快取更新'
          ],
          suggestedNextSteps: [
            '為團隊建立共用 Action Response Wrapper',
            '加入 Optimistic UI 提升操作流暢度'
          ],
          generatedAt: new Date(Date.now() - 1800000).toISOString()
        },
        comments: [
          {
            id: 'c_02',
            author: 'agent',
            authorName: 'AI Agent',
            content: '已生成初版指南，請審核。若需調整章節或補充特定套件（如 TanStack Query），請在下方留言並拖回「待辦事項」。',
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ],
        conversationLinks: [],
        createdAt: new Date(Date.now() - 28800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    fs.writeFileSync(DATA_FILE, JSON.stringify(initialTasks, null, 2), 'utf-8');
    return initialTasks;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export async function getTasks(): Promise<Task[]> {
  return ensureDataFile();
}

export async function getTaskById(id: string): Promise<Task | null> {
  const tasks = ensureDataFile();
  return tasks.find(t => t.id === id) || null;
}

export async function createTask(input: {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  taskType?: Task['taskType'];
  tags?: string[];
  conversationLinks?: ConversationLink[];
}): Promise<Task> {
  const tasks = ensureDataFile();
  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: input.title,
    description: input.description,
    status: input.status || 'backlog',
    priority: input.priority || 'medium',
    taskType: input.taskType || 'general',
    tags: input.tags || [],
    comments: [],
    conversationLinks: input.conversationLinks || [],
    deliverable: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveTasks(tasks);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const tasks = ensureDataFile();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const current = tasks[index];
  const updatedTask: Task = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // If status changes to in_progress, track startedAt
  if (updates.status === 'in_progress' && current.status !== 'in_progress') {
    updatedTask.startedAt = new Date().toISOString();
  }
  // If status changes to in_review or done, track completedAt
  if ((updates.status === 'in_review' || updates.status === 'done') && !current.completedAt) {
    updatedTask.completedAt = new Date().toISOString();
  }

  tasks[index] = updatedTask;
  saveTasks(tasks);
  return updatedTask;
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = ensureDataFile();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}

export async function addComment(taskId: string, comment: {
  author: 'user' | 'agent';
  authorName?: string;
  content: string;
}): Promise<TaskComment | null> {
  const tasks = ensureDataFile();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const newComment: TaskComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    author: comment.author,
    authorName: comment.authorName || (comment.author === 'user' ? 'User' : 'AI Agent'),
    content: comment.content,
    createdAt: new Date().toISOString(),
  };

  task.comments = task.comments || [];
  task.comments.push(newComment);
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  return newComment;
}

export async function addConversationLink(taskId: string, link: {
  title: string;
  url: string;
  type?: ConversationLink['type'];
}): Promise<ConversationLink | null> {
  const tasks = ensureDataFile();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const newLink: ConversationLink = {
    id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: link.title,
    url: link.url,
    type: link.type || 'chat',
  };

  task.conversationLinks = task.conversationLinks || [];
  task.conversationLinks.push(newLink);
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  return newLink;
}

// Atomically claim the next 'todo' task for the AI worker
export async function claimNextTodoTask(): Promise<Task | null> {
  const tasks = ensureDataFile();
  // Find highest priority 'todo' task first (high -> medium -> low), then earliest created
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const todoTasks = tasks.filter(t => t.status === 'todo');

  if (todoTasks.length === 0) return null;

  todoTasks.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    if (pDiff !== 0) return pDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const taskToClaim = todoTasks[0];
  taskToClaim.status = 'in_progress';
  taskToClaim.startedAt = new Date().toISOString();
  taskToClaim.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  return taskToClaim;
}
