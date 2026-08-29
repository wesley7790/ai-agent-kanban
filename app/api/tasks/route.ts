import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error), stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const newTask = await createTask({
      title: body.title,
      description: body.description || '',
      status: body.status || 'backlog',
      priority: body.priority || 'medium',
      taskType: body.taskType || 'general',
      tags: Array.isArray(body.tags) ? body.tags : [],
      conversationLinks: body.conversationLinks || [],
    });

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
