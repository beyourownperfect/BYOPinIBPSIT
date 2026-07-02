import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsApi } from "../../lib/api";
import { Button } from "../ui";
import { SECTIONS, PK_TOPICS } from "../../lib/constants";
import { X, AlertTriangle, Sparkles, FileText, Clipboard, ChevronDown, ChevronRight } from "lucide-react";

const INITIAL_FORM = {
  section: "",
  subject: "",
  topic: "",
  statement: "",
  options: { A: "", B: "", C: "", D: "" },
  correct_answer: "",
  marks: null,
  explanation: "",
  notes: "",
  difficulty: "medium",
  phase: "both",
  exam_source: "IBPS",
  year: null,
};

export default function QuestionFormModal({ open, onClose, editQuestion }) {
  const isEdit = !!editQuestion;
  const [form, setForm] = useState(INITIAL_FORM);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editQuestion) {
      setForm({
        section: editQuestion.section || "",
        subject: editQuestion.subject || "",
        topic: editQuestion.topic || "",
        statement: editQuestion.statement || "",
        options: editQuestion.options || { A: "", B: "", C: "", D: "" },
        correct_answer: editQuestion.correct_answer || "",
        marks: editQuestion.marks ?? null,
        explanation: editQuestion.explanation || "",
        notes: editQuestion.notes || "",
        difficulty: editQuestion.difficulty || "medium",
        phase: editQuestion.phase || "both",
        exam_source: editQuestion.exam_source || "IBPS",
        year: editQuestion.year || null,
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setDuplicateWarning(null);
    setSubmitError(null);
  }, [editQuestion, open]);

  const onMutationError = useCallback((err) => {
    const msg = err?.response?.data?.error || err?.message || "Request failed";
    setSubmitError(msg);
  }, []);

  const clearError = useCallback(() => setSubmitError(null), []);

  const createMutation = useMutation({
    mutationFn: (data) => questionsApi.create(data),
    onSuccess: (res) => {
      if (res?.duplicate_warning) {
        setDuplicateWarning(res);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      onClose();
    },
    onError: onMutationError,
  });

  const createForceMutation = useMutation({
    mutationFn: (data) => questionsApi.create(data, { params: { force: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      onClose();
    },
    onError: onMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => questionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      onClose();
    },
    onError: onMutationError,
  });

  const sectionInfo = SECTIONS[form.section];
  const hasTopics = sectionInfo?.has_topics;
  const topics = hasTopics ? PK_TOPICS[form.section] || [] : [];
  // Subject always mirrors section — no separate selection needed
  const primaryLabel = sectionInfo?.type === "pk" ? "Subject" : "Section";

  const autoMarks = form.section ? (sectionInfo?.type === "pk" ? 2 : 1) : null;

  const handleChange = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value, subject: field === "section" ? value : f.subject };
      if (field === "section") {
        next.topic = "";
        next.marks = null;
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setDuplicateWarning(null);
    setSubmitError(null);

    const payload = {
      ...form,
      marks: form.marks ?? autoMarks,
      year: form.year || null,
    };

    if (isEdit) {
      updateMutation.mutate({ id: editQuestion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleForceCreate = () => {
    const payload = {
      ...form,
      marks: form.marks ?? autoMarks,
      year: form.year || null,
    };
    createForceMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || createForceMutation.isPending;

  // ── Smart Entry ────────────────────────────────────────────────────────
  const [smartText, setSmartText] = useState("");
  const [smartOpen, setSmartOpen] = useState(!isEdit);

  const parseInput = useCallback(() => {
    const text = smartText.trim();
    if (!text) return;

    // Try JSON first
    try {
      const parsed = JSON.parse(text);
      const result = {};
      if (parsed.statement) result.statement = parsed.statement;
      if (parsed.options) result.options = parsed.options;
      if (parsed.correctOption) result.correct_answer = parsed.correctOption;
      if (parsed.explanation) result.explanation = parsed.explanation;
      if (result.statement || result.options) {
        setForm((f) => ({
          ...f,
          ...(result.statement ? { statement: result.statement, subject: f.subject } : {}),
          ...(result.options ? { options: { ...f.options, ...result.options } } : {}),
          ...(result.correct_answer ? { correct_answer: result.correct_answer } : {}),
          ...(result.explanation ? { explanation: result.explanation } : {}),
        }));
        return;
      }
    } catch {
      // Not JSON — fall through to text parsing
    }

    // Text parsing: extract options, statement, answer, explanation
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const opts = {};
    let correctAnswer = "";
    let explanation = "";
    let statementLines = [];
    let foundOptions = false;

    const optionRegex = /^([A-Da-d])[.)\]\s]\s*(.+)/;
    const numberOptionRegex = /^([1-4])[.)\]\s]\s*(.+)/;
    const answerRegex = /^(?:answer|correct|ans|correct\s*answer|right)\s*[:.\-]\s*([A-Da-d1-4])/i;
    const explanationRegex = /^(?:explanation|reason|why|note)\s*[:.\-]\s*/i;

    for (const line of lines) {
      // Check for answer indicator
      const ansMatch = line.match(answerRegex);
      if (ansMatch) {
        const raw = ansMatch[1].toUpperCase();
        correctAnswer = raw >= "1" && raw <= "4" ? String.fromCharCode(64 + parseInt(raw)) : raw;
        continue;
      }

      // Check for explanation
      if (explanationRegex.test(line)) {
        explanation = line.replace(explanationRegex, "").trim();
        continue;
      }

      // Check for option (A-D)
      const optMatch = line.match(optionRegex);
      if (optMatch) {
        opts[optMatch[1].toUpperCase()] = optMatch[2].trim();
        foundOptions = true;
        continue;
      }

      // Check for numbered option (1-4)
      const numMatch = line.match(numberOptionRegex);
      if (numMatch) {
        const letter = String.fromCharCode(64 + parseInt(numMatch[1]));
        opts[letter] = numMatch[2].trim();
        foundOptions = true;
        continue;
      }

      // If we haven't found options yet, this is part of the statement
      if (!foundOptions) {
        // Remove common prefixes
        const cleaned = line.replace(/^(?:question|q|stmt)[.:\s]*/i, "").replace(/^["""]|["""]$/g, "").trim();
        if (cleaned) statementLines.push(cleaned);
      }
    }

    const result = {};
    if (statementLines.length > 0) result.statement = statementLines.join(" ");
    if (Object.keys(opts).length >= 2) result.options = opts;
    if (correctAnswer) result.correct_answer = correctAnswer;
    if (explanation) result.explanation = explanation;

    if (result.statement || result.options) {
      setForm((f) => ({
        ...f,
        ...(result.statement ? { statement: result.statement } : {}),
        ...(result.options ? { options: { ...f.options, ...result.options } } : {}),
        ...(result.correct_answer ? { correct_answer: result.correct_answer } : {}),
        ...(result.explanation ? { explanation: result.explanation } : {}),
      }));
    }
  }, [smartText]);

  const copyPrompt = useCallback((prompt) => {
    navigator.clipboard.writeText(prompt).catch(() => {});
  }, []);

  const AI_PROMPT = `You are helping build a question bank for IBPS SO (IT Officer) exam preparation.

Extract the question from the text below and return it as JSON using EXACTLY this schema:

{
  "statement": "The question text",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  "correctOption": "A",
  "explanation": "Explanation if present, otherwise empty string"
}

Rules:
- Put the full question text in "statement"
- Fill all 4 options A through D
- Set correctOption to the single correct letter (A, B, C, or D)
- Include explanation only if the source has one
- Return ONLY valid JSON, no markdown fences, no commentary

Input:
`;

  const OCR_PROMPT = `You are extracting text from a screenshot of an IBPS SO (IT Officer) exam question.

Extract and return as JSON using EXACTLY this schema:

{
  "statement": "The question text exactly as written",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  },
  "correctOption": "A",
  "explanation": "Explanation if visible, otherwise empty string"
}

Rules:
- Transcribe the question text verbatim
- Extract all 4 options exactly as written
- Identify the correct answer if marked/indicated
- Include explanation only if clearly visible
- Ignore page numbers, headers, footers, branding, watermarks
- Return ONLY valid JSON, no markdown fences, no commentary
`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border-2 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-bold">{isEdit ? "Edit Question" : "Add Question"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="mx-4 mt-4 p-3 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-medium">Failed to save question</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs font-mono">{submitError}</p>
            </div>
            <button onClick={clearError} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="mx-4 mt-4 p-3 border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Similar question exists:</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{duplicateWarning.existing.statement}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="danger" onClick={handleForceCreate} disabled={isPending}>
                  Create Anyway
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setDuplicateWarning(null)}>
                  Edit Current
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* ── Smart Entry ─────────────────────────────────────────────── */}
          {!isEdit && (
            <div className="border-2 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setSmartOpen(!smartOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {smartOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Sparkles className="w-3.5 h-3.5 text-accent-500" />
                Smart Entry — paste question text, Markdown, or JSON
              </button>
              {smartOpen && (
                <div className="p-3 space-y-2">
                  <textarea
                    value={smartText}
                    onChange={(e) => setSmartText(e.target.value)}
                    className="w-full border-2 rounded-md px-3 py-2 text-sm min-h-[100px] bg-white dark:bg-gray-900 font-mono text-xs"
                    placeholder={`Paste question text here...\n\nExamples:\n  JSON: {"statement":"...", "options":{"A":"...","B":"...","C":"...","D":"..."}, "correctOption":"A"}\n  Text: What is 2+2?\n        A) 3\n        B) 4\n        C) 5\n        D) 6\n        Answer: B`}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button type="button" size="sm" onClick={parseInput}>
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Parse
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => copyPrompt(AI_PROMPT + smartText)}>
                      <Clipboard className="w-3.5 h-3.5 mr-1" /> Copy AI Prompt
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => copyPrompt(OCR_PROMPT)}>
                      <FileText className="w-3.5 h-3.5 mr-1" /> Copy OCR Prompt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Section / Subject + Topic row — unified taxonomy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">{primaryLabel} *</label>
              <select
                value={form.section}
                onChange={(e) => handleChange("section", e.target.value)}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                required
              >
                <option value="">— Select —</option>
                {Object.entries(SECTIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            {hasTopics && (
              <div>
                <label className="text-xs font-medium block mb-1">Topic</label>
                <select
                  value={form.topic}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                >
                  <option value="">— Select —</option>
                  {topics.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Statement */}
          <div>
            <label className="text-xs font-medium block mb-1">Statement *</label>
            <textarea
              value={form.statement}
              onChange={(e) => handleChange("statement", e.target.value)}
              className="w-full border-2 rounded-md px-3 py-2 text-sm min-h-[80px] bg-white dark:bg-gray-900"
              placeholder="Enter question statement (Markdown supported)..."
              required
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {["A", "B", "C", "D"].map((opt) => (
              <div key={opt}>
                <label className="text-xs font-medium block mb-1">
                  Option {opt} *
                  <input
                    type="radio"
                    name="correct"
                    value={opt}
                    checked={form.correct_answer === opt}
                    onChange={(e) => handleChange("correct_answer", e.target.value)}
                    className="ml-2"
                  />
                  <span className="text-amber-600 text-[10px] ml-1">(correct)</span>
                </label>
                <input
                  type="text"
                  value={form.options[opt]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, options: { ...f.options, [opt]: e.target.value } }))
                  }
                  className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                  placeholder={`Option ${opt}`}
                  required
                />
              </div>
            ))}
          </div>

          {/* Marks + Difficulty + Phase */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">
                Marks {autoMarks && <span className="text-gray-400">(auto: {autoMarks})</span>}
              </label>
              <input
                type="number"
                value={form.marks ?? ""}
                onChange={(e) => handleChange("marks", e.target.value ? Number(e.target.value) : null)}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                placeholder={String(autoMarks || "")}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => handleChange("difficulty", e.target.value)}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Phase</label>
              <select
                value={form.phase}
                onChange={(e) => handleChange("phase", e.target.value)}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
              >
                <option value="both">Both</option>
                <option value="prelims">Prelims</option>
                <option value="mains">Mains</option>
              </select>
            </div>
          </div>

          {/* Exam source + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Exam Source</label>
              <select
                value={form.exam_source}
                onChange={(e) => handleChange("exam_source", e.target.value)}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
              >
                <option value="IBPS">IBPS (General)</option>
                <option value="IBPS Prelims">IBPS Prelims</option>
                <option value="IBPS Mains">IBPS Mains</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Year (optional)</label>
              <input
                type="number"
                value={form.year ?? ""}
                onChange={(e) => handleChange("year", e.target.value ? Number(e.target.value) : null)}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                placeholder="e.g. 2024"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-xs font-medium block mb-1">Explanation (optional)</label>
            <textarea
              value={form.explanation}
              onChange={(e) => handleChange("explanation", e.target.value)}
              className="w-full border-2 rounded-md px-3 py-2 text-sm min-h-[60px] bg-white dark:bg-gray-900"
              placeholder="Explanation..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium block mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="w-full border-2 rounded-md px-3 py-2 text-sm min-h-[60px] bg-white dark:bg-gray-900"
              placeholder="Personal notes..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update Question" : "Add Question"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
