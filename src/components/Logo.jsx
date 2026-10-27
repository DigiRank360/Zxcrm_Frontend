import logo from '../assets/logo.png'
import logoDark from '../assets/logo-dark.png'

// `onDark` forces the light-text variant for permanently dark surfaces (e.g. the login hero).
export default function Logo({ className = 'h-9', onDark = false }) {
  return (
    <>
      {!onDark && <img src={logo} alt="ZxSolar Energies" className={`logo-light w-auto object-contain ${className}`} />}
      <img src={logoDark} alt={onDark ? 'ZxSolar Energies' : ''} aria-hidden={!onDark} className={`${onDark ? '' : 'logo-dark'} w-auto object-contain ${className}`} style={onDark ? undefined : { display: 'none' }} />
    </>
  )
}
