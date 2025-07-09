import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ROLES } from '@/lib/constants';

const promotionSchema = z.object({
  employeeId: z.string().min(1),
  submittedById: z.string().min(1),
  status: z.string(),
  proposedCadre: z.string().min(1),
  promotionType: z.enum(['Experience', 'EducationAdvancement']),
  documents: z.array(z.string()),
  studiedOutsideCountry: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedData = promotionSchema.parse(body);

    const newRequest = await db.promotionRequest.create({
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
    console.error("[PROMOTIONS_POST]", error);
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
        employee: { select: { name: true, zanId: true, department: true, cadre: true, employmentDate: true, dateOfBirth: true, institution: { select: { name: true } }, payrollNumber: true, zssfNumber: true }},
        submittedBy: { select: { name: true, role: true } },
        reviewedBy: { select: { name: true, role: true } },
    };

    const whereClause: any = {};
    
    if (userRole === ROLES.HRO) {
        if (!userInstitutionId) {
             requests = []; // HRO with no institution sees no data
        } else {
             whereClause.employee = { institutionId: userInstitutionId };
        }
    } else if (userRole === ROLES.HHRMD) {
      whereClause.status = { contains: 'HHRMD' };
    } else if (userRole === ROLES.HRMO) {
       whereClause.status = { contains: 'HRMO' };
    } else {
        // Higher roles (CSCS, Admin) can see more
        whereClause.status = { notIn: ["Closed - Satisfied"] }; // Example filter
    }
    
    requests = await db.promotionRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: includeOptions,
    });
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("[PROMOTIONS_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
