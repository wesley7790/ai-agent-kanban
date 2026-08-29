import { NextRequest, NextResponse } from 'next/server';
import { addComment } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ success: false, error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await addComment(params.id, {
      author: body.author || 'user',
      authorName: body.authorName,
      content: body.content,
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
