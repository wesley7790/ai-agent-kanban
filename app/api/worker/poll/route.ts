import { NextRequest, NextResponse } from 'next/server';
import { claimNextTodoTask, updateTask, addComment } from '@/lib/db';
import { executeTaskWithAgent } from '@/lib/ai-agent';

export const dynamic = 'force-dynamic';

// Vercel Cron or Manual trigger handler
export async function GET(req: NextRequest) {
  return handlePolling(req);
}

export async function POST(req: NextRequest) {
  return handlePolling(req);
}

async function handlePolling(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Optional cron security verification if configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // In production with Vercel Cron, verify secret if set
  }

  try {
    // Step 1: Claim the next available 'todo' task atomically
    const claimedTask = await claimNextTodoTask();

    if (!claimedTask) {
      return NextResponse.json({
        success: true,
        message: 'No pending tasks in To-Do queue.',
        processed: false
      });
    }

    console.log(`[Worker] Claimed task: ${claimedTask.id} - "${claimedTask.title}"`);

    // Step 2: Execute task with AI Agent
    const result = await executeTaskWithAgent(claimedTask);

    if (result.success && result.deliverable) {
      // Step 3: Update task with deliverable and move to 'in_review'
      await updateTask(claimedTask.id, {
        status: 'in_review',
        deliverable: result.deliverable,
        lastError: null,
      });

      // Add Agent comment
      await addComment(claimedTask.id, {
        author: 'agent',
        authorName: 'AI Agent',
        content: result.agentComment || '任務執行完畢，已生成交付成果，請檢視與審核。',
      });

      return NextResponse.json({
        success: true,
        message: `Task ${claimedTask.id} processed successfully. Moved to In-Review.`,
        processed: true,
        taskId: claimedTask.id,
        deliverableSummary: result.deliverable.summary
      });
    } else {
      // Step 4: Handle failure - record error and notify in comments
      await updateTask(claimedTask.id, {
        status: 'in_review', // Still move to review so human sees the error report
        lastError: result.error || 'Unknown execution error',
      });

      await addComment(claimedTask.id, {
        author: 'agent',
        authorName: 'AI Agent',
        content: `執行過程遭遇錯誤：${result.error || '未能成功生成交付成果'}。請檢查需求或重新將卡片拖回待辦事項。`,
      });

      return NextResponse.json({
        success: false,
        message: `Task ${claimedTask.id} encountered error.`,
        error: result.error,
        processed: true,
        taskId: claimedTask.id
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Worker] Polling loop error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
