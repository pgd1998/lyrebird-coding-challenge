// Core entity types
export interface Clinician {
  id: string;
  name: string;
  specialty?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  clinicianId: string;
  patientId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  createdAt: string;
}

// Request types
export interface CreateAppointmentRequest {
  clinicianId: string;
  patientId: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
}

// Query parameter types
export interface AppointmentQueryParams {
  from?: string; // ISO datetime
  to?: string;   // ISO datetime
}