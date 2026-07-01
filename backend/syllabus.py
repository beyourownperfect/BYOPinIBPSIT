"""IBPS SO (IT Officer) syllabus data — sections, topics, and phase configuration."""

SECTIONS = {
    "english": {"label": "English Language", "type": "non_pk", "has_topics": False},
    "reasoning": {"label": "Reasoning", "type": "non_pk", "has_topics": False},
    "quant": {"label": "Quantitative Aptitude", "type": "non_pk", "has_topics": False},
    "dbms": {"label": "Database Management Systems", "type": "pk", "has_topics": True},
    "cn": {"label": "Computer Networks", "type": "pk", "has_topics": True},
    "os": {"label": "Operating Systems", "type": "pk", "has_topics": True},
    "pds": {"label": "Programming & Data Structures", "type": "pk", "has_topics": True},
    "se": {"label": "Software Engineering", "type": "pk", "has_topics": True},
    "infosec": {"label": "Information Security", "type": "pk", "has_topics": True},
    "webtech": {"label": "Web Technologies", "type": "pk", "has_topics": True},
    "coa": {"label": "Computer Organization & Architecture", "type": "pk", "has_topics": True},
    "cloud": {"label": "Cloud & Emerging Technologies", "type": "pk", "has_topics": True},
}

PK_SUBJECTS = [k for k, v in SECTIONS.items() if v["type"] == "pk"]

PK_TOPICS = {
    "dbms": [
        "dbms_fundamentals", "er_relational_model", "sql", "normalization",
        "transactions_acid", "concurrency_control", "indexing", "nosql",
    ],
    "cn": [
        "network_fundamentals", "osi_tcp_ip", "ip_addressing_subnetting",
        "routing_switching", "internet_protocols", "network_devices",
        "network_security_basics",
    ],
    "os": [
        "process_management", "cpu_scheduling", "threads_synchronization",
        "deadlocks", "memory_management", "virtual_memory",
        "file_systems", "io_management",
    ],
    "pds": [
        "c_programming", "oop", "arrays_strings", "linked_lists",
        "stacks_queues", "trees", "graphs", "hashing",
        "searching_sorting", "algorithm_complexity",
    ],
    "se": [
        "sdlc", "agile_waterfall", "requirements", "software_design",
        "testing", "project_management", "software_quality",
    ],
    "infosec": [
        "cryptography", "authentication_authorization", "pki_ssl_tls",
        "firewalls", "ids_ips", "banking_security",
    ],
    "webtech": [
        "html", "css", "javascript", "client_server_architecture",
        "http", "rest_apis", "json_xml", "web_security",
    ],
    "coa": [
        "number_systems", "boolean_algebra", "cpu_organization",
        "memory_hierarchy", "cache", "pipelining", "io_organization",
    ],
    "cloud": [
        "cloud_computing", "virtualization", "containers",
        "cloud_providers_basics", "artificial_intelligence",
        "machine_learning", "blockchain", "iot", "banking_technology",
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

# Default PK distribution for Mains (50 PK questions across 9 subjects)
MAINS_PK_DISTRIBUTION = {
    "dbms": 8, "cn": 8, "os": 7, "pds": 7, "se": 5,
    "infosec": 5, "webtech": 5, "coa": 3, "cloud": 2,
}

MARKS_CONFIG = {
    "pk": 2,
    "non_pk": 1,
    "negative": 0.25,
}
