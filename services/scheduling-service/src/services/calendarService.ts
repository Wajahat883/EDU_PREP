import { EventEmitter } from "events";

export interface CalendarEvent {
  eventId: string;
  userId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  color: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrencePattern?: string; // RRULE format
  reminders: Reminder[];
  attendees: string[]; // userIds
  attachments?: string[];
  status: "scheduled" | "confirmed" | "cancelled";
  createdDate: Date;
  updatedDate: Date;
}

export interface Reminder {
  reminderId: string;
  eventId: string;
  reminderType: "email" | "notification" | "sms";
  minutesBefore: number;
  sent: boolean;
  sentDate?: Date;
}

export interface CalendarShare {
  shareId: string;
  calendarOwnerId: string;
  sharedWithUserId: string;
  accessLevel: "view" | "edit" | "manage";
  createdDate: Date;
}

export interface CalendarPreference {
  userId: string;
  defaultReminder: number; // minutes before
  weekStartDay: number; // 0 = Sunday
  timeFormat: "12h" | "24h";
  viewPreference: "day" | "week" | "month" | "agenda";
}

export class CalendarService extends EventEmitter {
  private events: Map<string, CalendarEvent> = new Map();
  private userEvents: Map<string, Set<string>> = new Map(); // userId -> eventIds
  private shares: Map<string, CalendarShare> = new Map();
  private userShares: Map<string, Set<string>> = new Map(); // userId -> shareIds
  private preferences: Map<string, CalendarPreference> = new Map();
  private reminders: Map<string, Reminder[]> = new Map();

  // Create event
  createEvent(
    userId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    timezone: string,
    isAllDay: boolean = false,
    color: string = "#3498db",
  ): CalendarEvent {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: CalendarEvent = {
      eventId,
      userId,
      title,
      description,
      startTime,
      endTime,
      timezone,
      color,
      isAllDay,
      isRecurring: false,
      reminders: [],
      attendees: [userId],
      status: "scheduled",
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    this.events.set(eventId, event);

    // Track user events
    const userEvents = this.userEvents.get(userId) || new Set();
    userEvents.add(eventId);
    this.userEvents.set(userId, userEvents);

    this.emit("event:created", {
      eventId,
      userId,
      title,
      startTime,
      endTime,
    });

    return event;
  }

  // Update event
  updateEvent(
    eventId: string,
    userId: string,
    updates: Partial<CalendarEvent>,
  ): void {
    const event = this.events.get(eventId);
    if (!event || event.userId !== userId) return;

    Object.assign(event, updates);
    event.updatedDate = new Date();

    this.emit("event:updated", {
      eventId,
      userId,
      title: event.title,
      changes: Object.keys(updates),
    });
  }

  // Delete event
  deleteEvent(eventId: string, userId: string): void {
    const event = this.events.get(eventId);
    if (!event || event.userId !== userId) return;

    event.status = "cancelled";
    event.updatedDate = new Date();

    this.emit("event:deleted", {
      eventId,
      userId,
      title: event.title,
    });
  }

  // Add reminder
  addReminder(
    eventId: string,
    reminderType: "email" | "notification" | "sms",
    minutesBefore: number,
  ): void {
    const reminderId = `reminder_${Date.now()}`;

    const reminder: Reminder = {
      reminderId,
      eventId,
      reminderType,
      minutesBefore,
      sent: false,
    };

    const reminders = this.reminders.get(eventId) || [];
    reminders.push(reminder);
    this.reminders.set(eventId, reminders);

    // Also update event
    const event = this.events.get(eventId);
    if (event) {
      event.reminders = reminders;
    }

    this.emit("reminder:added", {
      reminderId,
      eventId,
      reminderType,
      minutesBefore,
    });
  }

  // Get user events
  getUserEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): CalendarEvent[] {
    const eventIds = this.userEvents.get(userId) || new Set();

    return Array.from(eventIds)
      .map((id) => this.events.get(id))
      .filter((e) => {
        if (!e) return false;
        if (e.status === "cancelled") return false;
        return e.startTime >= startDate && e.startTime <= endDate;
      })
      .sort((a, b) => a!.startTime.getTime() - b!.startTime.getTime())
      .slice(0, limit) as CalendarEvent[];
  }

  // Get today's events
  getTodayEvents(userId: string): CalendarEvent[] {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    return this.getUserEvents(userId, startOfDay, endOfDay);
  }

  // Get week events
  getWeekEvents(userId: string, startOfWeek?: Date): CalendarEvent[] {
    const now = startOfWeek || new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;

    const startDate = new Date(now.setDate(diff));
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.getUserEvents(userId, startDate, endDate);
  }

  // Get month events
  getMonthEvents(
    userId: string,
    month?: number,
    year?: number,
  ): CalendarEvent[] {
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth();

    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0);

    return this.getUserEvents(userId, startDate, endDate, 1000);
  }

  // Share calendar
  shareCalendarWith(
    ownerId: string,
    sharedWithUserId: string,
    accessLevel: "view" | "edit" | "manage" = "view",
  ): void {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const share: CalendarShare = {
      shareId,
      calendarOwnerId: ownerId,
      sharedWithUserId,
      accessLevel,
      createdDate: new Date(),
    };

    this.shares.set(shareId, share);

    // Track shares for both users
    const ownerShares = this.userShares.get(ownerId) || new Set();
    ownerShares.add(shareId);
    this.userShares.set(ownerId, ownerShares);

    const recipientShares = this.userShares.get(sharedWithUserId) || new Set();
    recipientShares.add(shareId);
    this.userShares.set(sharedWithUserId, recipientShares);

    this.emit("calendar:shared", {
      shareId,
      ownerId,
      sharedWithUserId,
      accessLevel,
    });
  }

  // Get shared calendars
  getSharedCalendars(
    userId: string,
  ): { calendar: CalendarEvent[]; ownerId: string; accessLevel: string }[] {
    const shares = this.userShares.get(userId) || new Set();
    const sharedCalendars: {
      calendar: CalendarEvent[];
      ownerId: string;
      accessLevel: string;
    }[] = [];

    for (const shareId of shares) {
      const share = this.shares.get(shareId);
      if (share && share.sharedWithUserId === userId) {
        const ownerId = share.calendarOwnerId;
        const ownerEvents = this.userEvents.get(ownerId) || new Set();
        const calendar = Array.from(ownerEvents)
          .map((id) => this.events.get(id))
          .filter((e) => e && e.status !== "cancelled") as CalendarEvent[];

        sharedCalendars.push({
          calendar,
          ownerId,
          accessLevel: share.accessLevel,
        });
      }
    }

    return sharedCalendars;
  }

  // Set preferences
  setPreferences(
    userId: string,
    defaultReminder: number,
    weekStartDay: number,
    timeFormat: "12h" | "24h",
    viewPreference: "day" | "week" | "month" | "agenda",
  ): void {
    const preferences: CalendarPreference = {
      userId,
      defaultReminder,
      weekStartDay,
      timeFormat,
      viewPreference,
    };

    this.preferences.set(userId, preferences);

    this.emit("preferences:updated", {
      userId,
      defaultReminder,
      viewPreference,
    });
  }

  // Get preferences
  getPreferences(userId: string): CalendarPreference | undefined {
    return this.preferences.get(userId);
  }

  // Check for conflicts
  checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
  ): CalendarEvent[] {
    const eventIds = this.userEvents.get(userId) || new Set();

    return Array.from(eventIds)
      .map((id) => this.events.get(id))
      .filter((e) => {
        if (!e || e.status === "cancelled") return false;
        return startTime < e.endTime && endTime > e.startTime;
      }) as CalendarEvent[];
  }

  // Get upcoming events
  getUpcomingEvents(userId: string, limit: number = 10): CalendarEvent[] {
    const now = new Date();
    const eventIds = this.userEvents.get(userId) || new Set();

    return Array.from(eventIds)
      .map((id) => this.events.get(id))
      .filter((e) => {
        if (!e || e.status === "cancelled") return false;
        return e.startTime > now;
      })
      .sort((a, b) => a!.startTime.getTime() - b!.startTime.getTime())
      .slice(0, limit) as CalendarEvent[];
  }

  // Send reminder
  sendReminder(reminderId: string): void {
    for (const reminders of this.reminders.values()) {
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      if (reminder && !reminder.sent) {
        reminder.sent = true;
        reminder.sentDate = new Date();

        this.emit("reminder:sent", {
          reminderId,
          reminderType: reminder.reminderType,
          sentDate: reminder.sentDate,
        });
        return;
      }
    }
  }

  // Suggest meeting time
  suggestMeetingTime(
    attendeeIds: string[],
    duration: number,
    timezone: string,
  ): Date[] {
    const suggestions: Date[] = [];

    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      date.setHours(14, 0, 0, 0); // 2 PM

      // Check if all attendees are free
      let allFree = true;
      for (const attendeeId of attendeeIds) {
        const endTime = new Date(date.getTime() + duration * 60 * 1000);
        const conflicts = this.checkConflicts(attendeeId, date, endTime);
        if (conflicts.length > 0) {
          allFree = false;
          break;
        }
      }

      if (allFree) {
        suggestions.push(date);
        if (suggestions.length >= 3) break;
      }
    }

    return suggestions;
  }
}

export const calendarService = new CalendarService();

export default CalendarService;
