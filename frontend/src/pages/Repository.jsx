import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsApi } from "../lib/api";
import { Card, CardTitle, Button, Badge } from "../components/ui";
import QuestionFormModal from "../components/modals/QuestionFormModal";
import QuestionDetailsModal from "../components/modals/QuestionDetailsModal";
import {
  Plus, Search, Upload, Download, Star, Trash2, Edit3,
  Bookmark, AlertTriangle, FileText, X
} from "lucide-react";
import { SECTIONS, PK_SUBJECTS, PK_TOPICS } from "../lib/constants";
import Papa from "papaparse";

export default function Repository() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [detailsQuestionId, setDetailsQuestionId] = useState(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const params = { page, limit: 50, search, section, status };
  if (subject) params.subject = subject;
  if (topic) params.topic = topic;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["questions", params],
    queryFn: () => questionsApi.list(params),
  });

  const deleteMutation = useMutation({
    mutationFn: questionsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
    onError: (err) => console.error("Delete failed:", err),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => questionsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      setSelected(new Set());
      setShowDeleteConfirm(false);
    },
    onError: (err) => console.error("Bulk delete failed:", err),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (qid) => fetch(`/api/ibps/questions/${qid}/bookmark`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
    onError: (err) => console.error("Bookmark failed:", err),
  });

  const questions = data?.items || [];
  const total = data?.total || 0;
  const sectionInfo = SECTIONS[section];
  const isPk = sectionInfo?.type === "pk";
  const hasTopics = sectionInfo?.has_topics;
  const topics = hasTopics ? PK_TOPICS[section] || [] : [];

  // Status chips config
  const statusChips = [
    { key: "", label: "All" },
    { key: "bookmarked", label: "⭐ Bookmarks" },
    { key: "mistakes", label: "✗ Mistakes" },
    { key: "wrong", label: "✗ Wrong" },
    { key: "weak", label: "⚠ Weak" },
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(new Set(questions.map((q) => q.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // CSV Export
  const handleExportCsv = useCallback(() => {
    const rows = questions.map((q) => ({
      section: q.section,
      subject: q.subject || "",
      topic: q.topic || "",
      statement: q.statement,
      option_a: q.options?.A || "",
      option_b: q.options?.B || "",
      option_c: q.options?.C || "",
      option_d: q.options?.D || "",
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      marks: q.marks,
      difficulty: q.difficulty,
      phase: q.phase,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "questions_export.csv";
    link.click();
  }, [questions]);

  // CSV Import
  const handleCsvFile = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((r) => ({
          section: r.section?.toLowerCase().trim(),
          subject: r.subject?.toLowerCase().trim() || undefined,
          topic: r.topic?.toLowerCase().trim().replace(/ /g, "_") || undefined,
          statement: r.statement?.trim(),
          options: { A: r.option_a, B: r.option_b, C: r.option_c, D: r.option_d },
          correct_answer: r.correct_answer?.toUpperCase().trim(),
          explanation: r.explanation?.trim() || "",
          marks: r.marks ? Number(r.marks) : undefined,
          difficulty: r.difficulty || "medium",
          phase: r.phase || "both",
        })).filter((r) => r.section && r.statement && r.correct_answer);

        if (rows.length === 0) return;

        questionsApi.bulkCreate(rows).then(() => {
          queryClient.invalidateQueries({ queryKey: ["questions"] });
          setShowCsvModal(false);
        });
      },
    });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Failed to load questions</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
          {error?.response?.data?.error || error?.message || "An unknown error occurred"}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["questions"] })}>
          Retry
        </Button>
      </Card>
    );
  }

  if (total === 0 && !search && !section) {
    return (
      <Card className="text-center py-12">
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold mb-2">No questions yet</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Add your first question or import from CSV.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setEditQuestion(null); setShowForm(true); }}>Add Question</Button>
          <Button variant="secondary" onClick={() => setShowCsvModal(true)}>Import CSV</Button>
        </div>

        <QuestionFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          editQuestion={editQuestion}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-sans">Repository</h1>
        <Button onClick={() => { setEditQuestion(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Question
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={section}
          onChange={(e) => { setSection(e.target.value); setSubject(e.target.value || ""); setTopic(""); setPage(1); }}
          className="border-2 rounded-md px-2.5 py-1.5 text-sm bg-white dark:bg-gray-900"
        >
          <option value="">All Sections</option>
          {Object.entries(SECTIONS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {hasTopics && section && topics.length > 0 && (
          <select
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setPage(1); }}
            className="border-2 rounded-md px-2.5 py-1.5 text-sm bg-white dark:bg-gray-900"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        )}

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border-2 rounded-md pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-gray-900"
          />
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowCsvModal(true)} title="Import CSV">
            <Upload className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportCsv} title="Export CSV">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex gap-1 flex-wrap">
        {statusChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => { setStatus(chip.key); setPage(1); }}
            className={`px-2.5 py-1 border-2 rounded-md text-xs font-medium transition-colors ${
              status === chip.key
                ? "border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{selected.size} selected</span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
          {selected.size > 0 && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

      {/* Questions table */}
      <div className="overflow-x-auto border-2 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b-2">
            <tr>
              <th className="text-left px-3 py-2 w-8">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selected.size === questions.length && questions.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="text-left px-3 py-2 font-medium">Section</th>
              <th className="text-left px-3 py-2 font-medium">Statement</th>
              <th className="text-left px-3 py-2 font-medium w-16">Marks</th>
              <th className="text-left px-3 py-2 font-medium w-24">Attempts</th>
              <th className="text-left px-3 py-2 font-medium w-16">Acc</th>
              <th className="text-left px-3 py-2 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2">
            {questions.map((q) => (
              <tr
                key={q.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer ${
                  selected.has(q.id) ? "bg-accent-50/50 dark:bg-accent-900/10" : ""
                }`}
                onDoubleClick={() => setDetailsQuestionId(q.id)}
              >
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.has(q.id)}
                    onChange={() => handleSelect(q.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  <Badge variant={q.section === "english" || q.section === "reasoning" || q.section === "quant" ? "non_pk" : "pk"}>
                    {q.section}
                  </Badge>
                  {q.topic && (
                    <span className="text-[10px] text-gray-400 block mt-0.5">{q.topic.replace(/_/g, " ")}</span>
                  )}
                </td>
                <td className="px-3 py-2 max-w-md truncate">{q.statement}</td>
                <td className="px-3 py-2 font-mono text-xs">+{q.marks}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-green-500">{q.correct_count || 0}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-red-500">{q.wrong_count || 0}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {q.total_attempts > 0
                    ? `${Math.round((q.correct_count / q.total_attempts) * 100)}%`
                    : "—"}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => bookmarkMutation.mutate(q.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Bookmark"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          q.bookmarked
                            ? "text-accent-500 fill-accent-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => { setEditQuestion(q); setShowForm(true); }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this question?")) deleteMutation.mutate(q.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Showing {questions.length} of {total} question{total !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page * 50 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Import/Export bar */}
      <div className="flex gap-2 text-sm text-gray-500">
        <button onClick={() => setShowCsvModal(true)} className="hover:text-accent-500 underline underline-offset-2">
          Import CSV
        </button>
        <span>·</span>
        <button onClick={handleExportCsv} className="hover:text-accent-500 underline underline-offset-2">
          Export CSV
        </button>
      </div>

      {/* Question Form Modal */}
      <QuestionFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditQuestion(null); }}
        editQuestion={editQuestion}
      />

      {/* Question Details Modal */}
      <QuestionDetailsModal
        questionId={detailsQuestionId}
        onClose={() => setDetailsQuestionId(null)}
        onEdit={(q) => {
          setDetailsQuestionId(null);
          setEditQuestion(q);
          setShowForm(true);
        }}
      />

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCsvModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border-2 rounded-lg w-full max-w-md p-6 shadow-xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Import CSV</h3>
              <button onClick={() => setShowCsvModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-xs space-y-1">
                <p className="font-medium mb-1">Required columns:</p>
                <code className="block">section, statement, option_a, option_b, option_c, option_d, correct_answer</code>
                <p className="font-medium mt-2 mb-1">Optional:</p>
                <code className="block">subject, topic, explanation, marks, difficulty, phase</code>
              </div>

              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files[0]) handleCsvFile(e.target.files[0]);
                  }}
                  className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:border-2 file:rounded-md file:text-sm file:font-medium file:bg-white dark:file:bg-gray-900 hover:file:bg-gray-50"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 border-2 rounded-lg w-full max-w-sm p-6 shadow-xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold">Delete {selected.size} question{selected.size !== 1 ? "s" : ""}?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete the selected questions and their attempt history.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => bulkDeleteMutation.mutate([...selected])}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
