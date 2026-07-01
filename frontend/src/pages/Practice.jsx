import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { practiceApi } from "../lib/api";
import { Card, CardTitle, Button, Badge } from "../components/ui";
import Timer from "../components/Timer";
import { PRACTICE_MODES, DIFFICULTIES, QUESTION_COUNTS, SECTIONS } from "../lib/constants";
import { formatTime } from "../lib/utils";
import {
  ArrowRight, ArrowLeft, CheckCircle, XCircle,
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

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTimed}
            onChange={(e) => setIsTimed(e.target.checked)}
            className="rounded w-4 h-4"
          />
          <span className="text-sm font-medium">Timed mode</span>
          {isTimed && section && (
            <span className="text-xs text-gray-500 font-mono">(20 min limit)</span>
          )}
        </label>

        <Button
          className="w-full"
          size="lg"
          disabled={!section}
          onClick={() =>
            onStart({ section, mode, count, difficulty, isTimed, timeLimit: 1200 })
          }
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Practice
        </Button>
      </div>
    </Card>
  );
}

/* ── Practice Session Screen ──────────────────────────────────────────── */

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

function PracticeSession({
  questions,
  answers,
  currentIndex,
  onSelectOption,
  onGoTo,
  onFinish,
  config,
  timer,
}) {
  const total = questions.length;
  const q = questions[currentIndex];
  const selected = answers[q?.id];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      const key = e.key.toLowerCase();
      if (["a", "b", "c", "d"].includes(key)) onSelectOption(q?.id, key.toUpperCase());
      else if (key === "arrowleft") onGoTo(Math.max(0, currentIndex - 1));
      else if (key === "arrowright") onGoTo(Math.min(total - 1, currentIndex + 1));
      else if (key === "enter" && currentIndex < total - 1) onGoTo(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [q?.id, currentIndex, total, onSelectOption, onGoTo]);

  if (!q) return <QuestionSkeleton />;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-sm bg-white dark:bg-gray-900 border-2 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant={SECTIONS[q.section]?.type === "pk" ? "pk" : "non_pk"}>
            {SECTIONS[q.section]?.label || q.section}
          </Badge>
          <span className="text-gray-500 font-mono text-xs">
            {currentIndex + 1}/{total}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{answeredCount} answered</span>
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            +{q.marks || 1}/-0.25
          </span>
          {timer}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${(answeredCount / total) * 100}%` }} />
      </div>

      {/* Question card */}
      <Card>
        <p className="text-base leading-relaxed mb-5">{q.statement}</p>

        <div className="space-y-2">
          {["A", "B", "C", "D"].map((opt) => (
            <button
              key={opt}
              onClick={() => onSelectOption(q.id, opt)}
              className={`w-full text-left p-3 border-2 rounded-md text-sm transition-all ${
                selected === opt
                  ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-1 ring-accent-500/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              <span className="font-mono font-semibold mr-3 text-accent-600 dark:text-accent-400">{opt}</span>
              {q.options?.[opt]}
            </button>
          ))}
        </div>

        {/* Navigation + Finish */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t-2">
          <Button variant="ghost" size="sm" disabled={currentIndex === 0} onClick={() => onGoTo(currentIndex - 1)}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Prev
          </Button>
          <span className="text-[10px] text-gray-400">← → navigate · A-D select · Enter next</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onGoTo(currentIndex + 1)} disabled={currentIndex === total - 1}>
              Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Question palette */}
      <div className="bg-white dark:bg-gray-900 border-2 rounded-lg p-3">
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => {
            const qid = questions[i].id;
            const isCurrent = i === currentIndex;
            const isAnswered = answers[qid] !== undefined;
            return (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                className={`w-7 h-7 text-[11px] font-mono font-bold rounded border-2 transition-colors ${
                  isCurrent
                    ? "border-accent-500 bg-accent-500 text-white"
                    : isAnswered
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      : "border-gray-300 dark:border-gray-600 text-gray-500 hover:border-gray-400"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Finish button */}
      <div className="flex justify-center">
        <Button onClick={onFinish} size="lg">
          <Zap className="w-4 h-4 mr-2" />
          Finish Practice ({total - answeredCount} unanswered)
        </Button>
      </div>
    </div>
  );
}

/* ── Session Summary Screen ───────────────────────────────────────────── */

function SessionSummary({ results, summary, section, config, onPracticeMore, onDashboard }) {
  const accuracy = summary.total_questions > 0
    ? Math.round((summary.correct / summary.total_questions) * 100) : 0;
  const totalFormatted = formatTime(results?.reduce((t, r) => t + (r.time_taken || 0), 0) || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-accent-100 dark:bg-accent-900/30 mb-3">
            <Zap className="w-8 h-8 text-accent-500" />
          </div>
          <h2 className="text-xl font-bold">Session Complete</h2>
          <p className="text-sm text-gray-500 mt-1">
            {SECTIONS[section]?.label || section} · {config?.mode} mode
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="border-2 rounded-md p-3 text-center">
            <div className="text-2xl font-bold font-mono">{summary.total_questions}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Attempted</div>
          </div>
          <div className="border-2 rounded-md p-3 text-center border-green-500/50">
            <div className="text-2xl font-bold font-mono text-green-500">{summary.correct}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Correct</div>
          </div>
          <div className="border-2 rounded-md p-3 text-center border-red-500/50">
            <div className="text-2xl font-bold font-mono text-red-500">{summary.wrong}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Wrong</div>
          </div>
          <div className="border-2 rounded-md p-3 text-center">
            <div className="text-2xl font-bold font-mono">{accuracy}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Accuracy</div>
          </div>
        </div>

        <div className="border-2 rounded-md p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Raw Score</span>
            <span className="font-mono font-bold">{summary.total_marks}/{summary.total_questions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Negative Penalty</span>
            <span className="font-mono font-bold text-red-500">−{summary.total_penalty}</span>
          </div>
          <div className="border-t-2 pt-2 flex justify-between text-sm font-bold">
            <span>Net Score</span>
            <span className={`font-mono ${summary.net_score >= 0 ? "text-green-500" : "text-red-500"}`}>
              {summary.net_score.toFixed(2)}/{summary.total_questions}
            </span>
          </div>
        </div>

        {/* Per-question review */}
        {results?.length > 0 && (
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-semibold">Question Review</h3>
            {results.map((r, i) => (
              <div key={r.question_id} className={`border-2 rounded-md p-3 text-sm ${
                r.correct ? "border-green-500/30" : "border-red-500/30"
              }`}>
                <div className="flex items-center gap-2">
                  {r.correct
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  }
                  <span className="font-mono text-xs text-gray-400">Q{i + 1}</span>
                  <span className="text-xs text-gray-500">Correct: {r.correct_answer}</span>
                  <span className="ml-auto text-xs font-mono">
                    {r.correct ? `+${r.marks_earned}` : `-${r.penalty.toFixed(2)}`}
                  </span>
                </div>
                {r.explanation && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">{r.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={onPracticeMore}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Practice More
          </Button>
          <Button variant="secondary" onClick={onDashboard}>Dashboard</Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Main Practice Page ───────────────────────────────────────────────── */

export default function Practice() {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState("select"); // select | session | summary
  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const startTimeRef = useRef(null);

  // Fetch batch of questions
  const { isLoading: questionsLoading } = useQuery({
    queryKey: ["practice-questions", config?.section, config?.mode, config?.count, config?.difficulty],
    queryFn: () =>
      practiceApi.questions({
        section: config.section,
        mode: config.mode,
        count: Math.min(config.count, 100),
        difficulty: config.difficulty === "any" ? undefined : config.difficulty,
      }).then((res) => {
        setQuestions(res.questions || []);
        setCurrentIndex(0);
        setAnswers({});
        setResults(null);
        setSummary(null);
        startTimeRef.current = Date.now();
        return res;
      }),
    enabled: !!config,
    retry: false,
  });

  // Batch submit mutation
  const finishMutation = useMutation({
    mutationFn: (data) => practiceApi.batchSubmit(data),
    onSuccess: (res) => {
      setResults(res.results);
      setSummary(res.summary);
      // Record study log + invalidate dashboard
      setScreen("summary");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleStart = useCallback((cfg) => {
    setConfig(cfg);
    setScreen("session");
    setTimerKey((k) => k + 1);
  }, []);

  const handleSelectOption = useCallback((qid, opt) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: prev[qid] === opt ? undefined : opt, // toggle off
    }));
  }, []);

  const handleGoTo = useCallback((idx) => {
    setCurrentIndex(Math.max(0, Math.min(idx, questions.length - 1)));
  }, [questions.length]);

  const handleFinish = useCallback(() => {
    if (!config || Object.keys(answers).length === 0) return;
    const answerList = Object.entries(answers).map(([qid, opt], i) => ({
      question_id: qid,
      selected_option: opt,
      time_taken_sec: 15, // simplified timing
    }));
    finishMutation.mutate({
      section: config.section,
      answers: answerList,
      practice_mode: config.mode,
    });
  }, [config, answers, finishMutation]);

  const handleTimerExpire = useCallback(() => {
    if (Object.keys(answers).length > 0) handleFinish();
  }, [answers, handleFinish]);

  // Selector screen
  if (screen === "select") {
    return <SectionSelector onStart={handleStart} />;
  }

  // Summary screen
  if (screen === "summary" && summary) {
    return (
      <SessionSummary
        results={results}
        summary={summary}
        section={config?.section}
        config={config}
        onPracticeMore={() => {
          setScreen("select");
          setConfig(null);
          setQuestions([]);
        }}
        onDashboard={() => { window.location.href = "/dashboard"; }}
      />
    );
  }

  // Session screen
  return (
    <PracticeSession
      questions={questions}
      answers={answers}
      currentIndex={currentIndex}
      onSelectOption={handleSelectOption}
      onGoTo={handleGoTo}
      onFinish={handleFinish}
      config={config}
      timer={
        config?.isTimed ? (
          <Timer
            key={timerKey}
            mode="countdown"
            totalSeconds={config.timeLimit || 1200}
            sectionKey={config?.section}
            onExpire={handleTimerExpire}
            running={screen === "session" && !finishMutation.isPending}
          />
        ) : (
          <Timer
            key={timerKey}
            mode="elapsed"
            sectionKey={config?.section}
            running={screen === "session" && !finishMutation.isPending}
          />
        )
      }
    />
  );
}
