import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, IndianRupee, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${MONTHS[dt.getMonth()]}-${dt.getFullYear()}`
}

export default function Dues() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (member) fetchPayments()
  }, [member])

  async function fetchPayments() {
    const { data } = await supabase.from('dcba_member_fees')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_date', { ascending: false })
      .limit(20)
    setPayments(data || [])
    setLoading(false)
  }

  const hasOutstanding = Number(member?.outstanding_fees) > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-blue-300 flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-xl">Dues & Fees</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-4">
        {/* Fee Status */}
        <div className={`card p-5 ${hasOutstanding ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasOutstanding ? 'bg-red-100' : 'bg-green-100'}`}>
              {hasOutstanding ? <XCircle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
            <div>
              <p className="font-bold text-gray-800">{hasOutstanding ? 'Outstanding Dues' : 'All Clear!'}</p>
              {hasOutstanding ? (
                <p className="text-2xl font-bold text-red-600">₹{Number(member?.outstanding_fees).toLocaleString('en-IN')}</p>
              ) : (
                <p className="text-sm text-green-600">All dues paid ✓</p>
              )}
            </div>
          </div>
          {hasOutstanding && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
              ⚠️ Please visit DCBA office to pay your dues. Online payment coming soon!
            </div>
          )}
        </div>

        {/* Fee breakdown */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Fee Structure</h3>
          <div className="space-y-2">
            {[
              { label: 'Admission Fee (One-time)', amount: '₹600', paid: member?.admission_fee_paid },
              { label: 'Annual Subscription', amount: '₹600/year', paid: member?.annual_fee_paid },
              { label: 'I-Card Fee (One-time)', amount: '₹50', paid: member?.icard_issued },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  {f.paid
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                  }
                  <span className="text-sm text-gray-700">{f.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{f.amount}</p>
                  <p className={`text-xs ${f.paid ? 'text-green-600' : 'text-red-500'}`}>
                    {f.paid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Annual due date */}
        {member?.membership_date && (
          <div className="card p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Annual Renewal Date</p>
              <p className="text-xs text-gray-500">
                {(() => {
                  const d = new Date(member.membership_date)
                  return `${String(d.getDate()).padStart(2,'0')}-${MONTHS[d.getMonth()]} every year`
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Payment history */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Payment History</h3>
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No payment records found</p>
          ) : payments.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">{p.fee_type} fee</p>
                <p className="text-xs text-gray-400">{formatDate(p.payment_date)} · {p.payment_mode?.toUpperCase()}</p>
              </div>
              <p className="text-green-600 font-bold text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
