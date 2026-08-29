'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  subtitle: string;
  icon: string;
  badgeColor: string;
  borderColor: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  subtitle,
  icon,
  badgeColor,
  borderColor,
  tasks,
  onTaskClick,
  onStatusChange,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[280px] max-w-[340px] bg-slate-950/60 rounded-2xl border flex flex-col transition-all duration-200 ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/20'
          : borderColor
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <h2 className="text-sm font-bold text-slate-200">{title}</h2>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {tasks.length}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* Cards Container */}
      <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-230px)]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-600 border border-dashed border-slate-850 rounded-xl">
            <span className="text-2xl mb-1 opacity-50">{icon}</span>
            <p className="text-xs">目前無任務</p>
            <p className="text-[10px] text-slate-700 mt-0.5">拖曳卡片至此處</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};
