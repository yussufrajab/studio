import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const institutionSchema = z.object({
  name: z.string().min(3, { message: "Institution name must be at least 3 characters long." }),
});

export async function GET() {
  try {
    const institutions = await db.institution.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(institutions);
  } catch (error) {
    console.error("[INSTITUTIONS_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = institutionSchema.parse(body);

    const newInstitution = await db.institution.create({
      data: {
        name: validatedData.name,
      },
    });
    return NextResponse.json(newInstitution, { status: 201 });
  } catch (error) {
    console.error("[INSTITUTIONS_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    // Prisma unique constraint error
    if ((error as any).code === 'P2002') {
        return new NextResponse('Institution with this name already exists', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
