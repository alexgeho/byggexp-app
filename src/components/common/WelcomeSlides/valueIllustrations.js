// Branded vector illustrations for the post-login value screen — one per role.
// Minimal look: the art floats directly on the white card (no blue medallion
// disc), so white shapes get a faint blue outline to keep their silhouette.
// Pure SVG so they're crisp at any size and ship over OTA; a designer can later
// swap these for final art by replacing the strings.
const CARD_STROKE = `stroke="#E3ECF7" stroke-width="2"`;

// Worker: "log your time easily" — an app card with a clock, a done check, and
// the white Play button motif from Home.
const WORKER = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<rect x="88" y="44" width="90" height="124" rx="18" fill="#FFFFFF" ${CARD_STROKE}/>
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
<circle cx="74" cy="140" r="20" fill="#FFFFFF" ${CARD_STROKE}/>
<path d="M69 131 L84 140 L69 149 Z" fill="#0785F4"/>
</svg>`;

// Admin — projects & team: a roster card with member rows and a green "add
// person" badge (invite your crew).
const ADMIN_TEAM = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<rect x="70" y="50" width="120" height="100" rx="16" fill="#FFFFFF" ${CARD_STROKE}/>
<rect x="84" y="64" width="46" height="6" rx="3" fill="#DCEBFF"/>
<circle cx="92" cy="94" r="9" fill="#3A73F0"/>
<rect x="108" y="89" width="58" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="108" y="98" width="36" height="5" rx="2.5" fill="#EAF3FF"/>
<circle cx="92" cy="122" r="9" fill="#0785F4"/>
<rect x="108" y="117" width="50" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="108" y="126" width="30" height="5" rx="2.5" fill="#EAF3FF"/>
<circle cx="180" cy="58" r="16" fill="#34C759"/>
<path d="M180 51 V65 M173 58 H187" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
</svg>`;

// Admin — finance: a dashboard card with a rising bar chart, a growth trend
// line, and a green up-arrow badge.
const ADMIN_ECONOMY = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<rect x="66" y="54" width="128" height="98" rx="16" fill="#FFFFFF" ${CARD_STROKE}/>
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

// Tasks & reminders: a checklist card (one item done) with a blue bell badge.
const TASKS = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<rect x="72" y="48" width="116" height="104" rx="16" fill="#FFFFFF" ${CARD_STROKE}/>
<rect x="86" y="66" width="18" height="18" rx="5" fill="#34C759"/>
<path d="M90 75 l4 4 l7 -8" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="112" y="71" width="58" height="6" rx="3" fill="#DCEBFF"/>
<rect x="86" y="95" width="18" height="18" rx="5" fill="#EAF3FF" stroke="#BBD9FF" stroke-width="2"/>
<rect x="112" y="100" width="64" height="6" rx="3" fill="#EAF3FF"/>
<rect x="86" y="124" width="18" height="18" rx="5" fill="#EAF3FF" stroke="#BBD9FF" stroke-width="2"/>
<rect x="112" y="129" width="46" height="6" rx="3" fill="#EAF3FF"/>
<circle cx="180" cy="56" r="16" fill="#0785F4"/>
<path d="M180 49 c-4 0 -7 3 -7 7 v4 l-2 2 h18 l-2 -2 v-4 c0 -4 -3 -7 -7 -7 z" fill="#FFFFFF"/>
<path d="M177 65 a3 3 0 0 0 6 0" fill="#FFFFFF"/>
</svg>`;

// Photos & receipts: a photo card plus a receipt with a green scan line and a
// done check — snapped photos and scanned receipts flow into the project.
const PHOTOS = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<rect x="56" y="54" width="100" height="86" rx="14" fill="#FFFFFF" ${CARD_STROKE}/>
<rect x="66" y="64" width="80" height="52" rx="8" fill="#EAF3FF"/>
<circle cx="88" cy="82" r="7" fill="#3A73F0"/>
<path d="M70 112 L92 88 L106 102 L122 86 L142 112 Z" fill="#BBD9FF"/>
<rect x="66" y="124" width="46" height="6" rx="3" fill="#DCEBFF"/>
<path d="M150 84 h46 v70 l-5.75 -4 l-5.75 4 l-5.75 -4 l-5.75 4 l-5.75 -4 l-5.75 4 l-5.75 -4 z" fill="#FFFFFF" ${CARD_STROKE}/>
<rect x="158" y="98" width="30" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="158" y="109" width="24" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="158" y="120" width="28" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="150" y="131" width="46" height="4" rx="2" fill="#34C759"/>
<circle cx="196" cy="90" r="14" fill="#34C759"/>
<path d="M190 90 l4 4 l8 -9" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Projects & drawings: a folder holding a document, with a green done badge —
// all project files gathered in one place.
const PROJECTS = `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none">
<path d="M62 68 h36 l10 12 h90 a12 12 0 0 1 12 12 v54 a12 12 0 0 1 -12 12 H62 a12 12 0 0 1 -12 -12 V80 a12 12 0 0 1 12 -12 z" fill="#FFFFFF" ${CARD_STROKE}/>
<rect x="80" y="104" width="70" height="6" rx="3" fill="#DCEBFF"/>
<rect x="80" y="118" width="104" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="80" y="128" width="86" height="5" rx="2.5" fill="#EAF3FF"/>
<rect x="80" y="138" width="58" height="5" rx="2.5" fill="#EAF3FF"/>
<circle cx="188" cy="72" r="15" fill="#34C759"/>
<path d="M181 72 l5 5 l9 -10" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const BY_KEY = {
  worker: WORKER,
  tasks: TASKS,
  photos: PHOTOS,
  projects: PROJECTS,
  adminTeam: ADMIN_TEAM,
  adminEconomy: ADMIN_ECONOMY,
};

export const valueIllustration = (key) => BY_KEY[key] || WORKER;
