import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new NextResponse("User ID is required", { status: 400 });
  }

  try {
    const notifications = await db.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to recent notifications
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notificationIds } = markAsReadSchema.parse(body);

    if (notificationIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    await db.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS_MARK_READ_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
