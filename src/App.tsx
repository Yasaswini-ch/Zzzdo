import { useState } from 'react'
import Sloth from './sloth'
import { judge, type Lane, type Verdict } from './judge'

const lanes: { id: Lane; title: string }[] = [
  { id: 'today', title: 'Do Today' }, { id: 'delay', title: 'Delay' }, { id: 'drop', title: 'Drop' },
]
type Vote = 'agree' | 'nah'
type Votes = Record<string, Vote>

function readVotes(): Votes {
  try { return JSON.parse(localStorage.getItem('zzzdo-votes') ?? '{}') as Votes } catch { return {} }
}

function voteKey(items: Verdict[], index: number) {
  const task = items[index].task
  const occurrence = items.slice(0, index).filter((item) => item.task === task).length
  return `${task}\u001f${occurrence}`
}

export default function App() {
  const [text, setText] = useState(() => localStorage.getItem('zzzdo-tasks') ?? '')
  const [deadlineText, setDeadlineText] = useState(() => localStorage.getItem('zzzdo-deadlines') ?? '')
  const [results, setResults] = useState<Verdict[] | null>(null)
  const [votes, setVotes] = useState<Votes>(readVotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const taskLines = text.split('\n')
  const deadlineLines = deadlineText.split('\n')
  const entries = taskLines.map((task, index) => ({ task, deadline: deadlineLines[index]?.trim() ?? '' })).filter(({ task }) => task.trim().length > 0)
  const tasks = entries.map(({ task }) => task)
  const deadlines = entries.map(({ deadline }) => deadline)

  async function ask() {
    setLoading(true); setError(false)
    try { setResults(await judge(tasks, deadlines)) } catch { setError(true); setResults(null) } finally { setLoading(false) }
  }
  function clear() {
    setText(''); setDeadlineText(''); localStorage.removeItem('zzzdo-tasks'); localStorage.removeItem('zzzdo-deadlines'); localStorage.removeItem('zzzdo-votes')
    setVotes({}); setResults(null); setError(false)
  }
  function vote(key: string, value: Vote) {
    const next = { ...votes, [key]: value }
    setVotes(next); localStorage.setItem('zzzdo-votes', JSON.stringify(next))
  }
  function moveTask(index: number, lane: Lane) {
    setResults((current) => current?.map((item, itemIndex) => itemIndex === index ? { ...item, lane } : item) ?? null)
  }
  function exportResults() {
    if (!results) return
    const content = lanes.map(({ id, title }) => `${title}\n${results.filter((item) => item.lane === id).map((item) => `- ${item.task}\n  ${item.reason}`).join('\n')}`).join('\n\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'zzzdo-results.txt'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const currentVotes = results?.map((_, index) => votes[voteKey(results, index)]).filter(Boolean) ?? []
  const agreement = currentVotes.filter((value) => value === 'agree').length

  return <main className="app">
    <header className="masthead"><Sloth mood={loading ? 'thinking' : results ? 'done' : 'idle'} />
      <div><h1>Zzzdo</h1><p>A local AI that tells you what to drop.</p></div></header>
    <section className="input-panel"><label htmlFor="tasks">Your list</label>
      <textarea id="tasks" value={text} placeholder="One task per line. Be honest. The sloth has seen worse."
        onChange={(event) => { setText(event.target.value); localStorage.setItem('zzzdo-tasks', event.target.value) }} />
      <label htmlFor="deadlines" className="deadline-label">Optional deadlines, same order as tasks</label>
      <textarea id="deadlines" className="deadline-input" value={deadlineText} placeholder={'One date per task line, including blank lines. Leave blank if there is no deadline.\nExample: 2026-10-25'}
        onChange={(event) => { setDeadlineText(event.target.value); localStorage.setItem('zzzdo-deadlines', event.target.value) }} />
      <div className="actions"><button onClick={ask} disabled={!tasks.length || loading}>{loading ? 'zzz...' : 'Ask the sloth'}</button>
        <button className="quiet" onClick={clear}>Clear</button></div>
    </section>
    {error && <div className="error-card"><p>Ollama is not reachable. Run: ollama serve</p><p>Then: ollama pull gemma3:4b</p></div>}
    {results && <><div className="results-actions"><button onClick={exportResults}>Export .txt</button></div><section className="lanes" aria-label="Sorted tasks">{lanes.map(({ id, title }) => {
      const items = results.map((item, index) => ({ item, index, key: voteKey(results, index) })).filter(({ item }) => item.lane === id)
      const todayFull = results.filter((item) => item.lane === 'today').length >= 3
      return <div className={`lane lane-${id}`} key={id}><h2>{title} <span>{items.length}</span></h2>
        {items.map(({ item, index, key }) => <article className="task-card" key={key}>
          <p>{item.task}</p><small>{item.reason}</small>
          <label className="move-label" htmlFor={`lane-${index}`}>Move to</label>
          <select id={`lane-${index}`} value={item.lane} onChange={(event) => moveTask(index, event.target.value as Lane)}>
            {lanes.map((lane) => <option key={lane.id} value={lane.id} disabled={lane.id === 'today' && todayFull && item.lane !== 'today'}>{lane.title}</option>)}
          </select>
          <div className="vote-actions">
            <button className={votes[key] === 'agree' ? 'selected' : ''} aria-pressed={votes[key] === 'agree'} onClick={() => vote(key, 'agree')}>agree</button>
            <button className={votes[key] === 'nah' ? 'selected' : ''} aria-pressed={votes[key] === 'nah'} onClick={() => vote(key, 'nah')}>nah</button>
          </div>
        </article>)}
      </div>
    })}</section></>}
    {results && <p className="agreement">Sloth agreement: {agreement} of {currentVotes.length}</p>}
    <footer>Runs on your machine. Your list never leaves this tab.</footer>
  </main>
}
