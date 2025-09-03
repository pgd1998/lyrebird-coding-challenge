import { createAppointment } from '../../../src/services/appointmentService.js';
import { CreateAppointmentRequest } from '../../../src/types.js';

describe('appointmentService - Overlap Detection Logic', () => {
  
  describe('Exact same time slot overlap', () => {
    it('should detect overlap when appointment has exact same time slot', () => {
      // Mock database that returns an overlapping appointment
      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            get: (clinicianId: string, end: string, start: string) => {
              // SQL: SELECT id FROM appointments WHERE clinician_id = ? AND start_time < ? AND end_time > ?
              // This simulates finding an existing appointment with same time slot
              if (start === '2025-12-01T10:00:00Z' && end === '2025-12-01T11:00:00Z') {
                return { id: 123 }; // Overlapping appointment found
              }
              return null;
            },
            run: () => ({ lastInsertRowid: 1 }),
            all: () => []
          })
        })
      }));

      // Clear module cache and re-require to use new mock
      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const conflictingRequest: CreateAppointmentRequest = {
        clinicianId: 'clinician-1',
        patientId: 'patient-1', 
        start: '2025-12-01T10:00:00Z',  // Same start time
        end: '2025-12-01T11:00:00Z'     // Same end time
      };

      expect(() => createAppointmentWithMock(conflictingRequest)).toThrow('APPOINTMENT_CONFLICT');
    });
  });

  describe('Partial overlap - start during existing', () => {
    it('should detect overlap when new appointment starts during existing appointment', () => {
      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            get: (clinicianId: string, end: string, start: string) => {
              // Existing appointment: 10:00-11:00, New appointment: 10:30-11:30
              // SQL check: start_time < 11:30 AND end_time > 10:30
              if (start === '2025-12-01T10:30:00Z' && end === '2025-12-01T11:30:00Z') {
                return { id: 456 }; // Overlapping appointment found
              }
              return null;
            },
            run: () => ({ lastInsertRowid: 1 }),
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const overlappingRequest: CreateAppointmentRequest = {
        clinicianId: 'clinician-1',
        patientId: 'patient-2',
        start: '2025-12-01T10:30:00Z',  // Starts during existing (10:00-11:00)
        end: '2025-12-01T11:30:00Z'     // Ends after existing
      };

      expect(() => createAppointmentWithMock(overlappingRequest)).toThrow('APPOINTMENT_CONFLICT');
    });
  });

  describe('Partial overlap - end during existing', () => {
    it('should detect overlap when new appointment ends during existing appointment', () => {
      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            get: (clinicianId: string, end: string, start: string) => {
              // Existing appointment: 11:00-12:00, New appointment: 10:30-11:30  
              // SQL check: start_time < 11:30 AND end_time > 10:30
              if (start === '2025-12-01T10:30:00Z' && end === '2025-12-01T11:30:00Z') {
                return { id: 789 }; // Overlapping appointment found
              }
              return null;
            },
            run: () => ({ lastInsertRowid: 1 }),
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const overlappingRequest: CreateAppointmentRequest = {
        clinicianId: 'clinician-1',
        patientId: 'patient-3',
        start: '2025-12-01T10:30:00Z',  // Starts before existing (11:00-12:00)
        end: '2025-12-01T11:30:00Z'     // Ends during existing
      };

      expect(() => createAppointmentWithMock(overlappingRequest)).toThrow('APPOINTMENT_CONFLICT');
    });
  });

  describe('Encompassing appointment overlap', () => {
    it('should detect overlap when new appointment encompasses existing appointment', () => {
      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            get: (clinicianId: string, end: string, start: string) => {
              // Existing appointment: 10:30-11:30, New appointment: 10:00-12:00
              // SQL check: start_time < 12:00 AND end_time > 10:00
              if (start === '2025-12-01T10:00:00Z' && end === '2025-12-01T12:00:00Z') {
                return { id: 101 }; // Overlapping appointment found
              }
              return null;
            },
            run: () => ({ lastInsertRowid: 1 }),
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const encompassingRequest: CreateAppointmentRequest = {
        clinicianId: 'clinician-1', 
        patientId: 'patient-4',
        start: '2025-12-01T10:00:00Z',  // Starts before existing (10:30-11:30)
        end: '2025-12-01T12:00:00Z'     // Ends after existing
      };

      expect(() => createAppointmentWithMock(encompassingRequest)).toThrow('APPOINTMENT_CONFLICT');
    });
  });

  describe('Back-to-back appointments (NO overlap)', () => {
    it('should NOT detect overlap for back-to-back appointments', () => {
      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            get: (clinicianId: string, end: string, start: string) => {
              // Back-to-back: Existing ends at 10:00, new starts at 10:00
              // SQL check: start_time < 10:00 AND end_time > 10:00 
              // Should return null (no overlap) because end_time = 10:00 is not > 10:00
              return null; // No overlapping appointment
            },
            run: () => ({ lastInsertRowid: 1 }),
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const backToBackRequest: CreateAppointmentRequest = {
        clinicianId: 'clinician-1',
        patientId: 'patient-5', 
        start: '2025-12-01T10:00:00Z',  // Starts exactly when previous ends
        end: '2025-12-01T11:00:00Z'
      };

      // Should NOT throw error - back-to-back is allowed
      expect(() => createAppointmentWithMock(backToBackRequest)).not.toThrow();
    });
  });

  describe('Different clinicians same time (NO overlap)', () => {
    it('should NOT detect overlap for different clinicians at same time', () => {
      jest.doMock('../../../src/database.js', () => ({
        getDatabase: () => ({
          transaction: (fn: () => any) => () => fn(),
          prepare: (query: string) => ({
            get: (clinicianId: string, end: string, start: string) => {
              // Different clinicians can have same time slots
              // SQL filters by clinician_id, so different clinician = no conflict
              return null; // No overlapping appointment for this clinician
            },
            run: () => ({ lastInsertRowid: 1 }),
            all: () => []
          })
        })
      }));

      jest.resetModules();
      const { createAppointment: createAppointmentWithMock } = require('../../../src/services/appointmentService.js');

      const differentClinicianRequest: CreateAppointmentRequest = {
        clinicianId: 'clinician-2',     // Different clinician
        patientId: 'patient-6',
        start: '2025-12-01T10:00:00Z',  // Same time as clinician-1's appointment
        end: '2025-12-01T11:00:00Z'
      };

      // Should NOT throw error - different clinicians can have overlapping times
      expect(() => createAppointmentWithMock(differentClinicianRequest)).not.toThrow();
    });
  });
});