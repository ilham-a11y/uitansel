// Ilustrasi pohon tumbuh dengan anak-anak di bawahnya. Dipakai di halaman masuk & beranda.
export default function TreeArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 420" className={className} role="img" aria-label="Ilustrasi pohon yang tumbuh bersama anak-anak">
      <defs>
        <linearGradient id="canopy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      {/* Latar lingkaran lembut */}
      <circle cx="240" cy="210" r="196" fill="#d1fae5" opacity="0.55" />
      <circle cx="240" cy="210" r="150" fill="#ecfdf5" />

      {/* Matahari */}
      <g className="animate-float" style={{ animationDuration: '9s' }}>
        <circle cx="384" cy="92" r="54" fill="#fef3c7" opacity="0.8" />
        <circle cx="384" cy="92" r="34" fill="url(#sunGlow)" />
      </g>

      {/* Awan */}
      <g fill="#ffffff" opacity="0.95" className="animate-float" style={{ animationDuration: '11s' }}>
        <rect x="58" y="78" width="104" height="28" rx="14" />
        <circle cx="90" cy="78" r="18" />
        <circle cx="120" cy="72" r="22" />
      </g>
      <g fill="#ffffff" opacity="0.8" className="animate-float" style={{ animationDuration: '13s', animationDelay: '-4s' }}>
        <rect x="300" y="150" width="74" height="22" rx="11" />
        <circle cx="326" cy="150" r="13" />
      </g>

      {/* Bukit belakang & depan */}
      <path d="M0 300 C90 262 170 276 240 296 C320 318 390 276 480 296 V420 H0 Z" fill="#86efac" opacity="0.55" />
      <path d="M0 340 C110 310 190 332 260 346 C330 360 400 330 480 340 V420 H0 Z" fill="#4ade80" opacity="0.38" />

      {/* Batang */}
      <path d="M228 340 C226 300 222 270 232 228 L250 228 C260 270 256 300 254 340 Z" fill="url(#trunk)" />
      <path d="M236 236 C232 262 232 290 232 326" stroke="#fbbf24" strokeOpacity="0.2" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Cabang */}
      <path d="M236 262 C214 246 196 240 180 220" stroke="#92400e" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M246 252 C268 238 286 232 306 212" stroke="#92400e" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Tajuk */}
      <g className="animate-sway">
        <circle cx="240" cy="146" r="84" fill="url(#canopy)" />
        <circle cx="168" cy="196" r="58" fill="url(#canopy)" />
        <circle cx="312" cy="192" r="62" fill="url(#canopy)" />
        <circle cx="240" cy="212" r="60" fill="#10b981" opacity="0.9" />
        <circle cx="214" cy="112" r="20" fill="#ffffff" opacity="0.18" />
        <circle cx="284" cy="150" r="10" fill="#ffffff" opacity="0.2" />
        {/* Buah/bunga kecil */}
        <circle cx="196" cy="168" r="6" fill="#fb7185" />
        <circle cx="268" cy="118" r="6" fill="#fde047" />
        <circle cx="300" cy="206" r="6" fill="#f9a8d4" />
        <circle cx="158" cy="222" r="5" fill="#fde047" />
        <circle cx="226" cy="236" r="5" fill="#fb7185" />
      </g>

      {/* Daun melayang */}
      <g fill="#86efac">
        <path d="M86 150 q14 -12 28 0 q-14 12 -28 0Z" className="animate-float" style={{ animationDuration: '6s' }} />
        <path d="M388 250 q12 -10 24 0 q-12 10 -24 0Z" className="animate-float" style={{ animationDuration: '8s', animationDelay: '-2s' }} />
        <path d="M120 290 q10 -8 20 0 q-10 8 -20 0Z" className="animate-float" style={{ animationDuration: '7s', animationDelay: '-4s' }} />
      </g>

      {/* Anak-anak */}
      <g>
        <g>
          <circle cx="112" cy="330" r="15" fill="#fcd9b6" />
          <path d="M96 352 q16 -12 32 0 v40 h-32 Z" fill="#0d9488" />
          <path d="M96 352 q16 -12 32 0" stroke="#5eead4" strokeWidth="3" fill="none" />
        </g>
        <g>
          <circle cx="372" cy="334" r="15" fill="#fcd9b6" />
          <path d="M356 356 q16 -12 32 0 v36 h-32 Z" fill="#f472b6" />
        </g>
        <g>
          <circle cx="330" cy="352" r="11" fill="#f5c9a0" />
          <path d="M318 368 q12 -9 24 0 v26 h-24 Z" fill="#fbbf24" />
        </g>
      </g>
      {/* Tanah */}
      <ellipse cx="240" cy="394" rx="230" ry="18" fill="#6ee7b7" opacity="0.6" />
    </svg>
  )
}
