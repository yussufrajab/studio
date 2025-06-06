
export type Role = "HRO" | "HHRMD_HRMO" | "DO" | "EMPLOYEE" | null;

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  employeeId?: string; // Link to Employee if user is an employee
}

export interface EmployeeCertificate {
  type: "Certificate" | "Diploma" | "Bachelor Degree" | "Master Degree" | "PhD" | "Other";
  name: string; // e.g., "Advanced Certificate in HR", "BSc Computer Science"
  url: string; // URL to the document
}

export interface Employee {
  id: string;
  employeeEntityId: string;
  name: string;
  profileImageUrl?: string; // URL for profile image
  dateOfBirth?: string; // e.g., "1985-07-20"
  placeOfBirth?: string;
  region?: string;
  countryOfBirth?: string;
  zanId: string;
  zssfNumber?: string;
  payrollNumber?: string;

  // Employment Summary
  cadre?: string; // Rank
  ministry?: string;
  institution?: string;
  department?: string;
  appointmentType?: string; // e.g., "Permanent", "Contract"
  contractType?: string; // e.g., "Full-time", "Part-time"
  recentTitleDate?: string; // Date of last promotion/title change
  currentReportingOffice?: string;
  currentWorkplace?: string;
  employmentDate?: string; // Initial date of employment
  confirmationDate?: string; // Date of confirmation
  status?: string; // e.g., "Confirmed", "On Probation"

  // Employee Documents (URLs or identifiers)
  ardhilHaliUrl?: string;
  confirmationLetterUrl?: string;
  certificates?: EmployeeCertificate[];
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
