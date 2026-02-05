import { EventEmitter } from "events";

export interface CourseListing {
  courseId: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description: string;
  category: string;
  subcategories: string[];
  thumbnail: string;
  price: number;
  originalPrice?: number;
  discount?: number; // 0-100
  level: "beginner" | "intermediate" | "advanced" | "expert";
  duration: number; // hours
  lessonsCount: number;
  enrolledCount: number;
  rating: number;
  ratingCount: number;
  language: string;
  createdDate: Date;
  lastUpdated: Date;
  status: "draft" | "published" | "archived";
  tags: string[];
  prerequisites?: string[];
  learningOutcomes: string[];
  isPromoted: boolean;
  promotionEndDate?: Date;
}

export interface CourseLesson {
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration: number; // seconds
  resources: string[]; // URLs
  quiz?: {
    questions: Array<{
      id: string;
      text: string;
      answers: string[];
      correctAnswer: number;
    }>;
    passingScore: number;
  };
  order: number;
  isVisible: boolean;
}

export interface Enrollment {
  enrollmentId: string;
  courseId: string;
  studentId: string;
  enrolledDate: Date;
  completedDate?: Date;
  status: "active" | "completed" | "cancelled";
  progress: number; // 0-100
  certificateId?: string;
  lessonsCompleted: number;
  totalLessons: number;
  avgQuizScore: number;
}

export interface CourseCertificate {
  certificateId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  issuedDate: Date;
  expiresDate?: Date;
  verificationCode: string;
  certificateUrl: string;
}

export class CourseListingService extends EventEmitter {
  private courses: Map<string, CourseListing> = new Map();
  private lessons: Map<string, CourseLesson[]> = new Map();
  private enrollments: Map<string, Enrollment[]> = new Map();
  private certificates: Map<string, CourseCertificate[]> = new Map();
  private courseReviews: Map<
    string,
    Array<{ studentId: string; rating: number; text: string; date: Date }>
  > = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const categories = [
      "Math",
      "Science",
      "Languages",
      "Programming",
      "Business",
      "Arts",
      "Test Prep",
    ];
    categories.forEach((cat) => {
      this.searchIndex.set(cat.toLowerCase(), new Set());
    });
  }

  // Create course listing
  createCourseListing(
    instructorId: string,
    instructorName: string,
    title: string,
    description: string,
    category: string,
    price: number,
    level: CourseListing["level"],
  ): CourseListing {
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const course: CourseListing = {
      courseId,
      instructorId,
      instructorName,
      title,
      description,
      category,
      subcategories: [],
      thumbnail: `https://thumbnails.example.com/${courseId}`,
      price,
      level,
      duration: 0,
      lessonsCount: 0,
      enrolledCount: 0,
      rating: 0,
      ratingCount: 0,
      language: "English",
      createdDate: new Date(),
      lastUpdated: new Date(),
      status: "draft",
      tags: [],
      learningOutcomes: [],
      isPromoted: false,
    };

    this.courses.set(courseId, course);
    this.lessons.set(courseId, []);
    this.enrollments.set(courseId, []);
    this.certificates.set(courseId, []);
    this.courseReviews.set(courseId, []);

    // Index by category
    const catLower = category.toLowerCase();
    const courseSet = this.searchIndex.get(catLower) || new Set();
    courseSet.add(courseId);
    this.searchIndex.set(catLower, courseSet);

    this.emit("course:created", {
      courseId,
      title,
      instructorName,
      price,
    });

    return course;
  }

  // Publish course
  publishCourse(courseId: string): void {
    const course = this.courses.get(courseId);
    if (!course) return;

    if (course.lessonsCount === 0) {
      throw new Error("Course must have at least one lesson");
    }

    course.status = "published";
    course.lastUpdated = new Date();

    this.emit("course:published", {
      courseId,
      title: course.title,
      publishDate: course.lastUpdated,
    });
  }

  // Add lesson
  addLesson(
    courseId: string,
    title: string,
    description: string,
    videoUrl: string,
    videoDuration: number,
    resources: string[] = [],
  ): CourseLesson {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lessons = this.lessons.get(courseId) || [];

    const lesson: CourseLesson = {
      lessonId,
      courseId,
      title,
      description,
      videoUrl,
      videoDuration,
      resources,
      order: lessons.length + 1,
      isVisible: true,
    };

    lessons.push(lesson);
    this.lessons.set(courseId, lessons);

    course.lessonsCount++;
    course.duration += videoDuration / 3600; // Convert to hours
    course.lastUpdated = new Date();

    this.emit("lesson:added", {
      lessonId,
      courseId,
      title,
      order: lesson.order,
    });

    return lesson;
  }

  // Get lessons
  getCourseLessons(courseId: string): CourseLesson[] {
    return this.lessons.get(courseId) || [];
  }

  // Search courses
  searchCourses(
    query: string,
    category?: string,
    level?: string,
    maxPrice?: number,
    minRating?: number,
    limit: number = 50,
  ): CourseListing[] {
    let results: CourseListing[] = [];

    if (category) {
      const catLower = category.toLowerCase();
      const courseIds = this.searchIndex.get(catLower) || new Set();
      results = Array.from(courseIds)
        .map((id) => this.courses.get(id))
        .filter((c) => c && c.status === "published") as CourseListing[];
    } else {
      results = Array.from(this.courses.values()).filter(
        (c) => c.status === "published",
      );
    }

    // Apply filters
    if (level) {
      results = results.filter((c) => c.level === level);
    }
    if (maxPrice) {
      results = results.filter((c) => (c.originalPrice || c.price) <= maxPrice);
    }
    if (minRating) {
      results = results.filter((c) => c.rating >= minRating);
    }

    // Full-text search
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(queryLower) ||
          c.description.toLowerCase().includes(queryLower) ||
          c.tags.some((t) => t.toLowerCase().includes(queryLower)),
      );
    }

    // Sort by rating and enrollment
    results.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.enrolledCount - a.enrolledCount;
    });

    return results.slice(0, limit);
  }

  // Enroll student
  enrollStudent(courseId: string, studentId: string): Enrollment {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const enrollmentId = `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const enrollment: Enrollment = {
      enrollmentId,
      courseId,
      studentId,
      enrolledDate: new Date(),
      status: "active",
      progress: 0,
      lessonsCompleted: 0,
      totalLessons: course.lessonsCount,
      avgQuizScore: 0,
    };

    const enrollments = this.enrollments.get(courseId) || [];
    enrollments.push(enrollment);
    this.enrollments.set(courseId, enrollments);

    course.enrolledCount++;

    this.emit("student:enrolled", {
      enrollmentId,
      courseId,
      studentId,
      courseTitle: course.title,
    });

    return enrollment;
  }

  // Update enrollment progress
  updateProgress(
    enrollmentId: string,
    lessonsCompleted: number,
    avgQuizScore: number,
  ): void {
    for (const enrollments of this.enrollments.values()) {
      const enrollment = enrollments.find(
        (e) => e.enrollmentId === enrollmentId,
      );

      if (enrollment) {
        enrollment.lessonsCompleted = lessonsCompleted;
        enrollment.avgQuizScore = avgQuizScore;
        enrollment.progress = Math.floor(
          (lessonsCompleted / enrollment.totalLessons) * 100,
        );

        if (enrollment.progress === 100) {
          enrollment.status = "completed";
          enrollment.completedDate = new Date();

          this.emit("course:completed", {
            enrollmentId,
            courseId: enrollment.courseId,
            studentId: enrollment.studentId,
          });

          // Award certificate
          this.issueCertificate(enrollment.courseId, enrollment.studentId);
        }

        this.emit("progress:updated", {
          enrollmentId,
          progress: enrollment.progress,
          lessonsCompleted,
        });

        return;
      }
    }
  }

  // Issue certificate
  private issueCertificate(courseId: string, studentId: string): void {
    const course = this.courses.get(courseId);
    if (!course) return;

    const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const verificationCode = Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase();

    const certificate: CourseCertificate = {
      certificateId,
      courseId,
      studentId,
      studentName: "", // Would be populated with student data
      issuedDate: new Date(),
      verificationCode,
      certificateUrl: `https://certificates.example.com/${certificateId}`,
    };

    const certificates = this.certificates.get(courseId) || [];
    certificates.push(certificate);
    this.certificates.set(courseId, certificates);

    this.emit("certificate:issued", {
      certificateId,
      courseId,
      studentId,
      verificationCode,
    });
  }

  // Add review
  addReview(
    courseId: string,
    studentId: string,
    rating: number,
    text: string,
  ): void {
    const course = this.courses.get(courseId);
    if (!course) return;

    const reviews = this.courseReviews.get(courseId) || [];
    reviews.push({
      studentId,
      rating,
      text,
      date: new Date(),
    });

    this.courseReviews.set(courseId, reviews);

    // Update course rating
    const totalRating = course.rating * course.ratingCount + rating;
    course.ratingCount++;
    course.rating = totalRating / course.ratingCount;
    course.lastUpdated = new Date();

    this.emit("review:added", {
      courseId,
      rating,
      newAverageRating: course.rating,
    });
  }

  // Get course reviews
  getCourseReviews(
    courseId: string,
  ): Array<{ studentId: string; rating: number; text: string; date: Date }> {
    return this.courseReviews.get(courseId) || [];
  }

  // Get course
  getCourseListing(courseId: string): CourseListing | undefined {
    return this.courses.get(courseId);
  }

  // Get popular courses
  getPopularCourses(limit: number = 10): CourseListing[] {
    return Array.from(this.courses.values())
      .filter((c) => c.status === "published")
      .sort((a, b) => {
        const scoreA = a.rating * 0.5 + (a.enrolledCount / 1000) * 0.5;
        const scoreB = b.rating * 0.5 + (b.enrolledCount / 1000) * 0.5;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Promote course
  promoteCourse(courseId: string, durationDays: number = 7): void {
    const course = this.courses.get(courseId);
    if (!course) return;

    course.isPromoted = true;
    course.promotionEndDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    );

    this.emit("course:promoted", {
      courseId,
      durationDays,
      endDate: course.promotionEndDate,
    });
  }
}

export const courseListingService = new CourseListingService();

export default CourseListingService;
