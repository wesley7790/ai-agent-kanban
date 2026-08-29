'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { Header } from './Header';
import { KanbanColumn } from './KanbanColumn';
import { TaskDetailModal } from './TaskDetailModal';
import { NewTaskModal } from './NewTaskModal';

export const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        // Sync selected task if currently open
        if (selectedTask) {
          const updatedSelected = data.tasks.find((t: Task) => t.id === selectedTask.id);
          if (updatedSelected) {
            setSelectedTask(updatedSelected);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [selectedTask]);

  useEffect(() => {
    fetchTasks();
    // Auto polling every 10s to see live AI worker updates
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchTasks();
      } else {
        if (newStatus === 'todo') {
          showToast('已移至「待辦事項」，AI 輪詢時將自動認領！');
        } else if (newStatus === 'done') {
          showToast('任務已審核完成！');
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchTasks();
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...data.task } : t))
        );
        setSelectedTask((prev) => (prev && prev.id === id ? { ...prev, ...data.task } : prev));
        showToast('任務卡片已更新');
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setSelectedTask(null);
        showToast('任務已刪除');
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'user', content }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        showToast('反饋已送出');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleAddLink = async (taskId: string, title: string, url: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentLinks = task.conversationLinks || [];
    const newLinks = [
      ...currentLinks,
      {
        id: `link_${Date.now()}`,
        title,
        url,
        type: 'doc' as const,
      },
    ];

    await handleUpdateTask(taskId, { conversationLinks: newLinks });
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => [data.task, ...prev]);
        showToast('新任務已建立');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleTriggerWorker = async () => {
    setIsPolling(true);
    showToast('AI Worker 正在認領並執行任務中...');

    try {
      const res = await fetch('/api/worker/poll', { method: 'POST' });
      const data = await res.json();
      if (data.processed) {
        showToast(`AI 執行完成！已移至「審核中」`);
      } else {
        showToast(data.message || '目前待辦池無任務');
      }
      fetchTasks();
    } catch (err: any) {
      showToast('AI 執行過程發生錯誤');
      console.error('Worker polling failed:', err);
    } finally {
      setIsPolling(false);
    }
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl shadow-indigo-500/20 border border-indigo-400 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <Header
        tasks={tasks}
        onNewTask={() => setIsNewTaskModalOpen(true)}
        onTriggerWorker={handleTriggerWorker}
        isPolling={isPolling}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Kanban Board Container */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="max-w-[1600px] mx-auto flex items-start gap-4 pb-8 min-h-[calc(100vh-160px)]">
          {/* Column 1: Backlog */}
          <KanbanColumn
            status="backlog"
            title="積壓事項 (Backlog)"
            subtitle="🔒 靈感池 · AI 不自動碰"
            icon="💡"
            badgeColor="bg-slate-800 text-slate-300"
            borderColor="border-slate-800"
            tasks={filteredTasks.filter((t) => t.status === 'backlog')}
            onTaskClick={(t) => setSelectedTask(t)}
            onStatusChange={handleStatusChange}
            onDropTask={handleStatusChange}
          />

          {/* Column 2: To-Do */}
          <KanbanColumn
            status="todo"
            title="待辦事項 (To-Do)"
            subtitle="⚡ 任務池 · AI 定時認領"
            icon="📌"
            badgeColor="bg-blue-950 text-blue-300 border border-blue-800"
            borderColor="border-blue-950/60"
            tasks={filteredTasks.filter((t) => t.status === 'todo')}
            onTaskClick={(t) => setSelectedTask(t)}
            onStatusChange={handleStatusChange}
            onDropTask={handleStatusChange}
          />

          {/* Column 3: In Progress */}
          <KanbanColumn
            status="in_progress"
            title="進行中 (In Progress)"
            subtitle="🔄 AI Agent 正在執行"
            icon="⚙️"
            badgeColor="bg-amber-950 text-amber-300 border border-amber-800"
            borderColor="border-amber-950/60"
            tasks={filteredTasks.filter((t) => t.status === 'in_progress')}
            onTaskClick={(t) => setSelectedTask(t)}
            onStatusChange={handleStatusChange}
            onDropTask={handleStatusChange}
          />

          {/* Column 4: In Review */}
          <KanbanColumn
            status="in_review"
            title="審核中 (In Review)"
            subtitle="👁️ 人類驗收 / 反饋閉環"
            icon="📑"
            badgeColor="bg-purple-950 text-purple-300 border border-purple-800"
            borderColor="border-purple-950/60"
            tasks={filteredTasks.filter((t) => t.status === 'in_review')}
            onTaskClick={(t) => setSelectedTask(t)}
            onStatusChange={handleStatusChange}
            onDropTask={handleStatusChange}
          />

          {/* Column 5: Done */}
          <KanbanColumn
            status="done"
            title="已完成 (Done)"
            subtitle="✅ 已通過驗收"
            icon="🎉"
            badgeColor="bg-emerald-950 text-emerald-300 border border-emerald-800"
            borderColor="border-emerald-950/60"
            tasks={filteredTasks.filter((t) => t.status === 'done')}
            onTaskClick={(t) => setSelectedTask(t)}
            onStatusChange={handleStatusChange}
            onDropTask={handleStatusChange}
          />
        </div>
      </main>

      {/* Task Detail Modal / Drawer */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onAddComment={handleAddComment}
        onAddLink={handleAddLink}
      />

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
};
