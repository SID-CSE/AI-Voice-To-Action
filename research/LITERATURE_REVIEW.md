# Initial Literature Review

## Review boundary

This is an initial, source-verified review of meeting understanding, action extraction, retrieval grounding, factuality, and agent safety. Publication status is stated explicitly. The links are official ACL Anthology or arXiv records. A complete systematic review should expand this list to 15–25 papers using IEEE Xplore, ACM, Springer, Elsevier, and Google Scholar searches with a documented inclusion protocol.

## Verified sources

| Work | Year / venue | Relevance and reported evidence |
|---|---|---|
| Abstractive Meeting Summarization: A Survey — Rennard et al. | 2023, TACL; DOI [10.1162/tacl_a_00578](https://doi.org/10.1162/tacl_a_00578) | Surveys meeting datasets, models, and metrics; establishes multi-party discourse, salience, and faithfulness as central challenges. |
| MeetingBank: A Benchmark Dataset for Meeting Summarization — Hu et al. | 2023, ACL; DOI [10.18653/v1/2023.acl-long.906](https://doi.org/10.18653/v1/2023.acl-long.906) | Public meetings with transcripts, summaries, agenda and metadata; provides a stronger benchmark basis than the project's ten synthetic regression cases. |
| MeetingQA: Extractive Question-Answering on Meeting Transcripts — Prasad et al. | 2023, ACL; DOI [10.18653/v1/2023.acl-long.837](https://doi.org/10.18653/v1/2023.acl-long.837) | Shows meeting QA remains difficult: reported model F1 57.3 versus human 84.6. Supports testing distributed evidence and long-context failure. |
| Action-Item-Driven Summarization of Long Meeting Transcripts — Golia and Kalita | 2023, NLPIR; arXiv [2312.17581](https://arxiv.org/abs/2312.17581) | Recursive section summaries plus action-item extraction; reports BERTScore 64.98 on AMI and highlights long-context dependency problems. It is a preprint/conference paper, not an IEEE result. |
| Dialogue Summarization with Mixture of Experts based on Large Language Models — Tian et al. | 2024, ACL; DOI [10.18653/v1/2024.acl-long.385](https://doi.org/10.18653/v1/2024.acl-long.385) | Uses multiple LLM experts for different dialogue aspects and reports improved informativeness/accuracy on dialogue benchmarks. Motivates controlled multi-stage or ensemble baselines. |
| Tell me what I need to know: LLM-based Personalized Multi-Source Meeting Summarization — Kirstein et al. | 2024, EMNLP Industry; DOI [10.18653/v1/2024.emnlp-industry.69](https://doi.org/10.18653/v1/2024.emnlp-industry.69) | Multi-source context improved relevance by about 9%; personalization improved informativeness by about 10% in the reported study. Directly relevant to workspace context, but not equivalent to role-grounded task extraction. |
| Leveraging Discourse Structure for Extractive Meeting Summarization — Rennard et al. | 2024, arXiv [2405.11055](https://arxiv.org/abs/2405.11055) | Discourse graphs and GNN node classification on AMI/ICSI; reports improvements over extractive systems and ablations of discourse relations. |
| Synchronous Faithfulness Monitoring for Trustworthy RAG — Wu et al. | 2024, EMNLP; DOI [10.18653/v1/2024.emnlp-main.527](https://doi.org/10.18653/v1/2024.emnlp-main.527) | SynCheck/FOD monitoring and decoding; reports more than 10% faithfulness improvement across six datasets. Demonstrates that merely displaying retrieved text is not a grounding guarantee. |
| HaluEval: A Large-Scale Hallucination Evaluation Benchmark — Li et al. | 2023, EMNLP; DOI [10.18653/v1/2023.emnlp-main.397](https://doi.org/10.18653/v1/2023.emnlp-main.397) | Reports hallucinated content on about 19.5% of user queries in its setting and difficulty of recognition; useful for designing unsupported-owner/deadline tests. |
| The Dawn After the Dark: Factuality Hallucination in LLMs — Li et al. | 2024, ACL; official record [ACL 2024 long 586](https://aclanthology.org/2024.acl-long.586/) | HaluEval 2.0 plus analysis of detection sources and mitigation. Supports testing factuality separately from task-count accuracy. |
| ReEval: Automatic Hallucination Evaluation for RAG LLMs — Yu et al. | 2024, NAACL Findings; arXiv [2310.12516](https://arxiv.org/abs/2310.12516) | Perturbs evidence to create dynamic tests and finds static benchmark success does not ensure evidence use. Directly motivates contradictory and stale workspace-document tests. |
| InjecAgent: Benchmarking Indirect Prompt Injections in Tool-Integrated LLM Agents — Zhan et al. | 2024, ACL Findings; official record [10.18653/v1/2024.findings-acl.624](https://aclanthology.org/2024.findings-acl.624/) | 1,054 cases across 17 user tools and 62 attacker tools; reports ReAct-prompted GPT-4 vulnerable 24% in its setting. Strong evidence that untrusted retrieved content requires adversarial evaluation. |
| Retrieval-Augmented Generation for Large Language Models: A Survey — Gao et al. | 2024, arXiv [2312.10997](https://arxiv.org/abs/2312.10997) | Surveys RAG architectures, retrieval, generation, evaluation, transparency, and knowledge freshness. |
| Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks — Lewis et al. | 2020, NeurIPS; arXiv [2005.11401](https://arxiv.org/abs/2005.11401) | Foundational parametric-plus-nonparametric RAG formulation and benchmark evidence for knowledge-intensive generation. |
| ReAct: Synergizing Reasoning and Acting in Language Models — Yao et al. | 2023, ICLR; arXiv [2210.03629](https://arxiv.org/abs/2210.03629) | Foundational reasoning/acting prompting work. It motivates comparison, but using a ReAct prompt is not itself a new contribution. |
| Robust Speech Recognition via Large-Scale Weak Supervision — Radford et al. | 2023, ICML; arXiv [2212.04356](https://arxiv.org/abs/2212.04356) | Whisper study showing the importance of large-scale weakly supervised ASR and robustness; relevant to separating speech transcription errors from downstream extraction errors. |

## Comparison with this project

ActionFlow has the right application setting and a useful safety-oriented schema, but it does not yet meet the methodological bar of these works. Its ten synthetic cases are not a benchmark like MeetingBank; its lexical scorer is not a retrieval evaluation; and its current evidence and calibration scores are preliminary diagnostics, not a complete faithfulness or calibration study.

## Review conclusions

1. Meeting understanding is established; simple task extraction is unlikely to be novel.
2. Evidence-grounded, uncertainty-aware extraction for organization-specific roles is less saturated and is feasible to evaluate.
3. Safety must be evaluated as an adversarial classification/abstention problem, not asserted from prompt instructions.
4. A publishable contribution should release an anonymized schema/dataset or a reproducible benchmark protocol, plus code and exact model configurations.

## Citation caution

The review is intentionally “initial.” Before a paper claims a state of the art, verify every venue, version, metric, split, and comparison from the final paper. Do not copy the reported numbers as expected project results.
