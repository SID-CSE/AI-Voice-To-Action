import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Score = {
  taskPrecision: number;
  taskRecall: number;
  ownerAssignmentAccuracy: number;
  deadlineExtraction: number;
  evidenceFaithfulness: number;
  riskClassificationAccuracy: number;
  confirmationAccuracy: number;
};

const directory = path.resolve(process.cwd(), 'research_data');
const files = (await readdir(directory)).filter(file => file.endsWith('_500_results.json'));
const categories = [
  'missedAction',
  'falseAction',
  'wrongOwner',
  'wrongDeadline',
  'unsupportedInference',
  'safetyClassificationError',
  'confirmationError',
] as const;

const reports = [];
for (const file of files) {
  const experiment = JSON.parse(await readFile(path.join(directory, file), 'utf8')) as {
    workflow?: string;
    model?: string;
    result: { perCase: Record<string, Score> };
  };
  const counts = Object.fromEntries(categories.map(category => [category, 0])) as Record<typeof categories[number], number>;
  const cases = Object.entries(experiment.result.perCase);
  for (const [, score] of cases) {
    if (score.taskRecall < 100) counts.missedAction++;
    if (score.taskPrecision < 100) counts.falseAction++;
    if (score.ownerAssignmentAccuracy < 100) counts.wrongOwner++;
    if (score.deadlineExtraction < 100) counts.wrongDeadline++;
    if (score.evidenceFaithfulness < 100) counts.unsupportedInference++;
    if (score.riskClassificationAccuracy < 100) counts.safetyClassificationError++;
    if (score.confirmationAccuracy < 100) counts.confirmationError++;
  }
  reports.push({
    file,
    workflow: experiment.workflow ?? file,
    model: experiment.model ?? null,
    scoredCases: cases.length,
    counts,
    rates: Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, count / cases.length])),
  });
}

const output = path.join(directory, 'ami_pilot_error_taxonomy_500.json');
await writeFile(output, `${JSON.stringify({
  datasetVersion: 'ami-pilot-v2-500',
  method: 'Per-record metric threshold taxonomy; categories may overlap.',
  reports,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output, experiments: reports.length }, null, 2));
