import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
import { apiClient } from "../services/mobileApiClient";

interface Question {
  id: string;
  text: string;
  options?: string[];
  type: "multiple-choice" | "short-answer" | "true-false";
}

interface TestSession {
  testId: string;
  currentQuestion: number;
  totalQuestions: number;
  elapsedTime: number;
  answers: Record<string, any>;
}

const TestScreen: React.FC<{ testId: string; onComplete?: () => void }> = ({
  testId,
  onComplete,
}) => {
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const startTest = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.startTest(testId);

      setSession({
        testId,
        currentQuestion: 0,
        totalQuestions: result.totalQuestions,
        elapsedTime: 0,
        answers: {},
      });

      setTimeRemaining(result.duration * 60); // Convert to seconds
      loadQuestion(0, result.questions[0]);
    } catch (error) {
      Alert.alert("Error", "Failed to start test");
      console.error("Test start error:", error);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const loadQuestion = async (index: number, questionId: string) => {
    try {
      const question = await apiClient.getQuestion(questionId);
      setCurrentQuestion(question);
      setSelectedAnswer(null);
    } catch (error) {
      Alert.alert("Error", "Failed to load question");
    }
  };

  const submitAnswer = useCallback(async () => {
    if (selectedAnswer === null) {
      Alert.alert("Warning", "Please select an answer");
      return;
    }

    if (!session || !currentQuestion) return;

    try {
      setLoading(true);
      await apiClient.submitTestAnswer(
        testId,
        currentQuestion.id,
        selectedAnswer,
      );

      const nextIndex = session.currentQuestion + 1;
      const newAnswers = {
        ...session.answers,
        [currentQuestion.id]: selectedAnswer,
      };

      if (nextIndex >= session.totalQuestions) {
        // Test complete
        endTest(newAnswers);
      } else {
        setSession({
          ...session,
          currentQuestion: nextIndex,
          answers: newAnswers,
        });

        // Load next question (would need test structure with questions)
        setSelectedAnswer(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  }, [session, currentQuestion, selectedAnswer, testId]);

  const endTest = useCallback(
    async (finalAnswers: Record<string, any>) => {
      try {
        setLoading(true);
        const result = await apiClient.endTest(testId);

        Alert.alert("Test Complete", `Your score: ${result.score}%`, [
          {
            text: "View Results",
            onPress: () => {
              onComplete?.();
            },
          },
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to end test");
      } finally {
        setLoading(false);
      }
    },
    [testId, onComplete],
  );

  if (!session) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={startTest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>Start Test</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.progress}>
          Question {session.currentQuestion + 1} of {session.totalQuestions}
        </Text>
        <View style={styles.timer}>
          <Text style={styles.timerText}>{formatTime(timeRemaining || 0)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Question */}
        {currentQuestion && (
          <>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>

            {/* Options */}
            {currentQuestion.type === "multiple-choice" &&
              currentQuestion.options && (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.option,
                        selectedAnswer === index && styles.optionSelected,
                      ]}
                      onPress={() => setSelectedAnswer(index)}
                    >
                      <View
                        style={[
                          styles.radioButton,
                          selectedAnswer === index &&
                            styles.radioButtonSelected,
                        ]}
                      />
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            {currentQuestion.type === "true-false" && (
              <View style={styles.trueFalseContainer}>
                {[true, false].map((value) => (
                  <TouchableOpacity
                    key={String(value)}
                    style={[
                      styles.tfButton,
                      selectedAnswer === value && styles.tfButtonSelected,
                    ]}
                    onPress={() => setSelectedAnswer(value)}
                  >
                    <Text style={styles.tfButtonText}>
                      {value ? "True" : "False"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {currentQuestion.type === "short-answer" && (
              <View style={styles.shortAnswerContainer}>
                {/* Would integrate text input here */}
                <Text style={styles.inputPlaceholder}>
                  Short answer input field
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => {
            const nextIndex = session.currentQuestion + 1;
            if (nextIndex >= session.totalQuestions) {
              endTest(session.answers);
            } else {
              setSession({
                ...session,
                currentQuestion: nextIndex,
              });
              setSelectedAnswer(null);
            }
          }}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={submitAnswer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {session.currentQuestion === session.totalQuestions - 1
                ? "Finish"
                : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  progress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  timer: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  timerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    marginVertical: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 8,
  },
  optionSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#999",
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: "#2196F3",
    backgroundColor: "#2196F3",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  trueFalseContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  tfButton: {
    flex: 0.4,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
  },
  tfButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  tfButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  shortAnswerContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  inputPlaceholder: {
    color: "#999",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    borderWidth: 2,
    borderColor: "#999",
  },
  skipButtonText: {
    color: "#999",
    fontWeight: "600",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#2196F3",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  startButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2196F3",
    margin: 16,
    borderRadius: 8,
    paddingVertical: 16,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default TestScreen;
