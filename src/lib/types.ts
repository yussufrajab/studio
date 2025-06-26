
export type Role = "HRO" | "HHRMD" | "HRMO" | "DO" | "EMPLOYEE" | "CSCS" | "HRRP" | "PO" | null;

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  employeeId?: string; 
  institutionId?: string; // For HRRP/HRO to identify their institution
}

export interface EmployeeCertificate {
  type: "Certificate" | "Diploma" | "Bachelor Degree" | "Master Degree" | "PhD" | "Other";
  name: string; 
  url: string; 
}

export interface Employee {
  id: string;
  employeeEntityId: string;
  name: string;
  gender: 'Male' | 'Female';
  profileImageUrl?: string; 
  dateOfBirth?: string; 
  placeOfBirth?: string;
  region?: string;
  countryOfBirth?: string;
  zanId: string;
  phoneNumber?: string;
  zssfNumber?: string;
  payrollNumber?: string;
  
  cadre?: string; 
  salaryScale?: string;
  ministry?: string;
  institutionId?: string; // To link employee to an institution
  institution?: string; // Institution the employee belongs to
  department?: string;
  appointmentType?: string; 
  contractType?: string; 
  recentTitleDate?: string; 
  currentReportingOffice?: string;
  currentWorkplace?: string;
  employmentDate?: string; 
  confirmationDate?: string; 
  retirementDate?: string;
  status?: string; 

  
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
  employeeId: string; 
  submittedBy: string; 
  submittedDate: string; 
  status: "Pending" | "Approved" | "Rejected" | "Resolved";
  details: Record<string, any>; 
  documents?: File[]; 
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
  roles: Role[]; 
  children?: NavItem[]; 
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
