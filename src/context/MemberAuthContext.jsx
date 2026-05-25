import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const MemberAuthContext = createContext({})
export const useMemberAuth = () => useContext(MemberAuthContext)

export function MemberAuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing session
    const saved = localStorage.getItem('dcba_member_session')
    if (saved) {
      try {
        setMember(JSON.parse(saved))
      } catch {}
    }
    setLoading(false)
  }, [])

  function signIn(memberData) {
    localStorage.setItem('dcba_member_session', JSON.stringify(memberData))
    setMember(memberData)
  }

  function signOut() {
    localStorage.removeItem('dcba_member_session')
    setMember(null)
  }

  return (
    <MemberAuthContext.Provider value={{ member, loading, signIn, signOut }}>
      {children}
    </MemberAuthContext.Provider>
  )
}
