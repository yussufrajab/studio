
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
  rejectionReason?: string | null;
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

                gender: true,
                institution: { select: { name: true } }
            }
        }
    };

    let confirmations = [];
    try { confirmations = await db.confirmationRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching confirmations:", e); }
    let lwops = [];
    try { lwops = await db.lwopRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching LWOPs:", e); }
    let promotions = [];
    try { promotions = await db.promotionRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching promotions:", e); }
    let complaints = [];
    try { complaints = await db.complaint.findMany({ include: includeComplainant }); } catch (e) { console.error("Error fetching complaints:", e); }
    let cadreChanges = [];
    try { cadreChanges = await db.cadreChangeRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching cadre changes:", e); }
    let retirements = [];
    try { retirements = await db.retirementRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching retirements:", e); }
    let resignations = [];
    try { resignations = await db.resignationRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching resignations:", e); }
    let serviceExtensions = [];
    try { serviceExtensions = await db.serviceExtensionRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching service extensions:", e); }
    let separations = [];
    try { separations = await db.separationRequest.findMany({ include: includeEmployee }); } catch (e) { console.error("Error fetching separations:", e); }

    const allRequests: TrackedRequest[] = [
      ...confirmations.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'Confirmation',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
        rejectionReason: r.rejectionReason,
      })),
      ...lwops.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'LWOP',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
        rejectionReason: r.rejectionReason,
      })),
      ...promotions.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'Promotion',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
      })),
      ...complaints.map(r => ({
        id: r.id, employeeName: r.complainant?.name || 'N/A', zanId: r.complainant?.zanId || 'N/A', requestType: 'Complaints',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.complainant?.institution?.name || 'N/A', gender: (r.complainant?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
      })),
      ...cadreChanges.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'Change of Cadre',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
      })),
      ...retirements.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'Retirement',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
      })),
      ...resignations.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'Resignation',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
      })),
      ...serviceExtensions.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: 'Service Extension',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
      })),
      ...separations.map(r => ({
        id: r.id, employeeName: r.employee?.name || 'N/A', zanId: r.employee?.zanId || 'N/A', requestType: r.type === 'TERMINATION' ? 'Termination' : 'Dismissal',
        submissionDate: r.createdAt.toISOString(), status: r.status, lastUpdatedDate: r.updatedAt.toISOString(),
        currentStage: r.reviewStage, employeeInstitution: r.employee?.institution?.name || 'N/A', gender: (r.employee?.gender as 'Male' | 'Female' | 'N/A') || 'N/A',
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
    return new NextResponse(`Internal Server Error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
}
