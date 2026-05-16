// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}

// ==========================================
// Locker
// ==========================================
export type LockerStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface LockerDTO {
  id: string;  // UUID
  number: number;
  location: string;
  status: LockerStatus;
  member_id: string | null;
}

export interface CreateLockerRequest {
  number: number;
  location: string;
  status: LockerStatus;
}

export interface UpdateLockerRequest {
  location?: string;
  status?: LockerStatus;
  member_id?: string | null;
}

// ==========================================
// Payment
// ==========================================
export type PaymentStatus = 'Pending' | 'Paid' | 'Canceled' | 'Overdue';

export interface PaymentResponse {
  id: string;
  member_id: string;
  amount: number;
  month: number;
  year: number;
  status: PaymentStatus;
  due_date: string;       // YYYY-MM-DD
  payment_date: string | null;
}

export interface CreatePaymentRequest {
  member_id: string;
  amount: number;
  month: number;
  year: number;
  due_date: string;       // YYYY-MM-DD
}

export interface UpdatePaymentRequest {
  amount?: number;
  due_date?: string;      // YYYY-MM-DD
}

export interface MarkPaymentAsPaidRequest {
  payment_date?: string;  // ISO DateTime, opcional
}

// ==========================================
// MedicalCertificate
// ==========================================
export interface MedicalCertificateResponse {
  id: string;
  member_id: string;
  issue_date: string; // ISO Date YYYY-MM-DD
  expiry_date: string; // ISO Date YYYY-MM-DD
  doctor_license: string;
  is_validated: boolean;
  created_at: string; // ISO DateTime
}

export interface CreateMedicalCertificateRequest {
  member_id: string;
  issue_date: string; // ISO Date YYYY-MM-DD
  expiry_date: string; // ISO Date YYYY-MM-DD
  doctor_license: string;
}
}

