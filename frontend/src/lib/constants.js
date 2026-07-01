/**
 * IBPS SO syllabus constants — frontend copy.
 */

export const SECTIONS = {
  english: { label: "English Language", type: "non_pk", has_topics: false },
  reasoning: { label: "Reasoning", type: "non_pk", has_topics: false },
  quant: { label: "Quantitative Aptitude", type: "non_pk", has_topics: false },
  dbms: { label: "Database Management Systems", type: "pk", has_topics: true },
  cn: { label: "Computer Networks", type: "pk", has_topics: true },
  os: { label: "Operating Systems", type: "pk", has_topics: true },
  se: { label: "Software Engineering", type: "pk", has_topics: true },
  ds: { label: "Data Structures", type: "pk", has_topics: true },
  coa: { label: "Computer Organization & Architecture", type: "pk", has_topics: true },
  oops: { label: "Object-Oriented Programming", type: "pk", has_topics: true },
};

export const PK_SUBJECTS = Object.entries(SECTIONS)
  .filter(([, v]) => v.type === "pk")
  .map(([k]) => k);

export const PRACTICE_MODES = [
  { key: "new", label: "New", description: "Unattempted questions" },
  { key: "all", label: "All", description: "All questions in section" },
  { key: "wrong", label: "Wrong", description: "Latest attempt was wrong" },
  { key: "weak", label: "Weak", description: "<50% accuracy, ≥3 attempts" },
  { key: "bookmarked", label: "Bookmarked", description: "Saved questions" },
  { key: "mistakes", label: "Mistakes", description: "Any wrong attempt" },
];

export const PK_TOPICS = {
  dbms: [
    "er_diagram", "relational_model", "sql", "normalization",
    "transactions", "concurrency_control", "indexing", "file_organization",
  ],
  cn: [
    "osi_model", "tcp_ip", "routing", "ip_addressing",
    "data_link_layer", "network_security", "application_layer",
  ],
  os: [
    "process_management", "cpu_scheduling", "memory_management",
    "file_systems", "deadlocks", "synchronization",
  ],
  se: [
    "sdlc", "agile", "requirements", "design",
    "testing", "maintenance", "project_management",
  ],
  ds: [
    "arrays", "linked_lists", "stacks_queues", "trees",
    "graphs", "sorting", "searching", "hashing",
  ],
  coa: [
    "number_systems", "boolean_algebra", "cpu_organization",
    "memory_organization", "io_organization", "pipelines",
  ],
  oops: [
    "classes_objects", "inheritance", "polymorphism",
    "encapsulation", "abstraction", "uml",
  ],
};

export const DIFFICULTIES = ["any", "easy", "medium", "hard"];
export const QUESTION_COUNTS = [10, 25, 50];
