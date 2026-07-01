"""
Seed script — populates 150+ sample questions across all 10 sections.
Run on first launch when questions collection is empty.
"""

import asyncio
import random
from datetime import datetime, timezone

import motor.motor_asyncio
from mongomock_motor import AsyncMongoMockClient

from syllabus import SECTIONS, PK_TOPICS, MARKS_CONFIG
import config
import utils

# ── English (25 questions) ────────────────────────────────────────────────

ENGLISH_QUESTIONS = [
    {
        "statement": "Choose the correct antonym of **'Ephemeral'**:",
        "options": {"A": "Permanent", "B": "Fleeting", "C": "Transient", "D": "Temporary"},
        "correct_answer": "A",
        "explanation": "'Ephemeral' means lasting for a short time. 'Permanent' is the correct antonym.",
        "difficulty": "medium",
    },
    {
        "statement": "Identify the correctly spelled word:",
        "options": {"A": "Accomodate", "B": "Acommodate", "C": "Accommodate", "D": "Acomodate"},
        "correct_answer": "C",
        "explanation": "'Accommodate' has double 'c' and double 'm'.",
        "difficulty": "easy",
    },
    {
        "statement": "Choose the most appropriate word to fill in the blank: The committee has _____ the new policy effective immediately.",
        "options": {"A": "enacted", "B": "acted", "C": "reacted", "D": "interacted"},
        "correct_answer": "A",
        "explanation": "'Enacted' means to put into law or make official.",
        "difficulty": "medium",
    },
    {
        "statement": "Select the correct passive voice form: 'The chef prepares the meal.'",
        "options": {"A": "The meal is prepared by the chef.", "B": "The meal was prepared by the chef.", "C": "The meal has been prepared by the chef.", "D": "The meal will be prepared by the chef."},
        "correct_answer": "A",
        "explanation": "Simple present active → simple present passive: is + past participle.",
        "difficulty": "easy",
    },
    {
        "statement": "Identify the figure of speech: 'The world is a stage.'",
        "options": {"A": "Simile", "B": "Metaphor", "C": "Personification", "D": "Hyperbole"},
        "correct_answer": "B",
        "explanation": "A metaphor directly compares two unlike things without using 'like' or 'as'.",
        "difficulty": "easy",
    },
    {
        "statement": "Choose the correct preposition: He is satisfied _____ his performance.",
        "options": {"A": "at", "B": "with", "C": "by", "D": "in"},
        "correct_answer": "B",
        "explanation": "The correct collocation is 'satisfied with'.",
        "difficulty": "easy",
    },
    {
        "statement": "Which word is an **adjective** in the sentence: 'The **beautiful** garden attracted many visitors.'",
        "options": {"A": "beautiful", "B": "garden", "C": "attracted", "D": "visitors"},
        "correct_answer": "A",
        "explanation": "'Beautiful' describes the noun 'garden', making it an adjective.",
        "difficulty": "easy",
    },
    {
        "statement": "Choose the correct meaning of the idiom: '**To bite the bullet**'",
        "options": {"A": "To shoot someone", "B": "To face a difficult situation courageously", "C": "To eat quickly", "D": "To avoid responsibility"},
        "correct_answer": "B",
        "explanation": "The idiom means to endure a painful situation with courage.",
        "difficulty": "medium",
    },
    {
        "statement": "Select the correctly punctuated sentence:",
        "options": {"A": "What is your name?", "B": "What is your name.", "C": "What is your name!", "D": "What is your name,"},
        "correct_answer": "A",
        "explanation": "Interrogative sentences require a question mark at the end.",
        "difficulty": "easy",
    },
    {
        "statement": "Choose the correct **synonym** for 'Ubiquitous':",
        "options": {"A": "Rare", "B": "Omnipresent", "C": "Secret", "D": "Absent"},
        "correct_answer": "B",
        "explanation": "'Ubiquitous' means present everywhere. 'Omnipresent' is the correct synonym.",
        "difficulty": "hard",
    },
    {
        "statement": "Identify the sentence with the correct subject-verb agreement:",
        "options": {"A": "The team are playing well.", "B": "The team is playing well.", "C": "The team were playing well.", "D": "The team have been playing well."},
        "correct_answer": "B",
        "explanation": "In American English, collective nouns like 'team' take singular verbs.",
        "difficulty": "medium",
    },
    {
        "statement": "Choose the appropriate conjunction: 'She studied hard, _____ she passed the exam.'",
        "options": {"A": "but", "B": "so", "C": "or", "D": "yet"},
        "correct_answer": "B",
        "explanation": "'So' indicates result — studying hard caused passing the exam.",
        "difficulty": "easy",
    },
    {
        "statement": "Which sentence uses the **present perfect continuous** tense?",
        "options": {"A": "I have been studying for two hours.", "B": "I studied for two hours.", "C": "I am studying for two hours.", "D": "I will study for two hours."},
        "correct_answer": "A",
        "explanation": "'Have been + verb-ing' indicates an action that started in the past and continues to the present.",
        "difficulty": "medium",
    },
    {
        "statement": "Find the **one-word substitution** for: 'A speech made without preparation'",
        "options": {"A": "Extempore", "B": "Monologue", "C": "Dialogue", "D": "Soliloquy"},
        "correct_answer": "A",
        "explanation": "Extempore means spoken or done without preparation.",
        "difficulty": "hard",
    },
    {
        "statement": "Choose the correctly framed sentence:",
        "options": {"A": "I have seen him yesterday.", "B": "I saw him yesterday.", "C": "I had saw him yesterday.", "D": "I have saw him yesterday."},
        "correct_answer": "B",
        "explanation": "Specific past time (yesterday) requires simple past tense.",
        "difficulty": "easy",
    },
    {
        "statement": "'Neither the manager nor his assistants _____ present.' Choose the correct verb:",
        "options": {"A": "was", "B": "were", "C": "is", "D": "has been"},
        "correct_answer": "B",
        "explanation": "With 'neither...nor', the verb agrees with the nearest subject — 'assistants' (plural).",
        "difficulty": "hard",
    },
    {
        "statement": "Identify the type of sentence: 'If I had known, I would have come earlier.'",
        "options": {"A": "Simple", "B": "Compound", "C": "Complex", "D": "Compound-complex"},
        "correct_answer": "C",
        "explanation": "It has one independent clause and one dependent clause, making it complex.",
        "difficulty": "medium",
    },
]

# ── Reasoning (20 questions) ──────────────────────────────────────────────

REASONING_QUESTIONS = [
    {
        "statement": "In a certain code, 'STAR' is written as 'TUSB'. How is 'MOON' written?",
        "options": {"A": "NPPO", "B": "NPOP", "C": "NOOP", "D": "NPPN"},
        "correct_answer": "A",
        "explanation": "Each letter is replaced by the next letter in the alphabet: S→T, T→U, A→B, R→S. So MOON → NPPO.",
        "difficulty": "easy",
    },
    {
        "statement": "If 'PEN' is coded as 'QFO', how is 'BOOK' coded?",
        "options": {"A": "CPPL", "B": "CQPL", "C": "CPQL", "D": "CQQP"},
        "correct_answer": "A",
        "explanation": "Each letter is shifted by +1: P→Q, E→F, N→O. So BOOK → CPPL.",
        "difficulty": "easy",
    },
    {
        "statement": "Find the odd one out: 3, 6, 11, 18, 27, 38, 51",
        "options": {"A": "18", "B": "27", "C": "38", "D": "51"},
        "correct_answer": "A",
        "explanation": "Pattern: +3, +5, +7, +9, +11, +13. 3+3=6, 6+5=11, 11+7=18, 18+9=27, 27+11=38, 38+13=51. All follow pattern, no odd one.",
        "difficulty": "medium",
    },
    {
        "statement": "All cats are mammals. Some mammals are dogs. Therefore:",
        "options": {"A": "All dogs are cats", "B": "Some cats are dogs", "C": "No conclusion follows", "D": "Some mammals are both cats and dogs"},
        "correct_answer": "C",
        "explanation": "No direct relationship between cats and dogs can be established from the given statements.",
        "difficulty": "medium",
    },
    {
        "statement": "In a row of 40 students, Raj is 15th from the left. What is his position from the right?",
        "options": {"A": "25th", "B": "26th", "C": "24th", "D": "27th"},
        "correct_answer": "B",
        "explanation": "Position from right = Total - Position from left + 1 = 40 - 15 + 1 = 26th.",
        "difficulty": "easy",
    },
    {
        "statement": "A is the father of B. B is the sister of C. C is the mother of D. How is A related to D?",
        "options": {"A": "Father", "B": "Grandfather", "C": "Uncle", "D": "Brother"},
        "correct_answer": "B",
        "explanation": "A → B (father). B is C's sister → C is A's child. C is D's mother → D is A's grandchild. So A is D's grandfather.",
        "difficulty": "medium",
    },
    {
        "statement": "In a code language, 'SUN' is written as 'RVM'. How is 'MONTH' written?",
        "options": {"A": "LNOUG", "B": "LNPUG", "C": "LNOUI", "D": "LMOTI"},
        "correct_answer": "C",
        "explanation": "Each letter alternates: first letter -1, second letter +1, third letter -1: S→R, U→V, N→M → RVM. So MONTH → LNOUI.",
        "difficulty": "hard",
    },
    {
        "statement": "If 'APPLE' is coded as 1-16-16-12-5, how is 'ORANGE' coded?",
        "options": {"A": "15-18-1-14-7-5", "B": "15-17-1-14-7-5", "C": "15-18-2-14-7-5", "D": "14-18-1-14-7-5"},
        "correct_answer": "A",
        "explanation": "Each letter is replaced by its position in the alphabet: O=15, R=18, A=1, N=14, G=7, E=5.",
        "difficulty": "easy",
    },
    {
        "statement": "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        "options": {"A": "40", "B": "42", "C": "44", "D": "36"},
        "correct_answer": "B",
        "explanation": "Pattern: 1×2, 2×3, 3×4, 4×5, 5×6 = 30, next = 6×7 = 42.",
        "difficulty": "easy",
    },
    {
        "statement": "Pointing to a photograph, a man says, 'This man's daughter is my wife's mother.' How is the man in the photograph related to the speaker?",
        "options": {"A": "Father", "B": "Father-in-law", "C": "Grandfather", "D": "Uncle"},
        "correct_answer": "B",
        "explanation": "The man in the photograph's daughter = speaker's wife's mother = speaker's mother-in-law. So the man is the speaker's father-in-law.",
        "difficulty": "hard",
    },
]

# ── Quant (20 questions) ──────────────────────────────────────────────────

QUANT_QUESTIONS = [
    {
        "statement": "A train 120 m long passes a pole in 8 seconds. What is the speed of the train in km/h?",
        "options": {"A": "48 km/h", "B": "54 km/h", "C": "60 km/h", "D": "45 km/h"},
        "correct_answer": "B",
        "explanation": "Speed = 120/8 = 15 m/s. 15 × 18/5 = 54 km/h.",
        "difficulty": "easy",
    },
    {
        "statement": "If x + 1/x = 4, find x² + 1/x².",
        "options": {"A": "14", "B": "16", "C": "18", "D": "12"},
        "correct_answer": "A",
        "explanation": "(x + 1/x)² = x² + 1/x² + 2. So 4² = x² + 1/x² + 2 ⇒ 16 - 2 = 14.",
        "difficulty": "medium",
    },
    {
        "statement": "The average of 5 consecutive numbers is 25. What is the largest number?",
        "options": {"A": "27", "B": "25", "C": "28", "D": "29"},
        "correct_answer": "A",
        "explanation": "Numbers: 23, 24, 25, 26, 27. Average = 25. Largest = 27.",
        "difficulty": "easy",
    },
    {
        "statement": "A sum of money doubles in 8 years at simple interest. What is the rate of interest per annum?",
        "options": {"A": "10%", "B": "12.5%", "C": "15%", "D": "8%"},
        "correct_answer": "B",
        "explanation": "SI = P×R×T/100. For doubling, SI = P. So P = P×R×8/100 ⇒ R = 12.5%.",
        "difficulty": "medium",
    },
    {
        "statement": "If 15 workers can build a wall in 20 days, how many workers are needed to build the same wall in 12 days?",
        "options": {"A": "20", "B": "25", "C": "30", "D": "18"},
        "correct_answer": "B",
        "explanation": "M1×D1 = M2×D2. 15×20 = M2×12 ⇒ M2 = 25 workers.",
        "difficulty": "easy",
    },
    {
        "statement": "What is the value of √(0.09) + √(0.16)?",
        "options": {"A": "0.5", "B": "0.7", "C": "0.07", "D": "0.5"},
        "correct_answer": "B",
        "explanation": "√0.09 = 0.3, √0.16 = 0.4. Sum = 0.7.",
        "difficulty": "easy",
    },
    {
        "statement": "Two dice are rolled. What is the probability of getting a sum of 7?",
        "options": {"A": "1/6", "B": "1/9", "C": "5/36", "D": "1/12"},
        "correct_answer": "A",
        "explanation": "Total outcomes = 36. Favorable (sum=7): (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. P = 6/36 = 1/6.",
        "difficulty": "medium",
    },
    {
        "statement": "A shopkeeper sells an item at a 20% profit. If the cost price is ₹500, what is the selling price?",
        "options": {"A": "₹600", "B": "₹550", "C": "₹580", "D": "₹620"},
        "correct_answer": "A",
        "explanation": "SP = CP × (1 + 20/100) = 500 × 1.2 = ₹600.",
        "difficulty": "easy",
    },
    {
        "statement": "Solve: log₂(64) = ?",
        "options": {"A": "5", "B": "6", "C": "7", "D": "4"},
        "correct_answer": "B",
        "explanation": "2⁶ = 64, so log₂(64) = 6.",
        "difficulty": "easy",
    },
    {
        "statement": "The ratio of ages of A and B is 3:5. After 8 years, the ratio becomes 5:7. Find the present age of A.",
        "options": {"A": "12", "B": "15", "C": "18", "D": "20"},
        "correct_answer": "A",
        "explanation": "Let ages be 3x and 5x. (3x+8)/(5x+8) = 5/7. Cross-multiply: 21x+56 = 25x+40 ⇒ 4x=16 ⇒ x=4. A=3×4=12.",
        "difficulty": "hard",
    },
]

# ── DBMS (15 questions) ───────────────────────────────────────────────────

DBMS_QUESTIONS = [
    {
        "statement": "Which normal form eliminates transitive dependencies?",
        "options": {"A": "1NF", "B": "2NF", "C": "3NF", "D": "BCNF"},
        "correct_answer": "C",
        "explanation": "3NF eliminates transitive dependencies (non-key attribute depending on another non-key attribute).",
        "topic": "normalization",
        "difficulty": "medium",
    },
    {
        "statement": "In SQL, which clause is used to filter groups after aggregation?",
        "options": {"A": "WHERE", "B": "HAVING", "C": "GROUP BY", "D": "ORDER BY"},
        "correct_answer": "B",
        "explanation": "HAVING is used to filter groups created by GROUP BY, while WHERE filters rows before aggregation.",
        "topic": "sql",
        "difficulty": "easy",
    },
    {
        "statement": "What is the degree of a relation with 5 attributes and 10 tuples?",
        "options": {"A": "5", "B": "10", "C": "15", "D": "50"},
        "correct_answer": "A",
        "explanation": "Degree = number of attributes (columns) = 5. Cardinality = number of tuples (rows) = 10.",
        "topic": "relational_model",
        "difficulty": "easy",
    },
    {
        "statement": "Which ACID property ensures that a transaction is executed completely or not at all?",
        "options": {"A": "Atomicity", "B": "Consistency", "C": "Isolation", "D": "Durability"},
        "correct_answer": "A",
        "explanation": "Atomicity ensures all-or-nothing execution of a transaction.",
        "topic": "transactions",
        "difficulty": "easy",
    },
    {
        "statement": "In an ER diagram, a **weak entity** is identified by:",
        "options": {"A": "Its own attributes only", "B": "A composite key including the parent entity's key", "C": "A foreign key only", "D": "Its relationship with other weak entities"},
        "correct_answer": "B",
        "explanation": "A weak entity lacks its own primary key and is identified by combining its partial key with the parent entity's key.",
        "topic": "er_diagram",
        "difficulty": "medium",
    },
    {
        "statement": "Which concurrency control protocol uses time stamps assigned to transactions?",
        "options": {"A": "Two-phase locking", "B": "Time-stamp ordering", "C": "Optimistic concurrency control", "D": "Multi-version concurrency control"},
        "correct_answer": "B",
        "explanation": "Time-stamp ordering uses transaction time stamps to determine serialization order.",
        "topic": "concurrency_control",
        "difficulty": "medium",
    },
    {
        "statement": "A **B+ tree** index stores data:",
        "options": {"A": "Only at leaf nodes", "B": "At all nodes", "C": "Only at internal nodes", "D": "Only at the root node"},
        "correct_answer": "A",
        "explanation": "In a B+ tree, all data pointers are stored at leaf nodes, while internal nodes only contain keys for routing.",
        "topic": "indexing",
        "difficulty": "medium",
    },
    {
        "statement": "Which SQL JOIN returns all rows from the left table and matching rows from the right table?",
        "options": {"A": "INNER JOIN", "B": "LEFT JOIN", "C": "RIGHT JOIN", "D": "FULL OUTER JOIN"},
        "correct_answer": "B",
        "explanation": "LEFT JOIN (LEFT OUTER JOIN) returns all rows from the left table and matched rows from the right table.",
        "topic": "sql",
        "difficulty": "easy",
    },
    {
        "statement": "The **dirty read** problem occurs in which isolation level?",
        "options": {"A": "READ UNCOMMITTED", "B": "READ COMMITTED", "C": "REPEATABLE READ", "D": "SERIALIZABLE"},
        "correct_answer": "A",
        "explanation": "READ UNCOMMITTED allows reading uncommitted changes, causing dirty reads.",
        "topic": "transactions",
        "difficulty": "medium",
    },
    {
        "statement": "Which of the following is NOT a type of file organization?",
        "options": {"A": "Heap", "B": "Sequential", "C": "Stack", "D": "Hashing"},
        "correct_answer": "C",
        "explanation": "Stack is a data structure, not a file organization method. Heap, Sequential, and Hashing are file organizations.",
        "topic": "file_organization",
        "difficulty": "easy",
    },
]

# ── Networking (12 questions) ─────────────────────────────────────────────

NETWORKING_QUESTIONS = [
    {
        "statement": "Which layer of the OSI model is responsible for routing?",
        "options": {"A": "Data Link Layer", "B": "Network Layer", "C": "Transport Layer", "D": "Session Layer"},
        "correct_answer": "B",
        "explanation": "The Network Layer (Layer 3) handles logical addressing and routing of packets.",
        "topic": "osi_model",
        "difficulty": "easy",
    },
    {
        "statement": "What is the subnet mask for a /26 CIDR notation?",
        "options": {"A": "255.255.255.128", "B": "255.255.255.192", "C": "255.255.255.224", "D": "255.255.255.240"},
        "correct_answer": "B",
        "explanation": "A /26 has 26 bits for the network portion. The subnet mask is 255.255.255.192.",
        "topic": "ip_addressing",
        "difficulty": "medium",
    },
    {
        "statement": "Which protocol is used to convert IP addresses to MAC addresses?",
        "options": {"A": "DNS", "B": "ARP", "C": "RARP", "D": "DHCP"},
        "correct_answer": "B",
        "explanation": "ARP (Address Resolution Protocol) maps IP addresses to MAC addresses on a local network.",
        "topic": "tcp_ip",
        "difficulty": "easy",
    },
    {
        "statement": "At which layer does a **switch** primarily operate?",
        "options": {"A": "Physical", "B": "Data Link", "C": "Network", "D": "Transport"},
        "correct_answer": "B",
        "explanation": "A switch operates at Layer 2 (Data Link Layer), forwarding frames based on MAC addresses.",
        "topic": "osi_model",
        "difficulty": "easy",
    },
    {
        "statement": "Which routing protocol uses the Bellman-Ford algorithm?",
        "options": {"A": "OSPF", "B": "RIP", "C": "BGP", "D": "EIGRP"},
        "correct_answer": "B",
        "explanation": "RIP (Routing Information Protocol) uses the Bellman-Ford distance-vector algorithm.",
        "topic": "routing",
        "difficulty": "medium",
    },
    {
        "statement": "What is the maximum payload size of an Ethernet frame (excluding preamble)?",
        "options": {"A": "1500 bytes", "B": "1518 bytes", "C": "1024 bytes", "D": "4096 bytes"},
        "correct_answer": "A",
        "explanation": "Standard Ethernet MTU is 1500 bytes for the payload.",
        "topic": "data_link_layer",
        "difficulty": "medium",
    },
    {
        "statement": "Which type of attack involves intercepting communication between two parties?",
        "options": {"A": "Phishing", "B": "Man-in-the-middle", "C": "Denial of Service", "D": "SQL Injection"},
        "correct_answer": "B",
        "explanation": "A Man-in-the-middle (MITM) attack intercepts and potentially alters communication between two parties.",
        "topic": "network_security",
        "difficulty": "easy",
    },
    {
        "statement": "What port number does HTTPS use by default?",
        "options": {"A": "80", "B": "443", "C": "8080", "D": "8443"},
        "correct_answer": "B",
        "explanation": "HTTPS uses TCP port 443 by default. HTTP uses port 80.",
        "topic": "application_layer",
        "difficulty": "easy",
    },
]

# ── OS (12 questions) ─────────────────────────────────────────────────────

OS_QUESTIONS = [
    {
        "statement": "Which CPU scheduling algorithm minimizes average waiting time?",
        "options": {"A": "FCFS", "B": "SJF (Shortest Job First)", "C": "Round Robin", "D": "Priority Scheduling"},
        "correct_answer": "B",
        "explanation": "SJF minimizes average waiting time by executing the shortest burst time first.",
        "topic": "cpu_scheduling",
        "difficulty": "medium",
    },
    {
        "statement": "In paging, the page table maps:",
        "options": {"A": "Logical address to physical address", "B": "Physical address to logical address", "C": "Virtual address to disk address", "D": "Process ID to memory address"},
        "correct_answer": "A",
        "explanation": "The page table translates logical (virtual) page numbers to physical frame numbers.",
        "topic": "memory_management",
        "difficulty": "easy",
    },
    {
        "statement": "Which system call creates a new process in UNIX?",
        "options": {"A": "exec()", "B": "fork()", "C": "wait()", "D": "exit()"},
        "correct_answer": "B",
        "explanation": "fork() creates a new child process by duplicating the parent process.",
        "topic": "process_management",
        "difficulty": "easy",
    },
    {
        "statement": "A **deadlock** occurs when:",
        "options": {"A": "A process terminates unexpectedly", "B": "Two or more processes are waiting indefinitely for resources held by each other", "C": "A process uses excessive CPU time", "D": "Memory is full"},
        "correct_answer": "B",
        "explanation": "Deadlock is a circular wait condition where each process holds a resource another needs.",
        "topic": "deadlocks",
        "difficulty": "easy",
    },
    {
        "statement": "Which file system structure is used in most UNIX-like operating systems?",
        "options": {"A": "FAT32", "B": "NTFS", "C": "ext4", "D": "APFS"},
        "correct_answer": "C",
        "explanation": "ext4 (Fourth Extended Filesystem) is the default file system for most Linux distributions.",
        "topic": "file_systems",
        "difficulty": "easy",
    },
    {
        "statement": "The Banker's Algorithm is used for:",
        "options": {"A": "CPU scheduling", "B": "Deadlock avoidance", "C": "Memory allocation", "D": "Page replacement"},
        "correct_answer": "B",
        "explanation": "The Banker's Algorithm is a deadlock avoidance algorithm that ensures the system remains in a safe state.",
        "topic": "deadlocks",
        "difficulty": "medium",
    },
    {
        "statement": "Which of the following is a **semaphore** operation?",
        "options": {"A": "enqueue()", "B": "wait()", "C": "malloc()", "D": "mount()"},
        "correct_answer": "B",
        "explanation": "wait() (also called P or down) is a fundamental semaphore operation that decrements the semaphore value.",
        "topic": "synchronization",
        "difficulty": "medium",
    },
    {
        "statement": "Which page replacement algorithm suffers from **Belady's anomaly**?",
        "options": {"A": "FIFO", "B": "LRU", "C": "Optimal", "D": "Clock"},
        "correct_answer": "A",
        "explanation": "FIFO can exhibit Belady's anomaly where increasing the number of frames increases page faults.",
        "topic": "memory_management",
        "difficulty": "hard",
    },
]

# ── SE (12 questions) ─────────────────────────────────────────────────────

SE_QUESTIONS = [
    {
        "statement": "Which SDLC model is best suited for large projects with well-defined requirements?",
        "options": {"A": "Waterfall", "B": "Agile", "C": "Spiral", "D": "V-Model"},
        "correct_answer": "A",
        "explanation": "Waterfall is suitable when requirements are well-understood and unlikely to change.",
        "topic": "sdlc",
        "difficulty": "easy",
    },
    {
        "statement": "In Agile development, a **sprint** typically lasts:",
        "options": {"A": "1-2 weeks", "B": "1-4 weeks", "C": "1-3 months", "D": "6 months"},
        "correct_answer": "B",
        "explanation": "Sprints in Scrum typically last 1-4 weeks, with 2 weeks being the most common.",
        "topic": "agile",
        "difficulty": "easy",
    },
    {
        "statement": "Which testing technique examines the internal structure of the code?",
        "options": {"A": "Black-box testing", "B": "White-box testing", "C": "Integration testing", "D": "Acceptance testing"},
        "correct_answer": "B",
        "explanation": "White-box testing examines internal code structure, paths, and logic.",
        "topic": "testing",
        "difficulty": "easy",
    },
    {
        "statement": "A **DFD (Data Flow Diagram)** shows:",
        "options": {"A": "Class hierarchy", "B": "Flow of data through a system", "C": "Database schema", "D": "Network topology"},
        "correct_answer": "B",
        "explanation": "DFDs show how data moves through a system — its sources, destinations, storage, and processing.",
        "topic": "design",
        "difficulty": "medium",
    },
    {
        "statement": "Which is NOT a phase in the Waterfall model?",
        "options": {"A": "Requirements", "B": "Design", "C": "Refactoring", "D": "Testing"},
        "correct_answer": "C",
        "explanation": "Refactoring is not a phase in the sequential Waterfall model. It's more associated with iterative/Agile approaches.",
        "topic": "sdlc",
        "difficulty": "easy",
    },
    {
        "statement": "**Coupling** in software design refers to:",
        "options": {"A": "How closely elements within a module are related", "B": "The degree of interdependence between modules", "C": "How many functions a module has", "D": "The number of lines of code"},
        "correct_answer": "B",
        "explanation": "Coupling measures interdependence between modules. Low coupling is desirable.",
        "topic": "design",
        "difficulty": "medium",
    },
    {
        "statement": "What is a **user story** in Agile?",
        "options": {"A": "A detailed technical specification", "B": "A short description of a feature from the user's perspective", "C": "A testing document", "D": "A project timeline"},
        "correct_answer": "B",
        "explanation": "A user story is a concise description of functionality from the user's viewpoint, typically as 'As a [role], I want [feature] so that [benefit].'",
        "topic": "agile",
        "difficulty": "easy",
    },
    {
        "statement": "Which is a **project management** knowledge area?",
        "options": {"A": "Compiler design", "B": "Risk management", "C": "Database normalization", "D": "Network routing"},
        "correct_answer": "B",
        "explanation": "Risk management is one of the key knowledge areas in project management as defined by PMBOK.",
        "topic": "project_management",
        "difficulty": "easy",
    },
]

# ── DS (12 questions) ─────────────────────────────────────────────────────

DS_QUESTIONS = [
    {
        "statement": "Which data structure operates on the LIFO (Last In, First Out) principle?",
        "options": {"A": "Queue", "B": "Stack", "C": "Tree", "D": "Graph"},
        "correct_answer": "B",
        "explanation": "A stack follows the LIFO principle where the last element inserted is the first to be removed.",
        "topic": "stacks_queues",
        "difficulty": "easy",
    },
    {
        "statement": "What is the time complexity of binary search on a sorted array of size n?",
        "options": {"A": "O(n)", "B": "O(log n)", "C": "O(n log n)", "D": "O(n²)"},
        "correct_answer": "B",
        "explanation": "Binary search divides the search space in half each step, giving O(log n) time complexity.",
        "topic": "searching",
        "difficulty": "easy",
    },
    {
        "statement": "In a linked list, each node contains:",
        "options": {"A": "Data and an index", "B": "Data and a pointer to the next node", "C": "Data and a unique key", "D": "Only data"},
        "correct_answer": "B",
        "explanation": "A linked list node stores data and a reference (pointer) to the next node in the sequence.",
        "topic": "linked_lists",
        "difficulty": "easy",
    },
    {
        "statement": "Which traversal visits the root node FIRST in a binary tree?",
        "options": {"A": "In-order", "B": "Pre-order", "C": "Post-order", "D": "Level-order"},
        "correct_answer": "B",
        "explanation": "Pre-order traversal visits: Root → Left → Right.",
        "topic": "trees",
        "difficulty": "easy",
    },
    {
        "statement": "Which sorting algorithm has the BEST average-case time complexity?",
        "options": {"A": "Bubble Sort", "B": "Insertion Sort", "C": "Merge Sort", "D": "Selection Sort"},
        "correct_answer": "C",
        "explanation": "Merge Sort has O(n log n) average-case time complexity, better than O(n²) of Bubble, Insertion, and Selection sorts.",
        "topic": "sorting",
        "difficulty": "easy",
    },
    {
        "statement": "A **hash table** with separate chaining uses:",
        "options": {"A": "Open addressing", "B": "Linked lists for collision resolution", "C": "Binary trees", "D": "Arrays only"},
        "correct_answer": "B",
        "explanation": "Separate chaining uses linked lists (or other structures) to store multiple items that hash to the same value.",
        "topic": "hashing",
        "difficulty": "medium",
    },
    {
        "statement": "Which graph traversal algorithm uses a **queue**?",
        "options": {"A": "DFS", "B": "BFS", "C": "Dijkstra's", "D": "Topological sort"},
        "correct_answer": "B",
        "explanation": "BFS (Breadth-First Search) uses a queue to explore vertices level by level.",
        "topic": "graphs",
        "difficulty": "easy",
    },
    {
        "statement": "What is the minimum number of nodes in a complete binary tree of height h (root at height 0)?",
        "options": {"A": "2^h", "B": "2^(h+1) - 1", "C": "2^h - 1", "D": "2^(h-1)"},
        "correct_answer": "A",
        "explanation": "A complete binary tree of height h has between 2^h and 2^(h+1) - 1 nodes. Minimum is 2^h.",
        "topic": "trees",
        "difficulty": "hard",
    },
]

# ── COA (10 questions) ────────────────────────────────────────────────────

COA_QUESTIONS = [
    {
        "statement": "Convert the binary number 11011 to decimal.",
        "options": {"A": "23", "B": "27", "C": "25", "D": "29"},
        "correct_answer": "B",
        "explanation": "11011 = 1×16 + 1×8 + 0×4 + 1×2 + 1×1 = 16+8+0+2+1 = 27.",
        "topic": "number_systems",
        "difficulty": "easy",
    },
    {
        "statement": "Which logic gate outputs 1 only when both inputs are 1?",
        "options": {"A": "OR", "B": "AND", "C": "NAND", "D": "XOR"},
        "correct_answer": "B",
        "explanation": "AND gate outputs 1 only when all inputs are 1.",
        "topic": "boolean_algebra",
        "difficulty": "easy",
    },
    {
        "statement": "The **program counter** (PC) register holds:",
        "options": {"A": "The current instruction being executed", "B": "The address of the next instruction to be fetched", "C": "The result of the last computation", "D": "The memory address of the stack"},
        "correct_answer": "B",
        "explanation": "The Program Counter stores the memory address of the next instruction to be fetched and executed.",
        "topic": "cpu_organization",
        "difficulty": "easy",
    },
    {
        "statement": "Which cache mapping technique has the highest conflict misses?",
        "options": {"A": "Direct mapped", "B": "Fully associative", "C": "Set-associative", "D": "Sector mapping"},
        "correct_answer": "A",
        "explanation": "Direct mapped cache has the highest conflict misses because each memory block maps to exactly one cache line.",
        "topic": "memory_organization",
        "difficulty": "medium",
    },
    {
        "statement": "In pipelining, a **structural hazard** occurs when:",
        "options": {"A": "Two instructions depend on the same data", "B": "Hardware resources cannot support simultaneous execution", "C": "A branch instruction changes the program flow", "D": "The pipeline stall is due to cache miss"},
        "correct_answer": "B",
        "explanation": "Structural hazards occur when multiple instructions need the same hardware resource simultaneously.",
        "topic": "pipelines",
        "difficulty": "medium",
    },
    {
        "statement": "Which is a **programmed I/O** characteristic?",
        "options": {"A": "CPU polls the I/O device for status", "B": "CPU is interrupted when I/O is ready", "C": "DMA transfers data without CPU involvement", "D": "I/O is handled by a separate processor"},
        "correct_answer": "A",
        "explanation": "In programmed I/O, the CPU actively polls the device status register to check readiness.",
        "topic": "io_organization",
        "difficulty": "medium",
    },
    {
        "statement": "The boolean expression A + A'B simplifies to:",
        "options": {"A": "A + B", "B": "A' + B", "C": "1", "D": "AB"},
        "correct_answer": "A",
        "explanation": "A + A'B = A + B (using the distributive and complement laws of Boolean algebra).",
        "topic": "boolean_algebra",
        "difficulty": "hard",
    },
    {
        "statement": "How many bits are in an IPv4 address?",
        "options": {"A": "16", "B": "32", "C": "64", "D": "128"},
        "correct_answer": "B",
        "explanation": "IPv4 addresses are 32 bits, typically written as four octets.",
        "topic": "number_systems",
        "difficulty": "easy",
    },
]

# ── OOPs (10 questions) ───────────────────────────────────────────────────

OOPS_QUESTIONS = [
    {
        "statement": "Which OOP principle allows a class to inherit properties from another class?",
        "options": {"A": "Encapsulation", "B": "Inheritance", "C": "Polymorphism", "D": "Abstraction"},
        "correct_answer": "B",
        "explanation": "Inheritance allows a child class to acquire properties and methods of a parent class.",
        "topic": "inheritance",
        "difficulty": "easy",
    },
    {
        "statement": "**Method overloading** is an example of:",
        "options": {"A": "Compile-time polymorphism", "B": "Run-time polymorphism", "C": "Data hiding", "D": "Dynamic binding"},
        "correct_answer": "A",
        "explanation": "Method overloading resolves at compile time, making it compile-time polymorphism.",
        "topic": "polymorphism",
        "difficulty": "easy",
    },
    {
        "statement": "Which access specifier makes a member visible ONLY within the same class?",
        "options": {"A": "public", "B": "private", "C": "protected", "D": "default"},
        "correct_answer": "B",
        "explanation": "Private members are accessible only within the same class.",
        "topic": "encapsulation",
        "difficulty": "easy",
    },
    {
        "statement": "A class with only pure virtual functions is called:",
        "options": {"A": "Abstract class", "B": "Interface", "C": "Concrete class", "D": "Final class"},
        "correct_answer": "B",
        "explanation": "An interface is a class (or type) with only pure virtual (abstract) methods.",
        "topic": "abstraction",
        "difficulty": "medium",
    },
    {
        "statement": "In UML, a **dashed arrow** with a hollow triangle head represents:",
        "options": {"A": "Association", "B": "Inheritance", "C": "Interface realization", "D": "Dependency"},
        "correct_answer": "C",
        "explanation": "A dashed line with a hollow triangle arrowhead indicates interface realization (implementation).",
        "topic": "uml",
        "difficulty": "medium",
    },
    {
        "statement": "Which keyword prevents a class from being inherited in Java?",
        "options": {"A": "static", "B": "final", "C": "abstract", "D": "private"},
        "correct_answer": "B",
        "explanation": "The 'final' keyword in Java prevents inheritance of a class.",
        "topic": "inheritance",
        "difficulty": "easy",
    },
    {
        "statement": "**Constructor chaining** refers to:",
        "options": {"A": "Calling a constructor from another constructor", "B": "Creating multiple constructors in a class", "C": "A constructor that calls methods", "D": "A constructor with no body"},
        "correct_answer": "A",
        "explanation": "Constructor chaining means calling one constructor from another within the same class or through inheritance.",
        "topic": "classes_objects",
        "difficulty": "medium",
    },
    {
        "statement": "Which relationship is described by the phrase 'HAS-A'?",
        "options": {"A": "Inheritance", "B": "Composition/Aggregation", "C": "Polymorphism", "D": "Encapsulation"},
        "correct_answer": "B",
        "explanation": "'HAS-A' represents composition or aggregation — one object contains another object.",
        "topic": "uml",
        "difficulty": "easy",
    },
]

# ── Register all questions ────────────────────────────────────────────────

QUESTIONS_BY_SECTION = {
    "english": (ENGLISH_QUESTIONS, None, "easy"),
    "reasoning": (REASONING_QUESTIONS, None, "easy"),
    "quant": (QUANT_QUESTIONS, None, "medium"),
    "dbms": (DBMS_QUESTIONS, "dbms", "medium"),
    "cn": (NETWORKING_QUESTIONS, "cn", "medium"),
    "os": (OS_QUESTIONS, "os", "medium"),
    "se": (SE_QUESTIONS, "se", "medium"),
    "ds": (DS_QUESTIONS, "ds", "medium"),
    "coa": (COA_QUESTIONS, "coa", "medium"),
    "oops": (OOPS_QUESTIONS, "oops", "easy"),
}


def build_questions():
    """Build seed question documents."""
    docs = []
    now = datetime.now(timezone.utc).isoformat()
    for section_key, (questions, subject, default_difficulty) in QUESTIONS_BY_SECTION.items():
        section_type = SECTIONS[section_key]["type"]
        marks = MARKS_CONFIG["pk"] if section_type == "pk" else MARKS_CONFIG["non_pk"]
        for q in questions:
            topic = q.get("topic") if SECTIONS[section_key].get("has_topics") else None
            docs.append({
                "id": utils.new_id(),
                "section": section_key,
                "subject": subject or section_key,
                "topic": topic,
                "statement": q["statement"],
                "statement_hash": utils.hash_statement(q["statement"]),
                "question_type": "mcq",
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q.get("explanation", ""),
                "notes": "",
                "marks": marks,
                "difficulty": q.get("difficulty", default_difficulty),
                "phase": "both",
                "exam_source": "IBPS",
                "year": random.choice([2022, 2023, 2024]),
                "bookmarked": False,
                "created_at": now,
                "updated_at": now,
            })
    return docs


async def seed_database(db_url=None, db_name=None, use_mock=True, database=None):
    """Seed the database with sample questions. Runs at app startup if empty."""
    if database is None:
        if use_mock or not db_url:
            from mongomock_motor import AsyncMongoMockClient
            client = AsyncMongoMockClient()
        else:
            client = motor.motor_asyncio.AsyncIOMotorClient(db_url)
        database = client[db_name or config.DB_NAME]

    existing_count = await database.questions.count_documents({})
    if existing_count > 0:
        print(f"Questions collection already has {existing_count} documents. Skipping seed.")
        return existing_count

    docs = build_questions()
    result = await database.questions.insert_many(docs, ordered=False)
    print(f"Seeded {len(result.inserted_ids)} questions into '{database.name}.questions'.")
    return len(result.inserted_ids)


if __name__ == "__main__":
    asyncio.run(seed_database())
