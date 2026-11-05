import { readFile, writeFile } from 'node:fs/promises';

type Row = Record<string, string>;

const input = './research_data/actionflow_action_pilot_50.csv';
const output = './research_data/actionflow_action_pilot_50_annotator2_ai.csv';

const decisions: Record<string, {
  action: 'yes' | 'no';
  task?: string;
  owner?: string;
  deadline?: string;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  confirmation?: 'yes' | 'no';
  evidence?: string;
  notes: string;
}> = {
  '001': { action: 'yes', task: 'Make the functional, conceptual, and detailed designs', notes: 'Group process commitment, although timing is vague.', evidence: 'we have to make a functional design.' },
  '002': { action: 'no', notes: 'Availability statement and truncated speech; no concrete task.' },
  '003': { action: 'yes', task: 'Design a custom circuit board', notes: 'Explicit group requirement; later printing is conditional.', evidence: "we'll need to custom desi design a circuit board" },
  '004': { action: 'yes', task: 'Decide what to do with the remote', deadline: 'Before we leave this meeting', notes: 'Explicit group decision with meeting deadline.', evidence: "we have to decide exactly what we're going to do with the remote." },
  '005': { action: 'yes', task: 'Try processing on the fly and observe the duration', notes: 'Group plan; offline processing is conditional.', evidence: "we'll try and do it on the fly and and observe if if that gonna is gonna take too long." },
  '006': { action: 'yes', task: 'Verify that the audio signal can be picked up', notes: 'First-person commitment with an unspecified referent.', evidence: "I'll make sure make sure they can actually pick up the f um audio signal as well." },
  '007': { action: 'yes', task: 'Choose and adapt the design', notes: 'Group design decision with competing cost/attractiveness goals.', evidence: 'we just have to choose. And adapt.' },
  '008': { action: 'yes', task: 'Take notes and prepare the presentation', notes: 'Speaker states planned meeting work.', evidence: "I'm gonna take some notes. We're gonna all do a presentation" },
  '009': { action: 'yes', task: 'Work individually on assigned design tasks and meet to discuss decisions', notes: 'Explicit division of work and follow-up meeting.', evidence: 'you will work uh s separately, individually on uh your specific tasks' },
  '010': { action: 'yes', task: 'Check the corporate website', notes: 'Explicit suggestion framed as a task for the next meeting.', evidence: 'So check out the corporate website maybe.' },
  '011': { action: 'yes', task: 'Discuss the look-and-feel, usability, and evaluate the product', notes: 'Meeting agenda contains intended activities.', evidence: 'we will discuss the look-and-feel of the design' },
  '012': { action: 'yes', task: 'Decide on a movie for the end of the month', deadline: 'at the end of the month', notes: 'Explicit meeting goal and deadline.', evidence: 'the goal for today is to decide for a movie to project at the end of the month' },
  '013': { action: 'no', notes: 'Technical process description, not an assigned action.' },
  '014': { action: 'yes', task: 'Ask Jonathan about the issue', notes: 'First-person intended follow-up; timing unspecified.', evidence: "I'll p I'll probably ask Jonathan about it." },
  '015': { action: 'yes', task: 'Remind her about the voice-over', notes: 'First-person commitment; referent is unnamed.', evidence: "I'll I'll I'll do that." },
  '016': { action: 'yes', task: 'Call them using the phone number', notes: 'First-person plan; recipient is unspecified.', evidence: "so I can call them." },
  '017': { action: 'no', notes: 'Raises a future design question about battery feasibility; no agreed task.' },
  '018': { action: 'yes', task: 'Decide whether to include a scroll interface', notes: 'Group design decision is required later.', evidence: "we're gonna have to decide the interface" },
  '019': { action: 'no', notes: 'Preference discussion and evaluation, not a concrete assignment.' },
  '020': { action: 'yes', task: 'Take meeting minutes and give three presentations', deadline: 'about forty minutes', notes: 'Agenda commitments; secretary owner is not named.', evidence: 'fulfil the role of secretary, take the meeting minutes.' },
  '021': { action: 'yes', task: 'Plan the product and design steps', notes: 'Meeting plan stated by speaker.', evidence: 'we will uh see what will be uh our product and what will be the different step' },
  '022': { action: 'yes', task: 'Investigate the cost increase and its effect on final numbers', owner: 'Pedro', notes: 'Two explicit parallel investigation tasks; Pedro owns the first.', evidence: 'Pedro and I can look into how much this might increase our costs' },
  '023': { action: 'yes', task: 'Develop an exclusive, environmentally sensitive, high-tech remote design', notes: 'Group design direction, not an execution deadline.', evidence: "let's make this thing really exclusive" },
  '024': { action: 'yes', task: 'Decide on the remote control concept', notes: 'Explicit meeting decision task.', evidence: 'we will have to decide on the remote control concept' },
  '025': { action: 'yes', task: 'Prepare the look-and-feel design, user interface, and first prototype', deadline: 'next meeting', notes: 'Explicit assignments to the group; named owners are not given.', evidence: 'next meeting you guys have to prepare the following things.' },
  '026': { action: 'yes', task: 'Estimate production costs in an Excel sheet', notes: 'Speaker states preparation and group calculation.', evidence: 'I prepare an Excel sheet.' },
  '027': { action: 'no', notes: 'General aspiration and uncertain future discussion; no concrete assigned task in the truncated segment.' },
  '028': { action: 'yes', task: 'Send the show-view numbers and edit them', notes: 'Obligation is stated but owner and timing are unclear.', evidence: 'someone will has to send all the show-view numbers' },
  '029': { action: 'yes', task: 'Decide the remote control functions', deadline: 'in this meeting', notes: 'Explicit decision required in the meeting.', evidence: 'We have to decide it in this meeting what our function will be.' },
  '030': { action: 'yes', task: 'Save the documents and use the pen and eraser', notes: 'Step-by-step work instructions; printer is rejected.', evidence: 'First you can save the documents.' },
  '031': { action: 'no', notes: 'Description of how the board is being used; no clear assignment.' },
  '032': { action: 'yes', task: 'Develop a components concept and conduct trend-watching', notes: 'Explicit requests and required research.', evidence: 'you have to come up with a components concept' },
  '033': { action: 'no', notes: 'Speaker demonstrates a design change; no assigned future task.' },
  '034': { action: 'yes', task: 'Work full time on NLSSD', deadline: 'next week', notes: 'First-person planned work; acronym retained from transcript.', evidence: "I'll just kick in full time for N_L_S_S_D_ next week" },
  '035': { action: 'no', notes: 'Explains the purpose of component design; no concrete assignment.' },
  '036': { action: 'yes', task: 'Present the component design and manufacturer constraints', deadline: 'today', notes: 'Speaker states what they will discuss today.', evidence: "what I'm gonna have to talk to you about today is um component design" },
  '037': { action: 'yes', task: 'Complete questionnaires and bring new ideas to the next meeting', deadline: 'after lunch', notes: 'Explicit group tasks; next meeting timing is not exact.', evidence: "everyone's gonna go finish their questionnaire" },
  '038': { action: 'yes', task: 'Assign the tasks required to complete the process', notes: 'Explicit planned meeting outcome.', evidence: 'end by dispatching the different task you will have to fulfil' },
  '039': { action: 'no', notes: 'Product strategy discussion and conditional aspiration, not an assigned action.' },
  '040': { action: 'yes', task: 'Discuss the final design and evaluate the product and project', deadline: 'today', notes: 'Explicit final-meeting agenda.', evidence: 'we will discuss our final design.' },
  '041': { action: 'yes', task: 'Agree on the target systems for the product', notes: 'Explicit decision prerequisite; transcript is truncated.', evidence: "we must first agree on what we're going to m going to make." },
  '042': { action: 'yes', task: 'Check how it works and provide code for loading a dictionary', notes: 'First-person conditional offer; code provision is conditional.', evidence: "I'll check if I understand how it works." },
  '043': { action: 'yes', task: 'Meet and complete the display work', deadline: 'at five in Appleton Tower', notes: 'Explicit meeting arrangement and first-person display commitment.', evidence: "we can meet in five in Appleton tower" },
  '044': { action: 'yes', task: 'Decide searchable items and build interface controls', notes: 'Conditional proposal; classified as intended work because it specifies deliverables.', evidence: 'you can give that to me and I’ll build a nice' },
  '045': { action: 'yes', task: 'Write up the meeting and send it to Pernilla', owner: 'Not specified', notes: 'First-person explicit follow-up; recipient is named.', evidence: "I'll write um I'll write this meeting up and I'll send it to Pernilla as well." },
  '046': { action: 'yes', task: 'Find a location for the event', notes: 'Explicit planning task; candidate locations discussed.', evidence: "we need to look at where we're gonna hold it." },
  '047': { action: 'no', notes: 'Closing instruction to go design, but no specific assigned task.' },
  '048': { action: 'no', notes: 'Design decision is reported as already made, not a future action.' },
  '049': { action: 'yes', task: 'Design one product with adaptable size and features', notes: 'Group design requirement stated as a plan.', evidence: 'we have to design one product' },
  '050': { action: 'no', notes: 'Offer to demonstrate a presentation in the current conversation; not a durable action item.' },
};

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

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

const source = await readFile(input, 'utf8');
const lines = source.trimEnd().split(/\r?\n/).filter(line => line.length > 0);
const headers = parseCsvLine(lines[0]).map(header => header.replace(/^\uFEFF/, ''));
const rows = lines.slice(1).map(line => Object.fromEntries(
  headers.map((header, index) => [header, parseCsvLine(line)[index] ?? '']),
) as Row);

const outputRows = rows.map(row => {
  const id = row.recordId.slice(-3);
  const decision = decisions[id];
  if (!decision) throw new Error(`Missing decision for ${row.recordId}`);
  const action = decision.action === 'yes';
  const requestedEvidence = decision.evidence ?? '';
  const evidence = action && requestedEvidence && row.transcript.includes(requestedEvidence)
    ? requestedEvidence
    : action
      ? row.transcript
      : '';
  const evidenceNote = action && evidence === row.transcript && requestedEvidence !== evidence
    ? ' Exact short evidence was disrupted by transcript disfluency; full source segment retained.'
    : '';
  return {
    ...row,
    isAction: decision.action,
    task: action ? decision.task ?? 'Not specified' : 'Not specified',
    owner: action ? decision.owner ?? 'Not specified' : 'Not specified',
    deadline: action ? decision.deadline ?? 'Not specified' : 'Not specified',
    riskLevel: decision.risk ?? 'LOW',
    riskCategory: decision.category ?? 'general',
    confirmationRequired: decision.confirmation ?? 'no',
    evidence,
    notes: `AI annotator 2: ${decision.notes}${evidenceNote}`,
  };
});

const outputHeaders = headers;
await writeFile(output, `${outputHeaders.map(csvEscape).join(',')}\n${outputRows.map(row => outputHeaders.map(header => csvEscape(row[header] ?? '')).join(',')).join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ output, rows: outputRows.length, actions: outputRows.filter(row => row.isAction === 'yes').length }, null, 2));
