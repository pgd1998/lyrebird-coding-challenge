import request from 'supertest';
import app from '../../src/app.js';
import { CreateAppointmentRequest } from '../../src/types.js';

describe('GET /appointments - Integration Tests', () => {
  
  // Helper function to create test appointments
  const createTestAppointment = async (appointmentData: CreateAppointmentRequest, role: string = 'patient') => {
    return request(app)
      .post('/appointments')
      .set('x-role', role)
      .send(appointmentData);
  };

  describe('Admin can view all appointments (200)', () => {
    it('should return all appointments for admin role', async () => {
      const uniqueId = Date.now();
      
      // Create appointments for different clinicians
      const futureStart1 = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(); // 30 hours from now
      const futureEnd1 = new Date(Date.now() + 31 * 60 * 60 * 1000).toISOString(); // 31 hours from now
      const futureStart2 = new Date(Date.now() + 32 * 60 * 60 * 1000).toISOString(); // 32 hours from now
      const futureEnd2 = new Date(Date.now() + 33 * 60 * 60 * 1000).toISOString(); // 33 hours from now

      // Create appointment for clinician 1
      await createTestAppointment({
        clinicianId: `admin-test-clinician-1-${uniqueId}`,
        patientId: `admin-test-patient-1-${uniqueId}`,
        start: futureStart1,
        end: futureEnd1
      });

      // Create appointment for clinician 2
      await createTestAppointment({
        clinicianId: `admin-test-clinician-2-${uniqueId}`,
        patientId: `admin-test-patient-2-${uniqueId}`,
        start: futureStart2,
        end: futureEnd2
      });

      // Admin should see ALL appointments
      const response = await request(app)
        .get('/appointments')
        .set('x-role', 'admin')  // Admin role required
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Verify we can find our test appointments in the response
      const testAppointments = response.body.filter((apt: any) => 
        apt.clinicianId.includes(`admin-test-clinician-`) && 
        apt.clinicianId.includes(`${uniqueId}`)
      );
      expect(testAppointments.length).toBe(2);

      // Verify appointment structure
      const appointment = testAppointments[0];
      expect(appointment.id).toBeDefined();
      expect(appointment.clinicianId).toBeDefined();
      expect(appointment.patientId).toBeDefined();
      expect(appointment.startTime).toBeDefined();
      expect(appointment.endTime).toBeDefined();
      expect(appointment.createdAt).toBeDefined();
    });
  });

  describe('Non-admin rejected (403)', () => {
    it('should return 403 for patient role', async () => {
      const response = await request(app)
        .get('/appointments')
        .set('x-role', 'patient')  // Patient role not allowed
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Admin role required');
    });

    it('should return 403 for clinician role', async () => {
      const response = await request(app)
        .get('/appointments')
        .set('x-role', 'clinician')  // Clinician role not allowed
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Admin role required');
    });

    it('should return 403 when no role header provided', async () => {
      const response = await request(app)
        .get('/appointments')
        // No x-role header
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Admin role required');
    });

    it('should return 403 for invalid role', async () => {
      const response = await request(app)
        .get('/appointments')
        .set('x-role', 'invalid-role')  // Invalid role
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Admin role required');
    });
  });

  describe('Date range filtering across all clinicians', () => {
    it('should filter all appointments by date range', async () => {
      const uniqueId = Date.now() + 1000; // Ensure unique from previous test
      
      // Create appointments on specific dates
      const dec1Start = '2025-12-01T09:00:00Z';
      const dec1End = '2025-12-01T10:00:00Z';
      const dec2Start = '2025-12-02T09:00:00Z';
      const dec2End = '2025-12-02T10:00:00Z';

      await createTestAppointment({
        clinicianId: `filter-test-clinician-1-${uniqueId}`,
        patientId: `filter-test-patient-1-${uniqueId}`,
        start: dec1Start,
        end: dec1End
      });

      await createTestAppointment({
        clinicianId: `filter-test-clinician-2-${uniqueId}`,
        patientId: `filter-test-patient-2-${uniqueId}`, 
        start: dec2Start,
        end: dec2End
      });

      // Filter to only Dec 1st appointments
      const response = await request(app)
        .get('/appointments')
        .query({
          from: '2025-12-01T00:00:00Z',
          to: '2025-12-01T23:59:59Z'
        })
        .set('x-role', 'admin')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Should only contain Dec 1st appointments
      const filteredAppointments = response.body.filter((apt: any) =>
        apt.clinicianId.includes(`filter-test-clinician-`) && 
        apt.clinicianId.includes(`${uniqueId}`)
      );
      
      expect(filteredAppointments.length).toBe(1);
      expect(filteredAppointments[0].startTime).toBe(dec1Start);
    });
  });

  describe('Empty results for future date ranges', () => {
    it('should return empty array for far future date range with no appointments', async () => {
      const response = await request(app)
        .get('/appointments')
        .query({
          from: '2026-01-01T00:00:00Z',  // Far future
          to: '2026-01-02T00:00:00Z'     // No appointments should exist here
        })
        .set('x-role', 'admin')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Should return empty array for future dates with no appointments
      const futureAppointments = response.body.filter((apt: any) =>
        apt.startTime >= '2026-01-01T00:00:00Z' && apt.startTime <= '2026-01-02T00:00:00Z'
      );
      
      expect(futureAppointments.length).toBe(0);
    });

    it('should return valid appointment structure when no query parameters provided', async () => {
      const response = await request(app)
        .get('/appointments')
        .set('x-role', 'admin')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify appointment structure (if any appointments exist)
      if (response.body.length > 0) {
        const appointment = response.body[0];
        expect(appointment.id).toBeDefined();
        expect(appointment.clinicianId).toBeDefined();
        expect(appointment.patientId).toBeDefined();
        expect(appointment.startTime).toBeDefined();
        expect(appointment.endTime).toBeDefined();
        expect(appointment.createdAt).toBeDefined();
      }
    });
  });
});