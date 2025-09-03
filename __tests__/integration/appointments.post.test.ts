import request from 'supertest';
import app from '../../src/app.js';
import { CreateAppointmentRequest } from '../../src/types.js';

describe('POST /appointments - Integration Tests', () => {
  
  describe('Successful appointment creation (201)', () => {
    it('should create appointment successfully with valid data and patient role', async () => {
      const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      
      const appointmentData: CreateAppointmentRequest = {
        clinicianId: 'clinician-integration-1',
        patientId: 'patient-integration-1', 
        start: futureStart,
        end: futureEnd
      };

      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'patient')  // Valid role header
        .send(appointmentData)
        .expect(201);

      // Verify response structure
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.clinicianId).toBe('clinician-integration-1');
      expect(response.body.patientId).toBe('patient-integration-1');
      expect(response.body.startTime).toBe(futureStart);
      expect(response.body.endTime).toBe(futureEnd);
      expect(response.body.createdAt).toBeDefined();
    });

    it('should create appointment successfully with admin role', async () => {
      const futureStart = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // 3 hours from now
      const futureEnd = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours from now
      
      const appointmentData: CreateAppointmentRequest = {
        clinicianId: 'clinician-integration-2',
        patientId: 'patient-integration-2',
        start: futureStart,
        end: futureEnd
      };

      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'admin')  // Valid admin role
        .send(appointmentData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.clinicianId).toBe('clinician-integration-2');
    });
  });

  describe('Missing role header (403)', () => {
    it('should return 403 when role header is missing', async () => {
      const futureStart = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      
      const appointmentData: CreateAppointmentRequest = {
        clinicianId: 'clinician-test',
        patientId: 'patient-test',
        start: futureStart,
        end: futureEnd
      };

      const response = await request(app)
        .post('/appointments')
        // No x-role header set
        .send(appointmentData)
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Patient or Admin role required');
    });
  });

  describe('Wrong role (403)', () => {
    it('should return 403 for invalid role', async () => {
      const futureStart = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      
      const appointmentData: CreateAppointmentRequest = {
        clinicianId: 'clinician-test',
        patientId: 'patient-test', 
        start: futureStart,
        end: futureEnd
      };

      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'clinician')  // Invalid role for this endpoint
        .send(appointmentData)
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Patient or Admin role required');
    });
  });

  describe('Missing required fields (400)', () => {
    it('should return 400 when clinicianId is missing', async () => {
      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'patient')
        .send({
          // clinicianId missing
          patientId: 'patient-test',
          start: '2025-12-01T10:00:00Z',
          end: '2025-12-01T11:00:00Z'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 when patientId is missing', async () => {
      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'patient')
        .send({
          clinicianId: 'clinician-test',
          // patientId missing
          start: '2025-12-01T12:00:00Z',
          end: '2025-12-01T13:00:00Z'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 when start time is missing', async () => {
      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'patient')
        .send({
          clinicianId: 'clinician-test',
          patientId: 'patient-test',
          // start missing
          end: '2025-12-01T15:00:00Z'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 when end time is missing', async () => {
      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'patient')
        .send({
          clinicianId: 'clinician-test',
          patientId: 'patient-test',
          start: '2025-12-01T14:00:00Z'
          // end missing
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('Overlapping appointment (409)', () => {
    it('should return 409 when appointment conflicts with existing booking', async () => {
      const conflictStart = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(); // 10 hours from now
      const conflictEnd = new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(); // 11 hours from now
      
      // First, create an appointment
      await request(app)
        .post('/appointments')
        .set('x-role', 'patient')
        .send({
          clinicianId: 'clinician-conflict-test',
          patientId: 'patient-1',
          start: conflictStart,
          end: conflictEnd
        })
        .expect(201);

      // Now try to create overlapping appointment for same clinician
      const response = await request(app)
        .post('/appointments')
        .set('x-role', 'patient')
        .send({
          clinicianId: 'clinician-conflict-test',  // Same clinician
          patientId: 'patient-2',
          start: conflictStart,  // Exact same time
          end: conflictEnd       // Exact same time
        })
        .expect(409);

      expect(response.body.error).toBe('Appointment time conflicts with existing booking');
    });
  });
});