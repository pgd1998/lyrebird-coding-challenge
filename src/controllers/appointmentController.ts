import { Router, Request, Response } from 'express';
import { CreateAppointmentRequest, AppointmentQueryParams } from '../types.js';
import * as appointmentService from '../services/appointmentService.js';

const router = Router();

// TODO: cant create appointment to the past. this is not implemented to check and say cant create to the past
router.post('/appointments', (req: Request, res: Response) => {
    try {
        const appointmentData: CreateAppointmentRequest= req.body;
        const role = req.headers['x-role'] as string;

        if (!role || !['patient', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden: Patient or Admin role required' });
  }

    if (!appointmentData.clinicianId || !appointmentData.patientId || !appointmentData.start || !appointmentData.end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const appointment = appointmentService.createAppointment(appointmentData);
    res.status(201).json(appointment);
    } catch (error: any) {
        if (error.message === 'APPOINTMENT_CONFLICT') {
      return res.status(409).json({ error: 'Appointment time conflicts with existing booking' });
    }
    res.status(400).json({ error: error.message });
    }

});

router.get('/clinicians/:id/appointments',  (req: Request, res: Response) => {
  try {
    const clinicianId = req.params.id;
    const role = req.headers['x-role'] as string;
    const queryParams: AppointmentQueryParams = req.query;
    
    if (!role || !['clinician', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden: Clinician or Admin role required' });
  }

    const appointments =  appointmentService.getClinicianAppointments(clinicianId, queryParams);
    res.status(200).json(appointments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/appointments', (req: Request, res: Response) => {
  try {
    const queryParams: AppointmentQueryParams = req.query;
    const role = req.headers['x-role'] as string;

    if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin role required' });
  }

    const appointments = appointmentService.getAllAppointments(queryParams);
    res.status(200).json(appointments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
