
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns';

interface TrackedRequest {
  id: string;
  employeeName: string;
  zanId: string;
  requestType: string;
  submissionDate: string;
  status: string;
  lastUpdatedDate: string;
  currentStage: string;
  employeeInstitution?: string;
  gender?: 'Male' | 'Female' | 'N/A';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zanId = searchParams.get('zanId');
    const institutionName = searchParams.get('institutionName');
    const status = searchParams.get('status');
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');

    const includeEmployee = {
      employee: {
        select: {
          name: true,
          zanId: true,
          gender: true,
          institution: { select: { name: true } },
        },
      },
    };
    
    const includeComplainant = {
        complainant: {
            select: {
                name: true,
                zanId: true,
                gender: true,
                institution: { select: { name: true } }
            }
        }
    };

    const confirmations = await db.confirmationRequest.findMany({ include: includeEmployee });
    const lwops = await db.lwopRequest.findMany({ include: includeEmployee });
    const promotions = await db.promotionRequest.findMany({ include: includeEmployee });
    const complaints = await db.complaint.findMany({ include: includeComplainant });
    const cadreChanges = await db.cadreChangeRequest.findMany({ include: includeEmployee });
    const retirements = await db.retirementRequest.findMany({ include: includeEmployee });
    const resignations = await db.resignationRequest.findMany({ include: includeEmployee });
    const serviceExtensions = await db.serviceExtensionRequest.findMany({ include: includeEmployee });
    const separations = await db.separationRequest.findMany({ include: includeEmployee });

    const allRequests: TrackedRequest[] = [
      ...confirmations.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'Confirmation',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...lwops.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'LWOP',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...promotions.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'Promotion',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...complaints.map(r => ({
        id: r.id, employeeName: r.complainant.name, zanId: r.complainant.zanId, requestType: 'Complaints',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.complainant.institution?.name, gender: r.complainant.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...cadreChanges.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'Change of Cadre',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...retirements.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'Retirement',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...resignations.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'Resignation',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...serviceExtensions.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: 'Service Extension',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
      ...separations.map(r => ({
        id: r.id, employeeName: r.employee.name, zanId: r.employee.zanId, requestType: r.type === 'TERMINATION' ? 'Termination' : 'Dismissal',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee.institution?.name, gender: r.employee.gender as 'Male' | 'Female' | 'N/A',
      })),
    ];

    let filteredRequests = allRequests;

    if (zanId) {
      filteredRequests = filteredRequests.filter(req => req.zanId === zanId);
    }
    if (institutionName) {
      filteredRequests = filteredRequests.filter(req => req.employeeInstitution === institutionName);
    }
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }
    if (fromDateStr && toDateStr) {
      const fromDate = startOfDay(parseISO(fromDateStr));
      const toDate = endOfDay(parseISO(toDateStr));
      if(isValid(fromDate) && isValid(toDate) && fromDate <= toDate) {
        filteredRequests = filteredRequests.filter(req => {
            const submissionDate = parseISO(req.submissionDate);
            return isValid(submissionDate) && submissionDate >= fromDate && submissionDate <= toDate;
        });
      }
    }

    const sortedRequests = filteredRequests.sort((a, b) => new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime());
    
    return NextResponse.json(sortedRequests);
  } catch (error) {
    console.error("[REQUESTS_TRACK_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
