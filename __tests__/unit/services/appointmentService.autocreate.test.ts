import { createAppointment } from '../../../src/services/appointmentService.js';
import { CreateAppointmentRequest } from '../../../src/types.js';

describe('appointmentService - Auto-creation Logic', () => {

  describe('Should create clinician record if doesnt exist', () => {
    it('should auto-create clinician with default name format', () => {
      let clinicianInsertCalled = false;
      let insertedClinicianData: { id: string; name: string } | null = null;

      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            run: (id?: string, name?: string) => {
              if (query.includes('INSERT OR IGNORE INTO clinicians')) {
                clinicianInsertCalled = true;
                insertedClinicianData = { id: id!, name: name! };
              }
              return { lastInsertRowid: 1, changes: 1 };
            },
            get: (id?: any) => {
              if (query.includes('SELECT id FROM appointments')) {
                return null; // No overlapping appointments
              }
              if (id === 1) {
                return {
                  id: 1,
                  clinicianId: 'new-clinician-id',
                  patientId: 'existing-patient',
                  startTime: '2025-12-01T10:00:00Z',
                  endTime: '2025-12-01T11:00:00Z',
                  createdAt: '2025-11-30T09:00:00Z'
                };
              }
              return null;
            },
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const request: CreateAppointmentRequest = {
        clinicianId: 'new-clinician-id',
        patientId: 'existing-patient',
        start: '2025-12-01T10:00:00Z',
        end: '2025-12-01T11:00:00Z'
      };

      const result = createAppointmentWithMock(request);

      // Verify clinician auto-creation was called
      expect(clinicianInsertCalled).toBe(true);
      expect(insertedClinicianData).toEqual({
        id: 'new-clinician-id',
        name: 'Dr. new-clinician-id'  // Default name format from service
      });
      
      // Verify appointment was created successfully
      expect(result).toBeDefined();
      expect(result.clinicianId).toBe('new-clinician-id');
    });
  });

  describe('Should create patient record if doesnt exist', () => {
    it('should auto-create patient with default name format', () => {
      let patientInsertCalled = false;
      let insertedPatientData: { id: string; name: string } | null = null;

      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            run: (id?: string, name?: string) => {
              if (query.includes('INSERT OR IGNORE INTO patients')) {
                patientInsertCalled = true;
                insertedPatientData = { id: id!, name: name! };
              }
              return { lastInsertRowid: 2, changes: 1 };
            },
            get: (id?: any) => {
              if (query.includes('SELECT id FROM appointments')) {
                return null; // No overlapping appointments
              }
              if (id === 2) {
                return {
                  id: 2,
                  clinicianId: 'existing-clinician',
                  patientId: 'new-patient-id',
                  startTime: '2025-12-01T14:00:00Z',
                  endTime: '2025-12-01T15:00:00Z',
                  createdAt: '2025-11-30T09:00:00Z'
                };
              }
              return null;
            },
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock2 } = require('../../../src/services/appointmentService.js');

      const requestData: CreateAppointmentRequest = {
        clinicianId: 'existing-clinician',
        patientId: 'new-patient-id',
        start: '2025-12-01T14:00:00Z',
        end: '2025-12-01T15:00:00Z'
      };

      const appointmentResult = createAppointmentWithMock2(requestData);

      // Verify patient auto-creation was called
      expect(patientInsertCalled).toBe(true);
      expect(insertedPatientData).toEqual({
        id: 'new-patient-id',
        name: 'Patient new-patient-id'  // Default name format from service
      });
      
      // Verify appointment was created successfully  
      expect(appointmentResult).toBeDefined();
      expect(appointmentResult.patientId).toBe('new-patient-id');
    });
  });

  describe('Should not duplicate existing records', () => {
    it('should use INSERT OR IGNORE to handle existing records gracefully', () => {
      let insertCallCount = 0;

      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            run: () => {
              if (query.includes('INSERT OR IGNORE')) {
                insertCallCount++;
                return { changes: 0 }; // Simulate no insertion (already exists)
              }
              return { lastInsertRowid: 3, changes: 1 };
            },
            get: (id?: any) => {
              if (query.includes('SELECT id FROM appointments')) {
                return null; // No overlapping appointments
              }
              if (id === 3) {
                return {
                  id: 3,
                  clinicianId: 'existing-clinician',
                  patientId: 'existing-patient',
                  startTime: '2025-12-01T16:00:00Z',
                  endTime: '2025-12-01T17:00:00Z',
                  createdAt: '2025-11-30T09:00:00Z'
                };
              }
              return null;
            },
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock3 } = require('../../../src/services/appointmentService.js');

      const existingRecordsRequest: CreateAppointmentRequest = {
        clinicianId: 'existing-clinician',
        patientId: 'existing-patient',
        start: '2025-12-01T16:00:00Z',
        end: '2025-12-01T17:00:00Z'
      };

      const finalResult = createAppointmentWithMock3(existingRecordsRequest);

      // Verify INSERT OR IGNORE was called for both clinician and patient
      expect(insertCallCount).toBe(2); // Once for clinician, once for patient
      
      // Verify appointment creation still succeeds even with existing records
      expect(finalResult).toBeDefined();
      expect(finalResult.clinicianId).toBe('existing-clinician');
      expect(finalResult.patientId).toBe('existing-patient');
    });
  });
});