import { Router, Request, Response } from "express";
import { schedulingService } from "../services/schedulingService";
import { calendarService } from "../services/calendarService";
import { timezoneService } from "../services/timezoneService";
import { conflictDetectionService } from "../services/conflictDetectionService";

const router = Router();

// Scheduling Routes

router.post("/schedule/classes", (req: Request, res: Response) => {
  try {
    const {
      instructorId,
      instructorName,
      title,
      startTime,
      endTime,
      capacity,
      recurrence,
    } = req.body;
    const schedule = schedulingService.scheduleClass(
      instructorId,
      instructorName,
      title,
      new Date(startTime),
      new Date(endTime),
      capacity,
      recurrence,
    );
    res.status(201).json({ success: true, schedule });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/schedule/classes/:classId", (req: Request, res: Response) => {
  try {
    const classSchedule = schedulingService.getClassSchedule(
      req.params.classId,
    );
    res.json(classSchedule);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/schedule/classes", (req: Request, res: Response) => {
  try {
    const { instructorId, startDate, endDate } = req.query;
    const classes = schedulingService.getInstructorSchedule(
      instructorId as string,
      new Date(startDate as string),
      new Date(endDate as string),
    );
    res.json({ classes });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/schedule/slots", (req: Request, res: Response) => {
  try {
    const { classId, duration, bufferTime } = req.body;
    const slots = schedulingService.generateAvailabilitySlots(
      classId,
      duration,
      bufferTime,
    );
    res.status(201).json({ success: true, slots });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/schedule/slots/:classId", (req: Request, res: Response) => {
  try {
    const slots = schedulingService.getAvailabilitySlots(req.params.classId);
    res.json({ slots });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/schedule/bookings", (req: Request, res: Response) => {
  try {
    const { studentId, studentName, classId, slotTime, notes } = req.body;
    const booking = schedulingService.createBooking(
      studentId,
      studentName,
      classId,
      new Date(slotTime),
      notes,
    );
    res.status(201).json({ success: true, booking });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/schedule/bookings/:studentId", (req: Request, res: Response) => {
  try {
    const bookings = schedulingService.getStudentBookings(req.params.studentId);
    res.json({ bookings });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/schedule/bookings/:bookingId/cancel",
  (req: Request, res: Response) => {
    try {
      schedulingService.cancelBooking(req.params.bookingId);
      res.json({ success: true, message: "Booking cancelled" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/schedule/bookings/:bookingId/reschedule",
  (req: Request, res: Response) => {
    try {
      const { newSlotTime } = req.body;
      schedulingService.rescheduleBooking(
        req.params.bookingId,
        new Date(newSlotTime),
      );
      res.json({ success: true, message: "Booking rescheduled" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get("/schedule/capacity/:classId", (req: Request, res: Response) => {
  try {
    const capacity = schedulingService.getClassCapacity(req.params.classId);
    res.json(capacity);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Calendar Routes

router.post("/calendar/events", (req: Request, res: Response) => {
  try {
    const {
      userId,
      title,
      description,
      startTime,
      endTime,
      location,
      eventType,
    } = req.body;
    const event = calendarService.createEvent(
      userId,
      title,
      description,
      new Date(startTime),
      new Date(endTime),
      location,
      eventType,
    );
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/calendar/events/:userId", (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const events = calendarService.getUserEvents(
      req.params.userId,
      new Date(startDate as string),
      new Date(endDate as string),
    );
    res.json({ events });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/calendar/events/:eventId", (req: Request, res: Response) => {
  try {
    const event = calendarService.getEvent(req.params.eventId);
    res.json(event);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put("/calendar/events/:eventId", (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location } = req.body;
    calendarService.updateEvent(
      req.params.eventId,
      title,
      description,
      new Date(startTime),
      new Date(endTime),
      location,
    );
    res.json({ success: true, message: "Event updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/calendar/events/:eventId", (req: Request, res: Response) => {
  try {
    calendarService.deleteEvent(req.params.eventId);
    res.json({ success: true, message: "Event deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/calendar/events/:eventId/share",
  (req: Request, res: Response) => {
    try {
      const { userId, sharedWith } = req.body;
      calendarService.shareEvent(req.params.eventId, userId, sharedWith);
      res.json({ success: true, message: "Event shared" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/calendar/reminders", (req: Request, res: Response) => {
  try {
    const { eventId, userId, reminderTime, reminderType } = req.body;
    calendarService.setReminder(
      eventId,
      userId,
      new Date(reminderTime),
      reminderType,
    );
    res.status(201).json({ success: true, message: "Reminder set" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/calendar/reminders/:userId", (req: Request, res: Response) => {
  try {
    const reminders = calendarService.getUserReminders(req.params.userId);
    res.json({ reminders });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/calendar/preferences/:userId", (req: Request, res: Response) => {
  try {
    const { workingHours, preferences } = req.body;
    calendarService.updateCalendarPreferences(
      req.params.userId,
      workingHours,
      preferences,
    );
    res.json({ success: true, message: "Preferences updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/calendar/suggestions/:userId", (req: Request, res: Response) => {
  try {
    const { duration } = req.query;
    const suggestions = calendarService.suggestMeetingTimes(
      req.params.userId,
      parseInt(duration as string),
    );
    res.json({ suggestions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Timezone Routes

router.get("/timezone/list", (req: Request, res: Response) => {
  try {
    const timezones = timezoneService.getAvailableTimezones();
    res.json({ timezones });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/timezone/convert", (req: Request, res: Response) => {
  try {
    const { dateTime, fromTimezone, toTimezone } = req.body;
    const converted = timezoneService.convertTimeZone(
      new Date(dateTime),
      fromTimezone,
      toTimezone,
    );
    res.json({ original: dateTime, converted, fromTimezone, toTimezone });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/timezone/user/set", (req: Request, res: Response) => {
  try {
    const { userId, timezone } = req.body;
    timezoneService.setUserTimezone(userId, timezone);
    res.json({ success: true, message: "User timezone set" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/timezone/user/:userId", (req: Request, res: Response) => {
  try {
    const timezone = timezoneService.getUserTimezone(req.params.userId);
    res.json({ timezone });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/timezone/best-time", (req: Request, res: Response) => {
  try {
    const { userIds, duration } = req.body;
    const bestTime = timezoneService.findBestMeetingTime(userIds, duration);
    res.json(bestTime);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/timezone/current/:timezone", (req: Request, res: Response) => {
  try {
    const current = timezoneService.getCurrentTimeInTimezone(
      req.params.timezone,
    );
    res.json({ timezone: req.params.timezone, currentTime: current });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/timezone/format", (req: Request, res: Response) => {
  try {
    const { dateTime, timezone, format } = req.body;
    const formatted = timezoneService.formatDateInTimezone(
      new Date(dateTime),
      timezone,
      format,
    );
    res.json({ formatted });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Conflict Detection Routes

router.post("/conflicts/check", (req: Request, res: Response) => {
  try {
    const { userId, proposedStartTime, proposedEndTime } = req.body;
    const conflicts = conflictDetectionService.detectConflicts(
      userId,
      new Date(proposedStartTime),
      new Date(proposedEndTime),
    );
    res.json({ conflicts });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/conflicts/user/:userId", (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    const conflicts = conflictDetectionService.getUserConflicts(
      req.params.userId,
      timeRange as string,
    );
    res.json({ conflicts });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/conflicts/patterns", (req: Request, res: Response) => {
  try {
    const { userId, days } = req.body;
    const patterns = conflictDetectionService.analyzeConflictPatterns(
      req.params.userId,
      days,
    );
    res.json({ patterns });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/conflicts/suggest-reschedule", (req: Request, res: Response) => {
  try {
    const { userId, conflictingEventId } = req.body;
    const suggestions = conflictDetectionService.suggestAlternativeTime(
      userId,
      conflictingEventId,
    );
    res.json({ suggestions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/conflicts/analyze-timezone", (req: Request, res: Response) => {
  try {
    const { userIds, proposedTime } = req.body;
    const analysis = conflictDetectionService.analyzeTimezoneConflicts(
      userIds,
      new Date(proposedTime),
    );
    res.json({ analysis });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/conflicts/availability/:userId", (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const availability = conflictDetectionService.getAvailabilityWindows(
      req.params.userId,
      parseInt(days as string),
    );
    res.json({ availability });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
