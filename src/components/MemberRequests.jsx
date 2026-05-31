import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Mail, CreditCard, Sofa, Lock, CheckCircle, Clock, XCircle, AlertCircle, Loader, FileText } from 'lucide-react'

const ICARD_FEE = 50
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const REQUEST_TYPES = {
  experience_letter: {
    label: 'Experience Letter',
    icon: Mail,
    color: 'bg-blue-50 border-blue-300 text-blue-700',
    iconBg: 'bg-blue-100',
    desc: 'Request a letter certifying your membership',
    fee: null,
  },
  icard: {
    label: 'I-Card',
    icon: CreditCard,
    color: 'bg-purple-50 border-purple-300 text-purple-700',
    iconBg: 'bg-purple-100',
    desc: 'Request a new or replacement I-Card',
    fee: ICARD_FEE,
  },
  membership_certificate: {
    label: 'Membership Certificate',
    icon: FileText,
    color: 'bg-teal-50 border-teal-300 text-teal-700',
    iconBg: 'bg-teal-100',
    desc: 'Request membership certificate',
    fee: null,
  },
  seat_allotment: {
    label: 'Seat Allotment',
    icon: Sofa,
    color: 'bg-green-50 border-green-300 text-green-700',
    iconBg: 'bg-green-100',
    desc: 'Request allotment of a seat in the court hall',
    fee: null,
  },
  locker_allotment: {
    label: 'Locker Allotment',
    icon: Lock,
    color: 'bg-orange-50 border-orange-300 text-orange-700',
    iconBg: 'bg-orange-100',
    desc: 'Request allotment of a storage locker',
    fee: null,
  },
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700',       icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getFY() {
  const now = new Date()
  return now.getMonth() >= 3
    ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
    : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`
}

export default function MemberRequests() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedType, setSelectedType] = useState(null)

  useEffect(() => { if (member) fetchRequests() }, [member])

  async function fetchRequests() {
    const { data } = await supabase.from('dcba_member_requests')
      .select('*')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #2e5f8a)' }} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-blue-300 flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-white font-bold text-xl">Requests</h1>
            <button onClick={() => { setSelectedType(null); setShowAdd(true) }}
              className="bg-yellow-400 text-blue-900 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" /> New Request
            </button>
          </div>
        </div>
      </div>

      {/* Request type info cards */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(REQUEST_TYPES).map(([key, type]) => {
            const Icon = type.icon
            return (
              <button key={key}
                onClick={() => { setSelectedType(key); setShowAdd(true) }}
                className={`rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${type.color}`}>
                <div className={`w-8 h-8 rounded-lg ${type.iconBg} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="font-bold text-sm">{type.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{type.desc}</p>
                {type.fee && (
                  <p className="text-xs font-bold mt-1">Fee: ₹{type.fee}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Existing requests */}
      <div className="max-w-lg mx-auto px-4 pb-8 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request History</p>

        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No requests submitted yet</p>
            <p className="text-gray-400 text-xs mt-1">Use the cards above to submit a new request</p>
          </div>
        ) : requests.map(r => {
          const type = REQUEST_TYPES[r.request_type]
          const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
          const Icon = type?.icon || AlertCircle
          const StatusIcon = status.icon

          return (
            <div key={r.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${type?.iconBg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-800">{type?.label || r.request_type}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  {r.request_no && (
                    <p className="text-xs font-mono text-blue-600 mt-0.5">{r.request_no}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.request_date)}</p>

                  {/* Type-specific details */}
                  {r.request_type === 'experience_letter' && r.el_purpose && (
                    <p className="text-xs text-gray-500 mt-1">Purpose: {r.el_purpose}</p>
                  )}
                  {r.request_type === 'icard' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fee: ₹{r.icard_fee_amount} · {r.icard_fee_paid ? '✅ Paid' : '⏳ Payment pending'}
                    </p>
                  )}
                  {(r.request_type === 'seat_allotment' || r.request_type === 'locker_allotment') && r.preferred_location && (
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400 font-medium mb-1">Application:</p>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{r.preferred_location}</p>
                      <p className="text-xs text-gray-400 mt-1">{r.preferred_location.trim().split(/\s+/).filter(Boolean).length} words</p>
                    </div>
                  )}

                  {/* Admin remarks */}
                  {r.admin_remarks && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-700"><span className="font-semibold">Admin note:</span> {r.admin_remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* New Request Modal */}
      {showAdd && (
        <NewRequestModal
          member={member}
          preSelectedType={selectedType}
          onClose={() => { setShowAdd(false); setSelectedType(null) }}
          onSuccess={() => { setShowAdd(false); setSelectedType(null); fetchRequests() }}
        />
      )}
    </div>
  )
}

// ---- NEW REQUEST MODAL ----
function NewRequestModal({ member, preSelectedType, onClose, onSuccess }) {
  const [type, setType] = useState(preSelectedType || 'experience_letter')
  const [form, setForm] = useState({
    el_purpose: '',
    preferred_location: '',
    icard_payment_mode: 'cash',
    icard_transaction_ref: '',
  })
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)

  const currentType = REQUEST_TYPES[type]

  async function handleRazorpayIcard() {
    if (!RAZORPAY_KEY_ID) return toast.error('Payment gateway not configured')
    setPaying(true)
    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Failed to load payment gateway')
      setPaying(false)
      return
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: ICARD_FEE * 100,
      currency: 'INR',
      name: 'Dwarka Court Bar Association',
      description: 'I-Card Fee',
      prefill: {
        name: member.member_name,
        email: member.email || '',
        contact: member.mobile || '',
      },
      notes: {
        member_no: member.member_no,
        member_id: member.id,
        payment_for: 'icard',
      },
      theme: { color: '#1a3a5c' },
      modal: {
        ondismiss: () => {
          setPaying(false)
          toast('Payment cancelled', { icon: '⚠️' })
        }
      },
      handler: async function(response) {
        // Payment done — submit request with paid status
        await submitRequest(true, response.razorpay_payment_id)
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', function(response) {
      setPaying(false)
      toast.error(`Payment failed: ${response.error.description}`)
    })
    rzp.open()
    setPaying(false)
  }

  async function handleSubmit() {
    if (type === 'icard') {
      // I-Card always goes through Razorpay
      await handleRazorpayIcard()
      return
    }
    await submitRequest(false, null)
  }

  async function submitRequest(icardFeePaid = false, razorpayPaymentId = null) {
    // Validation
    if (type === 'experience_letter' && !form.el_purpose) return toast.error('Please enter the purpose')

    setSaving(true)
    try {
      const { count } = await supabase.from('dcba_member_requests')
        .select('*', { count: 'exact', head: true }).eq('org_id', member.org_id)
      const requestNo = `DCBA/REQ/${getFY()}/${String((count || 0) + 1).padStart(4, '0')}`

      const payload = {
        org_id: member.org_id,
        member_id: member.id,
        request_no: requestNo,
        request_type: type,
        request_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      }

      if (type === 'experience_letter') {
        payload.el_purpose = form.el_purpose
      }

      if (type === 'icard') {
        payload.icard_fee_amount = ICARD_FEE
        payload.icard_fee_paid = icardFeePaid
        payload.icard_payment_mode = icardFeePaid ? 'online' : 'pending'
        payload.icard_transaction_ref = razorpayPaymentId || null
      }

      if (type === 'seat_allotment' || type === 'locker_allotment') {
        payload.preferred_location = form.preferred_location || null
      }

      const { error } = await supabase.from('dcba_member_requests').insert(payload)
      if (error) throw error

      // If icard paid via Razorpay — record in razorpay_payments bucket
      if (type === 'icard' && icardFeePaid && razorpayPaymentId) {
        const today = new Date().toISOString().split('T')[0]
        const razorpayFee = Math.round(ICARD_FEE * 0.02 * 100) / 100
        await supabase.from('dcba_razorpay_payments').insert({
          org_id: member.org_id,
          member_id: member.id,
          razorpay_payment_id: razorpayPaymentId,
          amount: ICARD_FEE,
          payment_date: today,
          payment_for: 'icard',
          member_no: member.member_no,
          member_name: member.member_name,
          status: 'captured',
          fee_amount: razorpayFee,
          net_amount: ICARD_FEE - razorpayFee,
          settled: false,
        })
      }

      toast.success(`Request submitted! Ref: ${requestNo}`)
      onSuccess()
    } catch (err) {
      toast.error(err.message)
      setPaying(false)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">New Request</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Request type selector */}
          <div>
            <label className="label">Request Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(REQUEST_TYPES).map(([key, t]) => {
                const Icon = t.icon
                return (
                  <button key={key} onClick={() => setType(key)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${type === key ? `border-blue-500 bg-blue-50` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <Icon className={`w-4 h-4 mb-1 ${type === key ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`text-xs font-bold ${type === key ? 'text-blue-700' : 'text-gray-600'}`}>{t.label}</p>
                    {t.fee && <p className={`text-xs ${type === key ? 'text-blue-600' : 'text-gray-400'}`}>₹{t.fee}</p>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type-specific fields */}

          {/* Experience Letter */}
          {type === 'experience_letter' && (
            <div>
              <label className="label">Purpose *</label>
              <input className="input" value={form.el_purpose}
                onChange={e => setForm({ ...form, el_purpose: e.target.value })}
                placeholder="e.g. Bank loan, Visa application, Court proceedings..." />
              <p className="text-xs text-gray-400 mt-1">
                The letter will be issued by the Association on your request. Please collect from the office.
              </p>
            </div>
          )}

          {/* I-Card */}
          {type === 'icard' && (
            <div className="space-y-3">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-purple-800 mb-1">I-Card Fee: ₹{ICARD_FEE}</p>
                <p className="text-xs text-purple-600">Click "Submit & Pay" below to pay securely via Razorpay</p>
                <p className="text-xs text-purple-500 mt-1">UPI · Cards · Net Banking — all accepted</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-700">✅ Your I-Card request will be submitted immediately after successful payment. I-Card will be issued from DCBA office.</p>
              </div>
            </div>
          )}

          {/* Seat / Locker Allotment */}
          {(type === 'seat_allotment' || type === 'locker_allotment') && (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 text-sm ${REQUEST_TYPES[type].color}`}>
                <p className="font-semibold">
                  {type === 'seat_allotment'
                    ? '🪑 Seat allotment is subject to availability. Security deposit will be required at the time of allotment.'
                    : '🔒 Locker allotment is subject to availability. Security deposit will be required at the time of allotment.'}
                </p>
              </div>

              {/* Essay / Application */}
              <div>
                <label className="label">Application *</label>
                <textarea
                  className="input resize-none text-sm leading-relaxed"
                  style={{ height: '180px' }}
                  value={form.preferred_location}
                  onChange={e => setForm({ ...form, preferred_location: e.target.value })}
                  placeholder={type === 'seat_allotment'
                    ? `Write your application to the Bar Association explaining why you need a seat. Mention how frequently you appear in this court, the nature of your practice, and why a seat would benefit your work...`
                    : `Write your application to the Bar Association explaining why you need a locker. Mention how frequently you visit this court, the volume of case files you need to store, and how a locker would benefit your practice...`}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-400">Be specific — the committee reviews each application</p>
                  <p className={`text-xs font-medium ${
                    (() => {
                      const wc = form.preferred_location.trim().split(/\s+/).filter(Boolean).length
                      return wc < 50 ? 'text-red-400' : wc < 150 ? 'text-orange-400' : 'text-green-600'
                    })()
                  }`}>
                    {form.preferred_location.trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Member info banner */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {member?.member_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{member?.member_name}</p>
              <p className="text-xs text-gray-400">{member?.member_no} · {member?.enrollment_no || '—'}</p>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving || paying}
            className="btn-primary w-full py-3 text-base font-bold">
            {(saving || paying)
              ? <span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Processing...</span>
              : type === 'icard'
                ? `Submit & Pay ₹${ICARD_FEE} via Razorpay`
                : 'Submit Request'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
