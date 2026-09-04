// Branded vector illustrations for the post-login value screen — one per role.
// Drawn to read on the solid brand-blue background (whites, light-blue tints, a
// green accent). Pure SVG so they're crisp at any size and ship over OTA; a
// designer can later swap these for final art by replacing the strings.

// Worker: "log your time easily" — an app card with a clock, a done check, and
// the white Play button motif from Home.
const WORKER = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<circle cx="130" cy="100" r="92" fill="#FFFFFF" opacity="0.12"/>
<circle cx="130" cy="100" r="66" fill="#FFFFFF" opacity="0.10"/>
<rect x="88" y="44" width="90" height="124" rx="18" fill="#FFFFFF"/>
<circle cx="108" cy="66" r="7" fill="#DCEBFF"/>
<rect x="120" y="61" width="42" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="120" y="70" width="26" height="5" rx="2.5" fill="#EAF3FF"/>
<circle cx="133" cy="112" r="25" fill="#EAF3FF" stroke="#0785F4" stroke-width="5"/>
<path d="M133 112 V96" stroke="#052D50" stroke-width="4" stroke-linecap="round"/>
<path d="M133 112 L145 119" stroke="#052D50" stroke-width="4" stroke-linecap="round"/>
<rect x="106" y="148" width="54" height="5" rx="2.5" fill="#DCEBFF"/>
<rect x="106" y="158" width="34" height="5" rx="2.5" fill="#EAF3FF"/>
<circle cx="170" cy="56" r="15" fill="#34C759"/>
<path d="M163 56 l5 5 l9 -10" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="74" cy="140" r="20" fill="#FFFFFF"/>
<path d="M69 131 L84 140 L69 149 Z" fill="#0785F4"/>
</svg>`;

// Admin: "the whole company in your pocket" — a dashboard card with a rising
// bar chart, a growth trend line, and a green up-arrow badge.
const ADMIN = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<circle cx="130" cy="100" r="92" fill="#FFFFFF" opacity="0.12"/>
<circle cx="130" cy="100" r="66" fill="#FFFFFF" opacity="0.10"/>
<rect x="66" y="54" width="128" height="98" rx="16" fill="#FFFFFF"/>
<rect x="80" y="68" width="50" height="6" rx="3" fill="#DCEBFF"/>
<rect x="80" y="80" width="32" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="84" y="120" width="15" height="18" rx="3" fill="#BBD9FF"/>
<rect x="107" y="108" width="15" height="30" rx="3" fill="#3A73F0"/>
<rect x="130" y="96" width="15" height="42" rx="3" fill="#0785F4"/>
<rect x="153" y="86" width="15" height="52" rx="3" fill="#052D50"/>
<path d="M91 116 L114 104 L137 92 L160 82" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="91" cy="116" r="3.5" fill="#34C759"/>
<circle cx="160" cy="82" r="3.5" fill="#34C759"/>
<circle cx="182" cy="60" r="16" fill="#34C759"/>
<path d="M182 68 V53 M176 59 L182 53 L188 59" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const valueIllustration = (roleKey) =>
  roleKey === "worker" ? WORKER : ADMIN;
