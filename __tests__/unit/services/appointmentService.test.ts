import { createAppointment } from '../../../src/services/appointmentService.js';
import { CreateAppointmentRequest } from '../../../src/types.js';

// Mock the database module to focus on testing business logic
jest.mock('../../../src/database.js', () => ({
  getDatabase: () => ({
    transaction: (fn: () => any) => () => fn(),
    prepare: () => ({
      get: (id?: any) => {
        if (id === 1) {
          return {
            id: 1,
            clinicianId: 'test-clinician',
            patientId: 'test-patient',
            startTime: '2024-12-01T10:00:00Z',
            endTime: '2024-12-01T11:00:00Z',
            createdAt: '2024-11-30T09:00:00Z'
          };
        }
        return null; // No overlapping appointments
      },
      run: () => ({ lastInsertRowid: 1 }),
      all: () => []
    })
  })
}));

describe('appointmentService - Date Validation Logic', () => {
  describe('Valid ISO dates', () => {
    it('should accept valid ISO date strings with Z timezone', () => {
      const futureDate1 = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      const futureDate2 = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      
      const validRequest: CreateAppointmentRequest = {
        clinicianId: 'test-clinician',
        patientId: 'test-patient',
        start: futureDate1,
        end: futureDate2
      };

      // This should not throw an error
      expect(() => createAppointment(validRequest)).not.toThrow();
    });
  });

  describe('Invalid date strings', () => {
    it('should throw error for invalid date format', () => {
      const invalidRequest: CreateAppointmentRequest = {
        clinicianId: 'test-clinician',
        patientId: 'test-patient',
        start: 'invalid-date',
        end: '2024-12-01T10:00:00Z'
      };

      expect(() => createAppointment(invalidRequest)).toThrow(
        'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)'
      );
    });

    it('should throw error for dates without Z timezone suffix', () => {
      const futureDate1 = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, -1); // Remove Z
      const futureDate2 = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      
      const invalidRequest: CreateAppointmentRequest = {
        clinicianId: 'test-clinician',
        patientId: 'test-patient',
        start: futureDate1,
        end: futureDate2
      };

      expect(() => createAppointment(invalidRequest)).toThrow(
        'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)'
      );
    });
  });

  describe('Start time after end time', () => {
    it('should throw error when start time is after end time', () => {
      const futureDate1 = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      const futureDate2 = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      
      const invalidRequest: CreateAppointmentRequest = {
        clinicianId: 'test-clinician',
        patientId: 'test-patient',
        start: futureDate1, // Later time
        end: futureDate2    // Earlier time
      };

      expect(() => createAppointment(invalidRequest)).toThrow(
        'Start time must be before end time'
      );
    });
  });

  describe('Same start/end time (zero duration)', () => {
    it('should throw error for zero duration appointments', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      const invalidRequest: CreateAppointmentRequest = {
        clinicianId: 'test-clinician',
        patientId: 'test-patient',
        start: futureDate,
        end: futureDate // Same time
      };

      expect(() => createAppointment(invalidRequest)).toThrow(
        'Start time must be before end time'
      );
    });
  });

  describe('Past appointments', () => {
    it('should throw error for appointments in the past', () => {
      const pastDate1 = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const pastDate2 = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      
      const invalidRequest: CreateAppointmentRequest = {
        clinicianId: 'test-clinician',
        patientId: 'test-patient',
        start: pastDate1,
        end: pastDate2
      };

      expect(() => createAppointment(invalidRequest)).toThrow(
        'Cannot book appointments in the past'
      );
    });
  });
});