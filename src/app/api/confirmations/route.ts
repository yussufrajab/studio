import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ROLES } from '@/lib/constants';

const confirmationSchema = z.object({
  employeeId: z.string().min(1),
  documents: z.array(z.string()),
  submittedById: z.string().min(1),
  status: z.string(), // e.g., 'Pending HHRMD Review' or 'Pending HRMO Review'
  rejectionReason: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, documents, submittedById, status } = confirmationSchema.parse(body);

    const newRequest = await db.confirmationRequest.create({
      data: {
        employeeId,
        documents,
        submittedById,
        status,
        reviewStage: 'initial',
      },
       include: {
        employee: {
          select: {
            name: true,
            zanId: true,
            department: true,
            cadre: true,
            employmentDate: true,
            dateOfBirth: true,
            institution: { select: { name: true } },
            payrollNumber: true,
            zssfNumber: true,
          },
        },
        submittedBy: {
          select: { name: true, role: true },
        },
      },
    });
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("[CONFIRMATIONS_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const userRole = searchParams.get('userRole');
  const userInstitutionId = searchParams.get('userInstitutionId');

  if (!userId || !userRole) {
    return new NextResponse("User ID and Role are required", { status: 400 });
  }

  try {
    let requests;
    const includeOptions = {
      employee: {
        select: {
          name: true,
          zanId: true,
          department: true,
          cadre: true,
          employmentDate: true,
          dateOfBirth: true,
          institution: { select: { name: true } },
          payrollNumber: true,
          zssfNumber: true,
        },
      },
      submittedBy: {
        select: { name: true, role: true },
      },
      reviewedBy: {
        select: { name: true, role: true },
      },
    };

    const whereClause: any = {};
    
    if (userRole === ROLES.HRO) {
        // HRO should see all requests they submitted, regardless of institution
        whereClause.submittedById = userId;
    } else if (userRole === ROLES.HHRMD || userRole === ROLES.HRMO) {
      // HHRMD and HRMO share the same review responsibility
      // They should see requests that are in 'initial' or 'commission_review' stage
      // and not yet completed (approved/rejected by commission).
      whereClause.reviewStage = { in: ['initial', 'commission_review'] };
      whereClause.status = { notIn: ['Approved by Commission', 'Rejected by Commission'] };
    } else {
        // Higher roles (CSCS, Admin) can see more
        whereClause.status = { notIn: ["Closed - Satisfied"] }; // Example filter
    }
    
    requests = await db.confirmationRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: includeOptions,
    });
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("[CONFIRMATIONS_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, reviewStage, rejectionReason, reviewedById, commissionDecisionDate } = body;

    if (!id) {
      return new NextResponse('Confirmation Request ID is required', { status: 400 });
    }

    const updateData: any = { status, reviewStage, reviewedById };

    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }

    if (commissionDecisionDate !== undefined) {
      updateData.commissionDecisionDate = commissionDecisionDate;
    }

    const updatedRequest = await db.confirmationRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[CONFIRMATIONS_PATCH]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
