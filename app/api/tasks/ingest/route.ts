import { NextRequest, NextResponse } from 'next/server';
import { createTask, addConversationLink } from '@/lib/db';
import { IngestTaskPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Webhook endpoint to passively collect inspirations / bookmarks / ideas into Backlog
export async function POST(req: NextRequest) {
  try {
    const body: IngestTaskPayload = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Title is required for ingestion' }, { status: 400 });
    }

    const task = await createTask({
      title: body.title,
      description: body.description || (body.sourceUrl ? `來源連結：${body.sourceUrl}` : '由外部自動化腳本匯入的靈感任務'),
      status: body.targetStatus || 'backlog', // Default to backlog to keep human gatekeeper intact
      priority: body.priority || 'medium',
      taskType: 'general',
      tags: body.tags || ['自動匯入', body.sourceType || 'Web'],
    });

    if (body.sourceUrl) {
      await addConversationLink(task.id, {
        title: body.sourceType ? `來源 (${body.sourceType})` : '原始參考連結',
        url: body.sourceUrl,
        type: 'doc'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Idea successfully ingested into Backlog pool',
      taskId: task.id,
      status: task.status
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
