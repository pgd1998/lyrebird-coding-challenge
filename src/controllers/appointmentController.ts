import { Router, Request, Response } from 'express';
import { CreateAppointmentRequest, AppointmentQueryParams } from '../types.js';
import * as appointmentService from '../services/appointmentService.js';

const router = Router();


router.post('/appointments', (req: Request, res: Response) => {
    try {
        const appointmentData: CreateAppointmentRequest= req.body;
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
    const queryParams: AppointmentQueryParams = req.query;
    
    const appointments =  appointmentService.getClinicianAppointments(clinicianId, queryParams);
    res.json(appointments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/appointments', (req: Request, res: Response) => {
  try {
    const queryParams: AppointmentQueryParams = req.query;
    
    const appointments = appointmentService.getAllAppointments(queryParams);
    res.json(appointments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
