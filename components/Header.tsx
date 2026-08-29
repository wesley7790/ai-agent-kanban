'use client';

import React from 'react';
import { Task } from '@/lib/types';

interface HeaderProps {
  tasks: Task[];
  onNewTask: () => void;
  onTriggerWorker: () => void;
  isPolling: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tasks,
  onNewTask,
  onTriggerWorker,
  isPolling,
  searchQuery,
  onSearchChange,
}) => {
  const counts = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    in_review: tasks.filter(t => t.status === 'in_review').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                AI Agent 任務管理看板
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-medium">
                  雲端非同步工作流
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                擺脫單一對話框噪聲 · 功能維度追蹤 · 人機反饋閉環
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="搜尋任務、標籤或內容..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-sm bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Trigger Worker Button */}
          <button
            onClick={onTriggerWorker}
            disabled={isPolling || counts.todo === 0}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isPolling
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-wait'
                : counts.todo > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
            }`}
            title={counts.todo === 0 ? '待辦清單無任務' : '立即觸發 AI 執行下一個待辦任務'}
          >
            <span className={isPolling ? 'animate-spin' : ''}>
              {isPolling ? '🔄' : '🚀'}
            </span>
            <span>{isPolling ? 'AI 執行中...' : `立即執行 (${counts.todo})`}</span>
          </button>

          {/* Add Task Button */}
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-600/20"
          >
            <span>+</span>
            <span>新增任務</span>
          </button>
        </div>
      </div>

      {/* Task Summary Badges */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400 overflow-x-auto">
        <span className="font-semibold text-slate-300">狀態概況：</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span> 積壓靈感 <b className="text-slate-200">{counts.backlog}</b>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> 待辦池 <b className="text-blue-300">{counts.todo}</b>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> 執行中 <b className="text-amber-300">{counts.in_progress}</b>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span> 待審核 <b className="text-purple-300">{counts.in_review}</b>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 已完成 <b className="text-emerald-300">{counts.done}</b>
        </span>
      </div>
    </header>
  );
};
