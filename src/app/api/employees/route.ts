import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/constants';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get('userRole');
    const userInstitutionId = searchParams.get('userInstitutionId');
    const searchTerm = searchParams.get('q');
    
    const where: any = {};

    if (userRole === ROLES.HRO || userRole === ROLES.HRRP) {
        if (!userInstitutionId) return NextResponse.json([]);
        where.institutionId = userInstitutionId;
    }
    
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { zanId: { contains: searchTerm, mode: 'insensitive' } },
        { cadre: { contains: searchTerm, mode: 'insensitive' } },
        { institution: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }
    
    const employees = await db.employee.findMany({
        where,
        include: {
            institution: { select: { name: true }}
        },
        orderBy: { name: 'asc' },
        take: 50 // Limit results for performance
    });

    const formattedEmployees = employees.map(emp => ({
        ...emp,
        institution: emp.institution.name
    }));

    return NextResponse.json(formattedEmployees);
  } catch (error) {
    console.error("[EMPLOYEES_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
