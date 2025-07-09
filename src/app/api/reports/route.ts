
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseISO, startOfDay, endOfDay, isValid, format } from 'date-fns';
import { Prisma } from '@prisma/client';

async function getReportData(reportType: string, fromDate?: Date, toDate?: Date, institutionId?: string) {
    let where: any = {};
    if (institutionId) {
        where.employee = { institutionId };
    }
    if (fromDate && toDate) {
        where.createdAt = { gte: fromDate, lte: toDate };
    }

    const includeEmployeeAndInstitution = {
        employee: {
            include: {
                institution: true,
            },
        },
    };

    switch (reportType) {
        case 'confirmation':
            where.status = 'Approved by Commission';
            const confirmations = await db.confirmationRequest.findMany({ where, include: includeEmployeeAndInstitution });
            let maleCount = 0;
            let femaleCount = 0;
            const confirmationData = confirmations.map((r, i) => {
                if(r.employee.gender === 'Male') maleCount++;
                if(r.employee.gender === 'Female') femaleCount++;
                return {
                    nam: i + 1,
                    jina: r.employee.name,
                    jinsia: r.employee.gender,
                    wizara: r.employee.institution?.name || 'N/A',
                    cheo: r.employee.cadre,
                    trhAjira: r.employee.employmentDate ? format(new Date(r.employee.employmentDate), 'dd/MM/yyyy') : 'N/A',
                    trhKuthibitishwa: r.commissionDecisionDate ? format(new Date(r.commissionDecisionDate), 'dd/MM/yyyy') : 'N/A',
                    chetiIpa: r.documents.includes('IPA Certificate') ? 'Yes' : 'No',
                    simu: r.employee.phoneNumber || 'N/A',
                };
            });
            return {
                title: 'Ripoti ya Kuthibitishwa Kazini',
                headers: ["NAM", "JINA KAMILI", "JINSIA", "WIZARA/TAASISI", "CHEO/WADHIFA", "TAREHE YA AJIRA", "TAREHE YA KUTHIBITISHWA", "CHETI CHA IPA", "NAM. YA SIMU"],
                dataKeys: ["nam", "jina", "jinsia", "wizara", "cheo", "trhAjira", "trhKuthibitishwa", "chetiIpa", "simu"],
                data: confirmationData,
                totals: {
                    descriptionMale: 'JUMLA YA WANAUME', valueMale: maleCount,
                    descriptionFemale: 'JUMLA YA WANAWAKE', valueFemale: femaleCount,
                    descriptionTotal: 'JUMLA KUU', valueTotal: maleCount + femaleCount,
                }
            };
        case 'promotion':
            let promotionWhere: any = { status: 'Approved by Commission' };
             if (institutionId) {
                promotionWhere.employee = { institutionId };
            }
             if (fromDate && toDate) {
                promotionWhere.createdAt = { gte: fromDate, lte: toDate };
            }

            const promotions = await db.promotionRequest.findMany({
                where: promotionWhere,
                include: { employee: { include: { institution: true } } }
            });

            const aggregated = promotions.reduce((acc, curr) => {
                const instName = curr.employee.institution?.name || 'N/A';
                if (!acc[instName]) {
                    acc[instName] = { m: 0, f: 0 };
                }
                if (curr.employee.gender === 'Male') acc[instName].m++;
                if (curr.employee.gender === 'Female') acc[instName].f++;
                return acc;
            }, {} as Record<string, { m: number; f: number }>);
            
            let totalM = 0, totalF = 0;
            const promotionData = Object.entries(aggregated).map(([wizara, counts], i) => {
                totalM += counts.m;
                totalF += counts.f;
                return { sno: i + 1, wizara, m: counts.m, f: counts.f, jumla: counts.m + counts.f };
            });
            
            return {
                title: 'Ripoti ya Kupandishwa Cheo (Jumla)',
                headers: ["S.NO", "WIZARA/TAASISI", "MALE", "FEMALE", "JUMLA"],
                dataKeys: ["sno", "wizara", "m", "f", "jumla"],
                data: promotionData,
                totals: { sno: 'JUMLA', wizara: '', m: totalM, f: totalF, jumla: totalM + totalF }
            };
        case 'contractual':
            let contractualWhere: any = { contractType: { not: 'Full-time' }};
            if (institutionId) contractualWhere.institutionId = institutionId;
            // No date filter for this one as it's a current state report
            const contractualEmployees = await db.employee.findMany({ where: contractualWhere, include: { institution: true } });
            
            const contractualData = contractualEmployees.map((e, i) => ({
                nam: i + 1,
                wizara: e.institution?.name,
                kada: e.cadre,
                jina: e.name,
                muda: e.contractType, // Assuming contract type holds the duration info
                mme: e.gender === 'Male' ? 1 : 0,
                mke: e.gender === 'Female' ? 1 : 0,
                jumla: 1,
                trhKibali: e.employmentDate ? format(new Date(e.employmentDate), 'dd-MMM-yy') : 'N/A',
                hali: 'AJIRA MPYA' // This logic may need refinement
            }));

            const totalContractualM = contractualData.reduce((sum, item) => sum + item.mme, 0);
            const totalContractualF = contractualData.reduce((sum, item) => sum + item.mke, 0);

            return {
                title: 'Ripoti ya Ajira za Mikataba',
                headers: ["NAM", "WIZARA/TAASISI", "KADA/CHEO", "JINA KAMILI", "MUDA WA MKATABA", "M'ME", "M'KE", "JUMLA", "TAREHE YA KUTOKA KIBALI", "HALI YA MKATABA"],
                dataKeys: ["nam", "wizara", "kada", "jina", "muda", "mme", "mke", "jumla", "trhKibali", "hali"],
                data: contractualData,
                totals: { nam: 'JUMLA KUU', mme: totalContractualM, mke: totalContractualF, jumla: totalContractualM + totalContractualF }
            }
        default:
            return { title: 'Ripoti Haijatengenezwa', headers: [], data: [], dataKeys: [], totals: {} };
    }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reportType = searchParams.get('reportType');
  const fromDateStr = searchParams.get('fromDate');
  const toDateStr = searchParams.get('toDate');
  const institutionId = searchParams.get('institutionId');

  if (!reportType) {
    return new NextResponse("Report type is required", { status: 400 });
  }

  try {
    const fromDate = fromDateStr && isValid(parseISO(fromDateStr)) ? startOfDay(parseISO(fromDateStr)) : undefined;
    const toDate = toDateStr && isValid(parseISO(toDateStr)) ? endOfDay(parseISO(toDateStr)) : undefined;

    const reportOutput = await getReportData(reportType, fromDate, toDate, institutionId || undefined);

    return NextResponse.json(reportOutput);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(`[PRISMA_REPORTS_ERROR]`, error.message);
        return new NextResponse(`Database error: ${error.meta?.cause || error.message}`, { status: 500 });
    }
    console.error(`[REPORTS_GET_${reportType?.toUpperCase()}]`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
