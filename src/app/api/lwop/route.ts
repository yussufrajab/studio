import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ROLES } from '@/lib/constants';

const lwopSchema = z.object({
  employeeId: z.string().min(1),
  documents: z.array(z.string()),
  submittedById: z.string().min(1),
  status: z.string(),
  duration: z.string().min(1),
  reason: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedData = lwopSchema.parse(body);

    const newRequest = await db.lwopRequest.create({
      data: {
        ...parsedData,
        reviewStage: 'initial',
      },
       include: {
        employee: { select: { name: true, zanId: true, department: true, cadre: true, employmentDate: true, dateOfBirth: true, institution: { select: { name: true } }, payrollNumber: true, zssfNumber: true }},
        submittedBy: { select: { name: true, role: true } },
      },
    });
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("[LWOP_POST]", error);
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
    const includeOptions = {
        employee: { select: { name: true, zanId: true, department: true, cadre: true, employmentDate: true, dateOfBirth: true, institution: { select: { name: true } }, payrollNumber: true, zssfNumber: true }},
        submittedBy: { select: { name: true, role: true } },
        reviewedBy: { select: { name: true, role: true } },
    };

    const whereClause: any = {};
    
    if (userRole === ROLES.HRO) {
        if (!userInstitutionId) {
             return NextResponse.json([]); // HRO with no institution sees no data
        } else {
             whereClause.employee = { institutionId: userInstitutionId };
        }
    } else if (userRole === ROLES.HHRMD) {
      whereClause.status = { contains: 'HHRMD' };
    } else if (userRole === ROLES.HRMO) {
       whereClause.status = { contains: 'HRMO' };
    } else {
        // Higher roles (CSCS, Admin) can see more
        whereClause.status = { notIn: ["Closed - Satisfied", "Approved by Commission"] }; // Example filter
    }
    
    const requests = await db.lwopRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: includeOptions,
    });
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("[LWOP_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
