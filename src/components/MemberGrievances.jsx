import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, AlertCircle, Plus, Wrench, Users, MessageSquare } from 'lucide-react'

const STATUS_COLOR = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const CATEGORIES = {
  infrastructure: { label: 'Infrastructure', icon: Wrench, subcategories: ['Fan not working','AC not working','Light/Electrical issue','Toilet/Washroom issue','Internet/WiFi issue','Water supply issue','Library issue','Cleanliness issue','Other infrastructure'] },
  member: { label: 'Member Complaint', icon: Users, subcategories: ['Misconduct','Misbehaviour','Chamber dispute','Harassment','Other member complaint'] },
  admin: { label: 'Administrative', icon: MessageSquare, subcategories: ['Fee related','Receipt issue','Membership issue','General suggestion','Other'] },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MemberGrievances() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category: 'infrastructure', subcategory: '', subject: '', description: '', against_member_no: '', against_member_name: '', priority: 'normal' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (member) fetchGrievances() }, [member])

  async function fetchGrievances() {
    const { data } = await supabase.from('grievances').select('*')
      .eq('org_id', member.org_id)
      .eq('complainant_member_no', member.member_no)
      .order('created_at', { ascending: false })
    setGrievances(data || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.subject) return toast.error('Subject required')
    setSaving(true)
    try {
      const { count } = await supabase.from('grievances').select('*', { count: 'exact', head: true }).eq('org_id', member.org_id)
      const fy = new Date().getMonth() >= 3 ? `${new Date().getFullYear()}-${String(new Date().getFullYear()+1).slice(2)}` : `${new Date().getFullYear()-1}-${String(new Date().getFullYear()).slice(2)}`
      const ticketNo = `DCBA/GRV/${fy}/${String((count||0)+1).padStart(4,'0')}`

      const { error } = await supabase.from('grievances').insert({
        org_id: member.org_id,
        ticket_no: ticketNo,
        category: form.category,
        subcategory: form.subcategory,
        subject: form.subject,
        description: form.description,
        complainant_name: member.member_name,
        complainant_member_no: member.member_no,
        against_member_no: form.against_member_no || null,
        against_member_name: form.against_member_name || null,
        priority: form.priority,
        status: 'open',
      })
      if (error) throw error
      toast.success(`Grievance filed! Ticket: ${ticketNo}`)
      setShowAdd(false)
      fetchGrievances()
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-blue-300 flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-white font-bold text-xl">Requests & Grievances</h1>
            <button onClick={() => setShowAdd(true)}
              className="bg-yellow-400 text-blue-900 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : grievances.length === 0 ? (
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No grievances filed yet</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-4 btn-primary text-sm">File a Grievance</button>
          </div>
        ) : grievances.map(g => (
          <div key={g.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-blue-700 font-bold">{g.ticket_no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[g.status]}`}>
                    {g.status?.replace('_',' ')}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{g.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(g.created_at)} · {CATEGORIES[g.category]?.label}</p>
                {g.admin_remarks && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-xs text-green-700">Admin: {g.admin_remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">File Grievance</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORIES).map(([key, cat]) => {
                    const Icon = cat.icon
                    return (
                      <button key={key} onClick={() => setForm({...form, category: key, subcategory: ''})}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${form.category === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <p className="text-xs font-medium">{cat.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label">Sub-category</label>
                <select className="input" value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})}>
                  <option value="">Select</option>
                  {CATEGORIES[form.category]?.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {form.category === 'member' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Against Member No.</label>
                    <input className="input" value={form.against_member_no} onChange={e => setForm({...form, against_member_no: e.target.value})} placeholder="A-001" />
                  </div>
                  <div>
                    <label className="label text-xs">Against Name</label>
                    <input className="input" value={form.against_member_name} onChange={e => setForm({...form, against_member_name: e.target.value})} />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Priority</label>
                <div className="flex gap-2">
                  {[['normal','Normal'],['urgent','Urgent'],['critical','Critical']].map(([v,l]) => (
                    <button key={v} onClick={() => setForm({...form, priority: v})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.priority === v ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-500 border-gray-200'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Subject *</label>
                <input className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Brief subject" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input h-20 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Details..." />
              </div>

              <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full py-3">
                {saving ? 'Filing...' : 'Submit Grievance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
