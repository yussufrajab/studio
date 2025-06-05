export type Role = "HRO" | "HHRMD_HRMO" | "DO" | "EMPLOYEE" | null;

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  employeeId?: string; // Link to Employee if user is an employee
}

export interface Employee {
  id: string; // e.g., emp1
  employeeEntityId: string; // e.g., emp1_id
  name: string;
  zanId: string;
  status?: string; // e.g., "Confirmed", "On Probation"
  cadre?: string;
  department?: string; // Added department
  // Add other employee specific fields as needed
}

export type RequestType =
  | "Employee Confirmation"
  | "Leave Without Pay (LWOP)"
  | "Promotion"
  | "Complaints"
  | "Change of Cadre"
  | "Retirement"
  | "Resignation (Employee)"
  | "Service Extension"
  | "Termination"
  | "Dismissal";

export interface Request {
  id: string;
  type: RequestType;
  employeeId: string; // Employee this request is about
  submittedBy: string; // User ID of submitter
  submittedDate: string; // ISO Date string
  status: "Pending" | "Approved" | "Rejected" | "Resolved";
  details: Record<string, any>; // Request specific details
  documents?: File[]; // Attached documents
  reviewHistory?: Array<{
    reviewerId: string;
    decision: "Approved" | "Rejected" | "Resolved";
    reason?: string;
    date: string;
  }>;
}

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
  roles: Role[]; // Roles that can see this nav item
  children?: NavItem[]; // For sub-menus
}

export interface ComplaintFormValues {
  complaintText: string;
  category?: string;
  evidence?: File[];
}

export interface RequestFormValues {
  employeeId: string;
  details: string;
  documents?: File[];
}
