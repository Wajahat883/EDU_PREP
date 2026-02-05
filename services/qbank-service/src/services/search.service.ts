import { Client } from "@elastic/elasticsearch";

export class SearchService {
  private client: Client;
  private indexName = "questions";

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    });
  }

  /**
   * Initialize the Elasticsearch index
   */
  async initializeIndex(): Promise<void> {
    try {
      // Check if index exists
      const exists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  standard_analyzer: {
                    type: "standard",
                    stopwords: "_english_",
                  },
                  medical_analyzer: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: ["lowercase", "medical_synonyms"],
                  },
                },
                filter: {
                  medical_synonyms: {
                    type: "synonym",
                    synonyms: [
                      "MI => myocardial infarction",
                      "HTN => hypertension",
                      "DM => diabetes mellitus",
                      "CKD => chronic kidney disease",
                    ],
                  },
                },
              },
            },
            mappings: {
              properties: {
                _id: { type: "keyword" },
                questionId: { type: "keyword" },
                stemText: {
                  type: "text",
                  analyzer: "medical_analyzer",
                  fields: {
                    keyword: { type: "keyword" },
                  },
                },
                explanationText: {
                  type: "text",
                  analyzer: "standard",
                },
                examTypeId: { type: "keyword" },
                subjectId: { type: "keyword" },
                difficulty: { type: "integer" },
                bloomLevel: { type: "keyword" },
                tags: { type: "keyword" },
                options: {
                  type: "nested",
                  properties: {
                    text: { type: "text" },
                    label: { type: "keyword" },
                    isCorrect: { type: "boolean" },
                  },
                },
                statistics: {
                  properties: {
                    attempts: { type: "integer" },
                    correctPercentage: { type: "float" },
                    reportedIssues: { type: "integer" },
                  },
                },
                createdAt: { type: "date" },
              },
            },
          },
        });

        console.log(
          `Elasticsearch index '${this.indexName}' created successfully`,
        );
      }
    } catch (error) {
      console.error("Error initializing Elasticsearch index:", error);
      throw error;
    }
  }

  /**
   * Index a single question
   */
  async indexQuestion(question: any): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: question._id.toString(),
        body: {
          questionId: question._id,
          stemText: question.stemText,
          explanationText: question.explanationText,
          examTypeId: question.examTypeId,
          subjectId: question.subjectId,
          difficulty: question.difficulty,
          bloomLevel: question.bloomLevel,
          tags: question.tags,
          options: question.options.map((opt: any) => ({
            text: opt.text,
            label: opt.label,
            isCorrect: opt.isCorrect,
          })),
          statistics: question.statistics,
          createdAt: question.createdAt,
        },
      });
    } catch (error) {
      console.error("Error indexing question:", error);
      throw error;
    }
  }

  /**
   * Bulk index multiple questions
   */
  async bulkIndexQuestions(questions: any[]): Promise<void> {
    try {
      const body = questions.flatMap((question) => [
        { index: { _index: this.indexName, _id: question._id.toString() } },
        {
          questionId: question._id,
          stemText: question.stemText,
          explanationText: question.explanationText,
          examTypeId: question.examTypeId,
          subjectId: question.subjectId,
          difficulty: question.difficulty,
          bloomLevel: question.bloomLevel,
          tags: question.tags,
          options: question.options.map((opt: any) => ({
            text: opt.text,
            label: opt.label,
            isCorrect: opt.isCorrect,
          })),
          statistics: question.statistics,
          createdAt: question.createdAt,
        },
      ]);

      const result = await this.client.bulk({ body });

      if ((result as any).errors) {
        console.warn("Some documents failed to index:", (result as any).items);
      }
    } catch (error) {
      console.error("Error bulk indexing questions:", error);
      throw error;
    }
  }

  /**
   * Search questions with Elasticsearch
   */
  async search(
    query: string,
    filters?: {
      examTypeId?: string;
      subjectId?: string;
      difficulty?: { $gte?: number; $lte?: number };
      bloomLevel?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<{ questions: any[]; total: number }> {
    try {
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;

      // Build must clauses
      const must: any[] = [
        {
          multi_match: {
            query: query,
            fields: ["stemText^2", "explanationText", "options.text"],
            fuzziness: "AUTO",
          },
        },
      ];

      // Build filter clauses
      const filter: any[] = [];

      if (filters?.examTypeId) {
        filter.push({ term: { examTypeId: filters.examTypeId } });
      }

      if (filters?.subjectId) {
        filter.push({ term: { subjectId: filters.subjectId } });
      }

      if (filters?.bloomLevel) {
        filter.push({ term: { bloomLevel: filters.bloomLevel } });
      }

      if (filters?.tags && filters.tags.length > 0) {
        filter.push({ terms: { tags: filters.tags } });
      }

      // Handle difficulty range
      if (filters?.difficulty) {
        const diffRange: any = {};
        if (filters.difficulty.$gte !== undefined) {
          diffRange.gte = filters.difficulty.$gte;
        }
        if (filters.difficulty.$lte !== undefined) {
          diffRange.lte = filters.difficulty.$lte;
        }
        filter.push({ range: { difficulty: diffRange } });
      }

      // Execute search
      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must,
              filter: filter.length > 0 ? filter : undefined,
            },
          },
          from: offset,
          size: limit,
          highlight: {
            fields: {
              stemText: { number_of_fragments: 3 },
              explanationText: { number_of_fragments: 2 },
            },
          },
        },
      });

      const hits = (result as any).hits;
      const questions = hits.hits.map((hit: any) => ({
        _id: hit._source.questionId,
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight,
      }));

      return {
        questions,
        total: typeof hits.total === "number" ? hits.total : hits.total.value,
      };
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(searchParams: {
    query?: string;
    examType?: string;
    subject?: string;
    bloomLevel?: string;
    tags?: string[];
    difficultyMin?: number;
    difficultyMax?: number;
    minAccuracy?: number;
    maxAttempts?: number;
    reportedIssuesOnly?: boolean;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ questions: any[]; total: number }> {
    try {
      const limit = searchParams.limit || 20;
      const offset = searchParams.offset || 0;

      // Build query
      const must: any[] = [];
      const filter: any[] = [];

      if (searchParams.query && searchParams.query.trim()) {
        must.push({
          multi_match: {
            query: searchParams.query,
            fields: ["stemText^3", "explanationText^2", "options.text"],
            fuzziness: "AUTO",
          },
        });
      }

      // Apply filters
      if (searchParams.examType) {
        filter.push({ term: { examTypeId: searchParams.examType } });
      }

      if (searchParams.subject) {
        filter.push({ term: { subjectId: searchParams.subject } });
      }

      if (searchParams.bloomLevel) {
        filter.push({ term: { bloomLevel: searchParams.bloomLevel } });
      }

      if (searchParams.tags && searchParams.tags.length > 0) {
        filter.push({ terms: { tags: searchParams.tags } });
      }

      // Difficulty range
      if (searchParams.difficultyMin || searchParams.difficultyMax) {
        const diffRange: any = {};
        if (searchParams.difficultyMin)
          diffRange.gte = searchParams.difficultyMin;
        if (searchParams.difficultyMax)
          diffRange.lte = searchParams.difficultyMax;
        filter.push({ range: { difficulty: diffRange } });
      }

      // Accuracy filter
      if (searchParams.minAccuracy) {
        filter.push({
          range: {
            "statistics.correctPercentage": { gte: searchParams.minAccuracy },
          },
        });
      }

      // Attempts filter
      if (searchParams.maxAttempts) {
        filter.push({
          range: { "statistics.attempts": { lte: searchParams.maxAttempts } },
        });
      }

      // Reported issues
      if (searchParams.reportedIssuesOnly) {
        filter.push({
          range: { "statistics.reportedIssues": { gt: 0 } },
        });
      }

      // Determine sort
      let sort: any = [];
      switch (searchParams.sort) {
        case "difficulty":
          sort.push({ difficulty: { order: "desc" } });
          break;
        case "accuracy":
          sort.push({ "statistics.correctPercentage": { order: "desc" } });
          break;
        case "flags":
          sort.push({ "statistics.reportedIssues": { order: "desc" } });
          break;
        case "newest":
        default:
          sort.push({ createdAt: { order: "desc" } });
      }

      // Add relevance score as secondary sort if search query present
      if (searchParams.query) {
        sort.unshift({ _score: { order: "desc" } });
      }

      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: must.length > 0 ? must : { match_all: {} },
              filter: filter.length > 0 ? filter : undefined,
            },
          },
          from: offset,
          size: limit,
          sort,
          highlight: {
            fields: {
              stemText: { number_of_fragments: 5 },
              explanationText: { number_of_fragments: 3 },
            },
          },
        },
      });

      const hits = (result as any).hits;
      const questions = hits.hits.map((hit: any) => ({
        _id: hit._source.questionId,
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight,
      }));

      return {
        questions,
        total: typeof hits.total === "number" ? hits.total : hits.total.value,
      };
    } catch (error) {
      console.error("Advanced search error:", error);
      throw error;
    }
  }

  /**
   * Delete a question from index
   */
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: questionId,
      });
    } catch (error) {
      console.error("Error deleting question from index:", error);
    }
  }

  /**
   * Get Elasticsearch health
   */
  async health(): Promise<any> {
    try {
      return await this.client.cluster.health();
    } catch (error) {
      console.error("Error checking Elasticsearch health:", error);
      throw error;
    }
  }
}
