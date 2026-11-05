import json
import textwrap
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "research_data"
FIGURES = ROOT / "research" / "figures"
FIGURES.mkdir(parents=True, exist_ok=True)

comparison = json.loads((DATA / "ami_pilot_comparison_table.json").read_text())
statistics = json.loads((DATA / "ami_pilot_statistical_analysis.json").read_text())
taxonomy = json.loads((DATA / "ami_pilot_error_taxonomy_500.json").read_text())
manifest = json.loads((DATA / "actionflow_500_manifest.json").read_text())

rows = comparison["rows"]
by_condition = {row["condition"]: row for row in rows}


def save_architecture():
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.axis("off")
    boxes = [
        (0.03, 0.62, 0.15, 0.18, "Voice / Text\nCapture"),
        (0.23, 0.62, 0.15, 0.18, "Express API\nValidation"),
        (0.43, 0.62, 0.15, 0.18, "Lexical RAG\nWorkspace Context"),
        (0.63, 0.62, 0.15, 0.18, "Gemini\nBaseline / ReAct"),
        (0.83, 0.62, 0.14, 0.18, "Evidence +\nGuardrails"),
        (0.43, 0.20, 0.15, 0.18, "Human Review\nConfirmation"),
        (0.68, 0.20, 0.15, 0.18, "Neon / Audit\nPersistence"),
    ]
    for x, y, w, h, label in boxes:
        ax.add_patch(plt.Rectangle((x, y), w, h, facecolor="#d9eaf7", edgecolor="#1f4e79", lw=1.5))
        ax.text(x + w / 2, y + h / 2, label, ha="center", va="center", fontsize=9)
    arrows = [((0.18, .71), (.23, .71)), ((.38, .71), (.43, .71)), ((.58, .71), (.63, .71)),
              ((.78, .71), (.83, .71)), ((.90, .62), (.78, .38)), ((.75, .29), (.58, .29)),
              ((.43, .29), (.50, .38))]
    for start, end in arrows:
        ax.annotate("", xy=end, xytext=start, arrowprops={"arrowstyle": "->", "lw": 1.4})
    ax.text(.5, .93, "ActionFlow AI layered architecture and trust boundaries", ha="center", fontsize=13, weight="bold")
    fig.savefig(FIGURES / "fig1_architecture.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def save_pipeline():
    fig, ax = plt.subplots(figsize=(11, 4.5))
    ax.axis("off")
    labels = ["Transcript", "Candidate\nsentences", "Structured\nGemini output", "Evidence /\nfield checks", "Risk /\nconfirmation", "Reviewable\ntasks"]
    for i, label in enumerate(labels):
        x = .03 + i * .16
        ax.add_patch(FancyBboxPatch((x, .38), .12, .22, boxstyle="round,pad=.02",
                                        facecolor="#e2f0d9" if i in (3, 4) else "#d9eaf7",
                                        edgecolor="#1f4e79"))
        ax.text(x + .06, .49, label, ha="center", va="center", fontsize=8)
        if i < len(labels) - 1:
            ax.annotate("", xy=(x + .16, .49), xytext=(x + .12, .49),
                        arrowprops={"arrowstyle": "->", "lw": 1.2})
    ax.text(.5, .86, "Extraction, evidence validation, and guardrail flow", ha="center", fontsize=13, weight="bold")
    ax.text(.5, .14, "Invalid evidence, unsupported owners/deadlines, and duplicate tasks are removed before scoring or review.",
            ha="center", fontsize=8)
    fig.savefig(FIGURES / "fig2_pipeline.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def save_comparison():
    wanted = [
        ("heuristic-local", "Heuristic"),
        ("hybrid-offline", "Hybrid"),
        ("gemini-baseline-batched", "Gemini baseline"),
        ("gemini-react-batched", "ReAct"),
        ("gemini-react-no-safety-guardrails-batched", "ReAct + guardrails"),
    ]
    names = [name for key, name in wanted]
    metrics = ["taskF1", "owner", "deadline", "evidence", "risk", "confirmation"]
    labels = ["Task F1", "Owner", "Deadline", "Evidence", "Risk", "Confirmation"]
    fig, ax = plt.subplots(figsize=(11, 5.5))
    width = .15
    for i, metric in enumerate(metrics):
        values = [by_condition[key][metric] for key, _ in wanted]
        ax.bar([j + (i - 2.5) * width for j in range(len(names))], values, width, label=labels[i])
    ax.set_xticks(range(len(names)), names, rotation=15, ha="right")
    ax.set_ylim(0, 105)
    ax.set_ylabel("Accuracy / F1 (%)")
    ax.set_title("500-record comparison across completed conditions")
    ax.legend(ncol=3, fontsize=8)
    ax.grid(axis="y", alpha=.25)
    fig.tight_layout()
    fig.savefig(FIGURES / "fig3_comparison.png", dpi=220)
    plt.close(fig)


def save_errors():
    report = next(item for item in taxonomy["reports"] if item["workflow"] == "gemini-baseline-batched")
    counts = report["counts"]
    labels = ["Missed action", "False action", "Wrong owner", "Wrong deadline", "Unsupported inference", "Confirmation error"]
    values = [counts["missedAction"], counts["falseAction"], counts["wrongOwner"], counts["wrongDeadline"],
              counts["unsupportedInference"], counts["confirmationError"]]
    fig, ax = plt.subplots(figsize=(9, 4.8))
    ax.barh(labels, values, color="#5b9bd5")
    ax.set_xlabel("Records affected (overlapping categories)")
    ax.set_title("Gemini baseline error taxonomy")
    ax.invert_yaxis()
    for i, value in enumerate(values):
        ax.text(value + 4, i, str(value), va="center", fontsize=8)
    fig.tight_layout()
    fig.savefig(FIGURES / "fig4_error_taxonomy.png", dpi=220)
    plt.close(fig)


def save_evaluation_protocol():
    fig, ax = plt.subplots(figsize=(11, 4.8))
    ax.axis("off")
    stages = [
        ("1", "AMI records", "500 records\n230 positive"),
        ("2", "Annotation", "Two annotators\n244 adjudications"),
        ("3", "Split", "282 train\n91 validation\n127 test"),
        ("4", "Conditions", "8 workflows\nsame records"),
        ("5", "Scoring", "Task, fields,\nsafety metrics"),
        ("6", "Uncertainty", "Bootstrap\n5,000 iterations"),
    ]
    for i, (number, title, detail) in enumerate(stages):
        x = 0.02 + i * 0.162
        ax.add_patch(FancyBboxPatch(
            (x, 0.32), 0.13, 0.35, boxstyle="round,pad=.02",
            facecolor="#eaf2f8", edgecolor="#1f4e79", lw=1.3,
        ))
        ax.text(x + 0.065, 0.60, number, ha="center", va="center",
                fontsize=13, weight="bold", color="#1f4e79")
        ax.text(x + 0.065, 0.50, title, ha="center", va="center",
                fontsize=9, weight="bold")
        ax.text(x + 0.065, 0.39, detail, ha="center", va="center", fontsize=7.5)
        if i < len(stages) - 1:
            ax.annotate("", xy=(x + 0.158, 0.495), xytext=(x + 0.132, 0.495),
                        arrowprops={"arrowstyle": "->", "lw": 1.2})
    ax.text(.5, .88, "Reproducible 500-record evaluation protocol", ha="center",
            fontsize=13, weight="bold")
    ax.text(.5, .12, "All provider runs use five-record batches and a hard limit of 12 requests per rolling 60-second window.",
            ha="center", fontsize=8)
    fig.savefig(FIGURES / "fig5_evaluation_protocol.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def save_safety_tradeoff():
    conditions = [
        ("Gemini baseline", "gemini-baseline-batched"),
        ("Raw ReAct", "gemini-react-batched"),
        ("ReAct + guardrails", "gemini-react-no-safety-guardrails-batched"),
    ]
    fig, ax = plt.subplots(figsize=(7.5, 5.2))
    for label, key in conditions:
        row = by_condition[key]
        ax.scatter(row["taskF1"], row["confirmation"], s=130, label=label)
        ax.annotate(label, (row["taskF1"], row["confirmation"]),
                    xytext=(7, 5), textcoords="offset points", fontsize=8)
    ax.set_xlim(30, 60)
    ax.set_ylim(25, 105)
    ax.set_xlabel("Task F1 (%)")
    ax.set_ylabel("Confirmation accuracy (%)")
    ax.set_title("Extraction quality versus confirmation safety")
    ax.grid(alpha=.25)
    ax.legend(fontsize=8, loc="lower right")
    fig.tight_layout()
    fig.savefig(FIGURES / "fig6_safety_tradeoff.png", dpi=220)
    plt.close(fig)


def save_reproducibility_controls():
    fig, ax = plt.subplots(figsize=(10.5, 4.8))
    ax.axis("off")
    rows = [
        ("Dataset", "Versioned 500-record manifest", "#d9eaf7"),
        ("Prompt", "Saved workflow and ablation flags", "#d9eaf7"),
        ("Quota", "12 requests per rolling 60 seconds", "#e2f0d9"),
        ("Recovery", "Checkpoint after every valid batch", "#e2f0d9"),
        ("Scoring", "Deterministic field and safety metrics", "#fff2cc"),
        ("Audit", "JSON outputs, taxonomy, bootstrap intervals", "#fff2cc"),
    ]
    for i, (name, detail, color) in enumerate(rows):
        y = 0.79 - i * 0.115
        ax.add_patch(FancyBboxPatch((.08, y - .035), .18, .07, boxstyle="round,pad=.01",
                                    facecolor=color, edgecolor="#1f4e79"))
        ax.text(.17, y, name, ha="center", va="center", fontsize=9, weight="bold")
        ax.annotate("", xy=(.39, y), xytext=(.28, y),
                    arrowprops={"arrowstyle": "->", "lw": 1.0})
        ax.add_patch(FancyBboxPatch((.40, y - .035), .50, .07, boxstyle="round,pad=.01",
                                    facecolor="#f7f9f9", edgecolor="#7f8c8d"))
        ax.text(.65, y, detail, ha="center", va="center", fontsize=8)
    ax.text(.5, .94, "Reproducibility and operational safeguards", ha="center",
            fontsize=13, weight="bold")
    fig.savefig(FIGURES / "fig7_reproducibility_controls.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def style_document(doc):
    for style_name in ["Normal", "Title", "Heading 1", "Heading 2"]:
        style = doc.styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman") if style._element.rPr.rFonts else None
    doc.styles["Normal"].font.size = Pt(9)
    doc.styles["Heading 1"].font.size = Pt(12)
    doc.styles["Heading 2"].font.size = Pt(10)


def qn(value):
    from docx.oxml.ns import qn as xml_qn
    return xml_qn(value)


def add_table(doc, headers, values):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for cell, text in zip(table.rows[0].cells, headers):
        cell.text = str(text)
        for run in cell.paragraphs[0].runs:
            run.bold = True
            run.font.size = Pt(8)
    for row in values:
        cells = table.add_row().cells
        for cell, text in zip(cells, row):
            cell.text = str(text)
            for run in cell.paragraphs[0].runs:
                run.font.size = Pt(8)
    doc.add_paragraph()


def add_fig(doc, filename, caption):
    doc.add_picture(str(FIGURES / filename), width=Inches(6.6))
    p = doc.paragraphs[-1]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap = doc.add_paragraph(caption)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.runs[0].italic = True
    cap.runs[0].font.size = Pt(8)


def add_heading(doc, text, level=1):
    doc.add_heading(text, level=level)


def add_body(doc, text):
    p = doc.add_paragraph(text)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.0


save_architecture()
save_pipeline()
save_comparison()
save_errors()
save_evaluation_protocol()
save_safety_tradeoff()
save_reproducibility_controls()

doc = Document()
section = doc.sections[0]
section.top_margin = Inches(.55)
section.bottom_margin = Inches(.55)
section.left_margin = Inches(.65)
section.right_margin = Inches(.65)
style_document(doc)

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = title.add_run("ActionFlow AI: Evidence-Grounded and Risk-Aware Action Extraction from Meeting Transcripts")
r.bold = True
r.font.size = Pt(15)
r.font.name = "Times New Roman"
author = doc.add_paragraph("Siddharth Kumar, Gourab Kundu, Muskan Nayak\nDepartment of Computer Science, Presidency University, Bengaluru, India")
author.alignment = WD_ALIGN_PARAGRAPH.CENTER

add_heading(doc, "Abstract")
add_body(doc, "Meeting conversations contain commitments, owners, deadlines, risks, and unresolved ambiguities, but these elements are difficult to recover reliably from free-form speech. This paper presents ActionFlow AI, a voice-and-text workspace that converts meeting transcripts into reviewable structured action items. The system combines Gemini-based structured extraction with deterministic candidate detection, transcript-evidence validation, workspace-scoped lexical retrieval, uncertainty representation, duplicate removal, and server-side risk guardrails. Unlike an autonomous execution agent, it proposes actions and records confirmation without sending messages, changing accounts, deleting data, or performing external operations. We construct a 500-record AMI-derived evaluation dataset containing 230 action-positive records; the 400-record expansion was independently labeled by two annotators and 244 disagreements were adjudicated. On the final dataset, Gemini 3.1 Flash Lite achieved 53.5% macro task F1 (95% bootstrap CI: 49.1–57.9), while the local heuristic and offline hybrid achieved 10.6% and 24.6%, respectively. Raw ReAct achieved 40.1% task F1 but improved owner, deadline, evidence, and confirmation behavior. ReAct with post-processing guardrails achieved 47% task F1, 62% owner accuracy, 67% deadline accuracy, 56% evidence faithfulness, 99% risk accuracy, and 98% confirmation accuracy. These results support baseline Gemini as the primary extraction condition and ReAct plus guardrails as a safety-oriented alternative.")
add_body(doc, "Keywords—meeting action extraction, voice-to-task systems, evidence grounding, uncertainty, risk-aware AI, human confirmation, retrieval-augmented generation")

add_heading(doc, "I. Introduction")
add_body(doc, "Teams make operational commitments through stand-ups, sprint reviews, supervisor meetings, and informal project discussions. These commitments are distributed across speech and notes, making it easy to miss an owner, deadline, or risk. A useful assistant must identify candidate actions while preserving the boundary between what was said and what was inferred.")
add_body(doc, "ActionFlow AI addresses this problem as a reviewable extraction task. A user speaks into a browser microphone or supplies text, after which the system proposes tasks with owners, deadlines, priorities, confidence, and exact transcript evidence. Consequential actions such as external communication, financial transfer, deletion, credential handling, or permission changes are flagged for confirmation; confirmation is recorded but does not execute an external action.")
add_body(doc, "The contributions are: (1) a deployable voice-and-text action-extraction workflow; (2) a hybrid responsibility split in which generation is checked by deterministic validation and guardrails; (3) a 500-record AMI evaluation dataset with a two-annotator adjudicated expansion; and (4) a reproducible, checkpointed evaluation protocol that separates extraction quality from safety behavior.")
add_fig(doc, "fig1_architecture.png", "Fig. 1. Layered ActionFlow AI architecture and trust boundaries.")

add_heading(doc, "II. Related Work and Research Gap")
add_body(doc, "Meeting action extraction combines speech recognition, dialogue understanding, information extraction, and structured generation. Large language models can map varied language to structured schemas, but fluent output can conceal unsupported owners, deadlines, or actions. Retrieval-augmented generation can provide workspace-specific context without retraining, while evidence constraints and uncertainty modeling make unsupported claims easier to detect.")
add_body(doc, "The research gap addressed here is the combination of flexible language extraction with deterministic evidence and safety controls. The system treats transcripts and retrieved documents as untrusted data, applies validation after generation, and keeps a human in the loop before persistence or confirmation.")
add_table(doc, ["RQ", "Question", "Measures"], [
    ["RQ1", "Does the proposed workflow improve action extraction?", "Precision, recall, F1"],
    ["RQ2", "Do evidence constraints reduce unsupported output?", "Evidence faithfulness, unsupported rate"],
    ["RQ3", "Do guardrails improve conservative behavior?", "Risk and confirmation accuracy"],
    ["RQ4", "What quality/safety trade-off does ReAct introduce?", "Task and field metrics, CI"],
])

add_heading(doc, "III. Methodology")
add_heading(doc, "A. Problem Formulation", 2)
add_body(doc, "Let T be a transcript and G the annotated set of gold task tuples. Each tuple contains a task description, owner, deadline, evidence span, and record-level risk and confirmation labels. Predictions are matched to unmatched gold tasks using normalized lexical similarity. Task precision and recall are computed from matched pairs, and their harmonic mean is reported as per-record task F1. Owner, deadline, evidence, risk, and confirmation are scored independently.")
add_heading(doc, "B. Hybrid Extraction", 2)
add_body(doc, "Candidate detection uses action cues such as explicit commitments, agreed next steps, responsibility statements, and direct action verbs. The model receives candidate sentences and transcript context, and returns structured JSON. Post-processing validates that evidence is grounded in the transcript, removes unsupported owner and deadline claims, deduplicates normalized tasks, and rebuilds action items from validated tasks.")
add_heading(doc, "C. Guardrails", 2)
add_body(doc, "Server-side rules detect financial transfers, destructive deletion, credential requests, external communication, and access-control changes. Guardrails are authoritative for risk and confirmation and cannot be disabled by transcript content. Confirmations are records only and never trigger external actions.")
add_fig(doc, "fig2_pipeline.png", "Fig. 2. Extraction, evidence validation, and guardrail flow.")

add_heading(doc, "IV. System Architecture and Implementation")
add_body(doc, "The client is implemented with React 19, TypeScript, Vite, and Tailwind CSS. An Express API performs validation, rate limiting, workspace resolution, analysis, persistence, and audit operations. Gemini is accessed server-side. Workspace retrieval is lexical and scoped to the current workspace. Neon PostgreSQL stores production snapshots and audit records, while local JSON storage supports development. Clerk provides server-verified identity; guest mode is explicitly shared and intended only for demonstration data.")
add_body(doc, "The system has a deliberate non-execution boundary. The endpoint that records confirmation does not send email, transfer money, delete records, modify calendars, or change permissions. This separation makes safety claims testable without claiming autonomous real-world action.")
add_heading(doc, "V. Experimental Setup", 1)
add_body(doc, "The final dataset contains 500 records and 230 action-positive records. It combines a 50-record lower-confidence pilot with a 400-record expansion. The expansion was independently labeled by two human annotators, and 244 disagreements were adjudicated. The meeting-level split contains 282 training, 91 validation, and 127 test records. Evidence spans were validated against transcript text and the final loader reported zero errors.")
add_fig(doc, "fig5_evaluation_protocol.png", "Fig. 5. Dataset construction and reproducible evaluation protocol.")
add_table(doc, ["Subset", "Records", "Positive", "Annotation"], [
    ["Original pilot", 50, 27, "Single annotator"],
    ["Adjudicated expansion", 400, 203, "Two annotators; 244 adjudications"],
    ["Combined set", 500, 230, "Validated; zero loader errors"],
])
add_body(doc, "Conditions included a deterministic heuristic, an offline candidate-and-evidence hybrid, Gemini baseline, raw Gemini ReAct, ReAct with guardrail post-processing, and three prompt ablations. Gemini conditions used gemini-3.1-flash-lite, five records per request, checkpointing, and a hard limit of at most 12 requests in any 60-second window. Bootstrap intervals use 5,000 deterministic percentile resamples.")

add_heading(doc, "VI. Results")
main_rows = []
for key, label in [
    ("heuristic-local", "Heuristic"),
    ("hybrid-offline", "Offline hybrid"),
    ("gemini-baseline-batched", "Gemini baseline"),
    ("gemini-react-batched", "Raw ReAct"),
    ("gemini-react-no-safety-guardrails-batched", "ReAct + guardrails"),
]:
    row = by_condition[key]
    main_rows.append([label, row["taskF1"], row["precision"], row["recall"], row["owner"], row["deadline"], row["evidence"], row["risk"], row["confirmation"]])
add_table(doc, ["Condition", "F1", "P", "R", "Owner", "Deadline", "Evidence", "Risk", "Confirm."], main_rows)
add_fig(doc, "fig3_comparison.png", "Fig. 3. Quality and safety comparison over all 500 records.")
add_fig(doc, "fig6_safety_tradeoff.png", "Fig. 6. Task extraction quality versus confirmation safety.")
add_body(doc, "Gemini baseline is the strongest primary extraction condition at 53.5% macro task F1, with bootstrap 95% CI 49.1–57.9. Raw ReAct lowers task F1 to 40.1 (CI 36.0–44.4) but improves owner accuracy, deadline accuracy, evidence faithfulness, and confirmation accuracy. ReAct with guardrails improves raw ReAct to 47% F1 and reaches 99% risk and 98% confirmation accuracy. Thus, ReAct plus guardrails is best interpreted as a safety-oriented trade-off rather than the primary extraction winner.")
add_fig(doc, "fig7_reproducibility_controls.png", "Fig. 7. Reproducibility and operational safeguards used during evaluation.")
add_body(doc, "Prompt ablations show that removing evidence, uncertainty, or safety instructions does not improve task F1 and can substantially change confirmation behavior. Removing evidence reduces confirmation accuracy to 35%, while removing safety changes the risk/confirmation balance. These findings support retaining explicit safety and evidence instructions even when task F1 is the primary objective.")

add_heading(doc, "VII. Error Analysis and Retrieval Scope")
add_fig(doc, "fig4_error_taxonomy.png", "Fig. 4. Overlapping Gemini baseline error categories.")
add_body(doc, "The Gemini baseline error taxonomy shows that extraction errors remain common: 232 records contain a missed-action signal, 233 contain a false-action signal, 226 contain owner or deadline errors, and 229 contain unsupported-inference signals under the diagnostic thresholds. Only 8 records contain a risk-classification error, while 198 contain a confirmation error. Categories overlap and are diagnostic rather than mutually exclusive.")
add_body(doc, "Lexical RAG is implemented as a workspace capability, but it is not claimed as a measured improvement on the AMI benchmark. The current AMI records do not contain gold workspace documents or relevance judgments, so Recall@k and MRR would be undefined. A future retrieval study requires meeting-specific documents, relevance labels, a frozen index, and no-RAG controls.")

add_heading(doc, "VIII. Limitations and Discussion")
add_body(doc, "The dataset is a pilot sample derived from AMI meeting material and may not represent all domains, accents, meeting cultures, or action types. The first 50 records have lower annotation confidence because they are not independently labeled. Task wording agreement should be treated semantically rather than as exact string identity. Browser speech recognition adds an ASR error source, and model outputs can vary across provider versions, prompts, and quota conditions.")
add_body(doc, "The benchmark uses lexical matching and evidence containment, which are reproducible but do not fully measure semantic equivalence or entailment. The heuristic and hybrid baselines are local diagnostics, not trained systems. Finally, the application records confirmation but does not execute consequential operations; therefore the results do not establish safe autonomous action execution.")

add_heading(doc, "IX. Conclusion and Future Work")
add_body(doc, "ActionFlow AI demonstrates a responsible architecture for extracting reviewable action items from meeting transcripts. On the 500-record adjudicated dataset, Gemini baseline achieved the strongest task extraction result, while ReAct with guardrails provided stronger confirmation and risk behavior with a lower task F1. The results support separating extraction quality from safety quality instead of collapsing both into one score. Future work includes semantically grounded evidence scoring, labeled retrieval evaluation, better candidate recall, calibrated confidence, cross-domain meeting datasets, multilingual and diarization-aware speech processing, and opt-in integrations that retain the non-execution boundary.")

add_heading(doc, "Acknowledgment")
add_body(doc, "The authors thank the faculty and project mentors of the Department of Computer Science, Presidency University, Bengaluru, for their guidance and support.")
add_heading(doc, "References")
refs = [
    "[1] NIST, “Artificial Intelligence Risk Management Framework (AI RMF 1.0),” NIST AI 100-1, 2023.",
    "[2] High-Level Expert Group on Artificial Intelligence, “Ethics Guidelines for Trustworthy AI,” European Commission, 2019.",
    "[3] OWASP Foundation, “OWASP Top 10 for Large Language Model Applications.”",
    "[4] W3C Community Group, “Web Speech API.”",
    "[5] T. B. Brown et al., “Language models are few-shot learners,” NeurIPS, 2020.",
    "[6] Gemini Team, Google, “Gemini: A family of highly capable multimodal models,” arXiv:2312.11805, 2023.",
    "[7] P. Lewis et al., “Retrieval-augmented generation for knowledge-intensive NLP tasks,” NeurIPS, 2020.",
    "[8] G. Salton and C. Buckley, “Term-weighting approaches in automatic text retrieval,” Information Processing & Management, 1988.",
    "[9] S. Yao et al., “ReAct: Synergizing reasoning and acting in language models,” ICLR, 2023.",
    "[10] S. Kumar, “AI-Voice-To-Action (ActionFlow AI) source repository,” GitHub, SID-CSE/AI-Voice-To-Action.",
]
for ref in refs:
    add_body(doc, ref)

output = ROOT / "research" / "ActionFlow_AI_IEEE_Paper_Final.docx"
doc.save(output)
print(output)
