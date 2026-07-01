import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsApi } from "../../lib/api";
import { Button, Badge } from "../ui";
import { X, Star, CheckCircle, XCircle, Clock, Target, BarChart3, Pencil } from "lucide-react";
import { formatDate, formatTime } from "../../lib/utils";

export default function QuestionDetailsModal({ questionId, onClose, onEdit }) {
  const queryClient = useQueryClient();

  const { data: question, isLoading } = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => questionsApi.get(questionId),
    enabled: !!questionId,
  });

  const { data: attemptsData } = useQuery({
    queryKey: ["question-attempts", questionId],
    queryFn: () =>
      fetch(`/api/ibps/questions/${questionId}/attempts`)
        .then((r) => r.json()),
    enabled: !!questionId,
  });

  const bookmarkMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/ibps/questions/${questionId}/bookmark`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  if (!questionId) return null;
  const attempts = attemptsData?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border-2 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Question Details</h2>
            {question && <Badge variant={question.section}>{question.section}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {question && onEdit && (
              <Button size="sm" variant="secondary" onClick={() => onEdit(question)}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>
        ) : !question ? (
          <div className="p-8 text-center text-gray-500">Question not found</div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Statement */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Statement</label>
              <p className="text-base leading-relaxed">{question.statement}</p>
            </div>

            {/* Options */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Options</label>
              <div className="space-y-1.5">
                {["A", "B", "C", "D"].map((opt) => {
                  const isCorrect = question.correct_answer === opt;
                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-2 p-2 border-2 rounded-md text-sm ${
                        isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <span className="font-mono font-semibold">{opt})</span>
                      <span>{question.options?.[opt]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="border-2 rounded-md p-3 text-center">
                <div className="text-xl font-bold font-mono">{question.total_attempts || 0}</div>
                <div className="text-[10px] text-gray-500">Attempts</div>
              </div>
              <div className="border-2 rounded-md p-3 text-center">
                <div className="text-xl font-bold font-mono text-green-500">{question.correct_count || 0}</div>
                <div className="text-[10px] text-gray-500">Correct</div>
              </div>
              <div className="border-2 rounded-md p-3 text-center">
                <div className="text-xl font-bold font-mono text-red-500">{question.wrong_count || 0}</div>
                <div className="text-[10px] text-gray-500">Wrong</div>
              </div>
              <div className="border-2 rounded-md p-3 text-center">
                <div className="text-xl font-bold font-mono">{question.avg_time_sec ? `${question.avg_time_sec}s` : "—"}</div>
                <div className="text-[10px] text-gray-500">Avg Time</div>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span>Marks: +{question.marks}/-0.25</span>
              <span>·</span>
              <span>Difficulty: {question.difficulty}</span>
              <span>·</span>
              <span>Phase: {question.phase}</span>
              {question.topic && (
                <>
                  <span>·</span>
                  <span>Topic: {question.topic.replace(/_/g, " ")}</span>
                </>
              )}
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Explanation</label>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {question.explanation}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={question.bookmarked ? "primary" : "secondary"}
                onClick={() => bookmarkMutation.mutate()}
              >
                <Star className={`w-4 h-4 mr-1 ${question.bookmarked ? "fill-white" : ""}`} />
                {question.bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
            </div>

            {/* Attempt History */}
            {attempts.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Attempt History (last {attempts.length})
                </label>
                <div className="border-2 rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b-2">
                      <tr>
                        <th className="text-left px-2 py-1.5">Date</th>
                        <th className="text-left px-2 py-1.5">Result</th>
                        <th className="text-left px-2 py-1.5">Answer</th>
                        <th className="text-left px-2 py-1.5">Time</th>
                        <th className="text-left px-2 py-1.5">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2">
                      {attempts.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-2 py-1.5">{formatDate(a.created_at)}</td>
                          <td className="px-2 py-1.5">
                            {a.correct ? (
                              <span className="text-green-500 font-medium">Correct</span>
                            ) : (
                              <span className="text-red-500 font-medium">Wrong</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 font-mono">{a.selected_option || "—"}</td>
                          <td className="px-2 py-1.5 font-mono">{a.time_taken_sec}s</td>
                          <td className="px-2 py-1.5">{a.confidence || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
