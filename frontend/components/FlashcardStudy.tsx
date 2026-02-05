/**
 * Flashcard Study Interface Component
 *
 * Interactive spaced repetition study interface with:
 * - Card flip animation
 * - Quality rating buttons (0-5)
 * - Timer and response tracking
 * - Progress indication
 * - Navigation between cards
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  FlipToFront,
  VolumeUp,
  Star,
  StarBorder,
  SkipNext,
} from "@mui/icons-material";
import axios from "axios";

interface FlashcardSession {
  deckId: string;
  deckName: string;
}

interface Card {
  cardId: string;
  front: string;
  back: string;
  explanation?: string;
  difficulty: string;
  currentInterval: number;
  currentEase: number;
  lastReviewDate: Date;
}

interface SessionStats {
  cardCount: number;
  correctCount: number;
  totalTime: number; // seconds
}

/**
 * Flashcard Study Component
 *
 * Features:
 * - Front/back card flipping with animation
 * - Quality rating (0-5 scale)
 * - Audio pronunciation
 * - Bookmark/favorite cards
 * - Session tracking
 * - Progress bar
 */
const FlashcardStudy: React.FC<FlashcardSession> = ({ deckId, deckName }) => {
  // State management
  const [card, setCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [reviewedCards, setReviewedCards] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    cardCount: 0,
    correctCount: 0,
    totalTime: 0,
  });
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load next card from queue
  const loadNextCard = useCallback(async () => {
    try {
      setLoading(true);
      const excludeIds = reviewedCards.join(",");
      const response = await axios.get(
        `/api/flashcards/decks/${deckId}/next-card`,
        {
          params: { exclude: excludeIds },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.data.card) {
        setCard(response.data.card);
        setIsFlipped(false);
        setCardStartTime(Date.now());
      } else {
        // No more cards to review
        setShowFinishDialog(true);
      }
    } catch (error) {
      console.error("Error loading card:", error);
      if ((error as any).response?.status === 404) {
        setShowFinishDialog(true);
      }
    } finally {
      setLoading(false);
    }
  }, [deckId, reviewedCards]);

  // Load first card on mount
  useEffect(() => {
    loadNextCard();
  }, []);

  /**
   * Handle quality rating and advance to next card
   *
   * Quality Scale:
   * 0 = No recollection (forgot)
   * 1 = Incorrect response; correct answer was easy to recall
   * 2 = Incorrect response; correct answer was somewhat difficult
   * 3 = Correct response after some hesitation
   * 4 = Correct response after a moment
   * 5 = Correct response with perfect clarity
   */
  const handleRating = async (quality: number) => {
    if (!card) return;

    try {
      const responseTime = Date.now() - cardStartTime;

      // Record review
      await axios.post(
        `/api/flashcards/cards/${card.cardId}/review`,
        {
          quality,
          responseTime,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      // Update session stats
      const newStats = { ...sessionStats };
      newStats.cardCount++;
      if (quality >= 3) {
        newStats.correctCount++;
      }
      setSessionStats(newStats);

      // Mark card as reviewed
      setReviewedCards([...reviewedCards, card.cardId]);

      // Load next card
      await loadNextCard();
    } catch (error) {
      console.error("Error recording review:", error);
      alert("Failed to record review. Please try again.");
    }
  };

  /**
   * Handle session completion
   */
  const handleFinishSession = async () => {
    try {
      const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);

      await axios.post(
        `/api/flashcards/decks/${deckId}/session`,
        {
          cardCount: sessionStats.cardCount,
          correctCount: sessionStats.correctCount,
          totalTime,
          sessionType: "mixed",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      // Redirect to deck view
      window.location.href = `/flashcards/decks/${deckId}`;
    } catch (error) {
      console.error("Error finishing session:", error);
      alert("Failed to save session. Please try again.");
    }
  };

  if (loading && !card) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
        <Typography>Loading cards...</Typography>
      </Container>
    );
  }

  const progress =
    sessionStats.cardCount > 0
      ? (sessionStats.correctCount / sessionStats.cardCount) * 100
      : 0;

  const difficulty = card?.difficulty || "medium";
  const difficultyColor =
    difficulty === "easy"
      ? "success"
      : difficulty === "hard"
        ? "error"
        : "warning";

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {deckName}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Chip label={`Cards: ${sessionStats.cardCount}`} variant="outlined" />
          <Chip
            label={`Correct: ${sessionStats.correctCount}/${sessionStats.cardCount}`}
            color="success"
            variant="outlined"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
          Accuracy: {sessionStats.cardCount > 0 ? progress.toFixed(0) : "N/A"}%
        </Typography>
      </Box>

      {/* Flashcard */}
      {card && (
        <>
          {/* Card Container */}
          <Paper
            onClick={() => setIsFlipped(!isFlipped)}
            sx={{
              p: 4,
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              perspective: "1000px",
              backgroundColor: isFlipped ? "#f5f5f5" : "#fff",
              border: "2px solid #e0e0e0",
              borderRadius: 2,
              mb: 3,
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: 3,
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              {/* Difficulty Badge */}
              <Chip
                label={difficulty.toUpperCase()}
                color={difficultyColor}
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Card Content */}
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: isFlipped ? "normal" : "bold",
                  minHeight: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isFlipped ? card.back : card.front}
              </Typography>

              {/* Flip indicator */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  color: "#999",
                  fontSize: "0.9rem",
                  mt: 2,
                }}
              >
                <FlipToFront sx={{ fontSize: "1rem" }} />
                <Typography variant="caption">
                  {isFlipped
                    ? "Click to see question"
                    : "Click to reveal answer"}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Card Info */}
          <Box sx={{ mb: 3 }}>
            <Chip
              label={`Ease: ${card.currentEase.toFixed(2)}`}
              size="small"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`Interval: ${card.currentInterval}d`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Show explanation if flipped */}
          {isFlipped && card.explanation && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: "#fafafa",
                borderLeft: "4px solid #2196f3",
              }}
            >
              <Typography variant="body2" color="textSecondary">
                <strong>Explanation:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {card.explanation}
              </Typography>
            </Paper>
          )}

          {/* Quality Rating Buttons */}
          {isFlipped && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2, textAlign: "center" }}>
                How well did you remember?
              </Typography>

              {/* Quality Scale */}
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {[
                  { value: 0, label: "Forget", color: "error" },
                  { value: 1, label: "Hard", color: "warning" },
                  { value: 2, label: "Difficult", color: "warning" },
                  { value: 3, label: "OK", color: "info" },
                  { value: 4, label: "Good", color: "success" },
                  { value: 5, label: "Perfect", color: "success" },
                ].map((option) => (
                  <Grid item xs={6} key={option.value}>
                    <Button
                      fullWidth
                      variant="contained"
                      color={option.color as any}
                      onClick={() => handleRating(option.value)}
                      size="small"
                    >
                      {option.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="outlined"
              startIcon={isStarred ? <Star /> : <StarBorder />}
              onClick={() => setIsStarred(!isStarred)}
            >
              {isStarred ? "Starred" : "Star"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<SkipNext />}
              onClick={() => {
                setReviewedCards([...reviewedCards, card.cardId]);
                loadNextCard();
              }}
            >
              Skip
            </Button>
          </Box>

          {/* Session End Button */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setShowFinishDialog(true)}
            >
              End Session
            </Button>
          </Box>
        </>
      )}

      {/* Finish Session Dialog */}
      <Dialog
        open={showFinishDialog}
        onClose={() => setShowFinishDialog(false)}
      >
        <DialogTitle>End Study Session?</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Session Summary:</strong>
            </Typography>
            <Typography variant="body2">
              Cards Reviewed: <strong>{sessionStats.cardCount}</strong>
            </Typography>
            <Typography variant="body2">
              Correct: <strong>{sessionStats.correctCount}</strong>
            </Typography>
            <Typography variant="body2">
              Accuracy:{" "}
              <strong>
                {sessionStats.cardCount > 0
                  ? (
                      (sessionStats.correctCount / sessionStats.cardCount) *
                      100
                    ).toFixed(0)
                  : "N/A"}
                %
              </strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Your progress has been saved. Keep up the good work!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFinishDialog(false)} color="secondary">
            Continue
          </Button>
          <Button
            onClick={handleFinishSession}
            variant="contained"
            color="primary"
          >
            Save & Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FlashcardStudy;

/**
 * Usage in Next.js page:
 *
 * export default function StudyPage() {
 *   const router = useRouter();
 *   const { deckId } = router.query;
 *   const [deckName, setDeckName] = useState('');
 *
 *   useEffect(() => {
 *     // Fetch deck name from API
 *     axios.get(`/api/flashcards/decks/${deckId}`)
 *       .then(res => setDeckName(res.data.deck.name));
 *   }, [deckId]);
 *
 *   return (
 *     <FlashcardStudy
 *       deckId={deckId as string}
 *       deckName={deckName}
 *     />
 *   );
 * }
 */
