/**
 * Plagiarism Detection Service
 *
 * Detects plagiarism and academic integrity violations:
 * - Essay similarity comparison
 * - Semantic analysis
 * - Source attribution
 * - Originality scoring
 * - Pattern detection
 */

import { injectable, inject } from "tsyringe";
import { Logger } from "winston";

interface SimilarityResult {
  overallSimilarity: number; // 0-100
  plagiarismRisk: "low" | "medium" | "high" | "critical";
  matches: SimilarityMatch[];
  originalityScore: number; // 0-100
  flaggedSections: FlaggedSection[];
}

interface SimilarityMatch {
  sourceId: string;
  sourceTitle: string;
  matchPercentage: number;
  matchedText: string;
  sourceText: string;
  matchedSections: { start: number; end: number }[];
}

interface FlaggedSection {
  startChar: number;
  endChar: number;
  text: string;
  reason: string;
  suspicionLevel: "low" | "medium" | "high";
}

@injectable()
export class PlagiarismDetectionService {
  private readonly MIN_MATCH_LENGTH = 10; // Minimum consecutive words for match
  private readonly SIMILARITY_THRESHOLD = 0.8; // 80% threshold for flagging

  constructor(@inject("Logger") private logger: Logger) {}

  /**
   * Check essay for plagiarism
   */
  async checkPlagiarism(
    essayId: string,
    essayText: string,
    sources?: string[],
  ): Promise<SimilarityResult> {
    try {
      // Preprocess essay
      const processedEssay = this.preprocessText(essayText);

      // Generate n-grams for comparison
      const essayNgrams = this.generateNgrams(processedEssay);

      // Check against known sources
      const matches = await this.findMatches(essayId, processedEssay, sources);

      // Analyze flagged sections
      const flaggedSections = this.analyzeFlaggedSections(
        processedEssay,
        matches,
      );

      // Calculate overall similarity
      const overallSimilarity = this.calculateOverallSimilarity(matches);
      const plagiarismRisk = this.assessPlagiarismRisk(
        overallSimilarity,
        flaggedSections,
      );

      const result: SimilarityResult = {
        overallSimilarity: Math.round(overallSimilarity),
        plagiarismRisk,
        matches,
        originalityScore: 100 - Math.round(overallSimilarity),
        flaggedSections,
      };

      this.logger.info(`Plagiarism check completed for essay ${essayId}`, {
        similarity: result.overallSimilarity,
        risk: plagiarismRisk,
        flaggedCount: flaggedSections.length,
      });

      return result;
    } catch (error) {
      this.logger.error("Error checking plagiarism", { essayId, error });
      throw error;
    }
  }

  /**
   * Preprocess text for comparison
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Generate n-grams for text analysis
   */
  private generateNgrams(text: string, n: number = 5): Set<string> {
    const words = text.split(" ");
    const ngrams = new Set<string>();

    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(" ");
      ngrams.add(ngram);
    }

    return ngrams;
  }

  /**
   * Find matches between essay and sources
   */
  private async findMatches(
    essayId: string,
    essayText: string,
    sources?: string[],
  ): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];

    // Get sources to check against
    const sourcesList = sources || (await this.getEssaySources(essayId));

    for (const source of sourcesList) {
      const matchSections = this.findMatchedSections(essayText, source);

      if (matchSections.length > 0) {
        // Calculate similarity for this match
        const matchPercentage = this.calculateSectionSimilarity(
          essayText,
          source,
          matchSections,
        );

        if (matchPercentage >= this.SIMILARITY_THRESHOLD * 100) {
          const matchedText = this.extractMatchedText(essayText, matchSections);

          matches.push({
            sourceId: this.generateSourceId(source),
            sourceTitle: source.substring(0, 100),
            matchPercentage: Math.round(matchPercentage),
            matchedText,
            sourceText: source,
            matchedSections,
          });
        }
      }
    }

    return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  /**
   * Find matched sections between texts
   */
  private findMatchedSections(
    text1: string,
    text2: string,
  ): Array<{ start: number; end: number }> {
    const words1 = text1.split(" ");
    const words2 = text2.split(" ");
    const matches: Array<{ start: number; end: number }> = [];

    for (let i = 0; i <= words1.length - this.MIN_MATCH_LENGTH; i++) {
      const substring = words1.slice(i, i + this.MIN_MATCH_LENGTH).join(" ");

      if (words2.join(" ").includes(substring)) {
        matches.push({
          start: i,
          end: i + this.MIN_MATCH_LENGTH,
        });
      }
    }

    return this.mergeOverlappingMatches(matches);
  }

  /**
   * Merge overlapping matched sections
   */
  private mergeOverlappingMatches(
    matches: Array<{ start: number; end: number }>,
  ): Array<{ start: number; end: number }> {
    if (matches.length === 0) return [];

    matches.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [matches[0]];

    for (let i = 1; i < matches.length; i++) {
      if (matches[i].start <= merged[merged.length - 1].end) {
        // Overlap, merge
        merged[merged.length - 1].end = Math.max(
          merged[merged.length - 1].end,
          matches[i].end,
        );
      } else {
        merged.push(matches[i]);
      }
    }

    return merged;
  }

  /**
   * Calculate similarity for specific sections
   */
  private calculateSectionSimilarity(
    text1: string,
    text2: string,
    sections: Array<{ start: number; end: number }>,
  ): number {
    if (sections.length === 0) return 0;

    const words1 = text1.split(" ");
    let matchedWords = 0;

    sections.forEach((section) => {
      matchedWords += Math.min(section.end - section.start, words1.length);
    });

    return (matchedWords / words1.length) * 100;
  }

  /**
   * Extract matched text from sections
   */
  private extractMatchedText(
    text: string,
    sections: Array<{ start: number; end: number }>,
  ): string {
    const words = text.split(" ");
    const extracted: string[] = [];

    sections.forEach((section) => {
      extracted.push(words.slice(section.start, section.end).join(" "));
    });

    return extracted.join(" ... ");
  }

  /**
   * Calculate overall similarity across all matches
   */
  private calculateOverallSimilarity(matches: SimilarityMatch[]): number {
    if (matches.length === 0) return 0;

    // Weighted average based on match percentage
    const totalSimilarity = matches.reduce(
      (sum, match) => sum + match.matchPercentage,
      0,
    );

    return Math.min(totalSimilarity / matches.length, 100);
  }

  /**
   * Assess plagiarism risk level
   */
  private assessPlagiarismRisk(
    similarity: number,
    flaggedSections: FlaggedSection[],
  ): "low" | "medium" | "high" | "critical" {
    // Check high suspicion sections
    const criticalSections = flaggedSections.filter(
      (s) => s.suspicionLevel === "high",
    );

    if (similarity >= 90 || criticalSections.length >= 3) {
      return "critical";
    } else if (similarity >= 70 || criticalSections.length >= 2) {
      return "high";
    } else if (similarity >= 50 || criticalSections.length >= 1) {
      return "medium";
    }

    return "low";
  }

  /**
   * Analyze flagged sections
   */
  private analyzeFlaggedSections(
    text: string,
    matches: SimilarityMatch[],
  ): FlaggedSection[] {
    const flagged: FlaggedSection[] = [];
    const words = text.split(" ");
    let charIndex = 0;
    const wordToCharIndex: number[] = [];

    // Build word to character index mapping
    for (const word of words) {
      wordToCharIndex.push(charIndex);
      charIndex += word.length + 1;
    }

    matches.forEach((match) => {
      match.matchedSections.forEach((section) => {
        const startChar = wordToCharIndex[section.start] || 0;
        const endChar = wordToCharIndex[section.end] || text.length;
        const matchedText = text.substring(startChar, endChar);

        flagged.push({
          startChar,
          endChar,
          text: matchedText,
          reason: `Matched with source: ${match.sourceTitle}`,
          suspicionLevel:
            match.matchPercentage >= 90
              ? "high"
              : match.matchPercentage >= 70
                ? "medium"
                : "low",
        });
      });
    });

    return flagged.sort((a, b) => a.startChar - b.startChar);
  }

  /**
   * Detect paraphrasing
   */
  async detectParaphrasing(
    essayText: string,
    sourceText: string,
  ): Promise<number> {
    // Calculate semantic similarity
    const essayTokens = this.tokenize(essayText);
    const sourceTokens = this.tokenize(sourceText);

    const commonTokens = essayTokens.filter((token) =>
      sourceTokens.includes(token),
    );

    const paraphrasingScore =
      (commonTokens.length /
        Math.max(essayTokens.length, sourceTokens.length)) *
      100;

    return Math.round(paraphrasingScore);
  }

  /**
   * Tokenize text into meaningful units
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s.,;:!?()]+/)
      .filter((token) => token.length > 2); // Only meaningful words
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(text: string): string[] {
    const patterns: string[] = [];

    // Check for sudden style changes
    const sentences = text.split(/[.!?]+/);
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.split(" ").length, 0) /
      sentences.length;

    sentences.forEach((sentence) => {
      const length = sentence.split(" ").length;
      if (Math.abs(length - avgSentenceLength) > avgSentenceLength * 0.5) {
        patterns.push(
          `Unusual sentence length: "${sentence.substring(0, 50)}..."`,
        );
      }
    });

    // Check for citation mismatch
    const cites = text.match(/\b(according to|cited from|source:|ref:)\b/gi);
    if (
      cites &&
      cites.length > 0 &&
      !text.includes("[") &&
      !text.includes("(")
    ) {
      patterns.push("Citations mentioned but not properly formatted");
    }

    // Check for excessive quotes
    const quoteCount = (text.match(/["']/g) || []).length / 2;
    if (quoteCount / sentences.length > 0.3) {
      patterns.push(
        `High quote density: ${Math.round((quoteCount / sentences.length) * 100)}%`,
      );
    }

    return patterns;
  }

  /**
   * Generate plagiarism report
   */
  async generatePlagiarismReport(
    essayId: string,
    essayText: string,
  ): Promise<any> {
    const plagiarismResult = await this.checkPlagiarism(essayId, essayText);
    const suspiciousPatterns = this.detectSuspiciousPatterns(essayText);

    return {
      essayId,
      timestamp: new Date(),
      overallSimilarity: plagiarismResult.overallSimilarity,
      plagiarismRisk: plagiarismResult.plagiarismRisk,
      originalityScore: plagiarismResult.originalityScore,
      matchCount: plagiarismResult.matches.length,
      topMatches: plagiarismResult.matches.slice(0, 5).map((m) => ({
        source: m.sourceTitle,
        similarity: m.matchPercentage,
      })),
      flaggedSections: plagiarismResult.flaggedSections.length,
      suspiciousPatterns,
      recommendation:
        plagiarismResult.plagiarismRisk === "critical"
          ? "Requires manual review"
          : plagiarismResult.plagiarismRisk === "high"
            ? "Likely plagiarized - investigate"
            : plagiarismResult.plagiarismRisk === "medium"
              ? "Minor concerns - check details"
              : "Appears original",
    };
  }

  /**
   * Get essay sources to compare against
   */
  private async getEssaySources(essayId: string): Promise<string[]> {
    // This would fetch from database of essays, articles, etc.
    // For now, return empty array
    return [];
  }

  /**
   * Generate source ID
   */
  private generateSourceId(source: string): string {
    // Simple hash of source
    return "src_" + Math.abs(this.hashCode(source)).toString();
  }

  /**
   * Simple hash function
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

export default PlagiarismDetectionService;
