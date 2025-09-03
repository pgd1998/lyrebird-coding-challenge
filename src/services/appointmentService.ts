import { getDatabase } from "../database.js";
import { CreateAppointmentRequest,  AppointmentQueryParams, Appointment} from "../types.js";

const db = getDatabase();

// D: How is the database here comply ACID principle?

// D: understand the TS structure here
export const createAppointment = (data: CreateAppointmentRequest): Appointment => { 
    const { clinicianId, patientId, start, end } = data;
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Check if dates are valid and in correct ISO format
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)');
    }

    // Validate that the input strings are in proper UTC format (end with Z)
    if (!start.endsWith('Z') || !end.endsWith('Z')) {
        throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)');
    }

    // Check if appointment is in the past (using UTC)
    const now = new Date();
    if (startDate <= now) {
        throw new Error('Cannot book appointments in the past');
    }

    // Validate start < end
    if (startDate >= endDate) { 
        throw new Error('Start time must be before end time');
    }

  // Check for overlapping appointments using transaction for concurrency safety
  const result = db.transaction(() => {
    // Check for overlaps
    const overlapping = db.prepare(`
      SELECT id FROM appointments 
      WHERE clinician_id = ? 
      AND start_time < ? 
      AND end_time > ?
    `).get(clinicianId, end, start);
    
    
    if (overlapping) {
      throw new Error('APPOINTMENT_CONFLICT');
    }

    // Auto-create clinician if doesn't exist
    db.prepare(`
      INSERT OR IGNORE INTO clinicians (id, name) 
      VALUES (?, ?)
    `).run(clinicianId, `Dr. ${clinicianId}`);
    
    // Auto-create patient if doesn't exist
    db.prepare(`
      INSERT OR IGNORE INTO patients (id, name) 
      VALUES (?, ?)
    `).run(patientId, `Patient ${patientId}`);
    
    // Create appointment
    const insertResult = db.prepare(`
      INSERT INTO appointments (clinician_id, patient_id, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `).run(clinicianId, patientId, start, end);

    return db.prepare(`
      SELECT 
        id,
        clinician_id as clinicianId,
        patient_id as patientId,
        start_time as startTime,
        end_time as endTime,
        created_at as createdAt
      FROM appointments 
      WHERE id = ?
    `).get(insertResult.lastInsertRowid) as Appointment;
        })();

        return result;
}

//  D: why this AppointmentQueryParams = {} specifically ={} ?
export const getClinicianAppointments = (clinicianId: string, params: AppointmentQueryParams = {}): Appointment[] => {
    let query = `
    SELECT 
      id,
      clinician_id as clinicianId,
      patient_id as patientId,
      start_time as startTime,
      end_time as endTime,
      created_at as createdAt
    FROM appointments 
    WHERE clinician_id = ?
  `;

  const queryParams = [clinicianId];

  // Add date range filtering if provided (appointments that intersect with the range)
  if (params.from) {
    query += ` AND end_time >= ?`;  
    queryParams.push(params.from);
  }
  
  if (params.to) {
    query += ` AND start_time <= ?`;  
    queryParams.push(params.to);
  }

  // Default to upcoming appointments only
  if (!params.from) {
    query += ` AND start_time >= datetime('now', 'utc')`;
  }

  query += ` ORDER BY start_time ASC`;

  return db.prepare(query).all(...queryParams) as Appointment[];
}

export const getAllAppointments = (params: AppointmentQueryParams = {}): Appointment[] => {
  let query = `
    SELECT 
      id,
      clinician_id as clinicianId,
      patient_id as patientId,
      start_time as startTime,
      end_time as endTime,
      created_at as createdAt
    FROM appointments 
    WHERE 1=1
  `;
  
  const queryParams: string[] = [];
  
  // Add date range filtering if provided (appointments that intersect with the range)
  if (params.from) {
    query += ` AND end_time >= ?`;  
    queryParams.push(params.from);
  }
  
  if (params.to) {
    query += ` AND start_time <= ?`;  
    queryParams.push(params.to);
  }
  
  // Default to upcoming appointments only
  if (!params.from) {
    query += ` AND start_time >= datetime('now', 'utc')`;
  }
  
  query += ` ORDER BY start_time ASC`;
  
  return db.prepare(query).all(...queryParams) as Appointment[];
};