const BASE = 'https://xalbjrmridjgdpguobdx.supabase.co/storage/v1/object/public/member-photos'

export function getPhotoUrl(memberNo) {
  return `${BASE}/${memberNo}.png`
}

// Get old format: A-0003 -> A-3
export function getOldFormatNo(memberNo) {
  const match = memberNo?.match(/^([A-Z])-0*(\d+)$/)
  if (match) return `${match[1]}-${parseInt(match[2])}`
  return memberNo
}

// onError handler — tries old format first, then initials
export function handlePhotoError(e, memberNo, initials) {
  const oldNo = getOldFormatNo(memberNo)
  const oldUrl = `${BASE}/${oldNo}.png`
  
  if (e.target.src.includes(oldNo) || oldNo === memberNo) {
    e.target.style.display = 'none'
    e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;background:#1a3a5c;display:flex;align-items:center;justify-content:center;color:#f5c842;font-weight:800;font-size:1.2rem">${initials}</div>`
    return
  }
  e.target.src = oldUrl
}
