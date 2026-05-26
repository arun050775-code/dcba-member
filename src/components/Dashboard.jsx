import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { User, IndianRupee, Bell, AlertCircle, FileText, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPhotoUrl, handlePhotoError } from '../utils/photoUrl'

const DCBA_LOGO = 'https://www.dwarkacourtbarassociation.com/images/logo.png'
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${MONTHS[dt.getMonth()]}-${dt.getFullYear()}`
}

function getNextDueDate(membershipDate) {
  if (!membershipDate) return null
  const d = new Date(membershipDate)
  const today = new Date()
  const nextDue = new Date(today.getFullYear(), d.getMonth(), d.getDate())
  if (nextDue <= today) nextDue.setFullYear(today.getFullYear() + 1)
  return nextDue
}

export default function Dashboard() {
  const { member, signOut } = useMemberAuth()
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [grievances, setGrievances] = useState([])
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(getPhotoUrl(member?.member_no || ''))

  useEffect(() => { if (member) fetchData() }, [member])

  async function fetchData() {
    const [{ data: noticeData }, { data: grievanceData }] = await Promise.all([
      supabase.from('notices').select('*')
        .eq('org_id', member.org_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('grievances').select('*')
        .eq('org_id', member.org_id)
        .eq('complainant_member_no', member.member_no)
        .order('created_at', { ascending: false })
        .limit(3),
    ])
    setNotices(noticeData || [])
    setGrievances(grievanceData || [])
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('Photo must be under 2MB')
    setUploading(true)
    try {
      const filename = `${member.member_no}.png`
      const { error } = await supabase.storage.from('member-photos')
        .upload(filename, file, { upsert: true, contentType: 'image/png' })
      if (error) throw error
      setPhotoUrl(`https://xalbjrmridjgdpguobdx.supabase.co/storage/v1/object/public/member-photos/${filename}?t=${Date.now()}`)
      toast.success('Photo updated!')
    } catch (err) {
      toast.error(err.message)
    }
    setUploading(false)
  }

  const hasOutstanding = Number(member?.outstanding_fees) > 0
  const nextDue = getNextDueDate(member?.membership_date)

  const statusColor = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  }

  const QUICK_ACTIONS = [
    { label: 'View Profile', path: '/profile', icon: User, color: 'text-blue-600' },
    { label: 'Update Contact', path: '/profile', icon: User, color: 'text-blue-600' },
    { label: 'Dues & Fees', path: '/dues', icon: IndianRupee, color: 'text-green-600' },
    { label: 'File Grievance', path: '/grievances', icon: AlertCircle, color: 'text-red-600' },
    { label: 'Notice Board', path: '/notices', icon: Bell, color: 'text-yellow-600' },
    { label: 'Certificate / I-Card', path: '/certificate', icon: FileText, color: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <img src={DCBA_LOGO} alt="DCBA" className="w-6 h-6 object-contain"
                onError={e => { e.target.parentElement.innerHTML = '<span style="font-size:0.6rem;font-weight:800;color:#1a3a5c">DC</span>' }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">DWARKA COURT BAR ASSOCIATION</p>
              <p className="text-blue-300 text-xs">Member Self-Service Portal</p>
            </div>
          </div>
          <button onClick={() => { signOut(); navigate('/') }}
            className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/20">
            Logout →
          </button>
        </div>
      </div>

      {/* News Ticker */}
      {notices.length > 0 && (
        <div style={{ background: '#C8960C' }} className="overflow-hidden">
          <div className="flex items-center max-w-5xl mx-auto">
            <div className="flex-shrink-0 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1">
              <Bell className="w-3 h-3" /> NOTICES
            </div>
            <div className="overflow-hidden flex-1 px-3">
              <p className="text-xs font-semibold text-[#1a3a5c] whitespace-nowrap"
                style={{ animation: 'ticker 16.7s linear infinite', display: 'inline-block' }}>
                {notices.map((n, i) => (
                  <span key={n.id}>
                    <span className="cursor-pointer hover:underline" onClick={() => setSelectedNotice(n)}>
                      {n.is_pinned ? '📌 ' : '• '}{n.title}
                      <span className="font-normal"> — Click here to view full notice</span>
                    </span>
                    {i < notices.length - 1 ? '     ◆     ' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Status Bar — maroon */}
      <div style={{ background: '#8B0000' }} className="px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 flex-wrap">
          <div className="text-white text-xs">
            <span className="text-red-300">Membership Status: </span>
            <span className="font-bold text-green-300">Active</span>
          </div>
          <div className="text-white text-xs">
            <span className="text-red-300">Member Since: </span>
            <span className="font-bold">{formatDate(member?.membership_date)}</span>
          </div>
          <div className="text-white text-xs">
            <span className="text-red-300">Annual Fee: </span>
            <span className={`font-bold ${hasOutstanding ? 'text-yellow-300' : 'text-green-300'}`}>
              {hasOutstanding ? `Outstanding ₹${Number(member?.outstanding_fees).toLocaleString('en-IN')}` : `Paid till ${nextDue ? formatDate(nextDue) : '—'}`}
            </span>
          </div>
          <div className="text-white text-xs">
            <span className="text-red-300">Enrollment: </span>
            <span className="font-bold">{member?.enrollment_no || '—'}</span>
          </div>
          <div className="text-white text-xs">
            <span className="text-red-300">Next Renewal: </span>
            <span className="font-bold">{nextDue ? formatDate(nextDue) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-4">

          {/* LEFT SIDEBAR */}
          <div className="w-52 flex-shrink-0 space-y-3">

            {/* Profile card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-yellow-400 shadow-md">
                  <img src={photoUrl} alt={member?.member_name}
                    className="w-full h-full object-cover"
                    onError={e => handlePhotoError(e, member?.member_no, member?.member_name?.split(' ').map(n=>n[0]).join('').slice(0,2))}
                  />
                </div>
              </div>
              <p className="font-bold text-gray-800 text-sm leading-tight">{member?.member_name}</p>
              <p className="text-blue-700 text-xs font-semibold mt-1">Member ({member?.member_no})</p>
              {member?.mobile && <p className="text-gray-500 text-xs mt-0.5">Mob: {member.mobile}</p>}
              {member?.email && <p className="text-gray-500 text-xs mt-0.5 truncate">{member.email}</p>}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon
                return (
                  <button key={i} onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${action.color}`} />
                    <span className="text-xs text-gray-700 font-medium">{action.label}</span>
                  </button>
                )
              })}
            </div>

          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 space-y-4">

            {/* Welcome banner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="font-bold text-[#1a3a5c] text-lg">Welcome, {member?.member_name?.split(' ')[0]}!</h2>
              <p className="text-gray-500 text-sm mt-0.5">Dwarka Court Bar Association — Member Portal</p>
              {hasOutstanding && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-red-700 text-sm font-medium">
                    ⚠️ Outstanding dues: ₹{Number(member?.outstanding_fees).toLocaleString('en-IN')}
                  </p>
                  <button onClick={() => navigate('/dues')}
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg font-medium">
                    View →
                  </button>
                </div>
              )}
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'My Profile', desc: 'View & update details', icon: User, path: '/profile', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { label: 'Dues & Fees', desc: 'Check & pay fees', icon: IndianRupee, path: '/dues', color: 'bg-green-50 border-green-200 text-green-700' },
                { label: 'Grievances', desc: 'File & track', icon: AlertCircle, path: '/grievances', color: 'bg-red-50 border-red-200 text-red-700' },
                { label: 'Notice Board', desc: 'Circulars & notices', icon: Bell, path: '/notices', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                { label: 'Certificate', desc: 'Request certificate', icon: FileText, path: '/certificate', color: 'bg-purple-50 border-purple-200 text-purple-700' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <button key={item.label} onClick={() => navigate(item.path)}
                    className={`rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${item.color}`}>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{item.desc}</p>
                  </button>
                )
              })}
            </div>

            {/* Latest Notices */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-500" /> Latest Notices
                </h3>
                <button onClick={() => navigate('/notices')} className="text-xs text-blue-600 font-medium">View all →</button>
              </div>
              {notices.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No notices yet</p>
              ) : notices.slice(0, 4).map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedNotice(n)}>
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-blue-500">Click here to view full notice</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                  </div>
                  {n.is_pinned && <span className="text-xs flex-shrink-0">📌</span>}
                </div>
              ))}
            </div>

            {/* My Grievances */}
            {grievances.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" /> My Grievances
                  </h3>
                  <button onClick={() => navigate('/grievances')} className="text-xs text-blue-600 font-medium">View all →</button>
                </div>
                {grievances.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                    <div>
                      <p className="text-xs font-mono font-bold text-blue-700">{g.ticket_no}</p>
                      <p className="text-sm font-medium text-gray-700">{g.subject}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[g.status] || 'bg-gray-100 text-gray-600'}`}>
                      {g.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
              <h3 className="font-bold text-gray-800">{selectedNotice.title}</h3>
              <button onClick={() => setSelectedNotice(null)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>📅 {formatDate(selectedNotice.created_at)}</span>
                {selectedNotice.posted_by_name && <span>👤 {selectedNotice.posted_by_name}</span>}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNotice.content}</p>
              {selectedNotice.attachment_url && (
                <a href={selectedNotice.attachment_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <span className="text-blue-600 text-sm font-medium">📎 {selectedNotice.attachment_name || 'View Attachment'}</span>
                  <span className="text-xs text-blue-400 ml-auto">Click to open →</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
