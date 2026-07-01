import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, settingsApi, coverageApi, seedApi } from "../lib/api";
import { Card, CardTitle, Button } from "../components/ui";
import { getDaysUntil } from "../lib/utils";
import { SECTIONS, PK_TOPICS } from "../lib/constants";
import {
  Zap, Target, BookOpen, TrendingUp, ChevronDown, ChevronRight,
  CheckCircle, Circle, RotateCcw, Settings, Calendar, X
} from "lucide-react";

function SectionRow({ section, onToggle, isExpanded }) {
  const data = section || {};
  const acc = data.accuracy_pct || 0;
  const color = acc >= 70 ? "text-green-500" : acc >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="border-2 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="w-28 font-medium truncate">{SECTIONS[data.section]?.label || data.section}</span>
        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${acc}%` }} />
        </div>
        <span className={`font-mono text-xs w-10 text-right ${color}`}>{acc}%</span>
        <span className="font-mono text-xs text-gray-500 w-12 text-right">{data.questions_solved || 0}</span>
        <span className="font-mono text-xs text-gray-400 w-14 text-right">{data.avg_time_sec ? `${data.avg_time_sec}s` : "—"}</span>
        <span className="font-mono text-xs text-red-400 w-14 text-right">{data.penalty ? `-${data.penalty.toFixed(1)}` : "—"}</span>
      </button>
      {isExpanded && <SyllabusPanel sectionKey={data.section} />}
    </div>
  );
}

function SyllabusPanel({ sectionKey }) {
  const queryClient = useQueryClient();
  const { data: coverage, isLoading: coverageLoading } = useQuery({
    queryKey: ["coverage"],
    queryFn: coverageApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: ({ section, topic, data }) => coverageApi.update(section, topic, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coverage"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const sectionInfo = SECTIONS[sectionKey];
  const sectionCoverage = coverage?.coverage?.[sectionKey] || {};
  const hasTopics = sectionInfo?.has_topics;
  const topics = hasTopics ? PK_TOPICS[sectionKey] || [] : ["_section"];

  const statusCycle = { "not_started": "studied", "studied": "revised", "revised": "not_started" };
  const statusColors = { "not_started": "text-gray-400", "studied": "text-amber-500", "revised": "text-green-500" };
  const statusIcons = { "not_started": Circle, "studied": RotateCcw, "revised": CheckCircle };
  const statusLabels = { "not_started": "Not Started", "studied": "Studied", "revised": "Revised" };

  if (coverageLoading) {
    return (
      <div className="border-t-2 bg-gray-50 dark:bg-gray-800/30 px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mb-2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-2 bg-gray-50 dark:bg-gray-800/30 px-4 py-3">
      <div className="text-xs font-medium text-gray-500 mb-2">
        {hasTopics ? "Topics" : "Section Status"}
      </div>
      <div className="space-y-1.5">
        {topics.map((topicKey) => {
          const topicData = sectionCoverage[topicKey] || { status: "not_started", lectures: 0, notes: false };
          const StatusIcon = statusIcons[topicData.status] || Circle;
          const color = statusColors[topicData.status] || "text-gray-400";

          const cycleStatus = () => {
            const next = statusCycle[topicData.status] || "studied";
            updateMutation.mutate({
              section: sectionKey,
              topic: topicKey,
              data: { status: next, lectures: topicData.lectures, notes: topicData.notes },
            });
          };

          return (
            <div key={topicKey} className="flex items-center gap-2 text-sm">
              <button onClick={cycleStatus} className="p-0.5 hover:opacity-70">
                <StatusIcon className={`w-4 h-4 ${color}`} />
              </button>
              <span className="flex-1">{topicKey === "_section" ? "Section Coverage" : topicKey.replace(/_/g, " ")}</span>
              <span className={`text-[10px] font-medium ${color}`}>{statusLabels[topicData.status]}</span>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      section: sectionKey, topic: topicKey,
                      data: { status: topicData.status, lectures: Math.max(0, (topicData.lectures || 0) - 1), notes: topicData.notes },
                    })
                  }
                  className="px-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  −
                </button>
                <span className="font-mono text-xs w-4 text-center">{topicData.lectures || 0}</span>
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      section: sectionKey, topic: topicKey,
                      data: { status: topicData.status, lectures: (topicData.lectures || 0) + 1, notes: topicData.notes },
                    })
                  }
                  className="px-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-gray-400 w-12">lectures</span>

              <label className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                <input
                  type="checkbox"
                  checked={topicData.notes || false}
                  onChange={() =>
                    updateMutation.mutate({
                      section: sectionKey, topic: topicKey,
                      data: { status: topicData.status, lectures: topicData.lectures, notes: !topicData.notes },
                    })
                  }
                  className="rounded w-3 h-3"
                />
                Notes
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExamDatesEditor({ settings, onUpdate, onClose }) {
  const [prelims, setPrelims] = useState(settings?.exam_date_prelims || "");
  const [mains, setMains] = useState(settings?.exam_date_mains || "");

  const handleSave = () => {
    onUpdate({ exam_date_prelims: prelims, exam_date_mains: mains });
    onClose();
  };

  return (
    <div className="border-2 rounded-md p-3 bg-gray-50 dark:bg-gray-800/30 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Exam Dates</span>
        <button onClick={onClose} className="p-0.5 hover:opacity-70">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 block mb-0.5">Prelims</label>
          <input
            type="date"
            value={prelims}
            onChange={(e) => setPrelims(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-2 rounded bg-white dark:bg-gray-900 dark:border-gray-700"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 block mb-0.5">Mains</label>
          <input
            type="date"
            value={mains}
            onChange={(e) => setMains(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-2 rounded bg-white dark:bg-gray-900 dark:border-gray-700"
          />
        </div>
        <Button size="sm" onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}

function SyllabusCoverageCard({ expandedSection, setExpandedSection, sectionData }) {
  // Always show all sections from constants, merged with any dashboard data
  const nonPkKeys = Object.keys(SECTIONS).filter((k) => SECTIONS[k].type === "non_pk");
  const pkKeys = Object.keys(SECTIONS).filter((k) => SECTIONS[k].type === "pk");

  return (
    <Card>
      <CardTitle>Section Readiness & Syllabus Coverage</CardTitle>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3 px-3 py-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          <span className="w-28" />
          <span className="flex-1" />
          <span className="w-10 text-right">Acc</span>
          <span className="w-12 text-right">Solved</span>
          <span className="w-14 text-right">Avg Time</span>
          <span className="w-14 text-right">Penalty</span>
        </div>
        {[...nonPkKeys, ...pkKeys].map((key) => {
          const section = sectionData[key] || { section: key };
          return (
            <SectionRow
              key={key}
              section={section}
              isExpanded={expandedSection === key}
              onToggle={() => setExpandedSection(expandedSection === key ? null : key)}
            />
          );
        })}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState(null);
  const [showDateEditor, setShowDateEditor] = useState(false);

  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: analyticsApi.dashboard,
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const seedMutation = useMutation({
    mutationFn: seedApi.seed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: seedApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["mock-results"] });
    },
  });

  // Countdowns
  const prelimsDate = settings?.exam_date_prelims || "2026-08-29";
  const mainsDate = settings?.exam_date_mains || "2026-11-01";
  const daysToPrelims = getDaysUntil(prelimsDate);
  const daysToMains = getDaysUntil(mainsDate);
  const prelimsDone = daysToPrelims === 0 && new Date(prelimsDate) < new Date();

  // Merge section data from dashboard API (if any) for overlay stats
  const sectionData = {};
  if (dashboard?.sections) {
    dashboard.sections.forEach((s) => { sectionData[s.section] = s; });
  }

  const overview = dashboard?.overview;
  const hasData = overview && overview.total_questions_solved > 0;

  if (isDashboardLoading || isSettingsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with dual countdown */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold font-sans">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-accent-500" />
            <span className="font-mono font-semibold">{daysToPrelims}d</span>
            <span className="text-gray-500">Prelims</span>
          </div>
          {prelimsDone && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="font-mono font-semibold">{daysToMains}d</span>
              <span className="text-gray-500">Mains</span>
            </div>
          )}
          <button
            onClick={() => setShowDateEditor(!showDateEditor)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Set exam dates"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Inline date editor */}
      {showDateEditor && (
        <ExamDatesEditor
          settings={settings}
          onUpdate={(data) => updateSettingsMutation.mutate(data)}
          onClose={() => setShowDateEditor(false)}
        />
      )}

      {/* Onboarding hero — shown when no practice data */}
      {!hasData && (
        <Card className="text-center py-8">
          <Zap className="w-10 h-10 mx-auto mb-3 text-accent-500" />
          <h2 className="text-lg font-bold mb-1">Welcome to BYOP Studio</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Import questions, log external mocks, or start practicing. Track your syllabus coverage below.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => navigate("/repository")}>Import CSV</Button>
            <Button variant="secondary" onClick={() => navigate("/mocks")}>Log External Mock</Button>
            <Button variant="secondary" onClick={() => navigate("/practice")}>Practice</Button>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-gray-200 dark:border-gray-800 flex gap-2 justify-center">
            <Button
              variant="secondary" size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? "Seeding..." : "Import Sample Questions"}
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => { if (confirm("Remove all questions and data?")) clearMutation.mutate(); }}
              disabled={clearMutation.isPending}
              className="text-red-500 hover:text-red-600"
            >
              {clearMutation.isPending ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </Card>
      )}

      {/* Stat cards — only when data exists */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-accent-500" />
              <div>
                <div className="text-2xl font-bold font-mono">{overview.total_questions_solved}</div>
                <div className="text-xs text-gray-500">Questions Solved</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold font-mono">{overview.overall_accuracy_pct}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold font-mono">
                  {Math.floor((overview.total_study_minutes_this_week ?? 0) / 60)}h {(overview.total_study_minutes_this_week ?? 0) % 60}m
                </div>
                <div className="text-xs text-gray-500">Study Time this week</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Syllabus Coverage — ALWAYS visible */}
      <SyllabusCoverageCard
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
        sectionData={sectionData}
      />

      {/* Today's Focus — only when data exists */}
      {hasData && dashboard.today_focus && (
        <Card className="border-accent-500/50">
          <CardTitle>Today's Focus</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {dashboard.today_focus.focus_reason}
          </p>
          {dashboard.today_focus.secondary_actions?.length > 0 && (
            <ul className="mt-2 text-xs text-gray-500 space-y-0.5">
              {dashboard.today_focus.secondary_actions.map((a, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  {a}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Button size="sm" onClick={() => navigate("/practice")}>
              Practice {dashboard.today_focus.focus_section}
            </Button>
          </div>
        </Card>
      )}

      {/* Phase Readiness — only when data exists */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["prelims", "mains"].map((phase) => {
            const pr = dashboard?.phase_readiness?.[phase];
            return (
              <Card key={phase}>
                <CardTitle>{phase.charAt(0).toUpperCase() + phase.slice(1)} Readiness</CardTitle>
                {pr ? (
                  <div className="mt-2 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all"
                        style={{ width: `${pr.readiness_pct || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{pr.sections_ready || 0}/{pr.sections_included?.length || 4} sections ready</span>
                      <span>Mock avg: {pr.mock_avg_score}/{pr.mock_avg_total}</span>
                      <span>Syllabus: {pr.syllabus_pct || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-800 rounded-full" />
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent mocks — only when data exists */}
      {hasData && dashboard.recent_mocks?.length > 0 && (
        <Card>
          <CardTitle>Recent Mocks</CardTitle>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dashboard.recent_mocks.map((m) => (
              <div key={m.id} className="border-2 rounded-md p-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{m.source_name || m.title || "Mock"}</span>
                  {m.source === "external" && (
                    <span className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">External</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {m.overall?.raw_marks || m.score}/{m.overall?.total_marks || m.total_marks} ·{" "}
                  {m.overall?.accuracy_pct || m.accuracy_pct}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
