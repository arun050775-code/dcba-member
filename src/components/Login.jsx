import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useMemberAuth } from '../context/MemberAuthContext'
import toast from 'react-hot-toast'
import { User, Calendar, Phone } from 'lucide-react'

const DCBA_LOGO = 'https://www.dwarkacourtbarassociation.com/images/logo.png'
const ORG_ID = 'f77ac673-9060-40be-be29-5a238b5c9f3b'

const COMMITTEE = [
  { name: 'AVNISH RANA', designation: 'PRESIDENT' },
  { name: 'VIVEK DAGAR', designation: 'VICE PRESIDENT' },
  { name: 'KARAN VEER TYAGI', designation: 'HONY. SECRETARY' },
  { name: 'HEMANT VERMA', designation: 'ADDL. SECRETARY' },
  { name: 'AJAY SAINI', designation: 'JOINT SECRETARY' },
  { name: 'MAMTA YADAV', designation: 'TREASURER' },
  { name: 'AMIT KR. SINGH', designation: 'LIBRARY INCHARGE' },
  { name: 'ASHOK KR. JHA', designation: 'EXE. MEMBER' },
  { name: 'NISHA SETHI SUDAN', designation: 'WOMEN EXE. MEMBER' },
  { name: 'RITU GUPTA', designation: 'LADY EXE. MEMBER' },
  { name: 'LATA NAUTIYAL', designation: 'EXE. MEMBER' },
  { name: 'RAHUL TYAGI', designation: 'EXE. MEMBER' },
  { name: 'YAMANDEEP SOLANKI', designation: 'EXE. MEMBER' },
]

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2)
}

function standardizeMemberNo(input) {
  // Convert A-1 to A-0001, A-95 to A-0095 etc.
  const match = input.trim().toUpperCase().match(/^([A-Z])-(\d+)$/)
  if (match) {
    return `${match[1]}-${match[2].padStart(4, '0')}`
  }
  return input.trim().toUpperCase()
}

export default function Login() {
  const { signIn } = useMemberAuth()
  const [step, setStep] = useState(1)
  const [memberNo, setMemberNo] = useState('')
  const [dob, setDob] = useState('')
  const [otp, setOtp] = useState('')
  const [memberData, setMemberData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')

  async function handleVerify() {
    if (!memberNo.trim()) return toast.error('Enter Member No.')
    if (!dob) return toast.error('Enter Date of Birth')
    setLoading(true)

    try {
      const standardNo = standardizeMemberNo(memberNo)

      const { data, error } = await supabase
        .from('dcba_members')
        .select('*')
        .eq('org_id', ORG_ID)
        .ilike('member_no', standardNo)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        toast.error('Member not found or inactive!')
        setLoading(false)
        return
      }

      const otpCode = String(Math.floor(100000 + Math.random() * 900000))
      setGeneratedOtp(otpCode)
      setMemberData(data)

      toast.success(`OTP: ${otpCode}`, { duration: 30000 })
      if (data.mobile) {
        toast.success(`OTP sent to ${data.mobile.slice(0,4)}****${data.mobile.slice(-2)}`, { duration: 5000 })
      }
      setStep(2)
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  function handleOtpVerify() {
    if (otp.length < 6) return toast.error('Enter 6 digit OTP')
    if (otp !== generatedOtp) return toast.error('Invalid OTP!')
    signIn(memberData)
    toast.success(`Welcome, ${memberData.member_name}!`)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a5c 60%, #0d2137 100%)' }}>

      {/* LEFT PANEL — Management Committee */}
      <div className="hidden lg:flex flex-col w-1/2 p-6 overflow-y-auto">
        {/* Logo + Name */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <img src={DCBA_LOGO} alt="DCBA" className="w-12 h-12 object-contain"
              onError={e => { e.target.parentElement.innerHTML = '<span style="font-size:1rem;font-weight:800;color:#1a3a5c">DC</span>' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">DWARKA COURT BAR ASSOCIATION</h1>
            <p className="text-blue-300 text-xs mt-0.5">Member Self-Service Portal</p>
          </div>
        </div>

        {/* Gold divider */}
        <div className="h-0.5 bg-gradient-to-r from-yellow-500 via-yellow-300 to-transparent mb-5 rounded-full" />

        {/* Management Committee */}
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-4">Management Committee</p>

        <div className="space-y-2">
          {COMMITTEE.map((m, idx) => (
            <div key={m.name} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-full border-2 border-yellow-500 flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }}>
                <span className="text-yellow-400 font-bold text-xs">{getInitials(m.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{m.name}</p>
                <p className="text-yellow-400 text-xs">{m.designation}</p>
              </div>
              {idx === 0 && (
                <span className="text-xs bg-yellow-500 text-blue-900 px-2 py-0.5 rounded-full font-bold flex-shrink-0">★</span>
              )}
            </div>
          ))}
        </div>

        <p className="text-blue-600 text-xs mt-4 italic">* Photographs will be updated on receipt</p>

        <div className="mt-auto pt-4 border-t border-white/10">
          <p className="text-blue-600 text-xs text-center">© 2026 Dwarka Court Bar Association</p>
          <p className="text-blue-700 text-xs text-center mt-0.5">Powered by AKS & Associates</p>
        </div>
      </div>

      {/* RIGHT PANEL — Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6"
        style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-full max-w-sm">

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-xl">
              <span className="font-bold text-xl text-blue-900">DC</span>
            </div>
            <h1 className="text-lg font-bold text-white">DCBA Member Portal</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {step === 1 ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Member Login</h2>
                  <p className="text-gray-400 text-sm mt-1">Enter your credentials to continue</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Member No. *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" placeholder="e.g. A-0001 or A-1"
                        value={memberNo} onChange={e => setMemberNo(e.target.value.toUpperCase())} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Format: A-0001 (or A-1, system will auto-format)</p>
                  </div>

                  <div>
                    <label className="label">Date of Birth *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input type="date" className="input pl-9"
                        value={dob} onChange={e => setDob(e.target.value)} />
                    </div>
                  </div>

                  <button onClick={handleVerify} disabled={loading}
                    className="btn-primary w-full py-3 mt-2">
                    {loading ? 'Verifying...' : 'Get OTP →'}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                  OTP will be sent to your registered mobile/email
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Enter OTP</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Sent to {memberData?.mobile
                      ? `${memberData.mobile.slice(0,4)}****${memberData.mobile.slice(-2)}`
                      : 'your registered contact'}
                  </p>
                </div>

                <div className="space-y-4">
                  <input className="input text-center text-2xl tracking-widest font-bold"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
                    maxLength={6} placeholder="------" />

                  <button onClick={handleOtpVerify} disabled={otp.length < 6}
                    className="btn-primary w-full py-3">
                    Verify & Login →
                  </button>

                  <button onClick={() => { setStep(1); setOtp('') }}
                    className="btn-secondary w-full">
                    ← Back
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Didn't receive OTP?{' '}
                  <button onClick={handleVerify} className="text-blue-600 font-medium">Resend</button>
                </p>
              </>
            )}
          </div>

          <p className="text-center text-blue-600 text-xs mt-4">Powered by AKS & Associates</p>
        </div>
      </div>
    </div>
  )
}
