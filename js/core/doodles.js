// Рисунки «от руки». Линии специально чуть неровные, а фильтр #wobble
// (в index.html) добавляет лёгкую дрожь, как у фломастера.
const INK = '#5B1A4A';
const svg = (inner, { vb = '0 0 100 100', cls = '', label = '' } = {}) =>
  `<svg class="doodle ${cls}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const ink = (w = 4) => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

export const doodle = {
  crown: (o = {}) => svg(`
    <path d="M14 74 L9 31 L33 52 L50 17 L68 51 L91 29 L86 75 Q50 81 14 74Z" fill="#FFC93C" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M17 66 Q50 72 84 66" ${ink(3)} opacity=".45"/>
    <path d="M14 75 Q50 83 86 76 L85 86 Q50 92 15 85Z" fill="#FFB020" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <circle cx="9" cy="29" r="5.5" fill="#FF5FA2" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="50" cy="15" r="6" fill="#3DDBB0" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="91" cy="27" r="5.5" fill="#FF5FA2" stroke="${INK}" stroke-width="3.5"/>
    <path d="M44 56 Q50 47 56 56 Q50 66 44 56Z" fill="#FF5FA2" stroke="${INK}" stroke-width="3"/>
    <circle cx="28" cy="63" r="3.6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="72" cy="63" r="3.6" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
    <path d="M26 40 l4 -6" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>`, { cls: o.cls, label: o.label }),

  star: (o = {}) => svg(`<path d="M50 9 L61 37 L91 38 L67 57 L76 87 L50 70 L23 88 L33 57 L9 39 L39 36Z" fill="${o.fill || '#FFC93C'}" stroke="${INK}" stroke-width="${o.w || 5}" stroke-linejoin="round"/>
    ${o.shine === false ? '' : '<path d="M40 40 l5 -9" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>'}`, { cls: o.cls, label: o.label }),

  heart: (o = {}) => svg(`<path d="M50 86 C20 66 8 48 13 31 C18 15 40 12 50 30 C58 13 82 13 88 30 C93 47 80 66 50 86Z" fill="${o.fill || '#FF5FA2'}" stroke="${INK}" stroke-width="${o.w || 5}" stroke-linejoin="round"/>
    <path d="M26 32 q4 -8 12 -6" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".8"/>`, { cls: o.cls, label: o.label }),

  sparkle: (o = {}) => svg(`<path d="M50 6 C53 38 62 47 94 50 C62 53 53 62 50 94 C47 62 38 53 6 50 C38 47 47 38 50 6Z" fill="${o.fill || '#FFC93C'}" stroke="${INK}" stroke-width="${o.w || 4}" stroke-linejoin="round"/>`, { cls: o.cls }),

  arrow: (o = {}) => svg(`<path d="M8 22 C30 8 58 14 62 36 C66 58 40 62 38 48 C36 34 62 30 78 52 L86 68" ${ink(4)}/>
    <path d="M72 66 L87 70 L91 54" ${ink(4)}/>`, { vb: '0 0 100 80', cls: o.cls }),

  squiggle: (o = {}) => svg(`<path d="M4 14 C14 2 22 26 32 14 C42 2 50 26 60 14 C70 2 78 26 88 14 C94 7 98 10 100 12" fill="none" stroke="${o.color || '#FF5FA2'}" stroke-width="${o.w || 5}" stroke-linecap="round"/>`, { vb: '0 0 104 26', cls: o.cls }),

  swirl: (o = {}) => svg(`<path d="M50 52 C46 48 52 42 57 46 C64 51 58 62 48 60 C35 57 36 39 50 35 C68 30 78 50 70 64 C60 80 30 78 24 58" ${ink(3.5)}/>`, { cls: o.cls }),

  gift: (o = {}) => {
    const c = o.color || '#FF5FA2', r = o.ribbon || '#FFC93C';
    return svg(`
      <rect x="15" y="44" width="70" height="46" rx="5" fill="${c}" stroke="${INK}" stroke-width="4.5"/>
      <rect x="10" y="32" width="80" height="16" rx="4" fill="${c}" stroke="${INK}" stroke-width="4.5"/>
      <path d="M44 32 h12 v58 h-12z" fill="${r}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M50 31 C36 14 18 20 26 30 C30 35 42 33 50 31Z M50 31 C64 14 82 20 74 30 C70 35 58 33 50 31Z" fill="${r}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="28" cy="62" r="3" fill="#fff" opacity=".8"/><circle cx="70" cy="74" r="3" fill="#fff" opacity=".8"/><circle cx="31" cy="79" r="2.4" fill="#fff" opacity=".8"/>`, { cls: o.cls, label: o.label });
  },

  candy: (o = {}) => svg(`
    <path d="M26 50 L8 34 L12 66Z M74 50 L92 34 L88 66Z" fill="${o.color || '#3DDBB0'}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="50" cy="50" rx="27" ry="21" fill="${o.color2 || '#FF5FA2'}" stroke="${INK}" stroke-width="4.5"/>
    <path d="M34 38 C42 48 44 56 38 66 M50 30 C58 42 58 58 50 70 M64 36 C70 46 70 56 64 64" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>`, { cls: o.cls }),

  cloud: (o = {}) => svg(`
    <path d="M22 72 C8 72 6 52 20 49 C18 33 38 26 46 37 C52 22 76 24 77 42 C92 41 96 62 82 70 C72 76 34 76 22 72Z" fill="#B9B2D6" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M40 54 q3 -4 6 0 M58 54 q3 -4 6 0" ${ink(3.5)}/>
    <path d="M47 64 q5 3 10 0" ${ink(3)}/>
    <path d="M30 82 l-3 8 M50 82 l-3 9 M70 82 l-3 8" stroke="#69A8E8" stroke-width="4" stroke-linecap="round"/>`, { cls: o.cls }),

  balloon: (o = {}) => svg(`
    <path d="M50 8 C76 8 86 32 80 50 C74 68 60 78 50 80 C40 78 26 68 20 50 C14 32 24 8 50 8Z" fill="${o.color || '#FF5FA2'}" stroke="${INK}" stroke-width="4"/>
    <path d="M45 80 L55 80 L52 86 L48 86Z" fill="${o.color || '#FF5FA2'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 86 C44 96 58 104 50 114 C44 122 54 128 50 138" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M33 26 C30 32 30 38 31 42" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7" fill="none"/>
    ${o.text ? `<text x="50" y="60" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="46" fill="#fff" stroke="${INK}" stroke-width="5" paint-order="stroke">${o.text}</text>` : ''}`, { vb: '0 0 100 140', cls: o.cls }),

  bow: (o = {}) => svg(`
    <path d="M50 50 C30 22 6 26 10 46 C13 62 34 60 50 50Z M50 50 C70 22 94 26 90 46 C87 62 66 60 50 50Z" fill="${o.color || '#FF5FA2'}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M44 54 L32 84 L42 80 L46 90 L50 58 M56 54 L68 84 L58 80 L54 90 L50 58" fill="${o.color || '#FF5FA2'}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <ellipse cx="50" cy="51" rx="8" ry="9" fill="${o.knot || '#C2185B'}" stroke="${INK}" stroke-width="3.5"/>`, { cls: o.cls }),

  heartGlasses: (o = {}) => svg(`
    <path d="M28 64 C10 52 4 40 9 31 C14 22 26 24 29 33 C33 24 46 23 48 33 C50 44 40 54 28 64Z" fill="#FF5FA2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M72 64 C54 54 50 44 52 33 C54 23 67 24 71 33 C74 24 86 22 91 31 C96 40 90 52 72 64Z" fill="#FF5FA2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M47 36 Q50 31 53 36" ${ink(4)}/><path d="M18 36 q4 -5 8 -3 M60 36 q4 -5 8 -3" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/>`, { vb: '0 10 100 64', cls: o.cls }),

  sunglasses: (o = {}) => svg(`
    <path d="M6 30 L94 30" ${ink(5)}/>
    <path d="M10 30 Q10 56 28 56 Q44 56 45 30Z M55 30 Q56 56 72 56 Q90 56 90 30Z" fill="#2B1030" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M18 36 l8 8 M62 36 l8 8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`, { vb: '0 18 100 44', cls: o.cls }),

  tiara: (o = {}) => svg(`
    <path d="M8 66 C26 52 40 48 50 48 C60 48 74 52 92 66" fill="none" stroke="#FFC93C" stroke-width="9" stroke-linecap="round"/>
    <path d="M8 66 C26 52 40 48 50 48 C60 48 74 52 92 66" ${ink(3)}/>
    <path d="M30 54 L34 34 L42 50 L50 18 L58 50 L66 34 L70 54" fill="#FFE07A" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="50" cy="40" r="6" fill="#3DDBB0" stroke="${INK}" stroke-width="3"/><circle cx="34" cy="34" r="4" fill="#FF5FA2" stroke="${INK}" stroke-width="2.5"/><circle cx="66" cy="34" r="4" fill="#FF5FA2" stroke="${INK}" stroke-width="2.5"/>`, { vb: '0 10 100 64', cls: o.cls }),

  catEars: (o = {}) => svg(`
    <path d="M10 70 L18 18 L44 50Z M90 70 L82 18 L56 50Z" fill="#5B1A4A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M18 56 L21 30 L35 48Z M82 56 L79 30 L65 48Z" fill="#FF9CC6"/>`, { vb: '0 10 100 64', cls: o.cls }),

  lips: (o = {}) => svg(`
    <path d="M8 50 C22 30 36 28 50 38 C64 28 78 30 92 50 C78 72 22 72 8 50Z" fill="#E8175D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M10 50 C30 54 70 54 90 50" ${ink(3)}/><path d="M28 60 q8 4 14 3" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`, { vb: '0 20 100 60', cls: o.cls }),

  wand: (o = {}) => svg(`
    <path d="M20 92 L56 46" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M20 92 L56 46" stroke="#FF9CC6" stroke-width="4" stroke-linecap="round"/>
    <path d="M66 8 L71 26 L90 27 L75 38 L80 56 L66 45 L50 56 L56 38 L41 27 L60 26Z" fill="#FFC93C" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M86 60 l4 4 M92 48 l6 0 M30 18 l-4 -4" ${ink(3)}/>`, { cls: o.cls }),

  flower: (o = {}) => svg(`
    ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="50" cy="27" rx="15" ry="20" transform="rotate(${a} 50 50)" fill="${o.color || '#FF9CC6'}" stroke="${INK}" stroke-width="3.5"/>`).join('')}
    <circle cx="50" cy="50" r="13" fill="#FFC93C" stroke="${INK}" stroke-width="3.5"/>`, { cls: o.cls }),

  mustache: (o = {}) => svg(`<path d="M50 40 C40 28 22 30 16 42 C10 52 2 50 4 42 C2 56 20 62 32 54 C40 50 46 46 50 44 C54 46 60 50 68 54 C80 62 98 56 96 42 C98 50 90 52 84 42 C78 30 60 28 50 40Z" fill="#3A1B2E" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`, { vb: '0 22 100 42', cls: o.cls }),

  seven: (o = {}) => svg(`<path d="M18 16 L82 16 L50 90" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 16 L82 16 L50 90" fill="none" stroke="${o.color || '#FFC93C'}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 16 L44 16" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`, { cls: o.cls }),

  lock: (o = {}) => svg(`
    <path d="M30 46 V32 C30 12 70 12 70 32 V46" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M30 46 V32 C30 12 70 12 70 32 V46" fill="none" stroke="#FFC93C" stroke-width="4" stroke-linecap="round"/>
    <rect x="18" y="44" width="64" height="48" rx="10" fill="#FFC93C" stroke="${INK}" stroke-width="4.5"/>
    <path d="M50 60 v14" ${ink(6)}/><circle cx="50" cy="60" r="6" fill="${INK}"/>`, { cls: o.cls }),

  seal: (o = {}) => svg(`
    <path d="M50 4 C62 6 66 2 74 10 C84 14 86 20 92 30 C98 40 94 46 96 56 C96 68 88 72 84 82 C76 92 68 90 58 96 C46 98 40 94 30 92 C20 88 16 80 10 72 C4 62 6 54 4 44 C6 32 10 26 18 18 C26 8 38 8 50 4Z" fill="${o.color || '#C2185B'}" stroke="#8E0F42" stroke-width="3"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="#8E0F42" stroke-width="3" opacity=".7"/>
    <path d="M32 60 L29 38 L40 49 L50 32 L60 49 L71 38 L68 60Z" fill="#FFB3D1" opacity=".9"/>
    <text x="50" y="84" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="16" fill="#FFB3D1">7</text>`, { cls: o.cls }),

  potato: (o = {}) => svg(`
    <path d="M22 30 C34 10 70 8 84 26 C98 44 92 74 72 86 C52 98 18 92 10 70 C4 54 12 42 22 30Z" fill="#E0A85E" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <circle cx="30" cy="40" r="3" fill="#B97A35"/><circle cx="74" cy="70" r="3.5" fill="#B97A35"/><circle cx="58" cy="26" r="2.5" fill="#B97A35"/>
    <ellipse cx="38" cy="54" rx="6" ry="8" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="62" cy="54" rx="6" ry="8" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <circle cx="39" cy="56" r="3.5" fill="${INK}"/><circle cx="63" cy="56" r="3.5" fill="${INK}"/>
    <path d="M40 72 Q50 80 60 72" ${ink(3.5)}/>
    <ellipse cx="28" cy="66" rx="6" ry="4" fill="#FF7FA8" opacity=".7"/><ellipse cx="72" cy="66" rx="6" ry="4" fill="#FF7FA8" opacity=".7"/>`, { cls: o.cls }),

  envelope: (o = {}) => svg(`
    <rect x="6" y="22" width="88" height="62" rx="5" fill="#FFF6FA" stroke="${INK}" stroke-width="4"/>
    <path d="M8 26 L50 58 L92 26" ${ink(4)}/>
    <path d="M42 50 C34 40 44 34 50 42 C56 34 66 40 58 50 L50 58Z" fill="#FF5FA2" stroke="${INK}" stroke-width="3"/>`, { cls: o.cls }),

  book: (o = {}) => svg(`
    <path d="M50 22 C38 14 20 14 8 18 V84 C20 80 38 80 50 88 C62 80 80 80 92 84 V18 C80 14 62 14 50 22Z" fill="#FFF6FA" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M50 22 V88" ${ink(3.5)}/><path d="M18 34 C26 32 34 32 40 35 M18 46 C26 44 34 44 40 47 M60 35 C66 32 74 32 82 34" ${ink(2.5)}/>
    <path d="M62 52 C58 48 62 44 66 47 C70 44 74 48 70 52 L66 56Z" fill="#FF5FA2" stroke="${INK}" stroke-width="2"/>`, { cls: o.cls }),

  key: (o = {}) => svg(`<circle cx="28" cy="50" r="16" fill="#FFC93C" stroke="${INK}" stroke-width="4"/><circle cx="28" cy="50" r="6" fill="#FFE4EF" stroke="${INK}" stroke-width="3"/>
    <path d="M44 50 H90 M78 50 V62 M88 50 V60" ${ink(6)}/><path d="M44 50 H90 M78 50 V62 M88 50 V60" stroke="#FFC93C" stroke-width="2.5" fill="none" stroke-linecap="round"/>`, { cls: o.cls }),

  mic: (o = {}) => svg(`<rect x="36" y="10" width="28" height="48" rx="14" fill="#FF5FA2" stroke="${INK}" stroke-width="4"/><path d="M24 44 C24 74 76 74 76 44 M50 70 V88 M36 88 H64" ${ink(4)}/>`, { cls: o.cls }),

  finger: (o = {}) => svg(`<path d="M40 88 C30 80 22 66 20 58 C18 50 26 48 32 56 L36 62 V20 C36 12 48 12 48 20 V46 C48 40 60 40 60 47 C60 42 72 42 72 50 C72 45 82 46 82 54 V68 C82 80 74 88 66 88Z" fill="#FFE0CC" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`, { cls: o.cls })
};

/** Маленькая звёздная россыпь для украшения, позиции фиксированы — чтобы не «прыгали». */
export function scatter(kinds = ['sparkle', 'heart', 'star'], n = 6, seed = 1) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, (_, i) => {
    const k = kinds[i % kinds.length];
    const size = 18 + rnd() * 26;
    return `<span class="scatter" style="left:${(rnd() * 92).toFixed(1)}%;top:${(rnd() * 92).toFixed(1)}%;width:${size.toFixed(0)}px;--r:${(rnd() * 50 - 25).toFixed(0)}deg">${doodle[k]({ fill: ['#FFC93C', '#FF5FA2', '#3DDBB0'][i % 3] })}</span>`;
  }).join('');
}
