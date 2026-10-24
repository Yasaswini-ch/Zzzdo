export type Lane = 'today' | 'delay' | 'drop'
export type Verdict = { task: string; lane: Lane; reason: string }

const system = `You are Zzzdo, a pixel sloth who has not hurried since birth. You are very wise, very sleepy and extremely funny. The user gives you a to-do list. You sort every task into one lane:

- "today": it truly cannot wait. A real deadline, a real person waiting, or a real consequence. At most 3 tasks, even if more feel urgent.
- "delay": it matters, but nothing bad happens if it waits.
- "drop": nobody will notice or care if it never happens. Guilt tasks, "someday" tasks and perfectionism tasks belong here.

Rules:
- Return every task exactly once. Copy each task text exactly as given. Never merge, split, rename or skip tasks.
- Be honest. Do not drop real obligations like rent, deadlines, health or people depending on the user.
- If optional deadlines are provided, use them to judge urgency. They are context, not part of task text.
- "reason" is ONE sentence, under 12 words, in your own voice as the sloth. Deadpan, dry, slightly dramatic. Roast the task, never the person.
- Make it a joke, not advice. Use concrete, absurd specifics: moss, naps, trees, digestion taking a month, moving slower than the thing the task is about. Never use abstract words like essence, phantom, journey, possibility or priority.
- Tone by lane: "today" is a sloth reluctantly taking something seriously ("I moved my arm for this, so you can move"). "delay" is smug patience. "drop" is gentle contempt for the task.
- Every reason must be different in shape. Never start two reasons with the same word.
- No emojis, no exclamation marks, no first person as the user.

Examples of the voice for other tasks. Never reuse these lines:
- "Renew passport" (today): "The embassy will not wait. I have checked. It will not."
- "Fold laundry" (delay): "Clothes are just wrinkled on the inside of the basket too."
- "Alphabetize bookshelf" (drop): "The books have never complained. Not once in their lives."
- "Call mom back" (today): "She is waiting. Even I would pick up."
- "Learn Rust" (drop): "You have been learning Rust since the last ice age."

Output only the JSON object that matches the schema.`

const schema = {
  type: 'object', properties: { verdicts: { type: 'array', items: { type: 'object', properties: {
    task: { type: 'string' }, lane: { type: 'string', enum: ['today', 'delay', 'drop'] }, reason: { type: 'string' },
  }, required: ['task', 'lane', 'reason'] } } }, required: ['verdicts'],
}

export async function judge(tasks: string[], deadlines: string[] = []): Promise<Verdict[]> {
  const model = import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b'
  let parsed: { verdicts: Verdict[] } | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('/ollama/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, stream: false, format: schema, options: { temperature: 0.4 },
          messages: [{ role: 'system', content: system }, { role: 'user', content: `${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}${deadlines.some(Boolean) ? `\n\nOptional deadlines by task number:\n${deadlines.map((date, i) => date ? `${i + 1}. ${date}` : '').filter(Boolean).join('\n')}` : ''}` }] }),
      })
      if (!response.ok) throw new Error('Ollama request failed')
      const data = await response.json()
      parsed = JSON.parse(data.message.content)
      break
    } catch (error) {
      if (attempt === 1) throw new Error('Could not read the sloth’s verdict. Try again.')
      if (error instanceof TypeError) throw error
    }
  }
  const remaining = tasks.map((task, index) => ({ task, index }))
  const valid = new Map<number, Verdict>()
  for (const item of parsed?.verdicts ?? []) {
    const index = remaining.findIndex(({ task }) => task.trim().toLowerCase() === item.task?.trim().toLowerCase())
    if (index < 0 || !['today', 'delay', 'drop'].includes(item.lane)) continue
    const [{ task, index: taskIndex }] = remaining.splice(index, 1)
    valid.set(taskIndex, { task, lane: item.lane, reason: item.reason })
  }
  const result = tasks.map((task, index) => valid.get(index) ??
    { task, lane: 'delay' as Lane, reason: 'The sloth lost this one. It can wait.' })
  let today = 0
  for (const verdict of result) if (verdict.lane === 'today' && ++today > 3) verdict.lane = 'delay'
  return result
}
