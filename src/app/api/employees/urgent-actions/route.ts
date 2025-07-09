import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subMonths, subYears } from 'date-fns';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userInstitutionId = searchParams.get('userInstitutionId');

        if (!userInstitutionId) {
            return new NextResponse("Institution ID is required", { status: 400 });
        }

        const twelveMonthsAgo = subMonths(new Date(), 12);
        const probationOverdue = await db.employee.findMany({
            where: {
                institutionId: userInstitutionId,
                status: 'On Probation',
                employmentDate: {
                    lte: twelveMonthsAgo
                }
            }
        });

        const retirementAgeStart = subYears(new Date(), 60);
        const retirementAgeEnd = subYears(new Date(), 59.5);
        const nearingRetirement = await db.employee.findMany({
            where: {
                institutionId: userInstitutionId,
                status: 'Confirmed',
                dateOfBirth: {
                    gte: retirementAgeStart,
                    lte: retirementAgeEnd,
                }
            }
        });

        return NextResponse.json({ probationOverdue, nearingRetirement });

    } catch (error) {
        console.error("[URGENT_ACTIONS_GET]", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
