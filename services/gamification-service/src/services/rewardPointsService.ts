import { EventEmitter } from 'events';

export interface PointsTransaction {
  transactionId: string;
  userId: string;
  points: number;
  type: 'earn' | 'redeem' | 'bonus' | 'penalty';
  category: string;
  description: string;
  timestamp: Date;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
}

export interface UserPointsAccount {
  userId: string;
  totalPoints: number;
  currentLevel: number;
  pointsThisLevel: number;
  nextLevelThreshold: number;
  redeemablePoints: number;
  transactions: PointsTransaction[];
  levelUpHistory: Array<{ level: number; date: Date }>;
}

export interface Reward {
  rewardId: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'physical' | 'digital' | 'experience' | 'feature';
  icon: string;
  expiresIn?: number; // days
  quantity?: number;
  claimedCount: number;
  availableCount: number;
}

export class RewardPointsService extends EventEmitter {
  private userAccounts: Map<string, UserPointsAccount> = new Map();
  private rewards: Map<string, Reward> = new Map();
  private transactions: PointsTransaction[] = [];
  private claimedRewards: Map<string, { userId: string; rewardId: string; date: Date; expiresAt?: Date }[]> = new Map();

  constructor() {
    super();
    this.initializeRewards();
  }

  private initializeRewards(): void {
    const rewards: Reward[] = [
      {
        rewardId: 'extra_practice',
        name: 'Extra Practice Questions',
        description: 'Unlock 100 bonus practice questions',
        pointsCost: 500,
        category: 'feature',
        icon: '📚',
        quantity: 100,
        claimedCount: 0,
        availableCount: 1000,
      },
      {
        rewardId: 'premium_course',
        name: 'Premium Course Access',
        description: '1 month access to premium courses',
        pointsCost: 2000,
        category: 'feature',
        icon: '🎓',
        expiresIn: 30,
        quantity: 1,
        claimedCount: 0,
        availableCount: 50,
      },
      {
        rewardId: 'mentor_session',
        name: 'One-on-One Mentor Session',
        description '30-minute personalized mentor session',
        pointsCost: 1500,
        category: 'experience',
        icon: '👨‍🏫',
        expiresIn: 60,
        quantity: 1,
        claimedCount: 0,
        availableCount: 100,
      },
      {
        rewardId: 'exam_voucher',
        name: 'Practice Exam Voucher',
        description: 'Take a full-length practice exam',
        pointsCost: 1000,
        category: 'feature',
        icon: '📝',
        quantity: 1,
        claimedCount: 0,
        availableCount: 500,
      },
      {
        rewardId: 'study_materials',
        name: 'Premium Study Materials',
        description: 'PDF study guides and flashcards',
        pointsCost: 750,
        category: 'digital',
        icon: '📖',
        quantity: 10,
        claimedCount: 0,
        availableCount: 200,
      },
      {
        rewardId: 'certificate',
        name: 'Digital Certificate',
        description: 'Official completion certificate',
        pointsCost: 800,
        category: 'digital',
        icon: '🏅',
        quantity: 1,
        claimedCount: 0,
        availableCount: 1000,
      },
      {
        rewardId: 'gift_card_10',
        name: '$10 Gift Card',
        description: 'Digital gift card for online store',
        pointsCost: 1200,
        category: 'physical',
        icon: '🎁',
        quantity: 1,
        claimedCount: 0,
        availableCount: 100,
      },
      {
        rewardId: 'points_multiplier',
        name: '2x Points Multiplier',
        description: '1 day of double points on all activities',
        pointsCost: 600,
        category: 'feature',
        icon: '⚡',
        expiresIn: 1,
        quantity: 1,
        claimedCount: 0,
        availableCount: 500,
      },
    ];

    rewards.forEach((reward) => {
      this.rewards.set(reward.rewardId, reward);
    });
  }

  // Initialize user account
  initializeUserAccount(userId: string): UserPointsAccount {
    const account: UserPointsAccount = {
      userId,
      totalPoints: 0,
      currentLevel: 1,
      pointsThisLevel: 0,
      nextLevelThreshold: 1000,
      redeemablePoints: 0,
      transactions: [],
      levelUpHistory: [],
    };

    this.userAccounts.set(userId, account);
    return account;
  }

  // Get user account
  getUserAccount(userId: string): UserPointsAccount {
    let account = this.userAccounts.get(userId);
    if (!account) {
      account = this.initializeUserAccount(userId);
    }
    return account;
  }

  // Add points
  addPoints(
    userId: string,
    points: number,
    category: string,
    description: string,
    metadata?: Record<string, any>
  ): {
    newBalance: number;
    leveledUp: boolean;
    newLevel: number;
  } {
    let account = this.getUserAccount(userId);

    const transaction: PointsTransaction = {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points,
      type: 'earn',
      category,
      description,
      timestamp: new Date(),
      balanceBefore: account.totalPoints,
      balanceAfter: account.totalPoints + points,
      metadata,
    };

    account.totalPoints += points;
    account.redeemablePoints += points;
    account.pointsThisLevel += points;
    account.transactions.push(transaction);
    this.transactions.push(transaction);

    let leveledUp = false;
    let newLevel = account.currentLevel;

    // Check for level up
    while (account.pointsThisLevel >= account.nextLevelThreshold) {
      account.pointsThisLevel -= account.nextLevelThreshold;
      account.currentLevel++;
      account.nextLevelThreshold = Math.floor(account.nextLevelThreshold * 1.15);
      newLevel = account.currentLevel;
      leveledUp = true;

      account.levelUpHistory.push({
        level: account.currentLevel,
        date: new Date(),
      });

      this.emit('level:up', {
        userId,
        newLevel: account.currentLevel,
        totalPoints: account.totalPoints,
      });
    }

    this.emit('points:earned', {
      userId,
      points,
      category,
      newBalance: account.totalPoints,
    });

    return {
      newBalance: account.totalPoints,
      leveledUp,
      newLevel,
    };
  }

  // Redeem reward
  async redeemReward(userId: string, rewardId: string): Promise<{
    success: boolean;
    message: string;
    claimedRewardId?: string;
  }> {
    const account = this.getUserAccount(userId);
    const reward = this.rewards.get(rewardId);

    if (!reward) {
      return { success: false, message: 'Reward not found' };
    }

    if (account.redeemablePoints < reward.pointsCost) {
      return {
        success: false,
        message: `Insufficient points. Need ${reward.pointsCost}, have ${account.redeemablePoints}`,
      };
    }

    if (reward.availableCount <= 0) {
      return { success: false, message: 'Reward out of stock' };
    }

    // Deduct points
    const transaction: PointsTransaction = {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points: -reward.pointsCost,
      type: 'redeem',
      category: reward.category,
      description: `Redeemed: ${reward.name}`,
      timestamp: new Date(),
      balanceBefore: account.redeemablePoints,
      balanceAfter: account.redeemablePoints - reward.pointsCost,
    };

    account.redeemablePoints -= reward.pointsCost;
    account.transactions.push(transaction);
    this.transactions.push(transaction);

    // Mark reward as claimed
    const claimedRewardId = `claimed_${rewardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = reward.expiresIn
      ? new Date(Date.now() + reward.expiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    if (!this.claimedRewards.has(userId)) {
      this.claimedRewards.set(userId, []);
    }

    this.claimedRewards.get(userId)!.push({
      userId,
      rewardId,
      date: new Date(),
      expiresAt,
    });

    reward.claimedCount++;
    reward.availableCount--;

    this.emit('reward:redeemed', {
      userId,
      rewardId,
      reward: reward.name,
      pointsSpent: reward.pointsCost,
      remainingPoints: account.redeemablePoints,
    });

    return {
      success: true,
      message: `Successfully redeemed ${reward.name}`,
      claimedRewardId,
    };
  }

  // Get available rewards
  getAvailableRewards(): Reward[] {
    return Array.from(this.rewards.values())
      .filter((r) => r.availableCount > 0)
      .sort((a, b) => a.pointsCost - b.pointsCost);
  }

  // Get user claimed rewards
  getUserClaimedRewards(userId: string): Array<{
    claimedAt: Date;
    reward: Reward;
    expiresAt?: Date;
    isExpired: boolean;
  }> {
    const claimed = this.claimedRewards.get(userId) || [];
    return claimed.map((claim) => {
      const reward = this.rewards.get(claim.rewardId)!;
      const isExpired = claim.expiresAt
        ? claim.expiresAt < new Date()
        : false;

      return {
        claimedAt: claim.date,
        reward,
        expiresAt: claim.expiresAt,
        isExpired,
      };
    });
  }

  // Get points history
  getPointsHistory(userId: string, limit: number = 50): PointsTransaction[] {
    const account = this.getUserAccount(userId);
    return account.transactions.slice(-limit).reverse();
  }

  // Get points leaderboard
  getPointsLeaderboard(limit: number = 50): Array<{
    rank: number;
    userId: string;
    totalPoints: number;
    currentLevel: number;
  }> {
    const accounts = Array.from(this.userAccounts.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return accounts.map((account, index) => ({
      rank: index + 1,
      userId: account.userId,
      totalPoints: account.totalPoints,
      currentLevel: account.currentLevel,
    }));
  }

  // Award bonus points
  awardBonusPoints(
    userId: string,
    points: number,
    reason: string
  ): number {
    const account = this.getUserAccount(userId);

    const transaction: PointsTransaction = {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points,
      type: 'bonus',
      category: 'bonus',
      description: reason,
      timestamp: new Date(),
      balanceBefore: account.totalPoints,
      balanceAfter: account.totalPoints + points,
    };

    account.totalPoints += points;
    account.redeemablePoints += points;
    account.transactions.push(transaction);
    this.transactions.push(transaction);

    this.emit('bonus:awarded', {
      userId,
      points,
      reason,
    });

    return account.totalPoints;
  }

  // Apply penalty
  applyPenalty(userId: string, points: number, reason: string): number {
    const account = this.getUserAccount(userId);
    const deducted = Math.min(points, account.redeemablePoints);

    const transaction: PointsTransaction = {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points: -deducted,
      type: 'penalty',
      category: 'penalty',
      description: reason,
      timestamp: new Date(),
      balanceBefore: account.redeemablePoints,
      balanceAfter: account.redeemablePoints - deducted,
    };

    account.redeemablePoints -= deducted;
    account.transactions.push(transaction);
    this.transactions.push(transaction);

    this.emit('penalty:applied', {
      userId,
      points: deducted,
      reason,
    });

    return account.redeemablePoints;
  }
}

export const rewardPointsService = new RewardPointsService();

export default RewardPointsService;
