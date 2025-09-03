import request from 'supertest';
import app from '../../src/app.js';
import { CreateAppointmentRequest } from '../../src/types.js';

describe('GET /clinicians/:id/appointments - Integration Tests', () => {

  // Helper function to create test appointments
  const createTestAppointment = async (appointmentData: CreateAppointmentRequest) => {
    return request(app)
      .post('/appointments')
      .set('x-role', 'patient')
      .send(appointmentData);
  };

  describe('List appointments successfully (200)', () => {
    it('should return appointments for existing clinician with clinician role', async () => {
      // First, create some appointments for this clinician
      const futureStart1 = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours from now
      const futureEnd1 = new Date(Date.now() + 13 * 60 * 60 * 1000).toISOString(); // 13 hours from now
      const futureStart2 = new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(); // 14 hours from now
      const futureEnd2 = new Date(Date.now() + 15 * 60 * 60 * 1000).toISOString(); // 15 hours from now

      await createTestAppointment({
        clinicianId: 'clinician-get-test-1',
        patientId: 'patient-1',
        start: futureStart1,
        end: futureEnd1
      });

      await createTestAppointment({
        clinicianId: 'clinician-get-test-1', // Same clinician
        patientId: 'patient-2',
        start: futureStart2,
        end: futureEnd2
      });

      // Now get appointments for this clinician
      const response = await request(app)
        .get('/clinicians/clinician-get-test-1/appointments')
        .set('x-role', 'clinician')  // Valid role
        .expect(200);

      // Verify response structure and data
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Verify appointment structure
      const appointment = response.body[0];
      expect(appointment.id).toBeDefined();
      expect(appointment.clinicianId).toBe('clinician-get-test-1');
      expect(appointment.patientId).toBeDefined();
      expect(appointment.startTime).toBeDefined();
      expect(appointment.endTime).toBeDefined();
      expect(appointment.createdAt).toBeDefined();
    });

    it('should return appointments for existing clinician with admin role', async () => {
      const response = await request(app)
        .get('/clinicians/clinician-get-test-1/appointments')
        .set('x-role', 'admin')  // Admin should also have access
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Empty array for non-existent clinician (200)', () => {
    it('should return empty array for clinician with no appointments', async () => {
      const response = await request(app)
        .get('/clinicians/non-existent-clinician/appointments')
        .set('x-role', 'clinician')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Date range filtering works', () => {
    it('should filter appointments by date range', async () => {
      // Create appointments at specific times
      const specificStart = '2025-12-01T10:00:00Z';
      const specificEnd = '2025-12-01T11:00:00Z';
      const laterStart = '2025-12-02T10:00:00Z';
      const laterEnd = '2025-12-02T11:00:00Z';

      await createTestAppointment({
        clinicianId: 'clinician-filter-test',
        patientId: 'patient-filter-1',
        start: specificStart,
        end: specificEnd
      });

      await createTestAppointment({
        clinicianId: 'clinician-filter-test',
        patientId: 'patient-filter-2', 
        start: laterStart,
        end: laterEnd
      });

      // Get appointments with date range filter
      const response = await request(app)
        .get('/clinicians/clinician-filter-test/appointments')
        .query({
          from: '2025-12-01T00:00:00Z',  // Include Dec 1st
          to: '2025-12-01T23:59:59Z'     // Exclude Dec 2nd
        })
        .set('x-role', 'clinician')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Should only contain the Dec 1st appointment
      const filteredAppointments = response.body.filter((apt: any) => 
        apt.clinicianId === 'clinician-filter-test'
      );
      
      expect(filteredAppointments.length).toBe(1);
      expect(filteredAppointments[0].startTime).toBe(specificStart);
    });
  });

  describe('Wrong role access (403)', () => {
    it('should return 403 for patient role trying to access clinician appointments', async () => {
      const response = await request(app)
        .get('/clinicians/some-clinician/appointments')
        .set('x-role', 'patient')  // Patient role not allowed for this endpoint
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Clinician or Admin role required');
    });

    it('should return 403 when no role header is provided', async () => {
      const response = await request(app)
        .get('/clinicians/some-clinician/appointments')
        // No x-role header
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Clinician or Admin role required');
    });

    it('should return 403 for invalid role', async () => {
      const response = await request(app)
        .get('/clinicians/some-clinician/appointments')
        .set('x-role', 'invalid-role')  // Invalid role
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Clinician or Admin role required');
    });
  });
});