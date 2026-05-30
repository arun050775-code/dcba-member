import { useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function Certificate() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const [purpose, setPurpose] = useState('')
  const [requestType, setRequestType] = useState('certificate')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleRequest() {
    if (!purpose) return toast.error('Please state the purpose')
    setSaving(true)
    try {
      const { error } = await supabase.from('certificate_requests').insert({
        org_id: member.org_id,
        member_id: member.id,
        member_no: member.member_no,
        member_name: member.member_name,
        purpose,
        request_type: requestType,
        status: 'pending',
      })
      if (error) throw error
      setSubmitted(true)
      toast.success('Request submitted!')
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
          <h1 className="text-white font-bold text-xl">Membership Certificate</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {submitted ? (
          <div className="card p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 text-sm">Your certificate request has been sent to DCBA office. Please collect the certificate from the office within 3-5 working days.</p>
            <button onClick={() => navigate('/')} className="btn-primary mt-6">Back to Home</button>
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Request Certificate</h2>
                <p className="text-xs text-gray-500">Physical certificate will be ready at office</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Member No.</span>
                <span className="font-semibold">{member?.member_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold">{member?.member_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Enrollment</span>
                <span className="font-semibold">{member?.enrollment_no}</span>
              </div>
            </div>

            <div>
              <label className="label">Purpose / Reason *</label>
              <textarea className="input h-24 resize-none" value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. For submission to court, For bank purpose, etc." />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
              ℹ️ Certificate will be issued after verification. Fees if any will be communicated by the office.
            </div>

            <button onClick={handleRequest} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
