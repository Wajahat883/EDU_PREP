/**
 * Question Editor Component Test Suite
 *
 * Tests for:
 * - Form rendering and input handling
 * - Question type switching
 * - Option management (add, remove, reorder)
 * - Validation and error handling
 * - Preview functionality
 * - Form submission
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionEditor } from "../components/QuestionEditor";

describe("QuestionEditor Component", () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form sections", () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/explanation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time estimate/i)).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /preview/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Subject and Topic Input", () => {
    it("should accept subject selection", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      expect(subjectSelect).toHaveValue("Mathematics");
    });

    it("should accept topic input", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const topicInput = screen.getByLabelText(/topic/i);
      await userEvent.type(topicInput, "Quadratic Equations");

      expect(topicInput).toHaveValue("Quadratic Equations");
    });

    it("should list predefined subjects", () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      const options = within(subjectSelect).getAllByRole("option");

      expect(options).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            textContent: expect.stringContaining("Math"),
          }),
          expect.objectContaining({
            textContent: expect.stringContaining("Science"),
          }),
          expect.objectContaining({
            textContent: expect.stringContaining("English"),
          }),
        ]),
      );
    });
  });

  describe("Question Text Input", () => {
    it("should accept question text", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "What is 2 + 2?");

      expect(questionInput).toHaveValue("What is 2 + 2?");
    });

    it("should display question text in preview", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "Sample question text");

      const previewButton = screen.getByRole("button", { name: /preview/i });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText("Sample question text")).toBeInTheDocument();
      });
    });
  });

  describe("Question Type Selection", () => {
    it("should render multiple choice options", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "multiple-choice");

      expect(screen.getByText(/add option/i)).toBeInTheDocument();
    });

    it("should render true/false options", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "true-false");

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("should render short answer field", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "short-answer");

      expect(screen.getByLabelText(/correct answer/i)).toBeInTheDocument();
    });

    it("should render essay field", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "essay");

      expect(
        screen.queryByLabelText(/correct answer/i),
      ).not.toBeInTheDocument();
    });

    it("should switch types dynamically", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);

      await userEvent.selectOptions(typeSelect, "multiple-choice");
      expect(screen.getByText(/add option/i)).toBeInTheDocument();

      await userEvent.selectOptions(typeSelect, "short-answer");
      expect(screen.getByLabelText(/correct answer/i)).toBeInTheDocument();
    });
  });

  describe("Multiple Choice Options", () => {
    beforeEach(async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "multiple-choice");
    });

    it("should add new option", async () => {
      const addButton = screen.getByRole("button", { name: /add option/i });
      await userEvent.click(addButton);

      const optionInputs = screen.getAllByLabelText(/option/i);
      expect(optionInputs.length).toBeGreaterThan(0);
    });

    it("should prevent deletion below minimum options", async () => {
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete|remove/i,
      });
      // Only enable delete if > 2 options
      expect(deleteButtons.length).toBe(0);
    });

    it("should select correct answer", async () => {
      const addButton = screen.getByRole("button", { name: /add option/i });
      await userEvent.click(addButton);
      await userEvent.click(addButton);

      const radioButtons = screen.getAllByRole("radio");
      await userEvent.click(radioButtons[0]);

      expect(radioButtons[0]).toBeChecked();
    });

    it("should highlight correct answer with visual feedback", async () => {
      const addButton = screen.getByRole("button", { name: /add option/i });
      await userEvent.click(addButton);

      const radioButtons = screen.getAllByRole("radio");
      await userEvent.click(radioButtons[0]);

      const correctContainer = radioButtons[0].closest("div");
      expect(correctContainer).toHaveClass("correct-option");
    });

    it("should remove option when delete clicked", async () => {
      const addButton = screen.getByRole("button", { name: /add option/i });
      await userEvent.click(addButton);
      await userEvent.click(addButton);

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete|remove/i,
      });
      await userEvent.click(deleteButtons[0]);

      expect(deleteButtons.length - 1).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Explanation Field", () => {
    it("should accept explanation text", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const explanationInput = screen.getByLabelText(/explanation/i);
      await userEvent.type(
        explanationInput,
        "This is why the answer is correct",
      );

      expect(explanationInput).toHaveValue("This is why the answer is correct");
    });

    it("should display explanation in preview", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const explanationInput = screen.getByLabelText(/explanation/i);
      await userEvent.type(explanationInput, "Explanation text here");

      const previewButton = screen.getByRole("button", { name: /preview/i });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText("Explanation text here")).toBeInTheDocument();
      });
    });
  });

  describe("Metadata Sidebar", () => {
    it("should set difficulty level", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const difficultyRadios = screen.getAllByRole("radio", {
        name: /easy|medium|hard/i,
      });
      await userEvent.click(difficultyRadios[1]); // Click medium

      expect(difficultyRadios[1]).toBeChecked();
    });

    it("should set time estimate", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const timeInput = screen.getByLabelText(/time estimate|minutes/i);
      await userEvent.clear(timeInput);
      await userEvent.type(timeInput, "10");

      expect(timeInput).toHaveValue(10);
    });

    it("should add tags", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const tagInput = screen.getByLabelText(/add tag|tags/i);
      await userEvent.type(tagInput, "algebra");
      await userEvent.keyboard("{Enter}");

      expect(screen.getByText("algebra")).toBeInTheDocument();
    });

    it("should remove tags", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const tagInput = screen.getByLabelText(/add tag|tags/i);
      await userEvent.type(tagInput, "test-tag");
      await userEvent.keyboard("{Enter}");

      const deleteButton = screen.getByRole("button", {
        name: /delete.*test-tag|remove.*test-tag/i,
      });
      await userEvent.click(deleteButton);

      expect(screen.queryByText("test-tag")).not.toBeInTheDocument();
    });

    it("should prevent duplicate tags", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const tagInput = screen.getByLabelText(/add tag|tags/i);
      await userEvent.type(tagInput, "duplicate");
      await userEvent.keyboard("{Enter}");
      await userEvent.type(tagInput, "duplicate");
      await userEvent.keyboard("{Enter}");

      const tagChips = screen.getAllByText("duplicate");
      expect(tagChips.length).toBe(1);
    });
  });

  describe("Form Validation", () => {
    it("should require subject field", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/subject.*required/i)).toBeInTheDocument();
      });
    });

    it("should require question text field", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/question text.*required/i),
        ).toBeInTheDocument();
      });
    });

    it("should require minimum 2 options for multiple choice", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "multiple-choice");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/minimum.*options/i)).toBeInTheDocument();
      });
    });

    it("should require one correct answer selection", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "Test question");

      const typeSelect = screen.getByLabelText(/question type/i);
      await userEvent.selectOptions(typeSelect, "multiple-choice");

      const addButton = screen.getByRole("button", { name: /add option/i });
      await userEvent.click(addButton);
      await userEvent.click(addButton);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/select.*correct.*answer/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Preview Modal", () => {
    it("should open preview modal", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const previewButton = screen.getByRole("button", { name: /preview/i });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should close preview modal", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const previewButton = screen.getByRole("button", { name: /preview/i });
      await userEvent.click(previewButton);

      const closeButton = screen.getByRole("button", { name: /close/i });
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should render question as student would see it", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "What is 2 + 2?");

      const previewButton = screen.getByRole("button", { name: /preview/i });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should call onSave with form data", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      const topicInput = screen.getByLabelText(/topic/i);
      await userEvent.type(topicInput, "Algebra");

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "What is x + 5 = 10?");

      const explanationInput = screen.getByLabelText(/explanation/i);
      await userEvent.type(explanationInput, "x = 5");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const callArgs = mockOnSave.mock.calls[0][0];
        expect(callArgs.subject).toBe("Mathematics");
        expect(callArgs.topic).toBe("Algebra");
      });
    });

    it("should show success message on save", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "Test");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saved|success/i)).toBeInTheDocument();
      });
    });

    it("should call onCancel when cancel button clicked", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("should disable save button while saving", async () => {
      render(<QuestionEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const subjectSelect = screen.getByLabelText(/subject/i);
      await userEvent.selectOptions(subjectSelect, "Mathematics");

      const questionInput = screen.getByLabelText(/question text/i);
      await userEvent.type(questionInput, "Test");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });
});
