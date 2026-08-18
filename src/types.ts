export type ID = string;

export interface Lawyer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: number;
}

export interface ImportantDate {
  id: ID;
  label: string;
  date: string; // YYYY-MM-DD
}

export interface Client {
  id: ID;
  lawyerId: ID;
  name: string;
  phone: string;
  email: string;
  nationalId?: string;
  address?: string;
  notes?: string;
  importantDates: ImportantDate[];
  createdAt: number;
}

export type CaseStatus = "open" | "postponed" | "closed";

export interface Case {
  id: ID;
  lawyerId: ID;
  caseNumber: string;
  clientId: ID;
  court: string;
  caseType: string;
  filedDate: string;
  nextHearingDate?: string;
  nextHearingTime?: string;
  status: CaseStatus;
  description?: string;
  notes?: string;
  createdAt: number;
}

export interface Hearing {
  id: ID;
  lawyerId: ID;
  caseId: ID;
  date: string;
  time: string;
  type: string;
  notes?: string;
  createdAt: number;
}

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: ID;
  lawyerId: ID;
  title: string;
  description?: string;
  date: string;
  time?: string;
  priority: Priority;
  caseId?: ID;
  clientId?: ID;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface Template {
  id: ID;
  lawyerId: ID;
  name: string;
  ext: string; // pdf | doc | docx
  size: number; // bytes
  kind: "builtin" | "file";
  content?: string; // html content for builtin docs
  dataUrl?: string; // for uploaded files
  addedAt: number;
}

export interface CaseFile {
  id: ID;
  lawyerId: ID;
  caseId: ID;
  name: string;
  ext: string;
  size: number;
  dataUrl?: string;
  content?: string;
  templateId?: ID;
  addedAt: number;
}

export type TxType = "fees" | "expenses";

export interface Tx {
  id: ID;
  lawyerId: ID;
  clientId: ID;
  caseId?: ID;
  amount: number;
  type: TxType;
  date: string;
  notes?: string;
  createdAt: number;
}

export interface CaseNote {
  id: ID;
  lawyerId: ID;
  caseId: ID;
  text: string;
  createdAt: number;
}

export type ActivityKind =
  | "client"
  | "case"
  | "task"
  | "finance"
  | "template"
  | "hearing"
  | "note"
  | "auth";

export interface Activity {
  id: ID;
  lawyerId: ID;
  kind: ActivityKind;
  text: string;
  caseId?: ID;
  at: number;
}

export type Page =
  | "dashboard"
  | "agenda"
  | "tasks"
  | "templates"
  | "clients"
  | "cases"
  | "accounts";

export type Intent = "add" | null;

export interface Toast {
  id: ID;
  type: "success" | "error" | "info" | "warning";
  msg: string;
}
