import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Experiment = {
  workflow?: string;
  model?: string;
  ablation?: string;
  result: {
    caseCount: number;
    scoredCaseCount: number;
    macroTaskF1: number;
    macroTaskPrecision: number;
    macroTaskRecall: number;
    macroOwnerAssignmentAccuracy: number;
    macroDeadlineExtraction: number;
    macroEvidenceFaithfulness: number;
    macroRiskClassificationAccuracy: number;
    macroConfirmationAccuracy: number;
  };
};

const directory = path.resolve(process.cwd(), 'research_data');
const files = (await readdir(directory))
  .filter(file => file.endsWith('_500_results.json'))
  .sort();
const rows: Array<Record<string, string | number>> = [];
for (const file of files) {
  const experiment = JSON.parse(await readFile(path.join(directory, file), 'utf8')) as Experiment;
  rows.push({
    condition: experiment.workflow ?? file,
    model: experiment.model ?? 'local',
    cases: experiment.result.caseCount,
    scored: experiment.result.scoredCaseCount,
    taskF1: experiment.result.macroTaskF1,
    precision: experiment.result.macroTaskPrecision,
    recall: experiment.result.macroTaskRecall,
    owner: experiment.result.macroOwnerAssignmentAccuracy,
    deadline: experiment.result.macroDeadlineExtraction,
    evidence: experiment.result.macroEvidenceFaithfulness,
    risk: experiment.result.macroRiskClassificationAccuracy,
    confirmation: experiment.result.macroConfirmationAccuracy,
  });
}

const header = '| Condition | Model | Cases | Scored | Task F1 | Precision | Recall | Owner | Deadline | Evidence | Risk | Confirmation |\n'
  + '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
const markdown = `# ActionFlow AI 500-Record Comparison\n\nDataset: \`ami-pilot-v2-500\`\n\n${header}${
  rows.map(row => `| ${row.condition} | ${row.model} | ${row.cases} | ${row.scored} | ${row.taskF1}% | ${row.precision}% | ${row.recall}% | ${row.owner}% | ${row.deadline}% | ${row.evidence}% | ${row.risk}% | ${row.confirmation}% |`).join('\n')
}\n\nGenerated from saved JSON result files; incomplete conditions are excluded.\n`;
await writeFile(path.join(directory, 'ami_pilot_comparison_table.md'), markdown, 'utf8');
await writeFile(path.join(directory, 'ami_pilot_comparison_table.json'), `${JSON.stringify({
  datasetVersion: 'ami-pilot-v2-500',
  rows,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ conditions: rows.length, output: 'research_data/ami_pilot_comparison_table.md' }, null, 2));
