import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, IndianRupee, CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const ANNUAL_FEE = 600
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

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

function getFY() {
  const now = new Date()
  return now.getMonth() >= 3
    ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
    : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`
}

// Load Razorpay script dynamically
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

export default function Dues() {
  const { member, signIn } = useMemberAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => { if (member) fetchPayments() }, [member])

  async function fetchPayments() {
    const { data } = await supabase.from('dcba_member_fees')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_date', { ascending: false })
      .limit(20)
    setPayments(data || [])
    setLoading(false)
  }

  const totalDue = Number(member?.outstanding_fees || 0)
  const hasOutstanding = totalDue > 0
  const nextDueDate = getNextDueDate(member?.membership_date)

  async function handleRazorpay(amount, label) {
    if (!RAZORPAY_KEY_ID) {
      toast.error('Payment gateway not configured')
      return
    }
    setPaying(true)
    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Failed to load payment gateway. Check internet connection.')
      setPaying(false)
      return
    }

    // Generate order reference
    const orderRef = `DCBA-${member.member_no}-${Date.now()}`

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // paise
      currency: 'INR',
      name: 'Dwarka Court Bar Association',
      description: `Annual Subscription — ${label}`,
      order_id: '', // No server-side order creation needed for Standard Checkout
      prefill: {
        name: member.member_name,
        email: member.email || '',
        contact: member.mobile || '',
      },
      notes: {
        member_no: member.member_no,
        member_id: member.id,
        org_id: member.org_id,
        payment_for: label,
        order_ref: orderRef,
      },
      theme: { color: '#1a3a5c' },
      modal: {
        ondismiss: () => {
          setPaying(false)
          toast('Payment cancelled', { icon: '⚠️' })
        }
      },
      handler: async function(response) {
        // Payment successful
        await handlePaymentSuccess(response, amount, label)
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

  async function handlePaymentSuccess(response, amount, label) {
    setPaying(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const fy = getFY()

      // Receipt number from timestamp — no DB query needed
      const receiptNo = `DCBA/ONL/${fy}/${Date.now().toString().slice(-6)}`

      // 1. Record in dcba_member_fees
      const { data: feeData, error: feeError } = await supabase.from('dcba_member_fees').insert({
        member_id: member.id,
        org_id: member.org_id,
        fee_type: 'annual',
        amount: amount,
        payment_date: today,
        payment_mode: 'online',
        receipt_no: receiptNo,
        transaction_id: response.razorpay_payment_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || null,
        razorpay_signature: response.razorpay_signature || null,
        status: 'completed',
        description: `Annual Subscription — ${label}`,
      }).select().single()
      if (feeError) throw feeError

      // 2. Record in dcba_razorpay_payments (daily bucket)
      const razorpayFee = Math.round(amount * 0.02 * 100) / 100
      await supabase.from('dcba_razorpay_payments').insert({
        org_id: member.org_id,
        member_id: member.id,
        member_fee_id: feeData?.id || null,
        razorpay_payment_id: response.razorpay_payment_id,
        amount: amount,
        payment_date: today,
        payment_for: 'annual',
        member_no: member.member_no,
        member_name: member.member_name,
        status: 'captured',
        fee_amount: razorpayFee,
        net_amount: amount - razorpayFee,
        settled: false,
      })

      // 3. Update member: clear outstanding, update last paid date
      const newOutstanding = Math.max(0, totalDue - amount)
      const { error: memberError } = await supabase.from('dcba_members').update({
        outstanding_fees: newOutstanding,
        last_fee_paid_date: today,
        annual_fee_paid: true,
      }).eq('id', member.id)
      if (memberError) throw memberError

      // 4. Update local session
      signIn({ ...member, outstanding_fees: newOutstanding, last_fee_paid_date: today, annual_fee_paid: true })

      toast.success(`Payment successful! ₹${amount} paid. Receipt: ${receiptNo}`, { duration: 5000 })
      fetchPayments()
    } catch (err) {
      toast.error('Payment recorded but update failed. Please contact office. Ref: ' + response.razorpay_payment_id)
      console.error(err)
    }
    setPaying(false)
  }

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

        {/* Main fee status card */}
        <div className={`card p-5 ${hasOutstanding ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasOutstanding ? 'bg-red-100' : 'bg-green-100'}`}>
              {hasOutstanding ? <XCircle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {hasOutstanding ? 'Outstanding Dues' : 'All dues clear ✓'}
              </p>
              {hasOutstanding
                ? <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString('en-IN')}</p>
                : <p className="text-sm text-green-600">Next renewal: {nextDueDate ? formatDate(nextDueDate) : '—'}</p>
              }
            </div>
          </div>

          {/* Payment buttons - outstanding */}
          {hasOutstanding && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRazorpay(totalDue, 'Outstanding dues')}
                  disabled={paying}
                  className="bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold text-center disabled:opacity-60 flex flex-col items-center justify-center gap-0.5">
                  {paying ? <Loader className="w-4 h-4 animate-spin" /> : <>
                    <span>Pay Outstanding</span>
                    <span className="text-xs font-normal">₹{totalDue.toLocaleString('en-IN')}</span>
                  </>}
                </button>
                <button
                  onClick={() => handleRazorpay(ANNUAL_FEE, 'Annual subscription FY ' + getFY())}
                  disabled={paying}
                  className="bg-[#1a3a5c] text-white rounded-xl py-3 text-sm font-semibold text-center disabled:opacity-60 flex flex-col items-center justify-center gap-0.5">
                  {paying ? <Loader className="w-4 h-4 animate-spin" /> : <>
                    <span>Pay Full Year</span>
                    <span className="text-xs font-normal">₹{ANNUAL_FEE}</span>
                  </>}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Secure payment via Razorpay · UPI, Cards, Net Banking accepted
              </p>
            </div>
          )}

          {/* Advance payment - when clear */}
          {!hasOutstanding && (
            <div className="space-y-2">
              <button
                onClick={() => handleRazorpay(ANNUAL_FEE, 'Advance Annual subscription FY ' + getFY())}
                disabled={paying}
                className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold text-center disabled:opacity-60">
                {paying
                  ? <Loader className="w-4 h-4 animate-spin mx-auto" />
                  : <>
                    Pay in Advance for Next Year<br />
                    <span className="text-xs font-normal">
                      ₹{ANNUAL_FEE} — valid till {nextDueDate
                        ? formatDate(new Date(nextDueDate.getFullYear() + 1, nextDueDate.getMonth(), nextDueDate.getDate()))
                        : '—'}
                    </span>
                  </>
                }
              </button>
              <p className="text-xs text-gray-400 text-center">
                Secure payment via Razorpay · UPI, Cards, Net Banking accepted
              </p>
            </div>
          )}
        </div>

        {/* Next renewal */}
        {member?.membership_date && (
          <div className="card p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Annual Renewal Date</p>
              <p className="text-xs text-gray-500">
                {(() => {
                  const d = new Date(member.membership_date)
                  return `${String(d.getDate()).padStart(2,'0')}-${MONTHS[d.getMonth()]} every year`
                })()}
              </p>
              <p className="text-xs text-orange-600 font-medium mt-0.5">
                Next due: {nextDueDate ? formatDate(nextDueDate) : '—'}
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
                <p className="text-xs text-gray-400">
                  {formatDate(p.payment_date)} · {p.payment_mode === 'online' ? '💳 Online' : p.payment_mode?.toUpperCase()}
                  {p.transaction_id ? ` · ${p.transaction_id}` : ''}
                </p>
              </div>
              <p className="text-green-600 font-bold text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
