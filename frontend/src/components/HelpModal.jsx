import { X, Keyboard, Command, Square } from "lucide-react";

const SHORTCUTS = [
  { page: "Practice", keys: [
    { label: "Select option A/B/C/D", keys: "A / B / C / D" },
    { label: "Set confidence 1-5", keys: "1 / 2 / 3 / 4 / 5" },
    { label: "Submit answer", keys: "Enter" },
    { label: "Skip question", keys: "→" },
    { label: "Previous question", keys: "←" },
  ]},
  { page: "Global", keys: [
    { label: "Toggle dark/light theme", keys: "T" },
    { label: "Open help", keys: "?" },
  ]},
];

const TOPICS = [
  { label: "Sections", desc: "10 total — English, Reasoning, Quant (non-PK, volume practice) + DBMS, CN, OS, SE, DS, COA, OOPs (PK, topic-wise practice)" },
  { label: "Marks", desc: "PK: +2 correct / -0.25 wrong. Non-PK: +1 correct / -0.25 wrong" },
  { label: "Practice Modes", desc: "New (untried), All (random), Wrong (latest was wrong), Weak (<50% accuracy, ≥3 attempts), Bookmarked, Mistakes (any wrong attempt)" },
  { label: "Mock Phases", desc: "Prelims: 4 sections, 100 Q, 80 min. Mains: 4 sections + Descriptive, 150 Q, 125 min" },
  { label: "Syllabus Tracking", desc: "Click any section row on the Dashboard to expand topic-wise coverage. Cycle through: Not Started → Studied → Revised" },
  { label: "Timers", desc: "Timed mode enforces sectional limits with auto-submit. Untimed shows elapsed time. Timers persist across page refreshes" },
];

export default function HelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-900 border-2 rounded-lg w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl z-10" role="dialog" aria-label="Help and keyboard shortcuts">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Command className="w-5 h-5" />
            Help & Shortcuts
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" aria-label="Close help">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Keyboard shortcuts */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h3>
            {SHORTCUTS.map((group) => (
              <div key={group.page} className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-1.5">{group.page}</div>
                <div className="space-y-1">
                  {group.keys.map((k) => (
                    <div key={k.label} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <span className="text-gray-600 dark:text-gray-400">{k.label}</span>
                      <kbd className="font-mono text-xs bg-gray-100 dark:bg-gray-800 border px-1.5 py-0.5 rounded font-semibold">
                        {k.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick reference */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Square className="w-4 h-4" />
              Quick Reference
            </h3>
            <div className="space-y-2">
              {TOPICS.map((t) => (
                <div key={t.label} className="text-sm">
                  <span className="font-medium">{t.label}:</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="border-t-2 pt-4 text-xs text-gray-400 text-center">
            BYOP Studio — IBPS SO (IT Officer) v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
