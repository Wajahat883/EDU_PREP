import { EventEmitter } from "events";

export type SupportedLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "ja"
  | "zh"
  | "ko"
  | "ar"
  | "hi"
  | "th"
  | "vi"
  | "tr"
  | "pl"
  | "nl"
  | "sv"
  | "no"
  | "da";

export interface TranslationKey {
  key: string;
  namespace: string;
  context?: string;
  count?: number;
}

export interface TranslationEntry {
  key: string;
  namespace: string;
  language: SupportedLanguage;
  value: string;
  lastUpdated: Date;
  isApproved: boolean;
  translator?: string;
}

export interface LanguagePreference {
  userId: string;
  primaryLanguage: SupportedLanguage;
  secondaryLanguages: SupportedLanguage[];
  regionCode: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  currency?: string;
  lastUpdated: Date;
}

export interface TranslationProgress {
  language: SupportedLanguage;
  namespace: string;
  totalKeys: number;
  translatedKeys: number;
  approvedKeys: number;
  completionPercent: number;
}

export class InternationalizationService extends EventEmitter {
  private translations: Map<string, TranslationEntry> = new Map();
  private languagePreferences: Map<string, LanguagePreference> = new Map();
  private namespaces: Set<string> = new Set();
  private supportedLanguages: SupportedLanguage[] = [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ru",
    "ja",
    "zh",
    "ko",
    "ar",
    "hi",
    "th",
    "vi",
    "tr",
    "pl",
    "nl",
    "sv",
    "no",
    "da",
  ];
  private fallbackLanguage: SupportedLanguage = "en";

  constructor() {
    super();
    this.initializeDefaultTranslations();
  }

  private initializeDefaultTranslations(): void {
    // Initialize English translations (fallback)
    const enTranslations = [
      // UI
      { key: "welcome", value: "Welcome to EduPrep" },
      { key: "login", value: "Login" },
      { key: "logout", value: "Logout" },
      { key: "register", value: "Register" },
      { key: "profile", value: "Profile" },
      { key: "settings", value: "Settings" },
      // Learning
      { key: "start_test", value: "Start Test" },
      { key: "submit_test", value: "Submit Test" },
      { key: "results", value: "Results" },
      { key: "score", value: "Score" },
      { key: "time_remaining", value: "Time Remaining" },
      // Achievements
      { key: "achievements", value: "Achievements" },
      { key: "unlock_achievement", value: "Achievement Unlocked!" },
      { key: "level_up", value: "Level Up!" },
      // Messages
      { key: "error_generic", value: "An error occurred" },
      { key: "loading", value: "Loading..." },
      { key: "success", value: "Success!" },
    ];

    for (const trans of enTranslations) {
      this.addTranslation({
        key: trans.key,
        namespace: "common",
        language: "en",
        value: trans.value,
        lastUpdated: new Date(),
        isApproved: true,
      });
    }
  }

  // Add translation
  addTranslation(entry: TranslationEntry): void {
    const entryKey = `${entry.namespace}:${entry.key}:${entry.language}`;
    this.translations.set(entryKey, entry);
    this.namespaces.add(entry.namespace);

    this.emit("translation:added", {
      key: entry.key,
      language: entry.language,
      namespace: entry.namespace,
    });
  }

  // Get translation
  getTranslation(
    key: string,
    namespace: string = "common",
    language: SupportedLanguage = this.fallbackLanguage,
    context?: string,
  ): string {
    const entryKey = `${namespace}:${key}:${language}`;
    let entry = this.translations.get(entryKey);

    // Fallback to default language if not found
    if (!entry && language !== this.fallbackLanguage) {
      const fallbackKey = `${namespace}:${key}:${this.fallbackLanguage}`;
      entry = this.translations.get(fallbackKey);
    }

    if (!entry) {
      return `[${namespace}:${key}]`; // Return key as placeholder
    }

    return entry.value;
  }

  // Translate multiple keys
  translateBatch(
    keys: string[],
    namespace: string = "common",
    language: SupportedLanguage = this.fallbackLanguage,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key of keys) {
      result[key] = this.getTranslation(key, namespace, language);
    }

    return result;
  }

  // Set user language preference
  setLanguagePreference(
    userId: string,
    preference: Omit<LanguagePreference, "userId" | "lastUpdated">,
  ): void {
    const existing = this.languagePreferences.get(userId) || {
      userId,
      primaryLanguage: "en" as SupportedLanguage,
      secondaryLanguages: [],
      regionCode: "US",
      dateFormat: "MM/DD/YYYY" as const,
      timeFormat: "12h" as const,
      lastUpdated: new Date(),
    };

    const updated: LanguagePreference = {
      ...existing,
      ...preference,
      userId,
      lastUpdated: new Date(),
    };

    this.languagePreferences.set(userId, updated);

    this.emit("preference:updated", {
      userId,
      language: preference.primaryLanguage,
      region: preference.regionCode,
    });
  }

  // Get user language preference
  getLanguagePreference(userId: string): LanguagePreference {
    return (
      this.languagePreferences.get(userId) || {
        userId,
        primaryLanguage: "en" as SupportedLanguage,
        secondaryLanguages: [],
        regionCode: "US",
        dateFormat: "MM/DD/YYYY" as const,
        timeFormat: "12h" as const,
        currency: "USD",
        lastUpdated: new Date(),
      }
    );
  }

  // Format date based on user preference
  formatDate(date: Date, userId: string): string {
    const pref = this.getLanguagePreference(userId);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    switch (pref.dateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "MM/DD/YYYY":
      default:
        return `${month}/${day}/${year}`;
    }
  }

  // Format time based on user preference
  formatTime(date: Date, userId: string): string {
    const pref = this.getLanguagePreference(userId);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    if (pref.timeFormat === "24h") {
      return `${hours}:${minutes}:${seconds}`;
    }

    // 12h format
    let hour12 = date.getHours();
    const period = hour12 >= 12 ? "PM" : "AM";
    hour12 = hour12 % 12;
    if (hour12 === 0) hour12 = 12;

    return `${String(hour12).padStart(2, "0")}:${minutes}:${seconds} ${period}`;
  }

  // Format number based on language/region
  formatNumber(
    value: number,
    userId: string,
    decimalPlaces: number = 2,
  ): string {
    const pref = this.getLanguagePreference(userId);
    const formatted = value.toFixed(decimalPlaces);

    // Use locale-specific formatting
    const locale = `${pref.primaryLanguage}-${pref.regionCode}`;
    return new Intl.NumberFormat(locale).format(parseFloat(formatted));
  }

  // Format currency based on user preference
  formatCurrency(amount: number, userId: string, currency?: string): string {
    const pref = this.getLanguagePreference(userId);
    const curr = currency || pref.currency || "USD";
    const locale = `${pref.primaryLanguage}-${pref.regionCode}`;

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: curr,
    }).format(amount);
  }

  // Get translation progress
  getTranslationProgress(
    language: SupportedLanguage,
    namespace?: string,
  ): TranslationProgress[] {
    const namespaces = namespace ? [namespace] : Array.from(this.namespaces);
    const progress: TranslationProgress[] = [];

    for (const ns of namespaces) {
      const allKeys = Array.from(this.translations.values()).filter(
        (t) => t.namespace === ns && t.language === this.fallbackLanguage,
      ).length;

      const translated = Array.from(this.translations.values()).filter(
        (t) => t.namespace === ns && t.language === language,
      ).length;

      const approved = Array.from(this.translations.values()).filter(
        (t) => t.namespace === ns && t.language === language && t.isApproved,
      ).length;

      progress.push({
        language,
        namespace: ns,
        totalKeys: allKeys,
        translatedKeys: translated,
        approvedKeys: approved,
        completionPercent: allKeys > 0 ? (approved / allKeys) * 100 : 0,
      });
    }

    return progress;
  }

  // Get language statistics
  getLanguageStatistics(): Record<
    SupportedLanguage,
    { translated: number; approved: number }
  > {
    const stats: Record<string, { translated: number; approved: number }> = {};

    for (const lang of this.supportedLanguages) {
      const translated = Array.from(this.translations.values()).filter(
        (t) => t.language === lang,
      ).length;

      const approved = Array.from(this.translations.values()).filter(
        (t) => t.language === lang && t.isApproved,
      ).length;

      stats[lang] = { translated, approved };
    }

    return stats as Record<
      SupportedLanguage,
      { translated: number; approved: number }
    >;
  }

  // Get supported languages
  getSupportedLanguages(): SupportedLanguage[] {
    return this.supportedLanguages;
  }

  // Get untranslated keys
  getUntranslatedKeys(language: SupportedLanguage): string[] {
    const fallbackKeys = new Set(
      Array.from(this.translations.values())
        .filter((t) => t.language === this.fallbackLanguage)
        .map((t) => `${t.namespace}:${t.key}`),
    );

    const translatedKeys = new Set(
      Array.from(this.translations.values())
        .filter((t) => t.language === language)
        .map((t) => `${t.namespace}:${t.key}`),
    );

    const untranslated: string[] = [];
    for (const key of fallbackKeys) {
      if (!translatedKeys.has(key)) {
        untranslated.push(key);
      }
    }

    return untranslated;
  }

  // Bulk add translations
  bulkAddTranslations(entries: TranslationEntry[]): number {
    let count = 0;
    for (const entry of entries) {
      try {
        this.addTranslation(entry);
        count++;
      } catch (error) {
        this.emit("translation:error", {
          entry,
          error: (error as Error).message,
        });
      }
    }

    this.emit("translations:bulk-added", {
      count,
      total: entries.length,
    });

    return count;
  }
}

export const internationalizationService = new InternationalizationService();

export default InternationalizationService;
