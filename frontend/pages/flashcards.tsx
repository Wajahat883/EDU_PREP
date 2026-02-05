import React, { useState } from "react";
import { MainLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Progress,
} from "@/components/ui";

export default function FlashcardsPage() {
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const decks = [
    {
      id: 1,
      name: "Anatomy - Upper Limb",
      cards: 245,
      studied: 180,
      retention: 85,
      lastStudied: "2 days ago",
    },
    {
      id: 2,
      name: "Biochemistry - Enzymes",
      cards: 156,
      studied: 82,
      retention: 72,
      lastStudied: "5 days ago",
    },
    {
      id: 3,
      name: "Pharmacology - NSAIDs",
      cards: 128,
      studied: 98,
      retention: 88,
      lastStudied: "Today",
    },
    {
      id: 4,
      name: "Pathology - Inflammation",
      cards: 189,
      studied: 45,
      retention: 64,
      lastStudied: "Never",
    },
  ];

  const studyCards = [
    {
      front: "What is the action of deltoid muscle?",
      back: "Abduction of the shoulder joint (primary action). Also assists in flexion and extension.",
    },
    {
      front: "Innervation of deltoid?",
      back: "Axillary nerve (C5-C6)",
    },
    {
      front: "Blood supply to deltoid?",
      back: "Anterior and posterior circumflex humeral arteries",
    },
  ];

  const currentDeck = decks.find((d) => d.id === selectedDeck);
  const currentCard = studyCards[currentCardIndex];

  if (studyMode && currentDeck) {
    return (
      <MainLayout
        navLinks={[
          { href: "/dashboard", label: "Dashboard", icon: "📊" },
          { href: "/qbank", label: "Question Bank", icon: "📚" },
          { href: "/flashcards", label: "Flashcards", icon: "🧠" },
          { href: "/analytics", label: "Analytics", icon: "📈" },
        ]}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="outline"
              onClick={() => setStudyMode(false)}
              className="mb-4"
            >
              ← Back to Decks
            </Button>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {currentDeck.name}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Card {currentCardIndex + 1} of {studyCards.length}
            </p>
          </div>

          {/* Progress */}
          <Progress
            value={currentCardIndex + 1}
            max={studyCards.length}
            label={`Progress: ${currentCardIndex + 1}/${studyCards.length}`}
            showLabel={true}
            variant="primary"
          />

          {/* Card */}
          <div
            className="h-64 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-xl cursor-pointer flex items-center justify-center p-8 text-white transition-transform transform hover:scale-105 active:scale-95"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="text-center">
              <p className="text-sm opacity-75 mb-3">
                {isFlipped ? "Answer" : "Question"}
              </p>
              <p className="text-2xl font-semibold mb-4">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
              <p className="text-xs opacity-50">Click to flip</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  if (currentCardIndex > 0) {
                    setCurrentCardIndex(currentCardIndex - 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentCardIndex === 0}
              >
                ← Previous
              </Button>

              <Button
                variant="outline"
                fullWidth
                className="text-warning-600 dark:text-warning-400"
              >
                ⭐ Flag
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  if (currentCardIndex < studyCards.length - 1) {
                    setCurrentCardIndex(currentCardIndex + 1);
                    setIsFlipped(false);
                  } else {
                    setStudyMode(false);
                  }
                }}
              >
                Next →
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" fullWidth>
                ❌ Forgot
              </Button>
              <Button variant="success" fullWidth>
                ✓ Got It
              </Button>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => setStudyMode(false)}
            >
              Exit Study Session
            </Button>
          </div>

          {/* Stats */}
          <Card elevated>
            <CardHeader>
              <h3 className="text-lg font-semibold">Session Stats</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Reviewed
                </p>
                <p className="text-2xl font-bold">{currentCardIndex + 1}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Correct
                </p>
                <p className="text-2xl font-bold text-success-600">
                  {Math.floor((currentCardIndex + 1) * 0.85)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Accuracy
                </p>
                <p className="text-2xl font-bold text-warning-600">85%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      navLinks={[
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/qbank", label: "Question Bank", icon: "📚" },
        { href: "/flashcards", label: "Flashcards", icon: "🧠" },
        { href: "/analytics", label: "Analytics", icon: "📈" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Flashcards
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            AI-powered spaced repetition for optimal learning
          </p>
        </div>

        {/* Decks Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              interactive
              elevated
              onClick={() => setSelectedDeck(deck.id)}
              className={
                selectedDeck === deck.id ? "ring-2 ring-primary-500" : ""
              }
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                      {deck.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Last studied: {deck.lastStudied}
                    </p>
                  </div>
                  <Badge variant="primary" size="sm">
                    {deck.retention}%
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Progress
                    </span>
                    <span className="text-neutral-900 dark:text-white font-semibold">
                      {deck.studied}/{deck.cards}
                    </span>
                  </div>
                  <Progress
                    value={deck.studied}
                    max={deck.cards}
                    showLabel={false}
                    variant="success"
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Total Cards
                    </p>
                    <p className="font-semibold">{deck.cards}</p>
                  </div>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Retention
                    </p>
                    <p className="font-semibold text-success-600">
                      {deck.retention}%
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  fullWidth
                  variant={selectedDeck === deck.id ? "primary" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDeck(deck.id);
                    setStudyMode(true);
                  }}
                >
                  Study Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card
          elevated
          className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-900"
        >
          <CardHeader>
            <h3 className="text-lg font-semibold">💡 Study Tips</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              • Study consistently: 15-20 minutes daily is better than 2-hour
              cram sessions
            </p>
            <p>
              • Focus on weak areas: Review cards with low retention rates more
              frequently
            </p>
            <p>
              • Mix decks: Combine different decks to build connections between
              topics
            </p>
            <p>
              • Take breaks: Use the Pomodoro technique (25 min study + 5 min
              break)
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
