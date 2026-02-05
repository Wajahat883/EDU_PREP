import axios, { AxiosInstance } from "axios";

export interface GoogleClassroom {
  id: string;
  name: string;
  description: string;
  enrollmentCode: string;
}

export interface GoogleStudent {
  userId: string;
  fullName: string;
  emailAddress: string;
}

export interface GoogleAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
}

export class GoogleClassroomIntegration {
  private api: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: "https://classroom.googleapis.com/v1",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async listCourses(): Promise<GoogleClassroom[]> {
    try {
      const response = await this.api.get("/courses", {
        params: {
          courseStates: ["ACTIVE"],
          pageSize: 50,
        },
      });
      return response.data.courses || [];
    } catch (error) {
      console.error("Failed to list courses:", error);
      throw error;
    }
  }

  async getCourse(courseId: string): Promise<GoogleClassroom> {
    try {
      const response = await this.api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get course ${courseId}:`, error);
      throw error;
    }
  }

  async listStudents(courseId: string): Promise<GoogleStudent[]> {
    try {
      const response = await this.api.get(`/courses/${courseId}/students`, {
        params: { pageSize: 100 },
      });
      return response.data.students || [];
    } catch (error) {
      console.error(`Failed to list students for course ${courseId}:`, error);
      throw error;
    }
  }

  async createCourseWork(
    courseId: string,
    assignment: {
      title: string;
      description: string;
      dueDate: string;
      maxPoints: number;
    },
  ): Promise<GoogleAssignment> {
    try {
      const response = await this.api.post(`/courses/${courseId}/courseWork`, {
        title: assignment.title,
        description: assignment.description,
        dueDate: new Date(assignment.dueDate),
        maxPoints: assignment.maxPoints,
        workType: "ASSIGNMENT",
        submissionModificationMode: "MODIFIABLE_UNTIL_TURNED_IN",
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create course work:", error);
      throw error;
    }
  }

  async listAssignments(courseId: string): Promise<GoogleAssignment[]> {
    try {
      const response = await this.api.get(`/courses/${courseId}/courseWork`, {
        params: { pageSize: 100 },
      });
      return response.data.courseWork || [];
    } catch (error) {
      console.error(
        `Failed to list assignments for course ${courseId}:`,
        error,
      );
      throw error;
    }
  }

  async postGrade(
    courseId: string,
    assignmentId: string,
    userId: string,
    score: number,
    maxPoints: number,
  ): Promise<void> {
    try {
      await this.api.patch(
        `/courses/${courseId}/courseWork/${assignmentId}/studentSubmissions/${userId}`,
        {
          assignedGrade: score,
          draftGrade: score,
        },
      );
    } catch (error) {
      console.error("Failed to post grade:", error);
      throw error;
    }
  }

  async syncEnrollments(
    courseId: string,
    eduPrepCourseId: string,
  ): Promise<any> {
    try {
      const students = await this.listStudents(courseId);
      return {
        courseId: eduPrepCourseId,
        syncedStudents: students.length,
        students: students.map((s) => ({
          googleId: s.userId,
          email: s.emailAddress,
          name: s.fullName,
        })),
      };
    } catch (error) {
      console.error("Failed to sync enrollments:", error);
      throw error;
    }
  }
}

export class CanvasIntegration {
  private api: AxiosInstance;
  private baseURL: string;
  private accessToken: string;

  constructor(baseURL: string, accessToken: string) {
    this.baseURL = baseURL;
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async listCourses(): Promise<any[]> {
    try {
      const response = await this.api.get("/courses", {
        params: { include: ["term", "total_students"] },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to list Canvas courses:", error);
      throw error;
    }
  }

  async getCourse(courseId: string): Promise<any> {
    try {
      const response = await this.api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get Canvas course ${courseId}:`, error);
      throw error;
    }
  }

  async listStudents(courseId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/courses/${courseId}/users`, {
        params: { enrollment_type: ["student"], include: ["email"] },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list Canvas students for course ${courseId}:`,
        error,
      );
      throw error;
    }
  }

  async createAssignment(
    courseId: string,
    assignment: {
      name: string;
      description: string;
      dueDate: string;
      pointsPossible: number;
    },
  ): Promise<any> {
    try {
      const response = await this.api.post(`/courses/${courseId}/assignments`, {
        assignment: {
          name: assignment.name,
          description: assignment.description,
          due_at: new Date(assignment.dueDate).toISOString(),
          points_possible: assignment.pointsPossible,
          submission_types: ["online_text_entry", "online_upload"],
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create Canvas assignment:", error);
      throw error;
    }
  }

  async postGrade(
    courseId: string,
    assignmentId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    try {
      await this.api.put(
        `/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`,
        {
          submission: { posted_grade: score },
        },
      );
    } catch (error) {
      console.error("Failed to post Canvas grade:", error);
      throw error;
    }
  }

  async syncEnrollments(
    courseId: string,
    eduPrepCourseId: string,
  ): Promise<any> {
    try {
      const students = await this.listStudents(courseId);
      return {
        courseId: eduPrepCourseId,
        syncedStudents: students.length,
        students: students.map((s) => ({
          canvasId: s.id,
          email: s.email,
          name: s.name,
        })),
      };
    } catch (error) {
      console.error("Failed to sync Canvas enrollments:", error);
      throw error;
    }
  }
}

export class BlackboardIntegration {
  private api: AxiosInstance;
  private baseURL: string;
  private accessToken: string;

  constructor(baseURL: string, accessToken: string) {
    this.baseURL = baseURL;
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: `${baseURL}/api`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async listCourses(): Promise<any[]> {
    try {
      const response = await this.api.get("/v1/courses");
      return response.data.results || [];
    } catch (error) {
      console.error("Failed to list Blackboard courses:", error);
      throw error;
    }
  }

  async listStudents(courseId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/v1/courses/${courseId}/users`);
      return response.data.results || [];
    } catch (error) {
      console.error(
        `Failed to list Blackboard students for course ${courseId}:`,
        error,
      );
      throw error;
    }
  }

  async createAssignment(
    courseId: string,
    assignment: {
      title: string;
      description: string;
      dueDate: string;
      pointsPossible: number;
    },
  ): Promise<any> {
    try {
      const response = await this.api.post(
        `/v1/courses/${courseId}/assignments`,
        {
          title: assignment.title,
          description: assignment.description,
          dueDate: new Date(assignment.dueDate).toISOString(),
          pointsPossible: assignment.pointsPossible,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create Blackboard assignment:", error);
      throw error;
    }
  }

  async postGrade(
    courseId: string,
    assignmentId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    try {
      await this.api.post(
        `/v1/courses/${courseId}/assignments/${assignmentId}/grades`,
        {
          userId,
          score,
        },
      );
    } catch (error) {
      console.error("Failed to post Blackboard grade:", error);
      throw error;
    }
  }

  async syncEnrollments(
    courseId: string,
    eduPrepCourseId: string,
  ): Promise<any> {
    try {
      const students = await this.listStudents(courseId);
      return {
        courseId: eduPrepCourseId,
        syncedStudents: students.length,
        students: students.map((s) => ({
          blackboardId: s.id,
          email: s.email,
          name: s.name,
        })),
      };
    } catch (error) {
      console.error("Failed to sync Blackboard enrollments:", error);
      throw error;
    }
  }
}

export default {
  GoogleClassroom: GoogleClassroomIntegration,
  Canvas: CanvasIntegration,
  Blackboard: BlackboardIntegration,
};
