"""IBPS SO (IT Officer) syllabus data — sections, topics, and phase configuration."""

SECTIONS = {
    "english": {"label": "English Language", "type": "non_pk", "has_topics": False},
    "reasoning": {"label": "Reasoning", "type": "non_pk", "has_topics": False},
    "quant": {"label": "Quantitative Aptitude", "type": "non_pk", "has_topics": False},
    "dbms": {"label": "Database Management Systems", "type": "pk", "has_topics": True},
    "cn": {"label": "Computer Networks", "type": "pk", "has_topics": True},
    "os": {"label": "Operating Systems", "type": "pk", "has_topics": True},
    "se": {"label": "Software Engineering", "type": "pk", "has_topics": True},
    "ds": {"label": "Data Structures", "type": "pk", "has_topics": True},
    "coa": {"label": "Computer Organization & Architecture", "type": "pk", "has_topics": True},
    "oops": {"label": "Object-Oriented Programming", "type": "pk", "has_topics": True},
}

PK_SUBJECTS = [k for k, v in SECTIONS.items() if v["type"] == "pk"]

PK_TOPICS = {
    "dbms": [
        "er_diagram", "relational_model", "sql", "normalization",
        "transactions", "concurrency_control", "indexing", "file_organization",
    ],
    "cn": [
        "osi_model", "tcp_ip", "routing", "ip_addressing",
        "data_link_layer", "network_security", "application_layer",
    ],
    "os": [
        "process_management", "cpu_scheduling", "memory_management",
        "file_systems", "deadlocks", "synchronization",
    ],
    "se": [
        "sdlc", "agile", "requirements", "design",
        "testing", "maintenance", "project_management",
    ],
    "ds": [
        "arrays", "linked_lists", "stacks_queues", "trees",
        "graphs", "sorting", "searching", "hashing",
    ],
    "coa": [
        "number_systems", "boolean_algebra", "cpu_organization",
        "memory_organization", "io_organization", "pipelines",
    ],
    "oops": [
        "classes_objects", "inheritance", "polymorphism",
        "encapsulation", "abstraction", "uml",
    ],
}

PHASES = {
    "prelims": {
        "label": "Preliminary Examination",
        "sections": ["english", "reasoning", "quant", "dbms"],
        "section_configs": {
            "english": {"total_questions": 25, "marks_per_question": 1, "time_limit_minutes": 20, "negative_marking": 0.25},
            "reasoning": {"total_questions": 25, "marks_per_question": 1, "time_limit_minutes": 20, "negative_marking": 0.25},
            "quant": {"total_questions": 25, "marks_per_question": 1, "time_limit_minutes": 20, "negative_marking": 0.25},
            "dbms": {"total_questions": 25, "marks_per_question": 2, "time_limit_minutes": 20, "negative_marking": 0.25},
        },
        "total_questions": 100,
        "total_marks": 125,
        "total_time_minutes": 80,
    },
    "mains": {
        "label": "Main Examination",
        "sections": ["english", "reasoning", "quant", "dbms"],
        "section_configs": {
            "english": {"total_questions": 30, "marks_per_question": 1, "time_limit_minutes": 25, "negative_marking": 0.25},
            "reasoning": {"total_questions": 40, "marks_per_question": 1, "time_limit_minutes": 35, "negative_marking": 0.25},
            "quant": {"total_questions": 30, "marks_per_question": 1, "time_limit_minutes": 25, "negative_marking": 0.25},
            "dbms": {"total_questions": 50, "marks_per_question": 2, "time_limit_minutes": 40, "negative_marking": 0.25},
        },
        "total_questions": 150,
        "total_marks": 200,
        "total_time_minutes": 125,
        "has_descriptive": True,
        "descriptive_marks": 25,
        "descriptive_time_minutes": 30,
    },
}

# Default PK distribution for Mains (50 PK questions across 7 subjects)
MAINS_PK_DISTRIBUTION = {
    "dbms": 10, "cn": 8, "os": 8, "se": 6, "ds": 7, "coa": 6, "oops": 5,
}

MARKS_CONFIG = {
    "pk": 2,
    "non_pk": 1,
    "negative": 0.25,
}
