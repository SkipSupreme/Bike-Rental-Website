export default function BikeIcon({ className = '', type = 'default' }) {
  // Different bike SVGs based on type
  if (type === 'mountain') {
    return (
      <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
        <circle cx="20" cy="45" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
        <circle cx="80" cy="45" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
        <path d="M20 45 L35 25 L50 45 L35 45 Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M50 45 L65 25 L80 45" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M35 25 L65 25" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M65 25 L70 18" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="50" cy="45" r="3" fill="currentColor"/>
      </svg>
    )
  }

  if (type === 'road') {
    return (
      <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
        <circle cx="18" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="82" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M18 42 L40 25 L55 42 L40 42 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M55 42 L70 25 L82 42" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M40 25 L70 25" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M70 25 L80 20 L75 18" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="55" cy="42" r="2" fill="currentColor"/>
      </svg>
    )
  }

  if (type === 'electric') {
    return (
      <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
        <circle cx="20" cy="45" r="11" fill="none" stroke="currentColor" strokeWidth="3"/>
        <circle cx="80" cy="45" r="11" fill="none" stroke="currentColor" strokeWidth="3"/>
        <path d="M20 45 L38 28 L50 45 L38 45 Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M50 45 L62 28 L80 45" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M38 28 L62 28" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <rect x="42" y="30" width="16" height="8" rx="2" fill="currentColor" opacity="0.7"/>
        <path d="M62 28 L68 22" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="50" cy="45" r="3" fill="currentColor"/>
        <path d="M48 34 L52 30 L50 34 L54 30" stroke="#FFD700" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  }

  if (type === 'tandem') {
    return (
      <svg viewBox="0 0 120 60" fill="currentColor" className={className}>
        <circle cx="15" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="105" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M15 42 L30 28 L45 42" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M45 42 L60 28 L75 42" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M75 42 L90 28 L105 42" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M30 28 L90 28" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M90 28 L95 22" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="45" cy="42" r="2.5" fill="currentColor"/>
        <circle cx="75" cy="42" r="2.5" fill="currentColor"/>
      </svg>
    )
  }

  if (type === 'kids') {
    return (
      <svg viewBox="0 0 80 50" fill="currentColor" className={className}>
        <circle cx="15" cy="35" r="10" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="65" cy="35" r="10" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M15 35 L28 22 L40 35 L28 35 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M40 35 L52 22 L65 35" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M28 22 L52 22" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M52 22 L56 16" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="40" cy="35" r="2" fill="currentColor"/>
        <rect x="35" y="10" width="8" height="3" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    )
  }

  if (type === 'trailer') {
    return (
      <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
        <circle cx="70" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <rect x="20" y="22" width="40" height="25" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M60 35 L70 35" stroke="currentColor" strokeWidth="2"/>
        <circle cx="35" cy="47" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="45" cy="47" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 35 L20 35" stroke="currentColor" strokeWidth="2"/>
        <circle cx="10" cy="35" r="3" fill="currentColor"/>
      </svg>
    )
  }

  // Default cruiser/hybrid
  return (
    <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
      <circle cx="20" cy="42" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
      <circle cx="80" cy="42" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M20 42 L38 25 L50 42 L38 42 Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M50 42 L62 25 L80 42" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M38 25 L62 25" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M62 25 L65 18" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="50" cy="42" r="3" fill="currentColor"/>
    </svg>
  )
}
