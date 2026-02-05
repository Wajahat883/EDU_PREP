/**
 * Adaptive Learning Paths Service
 *
 * Creates personalized learning journeys that:
 * - Adapt difficulty based on performance
 * - Optimize learning sequence
 * - Track progress through learning objectives
 * - Provide milestone-based progression
 * - Suggest next steps based on mastery
 */

import { injectable, inject } from "tsyringe";
import { Logger } from "winston";
import { StudentPerformance } from "../models/StudentPerformance";
import { Question } from "../models/Question";
import { LearningPath } from "../models/LearningPath";

interface LearningNode {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  prerequisites: string[];
  estimatedDuration: number;
  masteryThreshold: number; // 0-100, percentage to pass node
  questions: string[];
}

interface AdaptivePath {
  pathId: string;
  userId: string;
  subject: string;
  currentNode: string;
  progress: number; // 0-100
  nextNode: string;
  completedNodes: string[];
  strugglingNodes: string[];
  estimatedCompletion: Date;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  completedAt?: Date;
  progress: number;
}

@injectable()
export class AdaptiveLearningPathsService {
  constructor(@inject("Logger") private logger: Logger) {}

  /**
   * Create adaptive learning path for a student
   */
  async createAdaptivePath(
    userId: string,
    subject: string,
    targetLevel: "beginner" | "intermediate" | "advanced" = "intermediate",
  ): Promise<AdaptivePath> {
    try {
      // Get student's current level
      const performance = await StudentPerformance.findOne({ userId });
      const currentLevel = this.determineCurrentLevel(performance, subject);

      // Generate learning path structure
      const pathStructure = await this.generatePathStructure(
        subject,
        currentLevel,
        targetLevel,
      );

      // Create milestones
      const milestones = this.createMilestones(pathStructure);

      // Create learning path record
      const learningPath = new LearningPath({
        userId,
        subject,
        targetLevel,
        pathStructure,
        currentNodeId: pathStructure.nodes[0].id,
        progress: 0,
        milestones,
        createdAt: new Date(),
      });

      await learningPath.save();

      const adaptivePath: AdaptivePath = {
        pathId: learningPath._id.toString(),
        userId,
        subject,
        currentNode: pathStructure.nodes[0].id,
        progress: 0,
        nextNode: pathStructure.nodes[1]?.id || "",
        completedNodes: [],
        strugglingNodes: [],
        estimatedCompletion: this.calculateEstimatedCompletion(pathStructure),
        milestones,
      };

      this.logger.info(`Created adaptive learning path for user ${userId}`, {
        pathId: adaptivePath.pathId,
        subject,
        targetLevel,
      });

      return adaptivePath;
    } catch (error) {
      this.logger.error("Error creating adaptive learning path", {
        userId,
        subject,
        error,
      });
      throw error;
    }
  }

  /**
   * Determine current student level
   */
  private determineCurrentLevel(
    performance: any,
    subject: string,
  ): "beginner" | "intermediate" | "advanced" {
    if (!performance) return "beginner";

    const subjectScore = performance.performanceBySubject[subject] || 0;

    if (subjectScore >= 80) return "advanced";
    if (subjectScore >= 60) return "intermediate";
    return "beginner";
  }

  /**
   * Generate hierarchical learning path structure
   */
  private async generatePathStructure(
    subject: string,
    currentLevel: string,
    targetLevel: string,
  ): Promise<any> {
    // Get all topics for this subject
    const topics = await this.getTopicsHierarchy(subject);

    // Filter topics based on levels
    const relevantTopics = this.filterTopicsByLevel(
      topics,
      currentLevel,
      targetLevel,
    );

    // Create learning nodes with prerequisites
    const nodes: LearningNode[] = relevantTopics.map((topic, index) => ({
      id: `node_${subject}_${index}`,
      topic: topic.name,
      difficulty: topic.difficulty,
      prerequisites: index > 0 ? [`node_${subject}_${index - 1}`] : [],
      estimatedDuration: topic.estimatedHours,
      masteryThreshold: 75, // Must score 75%+ to pass
      questions: topic.questionIds,
    }));

    return {
      subject,
      nodes,
      totalDuration: nodes.reduce((sum, n) => sum + n.estimatedDuration, 0),
      milestoneFrequency: Math.ceil(nodes.length / 5), // Milestone every 5 nodes
    };
  }

  /**
   * Get topics organized hierarchically
   */
  private async getTopicsHierarchy(subject: string): Promise<any[]> {
    // Aggregate questions by topic
    const topics = await Question.aggregate([
      { $match: { subject, status: "approved", deletedAt: null } },
      {
        $group: {
          _id: "$topic",
          count: { $sum: 1 },
          avgDifficulty: { $avg: { $literal: 1 } },
          questions: { $push: "$_id" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return topics.map((t) => ({
      name: t._id,
      difficulty: this.determineDifficulty(t.count),
      estimatedHours: Math.ceil(t.count / 10) * 0.5,
      questionIds: t.questions,
    }));
  }

  /**
   * Determine difficulty based on question count
   */
  private determineDifficulty(
    questionCount: number,
  ): "easy" | "medium" | "hard" {
    if (questionCount < 5) return "easy";
    if (questionCount < 15) return "medium";
    return "hard";
  }

  /**
   * Filter topics by current and target level
   */
  private filterTopicsByLevel(
    topics: any[],
    currentLevel: string,
    targetLevel: string,
  ): any[] {
    const levelHierarchy = { beginner: 0, intermediate: 1, advanced: 2 };
    const currentIdx =
      levelHierarchy[currentLevel as keyof typeof levelHierarchy];
    const targetIdx =
      levelHierarchy[targetLevel as keyof typeof levelHierarchy];

    // For now, return all topics (in production, would filter by difficulty)
    return topics;
  }

  /**
   * Create milestones for path
   */
  private createMilestones(pathStructure: any): Milestone[] {
    const milestones: Milestone[] = [];
    const nodesPerMilestone = pathStructure.milestoneFrequency || 5;

    for (let i = 0; i < pathStructure.nodes.length; i += nodesPerMilestone) {
      const nodeCount = Math.min(
        nodesPerMilestone,
        pathStructure.nodes.length - i,
      );
      const startTopic = pathStructure.nodes[i].topic;
      const endTopic =
        pathStructure.nodes[
          Math.min(i + nodeCount - 1, pathStructure.nodes.length - 1)
        ].topic;

      milestones.push({
        id: `milestone_${milestones.length}`,
        name: `Master ${startTopic} to ${endTopic}`,
        description: `Complete ${nodeCount} learning modules`,
        progress: 0,
      });
    }

    // Add final milestone
    milestones.push({
      id: `milestone_final`,
      name: `Master ${pathStructure.subject}`,
      description: "Complete entire learning path",
      progress: 0,
    });

    return milestones;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(pathStructure: any): Date {
    const hoursPerDay = 2; // Assume 2 hours of study per day
    const totalDays = Math.ceil(pathStructure.totalDuration / hoursPerDay);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + totalDays);
    return completionDate;
  }

  /**
   * Update path progress based on performance
   */
  async updatePathProgress(
    pathId: string,
    userId: string,
    nodeId: string,
    score: number,
  ): Promise<AdaptivePath> {
    const learningPath = await LearningPath.findById(pathId);
    if (!learningPath) throw new Error("Learning path not found");

    const node = learningPath.pathStructure.nodes.find(
      (n: any) => n.id === nodeId,
    );
    if (!node) throw new Error("Node not found");

    // Check if mastery threshold is met
    const isMastered = score >= node.masteryThreshold;

    if (isMastered) {
      learningPath.completedNodes.push(nodeId);

      // Update milestones
      this.updateMilestones(learningPath, nodeId);

      // Move to next node
      const nextNodeIndex =
        learningPath.pathStructure.nodes.findIndex(
          (n: any) => n.id === nodeId,
        ) + 1;
      if (nextNodeIndex < learningPath.pathStructure.nodes.length) {
        learningPath.currentNodeId =
          learningPath.pathStructure.nodes[nextNodeIndex].id;
      }
    } else {
      // Add to struggling nodes for intervention
      if (!learningPath.strugglingNodes.includes(nodeId)) {
        learningPath.strugglingNodes.push(nodeId);
      }

      // Optionally provide additional resources or easier path
      if (!learningPath.completedNodes.includes(nodeId)) {
        // Stay on same node or provide remedial content
      }
    }

    // Calculate overall progress
    learningPath.progress = Math.round(
      (learningPath.completedNodes.length /
        learningPath.pathStructure.nodes.length) *
        100,
    );

    await learningPath.save();

    return this.getAdaptivePath(pathId);
  }

  /**
   * Update milestone completion
   */
  private updateMilestones(learningPath: any, completedNodeId: string): void {
    const completedCount = learningPath.completedNodes.length;
    const nodesPerMilestone =
      learningPath.pathStructure.milestoneFrequency || 5;

    learningPath.milestones.forEach((milestone: any) => {
      if (milestone.id === "milestone_final") {
        milestone.progress = Math.round(
          (completedCount / learningPath.pathStructure.nodes.length) * 100,
        );
      } else {
        const milestoneIndex = learningPath.milestones.indexOf(milestone);
        const nodesForThisMilestone = nodesPerMilestone;
        const startNode = milestoneIndex * nodesPerMilestone;
        const endNode = startNode + nodesForThisMilestone;

        const completedInMilestone = learningPath.completedNodes.filter(
          (n: string) => {
            const nodeIndex = learningPath.pathStructure.nodes.findIndex(
              (node: any) => node.id === n,
            );
            return nodeIndex >= startNode && nodeIndex < endNode;
          },
        ).length;

        milestone.progress = Math.round(
          (completedInMilestone / nodesForThisMilestone) * 100,
        );

        if (milestone.progress === 100 && !milestone.completedAt) {
          milestone.completedAt = new Date();
        }
      }
    });
  }

  /**
   * Get current adaptive path details
   */
  async getAdaptivePath(pathId: string): Promise<AdaptivePath> {
    const learningPath = await LearningPath.findById(pathId);
    if (!learningPath) throw new Error("Learning path not found");

    const currentNodeIndex = learningPath.pathStructure.nodes.findIndex(
      (n: any) => n.id === learningPath.currentNodeId,
    );
    const nextNodeIndex = currentNodeIndex + 1;
    const nextNode =
      nextNodeIndex < learningPath.pathStructure.nodes.length
        ? learningPath.pathStructure.nodes[nextNodeIndex]
        : null;

    return {
      pathId: learningPath._id.toString(),
      userId: learningPath.userId,
      subject: learningPath.subject,
      currentNode: learningPath.currentNodeId,
      progress: learningPath.progress,
      nextNode: nextNode?.id || "",
      completedNodes: learningPath.completedNodes,
      strugglingNodes: learningPath.strugglingNodes,
      estimatedCompletion: new Date(
        Date.now() + (100 - learningPath.progress) * 3600000,
      ), // Rough estimate
      milestones: learningPath.milestones,
    };
  }

  /**
   * Get recommended next steps with adaptive difficulty
   */
  async getNextSteps(pathId: string, userId: string): Promise<any[]> {
    const adaptivePath = await this.getAdaptivePath(pathId);
    const currentNodeIndex = (
      await this.getPathStructure(pathId)
    ).nodes.findIndex((n: any) => n.id === adaptivePath.currentNode);

    const nextSteps = [];

    // If struggling on current node, recommend remedial materials
    if (adaptivePath.strugglingNodes.includes(adaptivePath.currentNode)) {
      nextSteps.push({
        type: "remedial",
        description: "Review this topic with easier questions",
        action: "showRemedialmaterial",
        priority: "high",
      });
    }

    // Recommend next node
    if (
      currentNodeIndex + 1 <
      (await this.getPathStructure(pathId)).nodes.length
    ) {
      nextSteps.push({
        type: "progression",
        description: `Move to next topic: ${(await this.getPathStructure(pathId)).nodes[currentNodeIndex + 1].topic}`,
        action: "startNode",
        nodeId: (await this.getPathStructure(pathId)).nodes[
          currentNodeIndex + 1
        ].id,
        priority: "high",
      });
    }

    // If making good progress, suggest stretch challenge
    if (adaptivePath.progress >= 50) {
      nextSteps.push({
        type: "challenge",
        description: "Try advanced questions to deepen understanding",
        action: "startChallenge",
        difficulty: "hard",
        priority: "medium",
      });
    }

    return nextSteps;
  }

  /**
   * Adjust path difficulty dynamically
   */
  async adjustPathDifficulty(
    pathId: string,
    userId: string,
    performanceRatio: number,
  ): Promise<void> {
    const learningPath = await LearningPath.findById(pathId);
    if (!learningPath) throw new Error("Learning path not found");

    // If consistently scoring above 85%, increase difficulty
    if (performanceRatio > 0.85) {
      learningPath.pathStructure.nodes.forEach((node: any) => {
        if (node.difficulty === "easy") node.difficulty = "medium";
        else if (node.difficulty === "medium") node.difficulty = "hard";
      });
      this.logger.info("Increased path difficulty for user", {
        userId,
        pathId,
      });
    }
    // If consistently scoring below 50%, decrease difficulty
    else if (performanceRatio < 0.5) {
      learningPath.pathStructure.nodes.forEach((node: any) => {
        if (node.difficulty === "hard") node.difficulty = "medium";
        else if (node.difficulty === "medium") node.difficulty = "easy";
      });
      this.logger.info("Decreased path difficulty for user", {
        userId,
        pathId,
      });
    }

    await learningPath.save();
  }

  /**
   * Get learning analytics for the path
   */
  async getPathAnalytics(pathId: string): Promise<any> {
    const learningPath = await LearningPath.findById(pathId);
    if (!learningPath) throw new Error("Learning path not found");

    const performance = await StudentPerformance.findOne({
      userId: learningPath.userId,
    });

    return {
      completionPercentage: learningPath.progress,
      completedTopics: learningPath.completedNodes.length,
      totalTopics: learningPath.pathStructure.nodes.length,
      strugglingAreas: learningPath.strugglingNodes,
      milestoneProgress: learningPath.milestones.map((m: any) => ({
        name: m.name,
        progress: m.progress,
        completed: m.completedAt ? true : false,
      })),
      estimatedDaysToCompletion: Math.ceil((100 - learningPath.progress) / 10),
      performanceTrend: performance
        ? this.calculateTrend(performance)
        : "stable",
    };
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(
    performance: any,
  ): "improving" | "declining" | "stable" {
    if (!performance.attemptHistory || performance.attemptHistory.length < 5) {
      return "stable";
    }

    const recent = performance.attemptHistory.slice(-5);
    const old = performance.attemptHistory.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum: number, a: any) => sum + a.score, 0) / recent.length;
    const oldAvg =
      old.reduce((sum: number, a: any) => sum + a.score, 0) / old.length;

    if (recentAvg > oldAvg + 5) return "improving";
    if (recentAvg < oldAvg - 5) return "declining";
    return "stable";
  }

  /**
   * Helper to get path structure
   */
  private async getPathStructure(pathId: string): Promise<any> {
    const learningPath = await LearningPath.findById(pathId);
    return learningPath?.pathStructure || { nodes: [] };
  }
}

export default AdaptiveLearningPathsService;
