import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { practiceApi } from "../lib/api";
import { Card, CardTitle, Button, Badge } from "../components/ui";
import Timer from "../components/Timer";
import { PRACTICE_MODES, DIFFICULTIES, QUESTION_COUNTS, SECTIONS } from "../lib/constants";
import { formatTime } from "../lib/utils";
import {
  Timer as TimerIcon, ArrowRight, ArrowLeft, CheckCircle, XCircle,
  Bookmark, Zap, BarChart3, Clock, Target
} from "lucide-react";

/* ── Section Selector Screen ──────────────────────────────────────────── */

function SectionSelector({ onStart }) {
  const [section, setSection] = useState("");
  const [mode, setMode] = useState("all");
  const [count, setCount] = useState(25);
  const [difficulty, setDifficulty] = useState("any");
  const [isTimed, setIsTimed] = useState(false);

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <CardTitle>Practice</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          Back to Home
        </Button>
      </div>

      <div className="space-y-6">
        {/* Sections */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Section</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(SECTIONS).map(([key, val]) => {
              const isSelected = section === key;
              return (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={`p-3 border-2 rounded-md text-sm font-medium text-left transition-all ${
                    isSelected
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="text-xs text-gray-400 mb-0.5">
                    {val.type === "pk" ? "PK" : "Non-PK"}
                  </div>
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode + Options row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-2 block text-gray-500 uppercase tracking-wider">Mode</label>
            <div className="flex gap-1.5 flex-wrap">
              {PRACTICE_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`px-2.5 py-1.5 border-2 rounded-md text-xs font-medium transition-colors ${
                    mode === m.key
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                  }`}
                  title={m.description}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block text-gray-500 uppercase tracking-wider">Questions</label>
              <div className="flex gap-1">
                {QUESTION_COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={`px-3 py-1.5 border-2 rounded text-xs font-mono font-medium ${
                      count === c
                        ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  onClick={() => setCount(999)}
                  className={`px-3 py-1.5 border-2 rounded text-xs font-mono font-medium ${
                    count === 999 ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block text-gray-500 uppercase tracking-wider">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="border-2 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-900"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timed toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTimed}
            onChange={(e) => setIsTimed(e.target.checked)}
            className="rounded w-4 h-4"
          />
          <span className="text-sm font-medium">
            Timed mode
          </span>
          {isTimed && section && (
            <span className="text-xs text-gray-500 font-mono">
              ({SECTIONS[section]?.type === "pk" ? 20 : 20} min limit)
            </span>
          )}
        </label>

        <Button
          className="w-full"
          size="lg"
          disabled={!section}
          onClick={() =>
            onStart({
              section,
              mode,
              count,
              difficulty,
              isTimed,
              timeLimit: section
                ? SECTIONS[section]?.type === "pk"
                  ? 20 * 60
                  : 20 * 60
                : 1200,
            })
          }
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Practice
        </Button>
      </div>
    </Card>
  );
}

/* ── Question Screen ──────────────────────────────────────────────────── */

function QuestionSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-3 animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      <div className="bg-white dark:bg-gray-900 border-2 rounded-lg p-6 space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        <div className="space-y-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionScreen({
  question,
  selectedOption,
  onSelectOption,
  confidence,
  onConfidence,
  onSubmit,
  onSkip,
  onPrevious,
  onBookmark,
  hasPrevious,
  isSubmitting,
  timer,
  sectionLabel,
  questionIndex,
  totalQuestions,
}) {
  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      const key = e.key.toLowerCase();
      if (["a", "b", "c", "d"].includes(key)) {
        onSelectOption(key.toUpperCase());
      } else if (["1", "2", "3", "4", "5"].includes(key)) {
        onConfidence(Number(key));
      } else if (key === "enter") {
        if (selectedOption) onSubmit();
      } else if (key === "arrowright") {
        onSkip();
      } else if (key === "arrowleft") {
        if (hasPrevious) onPrevious();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedOption, onSubmit, onSkip, onPrevious, hasPrevious, onSelectOption, onConfidence]);

  if (!question) {
    return <QuestionSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between text-sm bg-white dark:bg-gray-900 border-2 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant={SECTIONS[question.section]?.type === "pk" ? "pk" : "non_pk"}>
            {sectionLabel || question.section}
          </Badge>
          <span className="text-gray-500 font-mono text-xs">
            Q {questionIndex}/{totalQuestions || "?"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            +{question.marks || 1}/-0.25
          </span>
          {timer}
        </div>
      </div>

      {/* Question card */}
      <Card>
        <p className="text-base leading-relaxed mb-5">{question.statement}</p>

        {/* Options */}
        <div className="space-y-2">
          {["A", "B", "C", "D"].map((opt) => (
            <button
              key={opt}
              onClick={() => onSelectOption(opt)}
              className={`w-full text-left p-3 border-2 rounded-md text-sm transition-all ${
                selectedOption === opt
                  ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-1 ring-accent-500/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              <span className="font-mono font-semibold mr-3 text-accent-600 dark:text-accent-400">
                {opt}
              </span>
              {question.options?.[opt]}
            </button>
          ))}
        </div>

        {/* Confidence scale */}
        <div className="mt-4 pt-4 border-t-2">
          <label className="text-xs font-medium text-gray-500 block mb-2">
            Confidence
            <span className="font-normal ml-2">
              {confidence ? `${confidence}/5 — ${["", "Guess", "Unsure", "Mixed", "Confident", "Certain"][confidence]}` : "(1-5)"}
            </span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onConfidence(n)}
                className={`w-9 h-9 border-2 rounded-md text-xs font-mono font-bold transition-colors ${
                  confidence === n
                    ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400"
                    : "border-gray-300 dark:border-gray-600 text-gray-500 hover:border-gray-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t-2">
          <button
            onClick={onBookmark}
            className="text-xs text-gray-500 hover:text-accent-500 transition-colors flex items-center gap-1"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmark
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={!hasPrevious}
              title="Previous (←)"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onSkip}
              title="Skip (→)"
            >
              Skip
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!selectedOption || isSubmitting}
            >
              {isSubmitting ? "..." : "Submit"}
            </Button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="mt-3 text-[10px] text-gray-400 text-center border-t-2 pt-2">
          A–D: Select · 1–5: Confidence · Enter: Submit · →: Skip · ←: Previous
        </div>
      </Card>
    </div>
  );
}

/* ── Feedback Screen ──────────────────────────────────────────────────── */

function FeedbackScreen({ feedback, question, onNext, onBookmark, isLastQuestion }) {
  if (!feedback) return null;

  const marksColor = feedback.correct ? "text-green-500" : "text-red-500";
  const penaltyDisplay = feedback.correct
    ? `+${feedback.marks_earned} (net +${feedback.net_score.toFixed(2)})`
    : `−${feedback.penalty.toFixed(2)} penalty · net −${feedback.penalty.toFixed(2)}`;

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <Card className={`border-2 ${feedback.correct ? "border-green-500" : "border-red-500"}`}>
        {/* Result header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${feedback.correct ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {feedback.correct
              ? <CheckCircle className="w-6 h-6 text-green-500" />
              : <XCircle className="w-6 h-6 text-red-500" />
            }
          </div>
          <div>
            <div className={`text-lg font-bold ${marksColor}`}>
              {feedback.correct ? "Correct!" : "Incorrect"}
            </div>
            <div className="text-sm text-gray-500">
              {penaltyDisplay}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Accuracy</div>
            <div className="text-lg font-bold font-mono">{feedback.accuracy_pct}%</div>
          </div>
        </div>

        {/* Marks impact row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="border-2 rounded-md p-2 text-center">
            <div className="text-xs text-gray-500">Marks Earned</div>
            <div className={`text-lg font-bold font-mono ${feedback.correct ? "text-green-500" : "text-gray-400"}`}>
              {feedback.correct ? `+${feedback.marks_earned}` : "0"}
            </div>
          </div>
          <div className="border-2 rounded-md p-2 text-center">
            <div className="text-xs text-gray-500">Penalty</div>
            <div className="text-lg font-bold font-mono text-red-500">
              −{feedback.penalty.toFixed(2)}
            </div>
          </div>
          <div className="border-2 rounded-md p-2 text-center">
            <div className="text-xs text-gray-500">Net</div>
            <div className="text-lg font-bold font-mono" style={{ color: feedback.net_score >= 0 ? "#22c55e" : "#ef4444" }}>
              {feedback.net_score >= 0 ? "+" : ""}{feedback.net_score.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Correct answer (if wrong) */}
        {!feedback.correct && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-md">
            <span className="text-xs text-gray-500">Your answer: </span>
            <span className="text-sm font-mono font-medium text-red-500">
              {question?.selected_option || "—"}
            </span>
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-xs text-gray-500">Correct answer: </span>
            <span className="text-sm font-mono font-bold text-green-500">
              {feedback.correct_answer}
            </span>
          </div>
        )}

        {/* Explanation */}
        {feedback.explanation && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-3">
            <span className="text-xs font-medium text-gray-500 block mb-1">Explanation</span>
            {feedback.explanation}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            {feedback.total_attempts} attempts
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            {feedback.correct_attempts} correct
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            {feedback.wrong_attempts} wrong
          </span>
          {feedback.avg_time_sec && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              avg {feedback.avg_time_sec}s
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={onNext}>
            {isLastQuestion ? "See Results" : "Next"}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onBookmark}>
            <Bookmark className="w-3.5 h-3.5 mr-1" />
            Bookmark
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Session Summary Screen ───────────────────────────────────────────── */

function SessionSummary({ stats, section, onPracticeMore, onDashboard }) {
  const correct = stats.correct;
  const wrong = stats.wrong;
  const total = stats.total;
  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const rawScore = stats.rawScore || correct;
  const penalty = wrong * 0.25;
  const netScore = rawScore - penalty;
  const avgTime = attempted > 0 ? Math.round(stats.totalTime / attempted) : 0;
  const totalTimeFormatted = formatTime(stats.totalTime);

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-accent-100 dark:bg-accent-900/30 mb-3">
          <Zap className="w-8 h-8 text-accent-500" />
        </div>
        <h2 className="text-xl font-bold">Session Complete</h2>
        <p className="text-sm text-gray-500 mt-1">
          {SECTIONS[section]?.label || section} · {stats.mode} mode
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border-2 rounded-md p-3 text-center">
          <div className="text-2xl font-bold font-mono">{attempted}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Attempted</div>
        </div>
        <div className="border-2 rounded-md p-3 text-center border-green-500/50">
          <div className="text-2xl font-bold font-mono text-green-500">{correct}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Correct</div>
        </div>
        <div className="border-2 rounded-md p-3 text-center border-red-500/50">
          <div className="text-2xl font-bold font-mono text-red-500">{wrong}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Wrong</div>
        </div>
        <div className="border-2 rounded-md p-3 text-center">
          <div className="text-2xl font-bold font-mono">{accuracy}%</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Accuracy</div>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="border-2 rounded-md p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Raw Score</span>
          <span className="font-mono font-bold">{rawScore}/{total || attempted}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Negative Penalty</span>
          <span className="font-mono font-bold text-red-500">−{penalty.toFixed(2)}</span>
        </div>
        <div className="border-t-2 pt-2 flex justify-between text-sm font-bold">
          <span>Net Score</span>
          <span className={`font-mono ${netScore >= 0 ? "text-green-500" : "text-red-500"}`}>
            {netScore.toFixed(2)}/{total || attempted}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Total time: {totalTimeFormatted}</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Avg: {avgTime}s/q</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button onClick={onPracticeMore}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Practice More
        </Button>
        <Button variant="secondary" onClick={onDashboard}>
          Dashboard
        </Button>
      </div>
    </Card>
  );
}

/* ── Main Practice Page ───────────────────────────────────────────────── */

export default function Practice() {
  const [screen, setScreen] = useState("select"); // select | question | feedback | summary
  const [config, setConfig] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [excludedIds, setExcludedIds] = useState([]);
  const [questionsAnswered, setQuestionsAnswered] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    correct: 0, wrong: 0, total: 0, rawScore: 0,
    totalTime: 0, mode: "all",
  });
  const [timerKey, setTimerKey] = useState(0);
  const lastSubmitRef = useRef(null);

  // Fetch next question
  const { data: nextQ, isFetching, refetch } = useQuery({
    queryKey: ["practice-next", config?.section, config?.mode, excludedIds.join(",")],
    queryFn: () =>
      practiceApi.next({
        section: config.section,
        mode: config.mode,
        exclude_ids: excludedIds.join(","),
      }),
    enabled: screen === "question" && !question,
    retry: false,
    meta: { errorMessage: null },
  });

  // Auto-advance when next question arrives
  useEffect(() => {
    if (nextQ && !question && screen === "question") {
      setQuestion(nextQ);
      setSelectedOption(null);
      setConfidence(0);
      setFeedback(null);
    }
  }, [nextQ, question, screen]);

  // Handle API error (no more questions)
  useEffect(() => {
    if (!isFetching && screen === "question" && !question && !nextQ && excludedIds.length > 0) {
      // No more questions from the API — go to summary
      setScreen("summary");
    }
  }, [isFetching, screen, question, nextQ, excludedIds]);

  const submitMutation = useMutation({
    mutationFn: practiceApi.submit,
    onSuccess: (result) => {
      setFeedback(result);
      setExcludedIds((prev) => [...prev, question.id]);
      setQuestionsAnswered((prev) => [...prev, question.id]);
      setSessionStats((prev) => {
        const wasCorrect = result.correct ? 1 : 0;
        const wasWrong = result.correct ? 0 : 1;
        return {
          ...prev,
          correct: prev.correct + wasCorrect,
          wrong: prev.wrong + wasWrong,
          total: prev.total + (result.marks_earned || 0),
          rawScore: prev.rawScore + (result.marks_earned || 0),
          totalTime: prev.totalTime + (question.time_taken_sec || 0),
        };
      });
      setScreen("feedback");
    },
    onError: () => {
      // If submission fails, try next question
      handleSkip();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      fetch("/api/ibps/practice/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });

  const handleStart = useCallback((cfg) => {
    setConfig(cfg);
    setScreen("question");
    setQuestion(null);
    setSelectedOption(null);
    setConfidence(0);
    setFeedback(null);
    setExcludedIds([]);
    setQuestionsAnswered([]);
    setSessionStats({ correct: 0, wrong: 0, total: 0, rawScore: 0, totalTime: 0, mode: cfg.mode });
    setTimerKey((k) => k + 1);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!question || !selectedOption || submitMutation.isPending) return;

    const timeElapsed = lastSubmitRef.current
      ? Math.floor((Date.now() - lastSubmitRef.current) / 1000)
      : 30;
    lastSubmitRef.current = Date.now();

    submitMutation.mutate({
      question_id: question.id,
      selected_option: selectedOption,
      confidence: confidence || 3,
      time_taken_sec: Math.max(1, timeElapsed),
      practice_mode: config.mode,
    });
  }, [question, selectedOption, confidence, config?.mode, submitMutation]);

  const handleNext = useCallback(() => {
    lastSubmitRef.current = Date.now();
    setQuestion(null);
    setSelectedOption(null);
    setConfidence(0);
    setFeedback(null);
  }, []);

  const handleSkip = useCallback(() => {
    if (question) {
      setExcludedIds((prev) => [...prev, question.id]);
    }
    lastSubmitRef.current = Date.now();
    setQuestion(null);
    setSelectedOption(null);
    setConfidence(0);
    setFeedback(null);
  }, [question]);

  const handlePrevious = useCallback(() => {
    // Can't go back to previous question in this simple model — just skip
  }, []);

  const handleBookmark = useCallback(() => {
    if (!question) return;
    fetch(`/api/ibps/questions/${question.id}/bookmark`, { method: "POST" }).catch(() => {});
  }, [question]);

  const handleTimerExpire = useCallback(() => {
    if (selectedOption) {
      handleSubmit();
    } else {
      // Auto-submit whatever's answered, go to summary
      if (questionsAnswered.length > 0) {
        setScreen("summary");
      } else {
        setScreen("summary");
      }
    }
  }, [selectedOption, handleSubmit, questionsAnswered]);

  const handleSummary = useCallback(() => {
    // Record study log
    if (config && sessionStats.total > 0) {
      updateMutation.mutate({
        section: config.section,
        subject: config.section,
        total_questions: sessionStats.correct + sessionStats.wrong,
        total_time_sec: sessionStats.totalTime,
        correct_count: sessionStats.correct,
        wrong_count: sessionStats.wrong,
      });
    }
    setScreen("summary");
  }, [config, sessionStats, updateMutation]);

  // Check if we're at the last available question
  const isLastQuestion = nextQ === undefined && !isFetching && question !== null;

  // Selector screen
  if (screen === "select") {
    return <SectionSelector onStart={handleStart} />;
  }

  // Summary screen
  if (screen === "summary") {
    return (
      <SessionSummary
        stats={sessionStats}
        section={config?.section}
        onPracticeMore={() => {
          setScreen("select");
          setConfig(null);
        }}
        onDashboard={() => { window.location.href = "/dashboard"; }}
      />
    );
  }

  // Feedback screen
  if (screen === "feedback" && feedback) {
    return (
      <FeedbackScreen
        feedback={feedback}
        question={question}
        onNext={isLastQuestion ? handleSummary : handleNext}
        onBookmark={handleBookmark}
        isLastQuestion={isLastQuestion}
      />
    );
  }

  // Question screen
  return (
    <QuestionScreen
      question={question}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      confidence={confidence}
      onConfidence={setConfidence}
      onSubmit={handleSubmit}
      onSkip={handleSkip}
      onPrevious={handlePrevious}
      onBookmark={handleBookmark}
      hasPrevious={false}
      isSubmitting={submitMutation.isPending}
      timer={
        config?.isTimed ? (
          <Timer
            key={timerKey}
            mode="countdown"
            totalSeconds={config.timeLimit || 1200}
            sectionKey={config.section}
            onExpire={handleTimerExpire}
            running={screen === "question"}
          />
        ) : (
          <Timer
            key={timerKey}
            mode="elapsed"
            sectionKey={config?.section}
            running={screen === "question"}
          />
        )
      }
      sectionLabel={config?.section ? SECTIONS[config.section]?.label : ""}
      questionIndex={questionsAnswered.length + 1}
      totalQuestions={config?.count || "?"}
    />
  );
}
