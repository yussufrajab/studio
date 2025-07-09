import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/constants';

const getRequestHref = (type: string) => {
    switch (type) {
        case 'Confirmation': return '/dashboard/confirmation';
        case 'Promotion': return '/dashboard/promotion';
        case 'LWOP': return '/dashboard/lwop';
        case 'Complaint': return '/dashboard/complaints';
        case 'Retirement': return '/dashboard/retirement';
        case 'Resignation': return '/dashboard/resignation';
        case 'Service Extension': return '/dashboard/service-extension';
        case 'Termination':
        case 'Dismissal':
            return '/dashboard/termination';
        case 'Change of Cadre': return '/dashboard/cadre-change';
        default: return '/dashboard';
    }
}

export async function GET(req: Request) {
  try {
    const totalEmployees = await db.employee.count();
    const pendingConfirmations = await db.confirmationRequest.count({ where: { status: { contains: 'Pending' } } });
    const pendingPromotions = await db.promotionRequest.count({ where: { status: { contains: 'Pending' } } });
    const employeesOnLwop = await db.employee.count({ where: { status: 'On LWOP' }});
    const pendingTerminations = await db.separationRequest.count({ where: { status: { contains: 'Pending' } } });
    const openComplaints = await db.complaint.count({ where: { status: { notIn: ["Closed - Satisfied", "Resolved - Approved by Commission", "Resolved - Rejected by Commission"] } } });

    // Fetch recent activities
    const confirmations = await db.confirmationRequest.findMany({ include: { employee: { select: { name: true } } }, orderBy: { updatedAt: 'desc' }, take: 5 });
    const promotions = await db.promotionRequest.findMany({ include: { employee: { select: { name: true } } }, orderBy: { updatedAt: 'desc' }, take: 5 });
    const lwops = await db.lwopRequest.findMany({ include: { employee: { select: { name: true } } }, orderBy: { updatedAt: 'desc' }, take: 5 });
    const complaints = await db.complaint.findMany({ include: { complainant: { select: { name: true } } }, orderBy: { updatedAt: 'desc' }, take: 5 });
    const separations = await db.separationRequest.findMany({ include: { employee: { select: { name: true } } }, orderBy: { updatedAt: 'desc' }, take: 5 });
    
    const allActivities = [
      ...confirmations.map(r => ({ id: r.id, type: 'Confirmation', employee: r.employee.name, status: r.status, updatedAt: r.updatedAt })),
      ...promotions.map(r => ({ id: r.id, type: 'Promotion', employee: r.employee.name, status: r.status, updatedAt: r.updatedAt })),
      ...lwops.map(r => ({ id: r.id, type: 'LWOP', employee: r.employee.name, status: r.status, updatedAt: r.updatedAt })),
      ...complaints.map(r => ({ id: r.id, type: 'Complaint', employee: r.complainant.name, status: r.status, updatedAt: r.updatedAt })),
      ...separations.map(r => ({ id: r.id, type: r.type === 'TERMINATION' ? 'Termination' : 'Dismissal', employee: r.employee.name, status: r.status, updatedAt: r.updatedAt })),
    ];
    
    const recentActivities = allActivities
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(activity => ({
          ...activity,
          href: getRequestHref(activity.type)
      }));

    const stats = {
      totalEmployees,
      pendingConfirmations,
      pendingPromotions,
      employeesOnLwop,
      pendingTerminations,
      openComplaints,
    };

    return NextResponse.json({ stats, recentActivities });

  } catch (error) {
    console.error("[DASHBOARD_SUMMARY_GET]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
