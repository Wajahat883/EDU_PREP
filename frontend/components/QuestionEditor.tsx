/**
 * Question Editor Component
 *
 * Comprehensive editor for creating and editing questions:
 * - Multiple question types (multiple choice, true/false, short answer)
 * - Rich text editor for question and explanation text
 * - Option management with correct answer selection
 * - Subject and topic categorization
 * - Difficulty level and tagging
 * - Preview mode
 * - Auto-save functionality
 */

import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Delete,
  Add,
  Save,
  Preview,
  ArrowBack,
  Check,
  X,
  Edit,
  Visibility,
} from "@mui/icons-material";
import axios from "axios";
import { useRouter } from "next/router";

interface QuestionData {
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  text: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "essay";
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation: string;
  tags?: string[];
  estimatedTime?: number;
}

interface QuestionFormProps {
  questionId?: string;
  onSave?: (question: QuestionData) => void;
}

const QuestionEditor: React.FC<QuestionFormProps> = ({
  questionId,
  onSave,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<QuestionData>({
    subject: "",
    topic: "",
    difficulty: "medium",
    text: "",
    type: "multiple-choice",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
    correctAnswer: "",
    explanation: "",
    tags: [],
    estimatedTime: 5,
  });

  const [loading, setLoading] = useState(!!questionId);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [subjects] = useState([
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
  ]);

  useEffect(() => {
    if (questionId) {
      loadQuestion();
    }
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      const response = await axios.get(`/api/admin/questions/${questionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setFormData(response.data.question);
    } catch (error) {
      setErrorMessage("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);

      // Validate form
      if (!formData.subject || !formData.topic || !formData.text) {
        setErrorMessage("Please fill in all required fields");
        return;
      }

      if (formData.type === "multiple-choice" && formData.options) {
        if (formData.options.length < 2) {
          setErrorMessage("Multiple choice questions need at least 2 options");
          return;
        }
        if (!formData.options.some((o) => o.isCorrect)) {
          setErrorMessage("Please select a correct answer");
          return;
        }
      }

      const url = questionId
        ? `/api/admin/questions/${questionId}`
        : "/api/admin/questions";

      const method = questionId ? "put" : "post";

      const response = await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setSuccessMessage(
        questionId
          ? "Question updated successfully"
          : "Question created successfully",
      );

      if (onSave) {
        onSave(response.data.question);
      }

      setTimeout(() => {
        router.push("/admin/questions");
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = () => {
    if (formData.options) {
      setFormData({
        ...formData,
        options: [...formData.options, { text: "", isCorrect: false }],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options && formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    if (formData.options) {
      const newOptions = [...formData.options];
      if (field === "text") {
        newOptions[index].text = value;
      } else if (field === "isCorrect") {
        // For multiple choice, only one can be correct
        if (formData.type === "multiple-choice") {
          newOptions.forEach((o, i) => (o.isCorrect = i === index && value));
        } else {
          newOptions[index].isCorrect = value;
        }
      }
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading question...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Tooltip title="Back to Questions">
          <IconButton onClick={() => router.push("/admin/questions")}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {questionId ? "Edit Question" : "Create New Question"}
        </Typography>
      </Box>

      {/* Messages */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Editor */}
        <Grid item xs={12} lg={8}>
          {/* Subject & Topic */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Subject & Topic
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={formData.subject}
                      label="Subject"
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                    >
                      {subjects.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Topic"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    fullWidth
                    placeholder="e.g., Quadratic Equations"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Question Text */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Question
              </Typography>

              <TextField
                label="Question Text"
                value={formData.text}
                onChange={(e) =>
                  setFormData({ ...formData, text: e.target.value })
                }
                fullWidth
                multiline
                rows={4}
                placeholder="Enter the question text here..."
              />
            </CardContent>
          </Card>

          {/* Question Type & Options */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Question Type
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => {
                    const newType = e.target.value as QuestionData["type"];
                    setFormData({
                      ...formData,
                      type: newType,
                      options:
                        newType === "true-false"
                          ? [
                              { text: "True", isCorrect: true },
                              { text: "False", isCorrect: false },
                            ]
                          : formData.options,
                    });
                  }}
                >
                  <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                  <MenuItem value="true-false">True/False</MenuItem>
                  <MenuItem value="short-answer">Short Answer</MenuItem>
                  <MenuItem value="essay">Essay</MenuItem>
                </Select>
              </FormControl>

              {/* Options */}
              {(formData.type === "multiple-choice" ||
                formData.type === "true-false") && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Answer Options
                  </Typography>

                  {formData.options?.map((option, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        gap: 2,
                        mb: 2,
                        p: 2,
                        backgroundColor: option.isCorrect
                          ? "#f1f8e9"
                          : "#fafafa",
                        borderRadius: 1,
                        border: option.isCorrect
                          ? "2px solid #4CAF50"
                          : "1px solid #ddd",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Radio
                            checked={option.isCorrect}
                            onChange={() =>
                              handleOptionChange(index, "isCorrect", true)
                            }
                          />
                        }
                        label="Correct"
                        sx={{ minWidth: 100 }}
                      />
                      <TextField
                        value={option.text}
                        onChange={(e) =>
                          handleOptionChange(index, "text", e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        fullWidth
                        disabled={formData.type === "true-false"}
                      />
                      <Tooltip title="Remove Option">
                        <span>
                          <IconButton
                            onClick={() => handleRemoveOption(index)}
                            disabled={formData.options!.length <= 2}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ))}

                  {formData.type === "multiple-choice" && (
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleAddOption}
                      sx={{ mt: 1 }}
                    >
                      Add Option
                    </Button>
                  )}
                </Box>
              )}

              {/* Short Answer */}
              {formData.type === "short-answer" && (
                <TextField
                  label="Correct Answer"
                  value={formData.correctAnswer || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, correctAnswer: e.target.value })
                  }
                  fullWidth
                  placeholder="Enter the correct answer..."
                />
              )}
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Explanation
              </Typography>

              <TextField
                label="Explanation"
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                fullWidth
                multiline
                rows={4}
                placeholder="Explain why the correct answer is correct..."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Metadata */}
          <Card sx={{ mb: 3, position: "sticky", top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Question Settings
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Difficulty
              </Typography>
              <RadioGroup
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: e.target.value as QuestionData["difficulty"],
                  })
                }
              >
                <FormControlLabel
                  value="easy"
                  control={<Radio />}
                  label="Easy"
                />
                <FormControlLabel
                  value="medium"
                  control={<Radio />}
                  label="Medium"
                />
                <FormControlLabel
                  value="hard"
                  control={<Radio />}
                  label="Hard"
                />
              </RadioGroup>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Estimated Time (minutes)
              </Typography>
              <TextField
                type="number"
                value={formData.estimatedTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedTime: parseInt(e.target.value),
                  })
                }
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 60 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Tags
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  size="small"
                  sx={{ flex: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={!newTag}
                >
                  Add
                </Button>
              </Box>

              {formData.tags && formData.tags.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Question"}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Preview />}
                  onClick={() => setPreviewOpen(true)}
                >
                  Preview
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => router.push("/admin/questions")}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Question Preview</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Paper sx={{ p: 3, backgroundColor: "#f9f9f9" }}>
            <Typography variant="subtitle2" color="textSecondary">
              {formData.subject} → {formData.topic}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
              {formData.text}
            </Typography>

            {formData.options && (
              <Box>
                {formData.options.map((option, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: "1px solid #ddd",
                      borderRadius: 1,
                      backgroundColor: option.isCorrect ? "#f1f8e9" : "white",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Radio checked={option.isCorrect} disabled />
                      <Typography>{option.text}</Typography>
                      {option.isCorrect && (
                        <Chip label="Correct" size="small" color="success" />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Explanation:
            </Typography>
            <Typography variant="body2">{formData.explanation}</Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuestionEditor;
