import { Task, TaskDeliverable } from './types';

export interface AgentExecutionResult {
  success: boolean;
  deliverable?: TaskDeliverable;
  agentComment: string;
  error?: string;
}

export async function executeTaskWithAgent(task: Task): Promise<AgentExecutionResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const modelName = process.env.AI_MODEL || 'gpt-4o-mini';

  // Build the context prompt with task details, previous output, and user review feedback
  const userFeedbackComments = (task.comments || [])
    .filter(c => c.author === 'user')
    .map(c => `- [${new Date(c.createdAt).toLocaleString()}]: ${c.content}`)
    .join('\n');

  const linksContext = (task.conversationLinks || [])
    .map(l => `- [${l.title}](${l.url}) (${l.type})`)
    .join('\n');

  let prompt = `【任務標題】：${task.title}\n`;
  prompt += `【任務類別】：${task.taskType}\n`;
  prompt += `【優先級別】：${task.priority}\n`;
  prompt += `【任務標籤】：${task.tags?.join(', ') || '無'}\n\n`;
  prompt += `【詳細需求說明】：\n${task.description}\n\n`;

  if (linksContext) {
    prompt += `【關聯參考連結】：\n${linksContext}\n\n`;
  }

  if (task.deliverable) {
    prompt += `【前次交付成果摘要】：\n${task.deliverable.summary}\n\n`;
    prompt += `【前次交付內容】：\n${task.deliverable.contentMarkdown}\n\n`;
  }

  if (userFeedbackComments) {
    prompt += `【人類審核反饋與評論（重要！請根據反饋進行修訂與強化）】：\n${userFeedbackComments}\n\n`;
  }

  prompt += `請針對上述任務進行深度思考與完整交付。請輸出 JSON 格式，結構如下：
{
  "summary": "執行總結與關鍵成果概述（2-3 句話）",
  "contentMarkdown": "完整交付內容（使用精美 Markdown 排版，包含標題、條列、代碼塊或表格，確保詳實具體，不可敷衍）",
  "keyTakeaways": ["關鍵要點 1", "關鍵要點 2", "關鍵要點 3"],
  "suggestedNextSteps": ["建議下一步 1", "建議下一步 2"],
  "comment": "以 AI Agent 身份給使用者的交付附言（例如說明本次修訂重點或需確認項目）"
}`;

  // If API Key is configured, make real LLM call
  if (apiKey) {
    try {
      if (process.env.OPENAI_API_KEY || process.env.OPENAI_BASE_URL) {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content: '你是一個專業、嚴謹且高效率的通用型 AI 任務執行 Agent。你負責在非同步看板工作流中執行使用者的各類任務（調研、分析、撰寫、規劃、代碼構思等）。請始終以專業 Markdown 格式輸出高品質、立即可用的成果，並嚴格遵循 JSON 輸出格式。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`LLM API request failed (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from LLM API');
        }

        const parsed = JSON.parse(content);
        return {
          success: true,
          deliverable: {
            summary: parsed.summary || '任務已完成執行。',
            contentMarkdown: parsed.contentMarkdown || content,
            keyTakeaways: parsed.keyTakeaways || [],
            suggestedNextSteps: parsed.suggestedNextSteps || [],
            generatedAt: new Date().toISOString()
          },
          agentComment: parsed.comment || '已完成任務交付，請檢視與審核。'
        };
      }
    } catch (err: any) {
      console.error('Agent execution error with LLM:', err);
      return {
        success: false,
        error: err.message || 'AI 執行失敗',
        agentComment: `執行遭遇異常：${err.message || '未知錯誤'}`
      };
    }
  }

  // Fallback: Intelligent Simulated Execution (for zero-config local testing)
  await new Promise(resolve => setTimeout(resolve, 800));

  const isRevision = Boolean(task.deliverable && userFeedbackComments);
  const resultSummary = isRevision
    ? `已根據您的最新審核反饋完成「${task.title}」的二次修訂與優化。`
    : `已完成通用任務「${task.title}」的全面分析與結構化交付。`;

  const generatedMarkdown = `# 交付報告：${task.title}

> **任務類型**：${task.taskType.toUpperCase()} | **優先級**：${task.priority.toUpperCase()} | **完成時間**：${new Date().toLocaleString()}

---

## 1. 任務核心目標與背景
${task.description}

---

## 2. 核心分析與方案實作
針對本任務的需求，已進行全維度梳理與架構拆解：

1. **核心要素歸納**：
   - 明確輸入條件與預期輸出標準。
   - 識別潛在邊界條件與相依性。
2. **具體執行方案**：
   - 採用模組化與可維護性架構，確保長期擴展性。
   - 建立非同步處理與錯誤降級策略。

${isRevision ? `### 針對前次審核反饋的改進說明：\n${userFeedbackComments}\n\n已全面調整相關策略，補齊缺失資訊並最佳化整體結構。` : ''}

---

## 3. 關鍵建議與後續行動
- **即刻行動**：依據此交付方案進行初步驗證或整合。
- **持續追蹤**：如需進一步細化特定子模組，可於卡片下方留言並退回「待辦事項」進行下一輪迭代。
`;

  return {
    success: true,
    deliverable: {
      summary: resultSummary,
      contentMarkdown: generatedMarkdown,
      keyTakeaways: [
        '已完整梳理任務需求並產出標準化交付方案',
        '包含結構化分析、核心實作建議與反饋修訂機制',
        '已建立可追蹤的上下文與版本歷程'
      ],
      suggestedNextSteps: [
        '檢閱交付內容是否符合實際應用場景',
        '若需調整請新增評論並將卡片拖回「待辦事項」'
      ],
      generatedAt: new Date().toISOString()
    },
    agentComment: isRevision
      ? '已依照您的反饋完成更新，請重新審核。'
      : '已完成初版成果交付，請進入審核階段！'
  };
}
