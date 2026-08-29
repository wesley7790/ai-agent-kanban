'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority, TaskType } from '@/lib/types';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onAddLink: (taskId: string, title: string, url: string) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  onAddComment,
  onAddLink,
}) => {
  if (!task) return null;

  const [activeTab, setActiveTab] = useState<'deliverable' | 'comments' | 'links' | 'settings'>('deliverable');
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [taskType, setTaskType] = useState<TaskType>(task.taskType);
  const [tagsInput, setTagsInput] = useState(task.tags?.join(', ') || '');
  const [commentText, setCommentText] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleSaveBasic = async () => {
    setIsSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onUpdate(task.id, {
      title,
      description,
      status,
      priority,
      taskType,
      tags,
    });
    setIsSaving(false);
  };

  const handleAddComment = async (sendAndMoveToTodo: boolean = false) => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    await onAddComment(task.id, commentText);
    if (sendAndMoveToTodo) {
      await onUpdate(task.id, { status: 'todo' });
      setStatus('todo');
    }
    setCommentText('');
    setIsSubmittingComment(false);
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    await onAddLink(task.id, newLinkTitle, newLinkUrl);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <span className="text-xs text-slate-500 font-mono">ID: {task.id}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={status}
                  onChange={(e) => {
                    const newSt = e.target.value as TaskStatus;
                    setStatus(newSt);
                    onUpdate(task.id, { status: newSt });
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none"
                >
                  <option value="backlog">🔒 積壓事項 (Backlog)</option>
                  <option value="todo">⚡ 待辦事項 (To-Do)</option>
                  <option value="in_progress">🔄 進行中 (In Progress)</option>
                  <option value="in_review">👁️ 審核中 (In Review)</option>
                  <option value="done">✅ 已完成 (Done)</option>
                </select>

                <select
                  value={priority}
                  onChange={(e) => {
                    const newPr = e.target.value as TaskPriority;
                    setPriority(newPr);
                    onUpdate(task.id, { priority: newPr });
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none"
                >
                  <option value="high">🔴 高優先級</option>
                  <option value="medium">🟡 中優先級</option>
                  <option value="low">⚪ 低優先級</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('確定要刪除這張任務卡片嗎？')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2.5 py-1.5 rounded-lg border border-rose-900/50 transition-colors"
            >
              刪除卡片
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 flex gap-4 text-xs font-medium text-slate-400 bg-slate-900">
          <button
            onClick={() => setActiveTab('deliverable')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'deliverable'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>✨</span> AI 交付成果 {task.deliverable ? '(已產出)' : ''}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>💬</span> 審核反饋 & 評論 ({task.comments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'links'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>🔗</span> 對話與外部連結 ({task.conversationLinks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>⚙️</span> 需求與任務屬性
          </button>
        </div>

        {/* Modal Body (Tab Contents) */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: AI Deliverables */}
          {activeTab === 'deliverable' && (
            <div>
              {task.deliverable ? (
                <div className="space-y-5">
                  {/* Summary Box */}
                  <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span>📌</span> 執行總結
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {task.deliverable.summary}
                    </p>
                    <span className="text-[11px] text-indigo-400/80 block mt-2">
                      生成時間：{new Date(task.deliverable.generatedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Key Takeaways & Next Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {task.deliverable.keyTakeaways && task.deliverable.keyTakeaways.length > 0 && (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>💡</span> 關鍵要點
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                          {task.deliverable.keyTakeaways.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {task.deliverable.suggestedNextSteps && task.deliverable.suggestedNextSteps.length > 0 && (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>🚀</span> 建議下一步
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                          {task.deliverable.suggestedNextSteps.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Full Deliverable Content */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      完整交付文檔 (Markdown)
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {task.deliverable.contentMarkdown}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <span className="text-3xl block mb-2">⏳</span>
                  <p className="text-sm font-semibold text-slate-300">尚未產出成果</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    請將卡片移至「待辦事項 (To-Do)」，AI Agent 輪詢時將自動認領並生成結構化報告。
                  </p>
                  {status === 'backlog' && (
                    <button
                      onClick={() => {
                        setStatus('todo');
                        onUpdate(task.id, { status: 'todo' });
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                    >
                      立即移至待辦池 (To-Do)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Comments & Human Feedback */}
          {activeTab === 'comments' && (
            <div className="space-y-5">
              {/* Comment Input */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  新增審核反饋 / 備註
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="例如：「請針對非同步資料流補充序列圖」、「請修正第三點的數據」..."
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-end gap-2 mt-2.5">
                  <button
                    onClick={() => handleAddComment(false)}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    僅留備註
                  </button>
                  <button
                    onClick={() => handleAddComment(true)}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                    title="將卡片退回待辦池，AI 輪詢時將讀取此反饋並進行二次修訂"
                  >
                    <span>↩</span> 提交反饋並退回待辦重做
                  </button>
                </div>
              </div>

              {/* Comments History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  歷史評論歷程 ({task.comments?.length || 0})
                </h4>
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        c.author === 'user'
                          ? 'bg-slate-900 border-indigo-900/40 text-slate-200'
                          : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          {c.author === 'user' ? '👤 人類審核員' : '🤖 AI Agent'}
                        </span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600 italic">尚無評論記錄</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Conversation Links & External Sources */}
          {activeTab === 'links' && (
            <div className="space-y-5">
              {/* Add Link Form */}
              <form onSubmit={handleAddLink} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="連結標題 (例如：ChatGPT 討論串 / 競品官網)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  + 新增連結
                </button>
              </form>

              {/* Links List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  已連結的對話與文檔 ({task.conversationLinks?.length || 0})
                </h4>
                {task.conversationLinks && task.conversationLinks.length > 0 ? (
                  task.conversationLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>🔗</span>
                        <span className="font-medium text-slate-200">{link.title}</span>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline text-[11px]"
                      >
                        開啟連結 ↗
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600 italic">尚無關聯連結</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Basic Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">任務標題</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">任務需求詳述</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">任務類別</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="general">通用任務 (General)</option>
                    <option value="research">調研與分析 (Research)</option>
                    <option value="writing">文章與報告 (Writing)</option>
                    <option value="planning">企劃與排程 (Planning)</option>
                    <option value="coding">程式碼構思 (Coding)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">標籤 (逗號分隔)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="AI, 架構, 規範..."
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveBasic}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isSaving ? '儲存中...' : '儲存變更'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
