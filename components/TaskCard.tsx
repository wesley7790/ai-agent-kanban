'use client';

import React from 'react';
import { Task, TaskStatus } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
  };

  const priorityColors = {
    high: 'bg-rose-950 text-rose-300 border-rose-800',
    medium: 'bg-amber-950 text-amber-300 border-amber-800',
    low: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const priorityLabels = {
    high: '高優先',
    medium: '中優先',
    low: '低優先',
  };

  const typeLabels = {
    general: '通用',
    research: '調研',
    writing: '寫作',
    planning: '企劃',
    coding: '開發',
    analysis: '分析',
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(task)}
      className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer transition-all active:cursor-grabbing group relative"
    >
      {/* Top Meta Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {typeLabels[task.taskType] || '通用'}
          </span>
        </div>

        {/* Deliverable Badge */}
        {task.deliverable && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
            <span>✨</span> 成果已產出
          </span>
        )}
      </div>

      {/* Task Title */}
      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5 leading-snug">
        {task.title}
      </h3>

      {/* Task Description Preview */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {task.description || '無詳細說明'}
      </p>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 bg-slate-950 text-slate-400 rounded border border-slate-800"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] px-1 py-0.5 text-slate-500">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Card Footer: Metadata & Quick Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          {/* Comments count */}
          <span className="flex items-center gap-1 hover:text-slate-300" title="評論與審核歷史">
            💬 {task.comments?.length || 0}
          </span>
          {/* Conversation links count */}
          {task.conversationLinks && task.conversationLinks.length > 0 && (
            <span className="flex items-center gap-1 hover:text-slate-300" title="關聯對話/連結">
              🔗 {task.conversationLinks.length}
            </span>
          )}
        </div>

        {/* Quick Transition Trigger */}
        {task.status === 'backlog' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, 'todo');
            }}
            className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-800/60 transition-colors"
            title="確認需求成熟，放入待辦池讓 AI 認領"
          >
            放入待辦 →
          </button>
        )}

        {task.status === 'in_review' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, 'todo');
              }}
              className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 transition-colors"
              title="審核不通過，退回待辦重做"
            >
              ↩ 重做
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, 'done');
              }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 transition-colors"
              title="審核通過，完成任務"
            >
              ✓ 通過
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
