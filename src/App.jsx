import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { BarChart2, LineChart, Brain, Menu, Plus, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function KpiTile({ label, value, accent = 'text-orange-400' }) {
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
      <div className="text-slate-400 text-xs uppercase tracking-widest">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  )
}

function Sidebar({ onNewTrade }) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-slate-950/70 backdrop-blur border-r border-slate-800 p-4 gap-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600" />
        <div className="font-semibold text-slate-100">Inferno Core</div>
      </div>
      <nav className="text-slate-300/90 space-y-1">
        <a href="#dashboard" className="block px-3 py-2 rounded-lg hover:bg-slate-800/60">Dashboard</a>
        <a href="#journal" className="block px-3 py-2 rounded-lg hover:bg-slate-800/60">Journal</a>
        <a href="#analytics" className="block px-3 py-2 rounded-lg hover:bg-slate-800/60">Analytics</a>
        <a href="#sentinel" className="block px-3 py-2 rounded-lg hover:bg-slate-800/60">Sentinel Core</a>
      </nav>
      <div className="mt-auto" />
      <button onClick={onNewTrade} className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg">
        <Plus size={18} /> New Trade
      </button>
      <Link to="/test" className="text-xs text-slate-500 hover:text-slate-300 mt-2">System Test</Link>
    </aside>
  )
}

function Hero() {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-800">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/cEecEwR6Ehj4iT8T/scene.splinecode" />
      </div>
      <div className="relative z-10 h-full flex items-center bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent">
        <div className="p-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-100 tracking-tight">Inferno Core Trading Journal</h1>
          <p className="text-slate-300 mt-2 max-w-2xl">Discipline-first, performance-obsessed journal for multi-asset momentum swing traders. Optimize stops and exits with MAE/MFE analytics and get objective coaching from Sentinel Core.</p>
          <div className="mt-4 flex items-center gap-3">
            <a href="#journal" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg">Log a Trade</a>
            <a href="#analytics" className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg border border-slate-700">View Analytics</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function DisciplineGauge({ score }) {
  const color = score >= 80 ? 'text-orange-400' : score >= 60 ? 'text-amber-400' : 'text-red-500'
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
      <div className="text-slate-400 text-xs uppercase tracking-widest">Discipline Score</div>
      <div className={`mt-2 text-4xl font-bold ${color}`}>{score}</div>
      <div className="text-slate-400 text-xs mt-1">0-100</div>
    </div>
  )
}

function useAnalytics(userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`${BACKEND_URL}/api/analytics/summary?user_id=${userId}&period_days=90`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [userId])
  return { data, loading }
}

function useChecklist(userId){
  const [cl, setCl] = useState(null)
  useEffect(()=>{
    if(!userId) return
    fetch(`${BACKEND_URL}/api/checklist/${userId}`).then(r=>r.json()).then(setCl)
  },[userId])
  return cl
}

function NewTradeModal({ open, onClose, userId, onCreated }){
  const cl = useChecklist(userId)
  const [form, setForm] = useState({
    asset_class: 'stock', side: 'long', timeframe: '1D', ticker_pair: '', entry: '', planned_stop: '', planned_target: '', strategy_tags: [], thesis: '', exit_strategy: ''
  })
  const [checked, setChecked] = useState({})
  const allRequiredChecked = useMemo(()=>{
    if(!cl) return false
    const required = cl.items?.filter(i=>i.required).map(i=>i.id) || []
    return required.every(id => !!checked[id])
  }, [cl, checked])

  const submit = async () => {
    if(!allRequiredChecked) return
    const payload = {
      user_id: userId,
      asset_class: form.asset_class,
      ticker_pair: form.ticker_pair,
      side: form.side,
      entry: parseFloat(form.entry),
      planned_stop: parseFloat(form.planned_stop),
      planned_target: form.planned_target ? parseFloat(form.planned_target) : null,
      timeframe: form.timeframe,
      strategy_tags: form.strategy_tags,
      plan: { thesis: form.thesis, exit_strategy: form.exit_strategy },
      checklist_state: (cl?.items||[]).map(i=>({ item_id: i.id, checked: !!checked[i.id] }))
    }
    const res = await fetch(`${BACKEND_URL}/api/trades`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
    if(res.ok){ onCreated(); onClose(); }
    else { const err = await res.json(); alert('Checklist/Validation: ' + JSON.stringify(err)) }
  }

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="font-semibold text-slate-100">New Trade</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <select value={form.asset_class} onChange={e=>setForm(f=>({...f, asset_class: e.target.value}))} className="col-span-1 bg-slate-800 border border-slate-700 text-slate-100 rounded px-2 py-2">
                <option value="stock">Stock</option>
                <option value="crypto">Crypto</option>
                <option value="forex">Forex</option>
              </select>
              <input placeholder="Ticker/Pair" value={form.ticker_pair} onChange={e=>setForm(f=>({...f, ticker_pair: e.target.value}))} className="col-span-2 bg-slate-800 border border-slate-700 text-slate-100 rounded px-3 py-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select value={form.side} onChange={e=>setForm(f=>({...f, side: e.target.value}))} className="bg-slate-800 border border-slate-700 text-slate-100 rounded px-2 py-2">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
              <input type="number" step="0.0001" placeholder="Entry" value={form.entry} onChange={e=>setForm(f=>({...f, entry: e.target.value}))} className="col-span-1 bg-slate-800 border border-slate-700 text-slate-100 rounded px-3 py-2" />
              <input type="number" step="0.0001" placeholder="Planned Stop" value={form.planned_stop} onChange={e=>setForm(f=>({...f, planned_stop: e.target.value}))} className="col-span-1 bg-slate-800 border border-slate-700 text-slate-100 rounded px-3 py-2" />
            </div>
            <input type="number" step="0.0001" placeholder="Planned Target (optional)" value={form.planned_target} onChange={e=>setForm(f=>({...f, planned_target: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded px-3 py-2" />
            <div>
              <div className="text-slate-300 text-sm mb-2">Pre-Trade Checklist</div>
              <div className="space-y-2">
                {cl?.items?.map(item=> (
                  <label key={item.id} className="flex items-center gap-3 text-slate-200">
                    <input type="checkbox" checked={!!checked[item.id]} onChange={e=>setChecked(c=>({...c, [item.id]: e.target.checked}))} className="w-4 h-4 accent-orange-500" />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <textarea placeholder="Thesis / Why I am entering" value={form.thesis} onChange={e=>setForm(f=>({...f, thesis: e.target.value}))} className="w-full h-28 bg-slate-800 border border-slate-700 text-slate-100 rounded px-3 py-2" />
            <textarea placeholder="Exit Strategy / Target Plan" value={form.exit_strategy} onChange={e=>setForm(f=>({...f, exit_strategy: e.target.value}))} className="w-full h-28 bg-slate-800 border border-slate-700 text-slate-100 rounded px-3 py-2" />
            <button disabled={!allRequiredChecked} onClick={submit} className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${allRequiredChecked ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'}`}>
              <CheckCircle2 size={18} /> Open Trade
            </button>
            {!allRequiredChecked && <p className="text-xs text-red-400">Complete all required checklist items to submit.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function TradesTable({ userId, onClosed }){
  const [trades, setTrades] = useState([])
  const [closing, setClosing] = useState(null)
  const load = async () => {
    const r = await fetch(`${BACKEND_URL}/api/trades?user_id=${userId}`)
    const j = await r.json(); setTrades(j)
  }
  useEffect(()=>{ load() },[])

  const closeTrade = async (t) => {
    const exit = prompt('Exit price?'); if(!exit) return
    const payload = { exit_price: parseFloat(exit), execution_rating: 4, discipline_rating: 4, learnings: 'Auto note' }
    setClosing(t._id)
    const r = await fetch(`${BACKEND_URL}/api/trades/${t._id}/close`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    setClosing(null)
    if(r.ok){ await load(); onClosed && onClosed() }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-slate-800 text-slate-300">Open Trades</div>
      <div className="divide-y divide-slate-800">
        {trades.filter(t=>t.status==='open').map(t => (
          <div key={t._id} className="p-3 flex items-center justify-between text-slate-200">
            <div className="flex items-center gap-4">
              <div className="text-slate-400 text-xs uppercase">{t.asset_class}</div>
              <div className="font-semibold">{t.ticker_pair}</div>
              <div className="text-slate-400">{t.side.toUpperCase()}</div>
              <div className="text-slate-400">Entry {t.entry}</div>
              <div className="text-slate-400">Stop {t.planned_stop}</div>
            </div>
            <button onClick={()=>closeTrade(t)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50" disabled={closing===t._id}>
              {closing===t._id ? 'Closing...' : 'Close' }
            </button>
          </div>
        ))}
        {trades.filter(t=>t.status==='open').length===0 && (
          <div className="p-4 text-slate-500">No open trades.</div>
        )}
      </div>
    </div>
  )
}

function SentinelPanel({ userId }){
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const analyze = async () => {
    setLoading(true)
    const r = await fetch(`${BACKEND_URL}/api/sentinel/analyze`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId, last_n: 10 })})
    const j = await r.json(); setResult(j); setLoading(false)
  }
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-slate-200 font-semibold">Sentinel Core</div>
        <button onClick={analyze} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg disabled:opacity-60" disabled={loading}>{loading?'Analyzing...':'Analyze Last 10 Trades'}</button>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <div className="text-slate-300">{result.summary}</div>
          <ul className="list-disc list-inside text-slate-400">
            {result.findings?.map((f,i)=>(<li key={i}>{f}</li>))}
          </ul>
          <div className="text-slate-300 font-medium">Recommendations</div>
          <ul className="list-disc list-inside text-slate-400">
            {result.recommendations?.map((f,i)=>(<li key={i}>{f}</li>))}
          </ul>
        </div>
      )}
    </div>
  )
}

function App() {
  const userId = 'demo-user'
  const [showNewTrade, setShowNewTrade] = useState(false)
  const { data: analytics } = useAnalytics(userId)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="md:flex">
        <Sidebar onNewTrade={()=>setShowNewTrade(true)} />
        <main className="flex-1 p-4 md:p-8 space-y-6">
          <Hero />

          {/* KPI Row */}
          <section id="dashboard" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiTile label="Win Rate" value={`${analytics?.win_rate ?? '--'}%`} />
            <KpiTile label="Avg R (Win)" value={analytics?.avg_r_win ?? '--'} />
            <KpiTile label="Avg R (Loss)" value={analytics?.avg_r_loss ?? '--'} accent="text-red-400" />
            <DisciplineGauge score={analytics?.discipline_score ?? 0} />
          </section>

          {/* Journal */}
          <section id="journal" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TradesTable userId={userId} onClosed={()=>{}} />
            </div>
            <div className="md:col-span-1">
              <SentinelPanel userId={userId} />
            </div>
          </section>

          {/* Analytics placeholder */}
          <section id="analytics" className="grid grid-cols-1 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <LineChart size={18} />
                <div className="font-semibold">P&L Curve (R)</div>
              </div>
              <div className="text-slate-500 text-sm mt-2">Interactive charts to be added. Summary equity values: {analytics?.equity_curve?.slice(-6)?.join(', ') || '—'}</div>
            </div>
          </section>
        </main>
      </div>

      <NewTradeModal open={showNewTrade} onClose={()=>setShowNewTrade(false)} userId={userId} onCreated={()=>{}} />
    </div>
  )
}

export default App
