import { EventEmitter } from "events";

export interface StudyGroup {
  groupId: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  subject: string;
  icon: string;
  members: GroupMember[];
  maxMembers: number;
  isPrivate: boolean;
  createdDate: Date;
  updatedDate: Date;
}

export interface GroupMember {
  userId: string;
  userName: string;
  role: "owner" | "moderator" | "member";
  joinedDate: Date;
  lastActiveDate: Date;
  postCount: number;
}

export interface GroupMessage {
  messageId: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  attachments?: string[];
  reactions: Map<string, string[]>; // emoji -> userIds
  createdDate: Date;
  updatedDate: Date;
  isDeleted: boolean;
}

export interface StudySession {
  sessionId: string;
  groupId: string;
  organizerId: string;
  organizerName: string;
  topic: string;
  description: string;
  scheduledDate: Date;
  duration: number; // minutes
  participants: StudySessionParticipant[];
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  recordingUrl?: string;
  createdDate: Date;
}

export interface StudySessionParticipant {
  userId: string;
  userName: string;
  joinedAt?: Date;
  leftAt?: Date;
  duration: number; // minutes participated
}

export interface GroupAnnouncement {
  announcementId: string;
  groupId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  pinned: boolean;
  createdDate: Date;
}

export class StudyGroupService extends EventEmitter {
  private groups: Map<string, StudyGroup> = new Map();
  private messages: Map<string, GroupMessage[]> = new Map();
  private sessions: Map<string, StudySession[]> = new Map();
  private announcements: Map<string, GroupAnnouncement[]> = new Map();
  private userGroups: Map<string, Set<string>> = new Map(); // userId -> groupIds

  // Create study group
  createGroup(
    ownerId: string,
    ownerName: string,
    name: string,
    description: string,
    subject: string,
    isPrivate: boolean = false,
  ): StudyGroup {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const group: StudyGroup = {
      groupId,
      ownerId,
      ownerName,
      name,
      description,
      subject,
      icon: `https://study.example.com/icons/${groupId}`,
      members: [
        {
          userId: ownerId,
          userName: ownerName,
          role: "owner",
          joinedDate: new Date(),
          lastActiveDate: new Date(),
          postCount: 0,
        },
      ],
      maxMembers: 100,
      isPrivate,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    this.groups.set(groupId, group);
    this.messages.set(groupId, []);
    this.sessions.set(groupId, []);
    this.announcements.set(groupId, []);

    // Track user groups
    const userGroups = this.userGroups.get(ownerId) || new Set();
    userGroups.add(groupId);
    this.userGroups.set(ownerId, userGroups);

    this.emit("group:created", {
      groupId,
      name,
      subject,
      ownerId,
    });

    return group;
  }

  // Join group
  joinGroup(userId: string, userName: string, groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    // Check if already member
    if (group.members.some((m) => m.userId === userId)) {
      return;
    }

    if (group.members.length >= group.maxMembers) {
      throw new Error("Group is full");
    }

    group.members.push({
      userId,
      userName,
      role: "member",
      joinedDate: new Date(),
      lastActiveDate: new Date(),
      postCount: 0,
    });

    group.updatedDate = new Date();

    // Track user groups
    const userGroups = this.userGroups.get(userId) || new Set();
    userGroups.add(groupId);
    this.userGroups.set(userId, userGroups);

    this.emit("member:joined", {
      groupId,
      userId,
      userName,
      totalMembers: group.members.length,
    });
  }

  // Leave group
  leaveGroup(userId: string, groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    const memberIndex = group.members.findIndex((m) => m.userId === userId);
    if (memberIndex === -1) return;

    if (group.members[memberIndex].role === "owner") {
      throw new Error("Owner cannot leave group");
    }

    group.members.splice(memberIndex, 1);
    group.updatedDate = new Date();

    // Remove from user groups tracking
    const userGroups = this.userGroups.get(userId);
    if (userGroups) {
      userGroups.delete(groupId);
    }

    this.emit("member:left", {
      groupId,
      userId,
      totalMembers: group.members.length,
    });
  }

  // Add message
  addMessage(
    groupId: string,
    authorId: string,
    authorName: string,
    content: string,
  ): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: GroupMessage = {
      messageId,
      groupId,
      authorId,
      authorName,
      content,
      reactions: new Map(),
      createdDate: new Date(),
      updatedDate: new Date(),
      isDeleted: false,
    };

    const messages = this.messages.get(groupId) || [];
    messages.push(message);
    this.messages.set(groupId, messages);

    // Update member post count
    const member = group.members.find((m) => m.userId === authorId);
    if (member) {
      member.postCount++;
      member.lastActiveDate = new Date();
    }

    this.emit("message:added", {
      messageId,
      groupId,
      authorName,
      contentLength: content.length,
    });
  }

  // Add reaction
  addReaction(messageId: string, userId: string, emoji: string): void {
    for (const messages of this.messages.values()) {
      const message = messages.find((m) => m.messageId === messageId);
      if (message) {
        const userIds = message.reactions.get(emoji) || [];
        if (!userIds.includes(userId)) {
          userIds.push(userId);
          message.reactions.set(emoji, userIds);
        }
        return;
      }
    }
  }

  // Create study session
  createStudySession(
    groupId: string,
    organizerId: string,
    organizerName: string,
    topic: string,
    description: string,
    scheduledDate: Date,
    duration: number,
  ): StudySession {
    const group = this.groups.get(groupId);
    if (!group) return {} as StudySession;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: StudySession = {
      sessionId,
      groupId,
      organizerId,
      organizerName,
      topic,
      description,
      scheduledDate,
      duration,
      participants: [
        {
          userId: organizerId,
          userName: organizerName,
          duration: 0,
        },
      ],
      status: "scheduled",
      createdDate: new Date(),
    };

    const sessions = this.sessions.get(groupId) || [];
    sessions.push(session);
    this.sessions.set(groupId, sessions);

    this.emit("session:created", {
      sessionId,
      groupId,
      topic,
      scheduledDate,
    });

    return session;
  }

  // Start study session
  startStudySession(sessionId: string): void {
    for (const sessions of this.sessions.values()) {
      const session = sessions.find((s) => s.sessionId === sessionId);
      if (session) {
        session.status = "in-progress";

        this.emit("session:started", {
          sessionId,
          topic: session.topic,
          participantCount: session.participants.length,
        });
        return;
      }
    }
  }

  // Join study session
  joinStudySession(sessionId: string, userId: string, userName: string): void {
    for (const sessions of this.sessions.values()) {
      const session = sessions.find((s) => s.sessionId === sessionId);
      if (session) {
        if (!session.participants.some((p) => p.userId === userId)) {
          session.participants.push({
            userId,
            userName,
            joinedAt: new Date(),
            duration: 0,
          });
        }

        this.emit("session:participant-joined", {
          sessionId,
          userId,
          userName,
          totalParticipants: session.participants.length,
        });
        return;
      }
    }
  }

  // End study session
  endStudySession(sessionId: string): void {
    for (const sessions of this.sessions.values()) {
      const session = sessions.find((s) => s.sessionId === sessionId);
      if (session) {
        session.status = "completed";

        // Calculate duration for each participant
        const sessionStart = new Date(session.scheduledDate);
        for (const participant of session.participants) {
          if (participant.leftAt) {
            participant.duration = Math.round(
              (participant.leftAt.getTime() -
                (participant.joinedAt?.getTime() || sessionStart.getTime())) /
                60000,
            );
          } else {
            participant.duration = Math.round(
              (new Date().getTime() -
                (participant.joinedAt?.getTime() || sessionStart.getTime())) /
                60000,
            );
          }
        }

        const totalDuration =
          session.participants.reduce((sum, p) => sum + p.duration, 0) /
          session.participants.length;

        this.emit("session:ended", {
          sessionId,
          topic: session.topic,
          participantCount: session.participants.length,
          averageDuration: totalDuration,
        });
        return;
      }
    }
  }

  // Create announcement
  createAnnouncement(
    groupId: string,
    authorId: string,
    authorName: string,
    title: string,
    content: string,
  ): void {
    const announcementId = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const announcement: GroupAnnouncement = {
      announcementId,
      groupId,
      authorId,
      authorName,
      title,
      content,
      pinned: false,
      createdDate: new Date(),
    };

    const announcements = this.announcements.get(groupId) || [];
    announcements.push(announcement);
    this.announcements.set(groupId, announcements);

    this.emit("announcement:created", {
      announcementId,
      groupId,
      title,
      authorName,
    });
  }

  // Pin announcement
  pinAnnouncement(announcementId: string): void {
    for (const announcements of this.announcements.values()) {
      const ann = announcements.find(
        (a) => a.announcementId === announcementId,
      );
      if (ann) {
        ann.pinned = true;

        this.emit("announcement:pinned", {
          announcementId,
          title: ann.title,
        });
        return;
      }
    }
  }

  // Get group
  getGroup(groupId: string): StudyGroup | undefined {
    return this.groups.get(groupId);
  }

  // Get group messages
  getGroupMessages(groupId: string, limit: number = 50): GroupMessage[] {
    const messages = this.messages.get(groupId) || [];
    return messages.slice(-limit);
  }

  // Get group sessions
  getGroupSessions(groupId: string): StudySession[] {
    return this.sessions.get(groupId) || [];
  }

  // Get announcements
  getAnnouncements(groupId: string): GroupAnnouncement[] {
    const announcements = this.announcements.get(groupId) || [];
    return announcements.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      return b.createdDate.getTime() - a.createdDate.getTime();
    });
  }

  // Get user groups
  getUserGroups(userId: string): StudyGroup[] {
    const groupIds = this.userGroups.get(userId) || new Set();
    return Array.from(groupIds)
      .map((id) => this.groups.get(id))
      .filter((g) => g !== undefined) as StudyGroup[];
  }
}

export const studyGroupService = new StudyGroupService();

export default StudyGroupService;
