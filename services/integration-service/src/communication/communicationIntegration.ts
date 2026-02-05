import axios, { AxiosInstance } from "axios";
import { EventEmitter } from "events";

export interface ZoomMeeting {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  start_time: string;
  duration: number;
  join_url: string;
  password?: string;
}

export class ZoomIntegration extends EventEmitter {
  private api: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    super();
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: "https://api.zoom.us/v2",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "EduPrep",
      },
    });
  }

  async createMeeting(options: {
    topic: string;
    start_time: string;
    duration: number;
    password?: string;
    settings?: Record<string, any>;
  }): Promise<ZoomMeeting> {
    try {
      const response = await this.api.post("/users/me/meetings", {
        topic: options.topic,
        type: 2, // Scheduled meeting
        start_time: options.start_time,
        duration: options.duration,
        password: options.password,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          use_pmi: false,
          waiting_room: true,
          ...options.settings,
        },
      });

      this.emit("meeting:created", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to create Zoom meeting:", error);
      throw error;
    }
  }

  async getMeeting(meetingId: number): Promise<ZoomMeeting> {
    try {
      const response = await this.api.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get Zoom meeting ${meetingId}:`, error);
      throw error;
    }
  }

  async updateMeeting(
    meetingId: number,
    options: Record<string, any>,
  ): Promise<void> {
    try {
      await this.api.patch(`/meetings/${meetingId}`, options);
      this.emit("meeting:updated", { meetingId, ...options });
    } catch (error) {
      console.error(`Failed to update Zoom meeting ${meetingId}:`, error);
      throw error;
    }
  }

  async deleteMeeting(meetingId: number): Promise<void> {
    try {
      await this.api.delete(`/meetings/${meetingId}`);
      this.emit("meeting:deleted", { meetingId });
    } catch (error) {
      console.error(`Failed to delete Zoom meeting ${meetingId}:`, error);
      throw error;
    }
  }

  async listMeetings(pageSize: number = 30): Promise<ZoomMeeting[]> {
    try {
      const response = await this.api.get("/users/me/meetings", {
        params: { page_size: pageSize, type: "scheduled" },
      });
      return response.data.meetings || [];
    } catch (error) {
      console.error("Failed to list Zoom meetings:", error);
      throw error;
    }
  }

  async getMeetingParticipants(meetingId: number): Promise<any[]> {
    try {
      const response = await this.api.get(
        `/meetings/${meetingId}/participants`,
      );
      return response.data.participants || [];
    } catch (error) {
      console.error(
        `Failed to get Zoom meeting ${meetingId} participants:`,
        error,
      );
      throw error;
    }
  }

  async getMeetingRecordings(meetingId: number): Promise<any[]> {
    try {
      const response = await this.api.get(`/meetings/${meetingId}/recordings`);
      return response.data.recordings || [];
    } catch (error) {
      console.error(
        `Failed to get Zoom meeting ${meetingId} recordings:`,
        error,
      );
      throw error;
    }
  }

  async addRegistrant(
    meetingId: number,
    registrant: {
      first_name: string;
      last_name: string;
      email: string;
    },
  ): Promise<any> {
    try {
      const response = await this.api.post(
        `/meetings/${meetingId}/registrants`,
        registrant,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add Zoom meeting registrant:", error);
      throw error;
    }
  }
}

export class TeamsIntegration extends EventEmitter {
  private api: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    super();
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async createMeeting(options: {
    subject: string;
    startDateTime: string;
    endDateTime: string;
    participants?: { email: string; type: string }[];
  }): Promise<any> {
    try {
      const response = await this.api.post("/me/events", {
        subject: options.subject,
        start: { dateTime: options.startDateTime, timeZone: "UTC" },
        end: { dateTime: options.endDateTime, timeZone: "UTC" },
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
        attendees: options.participants?.map((p) => ({
          emailAddress: { address: p.email },
          type: p.type || "required",
        })),
      });

      this.emit("meeting:created", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to create Teams meeting:", error);
      throw error;
    }
  }

  async getMeeting(eventId: string): Promise<any> {
    try {
      const response = await this.api.get(`/me/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get Teams meeting ${eventId}:`, error);
      throw error;
    }
  }

  async listMeetings(): Promise<any[]> {
    try {
      const response = await this.api.get("/me/events", {
        params: { $filter: "isOnlineMeeting eq true" },
      });
      return response.data.value || [];
    } catch (error) {
      console.error("Failed to list Teams meetings:", error);
      throw error;
    }
  }

  async updateMeeting(
    eventId: string,
    options: Record<string, any>,
  ): Promise<void> {
    try {
      await this.api.patch(`/me/events/${eventId}`, options);
      this.emit("meeting:updated", { eventId, ...options });
    } catch (error) {
      console.error(`Failed to update Teams meeting ${eventId}:`, error);
      throw error;
    }
  }

  async deleteMeeting(eventId: string): Promise<void> {
    try {
      await this.api.delete(`/me/events/${eventId}`);
      this.emit("meeting:deleted", { eventId });
    } catch (error) {
      console.error(`Failed to delete Teams meeting ${eventId}:`, error);
      throw error;
    }
  }
}

export class SlackIntegration extends EventEmitter {
  private api: AxiosInstance;
  private botToken: string;

  constructor(botToken: string) {
    super();
    this.botToken = botToken;
    this.api = axios.create({
      baseURL: "https://slack.com/api",
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
    });
  }

  async sendMessage(channel: string, message: string): Promise<void> {
    try {
      const response = await this.api.post("/chat.postMessage", {
        channel,
        text: message,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.emit("message:sent", { channel, message });
    } catch (error) {
      console.error("Failed to send Slack message:", error);
      throw error;
    }
  }

  async sendNotification(
    channel: string,
    notification: {
      title: string;
      text: string;
      actions?: Record<string, any>[];
    },
  ): Promise<void> {
    try {
      const payload = {
        channel,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: notification.title,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: notification.text,
            },
          },
        ],
      };

      if (notification.actions && notification.actions.length > 0) {
        payload.blocks.push({
          type: "actions",
          elements: notification.actions,
        });
      }

      const response = await this.api.post("/chat.postMessage", payload);

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.emit("notification:sent", notification);
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      throw error;
    }
  }

  async createChannel(
    channelName: string,
    isPrivate: boolean = false,
  ): Promise<any> {
    try {
      const response = await this.api.post("/conversations.create", {
        name: channelName,
        is_private: isPrivate,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.emit("channel:created", response.data.channel);
      return response.data.channel;
    } catch (error) {
      console.error("Failed to create Slack channel:", error);
      throw error;
    }
  }

  async addUserToChannel(channel: string, user: string): Promise<void> {
    try {
      const response = await this.api.post("/conversations.invite", {
        channel,
        users: user,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.emit("user:added", { channel, user });
    } catch (error) {
      console.error("Failed to add user to Slack channel:", error);
      throw error;
    }
  }

  async setChannelTopic(channel: string, topic: string): Promise<void> {
    try {
      const response = await this.api.post("/conversations.setTopic", {
        channel,
        topic,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.emit("channel:updated", { channel, topic });
    } catch (error) {
      console.error("Failed to set Slack channel topic:", error);
      throw error;
    }
  }

  async listChannels(): Promise<any[]> {
    try {
      const response = await this.api.get("/conversations.list");

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      return response.data.channels || [];
    } catch (error) {
      console.error("Failed to list Slack channels:", error);
      throw error;
    }
  }

  setupEventListener(slackEventHandler: (event: any) => void): void {
    // Setup webhook listener for Slack events
    // This would be implemented in the API routes
    this.on("event", slackEventHandler);
  }
}

export default {
  Zoom: ZoomIntegration,
  Teams: TeamsIntegration,
  Slack: SlackIntegration,
};
