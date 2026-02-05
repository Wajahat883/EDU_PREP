import { EventEmitter } from "events";

export interface LiveClass {
  classId: string;
  courseId: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  roomId: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  maxStudents: number;
  enrolledStudents: string[];
  attendedStudents: string[];
  recordingId?: string;
  isRecorded: boolean;
  materials?: string[]; // URLs to slides, documents
  topics: string[];
  syllabus?: string;
}

export interface ClassAttendance {
  attendanceId: string;
  classId: string;
  studentId: string;
  joinTime: Date;
  leaveTime?: Date;
  participationScore: number; // 0-100
  engagementLevel: "high" | "medium" | "low";
  questionsAsked: number;
  answered: number;
  isPresent: boolean;
  notes?: string;
}

export interface ClassAssignment {
  assignmentId: string;
  classId: string;
  title: string;
  description: string;
  dueDate: Date;
  createdDate: Date;
  points: number;
  submissions: ClassSubmission[];
}

export interface ClassSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  submittedDate: Date;
  content: string;
  attachments: string[];
  score?: number;
  feedback?: string;
  gradeDate?: Date;
}

export interface ClassSchedule {
  scheduleId: string;
  instructorId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  courseId: string;
  timezone: string;
  recurring: boolean;
  recurrenceEndDate?: Date;
}

export class LiveClassService extends EventEmitter {
  private classes: Map<string, LiveClass> = new Map();
  private attendance: Map<string, ClassAttendance[]> = new Map();
  private assignments: Map<string, ClassAssignment[]> = new Map();
  private schedules: Map<string, ClassSchedule> = new Map();
  private classRecordings: Map<
    string,
    { recordingId: string; duration: number }
  > = new Map();

  constructor() {
    super();
  }

  // Create live class
  createLiveClass(
    courseId: string,
    instructorId: string,
    instructorName: string,
    title: string,
    description: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    maxStudents: number = 100,
  ): LiveClass {
    const classId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const liveClass: LiveClass = {
      classId,
      courseId,
      instructorId,
      instructorName,
      title,
      description,
      scheduledStart,
      scheduledEnd,
      roomId,
      status: "scheduled",
      maxStudents,
      enrolledStudents: [instructorId], // Instructor is enrolled
      attendedStudents: [],
      isRecorded: false,
      materials: [],
      topics: [],
    };

    this.classes.set(classId, liveClass);
    this.attendance.set(classId, []);
    this.assignments.set(classId, []);

    this.emit("class:created", {
      classId,
      title,
      instructorName,
      scheduledStart,
      maxStudents,
    });

    return liveClass;
  }

  // Enroll student
  enrollStudent(classId: string, studentId: string, studentName: string): void {
    const liveClass = this.classes.get(classId);
    if (!liveClass) {
      throw new Error("Class not found");
    }

    if (liveClass.enrolledStudents.length >= liveClass.maxStudents) {
      throw new Error("Class is full");
    }

    if (!liveClass.enrolledStudents.includes(studentId)) {
      liveClass.enrolledStudents.push(studentId);

      this.emit("student:enrolled", {
        classId,
        studentId,
        studentName,
        totalEnrolled: liveClass.enrolledStudents.length,
      });
    }
  }

  // Start class
  startClass(classId: string): void {
    const liveClass = this.classes.get(classId);
    if (!liveClass) {
      throw new Error("Class not found");
    }

    liveClass.status = "in-progress";
    liveClass.actualStart = new Date();

    this.emit("class:started", {
      classId,
      title: liveClass.title,
      startTime: liveClass.actualStart,
      enrolledStudents: liveClass.enrolledStudents.length,
    });
  }

  // Record attendance
  recordAttendance(classId: string, studentId: string): void {
    const liveClass = this.classes.get(classId);
    if (!liveClass) return;

    if (!liveClass.attendedStudents.includes(studentId)) {
      liveClass.attendedStudents.push(studentId);
    }

    const attendanceRecords = this.attendance.get(classId) || [];
    const existing = attendanceRecords.find((a) => a.studentId === studentId);

    if (!existing) {
      const record: ClassAttendance = {
        attendanceId: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        classId,
        studentId,
        joinTime: new Date(),
        participationScore: 0,
        engagementLevel: "medium",
        questionsAsked: 0,
        answered: 0,
        isPresent: true,
      };

      attendanceRecords.push(record);
      this.attendance.set(classId, attendanceRecords);

      this.emit("attendance:recorded", {
        classId,
        studentId,
        joinTime: record.joinTime,
      });
    }
  }

  // Update participation
  updateParticipation(
    classId: string,
    studentId: string,
    questionsAsked: number,
    answered: number,
    engagementLevel: "high" | "medium" | "low",
  ): void {
    const attendanceRecords = this.attendance.get(classId) || [];
    const record = attendanceRecords.find((a) => a.studentId === studentId);

    if (record) {
      record.questionsAsked = questionsAsked;
      record.answered = answered;
      record.engagementLevel = engagementLevel;

      // Calculate participation score
      record.participationScore = questionsAsked * 5 + answered * 10;
      record.participationScore = Math.min(100, record.participationScore);

      this.emit("participation:updated", {
        classId,
        studentId,
        participationScore: record.participationScore,
      });
    }
  }

  // End class
  endClass(classId: string): { duration: number; attendanceCount: number } {
    const liveClass = this.classes.get(classId);
    if (!liveClass) {
      throw new Error("Class not found");
    }

    liveClass.status = "completed";
    liveClass.actualEnd = new Date();

    const duration = Math.floor(
      (liveClass.actualEnd.getTime() -
        (liveClass.actualStart?.getTime() || 0)) /
        1000,
    );

    const attendanceRecords = this.attendance.get(classId) || [];
    for (const record of attendanceRecords) {
      if (!record.leaveTime) {
        record.leaveTime = liveClass.actualEnd;
      }
    }

    this.emit("class:ended", {
      classId,
      title: liveClass.title,
      duration,
      attendanceCount: liveClass.attendedStudents.length,
      totalEnrolled: liveClass.enrolledStudents.length,
    });

    return {
      duration,
      attendanceCount: liveClass.attendedStudents.length,
    };
  }

  // Start recording
  startRecording(classId: string): { recordingId: string } {
    const liveClass = this.classes.get(classId);
    if (!liveClass) {
      throw new Error("Class not found");
    }

    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    liveClass.recordingId = recordingId;
    liveClass.isRecorded = true;

    this.emit("recording:started", {
      classId,
      recordingId,
    });

    return { recordingId };
  }

  // Stop recording
  stopRecording(classId: string): void {
    const liveClass = this.classes.get(classId);
    if (!liveClass) return;

    if (liveClass.recordingId) {
      const duration = liveClass.actualEnd
        ? Math.floor(
            (liveClass.actualEnd.getTime() -
              (liveClass.actualStart?.getTime() || 0)) /
              1000,
          )
        : 0;

      this.classRecordings.set(liveClass.recordingId, {
        recordingId: liveClass.recordingId,
        duration,
      });

      this.emit("recording:stopped", {
        classId,
        recordingId: liveClass.recordingId,
        duration,
      });
    }
  }

  // Create assignment
  createAssignment(
    classId: string,
    title: string,
    description: string,
    dueDate: Date,
    points: number = 100,
  ): ClassAssignment {
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const assignment: ClassAssignment = {
      assignmentId,
      classId,
      title,
      description,
      dueDate,
      createdDate: new Date(),
      points,
      submissions: [],
    };

    const assignments = this.assignments.get(classId) || [];
    assignments.push(assignment);
    this.assignments.set(classId, assignments);

    this.emit("assignment:created", {
      assignmentId,
      classId,
      title,
      dueDate,
      points,
    });

    return assignment;
  }

  // Submit assignment
  submitAssignment(
    classId: string,
    assignmentId: string,
    studentId: string,
    content: string,
    attachments: string[] = [],
  ): ClassSubmission {
    const assignments = this.assignments.get(classId) || [];
    const assignment = assignments.find((a) => a.assignmentId === assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const submission: ClassSubmission = {
      submissionId,
      assignmentId,
      studentId,
      submittedDate: new Date(),
      content,
      attachments,
    };

    assignment.submissions.push(submission);

    this.emit("assignment:submitted", {
      submissionId,
      assignmentId,
      studentId,
      submittedDate: submission.submittedDate,
    });

    return submission;
  }

  // Grade submission
  gradeSubmission(
    classId: string,
    assignmentId: string,
    submissionId: string,
    score: number,
    feedback: string,
  ): void {
    const assignments = this.assignments.get(classId) || [];
    const assignment = assignments.find((a) => a.assignmentId === assignmentId);

    if (!assignment) return;

    const submission = assignment.submissions.find(
      (s) => s.submissionId === submissionId,
    );

    if (submission) {
      submission.score = score;
      submission.feedback = feedback;
      submission.gradeDate = new Date();

      this.emit("submission:graded", {
        submissionId,
        score,
        totalPoints: assignment.points,
        percentage: (score / assignment.points) * 100,
      });
    }
  }

  // Create schedule
  createSchedule(
    instructorId: string,
    courseId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    timezone: string,
    recurring: boolean = true,
  ): ClassSchedule {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const schedule: ClassSchedule = {
      scheduleId,
      instructorId,
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      timezone,
      recurring,
    };

    this.schedules.set(scheduleId, schedule);

    this.emit("schedule:created", {
      scheduleId,
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      recurring,
    });

    return schedule;
  }

  // Get class
  getClass(classId: string): LiveClass | undefined {
    return this.classes.get(classId);
  }

  // Get attendance records
  getAttendanceRecords(classId: string): ClassAttendance[] {
    return this.attendance.get(classId) || [];
  }

  // Get assignments
  getAssignments(classId: string): ClassAssignment[] {
    return this.assignments.get(classId) || [];
  }

  // Get classes by instructor
  getInstructorClasses(instructorId: string): LiveClass[] {
    return Array.from(this.classes.values()).filter(
      (c) => c.instructorId === instructorId,
    );
  }

  // Get class analytics
  getClassAnalytics(classId: string): {
    enrollmentRate: number;
    attendanceRate: number;
    averageParticipation: number;
    assignmentSubmissionRate: number;
    averageScore: number;
  } {
    const liveClass = this.classes.get(classId);
    if (!liveClass) {
      return {
        enrollmentRate: 0,
        attendanceRate: 0,
        averageParticipation: 0,
        assignmentSubmissionRate: 0,
        averageScore: 0,
      };
    }

    const enrollmentRate =
      (liveClass.attendedStudents.length / liveClass.enrolledStudents.length) *
        100 || 0;
    const attendanceRecords = this.attendance.get(classId) || [];
    const avgParticipation =
      attendanceRecords.length > 0
        ? attendanceRecords.reduce((sum, a) => sum + a.participationScore, 0) /
          attendanceRecords.length
        : 0;

    const assignments = this.assignments.get(classId) || [];
    const totalSubmissions = assignments.reduce(
      (sum, a) => sum + a.submissions.length,
      0,
    );
    const totalAssignments = assignments.reduce(
      (sum, a) => sum + a.submissions.length,
      0,
    );
    const submissionRate =
      totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0;

    const scores = assignments
      .flatMap((a) => a.submissions.map((s) => s.score || 0))
      .filter((s) => s > 0);
    const avgScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    return {
      enrollmentRate,
      attendanceRate: enrollmentRate,
      averageParticipation: avgParticipation,
      assignmentSubmissionRate: submissionRate,
      averageScore: avgScore,
    };
  }
}

export const liveClassService = new LiveClassService();

export default LiveClassService;
