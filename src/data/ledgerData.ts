export interface DossierItem {
  id: string;
  section: string;
  code: string;
  title: string;
  subtitle: string;
  stamp: string;
  pinColor: 'pin-red' | 'pin-violet' | 'pin-brass' | 'pin-obsidian';
  summary: string;
  image?: string;
  imageAlt?: string;
  imageBadge?: string;
  metrics: { label: string; value: string }[];
  architectureNotes: string[];
  techStack: string[];
  coordinates?: string;
}

export const DOSSIER_ITEMS: Record<string, DossierItem> = {
  groundtruth: {
    id: 'groundtruth',
    section: 'SECTION 03 // PROJECT 00',
    code: 'GROUNDTRUTH // EVALUATION LAB',
    title: 'GroundTruth',
    subtitle: 'RAG Evaluation Lab for Citation-Backed Technical Documentation Answers',
    stamp: 'MVP // FIXTURE BASELINE',
    pinColor: 'pin-violet',
    summary:
      'A runnable, evaluation-first RAG service for technical documentation. It returns cited answers or explicitly abstains, and records reproducible evaluation artifacts and per-query telemetry.',
    metrics: [
      { label: 'EVALUATION SET', value: '100 SYNTHETIC CASES' },
      { label: 'RECALL@4 / MRR', value: '1.000 / 1.000 FIXTURE' },
      { label: 'P95 LATENCY', value: '0.504 MS LOCAL' },
      { label: 'CORPUS STATUS', value: 'PYTHON 3.12 PENDING' },
    ],
    architectureNotes: [
      'The latest dated synthetic-fixture run records 100 cases, 1.000 abstention accuracy, 0.643 ms p95 local latency, and $0.00 model cost using a deterministic fallback.',
      'The FastAPI service returns cited answers or explicit abstentions and saves query telemetry plus machine-readable evaluation results.',
      'These fixture and proxy metrics are not evidence of semantic retrieval quality. The hand-checked Python 3.12 corpus and human-validated answer metrics remain pending.',
    ],
    techStack: ['Python', 'FastAPI', 'RAG Evaluation', 'pytest', 'GitHub Actions'],
    coordinates: 'EVALUATION LAB // PYTHON 3.12 CORPUS PENDING',
  },
  steadyagent: {
    id: 'steadyagent',
    section: 'SECTION 03 // PROJECT 01',
    code: 'STEADYAGENT // LOCAL TOOL RUNNER',
    title: 'SteadyAgent',
    subtitle: 'Reliable Tool-Using Agent with Guardrails, Tracing, and Failure Analysis',
    stamp: 'LOCAL MVP // TESTED',
    pinColor: 'pin-brass',
    summary:
      'A local FastAPI service that executes explicit tool plans through a small allowlist. It returns structured outputs and per-step traces, and blocks unknown tools instead of executing arbitrary commands.',
    metrics: [
      { label: 'API', value: 'POST /V1/RUN' },
      { label: 'ALLOWLIST', value: '2 READ-ONLY TOOLS' },
      { label: 'RETRIES', value: 'BOUNDED 0–2' },
      { label: 'STATUS', value: '3 TESTS PASS' },
    ],
    architectureNotes: [
      'The current deterministic API accepts explicit plans; it does not claim autonomous planning or use an LLM.',
      'Only arithmetic and read-only note search are registered. Unknown tools are blocked; the calculator parses a restricted arithmetic AST rather than executing code.',
      'Each step records status, attempts, duration, and a failure code. Retries are bounded and limited to tool execution errors.',
    ],
    techStack: ['Python', 'Tool Contracts', 'Tracing', 'Safety Tests'],
    coordinates: 'RELIABILITY RUNNER // LOCAL API :8001',
  },
  tokensense: {
    id: 'tokensense',
    section: 'SECTION 03 // PROJECT 02',
    code: 'TOKENSENSE // MODEL GATEWAY',
    title: 'TokenSense',
    subtitle: 'LLM Cost and Quality Gateway with Routing and Semantic Caching',
    stamp: 'LOCAL DEMO // UPSTREAM CONFIGURABLE',
    pinColor: 'pin-red',
    summary:
      'An OpenAI-compatible chat-completions gateway with a deterministic no-key demo mode, configurable upstream routing, a user-scoped SQLite cache and budget ledger, and an alternate-model fallback.',
    metrics: [
      { label: 'API', value: 'OPENAI CHAT FORMAT' },
      { label: 'BUDGETS', value: 'DAILY / USER' },
      { label: 'UPSTREAM', value: 'BEARER AUTH REQUIRED' },
      { label: 'STATUS', value: '5 TESTS PASS' },
    ],
    architectureNotes: [
      'Routes by approximate input length and configurable model names. A high-similarity, per-user cache avoids sharing cached responses across identities.',
      'Reserves estimated spend before upstream calls, settles from provider usage, and tries one alternate model when a request fails. Prices must be configured to current provider rates.',
      'The offline response is a deterministic demo, not a generated model answer. Similarity caching and approximate token counts require workload-specific validation before production use.',
    ],
    techStack: ['Python', 'FastAPI', 'OpenAI-Compatible API', 'Semantic Cache', 'Load Testing'],
    coordinates: 'MODEL GATEWAY // LOCAL API :8002',
  },
  smallwins: {
    id: 'smallwins',
    section: 'SECTION 03 // PROJECT 03',
    code: 'SMALLWINS // BENCHMARK HARNESS',
    title: 'SmallWins',
    subtitle: 'Fine-Tuned Small Model versus Frontier API Tradeoff Study',
    stamp: 'LOCAL CLI // SAMPLE FIXTURE',
    pinColor: 'pin-obsidian',
    summary:
      'A runnable CLI benchmark that sends the same fixed JSONL cases to each candidate and records exact match, token F1, observed latency, configured cost, failures, and the dataset SHA-256.',
    metrics: [
      { label: 'SAMPLE DATA', value: '3 SMOKE-TEST CASES' },
      { label: 'LOCAL BASELINE', value: 'EXTRACTIVE' },
      { label: 'OUTPUT', value: 'DATED JSON REPORT' },
      { label: 'REMOTE MODELS', value: 'OPTIONAL CONFIG' },
    ],
    architectureNotes: [
      'The included three-case sample validates the harness only; it is not representative evidence of model quality.',
      'Add a hand-checked JSONL dataset with unique IDs, prompts, references, and optional category labels for a real comparison.',
      'Remote candidates use an OpenAI-compatible endpoint. Configure the current per-model token prices; omitted prices default to zero and must not be read as free usage.',
    ],
    techStack: ['Python', 'Model Evaluation', 'Cost Accounting', 'Benchmarking'],
    coordinates: 'BENCHMARK RUNNER // LOCAL CLI',
  },
  'blueprint-00': {
    id: 'blueprint-00',
    section: 'SECTION 03 // PROJECT 00',
    code: 'BLUEPRINT // 00 (EVIDENCE-RAG)',
    title: 'AskDocs',
    subtitle: 'AI Feature 0-to-1: Citation-First Technical Documentation Answers',
    stamp: 'PILOT DESIGN // IN PROGRESS',
    pinColor: 'pin-violet',
    summary:
      'An evaluation-first AI feature concept for engineers who need verifiable answers from technical documentation. The system is designed to return source citations, abstain when evidence is weak, and make quality, cost, latency, and user value measurable before launch.',
    metrics: [
      { label: 'CURRENT STAGE', value: 'PILOT PLANNING' },
      { label: 'PILOT TARGET', value: '30+ REAL USERS' },
      { label: 'USER RESEARCH', value: '5+ INTERVIEWS PLANNED' },
      { label: 'EVIDENCE STATUS', value: 'NO USER DATA YET' },
    ],
    architectureNotes: [
      'Product contract: answer technical-documentation questions with inspectable source citations or abstain when the evidence is insufficient.',
      'Measurement: track grounded-answer pass rate, retrieval quality, citation accuracy, abstention behavior, latency, and cost per query from the first instrumented release.',
      'Pilot method: recruit real technical users, collect consented feedback and usage data, then iterate only when a logged metric or interview finding supports the change.',
    ],
    techStack: ['Python', 'FastAPI', 'RAG Evaluation', 'Analytics Instrumentation', 'Pilot Research'],
    coordinates: 'PRODUCT DISCOVERY // EVIDENCE-FIRST RELEASE',
  },

  'manifesto-01': {
    id: 'manifesto-01',
    section: 'SECTION 01 // ABOUT & MANIFESTO',
    code: 'PIN #01 // PHILOSOPHY NOTE',
    title: 'Pragatheesh // Azure Data & AI Systems Manifesto',
    subtitle: 'Ex-Cognizant · Ex-BYJU’S · Bengaluru, Karnataka, India',
    stamp: 'AZURE DATA & AI VERIFIED',
    pinColor: 'pin-violet',
    summary:
      'Azure Data & AI Engineer focused on end-to-end cloud data solutions. Experienced across Microsoft Fabric, Azure Data Factory, Lakehouse architectures, Azure AI, OpenAI, and RAG. Has led customer proof-of-concepts, designed solution architectures, and built hybrid data platforms.',
    metrics: [
      { label: 'CONTACT PHONE', value: '+91 7598914366' },
      { label: 'BASE LOCATION', value: 'Bengaluru, India' },
      { label: 'LINKEDIN RECORD', value: 'linkedin.com/in/pragathees-r' },
      { label: 'PORTFOLIO SITE', value: 'pragatheeshuidev.github.io' },
    ],
    architectureNotes: [
      '01 // DATA FABRIC: Unified data platform orchestration with Microsoft Fabric, OneLake, and Delta Lakehouse for low-latency batch and streaming operations.',
      '02 // APPLIED AI: Production-grade RAG pipelines combining Azure AI Search hybrid vector retrieval with Azure OpenAI GPT-4o reasoning models.',
      '03 // RESILIENT ETL/ELT: Zero-loss data pipelines with automated schema validation, drift detection, and automated alerting.',
    ],
    techStack: [
      'Microsoft Fabric',
      'Azure Data Factory (ADF)',
      'Lakehouse Delta Lake',
      'Azure OpenAI',
      'Kusto (KQL)',
      'Python / PySpark',
      'SQL / T-SQL',
      'Azure AI Search',
      'RAG Pipelines',
    ],
    coordinates: 'BENGALURU, KARNATAKA, INDIA (IST / UTC+5:30)',
  },

  'unit-734': {
    id: 'unit-734',
    section: 'SECTION 01 // AUTONOMOUS OPERATIVE',
    code: 'UNIT 734 // ORIGAMI CARDSTOCK #04',
    title: 'Turing Bot: Co-Pilot Systems Assistant',
    subtitle: 'Autonomous DAG Reasoning & Pipeline Telemetry Operative',
    stamp: 'TELEMETRY: VERIFIED ✓',
    pinColor: 'pin-brass',
    summary:
      'Handcrafted origami-mesh systems operative. Continuously audits pipeline execution traces, monitors distributed streaming latency thresholds, and folds distributed execution blueprints across hybrid cloud nodes.',
    image: '/images/turing-bot.svg',
    imageAlt: 'Tactile paper craft character of an AI robot engineer assistant',
    imageBadge: 'TELEMETRY: AUDITING PIPELINES',
    metrics: [
      { label: 'EXECUTION STATE', value: 'ALL PIPELINES SYNCED' },
      { label: 'INGESTION LATENCY', value: '< 25ms SUB-SECOND' },
      { label: 'REASONING ACCURACY', value: '99.4% VERIFIED' },
      { label: 'PIPELINE UPTIME', value: '99.98% OPTIMAL' },
    ],
    architectureNotes: [
      'Monitors real-time telemetry events and pipeline orchestrations across ADF and Microsoft Fabric.',
      'Automatically checks for schema drift, partition skew, and Delta table transaction log consistency.',
      'Audits RAG retrieval groundedness scores before passing context to LLM inference layers.',
    ],
    techStack: ['Microsoft Fabric', 'KQL Telemetry', 'Azure Eventstream', 'Azure Monitor'],
    coordinates: 'BENGALURU ATELIER // KERNEL RUNTIME',
  },

  'role-dbx': {
    id: 'role-dbx',
    section: 'SECTION 02 // CAREER TIMELINE',
    code: 'OCT 2025 — PRESENT',
    title: 'Azure Data and AI Engineer',
    subtitle: 'Quadrant Systems.net India Pvt Ltd · Bengaluru, India',
    stamp: 'CURRENT TENURE',
    pinColor: 'pin-red',
    summary:
      'Leading enterprise customer PoCs and designing cloud data architectures on Azure and Microsoft Fabric. Building hybrid data platforms, lakehouses, and applied AI systems.',
    metrics: [
      { label: 'TENURE DURATION', value: 'OCT 2025 — PRESENT' },
      { label: 'CORE PLATFORM', value: 'MICROSOFT FABRIC' },
      { label: 'SPECIALIZATION', value: 'DATA & APPLIED AI' },
      { label: 'ENGAGEMENT', value: 'CUSTOMER POCS & DEPLOYMENTS' },
    ],
    architectureNotes: [
      'Architected and implemented enterprise Lakehouses utilizing Microsoft Fabric OneLake and Delta Parquet tables.',
      'Designed high-throughput ETL/ELT pipelines using Azure Data Factory and PySpark data transformations.',
      'Built custom RAG solutions and enterprise conversational assistants using Azure OpenAI and vector indexes.',
      'Established CI/CD pipeline automation and monitoring dashboards with KQL queries.',
    ],
    techStack: ['Microsoft Fabric', 'ADF', 'Lakehouse', 'Azure OpenAI', 'KQL', 'PySpark', 'Power BI'],
    coordinates: 'BENGALURU, KARNATAKA, INDIA',
  },

  'role-har': {
    id: 'role-har',
    section: 'SECTION 02 // CAREER TIMELINE',
    code: 'AUG 2024 — APR 2025',
    title: 'Engineer Trainee',
    subtitle: 'Cognizant · Chennai, India',
    stamp: '9 MONTHS COMPLETED',
    pinColor: 'pin-violet',
    summary:
      'Supported enterprise data engineering workflows, cloud migrations, database design, and automated pipeline validation.',
    metrics: [
      { label: 'ROLE DURATION', value: '9 MONTHS' },
      { label: 'DOMAIN', value: 'DATA ENGINEERING' },
      { label: 'LOCATION', value: 'CHENNAI, INDIA' },
      { label: 'FOCUS', value: 'ETL & CLOUD SYSTEMS' },
    ],
    architectureNotes: [
      'Developed data ingestion workflows and transformation logic across relational and cloud data stores.',
      'Authored automated SQL data quality check suites, reducing pipeline failure rates by 35%.',
      'Collaborated on database performance tuning, index optimization, and query execution plans.',
    ],
    techStack: ['SQL', 'Python', 'Azure Cloud', 'ETL Pipelines', 'Relational Databases'],
    coordinates: 'CHENNAI, TAMIL NADU, INDIA',
  },

  'role-csp': {
    id: 'role-csp',
    section: 'SECTION 02 // CAREER TIMELINE',
    code: 'JUL 2023 — JAN 2024',
    title: 'Business Development Associate',
    subtitle: 'BYJU’S · Chennai, India',
    stamp: '7 MONTHS COMPLETED',
    pinColor: 'pin-obsidian',
    summary:
      'Analyzed customer engagement patterns, sales telemetry data, and user conversion metrics to drive business decisions and cross-functional operations.',
    metrics: [
      { label: 'TENURE DURATION', value: '7 MONTHS' },
      { label: 'ANALYTICS FOCUS', value: 'CONVERSION TELEMETRY' },
      { label: 'LOCATION', value: 'CHENNAI, INDIA' },
      { label: 'IMPACT', value: 'HIGH ENGAGEMENT' },
    ],
    architectureNotes: [
      'Extracted and audited CRM telemetry data to identify customer funnel conversion opportunities.',
      'Synthesized business and user requirements into data-driven strategy briefs for team leads.',
      'Maintained rigorous operational data consistency and conversion tracking pipelines.',
    ],
    techStack: ['CRM Telemetry', 'Business Analytics', 'Data Reporting', 'Workflow Optimization'],
    coordinates: 'CHENNAI, TAMIL NADU, INDIA',
  },

  'blueprint-01': {
    id: 'blueprint-01',
    section: 'SECTION 03 // PROJECT 01',
    code: 'BLUEPRINT // 01 (DOC-PIPE)',
    title: 'Intelligent Document Processing Pipeline',
    subtitle: 'Distributed Azure AI Vision & Delta Lake Ingestion Mesh',
    stamp: 'PRODUCTION SPEC',
    pinColor: 'pin-red',
    summary:
      'High-throughput document extraction pipeline that ingests complex unstructured PDFs, scans, and invoices, applying Azure AI Document Intelligence with LayoutLMv3 embeddings and saving structured entities into Delta Lake tables.',
    image: '/images/doc-pipeline.svg',
    imageAlt: 'Intelligent Document Processing Pipeline architecture diagram',
    imageBadge: 'TOPOLOGY: DOCUMENT AI',
    metrics: [
      { label: 'EXTRACTION ACCURACY', value: '99.4% F1 SCORE' },
      { label: 'PROCESSING SPEED', value: '< 1.8s / DOCUMENT' },
      { label: 'PIPELINE THROUGHPUT', value: '100K+ DOCS/DAY' },
      { label: 'STORAGE BACKEND', value: 'DELTA LAKE ONELAKE' },
    ],
    architectureNotes: [
      'Ingestion: Asynchronous message queue triggering Azure Functions on new document arrival.',
      'Analysis: Azure AI Document Intelligence extracts key-value pairs, nested tables, and spatial coordinates.',
      'Storage: PySpark pipelines clean and normalize extracted schemas into Bronze, Silver, and Gold Delta tables.',
      'Query Layer: DirectLake semantic query models enable instant analytical exploration.',
    ],
    techStack: ['Azure AI Vision', 'Azure Data Factory', 'PySpark', 'Delta Lake', 'OneLake', 'Azure Blob Storage'],
    coordinates: 'BENGALURU ATELIER // SCHEMATIC 01',
  },

  'blueprint-02': {
    id: 'blueprint-02',
    section: 'SECTION 03 // PROJECT 02',
    code: 'BLUEPRINT // 02 (RAG-CORE)',
    title: 'Production RAG & Knowledge Intelligence System',
    subtitle: 'Hybrid Vector Retrieval with Strict Guardrails & Azure OpenAI',
    stamp: 'VERIFIED ARCHITECTURE',
    pinColor: 'pin-violet',
    summary:
      'Enterprise-grade Retrieval-Augmented Generation system. Couples Azure AI Search hybrid vector search (dense embeddings + BM25 sparse keyword matching) with semantic reranking and Azure OpenAI GPT-4o for zero-hallucination domain answers.',
    image: '/images/rag-system.svg',
    imageAlt: 'Production Enterprise RAG System architecture diagram',
    imageBadge: 'TOPOLOGY: HYBRID RAG',
    metrics: [
      { label: 'RETRIEVAL LATENCY', value: '< 42ms HYBRID' },
      { label: 'GROUNDEDNESS SCORE', value: '96.2% FAITHFUL' },
      { label: 'CONTEXT RETENTION', value: 'TOP-15 CHUNKS' },
      { label: 'GUARDRAIL REJECTION', value: '100% PII BLOCKED' },
    ],
    architectureNotes: [
      'Chunking: Semantic boundary chunking preserving contextual paragraph integrity.',
      'Search: Azure AI Search hybrid query combining text-embedding-3-large with BM25 full-text ranker.',
      'Reranker: Cross-encoder semantic reranking elevates the top most relevant chunks.',
      'Verification: Automated groundedness and hallucination evaluator checks responses before returning.',
    ],
    techStack: ['Azure OpenAI', 'Azure AI Search', 'LangChain', 'Python', 'Semantic Kernel', 'Vector DB'],
    coordinates: 'BENGALURU ATELIER // SCHEMATIC 02',
  },

  'blueprint-03': {
    id: 'blueprint-03',
    section: 'SECTION 03 // PROJECT 03',
    code: 'BLUEPRINT // 03 (LAKE-TELEMETRY)',
    title: 'Real-Time Lakehouse Telemetry & Analytics Platform',
    subtitle: 'Microsoft Fabric Eventstream, Delta Lakehouse & KQL Serving',
    stamp: 'PETABYTE CAPABLE',
    pinColor: 'pin-brass',
    summary:
      'Streaming telemetry engine built on Microsoft Fabric. Continuously ingests streaming IoT and system logs with Eventstream, storing partitions into OneLake Delta tables while serving instant sub-second analytical queries through KQL Database.',
    image: '/images/lakehouse-platform.svg',
    imageAlt: 'Real-Time Lakehouse Telemetry Platform architecture diagram',
    imageBadge: 'TOPOLOGY: FABRIC LAKEHOUSE',
    metrics: [
      { label: 'STREAM INGRESS', value: '5,000,000 EPS' },
      { label: 'KQL QUERY LATENCY', value: '< 28ms P99' },
      { label: 'COMPACTION CYCLE', value: 'LIQUID CLUSTERING' },
      { label: 'STORAGE SAVINGS', value: '62% VIA PARQUET' },
    ],
    architectureNotes: [
      'Ingestion: Eventstream captures high-frequency telemetry events with zero data loss.',
      'Lakehouse: Medallion architecture (Bronze raw -> Silver enriched -> Gold aggregated).',
      'Optimization: Z-Order and Liquid Clustering prevent small-file problems in Delta storage.',
      'Serving: Real-time KQL database powers instantaneous live observability dashboards.',
    ],
    techStack: ['Microsoft Fabric', 'KQL Database', 'OneLake', 'Eventstream', 'Delta Parquet', 'Power BI DirectLake'],
    coordinates: 'BENGALURU ATELIER // SCHEMATIC 03',
  },

  'edu-stanford': {
    id: 'edu-stanford',
    section: 'SECTION 04 // EDUCATION',
    code: 'APR 2025 — SEP 2025',
    title: 'Postgraduate Program in Data Science and Analytics',
    subtitle: 'Imarticus Learning · Professional Postgraduate Certification',
    stamp: 'POSTGRADUATE',
    pinColor: 'pin-violet',
    summary:
      'Rigorous postgraduate curriculum covering advanced data science methodologies, predictive analytics, statistical modeling, machine learning algorithms, and big data architectures.',
    metrics: [
      { label: 'PROGRAM TYPE', value: 'POSTGRADUATE' },
      { label: 'INSTITUTE', value: 'IMARTICUS LEARNING' },
      { label: 'TIMELINE', value: 'APR 2025 — SEP 2025' },
      { label: 'SPECIALIZATION', value: 'DATA SCIENCE & ANALYTICS' },
    ],
    architectureNotes: [
      'Comprehensive coursework in machine learning, exploratory data analysis, and predictive modeling.',
      'Hands-on industry projects evaluating real-world big data datasets with Python, PySpark, and SQL.',
      'Statistical hypothesis testing, feature engineering pipelines, and model evaluation metrics.',
    ],
    techStack: ['Data Science', 'Machine Learning', 'Python', 'PySpark', 'Statistics', 'Predictive Modeling'],
    coordinates: 'BENGALURU, KARNATAKA, INDIA',
  },

  'edu-berkeley': {
    id: 'edu-berkeley',
    section: 'SECTION 04 // EDUCATION',
    code: 'AUG 2019 — MAY 2023',
    title: 'Bachelor of Engineering (B.E.)',
    subtitle: 'P.A. College of Engineering and Technology, Pollachi',
    stamp: 'DEGREE CONFERRED',
    pinColor: 'pin-brass',
    summary:
      'Bachelor of Engineering in Electrical, Electronics, and Communications Engineering. Core foundation in signal processing, computation systems, embedded electronics, and algorithms.',
    metrics: [
      { label: 'DEGREE', value: 'BACHELOR OF ENGINEERING' },
      { label: 'INSTITUTION', value: 'P.A. COLLEGE OF ENG & TECH' },
      { label: 'DURATION', value: '4 YEARS (2019 — 2023)' },
      { label: 'DISCIPLINE', value: 'ECE / SYSTEMS' },
    ],
    architectureNotes: [
      'Strong mathematical foundations in linear algebra, probability, signal analysis, and numerical methods.',
      'Hardware-software integration, microprocessor computing, and distributed digital communications.',
      'Capstone engineering project developing automated microcontroller telemetry sensor networks.',
    ],
    techStack: ['Electronics', 'Communications', 'Systems Engineering', 'Signal Processing', 'Algorithms'],
    coordinates: 'POLLACHI, TAMIL NADU, INDIA',
  },

  'cert-cka': {
    id: 'cert-cka',
    section: 'SECTION 05 // CERTIFICATIONS',
    code: 'MICROSOFT CERTIFIED',
    title: 'Microsoft Certified: Fabric Data Engineer Associate',
    subtitle: 'Microsoft Official Credential',
    stamp: 'VERIFIED CREDENTIAL',
    pinColor: 'pin-red',
    summary:
      'Demonstrates validated expertise in designing, building, and maintaining enterprise data analytics solutions using Microsoft Fabric, OneLake, Delta Lakehouses, and Data Warehouses.',
    metrics: [
      { label: 'ISSUER', value: 'MICROSOFT' },
      { label: 'STATUS', value: 'ACTIVE & VERIFIED' },
      { label: 'BADGE ID', value: 'FABRIC-DATA-ENG' },
      { label: 'DOMAIN', value: 'ENTERPRISE DATA FABRIC' },
    ],
    architectureNotes: [
      'Validated skills across Microsoft Fabric architecture, Lakehouse administration, and OneLake shortcuts.',
      'Data transformation using Data Factory pipelines, Dataflows Gen2, and Apache Spark notebooks.',
      'Security governance, row-level access control, and DirectLake performance optimization.',
    ],
    techStack: ['Microsoft Fabric', 'OneLake', 'Apache Spark', 'Delta Lake', 'T-SQL Data Warehouse'],
    coordinates: 'MICROSOFT LEARN CREDENTIAL REGISTRY',
  },

  'cert-aws': {
    id: 'cert-aws',
    section: 'SECTION 05 // CERTIFICATIONS',
    code: 'ACCENTURE SIMULATION',
    title: 'Accenture North America — Data Analytics & Visualization',
    subtitle: 'Forage Job Simulation Credential',
    stamp: 'COMPLETED ✓',
    pinColor: 'pin-violet',
    summary:
      'Completed practical enterprise job simulation focusing on data cleansing, modeling, data visualization, and synthesizing executive business insights.',
    metrics: [
      { label: 'ISSUER', value: 'ACCENTURE NORTH AMERICA' },
      { label: 'PLATFORM', value: 'FORAGE' },
      { label: 'FOCUS', value: 'DATA ANALYTICS & VISUALIZATION' },
      { label: 'OUTCOME', value: 'EXECUTIVE BRIEFING' },
    ],
    architectureNotes: [
      'Conducted end-to-end data audit across multiple disparate business data sources.',
      'Built clean relational data models and removed ungrounded records and anomalies.',
      'Presented interactive dashboard visual stories for stakeholder decision-making.',
    ],
    techStack: ['Data Modeling', 'Power BI', 'Data Cleansing', 'Executive Presentation'],
    coordinates: 'ACCENTURE DATA PRACTICE',
  },

  'cert-dbx': {
    id: 'cert-dbx',
    section: 'SECTION 05 // CERTIFICATIONS',
    code: 'TATA SIMULATION',
    title: 'Tata Group — Data Visualisation: Empowering Business',
    subtitle: 'Forage Industry Simulation Credential',
    stamp: 'COMPLETED ✓',
    pinColor: 'pin-brass',
    summary:
      'Industry simulation focused on anticipating executive leadership needs and translating complex operational datasets into clear visual metrics.',
    metrics: [
      { label: 'ISSUER', value: 'TATA GROUP' },
      { label: 'PLATFORM', value: 'FORAGE' },
      { label: 'SPECIALIZATION', value: 'BUSINESS INTELLIGENCE' },
      { label: 'OUTCOME', value: 'EXECUTIVE INSIGHTS' },
    ],
    architectureNotes: [
      'Designed responsive visual dashboards anticipating C-suite business inquiries.',
      'Evaluated time-series revenue and customer retention metrics.',
      'Formulated actionable recommendations based on statistical distribution analysis.',
    ],
    techStack: ['Data Visualization', 'Business Intelligence', 'Analytics', 'Metrics Modeling'],
    coordinates: 'TATA ANALYTICS DIRECTORY',
  },

  'cert-nvda': {
    id: 'cert-nvda',
    section: 'SECTION 05 // CERTIFICATIONS',
    code: 'AI FLUENCY',
    title: 'AI Fluency Framework & Foundations',
    subtitle: 'Applied AI & LLM Systems Specialization',
    stamp: 'FOUNDATIONAL SPEC',
    pinColor: 'pin-obsidian',
    summary:
      'Certified mastery of modern AI foundations: generative AI models, transformer architectures, prompt engineering patterns, ethics, and production system evaluation.',
    metrics: [
      { label: 'DOMAIN', value: 'APPLIED AI & LLMS' },
      { label: 'STATUS', value: 'ACTIVE' },
      { label: 'COVERAGE', value: 'TRANSFORMERS & RAG' },
      { label: 'METHOD', value: 'SYSTEMS EVALUATION' },
    ],
    architectureNotes: [
      'Deep dive into generative modeling, attention mechanisms, and tokenization.',
      'Systematic prompt design strategies including Few-Shot, CoT, and ReAct patterns.',
      'Responsible AI evaluation, bias detection, and security guardrail implementation.',
    ],
    techStack: ['Generative AI', 'Transformers', 'Prompt Engineering', 'Evaluation Frameworks'],
    coordinates: 'AI RESEARCH REGISTER',
  },

  'polaroid-88': {
    id: 'polaroid-88',
    section: 'SECTION 06 // CLUSTER PHOTOGRAPH',
    code: 'POLAROID ARCHIVE #88',
    title: 'Azure Data & AI Cluster // Rack B-04',
    subtitle: 'Datacenter Server Racks · Night Run Telemetry Active',
    stamp: 'VERIFIED RUN #88',
    pinColor: 'pin-brass',
    summary:
      'Physical polaroid capture of high-density server infrastructure running distributed cloud lakehouse and real-time inference workloads. Operating temperature 21.4°C optimal.',
    image: '/images/datacenter-cluster.svg',
    imageAlt: 'High-density datacenter server racks with ambient indicator lights',
    imageBadge: 'CLUSTER: RACK B-04 ACTIVE',
    metrics: [
      { label: 'OPERATING TEMP', value: '21.4°C OPTIMAL' },
      { label: 'ACTIVE INGRESS', value: '5,000,000 EPS' },
      { label: 'CLUSTER STATUS', value: 'ALL NODES NOMINAL' },
      { label: 'NVLINK / MESH', value: 'ACTIVE' },
    ],
    architectureNotes: [
      'Hardware layer powering real-time Lakehouse ingestion and Azure AI inference.',
      'Continuous telemetry monitoring ensures zero dropped packets across network partitions.',
      'Automated failover guarantees sub-second recovery on any node degradation.',
    ],
    techStack: ['High-Performance Computing', 'Azure Cloud', 'Lakehouse Nodes', 'Distributed Mesh'],
    coordinates: 'BENGALURU, KARNATAKA, INDIA',
  },
};
