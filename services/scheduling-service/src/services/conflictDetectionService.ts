import { EventEmitter } from "events";

export interface ConflictInfo {
  conflictId: string;
  userId: string;
  event1Id: string;
  event1Title: string;
  event1Start: Date;
  event1End: Date;
  event2Id: string;
  event2Title: string;
  event2Start: Date;
  event2End: Date;
  overlapMinutes: number;
  severity: "low" | "medium" | "high";
  suggestedResolution?: string;
  detectedDate: Date;
}

export interface RescheduleSuggestion {
  suggestionId: string;
  originalEventId: string;
  suggestedStartTime: Date;
  suggestedEndTime: Date;
  reason: string;
  conflictResolved: boolean;
  confidence: number; // 0-100
}

export interface ConflictPattern {
  patternId: string;
  userId: string;
  dayOfWeek: number;
  timeRange: { start: string; end: string };
  conflictFrequency: number;
  suggestedAction: string;
}

export class ConflictDetectionService extends EventEmitter {
  private conflicts: Map<string, ConflictInfo> = new Map();
  private suggestions: Map<string, RescheduleSuggestion[]> = new Map();
  private patterns: Map<string, ConflictPattern> = new Map();
  private userEvents: Map<
    string,
    Array<{ eventId: string; start: Date; end: Date; title: string }>
  > = new Map();
  private conflictHistory: Map<string, ConflictInfo[]> = new Map(); // userId -> conflicts

  // Detect conflicts for event
  detectConflicts(
    userId: string,
    eventId: string,
    eventTitle: string,
    startTime: Date,
    endTime: Date,
  ): ConflictInfo[] {
    const events = this.userEvents.get(userId) || [];
    const foundConflicts: ConflictInfo[] = [];

    for (const existingEvent of events) {
      if (existingEvent.eventId === eventId) continue;

      // Check for overlap
      if (startTime < existingEvent.end && endTime > existingEvent.start) {
        const overlapStart = Math.max(
          startTime.getTime(),
          existingEvent.start.getTime(),
        );
        const overlapEnd = Math.min(
          endTime.getTime(),
          existingEvent.end.getTime(),
        );
        const overlapMinutes = Math.round(
          (overlapEnd - overlapStart) / (60 * 1000),
        );

        // Determine severity
        let severity: "low" | "medium" | "high" = "low";
        if (overlapMinutes > 60) severity = "high";
        else if (overlapMinutes > 30) severity = "medium";

        const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const conflict: ConflictInfo = {
          conflictId,
          userId,
          event1Id: eventId,
          event1Title: eventTitle,
          event1Start: startTime,
          event1End: endTime,
          event2Id: existingEvent.eventId,
          event2Title: existingEvent.title,
          event2Start: existingEvent.start,
          event2End: existingEvent.end,
          overlapMinutes,
          severity,
          detectedDate: new Date(),
        };

        foundConflicts.push(conflict);
        this.conflicts.set(conflictId, conflict);

        // Track conflict
        const history = this.conflictHistory.get(userId) || [];
        history.push(conflict);
        this.conflictHistory.set(userId, history);

        this.emit("conflict:detected", {
          conflictId,
          userId,
          event1Title,
          event2Title,
          overlapMinutes,
          severity,
        });
      }
    }

    return foundConflicts;
  }

  // Register event for tracking
  registerEvent(
    userId: string,
    eventId: string,
    title: string,
    startTime: Date,
    endTime: Date,
  ): void {
    const events = this.userEvents.get(userId) || [];
    events.push({ eventId, title, start: startTime, end: endTime });
    this.userEvents.set(userId, events);
  }

  // Generate rescheduling suggestions
  generateRescheduleSuggestions(
    conflict: ConflictInfo,
  ): RescheduleSuggestion[] {
    const suggestions: RescheduleSuggestion[] = [];
    const events = this.userEvents.get(conflict.userId) || [];

    // Try to find slots after the conflicting event
    const newStartTime = new Date(
      conflict.event2End.getTime() + 15 * 60 * 1000,
    ); // 15 min buffer
    const newEndTime = new Date(
      newStartTime.getTime() +
        (conflict.event1End.getTime() - conflict.event1Start.getTime()),
    );

    // Check if new slot is free
    let isFree = true;
    for (const event of events) {
      if (event.eventId === conflict.event1Id) continue;
      if (newStartTime < event.end && newEndTime > event.start) {
        isFree = false;
        break;
      }
    }

    if (isFree) {
      const suggestionId = `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      suggestions.push({
        suggestionId,
        originalEventId: conflict.event1Id,
        suggestedStartTime: newStartTime,
        suggestedEndTime: newEndTime,
        reason: `After ${conflict.event2Title}`,
        conflictResolved: true,
        confidence: 90,
      });
    }

    // Try the day before at same time
    const prevDayStart = new Date(
      conflict.event1Start.getTime() - 24 * 60 * 60 * 1000,
    );
    const prevDayEnd = new Date(
      conflict.event1End.getTime() - 24 * 60 * 60 * 1000,
    );

    isFree = true;
    for (const event of events) {
      if (event.eventId === conflict.event1Id) continue;
      if (prevDayStart < event.end && prevDayEnd > event.start) {
        isFree = false;
        break;
      }
    }

    if (isFree && prevDayStart > new Date()) {
      const suggestionId = `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      suggestions.push({
        suggestionId,
        originalEventId: conflict.event1Id,
        suggestedStartTime: prevDayStart,
        suggestedEndTime: prevDayEnd,
        reason: "Previous day at same time",
        conflictResolved: true,
        confidence: 75,
      });
    }

    const storedSuggestions = this.suggestions.get(conflict.event1Id) || [];
    storedSuggestions.push(...suggestions);
    this.suggestions.set(conflict.event1Id, storedSuggestions);

    return suggestions;
  }

  // Resolve conflict by moving event
  resolveConflict(
    conflictId: string,
    suggestionId: string,
    accept: boolean,
  ): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    if (!accept) {
      this.emit("conflict:ignored", {
        conflictId,
        userId: conflict.userId,
      });
      return;
    }

    const suggestions = this.suggestions.get(conflict.event1Id) || [];
    const suggestion = suggestions.find((s) => s.suggestionId === suggestionId);

    if (!suggestion) return;

    // Update event in tracking
    const events = this.userEvents.get(conflict.userId) || [];
    const eventIndex = events.findIndex((e) => e.eventId === conflict.event1Id);

    if (eventIndex > -1) {
      events[eventIndex].start = suggestion.suggestedStartTime;
      events[eventIndex].end = suggestion.suggestedEndTime;
    }

    this.emit("conflict:resolved", {
      conflictId,
      eventId: conflict.event1Id,
      newStartTime: suggestion.suggestedStartTime,
      newEndTime: suggestion.suggestedEndTime,
    });
  }

  // Detect conflict patterns
  analyzePatterns(userId: string): ConflictPattern[] {
    const conflicts = this.conflictHistory.get(userId) || [];
    const patterns: Map<string, number> = new Map();

    for (const conflict of conflicts) {
      const dayOfWeek = conflict.event1Start.getDay();
      const hour = conflict.event1Start.getHours();
      const key = `${dayOfWeek}_${hour}`;

      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    const detectedPatterns: ConflictPattern[] = [];

    for (const [key, frequency] of patterns.entries()) {
      if (frequency >= 2) {
        // Pattern occurs at least twice
        const [dayStr, hourStr] = key.split("_");
        const dayOfWeek = parseInt(dayStr);
        const hour = parseInt(hourStr);

        const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const pattern: ConflictPattern = {
          patternId,
          userId,
          dayOfWeek,
          timeRange: {
            start: `${hour.toString().padStart(2, "0")}:00`,
            end: `${(hour + 1).toString().padStart(2, "0")}:00`,
          },
          conflictFrequency: frequency,
          suggestedAction: `Consider blocking this time slot or scheduling important meetings elsewhere on ${this.getDayName(dayOfWeek)}s at ${hour}:00`,
        };

        detectedPatterns.push(pattern);
        this.patterns.set(patternId, pattern);
      }
    }

    return detectedPatterns;
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  }

  // Check timezone conflicts
  checkTimezoneConflicts(
    userId: string,
    eventStartTime: Date,
    eventEndTime: Date,
    userTimezone: string,
    attendeeTimezones: Map<string, string>,
  ): {
    userId: string;
    timezone: string;
    localTime: string;
    conflict: boolean;
  }[] {
    const results: {
      userId: string;
      timezone: string;
      localTime: string;
      conflict: boolean;
    }[] = [];

    for (const [attendeeId, attendeeTimezone] of attendeeTimezones.entries()) {
      // Simplified timezone conversion (would use TimezoneService in production)
      const tzOffset = this.getSimplifiedTimezoneOffset(attendeeTimezone);
      const localTime = new Date(
        eventStartTime.getTime() + tzOffset * 60 * 60 * 1000,
      );

      // Check if outside working hours (8 AM - 6 PM)
      const hour = localTime.getHours();
      const isOutsideWorkingHours = hour < 8 || hour >= 18;

      results.push({
        userId: attendeeId,
        timezone: attendeeTimezone,
        localTime: localTime.toLocaleString(),
        conflict: isOutsideWorkingHours,
      });
    }

    return results;
  }

  private getSimplifiedTimezoneOffset(timezone: string): number {
    const offsets: Map<string, number> = new Map([
      ["UTC", 0],
      ["EST", -5],
      ["CST", -6],
      ["MST", -7],
      ["PST", -8],
      ["CET", 1],
      ["IST", 5.5],
      ["JST", 9],
      ["AEST", 10],
    ]);

    return offsets.get(timezone) || 0;
  }

  // Get conflict statistics
  getConflictStats(userId: string): {
    totalConflicts: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    avgConflictsPerMonth: number;
  } {
    const conflicts = this.conflictHistory.get(userId) || [];

    const stats = {
      totalConflicts: conflicts.length,
      highSeverity: conflicts.filter((c) => c.severity === "high").length,
      mediumSeverity: conflicts.filter((c) => c.severity === "medium").length,
      lowSeverity: conflicts.filter((c) => c.severity === "low").length,
      avgConflictsPerMonth: 0,
    };

    if (conflicts.length > 0) {
      const timeSpan = Math.round(
        (Date.now() - conflicts[0].detectedDate.getTime()) /
          (30 * 24 * 60 * 60 * 1000),
      );
      stats.avgConflictsPerMonth = Math.round(
        conflicts.length / Math.max(timeSpan, 1),
      );
    }

    return stats;
  }

  // Get conflict by ID
  getConflict(conflictId: string): ConflictInfo | undefined {
    return this.conflicts.get(conflictId);
  }

  // Get all conflicts for user
  getUserConflicts(userId: string): ConflictInfo[] {
    return this.conflictHistory.get(userId) || [];
  }

  // Get recent conflicts
  getRecentConflicts(userId: string, days: number = 7): ConflictInfo[] {
    const conflicts = this.conflictHistory.get(userId) || [];
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    return conflicts.filter((c) => c.detectedDate.getTime() > cutoffTime);
  }
}

export const conflictDetectionService = new ConflictDetectionService();

export default ConflictDetectionService;
