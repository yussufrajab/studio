import type { User, Employee, Role } from './types';

export const ROLES: Record<string, Role> = {
  HRO: "HRO",
  HHRMD_HRMO: "HHRMD_HRMO",
  DO: "DO",
  EMPLOYEE: "EMPLOYEE",
};

export const USERS: User[] = [
  { id: "user2", username: "msmith", name: "M. Smith", role: ROLES.HHRMD_HRMO as Role },
  { id: "user3", username: "ajuma", name: "A. Juma", role: ROLES.HRO as Role },
  { id: "user5", username: "kabdul", name: "K. Abdul", role: ROLES.DO as Role },
  { id: "user7", username: "hmohamed", name: "Hamid Mohamed", role: ROLES.EMPLOYEE as Role, employeeId: "emp7" },
  { id: "emp1_user", username: "alijuma", name: "Ali Juma Ali", role: ROLES.EMPLOYEE as Role, employeeId: "emp1" },
  { id: "emp2_user", username: "safiajuma", name: "Safia Juma Ali", role: ROLES.EMPLOYEE as Role, employeeId: "emp2" },
  { id: "emp3_user", username: "fatmasaid", name: "Fatma Said Omar", role: ROLES.EMPLOYEE as Role, employeeId: "emp3" },
];

export const EMPLOYEES: Employee[] = [
  { id: "emp1", employeeEntityId: "emp1_id", name: "Ali Juma Ali", zanId: "221458232", status: "On Probation", cadre: "Administrative Officer", department: "Administration" },
  { id: "emp2", employeeEntityId: "emp2_id", name: "Safia Juma Ali", zanId: "125468957", status: "Confirmed", cadre: "HR Officer", department: "Human Resources" },
  { id: "emp3", employeeEntityId: "emp3_id", name: "Fatma Said Omar", zanId: "334589123", status: "Confirmed", cadre: "Accountant", department: "Finance" },
  { id: "emp4", employeeEntityId: "emp4_id", name: "Hassan Mzee Juma", zanId: "445678912", status: "Confirmed", cadre: "IT Support", department: "ICT" },
  { id: "emp5", employeeEntityId: "emp5_id", name: "Zainab Ali Khamis", zanId: "556789345", status: "Confirmed", cadre: "Planning Officer", department: "Planning" },
  { id: "emp6", employeeEntityId: "emp6_id", name: "Juma Omar Ali", zanId: "667890456", status: "Confirmed", cadre: "Procurement Officer", department: "Procurement" },
  { id: "emp7", employeeEntityId: "emp7_id", name: "Hamid Khalfan Abdalla", zanId: "778901234", status: "Confirmed", cadre: "Senior Driver", department: "Transport" },
];

export const APP_NAME = "Civil Service Navigator";
