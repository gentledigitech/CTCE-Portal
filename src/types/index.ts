/**
 * Core type definitions for CTCE Hall Portal
 */

export type UserRole = 'applicant' | 'viewer' | 'admin' | 'super_admin';

export type ApplicantStatus = 'pending' | 'verified' | 'allocated' | 'waitlisted' | 'graduated';

export type AllocationMethod = 'auto' | 'manual';

export interface Hall {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  colour: string; // e.g. blue, cream, green, light-green
  colour_hex: string;
  sort_order: number;
  active: boolean;
}

export interface TraineeUser {
  id: string;
  email: string;
  phone_e164: string;
  full_name: string;
  trainee_id?: string; // Blank for new applicants until assigned; format CTCE/PRG/YY/0XXX
  programme: string;
  level: number; // 100, 200, 300, 400
  role: UserRole;
  status: ApplicantStatus;
  hall_id?: string;
  hall_name?: string;
  hall_colour?: string;
  passport_url?: string; // Base64 data URL (<2MB) or image URL
  created_at: string;
  created_by?: string;
  phone_verified_at?: string;
  hall_sms_sent_at?: string;
  hall_sms_count: number;
  is_deleted?: boolean;
}

export interface Allocation {
  applicant_id: string;
  hall_id: string;
  method: AllocationMethod;
  reason?: string;
  allocated_by?: string;
  allocated_at: string;
}

export type CourseType = 'Core' | 'Elective' | 'Major' | 'Minor' | 'Practicum';

export type AcademicProgram = 'Early Childhood' | 'Primary' | 'Junior High School' | 'All';

export interface Course {
  code: string;
  title: string;
  level: number; // 100, 200, 300, 400
  semester: 1 | 2;
  credits: number | string; // e.g. 3, 2, "2 + 1", 6
  type: CourseType;
  programme: AcademicProgram;
  option?: string; // e.g. 'Mathematics', 'Science', 'ICT', 'Technical Skills', etc.
  description?: string;
}

export interface SystemSettings {
  portal_open: boolean;
  allocation_mode: 'balanced' | 'sequential';
  current_academic_year: string; // e.g. "2026/2027"
  current_semester: 1 | 2;
  academic_years_list: string[]; // 40 consecutive years
  sms_daily_cap: number;
}

export interface AuditLogEntry {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  detail: Record<string, any>;
  ip_hash: string;
  created_at: string;
}

export interface SmsLogEntry {
  id: string;
  applicant_id?: string;
  recipient_phone: string;
  kind: 'otp' | 'hall_allocation' | 'waitlist' | 'bulk' | 'password_reset';
  message_preview: string;
  provider_status: 'delivered' | 'sent' | 'failed';
  created_at: string;
}

export interface AuthSession {
  token: string;
  user: TraineeUser;
  expires_at: number;
}
