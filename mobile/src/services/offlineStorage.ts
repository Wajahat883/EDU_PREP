import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export interface CachedQuestion {
  id: string;
  text: string;
  options: string[];
  subject: string;
  difficulty: number;
  timestamp: number;
}

export interface CachedTest {
  id: string;
  title: string;
  description: string;
  questions: string[];
  duration: number;
  timestamp: number;
}

export interface OfflineAnswer {
  questionId: string;
  answer: any;
  testId?: string;
  timestamp: number;
  synced: boolean;
}

export class OfflineStorage {
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly QUESTIONS_KEY = "offline_questions";
  private readonly TESTS_KEY = "offline_tests";
  private readonly ANSWERS_KEY = "offline_answers";
  private readonly STUDY_NOTES_KEY = "study_notes";
  private readonly BOOKMARKS_KEY = "bookmarks";

  async cacheQuestion(question: CachedQuestion): Promise<void> {
    try {
      const cached = await this.getQuestions();
      const index = cached.findIndex((q) => q.id === question.id);

      if (index !== -1) {
        cached[index] = question;
      } else {
        cached.push(question);
      }

      await AsyncStorage.setItem(this.QUESTIONS_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error("Failed to cache question:", error);
    }
  }

  async getQuestions(): Promise<CachedQuestion[]> {
    try {
      const cached = await AsyncStorage.getItem(this.QUESTIONS_KEY);
      if (!cached) return [];

      const questions = JSON.parse(cached) as CachedQuestion[];
      // Filter out expired cache
      return questions.filter(
        (q) => Date.now() - q.timestamp < this.CACHE_DURATION,
      );
    } catch (error) {
      console.error("Failed to retrieve cached questions:", error);
      return [];
    }
  }

  async getQuestion(id: string): Promise<CachedQuestion | null> {
    try {
      const questions = await this.getQuestions();
      return questions.find((q) => q.id === id) || null;
    } catch (error) {
      console.error("Failed to get question:", error);
      return null;
    }
  }

  async cacheTest(test: CachedTest): Promise<void> {
    try {
      const cached = await this.getTests();
      const index = cached.findIndex((t) => t.id === test.id);

      if (index !== -1) {
        cached[index] = test;
      } else {
        cached.push(test);
      }

      await AsyncStorage.setItem(this.TESTS_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error("Failed to cache test:", error);
    }
  }

  async getTests(): Promise<CachedTest[]> {
    try {
      const cached = await AsyncStorage.getItem(this.TESTS_KEY);
      if (!cached) return [];

      const tests = JSON.parse(cached) as CachedTest[];
      return tests.filter(
        (t) => Date.now() - t.timestamp < this.CACHE_DURATION,
      );
    } catch (error) {
      console.error("Failed to retrieve cached tests:", error);
      return [];
    }
  }

  async getTest(id: string): Promise<CachedTest | null> {
    try {
      const tests = await this.getTests();
      return tests.find((t) => t.id === id) || null;
    } catch (error) {
      console.error("Failed to get test:", error);
      return null;
    }
  }

  async saveOfflineAnswer(answer: OfflineAnswer): Promise<void> {
    try {
      const answers = await this.getOfflineAnswers();
      answers.push(answer);
      await AsyncStorage.setItem(this.ANSWERS_KEY, JSON.stringify(answers));
    } catch (error) {
      console.error("Failed to save answer:", error);
      Alert.alert("Error", "Failed to save answer offline");
    }
  }

  async getOfflineAnswers(): Promise<OfflineAnswer[]> {
    try {
      const stored = await AsyncStorage.getItem(this.ANSWERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to retrieve offline answers:", error);
      return [];
    }
  }

  async getUnsyncedAnswers(): Promise<OfflineAnswer[]> {
    try {
      const answers = await this.getOfflineAnswers();
      return answers.filter((a) => !a.synced);
    } catch (error) {
      console.error("Failed to get unsynced answers:", error);
      return [];
    }
  }

  async markAnswerSynced(timestamp: number): Promise<void> {
    try {
      const answers = await this.getOfflineAnswers();
      const answer = answers.find((a) => a.timestamp === timestamp);
      if (answer) {
        answer.synced = true;
        await AsyncStorage.setItem(this.ANSWERS_KEY, JSON.stringify(answers));
      }
    } catch (error) {
      console.error("Failed to mark answer synced:", error);
    }
  }

  async saveStudyNote(questionId: string, note: string): Promise<void> {
    try {
      const notes = await this.getStudyNotes();
      notes[questionId] = {
        content: note,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.STUDY_NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save study note:", error);
    }
  }

  async getStudyNotes(): Promise<Record<string, any>> {
    try {
      const stored = await AsyncStorage.getItem(this.STUDY_NOTES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to retrieve study notes:", error);
      return {};
    }
  }

  async toggleBookmark(questionId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const index = bookmarks.indexOf(questionId);

      if (index !== -1) {
        bookmarks.splice(index, 1);
      } else {
        bookmarks.push(questionId);
      }

      await AsyncStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return index === -1; // Return true if added, false if removed
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      return false;
    }
  }

  async getBookmarks(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(this.BOOKMARKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to retrieve bookmarks:", error);
      return [];
    }
  }

  async isBookmarked(questionId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.includes(questionId);
    } catch (error) {
      return false;
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const questions = await this.getQuestions();
      const tests = await this.getTests();

      await AsyncStorage.setItem(this.QUESTIONS_KEY, JSON.stringify(questions));
      await AsyncStorage.setItem(this.TESTS_KEY, JSON.stringify(tests));
    } catch (error) {
      console.error("Failed to clear expired cache:", error);
    }
  }

  async clearAllOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUESTIONS_KEY);
      await AsyncStorage.removeItem(this.TESTS_KEY);
      await AsyncStorage.removeItem(this.ANSWERS_KEY);
      await AsyncStorage.removeItem(this.STUDY_NOTES_KEY);
      await AsyncStorage.removeItem(this.BOOKMARKS_KEY);
    } catch (error) {
      console.error("Failed to clear offline data:", error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = [
        this.QUESTIONS_KEY,
        this.TESTS_KEY,
        this.ANSWERS_KEY,
        this.STUDY_NOTES_KEY,
        this.BOOKMARKS_KEY,
      ];
      const items = await AsyncStorage.multiGet(keys);

      return items.reduce((size, [_, value]) => {
        return size + (value ? value.length : 0);
      }, 0);
    } catch (error) {
      console.error("Failed to get cache size:", error);
      return 0;
    }
  }
}

export const offlineStorage = new OfflineStorage();
