import { EventEmitter } from "events";

export interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  type: "video" | "pdf" | "image" | "audio" | "interactive" | "article";
  subject: string;
  gradeLevel: string[];
  duration?: number; // in seconds
  fileSize?: number; // in bytes
  thumbnail?: string;
  language: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
  views: number;
  rating: number; // 1-5
  ratingCount: number;
  isPublished: boolean;
  accessLevel: "public" | "premium" | "restricted";
  prerequisites?: string[]; // content IDs
  sourceUrl?: string;
  embedCode?: string;
  transcript?: string;
  captions?: Array<{ language: string; url: string }>;
}

export interface SearchFilter {
  subject?: string;
  gradeLevel?: string;
  type?: string;
  difficulty?: string;
  language?: string;
  tags?: string[];
  accessLevel?: string;
  minRating?: number;
  dateRange?: { from: Date; to: Date };
}

export class ContentLibraryService extends EventEmitter {
  private contentItems: Map<string, ContentMetadata> = new Map();
  private contentIndex: Map<string, Set<string>> = new Map(); // Tag/subject to content IDs
  private userViews: Map<string, Set<string>> = new Map(); // User to viewed content IDs
  private userRatings: Map<string, Map<string, number>> = new Map(); // User to (content ID -> rating)
  private collections: Map<string, string[]> = new Map(); // Collection ID to content IDs
  private searchHistory: Array<{
    userId: string;
    query: string;
    timestamp: Date;
  }> = [];

  constructor() {
    super();
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
    const indexKeys = [
      "mathematics",
      "science",
      "english",
      "history",
      "beginner",
      "intermediate",
      "advanced",
      "video",
      "pdf",
      "interactive",
    ];

    indexKeys.forEach((key) => {
      this.contentIndex.set(key, new Set());
    });
  }

  // Add content
  addContent(
    metadata: Omit<ContentMetadata, "id" | "views" | "ratingCount">,
  ): ContentMetadata {
    const content: ContentMetadata = {
      ...metadata,
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      views: 0,
      ratingCount: 0,
    };

    this.contentItems.set(content.id, content);

    // Index content
    this.indexContent(content);

    this.emit("content:added", {
      contentId: content.id,
      title: content.title,
      subject: content.subject,
    });

    return content;
  }

  // Index content by various attributes
  private indexContent(content: ContentMetadata): void {
    // Index by subject
    const subjectSet = this.contentIndex.get(content.subject) || new Set();
    subjectSet.add(content.id);
    this.contentIndex.set(content.subject, subjectSet);

    // Index by difficulty
    const diffSet = this.contentIndex.get(content.difficulty) || new Set();
    diffSet.add(content.id);
    this.contentIndex.set(content.difficulty, diffSet);

    // Index by type
    const typeSet = this.contentIndex.get(content.type) || new Set();
    typeSet.add(content.id);
    this.contentIndex.set(content.type, typeSet);

    // Index by tags
    content.tags.forEach((tag) => {
      const tagSet = this.contentIndex.get(tag.toLowerCase()) || new Set();
      tagSet.add(content.id);
      this.contentIndex.set(tag.toLowerCase(), tagSet);
    });

    // Index by grade level
    content.gradeLevel.forEach((grade) => {
      const gradeSet = this.contentIndex.get(grade) || new Set();
      gradeSet.add(content.id);
      this.contentIndex.set(grade, gradeSet);
    });
  }

  // Search content
  searchContent(
    query: string,
    filter?: SearchFilter,
    limit: number = 50,
  ): ContentMetadata[] {
    const queryLower = query.toLowerCase();
    let results: ContentMetadata[] = [];

    // Full-text search
    for (const content of this.contentItems.values()) {
      if (
        content.title.toLowerCase().includes(queryLower) ||
        content.description.toLowerCase().includes(queryLower) ||
        content.tags.some((tag) => tag.toLowerCase().includes(queryLower)) ||
        content.subject.toLowerCase().includes(queryLower)
      ) {
        results.push(content);
      }
    }

    // Apply filters
    if (filter) {
      if (filter.subject) {
        results = results.filter((c) => c.subject === filter.subject);
      }
      if (filter.type) {
        results = results.filter((c) => c.type === filter.type);
      }
      if (filter.difficulty) {
        results = results.filter((c) => c.difficulty === filter.difficulty);
      }
      if (filter.language) {
        results = results.filter((c) => c.language === filter.language);
      }
      if (filter.accessLevel) {
        results = results.filter((c) => c.accessLevel === filter.accessLevel);
      }
      if (filter.minRating) {
        results = results.filter((c) => c.rating >= filter.minRating!);
      }
      if (filter.gradeLevel && filter.gradeLevel.length > 0) {
        results = results.filter((c) =>
          c.gradeLevel.includes(filter.gradeLevel!),
        );
      }
      if (filter.dateRange) {
        results = results.filter(
          (c) =>
            c.createdDate >= filter.dateRange!.from &&
            c.createdDate <= filter.dateRange!.to,
        );
      }
    }

    // Sort by rating and views
    results.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.views - a.views;
    });

    return results.slice(0, limit);
  }

  // Record content view
  recordView(userId: string, contentId: string): void {
    const content = this.contentItems.get(contentId);
    if (!content) return;

    content.views++;

    if (!this.userViews.has(userId)) {
      this.userViews.set(userId, new Set());
    }
    this.userViews.get(userId)!.add(contentId);

    this.emit("content:viewed", {
      userId,
      contentId,
      title: content.title,
    });
  }

  // Get trending content
  getTrendingContent(
    timeframeHours: number = 24,
    limit: number = 20,
  ): ContentMetadata[] {
    const now = new Date();
    const timeframeStart = new Date(
      now.getTime() - timeframeHours * 60 * 60 * 1000,
    );

    const content = Array.from(this.contentItems.values())
      .filter((c) => c.updatedDate >= timeframeStart && c.isPublished)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return content;
  }

  // Get personalized recommendations
  getRecommendations(userId: string, limit: number = 10): ContentMetadata[] {
    const userViews = this.userViews.get(userId) || new Set();
    const viewedContent = Array.from(userViews)
      .map((id) => this.contentItems.get(id))
      .filter((c) => c !== undefined) as ContentMetadata[];

    if (viewedContent.length === 0) {
      return this.getTrendingContent(24 * 7, limit); // Default to weekly trending
    }

    // Find similar content based on subject and difficulty
    const subjects = new Set(viewedContent.map((c) => c.subject));
    const difficulties = new Set(viewedContent.map((c) => c.difficulty));

    let recommendations: ContentMetadata[] = [];
    for (const content of this.contentItems.values()) {
      if (userViews.has(content.id)) continue; // Skip already viewed

      if (
        (subjects.has(content.subject) ||
          difficulties.has(content.difficulty)) &&
        content.isPublished
      ) {
        recommendations.push(content);
      }
    }

    // Sort by rating and views
    recommendations.sort((a, b) => {
      const aScore = a.rating * 0.6 + (a.views / 1000) * 0.4;
      const bScore = b.rating * 0.6 + (b.views / 1000) * 0.4;
      return bScore - aScore;
    });

    return recommendations.slice(0, limit);
  }

  // Rate content
  rateContent(
    userId: string,
    contentId: string,
    rating: number,
  ): {
    newRating: number;
    ratingCount: number;
  } {
    const content = this.contentItems.get(contentId);
    if (!content || rating < 1 || rating > 5) {
      return { newRating: 0, ratingCount: 0 };
    }

    if (!this.userRatings.has(userId)) {
      this.userRatings.set(userId, new Map());
    }

    const userRatings = this.userRatings.get(userId)!;
    const previousRating = userRatings.get(contentId) || 0;

    // Update rating
    const totalRating =
      content.rating * content.ratingCount - previousRating + rating;
    const newCount =
      previousRating > 0 ? content.ratingCount : content.ratingCount + 1;
    content.rating = totalRating / newCount;
    content.ratingCount = newCount;

    userRatings.set(contentId, rating);

    this.emit("content:rated", {
      userId,
      contentId,
      rating,
      newAverageRating: content.rating,
    });

    return {
      newRating: content.rating,
      ratingCount: content.ratingCount,
    };
  }

  // Create collection
  createCollection(collectionId: string, contentIds: string[]): void {
    this.collections.set(collectionId, contentIds);

    this.emit("collection:created", {
      collectionId,
      contentCount: contentIds.length,
    });
  }

  // Get collection
  getCollection(collectionId: string): ContentMetadata[] {
    const contentIds = this.collections.get(collectionId) || [];
    return contentIds
      .map((id) => this.contentItems.get(id))
      .filter((c) => c !== undefined) as ContentMetadata[];
  }

  // Get user view history
  getUserViewHistory(userId: string, limit: number = 50): ContentMetadata[] {
    const viewedIds = Array.from(
      this.userViews.get(userId) || new Set(),
    ) as string[];
    return viewedIds
      .map((id: string) => this.contentItems.get(id))
      .filter((c): c is ContentMetadata => c !== undefined)
      .slice(0, limit);
  }

  // Get content analytics
  getContentAnalytics(contentId: string): {
    contentId: string;
    title: string;
    views: number;
    rating: number;
    ratingCount: number;
    engagementScore: number;
  } | null {
    const content = this.contentItems.get(contentId);
    if (!content) return null;

    const engagementScore =
      (content.rating / 5) * 0.7 + Math.min(content.views / 1000, 1) * 0.3;

    return {
      contentId,
      title: content.title,
      views: content.views,
      rating: content.rating,
      ratingCount: content.ratingCount,
      engagementScore,
    };
  }
}

export const contentLibraryService = new ContentLibraryService();

export default ContentLibraryService;
