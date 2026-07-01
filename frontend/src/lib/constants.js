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
  pds: { label: "Programming & Data Structures", type: "pk", has_topics: true },
  se: { label: "Software Engineering", type: "pk", has_topics: true },
  infosec: { label: "Information Security", type: "pk", has_topics: true },
  webtech: { label: "Web Technologies", type: "pk", has_topics: true },
  coa: { label: "Computer Organization & Architecture", type: "pk", has_topics: true },
  cloud: { label: "Cloud & Emerging Technologies", type: "pk", has_topics: true },
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
    "dbms_fundamentals", "er_relational_model", "sql", "normalization",
    "transactions_acid", "concurrency_control", "indexing", "nosql",
  ],
  cn: [
    "network_fundamentals", "osi_tcp_ip", "ip_addressing_subnetting",
    "routing_switching", "internet_protocols", "network_devices",
    "network_security_basics",
  ],
  os: [
    "process_management", "cpu_scheduling", "threads_synchronization",
    "deadlocks", "memory_management", "virtual_memory",
    "file_systems", "io_management",
  ],
  pds: [
    "c_programming", "oop", "arrays_strings", "linked_lists",
    "stacks_queues", "trees", "graphs", "hashing",
    "searching_sorting", "algorithm_complexity",
  ],
  se: [
    "sdlc", "agile_waterfall", "requirements", "software_design",
    "testing", "project_management", "software_quality",
  ],
  infosec: [
    "cryptography", "authentication_authorization", "pki_ssl_tls",
    "firewalls", "ids_ips", "banking_security",
  ],
  webtech: [
    "html", "css", "javascript", "client_server_architecture",
    "http", "rest_apis", "json_xml", "web_security",
  ],
  coa: [
    "number_systems", "boolean_algebra", "cpu_organization",
    "memory_hierarchy", "cache", "pipelining", "io_organization",
  ],
  cloud: [
    "cloud_computing", "virtualization", "containers",
    "cloud_providers_basics", "artificial_intelligence",
    "machine_learning", "blockchain", "iot", "banking_technology",
  ],
};

export const DIFFICULTIES = ["any", "easy", "medium", "hard"];
export const QUESTION_COUNTS = [10, 25, 50];
