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
  startTime: string;
  endTime: string;   
  createdAt: string;
}

// Request types
export interface CreateAppointmentRequest {
  clinicianId: string;
  patientId: string;
  start: string;
  end: string;
}

// Query parameter types
export interface AppointmentQueryParams {
  from?: string;
  to?: string;
}