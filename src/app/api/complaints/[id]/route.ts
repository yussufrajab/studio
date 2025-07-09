import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateComplaintSchema = z.object({
  status: z.string().optional(),
  reviewStage: z.string().optional(),
  officerComments: z.string().optional(),
  internalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  assignedOfficerRole: z.string().optional(),
  reviewedById: z.string().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validatedData = updateComplaintSchema.parse(body);

    const updatedComplaint = await db.complaint.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        complainant: {
          select: {
            name: true,
            employeeId: true,
            zanId: true,
            department: true,
            cadre: true,
            institution: { select: { name: true } },
          },
        },
        reviewedBy: {
          select: {
            name: true,
            role: true,
          }
        }
      },
    });

    return NextResponse.json(updatedComplaint);
  } catch (error) {
    console.error("[COMPLAINT_PUT]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
