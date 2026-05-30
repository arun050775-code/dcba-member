import { useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, Camera, Save } from 'lucide-react'
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
        mobile: editable.mobile,
        email: editable.email,
      }).eq('id', member.id)
      if (error) throw error

      // Update local session
      signIn({ ...member, address: editable.residential, mobile: editable.mobile, email: editable.email })
      toast.success('Profile updated!')
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
          <h1 className="text-white font-bold text-xl">My Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-4">

        {/* Photo Upload */}
        <div className="card p-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
              <img src={photoUrl} alt={member?.member_name}
                className="w-full h-full object-cover"
                onError={e => handlePhotoError(e, member?.member_no, member?.member_name?.split(' ').map(n=>n[0]).join('').slice(0,2))}
              />
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center cursor-pointer shadow-md">
              {uploading
                ? <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-blue-900" />
              }
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <p className="font-bold text-gray-800 text-lg">{member?.member_name}</p>
          <p className="text-gray-500 text-sm">{member?.member_no}</p>
          <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">✓ Active Member</span>
          <p className="text-xs text-gray-400 mt-2">Tap camera icon to update photo</p>
        </div>

        {/* Non-editable details */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Member Details</h3>
          <div className="space-y-2">
            {[
              ['Member No.', member?.member_no],
              ['Father/Husband Name', member?.father_name],
              ['Enrollment No.', member?.enrollment_no],
              ['Membership Date', formatDate(member?.membership_date)],
              ['DOB', member?.dob ? formatDate(member?.dob) : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <span className="text-xs font-semibold text-gray-700">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Court Allotments — read only */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Court Allotments</h3>
          <div className="space-y-2">
            {/* Chamber */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Chamber No.</p>
                  <p className="text-xs text-gray-500">Allotted by Court Authority</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${member?.chamber ? 'text-blue-700' : 'text-gray-400'}`}>
                {member?.chamber || 'Not allotted'}
              </span>
            </div>

            {/* Locker */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Locker No.</p>
                  <p className="text-xs text-gray-500">Allotted by DCBA</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${member?.locker_no ? 'text-green-700' : 'text-gray-400'}`}>
                {member?.locker_no || 'Not allotted'}
              </span>
            </div>

            {/* Seat */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪑</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Seat</p>
                  <p className="text-xs text-gray-500">Allotted by DCBA</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${member?.seat_no ? 'text-green-700' : 'text-gray-400'}`}>
                {member?.seat_no
                  ? `${member.hall_no ? member.hall_no + ' · ' : ''}Seat ${member.seat_no}`
                  : 'Not allotted'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            To request allotment — go to <span className="text-blue-600 font-medium">Requests</span> section
          </p>
        </div>

        {/* Editable fields */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Contact & Address <span className="text-blue-500 font-normal normal-case">(editable)</span></h3>
          <div className="space-y-3">
            {[
              { label: 'Mobile', key: 'mobile', placeholder: '10 digit mobile' },
              { label: 'Email', key: 'email', placeholder: 'email@example.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="label text-xs">{f.label}</label>
                <input className="input text-sm" value={editable[f.key]}
                  onChange={e => setEditable({ ...editable, [f.key]: e.target.value })}
                  placeholder={f.placeholder} />
              </div>
            ))}

            <div>
              <label className="label text-xs">Residential Address</label>
              <textarea className="input text-sm h-16 resize-none" value={editable.residential}
                onChange={e => setEditable({ ...editable, residential: e.target.value })}
                placeholder="Residential address" />
            </div>

            {/* Chamber & Office — read-only info */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">Chamber & Office Address</p>
              <p className="text-xs text-gray-500">{member?.chamber || '—'}</p>
              {member?.office && <p className="text-xs text-gray-500 mt-1">{member.office}</p>}
              <p className="text-xs text-blue-500 mt-1">Contact office to update chamber/office address</p>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          For changes to name, enrollment no. or other official details — please contact DCBA office
        </p>
      </div>
    </div>
  )
}
