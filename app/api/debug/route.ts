import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.DATABASE_URL || 'NOT SET';
  const masked = url.replace(/:[^:@]+@/, ':***@');
  return NextResponse.json({
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    maskedUrl: masked,
    useDb: Boolean(process.env.DATABASE_URL),
  });
}
