import { useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, MapPin, Building2, Calendar } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${MONTHS[dt.getMonth()]}-${dt.getFullYear()}`
}

export default function Profile() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()

  const photoUrl = `https://xalbjrmridjgdpguobdx.supabase.co/storage/v1/object/public/member-photos/${member?.member_no}.png`

  const details = [
    { label: 'Member No.', value: member?.member_no, icon: User },
    { label: 'Full Name', value: member?.member_name, icon: User },
    { label: 'Father/Husband Name', value: member?.father_name, icon: User },
    { label: 'Enrollment No.', value: member?.enrollment_no, icon: User },
    { label: 'Date of Birth', value: formatDate(member?.dob), icon: Calendar },
    { label: 'Membership Date', value: formatDate(member?.membership_date), icon: Calendar },
    { label: 'Mobile', value: member?.mobile, icon: Phone },
    { label: 'Email', value: member?.email, icon: Mail },
    { label: 'Address', value: member?.address || member?.residential, icon: MapPin },
    { label: 'Chamber No.', value: member?.chamber, icon: Building2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-blue-300 flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-xl">My Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 pb-8">
        {/* Photo */}
        <div className="card p-6 mb-4 text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 mx-auto mb-3 shadow-lg">
            <img src={photoUrl} alt={member?.member_name}
              className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;background:#1a3a5c;display:flex;align-items:center;justify-content:center;color:#f5c842;font-weight:800;font-size:1.5rem">${member?.member_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>`
              }}
            />
          </div>
          <p className="font-bold text-gray-800 text-lg">{member?.member_name}</p>
          <p className="text-gray-500 text-sm">{member?.member_no}</p>
          <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            ✓ Active Member
          </span>
        </div>

        {/* Details */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Member Details</h3>
          <div className="space-y-3">
            {details.filter(d => d.value && d.value !== '—').map(d => {
              const Icon = d.icon
              return (
                <div key={d.label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{d.label}</p>
                    <p className="text-sm text-gray-800 font-medium">{d.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          To update your details, please contact the DCBA office
        </p>
      </div>
    </div>
  )
}
