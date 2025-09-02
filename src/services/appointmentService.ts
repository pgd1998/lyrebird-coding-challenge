import { getDatabase } from "../database.js";
import { CreateAppointmentRequest,  AppointmentQueryParams, Appointment} from "../types.js";

const db = getDatabase();

// D: How is the database here comply ACID principle?

// D: understand the TS structure here
export const createAppointment = (data: CreateAppointmentRequest): Appointment => { 
    const { clinicianId, patientId, start, end } = data;

    // Validate start < end
  if (new Date(start) >= new Date(end)) {
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
    
    // D: why are we throwing error here. should we return 409 here?
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
    query += ` AND end_time >= ?`;  // appointment ends after range starts
    queryParams.push(params.from);
  }
  
  if (params.to) {
    query += ` AND start_time <= ?`;  // appointment starts before range ends
    queryParams.push(params.to);
  }

  // Default to upcoming appointments only
  if (!params.from) {
    query += ` AND start_time >= datetime('now')`;
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
    query += ` AND end_time >= ?`;  // appointment ends after range starts
    queryParams.push(params.from);
  }
  
  if (params.to) {
    query += ` AND start_time <= ?`;  // appointment starts before range ends
    queryParams.push(params.to);
  }
  
  // Default to upcoming appointments only
  if (!params.from) {
    query += ` AND start_time >= datetime('now')`;
  }
  
  query += ` ORDER BY start_time ASC`;
  
  return db.prepare(query).all(...queryParams) as Appointment[];
};