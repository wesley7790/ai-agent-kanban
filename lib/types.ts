export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskType = 'general' | 'research' | 'writing' | 'planning' | 'coding' | 'analysis';

export interface TaskComment {
  id: string;
  author: 'user' | 'agent';
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface ConversationLink {
  id: string;
  title: string;
  url: string;
  type?: 'chat' | 'doc' | 'issue' | 'other';
}

export interface TaskDeliverable {
  summary: string;
  contentMarkdown: string;
  keyTakeaways?: string[];
  suggestedNextSteps?: string[];
  externalUrl?: string;
  generatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  tags: string[];
  comments: TaskComment[];
  conversationLinks: ConversationLink[];
  deliverable?: TaskDeliverable | null;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastError?: string | null;
}

export interface IngestTaskPayload {
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceType?: string;
  tags?: string[];
  priority?: TaskPriority;
  targetStatus?: 'backlog' | 'todo';
}
