import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Task, TaskComment, ConversationLink, TaskStatus } from './types';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const USE_DB = Boolean(process.env.DATABASE_URL);
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// ==================== Local JSON Helpers ====================

function ensureDataFile(): Task[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialTasks: Task[] = [
      {
        id: 'task_001',
        title: '分析 2026 最新開源 AI Agent 框架對比',
        description: '調研目前主流開源 Agent 框架在多 Agent 協同、工具調用延遲、以及長文本上下文管理上的優缺點。',
        status: 'todo',
        priority: 'high',
        taskType: 'research',
        tags: ['AI Agent', '架構調研'],
        comments: [],
        conversationLinks: [],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialTasks, null, 2), 'utf-8');
    return initialTasks;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Task[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

// ==================== DB Row -> Task Mapping ====================

function rowToTask(row: any, comments: any[] = [], links: any[] = []): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as Task['priority'],
    taskType: row.taskType as Task['taskType'],
    tags: row.tags || [],
    deliverable: row.deliverable || null,
    lastError: row.lastError || null,
    createdAt: row.createdAt?.toISOString?.() || row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
    startedAt: row.startedAt?.toISOString?.() || row.startedAt || null,
    completedAt: row.completedAt?.toISOString?.() || row.completedAt || null,
    comments: comments.map(c => ({
      id: c.id,
      author: c.author as 'user' | 'agent',
      authorName: c.authorName || undefined,
      content: c.content,
      createdAt: c.createdAt?.toISOString?.() || c.createdAt,
    })),
    conversationLinks: links.map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      type: l.type as ConversationLink['type'],
    })),
  };
}

// ==================== Exported Functions ====================

export async function getTasks(): Promise<Task[]> {
  if (!USE_DB) return ensureDataFile();

  const rows = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
  const taskIds = rows.map(r => r.id);

  const [allComments, allLinks] = await Promise.all([
    prisma.comment.findMany({ where: { taskId: { in: taskIds } } }),
    prisma.conversationLink.findMany({ where: { taskId: { in: taskIds } } }),
  ]);

  const commentsByTask = new Map<string, any[]>();
  const linksByTask = new Map<string, any[]>();
  allComments.forEach(c => {
    const arr = commentsByTask.get(c.taskId) || [];
    arr.push(c);
    commentsByTask.set(c.taskId, arr);
  });
  allLinks.forEach(l => {
    const arr = linksByTask.get(l.taskId) || [];
    arr.push(l);
    linksByTask.set(l.taskId, arr);
  });

  return rows.map(r => rowToTask(r, commentsByTask.get(r.id) || [], linksByTask.get(r.id) || []));
}

export async function getTaskById(id: string): Promise<Task | null> {
  if (!USE_DB) {
    return ensureDataFile().find(t => t.id === id) || null;
  }

  const row = await prisma.task.findUnique({ where: { id } });
  if (!row) return null;

  const [comments, links] = await Promise.all([
    prisma.comment.findMany({ where: { taskId: id } }),
    prisma.conversationLink.findMany({ where: { taskId: id } }),
  ]);

  return rowToTask(row, comments, links);
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
  if (!USE_DB) {
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

  const row = await prisma.task.create({
    data: {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: input.title,
      description: input.description,
      status: input.status || 'backlog',
      priority: input.priority || 'medium',
      taskType: input.taskType || 'general',
      tags: input.tags || [],
    },
  });

  if (input.conversationLinks?.length) {
    await prisma.conversationLink.createMany({
      data: input.conversationLinks.map(l => ({
        id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        taskId: row.id,
        title: l.title,
        url: l.url,
        type: l.type || 'chat',
      })),
    });
  }

  return rowToTask(row, [], input.conversationLinks || []);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  if (!USE_DB) {
    const tasks = ensureDataFile();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    const current = tasks[index];
    const updatedTask: Task = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status === 'in_progress' && current.status !== 'in_progress') {
      updatedTask.startedAt = new Date().toISOString();
    }
    if ((updates.status === 'in_review' || updates.status === 'done') && !current.completedAt) {
      updatedTask.completedAt = new Date().toISOString();
    }
    tasks[index] = updatedTask;
    saveTasks(tasks);
    return updatedTask;
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;

  const data: any = { updatedAt: new Date() };
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status !== undefined) {
    data.status = updates.status;
    if (updates.status === 'in_progress' && existing.status !== 'in_progress') {
      data.startedAt = new Date();
    }
    if ((updates.status === 'in_review' || updates.status === 'done') && !existing.completedAt) {
      data.completedAt = new Date();
    }
  }
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.taskType !== undefined) data.taskType = updates.taskType;
  if (updates.tags !== undefined) data.tags = updates.tags;
  if (updates.deliverable !== undefined) data.deliverable = updates.deliverable;
  if (updates.lastError !== undefined) data.lastError = updates.lastError;

  await prisma.task.update({ where: { id }, data });
  return getTaskById(id);
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!USE_DB) {
    const tasks = ensureDataFile();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    saveTasks(filtered);
    return true;
  }

  try {
    await prisma.task.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function addComment(taskId: string, comment: {
  author: 'user' | 'agent';
  authorName?: string;
  content: string;
}): Promise<TaskComment | null> {
  if (!USE_DB) {
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

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;

  const row = await prisma.comment.create({
    data: {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId: taskId,
      author: comment.author,
      authorName: comment.authorName || (comment.author === 'user' ? 'User' : 'AI Agent'),
      content: comment.content,
    },
  });

  return {
    id: row.id,
    author: row.author as 'user' | 'agent',
    authorName: row.authorName || undefined,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function addConversationLink(taskId: string, link: {
  title: string;
  url: string;
  type?: ConversationLink['type'];
}): Promise<ConversationLink | null> {
  if (!USE_DB) {
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

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;

  const row = await prisma.conversationLink.create({
    data: {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId: taskId,
      title: link.title,
      url: link.url,
      type: link.type || 'chat',
    },
  });

  return {
    id: row.id,
    title: row.title,
    url: row.url,
    type: row.type as ConversationLink['type'],
  };
}

export async function claimNextTodoTask(): Promise<Task | null> {
  if (!USE_DB) {
    const tasks = ensureDataFile();
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

  const todoTasks = await prisma.task.findMany({
    where: { status: 'todo' },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  if (todoTasks.length === 0) return null;

  const taskToClaim = todoTasks[0];
  await prisma.task.update({
    where: { id: taskToClaim.id },
    data: { status: 'in_progress', startedAt: new Date(), updatedAt: new Date() },
  });

  return getTaskById(taskToClaim.id);
}
