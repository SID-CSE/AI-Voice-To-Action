import { readFile, writeFile } from 'node:fs/promises';

type Row = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

async function load(path: string): Promise<Row[]> {
  const lines = (await readFile(path, 'utf8')).trimEnd().split(/\r?\n/).filter(line => line.length > 0);
  const headers = parseCsvLine(lines[0]).map(header => header.replace(/^\uFEFF/, ''));
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function kappa(left: string[], right: string[]) {
  const total = left.length;
  const observed = left.filter((value, index) => value === right[index]).length / total;
  const categories = new Set([...left, ...right]);
  const expected = [...categories].reduce((sum, category) => {
    const leftRate = left.filter(value => value === category).length / total;
    const rightRate = right.filter(value => value === category).length / total;
    return sum + leftRate * rightRate;
  }, 0);
  return { agreement: observed, kappa: expected === 1 ? 1 : (observed - expected) / (1 - expected) };
}

const primary = await load('./research_data/actionflow_action_pilot_50_annotated.csv');
const second = await load('./research_data/actionflow_action_pilot_50_annotator2_human.csv');
const secondById = new Map(second.map(row => [row.recordId, row]));
const pairs = primary.map(row => {
  const other = secondById.get(row.recordId);
  if (!other) throw new Error(`Missing second annotation for ${row.recordId}`);
  return [row, other] as const;
});

const fields = ['isAction', 'owner', 'deadline', 'riskLevel', 'confirmationRequired'];
const metrics = Object.fromEntries(fields.map(field => [
  field,
  kappa(pairs.map(([left]) => left[field]), pairs.map(([, right]) => right[field])),
]));
const taskAgreement = pairs.filter(([left, right]) =>
  left.isAction === 'no' && right.isAction === 'no'
    ? true
    : left.task.trim().toLowerCase() === right.task.trim().toLowerCase(),
).length / pairs.length;

const disagreements = pairs
  .filter(([left, right]) => fields.some(field => left[field] !== right[field]) || left.task !== right.task)
  .map(([left, right]) => ({
    recordId: left.recordId,
    primary: { isAction: left.isAction, task: left.task, owner: left.owner, deadline: left.deadline, riskLevel: left.riskLevel, confirmationRequired: left.confirmationRequired },
    annotator2: { isAction: right.isAction, task: right.task, owner: right.owner, deadline: right.deadline, riskLevel: right.riskLevel, confirmationRequired: right.confirmationRequired },
  }));

const result = {
  annotatorTypes: ['primary human', 'independent human annotator 2'],
  recordCount: pairs.length,
  fields: metrics,
  taskExactAgreement: taskAgreement,
  disagreements,
  limitation: 'This is independent human-human agreement before adjudication. It should be reported with the adjudication protocol and disagreement resolution.',
};
await writeFile('./research_data/annotator_agreement_ai_vs_primary.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  recordCount: result.recordCount,
  taskExactAgreement: result.taskExactAgreement,
  fields: result.fields,
  disagreements: result.disagreements.length,
}, null, 2));
