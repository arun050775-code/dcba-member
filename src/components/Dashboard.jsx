import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { User, IndianRupee, Bell, AlertCircle, FileText, ChevronRight, Camera, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${MONTHS[dt.getMonth()]}-${dt.getFullYear()}`
}

export default function Dashboard() {
  const { member, signOut } = useMemberAuth()
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [grievances, setGrievances] = useState([])
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)

  const photoBaseUrl = 'https://xalbjrmridjgdpguobdx.supabase.co/storage/v1/object/public/member-photos'

  useEffect(() => {
    if (member) {
      fetchData()
      setPhotoUrl(`${photoBaseUrl}/${member.member_no}.png`)
    }
  }, [member])

  async function fetchData() {
    const [{ data: noticeData }, { data: grievanceData }] = await Promise.all([
      supabase.from('notices').select('*')
        .eq('org_id', member.org_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
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
      // Always save as member_no.png for consistency
      const filename = `${member.member_no}.png`
      const { error } = await supabase.storage
        .from('member-photos')
        .upload(filename, file, { 
          upsert: true,
          contentType: 'image/png'
        })
      if (error) throw error
      
      // Force refresh URL with timestamp
      const newUrl = `${photoBaseUrl}/${filename}?t=${Date.now()}`
      setPhotoUrl(newUrl)
      toast.success('Photo updated successfully!')
    } catch (err) {
      toast.error(err.message)
    }
    setUploading(false)
  }

  const hasOutstanding = Number(member?.outstanding_fees) > 0
  const statusColor = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* News Ticker */}
      {notices.length > 0 && (
        <div style={{ background: '#C8960C' }} className="px-0 py-1.5 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-0.5 flex items-center gap-1">
              <Bell className="w-3 h-3" /> NOTICES
            </div>
            <div className="overflow-hidden flex-1">
              <div className="ticker-wrap">
                <p className="ticker-text text-xs font-semibold text-[#1a3a5c] whitespace-nowrap"
                  style={{ animation: 'ticker 20s linear infinite' }}>
                  {notices.map((n, i) => (
                    <span key={n.id}>
                      {n.is_pinned ? '📌 ' : '• '}{n.title}
                      {i < notices.length - 1 ? '     ◆     ' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticker CSS */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-text { display: inline-block; }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-16">
        <div className="max-w-lg mx-auto flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-300 text-xs uppercase tracking-widest">DCBA Member Portal</p>
            <h1 className="text-white font-bold text-lg">Welcome, {member?.member_name?.split(' ')[0]}!</h1>
          </div>
          <button onClick={() => { signOut(); navigate('/') }}
            className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Profile card */}
        <div className="max-w-lg mx-auto bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400">
              <img src={photoUrl} alt={member?.member_name}
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;background:#1a3a5c;display:flex;align-items:center;justify-content:center;color:#f5c842;font-weight:800;font-size:1.2rem">${member?.member_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>`
                }}
              />
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center cursor-pointer shadow-md">
              {uploading ? (
                <div className="w-3 h-3 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-blue-900" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">{member?.member_name}</p>
            <p className="text-blue-200 text-xs">{member?.member_no}</p>
            <p className="text-blue-300 text-xs">{member?.enrollment_no}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${member?.status === 'active' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
              {member?.status === 'active' ? '✓ Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 pb-8 space-y-4">

        {/* Fee Status Card */}
        <div className={`card p-4 ${hasOutstanding ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasOutstanding ? 'bg-red-100' : 'bg-green-100'}`}>
                <IndianRupee className={`w-5 h-5 ${hasOutstanding ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Fee Status</p>
                <p className="text-xs text-gray-500">
                  {hasOutstanding ? `Outstanding: ₹${Number(member?.outstanding_fees).toLocaleString('en-IN')}` : 'All dues clear ✓'}
                </p>
              </div>
            </div>
            {hasOutstanding && (
              <button onClick={() => navigate('/dues')}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium">
                Pay Now
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'My Profile', icon: User, path: '/profile', color: 'bg-blue-50 text-blue-700' },
            { label: 'Dues & Fees', icon: IndianRupee, path: '/dues', color: 'bg-green-50 text-green-700' },
            { label: 'Grievances', icon: AlertCircle, path: '/grievances', color: 'bg-red-50 text-red-700' },
            { label: 'Notice Board', icon: Bell, path: '/notices', color: 'bg-yellow-50 text-yellow-700' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.label} onClick={() => navigate(item.path)}
                className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Recent Notices */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" /> Latest Notices
            </h3>
            <button onClick={() => navigate('/notices')} className="text-xs text-blue-600 font-medium">View all →</button>
          </div>
          {notices.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No notices yet</p>
          ) : notices.map(n => (
            <div key={n.id} className="flex items-start gap-3 py-2.5 border-b last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-400">{formatDate(n.created_at)}</p>
              </div>
              {n.is_pinned && <span className="text-xs">📌</span>}
            </div>
          ))}
        </div>

        {/* Recent Grievances */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> My Grievances
            </h3>
            <button onClick={() => navigate('/grievances')} className="text-xs text-blue-600 font-medium">View all →</button>
          </div>
          {grievances.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No grievances filed yet</p>
          ) : grievances.map(g => (
            <div key={g.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{g.ticket_no}</p>
                <p className="text-xs text-gray-400 truncate max-w-48">{g.subject}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[g.status] || 'bg-gray-100 text-gray-600'}`}>
                {g.status?.replace('_', ' ')}
              </span>
            </div>
          ))}
          <button onClick={() => navigate('/grievances/new')}
            className="mt-3 w-full text-center text-xs text-red-600 font-medium border border-red-200 rounded-xl py-2 hover:bg-red-50">
            + File New Grievance
          </button>
        </div>

        {/* Certificate Request */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Membership Certificate</p>
              <p className="text-xs text-gray-400">Request physical certificate</p>
            </div>
          </div>
          <button onClick={() => navigate('/certificate')}
            className="text-purple-600 hover:bg-purple-50 p-2 rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
