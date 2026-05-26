import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Bell, Pin, Paperclip, AlertTriangle, Calendar, FileText, Megaphone, Building2, Scale } from 'lucide-react'

const CAT_CONFIG = {
  general: { label: 'General', color: 'bg-blue-100 text-blue-700', icon: Bell },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  meeting: { label: 'Meeting', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  holiday: { label: 'Holiday', color: 'bg-green-100 text-green-700', icon: Calendar },
  election: { label: 'Election', color: 'bg-yellow-100 text-yellow-700', icon: Megaphone },
  circular: { label: 'Circular', color: 'bg-gray-100 text-gray-700', icon: FileText },
  court_notice: { label: 'Court Notice', color: 'bg-blue-100 text-blue-800', icon: Building2 },
  bar_council: { label: 'Bar Council', color: 'bg-indigo-100 text-indigo-700', icon: Scale },
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'circular', label: 'Circular' },
  { id: 'court_notice', label: '🏛️ Court Notice' },
  { id: 'bar_council', label: '⚖️ Bar Council' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MemberNotices() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => { if (member) fetchNotices() }, [member])

  async function fetchNotices() {
    const { data } = await supabase.from('notices').select('*')
      .eq('org_id', member.org_id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotices(data || [])
    setLoading(false)
  }

  const filtered = activeTab === 'all' ? notices : notices.filter(n => n.category === activeTab)

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-blue-300 flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-xl">Notice Board</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex px-4 py-1 gap-1 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notices in this category</p>
          </div>
        ) : filtered.map(n => {
          const cat = CAT_CONFIG[n.category] || CAT_CONFIG.general
          const CatIcon = cat.icon
          return (
            <div key={n.id} className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${n.is_pinned ? 'border-l-4 border-l-yellow-400' : ''}`}
              onClick={() => setSelected(n)}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                  <CatIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.is_pinned && <Pin className="w-3 h-3 text-yellow-500" />}
                    <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{formatDate(n.created_at)}</span>
                    {n.attachment_url && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <Paperclip className="w-3 h-3" /> Attachment
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-500 mt-1">Click here to view full notice →</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDate(selected.created_at)}</span>
                {selected.expiry_date && <span>· Expires: {formatDate(selected.expiry_date)}</span>}
                {selected.posted_by_name && <span>· By: {selected.posted_by_name}</span>}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.content}</p>
              {selected.attachment_url && (
                <a href={selected.attachment_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <Paperclip className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">{selected.attachment_name || 'Attachment'}</p>
                    <p className="text-xs text-blue-500">Click to view/download</p>
                  </div>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded uppercase">{selected.attachment_type}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
