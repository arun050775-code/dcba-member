import { useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, Camera, Save, Lock, Sofa, Building, Phone, Mail, MapPin, AlertCircle, Calendar, Hash, User } from 'lucide-react'
import { getPhotoUrl, handlePhotoError } from '../utils/photoUrl'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${MONTHS[dt.getMonth()]}-${dt.getFullYear()}`
}

export default function Profile() {
  const { member, signIn } = useMemberAuth()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(getPhotoUrl(member?.member_no || ''))
  const [editable, setEditable] = useState({
    residential: member?.address || '',
    office: member?.office || '',
    mobile: member?.mobile || '',
    email: member?.email || '',
  })

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('Photo must be under 2MB')
    setUploading(true)
    try {
      const filename = `${member.member_no}.png`
      const { error } = await supabase.storage
        .from('member-photos')
        .upload(filename, file, { upsert: true, contentType: 'image/png' })
      if (error) throw error
      setPhotoUrl(`https://xalbjrmridjgdpguobdx.supabase.co/storage/v1/object/public/member-photos/${filename}?t=${Date.now()}`)
      toast.success('Photo updated!')
    } catch (err) {
      toast.error(err.message)
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('dcba_members').update({
        address: editable.residential,
        office: editable.office,
        mobile: editable.mobile,
        email: editable.email,
      }).eq('id', member.id)
      if (error) throw error
      signIn({ ...member, address: editable.residential, office: editable.office, mobile: editable.mobile, email: editable.email })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const hasAllotments = member?.chamber || member?.locker_no || member?.seat_no

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-blue-300 flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-xl">My Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-4">

        {/* Photo Upload — Prominent */}
        <div className="card p-6 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
              <img src={photoUrl} alt={member?.member_name}
                className="w-full h-full object-cover"
                onError={e => handlePhotoError(e, member?.member_no, member?.member_name?.split(' ').map(n=>n[0]).join('').slice(0,2))}
              />
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white hover:bg-yellow-500 transition-colors">
              {uploading
                ? <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-5 h-5 text-blue-900" />
              }
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <p className="font-bold text-gray-800 text-xl">{member?.member_name}</p>
          <p className="text-blue-700 font-semibold text-sm mt-1">{member?.member_no}</p>
          <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">✓ Active Member</span>
          {/* Prominent photo instruction */}
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 flex items-center gap-2">
            <Camera className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-800 font-medium">Tap the camera icon on your photo to update it</p>
          </div>
        </div>

        {/* Member Details */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" /> Membership Details
          </h3>
          <div className="space-y-0">
            {[
              { label: 'Member No.', value: member?.member_no },
              { label: 'Father/Husband Name', value: member?.father_name },
              { label: 'Enrollment No.', value: member?.enrollment_no },
              { label: 'Membership Date', value: formatDate(member?.membership_date) },
              { label: 'Date of Birth', value: member?.dob ? formatDate(member?.dob) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <span className="text-sm font-semibold text-gray-700">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Allotments — only if assigned */}
        {hasAllotments && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Allotments</h3>
            <div className="space-y-0">
              {member?.chamber && (
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500 font-medium">Chamber No.</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{member.chamber}</span>
                </div>
              )}
              {member?.locker_no && (
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-500 font-medium">Locker No.</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">{member.locker_no}</span>
                </div>
              )}
              {member?.seat_no && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <Sofa className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500 font-medium">Seat</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {member.hall_no ? `${member.hall_no} · ` : ''}Seat {member.seat_no}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editable fields */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" /> Contact & Address
            <span className="text-blue-500 font-normal normal-case text-xs ml-1">(editable)</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Mobile</label>
              <input className="input text-sm" value={editable.mobile}
                onChange={e => setEditable({ ...editable, mobile: e.target.value })}
                placeholder="10 digit mobile" />
            </div>
            <div>
              <label className="label text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              <input className="input text-sm" value={editable.email}
                onChange={e => setEditable({ ...editable, email: e.target.value })}
                placeholder="email@example.com" />
            </div>
            <div>
              <label className="label text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Office Address</label>
              <textarea className="input text-sm h-16 resize-none" value={editable.office}
                onChange={e => setEditable({ ...editable, office: e.target.value })}
                placeholder="Office address" />
            </div>
            <div>
              <label className="label text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Residential Address</label>
              <textarea className="input text-sm h-16 resize-none" value={editable.residential}
                onChange={e => setEditable({ ...editable, residential: e.target.value })}
                placeholder="Residential address" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Prominent official details notice */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Need to update official details?</p>
            <p className="text-xs text-amber-700 mt-1">For changes to your name, enrollment no., or other official details — please visit the DCBA office in person.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
