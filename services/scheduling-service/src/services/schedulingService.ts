import { EventEmitter } from "events";

export interface ScheduleSlot {
  slotId: string;
  userId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
  recurrence: "weekly" | "biweekly" | "monthly" | "once";
  isAvailable: boolean;
  createdDate: Date;
}

export interface ClassSchedule {
  scheduleId: string;
  instructorId: string;
  instructorName: string;
  courseName: string;
  slots: ScheduleSlot[];
  capacity: number;
  currentEnrollment: number;
  status: "active" | "paused" | "completed";
  createdDate: Date;
  updatedDate: Date;
}

export interface Booking {
  bookingId: string;
  scheduleId: string;
  studentId: string;
  studentName: string;
  sessionDate: Date;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  confirmationCode: string;
  createdDate: Date;
  cancelledDate?: Date;
  completedDate?: Date;
}

export interface BufferTime {
  bufferId: string;
  userId: string;
  slotId: string;
  bufferMinutes: number; // minutes before/after slot
  reason: string;
  createdDate: Date;
}

export class SchedulingService extends EventEmitter {
  private schedules: Map<string, ClassSchedule> = new Map();
  private slots: Map<string, ScheduleSlot> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private buffers: Map<string, BufferTime> = new Map();
  private userSchedules: Map<string, Set<string>> = new Map(); // userId -> scheduleIds

  // Create schedule
  createSchedule(
    instructorId: string,
    instructorName: string,
    courseName: string,
    capacity: number,
  ): ClassSchedule {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const schedule: ClassSchedule = {
      scheduleId,
      instructorId,
      instructorName,
      courseName,
      slots: [],
      capacity,
      currentEnrollment: 0,
      status: "active",
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    this.schedules.set(scheduleId, schedule);

    // Track user schedules
    const userScheds = this.userSchedules.get(instructorId) || new Set();
    userScheds.add(scheduleId);
    this.userSchedules.set(instructorId, userScheds);

    this.emit("schedule:created", {
      scheduleId,
      instructorName,
      courseName,
      capacity,
    });

    return schedule;
  }

  // Add availability slot
  addSlot(
    scheduleId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    timezone: string,
    recurrence: "weekly" | "biweekly" | "monthly" | "once" = "weekly",
  ): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const slot: ScheduleSlot = {
      slotId,
      userId: schedule.instructorId,
      dayOfWeek,
      startTime,
      endTime,
      timezone,
      recurrence,
      isAvailable: true,
      createdDate: new Date(),
    };

    this.slots.set(slotId, slot);
    schedule.slots.push(slot);
    schedule.updatedDate = new Date();

    this.emit("slot:added", {
      slotId,
      scheduleId,
      dayOfWeek,
      startTime,
      endTime,
    });
  }

  // Book slot
  bookSlot(
    scheduleId: string,
    studentId: string,
    studentName: string,
    sessionDate: Date,
  ): Booking | null {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    if (schedule.currentEnrollment >= schedule.capacity) {
      throw new Error("Schedule is at capacity");
    }

    // Check for conflicts
    if (this.hasConflict(studentId, sessionDate)) {
      throw new Error("Conflicting booking already exists");
    }

    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const confirmationCode = Math.random()
      .toString(36)
      .substr(2, 8)
      .toUpperCase();

    const booking: Booking = {
      bookingId,
      scheduleId,
      studentId,
      studentName,
      sessionDate,
      status: "confirmed",
      confirmationCode,
      createdDate: new Date(),
    };

    this.bookings.set(bookingId, booking);
    schedule.currentEnrollment++;

    this.emit("booking:created", {
      bookingId,
      confirmationCode,
      studentName,
      courseName: schedule.courseName,
      sessionDate,
    });

    return booking;
  }

  // Cancel booking
  cancelBooking(bookingId: string, reason: string): void {
    const booking = this.bookings.get(bookingId);
    if (!booking) return;

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Cannot cancel booking in this status");
    }

    booking.status = "cancelled";
    booking.cancelledDate = new Date();

    const schedule = this.schedules.get(booking.scheduleId);
    if (schedule) {
      schedule.currentEnrollment--;
    }

    this.emit("booking:cancelled", {
      bookingId,
      studentId: booking.studentId,
      reason,
      scheduleId: booking.scheduleId,
    });
  }

  // Mark booking completed
  markBookingCompleted(bookingId: string): void {
    const booking = this.bookings.get(bookingId);
    if (!booking) return;

    booking.status = "completed";
    booking.completedDate = new Date();

    this.emit("booking:completed", {
      bookingId,
      studentId: booking.studentId,
      sessionDate: booking.sessionDate,
    });
  }

  // Check for conflicts
  private hasConflict(studentId: string, sessionDate: Date): boolean {
    for (const booking of this.bookings.values()) {
      if (booking.studentId === studentId && booking.status === "confirmed") {
        const bookingDate = new Date(booking.sessionDate);
        // Check if within same day (simplified conflict check)
        if (bookingDate.toDateString() === sessionDate.toDateString()) {
          return true;
        }
      }
    }
    return false;
  }

  // Add buffer time
  addBufferTime(
    scheduleId: string,
    slotId: string,
    bufferMinutes: number,
    reason: string,
  ): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    const bufferId = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const buffer: BufferTime = {
      bufferId,
      userId: schedule.instructorId,
      slotId,
      bufferMinutes,
      reason,
      createdDate: new Date(),
    };

    this.buffers.set(bufferId, buffer);

    this.emit("buffer:added", {
      bufferId,
      slotId,
      bufferMinutes,
      reason,
    });
  }

  // Get schedule
  getSchedule(scheduleId: string): ClassSchedule | undefined {
    return this.schedules.get(scheduleId);
  }

  // Get available slots
  getAvailableSlots(scheduleId: string): ScheduleSlot[] {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return [];

    return schedule.slots.filter((slot) => slot.isAvailable);
  }

  // Get student bookings
  getStudentBookings(studentId: string): Booking[] {
    return Array.from(this.bookings.values())
      .filter((b) => b.studentId === studentId && b.status !== "cancelled")
      .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
  }

  // Get upcoming sessions
  getUpcomingSessions(scheduleId: string, limit: number = 10): Booking[] {
    const now = new Date();
    return Array.from(this.bookings.values())
      .filter(
        (b) =>
          b.scheduleId === scheduleId &&
          b.sessionDate > now &&
          b.status === "confirmed",
      )
      .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())
      .slice(0, limit);
  }

  // Pause schedule
  pauseSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      schedule.status = "paused";

      this.emit("schedule:paused", {
        scheduleId,
        courseName: schedule.courseName,
      });
    }
  }

  // Resume schedule
  resumeSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      schedule.status = "active";

      this.emit("schedule:resumed", {
        scheduleId,
        courseName: schedule.courseName,
      });
    }
  }

  // Get instructor schedules
  getInstructorSchedules(instructorId: string): ClassSchedule[] {
    const scheduleIds = this.userSchedules.get(instructorId) || new Set();
    return Array.from(scheduleIds)
      .map((id) => this.schedules.get(id))
      .filter((s) => s !== undefined) as ClassSchedule[];
  }

  // Get capacity stats
  getCapacityStats(scheduleId: string): {
    capacity: number;
    enrolled: number;
    available: number;
    fillPercentage: number;
  } {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return { capacity: 0, enrolled: 0, available: 0, fillPercentage: 0 };
    }

    return {
      capacity: schedule.capacity,
      enrolled: schedule.currentEnrollment,
      available: schedule.capacity - schedule.currentEnrollment,
      fillPercentage: Math.round(
        (schedule.currentEnrollment / schedule.capacity) * 100,
      ),
    };
  }

  // Find free slots
  findFreeSlots(
    instructorId: string,
    startDate: Date,
    endDate: Date,
  ): ScheduleSlot[] {
    const scheduleIds = this.userSchedules.get(instructorId) || new Set();
    const slots: ScheduleSlot[] = [];

    for (const scheduleId of scheduleIds) {
      const schedule = this.schedules.get(scheduleId);
      if (schedule) {
        slots.push(...schedule.slots.filter((s) => s.isAvailable));
      }
    }

    return slots;
  }
}

export const schedulingService = new SchedulingService();

export default SchedulingService;
