import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mocksApi } from "../lib/api";
import { Card, CardTitle, Button, Badge } from "../components/ui";
import { formatDate, formatTime } from "../lib/utils";
import { SECTIONS } from "../lib/constants";
import {
  ScrollText, Play, ExternalLink, ChevronRight, ChevronLeft,
  Clock, Flag, CheckCircle, XCircle,
  Target, Zap
} from "lucide-react";

/* ── Mock Home Screen ────────────────────────────────────────────────── */

function MockHome({ onCreateMock, onStartSession, onLogExternal }) {
  const { data, isLoading } = useQuery({
    queryKey: ["mock-results"],
    queryFn: mocksApi.results,
  });
  const results = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-sans">Mock Tests</h1>
        <Button onClick={() => onCreateMock("prelims")}>
          <Play className="w-4 h-4 mr-1.5" />
          Start New Mock
        </Button>
      </div>

      {/* Start new mock card */}
      <Card className="border-accent-500/50">
        <CardTitle>Start New Mock</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex gap-3">
            <MockPhaseButton phase="prelims" label="Prelims (100 Q · 80 min)" desc="English · Reasoning · Quant · PK" onClick={() => onCreateMock("prelims")} />
            <MockPhaseButton phase="mains" label="Mains (150 Q · 125 min)" desc="English · Reasoning · Quant · PK + Descriptive" onClick={() => onCreateMock("mains")} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onLogExternal}>
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Log External Mock
            </Button>
          </div>
        </div>
      </Card>

      {/* Past mocks */}
      {isLoading ? (
        <Card>
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-16" />
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-20" />
              </div>
            ))}
          </div>
        </Card>
      ) : results.length === 0 ? (
        <Card className="text-center py-8">
          <ScrollText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-bold mb-2">No mock tests yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create your first mock to simulate the real exam.
          </p>
          <Button onClick={() => onCreateMock("prelims")}>Start New Mock</Button>
        </Card>
      ) : (
        <Card>
          <CardTitle>Past Mocks</CardTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-left">
                  <th className="pb-2 font-medium">Mock</th>
                  <th className="pb-2 font-medium">Phase</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Net</th>
                  <th className="pb-2 font-medium">Acc</th>
                  <th className="pb-2 font-medium">Attempted</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y-2">
                {results.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        {m.source_name || "Internal"}
                        {m.source === "external" && (
                          <Badge variant="default">External</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <span className="text-xs uppercase font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {m.phase}
                      </span>
                    </td>
                    <td className="py-2 font-mono font-bold">
                      {m.overall?.raw_marks ?? "—"}/{m.overall?.total_marks ?? "—"}
                    </td>
                    <td className="py-2 font-mono">
                      {m.overall?.net_marks != null ? m.overall.net_marks.toFixed(1) : "—"}
                    </td>
                    <td className="py-2 font-mono">{m.overall?.accuracy_pct ?? "—"}%</td>
                    <td className="py-2 font-mono text-xs">
                      {m.overall?.attempted_count ?? "—"}/{m.overall?.total_questions ?? "—"}
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{formatDate(m.completed_at || m.taken_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function MockPhaseButton({ phase, label, desc, onClick }) {
  const icon = phase === "prelims" ? Target : Zap;
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className="flex-1 p-4 border-2 rounded-lg hover:border-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/10 transition-colors text-left"
    >
      <Icon className="w-6 h-6 text-accent-500 mb-1" />
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
    </button>
  );
}

/* ── Mock Setup Screen ───────────────────────────────────────────────── */

function MockSetup({ phase, onStart, onBack }) {
  const createMutation = useMutation({
    mutationFn: (data) => mocksApi.create(data),
    onSuccess: (mock) => {
      mocksApi.start(mock.id).then((session) => {
        onStart(session, mock.id);
      });
    },
  });

  const phaseLabel = phase === "prelims" ? "Prelims" : "Mains";
  const sectionKeys = phase === "prelims"
    ? ["english", "reasoning", "quant", "dbms"]
    : ["english", "reasoning", "quant", "dbms"];

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <Card>
        <CardTitle>Start {phaseLabel} Mock</CardTitle>
        <div className="mt-4 space-y-3">
          <div className="text-sm text-gray-500">{phaseLabel} — {sectionKeys.length} sections</div>

          <div className="space-y-2">
            {sectionKeys.map((sk) => {
              const s = SECTIONS[sk];
              const pc = phase === "prelims"
                ? { q: 25, t: 20, m: sk === "dbms" ? 2 : 1 }
                : { q: sk === "english" ? 30 : sk === "reasoning" ? 40 : sk === "quant" ? 30 : 50, t: sk === "english" ? 25 : sk === "reasoning" ? 35 : sk === "quant" ? 25 : 40, m: sk === "dbms" ? 2 : 1 };
              return (
                <div key={sk} className="flex items-center justify-between border-2 rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={s?.type === "pk" ? "pk" : "non_pk"}>{sk}</Badge>
                    <span className="font-medium">{s?.label || sk}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {pc.q} Q · {pc.t} min · +{pc.m}/-0.25
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            className="w-full mt-2"
            size="lg"
            onClick={() =>
              createMutation.mutate({
                phase,
                title: `${phaseLabel} Mock #${Date.now() % 1000}`,
              })
            }
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Start Mock"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Mock Session Screen ─────────────────────────────────────────────── */

function MockSession({ session, mockId, onSectionComplete, onFinish }) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [startTime] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  const section = session.section;
  const questions = section.questions || [];
  const currentQ = questions[currentQIndex];
  const totalQs = section.total_questions || questions.length;
  const progress = ((currentQIndex + 1) / totalQs) * 100;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      const key = e.key.toLowerCase();
      if (["a", "b", "c", "d"].includes(key) && currentQ) {
        selectOption(currentQ.id, key.toUpperCase());
      } else if (key === "enter") {
        if (answers[currentQ?.id]) {
          if (currentQIndex < totalQs - 1) {
            setCurrentQIndex((i) => i + 1);
          }
        }
      } else if (key === "arrowright") {
        setCurrentQIndex((i) => Math.min(totalQs - 1, i + 1));
      } else if (key === "arrowleft") {
        setCurrentQIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQ, answers, currentQIndex, totalQs]);

  // Timer
  const [remaining, setRemaining] = useState(section.time_limit_sec || 1200);

  useEffect(() => {
    if (submitting) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitSection();
          return 0;
        }
        setTimeSpent((section.time_limit_sec || 1200) - prev + 1);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitting, section.time_limit_sec]);

  const handleSubmitSection = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await mocksApi.submitSection(mockId, {
        key: section.key,
        answers,
        time_spent_sec: Math.max(1, elapsed),
        marked_for_review: [...markedForReview],
      });
      if (res.completed) {
        // All sections done — finish the mock
        const finishRes = await mocksApi.finish(mockId);
        onFinish(finishRes, mockId);
      } else {
        onSectionComplete(res, mockId);
      }
    } catch (err) {
      setSubmitting(false);
    }
  }, [submitting, startTime, section.key, answers, markedForReview, mockId, onSectionComplete, onFinish]);

  const selectOption = (qid, opt) => {
    setAnswers((prev) => ({ ...prev, [qid]: prev[qid] === opt ? null : opt }));
  };

  const toggleMarkForReview = (qid) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const clearAnswer = (qid) => {
    setAnswers((prev) => ({ ...prev, [qid]: undefined }));
  };

  if (!currentQ) return null;

  const timerMins = Math.floor(remaining / 60);
  const timerSecs = remaining % 60;
  const timerColor = remaining < 120 ? "text-red-500 animate-pulse" : remaining < 300 ? "text-amber-500" : "text-gray-700 dark:text-gray-300";

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-2 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant={section.key === "dbms" ? "pk" : "non_pk"}>{section.label || section.key}</Badge>
          <span className="text-xs text-gray-500 font-mono">Section {session.section_index + 1}/{session.total_sections}</span>
        </div>
        <span className={`font-mono font-bold text-lg tabular-nums ${timerColor}`}>
          {timerMins.toString().padStart(2, "0")}:{timerSecs.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Question card */}
      <Card>
        {/* Question number */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 font-mono">
            Question {currentQIndex + 1} of {totalQs}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Marks: +{currentQ.marks || 1}/-0.25</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Statement */}
        <p className="text-base leading-relaxed mb-4">{currentQ.statement}</p>

        {/* Options */}
        <div className="space-y-2">
          {["A", "B", "C", "D"].map((opt) => {
            const isSelected = answers[currentQ.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => selectOption(currentQ.id, opt)}
                className={`w-full text-left p-3 border-2 rounded-md text-sm transition-all ${
                  isSelected
                    ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-1 ring-accent-500/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                }`}
              >
                <span className={`font-mono font-semibold mr-3 ${isSelected ? "text-accent-600" : "text-gray-500"}`}>
                  {opt}
                </span>
                {currentQ.options?.[opt]}
              </button>
            );
          })}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t-2">
          <div className="flex gap-1">
            <button
              onClick={() => toggleMarkForReview(currentQ.id)}
              className={`px-2.5 py-1.5 border-2 rounded-md text-xs font-medium transition-colors ${
                markedForReview.has(currentQ.id)
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
              }`}
            >
              <Flag className="w-3.5 h-3.5 inline mr-1" />
              {markedForReview.has(currentQ.id) ? "Marked" : "Review"}
            </button>
            {answers[currentQ.id] && (
              <button
                onClick={() => clearAnswer(currentQ.id)}
                className="px-2.5 py-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-500 hover:border-gray-400"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((i) => i - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            {currentQIndex < totalQs - 1 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentQIndex((i) => i + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmitSection} disabled={submitting}>
                {submitting ? "..." : "Submit Section"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-3 pt-3 border-t-2">
          <div className="flex gap-1 flex-wrap">
            {questions.slice(0, Math.min(totalQs, 25)).map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQIndex(i)}
                className={`w-5 h-5 border-2 rounded text-[9px] font-mono font-bold transition-colors ${
                  i === currentQIndex
                    ? "border-accent-500 bg-accent-500 text-white"
                    : answers[q.id]
                    ? "border-accent-300 bg-accent-50 dark:bg-accent-900/20 text-accent-600"
                    : markedForReview.has(q.id)
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                    : "border-gray-300 dark:border-gray-600 text-gray-500 hover:border-gray-400"
                }`}
              >
                {i + 1}
              </button>
            ))}
            {totalQs > 25 && (
              <span className="text-xs text-gray-400 self-center ml-1">+{totalQs - 25} more</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Section Transition Screen ───────────────────────────────────────── */

function SectionTransition({ sectionResult, session, onNextSection }) {
  const r = sectionResult;
  const totalTimeFormatted = formatTime(r.time_spent_sec);
  const limitFormatted = formatTime(r.time_limit_sec);

  return (
    <div className="max-w-lg mx-auto text-center space-y-4">
      <Card>
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold mb-1">Section Complete</h2>
        <p className="text-sm text-gray-500 mb-4">{session?.section?.label || r.key}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border-2 rounded-md p-3">
            <div className="text-xl font-bold font-mono">{r.attempted_count || 0}/{r.attempted_count + r.skipped_count}</div>
            <div className="text-[10px] text-gray-500">Attempted</div>
          </div>
          <div className="border-2 rounded-md p-3">
            <div className="text-xl font-bold font-mono">{r.marked_for_review?.length || 0}</div>
            <div className="text-[10px] text-gray-500">Marked for Review</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-mono mb-4">
          Time: {totalTimeFormatted} of {limitFormatted}
        </div>

        <Button onClick={onNextSection} size="lg">
          Next Section
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </Card>
    </div>
  );
}

/* ── Mock Results Screen ─────────────────────────────────────────────── */

function MockResults({ result, onDashboard, onPracticeMore }) {
  const overall = result.overall || {};
  const sections = result.sections || [];
  const totalMarks = overall.total_marks || sections.reduce((s, sec) => s + (sec.raw_marks || 0) + (sec.negative_marks || 0), 0);
  const netScore = overall.net_marks ?? (overall.raw_marks - overall.negative_marks);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <Card className="border-accent-500/50 text-center">
        <Zap className="w-10 h-10 text-accent-500 mx-auto mb-2" />
        <h2 className="text-xl font-bold mb-1">Mock Complete</h2>
        <p className="text-3xl font-bold font-mono text-accent-500 mb-1">
          {overall.net_marks?.toFixed(1) ?? netScore?.toFixed(1) ?? "—"}/{overall.total_marks ?? totalMarks}
        </p>
        <p className="text-sm text-gray-500">Net Score</p>
      </Card>

      {/* Overall stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Raw" value={overall.raw_marks ?? "—"} color="" />
        <StatBox label="Penalty" value={overall.negative_marks != null ? `-${overall.negative_marks.toFixed(1)}` : "—"} color="text-red-500" />
        <StatBox label="Accuracy" value={overall.accuracy_pct != null ? `${overall.accuracy_pct}%` : "—"} color="text-green-500" />
        <StatBox label="Attempted" value={overall.attempted_count != null ? `${overall.attempted_count}/${(overall.attempted_count || 0) + (overall.skipped_count || 0)}` : "—"} color="" />
      </div>

      {/* Section breakdown */}
      <Card>
        <CardTitle>Section Breakdown</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left text-[10px] text-gray-500 uppercase">
                <th className="pb-2 font-medium">Section</th>
                <th className="pb-2 font-medium text-right">Qs</th>
                <th className="pb-2 font-medium text-right">Att</th>
                <th className="pb-2 font-medium text-right">Cor</th>
                <th className="pb-2 font-medium text-right">Wrg</th>
                <th className="pb-2 font-medium text-right">Marks</th>
                <th className="pb-2 font-medium text-right">Neg</th>
                <th className="pb-2 font-medium text-right">Acc</th>
              </tr>
            </thead>
            <tbody className="divide-y-2">
              {sections.map((sec) => (
                <tr key={sec.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-2 font-medium">{SECTIONS[sec.key]?.label || sec.key}</td>
                  <td className="py-2 font-mono text-right">{(sec.attempted_count || 0) + (sec.skipped_count || 0)}</td>
                  <td className="py-2 font-mono text-right">{sec.attempted_count || 0}</td>
                  <td className="py-2 font-mono text-right text-green-500">{sec.correct_count || 0}</td>
                  <td className="py-2 font-mono text-right text-red-500">{sec.wrong_count || 0}</td>
                  <td className="py-2 font-mono text-right">{sec.raw_marks || 0}</td>
                  <td className="py-2 font-mono text-right text-red-500">{sec.negative_marks ? `-${sec.negative_marks.toFixed(1)}` : "0"}</td>
                  <td className="py-2 font-mono text-right">
                    {sec.attempted_count > 0 ? `${Math.round((sec.correct_count / sec.attempted_count) * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="pt-2">Total</td>
                <td className="pt-2 font-mono text-right">{(overall.attempted_count || 0) + (overall.skipped_count || 0)}</td>
                <td className="pt-2 font-mono text-right">{overall.attempted_count || 0}</td>
                <td className="pt-2 font-mono text-right text-green-500">{overall.correct_count || 0}</td>
                <td className="pt-2 font-mono text-right text-red-500">{overall.wrong_count || 0}</td>
                <td className="pt-2 font-mono text-right">{overall.raw_marks || 0}</td>
                <td className="pt-2 font-mono text-right text-red-500">{overall.negative_marks ? `-${overall.negative_marks.toFixed(1)}` : "0"}</td>
                <td className="pt-2 font-mono text-right">{overall.accuracy_pct != null ? `${overall.accuracy_pct}%` : "—"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Time analysis */}
      <Card>
        <CardTitle>Time Analysis</CardTitle>
        <div className="mt-3 space-y-2">
          {sections.map((sec) => {
            const used = sec.time_spent_sec || 0;
            const limit = sec.time_limit_sec || 1;
            const pct = Math.round((used / limit) * 100);
            const isOver = used > limit;
            return (
              <div key={sec.key} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-xs truncate">{SECTIONS[sec.key]?.label || sec.key}</span>
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs w-20 text-right">
                  {formatTime(used)}/{formatTime(limit)}
                </span>
                <span className={`text-xs ${isOver ? "text-red-500" : "text-green-500"}`}>
                  {isOver ? "⚠️" : "✅"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Strategy + Actions */}
      <Card>
        <CardTitle>Attempt Strategy</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {overall.attempted_count > 0 ? (
            <>You attempted {overall.attempted_count} of {overall.total_questions || overall.attempted_count + overall.skipped_count} questions ({Math.round((overall.attempted_count / (overall.total_questions || overall.attempted_count + overall.skipped_count)) * 100)}%).
            {overall.accuracy_pct > 75
              ? " Good accuracy — try increasing attempt rate."
              : " Focus on accuracy to reduce negative marking impact."}</>
          ) : (
            "No questions were attempted in this mock."
          )}
        </p>
        <div className="flex gap-2 mt-4">
          <Button onClick={onPracticeMore}>Practice Weak Sections</Button>
          <Button variant="secondary" onClick={onDashboard}>Dashboard</Button>
        </div>
      </Card>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="border-2 rounded-md p-3 text-center">
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

/* ── External Mock Modal ─────────────────────────────────────────────── */

function ExternalMockModal({ onClose, onLogged }) {
  const [form, setForm] = useState({
    source_name: "",
    phase: "prelims",
    sections: [
      { key: "english", marks_obtained: 0, total_marks: 25, accuracy_pct: 0 },
      { key: "reasoning", marks_obtained: 0, total_marks: 25, accuracy_pct: 0 },
      { key: "quant", marks_obtained: 0, total_marks: 25, accuracy_pct: 0 },
      { key: "dbms", marks_obtained: 0, total_marks: 50, accuracy_pct: 0 },
    ],
    notes: "",
    taken_at: new Date().toISOString().split("T")[0],
  });

  const mutation = useMutation({
    mutationFn: (data) => mocksApi.logExternal(data),
    onSuccess: () => {
      onLogged();
      onClose();
    },
  });

  const updateSection = (idx, field, value) => {
    setForm((f) => {
      const sections = [...f.sections];
      sections[idx] = { ...sections[idx], [field]: Number(value) };
      // Auto-compute accuracy
      if (field === "marks_obtained" || field === "total_marks") {
        sections[idx].accuracy_pct = sections[idx].total_marks > 0
          ? Math.round((sections[idx].marks_obtained / sections[idx].total_marks) * 100)
          : 0;
      }
      return { ...f, sections };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalRaw = form.sections.reduce((s, sec) => s + sec.marks_obtained, 0);
    const totalMax = form.sections.reduce((s, sec) => s + sec.total_marks, 0);
    mutation.mutate({
      source_name: form.source_name,
      phase: form.phase,
      sections: form.sections,
      overall: {
        raw_marks: totalRaw,
        total_marks: totalMax,
        accuracy_pct: totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0,
        notes: form.notes,
      },
      taken_at: form.taken_at,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border-2 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl z-10">
        <h2 className="text-lg font-bold mb-4">Log External Mock</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Source Name *</label>
              <input
                type="text"
                value={form.source_name}
                onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                placeholder="e.g. Testbook #12"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Phase</label>
              <select
                value={form.phase}
                onChange={(e) => {
                  const phase = e.target.value;
                  const sections = phase === "prelims"
                    ? [{ key: "english", marks_obtained: 0, total_marks: 25, accuracy_pct: 0 },
                       { key: "reasoning", marks_obtained: 0, total_marks: 25, accuracy_pct: 0 },
                       { key: "quant", marks_obtained: 0, total_marks: 25, accuracy_pct: 0 },
                       { key: "dbms", marks_obtained: 0, total_marks: 50, accuracy_pct: 0 }]
                    : [{ key: "english", marks_obtained: 0, total_marks: 30, accuracy_pct: 0 },
                       { key: "reasoning", marks_obtained: 0, total_marks: 40, accuracy_pct: 0 },
                       { key: "quant", marks_obtained: 0, total_marks: 30, accuracy_pct: 0 },
                       { key: "dbms", marks_obtained: 0, total_marks: 100, accuracy_pct: 0 }];
                  setForm((f) => ({ ...f, phase, sections }));
                }}
                className="w-full border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
              >
                <option value="prelims">Prelims</option>
                <option value="mains">Mains</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-medium text-gray-500">Section Scores</div>
          {form.sections.map((sec, i) => (
            <div key={sec.key} className="flex items-center gap-2">
              <span className="w-20 text-xs font-medium">{SECTIONS[sec.key]?.label || sec.key}</span>
              <input
                type="number"
                value={sec.marks_obtained}
                onChange={(e) => updateSection(i, "marks_obtained", e.target.value)}
                className="w-20 border-2 rounded-md px-2 py-1 text-xs font-mono bg-white dark:bg-gray-900"
                min="0"
              />
              <span className="text-xs text-gray-400">/</span>
              <span className="text-xs font-mono text-gray-500 w-12">{sec.total_marks}</span>
              <span className="text-xs font-mono w-10 text-right">{sec.accuracy_pct}%</span>
            </div>
          ))}

          <div>
            <label className="text-xs font-medium block mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border-2 rounded-md px-2 py-1.5 text-sm min-h-[50px] bg-white dark:bg-gray-900"
              placeholder="How did it go?"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Date Taken</label>
            <input
              type="date"
              value={form.taken_at}
              onChange={(e) => setForm((f) => ({ ...f, taken_at: e.target.value }))}
              className="border-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!form.source_name || mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Log Mock"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Mocks Page ─────────────────────────────────────────────────── */

export default function Mocks() {
  const [screen, setScreen] = useState("home"); // home | setup | session | transition | results
  const [mockPhase, setMockPhase] = useState("prelims");
  const [currentSession, setCurrentSession] = useState(null);
  const [mockId, setMockId] = useState(null);
  const [sectionResult, setSectionResult] = useState(null);
  const [mockResult, setMockResult] = useState(null);
  const [showExternal, setShowExternal] = useState(false);
  const queryClient = useQueryClient();

  const handleCreateMock = (phase) => {
    setMockPhase(phase);
    setScreen("setup");
  };

  const handleStartSession = (session, mid) => {
    setCurrentSession(session);
    setMockId(mid);
    setSectionResult(null);
    setScreen("session");
  };

  const handleSectionComplete = (res, mid) => {
    setSectionResult(res);
    setMockId(mid);
    setCurrentSession((prev) => ({
      ...prev,
      section: res.next_section,
      section_index: res.section_index,
    }));
    setScreen("transition");
  };

  const handleNextSection = () => {
    setSectionResult(null);
    setScreen("session");
  };

  const handleFinish = (res, mid) => {
    setMockResult(res);
    setMockId(mid);
    queryClient.invalidateQueries({ queryKey: ["mock-results"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setScreen("results");
  };

  const handleLogExternal = () => {
    setShowExternal(true);
  };

  const handleExternalLogged = () => {
    queryClient.invalidateQueries({ queryKey: ["mock-results"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  switch (screen) {
    case "setup":
      return (
        <MockSetup
          phase={mockPhase}
          onStart={handleStartSession}
          onBack={() => setScreen("home")}
        />
      );
    case "session":
      return (
        <MockSession
          session={currentSession}
          mockId={mockId}
          onSectionComplete={handleSectionComplete}
          onFinish={handleFinish}
        />
      );
    case "transition":
      return (
        <SectionTransition
          sectionResult={sectionResult}
          session={currentSession}
          onNextSection={handleNextSection}
        />
      );
    case "results":
      return (
        <MockResults
          result={mockResult || {}}
          onDashboard={() => { window.location.href = "/dashboard"; }}
          onPracticeMore={() => setScreen("home")}
        />
      );
    default:
      return (
        <>
          <MockHome
            onCreateMock={handleCreateMock}
            onStartSession={handleStartSession}
            onLogExternal={handleLogExternal}
          />
          {showExternal && (
            <ExternalMockModal
              onClose={() => setShowExternal(false)}
              onLogged={handleExternalLogged}
            />
          )}
        </>
      );
  }
}
