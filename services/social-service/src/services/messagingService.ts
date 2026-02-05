import { EventEmitter } from "events";

export interface DirectMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  readAt?: Date;
  createdDate: Date;
  updatedDate: Date;
  isDeleted: boolean;
}

export interface Conversation {
  conversationId: string;
  participantIds: string[];
  participantNames: Map<string, string>;
  lastMessage?: DirectMessage;
  unreadCount: Map<string, number>; // userId -> unreadCount
  createdDate: Date;
  updatedDate: Date;
}

export interface MessageAttachment {
  attachmentId: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadDate: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface MessageSearch {
  results: DirectMessage[];
  totalCount: number;
  query: string;
}

export class MessagingService extends EventEmitter {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, DirectMessage[]> = new Map();
  private attachments: Map<string, MessageAttachment[]> = new Map();
  private userConversations: Map<string, Set<string>> = new Map(); // userId -> conversationIds
  private typingUsers: Map<string, TypingIndicator> = new Map();
  private messageHistory: Map<string, Map<string, number>> = new Map(); // userId -> messageId -> timestamp

  // Create or get conversation
  getOrCreateConversation(
    userId1: string,
    userName1: string,
    userId2: string,
    userName2: string,
  ): Conversation {
    // Check if conversation exists
    const userConvs = this.userConversations.get(userId1) || new Set();

    for (const convId of userConvs) {
      const conv = this.conversations.get(convId);
      if (conv && conv.participantIds.includes(userId2)) {
        return conv;
      }
    }

    // Create new conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const participantNames = new Map<string, string>();
    participantNames.set(userId1, userName1);
    participantNames.set(userId2, userName2);

    const conversation: Conversation = {
      conversationId,
      participantIds: [userId1, userId2],
      participantNames,
      unreadCount: new Map([
        [userId1, 0],
        [userId2, 0],
      ]),
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    this.conversations.set(conversationId, conversation);
    this.messages.set(conversationId, []);

    // Track conversations for both users
    const user1Convs = this.userConversations.get(userId1) || new Set();
    user1Convs.add(conversationId);
    this.userConversations.set(userId1, user1Convs);

    const user2Convs = this.userConversations.get(userId2) || new Set();
    user2Convs.add(conversationId);
    this.userConversations.set(userId2, user2Convs);

    this.emit("conversation:created", {
      conversationId,
      participants: [userName1, userName2],
    });

    return conversation;
  }

  // Send message
  sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    content: string,
  ): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: DirectMessage = {
      messageId,
      senderId,
      senderName,
      recipientId,
      content,
      isRead: false,
      createdDate: new Date(),
      updatedDate: new Date(),
      isDeleted: false,
    };

    const messages = this.messages.get(conversationId) || [];
    messages.push(message);
    this.messages.set(conversationId, messages);

    // Update conversation
    conversation.lastMessage = message;
    conversation.updatedDate = new Date();

    // Increment unread count for recipient
    const unreadCount = conversation.unreadCount.get(recipientId) || 0;
    conversation.unreadCount.set(recipientId, unreadCount + 1);

    // Track message history
    const senderHistory = this.messageHistory.get(senderId) || new Map();
    senderHistory.set(messageId, Date.now());
    this.messageHistory.set(senderId, senderHistory);

    this.emit("message:sent", {
      messageId,
      conversationId,
      senderId,
      senderName,
      recipientId,
      contentLength: content.length,
    });
  }

  // Mark as read
  markAsRead(
    conversationId: string,
    userId: string,
    messageIds: string[],
  ): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    const messages = this.messages.get(conversationId) || [];

    for (const messageId of messageIds) {
      const message = messages.find((m) => m.messageId === messageId);
      if (message && !message.isRead && message.recipientId === userId) {
        message.isRead = true;
        message.readAt = new Date();
      }
    }

    // Reset unread count
    conversation.unreadCount.set(userId, 0);

    this.emit("messages:marked-read", {
      conversationId,
      userId,
      messageCount: messageIds.length,
    });
  }

  // Get conversation
  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  // Get messages
  getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ): DirectMessage[] {
    const messages = this.messages.get(conversationId) || [];
    return messages.slice(
      Math.max(0, messages.length - limit - offset),
      messages.length - offset,
    );
  }

  // Search messages
  searchMessages(conversationId: string, query: string): MessageSearch {
    const messages = this.messages.get(conversationId) || [];
    const queryLower = query.toLowerCase();

    const results = messages.filter(
      (m) =>
        m.content.toLowerCase().includes(queryLower) ||
        m.senderName.toLowerCase().includes(queryLower),
    );

    return {
      results,
      totalCount: results.length,
      query,
    };
  }

  // Add attachment
  addAttachment(
    messageId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    fileUrl: string,
  ): void {
    const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const attachment: MessageAttachment = {
      attachmentId,
      messageId,
      fileName,
      fileSize,
      fileType,
      fileUrl,
      uploadDate: new Date(),
    };

    const attachments = this.attachments.get(messageId) || [];
    attachments.push(attachment);
    this.attachments.set(messageId, attachments);

    this.emit("attachment:added", {
      attachmentId,
      messageId,
      fileName,
      fileSize,
    });
  }

  // Get attachments
  getAttachments(messageId: string): MessageAttachment[] {
    return this.attachments.get(messageId) || [];
  }

  // Set typing indicator
  setTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
  ): void {
    const key = `${conversationId}:${userId}`;

    const indicator: TypingIndicator = {
      conversationId,
      userId,
      userName,
      timestamp: new Date(),
    };

    this.typingUsers.set(key, indicator);

    // Auto-clear after 3 seconds
    setTimeout(() => {
      this.typingUsers.delete(key);
    }, 3000);

    this.emit("typing:started", {
      conversationId,
      userId,
      userName,
    });
  }

  // Get typing users
  getTypingUsers(conversationId: string): TypingIndicator[] {
    const typing: TypingIndicator[] = [];

    for (const [key, indicator] of this.typingUsers.entries()) {
      if (indicator.conversationId === conversationId) {
        // Check if still fresh (within 5 seconds)
        if (Date.now() - indicator.timestamp.getTime() < 5000) {
          typing.push(indicator);
        } else {
          this.typingUsers.delete(key);
        }
      }
    }

    return typing;
  }

  // Get user conversations
  getUserConversations(userId: string, limit: number = 50): Conversation[] {
    const convIds = this.userConversations.get(userId) || new Set();

    return Array.from(convIds)
      .map((id) => this.conversations.get(id))
      .filter((c) => c !== undefined)
      .sort(
        (a, b) =>
          (b?.updatedDate?.getTime() || 0) - (a?.updatedDate?.getTime() || 0),
      )
      .slice(0, limit) as Conversation[];
  }

  // Delete message
  deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ): void {
    const messages = this.messages.get(conversationId) || [];
    const message = messages.find((m) => m.messageId === messageId);

    if (message && message.senderId === userId) {
      message.isDeleted = true;
      message.content = "[Message deleted]";

      this.emit("message:deleted", {
        messageId,
        conversationId,
        userId,
      });
    }
  }

  // Get unread conversations
  getUnreadConversations(userId: string): Conversation[] {
    const conversations = this.getUserConversations(userId);
    return conversations.filter((c) => (c.unreadCount.get(userId) || 0) > 0);
  }

  // Get total unread count
  getTotalUnreadCount(userId: string): number {
    const conversations = this.getUserConversations(userId);
    return conversations.reduce(
      (sum, c) => sum + (c.unreadCount.get(userId) || 0),
      0,
    );
  }

  // Block user
  blockUser(userId: string, blockedUserId: string): void {
    // Implementation would require a blockedUsers map
    // For now, just emit event
    this.emit("user:blocked", {
      userId,
      blockedUserId,
    });
  }

  // Unblock user
  unblockUser(userId: string, unblockedUserId: string): void {
    this.emit("user:unblocked", {
      userId,
      unblockedUserId,
    });
  }
}

export const messagingService = new MessagingService();

export default MessagingService;
