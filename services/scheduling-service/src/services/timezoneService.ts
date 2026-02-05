import { EventEmitter } from "events";

export interface TimezoneConversion {
  sourceTime: Date;
  sourceTimezone: string;
  targetTime: Date;
  targetTimezone: string;
  offsetMinutes: number;
}

export interface UserTimezone {
  userId: string;
  primaryTimezone: string;
  secondaryTimezones: string[];
  autoDetect: boolean;
  lastUpdated: Date;
}

export interface ScheduleInTimezone {
  scheduleId: string;
  eventTitle: string;
  originalTime: Date;
  originalTimezone: string;
  convertedTime: Date;
  convertedTimezone: string;
}

export class TimezoneService extends EventEmitter {
  private userTimezones: Map<string, UserTimezone> = new Map();
  private timezones: Map<
    string,
    { offset: number; name: string; abbreviation: string }
  > = new Map();

  constructor() {
    super();
    this.initializeTimezones();
  }

  private initializeTimezones(): void {
    // Major timezones
    const zones = [
      { tz: "UTC", offset: 0, name: "Coordinated Universal Time", abbr: "UTC" },
      {
        tz: "America/New_York",
        offset: -300,
        name: "Eastern Standard Time",
        abbr: "EST",
      },
      {
        tz: "America/Chicago",
        offset: -360,
        name: "Central Standard Time",
        abbr: "CST",
      },
      {
        tz: "America/Denver",
        offset: -420,
        name: "Mountain Standard Time",
        abbr: "MST",
      },
      {
        tz: "America/Los_Angeles",
        offset: -480,
        name: "Pacific Standard Time",
        abbr: "PST",
      },
      {
        tz: "Europe/London",
        offset: 0,
        name: "Greenwich Mean Time",
        abbr: "GMT",
      },
      {
        tz: "Europe/Paris",
        offset: 60,
        name: "Central European Time",
        abbr: "CET",
      },
      {
        tz: "Europe/Moscow",
        offset: 180,
        name: "Moscow Standard Time",
        abbr: "MSK",
      },
      {
        tz: "Asia/Tokyo",
        offset: 540,
        name: "Japan Standard Time",
        abbr: "JST",
      },
      {
        tz: "Asia/Shanghai",
        offset: 480,
        name: "China Standard Time",
        abbr: "CST",
      },
      {
        tz: "Asia/Hong_Kong",
        offset: 480,
        name: "Hong Kong Time",
        abbr: "HKT",
      },
      {
        tz: "Asia/Singapore",
        offset: 480,
        name: "Singapore Standard Time",
        abbr: "SGT",
      },
      {
        tz: "Asia/Kolkata",
        offset: 330,
        name: "Indian Standard Time",
        abbr: "IST",
      },
      {
        tz: "Australia/Sydney",
        offset: 600,
        name: "Australian Eastern Time",
        abbr: "AEST",
      },
      {
        tz: "Pacific/Auckland",
        offset: 720,
        name: "New Zealand Standard Time",
        abbr: "NZST",
      },
    ];

    zones.forEach((z) => {
      this.timezones.set(z.tz, {
        offset: z.offset,
        name: z.name,
        abbreviation: z.abbr,
      });
    });
  }

  // Set user timezone
  setUserTimezone(
    userId: string,
    primaryTimezone: string,
    autoDetect: boolean = false,
  ): void {
    const userTz: UserTimezone = {
      userId,
      primaryTimezone,
      secondaryTimezones: [],
      autoDetect,
      lastUpdated: new Date(),
    };

    this.userTimezones.set(userId, userTz);

    this.emit("timezone:set", {
      userId,
      timezone: primaryTimezone,
      autoDetect,
    });
  }

  // Add secondary timezone
  addSecondaryTimezone(userId: string, timezone: string): void {
    const userTz = this.userTimezones.get(userId);
    if (!userTz) {
      this.setUserTimezone(userId, timezone);
      return;
    }

    if (!userTz.secondaryTimezones.includes(timezone)) {
      userTz.secondaryTimezones.push(timezone);

      this.emit("timezone:added", {
        userId,
        timezone,
      });
    }
  }

  // Get user timezone
  getUserTimezone(userId: string): UserTimezone | undefined {
    return this.userTimezones.get(userId);
  }

  // Convert time between timezones
  convertTime(
    sourceTime: Date,
    sourceTimezone: string,
    targetTimezone: string,
  ): TimezoneConversion {
    const sourceOffset = this.getTimezoneOffset(sourceTimezone);
    const targetOffset = this.getTimezoneOffset(targetTimezone);

    const offsetDifference = (targetOffset - sourceOffset) * 60 * 1000; // convert to milliseconds

    const targetTime = new Date(sourceTime.getTime() + offsetDifference);

    return {
      sourceTime,
      sourceTimezone,
      targetTime,
      targetTimezone,
      offsetMinutes: targetOffset - sourceOffset,
    };
  }

  // Get timezone offset in minutes
  private getTimezoneOffset(timezone: string): number {
    const tz = this.timezones.get(timezone);
    if (!tz) {
      throw new Error(`Unknown timezone: ${timezone}`);
    }
    return tz.offset;
  }

  // Convert event time for user
  convertEventTime(
    eventTime: Date,
    eventTimezone: string,
    userId: string,
  ): ScheduleInTimezone {
    const userTz = this.userTimezones.get(userId);
    const targetTimezone = userTz?.primaryTimezone || "UTC";

    const conversion = this.convertTime(
      eventTime,
      eventTimezone,
      targetTimezone,
    );

    return {
      scheduleId: `sched_${Date.now()}`,
      eventTitle: "Event",
      originalTime: conversion.sourceTime,
      originalTimezone: conversion.sourceTimezone,
      convertedTime: conversion.targetTime,
      convertedTimezone: conversion.targetTimezone,
    };
  }

  // Get meeting time for multiple timezones
  getMeetingTimeInMultipleTimezones(
    meetingTime: Date,
    sourceTimezone: string,
    targetTimezones: string[],
  ): TimezoneConversion[] {
    return targetTimezones.map((tz) =>
      this.convertTime(meetingTime, sourceTimezone, tz),
    );
  }

  // Check if times overlap across timezones
  checkOverlapAcrossTimezones(
    startTime: Date,
    endTime: Date,
    timezone1: string,
    timezone2: string,
  ): boolean {
    const conversion = this.convertTime(startTime, timezone1, timezone2);
    const convertedEnd = new Date(
      endTime.getTime() + conversion.offsetMinutes * 60 * 1000,
    );

    // Simplified overlap check
    return (
      conversion.targetTime <= convertedEnd &&
      conversion.targetTime >= startTime
    );
  }

  // Find best meeting time across timezones
  findBestMeetingTime(
    userIds: string[],
    duration: number,
    preferredHours: { start: number; end: number } = { start: 9, end: 17 },
  ): { time: Date; suitability: number; timezones: string[] } | null {
    const userTimezones = userIds
      .map((id) => this.userTimezones.get(id)?.primaryTimezone)
      .filter((tz) => tz !== undefined) as string[];

    if (userTimezones.length === 0) return null;

    let bestTime: Date | null = null;
    let bestSuitability = -1;

    // Check next 7 days
    for (let day = 0; day < 7; day++) {
      for (let hour = preferredHours.start; hour < preferredHours.end; hour++) {
        const candidateTime = new Date();
        candidateTime.setDate(candidateTime.getDate() + day);
        candidateTime.setHours(hour, 0, 0, 0);

        let suitability = 0;
        let allSuitable = true;

        for (const tz of userTimezones) {
          const conversion = this.convertTime(candidateTime, "UTC", tz);
          const userHour = conversion.targetTime.getHours();

          // Check if within preferred hours for each user
          if (
            userHour >= preferredHours.start &&
            userHour < preferredHours.end
          ) {
            suitability += 10;
          } else if (userHour >= 8 && userHour <= 20) {
            suitability += 5;
            allSuitable = false;
          } else {
            allSuitable = false;
            suitability -= 10;
          }
        }

        if (suitability > bestSuitability) {
          bestSuitability = suitability;
          bestTime = candidateTime;
        }

        if (allSuitable && suitability > 40) {
          break;
        }
      }
    }

    if (!bestTime) return null;

    return {
      time: bestTime,
      suitability: bestSuitability,
      timezones: userTimezones,
    };
  }

  // Get timezone info
  getTimezoneInfo(
    timezone: string,
  ): { offset: number; name: string; abbreviation: string } | null {
    return this.timezones.get(timezone) || null;
  }

  // Get all timezones
  getAllTimezones(): Array<{
    id: string;
    name: string;
    offset: number;
    abbreviation: string;
  }> {
    return Array.from(this.timezones.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      offset: info.offset,
      abbreviation: info.abbreviation,
    }));
  }

  // Format time with timezone
  formatTimeWithTimezone(
    date: Date,
    timezone: string,
    format: "12h" | "24h" = "24h",
  ): string {
    const tz = this.timezones.get(timezone);
    if (!tz) {
      return "Invalid timezone";
    }

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    if (format === "12h") {
      const hour12 = date.getHours() % 12 || 12;
      const period = date.getHours() >= 12 ? "PM" : "AM";
      return `${month}/${day}/${year} ${hour12.toString().padStart(2, "0")}:${minutes} ${period} ${tz.abbreviation}`;
    }

    return `${year}-${month}-${day} ${hours}:${minutes} ${tz.abbreviation}`;
  }

  // Detect timezone from coordinates (simplified)
  detectTimezoneFromCoordinates(latitude: number, longitude: number): string {
    // Simplified timezone detection based on longitude
    if (longitude < -120) return "America/Los_Angeles";
    if (longitude < -90) return "America/Chicago";
    if (longitude < -60) return "America/New_York";
    if (longitude < 0) return "Europe/London";
    if (longitude < 30) return "Europe/Paris";
    if (longitude < 60) return "Europe/Moscow";
    if (longitude < 120) return "Asia/Shanghai";
    if (longitude < 150) return "Asia/Tokyo";
    return "Australia/Sydney";
  }

  // Get current time in timezone
  getCurrentTimeInTimezone(timezone: string): Date {
    const utcTime = new Date();
    const offset = this.getTimezoneOffset(timezone);
    return new Date(utcTime.getTime() + offset * 60 * 1000);
  }
}

export const timezoneService = new TimezoneService();

export default TimezoneService;
