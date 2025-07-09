import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const zanId = searchParams.get('zanId');

        if (!zanId) {
            return new NextResponse("ZAN-ID is required", { status: 400 });
        }

        const employee = await db.employee.findUnique({
            where: { zanId },
            include: {
                institution: { select: { name: true } },
                certificates: true,
            }
        });

        if (!employee) {
            return new NextResponse("Employee not found", { status: 404 });
        }

        const formattedEmployee = {
            ...employee,
            institution: employee.institution.name
        };

        return NextResponse.json(formattedEmployee);

    } catch (error) {
        console.error("[EMPLOYEE_SEARCH_GET]", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
