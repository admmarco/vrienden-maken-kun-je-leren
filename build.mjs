// Bouwt de statische site uit de Markdown-bestanden in content/ naar dist/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const ROOT = new URL('.', import.meta.url).pathname;
const OUT = join(ROOT, 'dist');
const SITE = 'Vrienden maken kun je leren';

marked.setOptions({ gfm: true, breaks: false });

// ---------- hulpfuncties ----------
function parse(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  m[1].split('\n').forEach((line) => {
    const i = line.indexOf(':');
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return { meta, body: m[2] };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slug(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Markdown → HTML, met containers (:::trainer, :::bronnen) en koppen met {#id}
function render(md) {
  const blocks = { trainer: [], bronnen: [] };
  md = md.replace(/^:::(\w+)\n([\s\S]*?)\n:::\s*$/gm, (_, type, inner) => {
    blocks[type] = blocks[type] || [];
    blocks[type].push(inner);
    return '';
  });
  md = md.replace(/^(#{2,4}) (.+?) \{#([\w-]+)\}$/gm, (_, h, text, id) => `<h${h.length} id="${id}">${marked.parseInline(text)}</h${h.length}>`);
  let html = marked.parse(md);
  // automatische id's voor h2 zonder id
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t.replace(/<[^>]+>/g, ''))}">${t}</h2>`);
  html = tables(html);
  return { html, blocks };
}

const tables = (html) => html.replace(/<table>/g, '<div class="tabel"><table>').replace(/<\/table>/g, '</table></div>');

// ---------- inhoud laden ----------
const modDir = join(ROOT, 'content/modules');
const modules = readdirSync(modDir).filter((f) => f.endsWith('.md')).sort().map((f) => {
  const { meta, body } = parse(join(modDir, f));
  const r = render(body);
  return { ...meta, nummer: Number(meta.nummer), href: `module-${meta.nummer}.html`, ...r };
});

const fasen = [
  { naam: 'Beginnen', uitleg: 'Jezelf leren kennen, zelfvertrouwen, gesprekken beginnen en signalen lezen.' },
  { naam: 'Verdiepen', uitleg: 'Van oppervlakkig naar betekenisvol, grenzen aangeven en conflicten oplossen.' },
  { naam: 'Volhouden', uitleg: 'Vriendschappen onderhouden en een netwerk opbouwen dat je draagt.' },
];

// ---------- sjabloon ----------
function nav(current) {
  const items = fasen.map((f) => {
    const mods = modules.filter((m) => m.fase === f.naam).map((m) =>
      `<li><a href="${m.href}"${current === m.href ? ' aria-current="page"' : ''}><span class="nr">${m.nummer}</span>${esc(m.titel)}</a></li>`).join('');
    return `<li class="fase"><span class="fase-naam">${f.naam}</span><ol>${mods}</ol></li>`;
  }).join('');
  const extra = [['werkbladen.html', 'Werkbladen'], ['trainers.html', 'Voor trainers'], ['bronnen.html', 'Bronnen']]
    .map(([h, t]) => `<li><a href="${h}"${current === h ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  return `<nav class="zijnav" aria-label="Cursusonderdelen"><ul class="fasen">${items}</ul><ul class="extra">${extra}</ul></nav>`;
}

function page({ title, description, body, current, wide = false }) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip" href="#inhoud">Naar de inhoud</a>
<header class="kop">
  <a class="merk" href="index.html">${SITE}</a>
  <nav class="kopnav" aria-label="Hoofdmenu"><a href="index.html#programma">Bijeenkomsten</a><a href="werkbladen.html">Werkbladen</a><a href="trainers.html">Voor trainers</a></nav>
  <button class="menuknop" aria-expanded="false" aria-controls="menu">Menu</button>
</header>
<div class="raam${wide ? ' raam-breed' : ''}">
  <div id="menu" class="menu">${nav(current)}</div>
  <main id="inhoud">${body}</main>
</div>
<footer class="voet">
  <p>${SITE}. Een cursus over vriendschap in negen bijeenkomsten, ontwikkeld in Waalre.</p>
  <p><a href="trainers.html">Voor trainers</a> <a href="werkbladen.html">Werkbladen</a> <a href="bronnen.html">Bronnen</a></p>
</footer>
<script src="site.js"></script>
</body>
</html>
`;
}

// ---------- hero: de route door het konvooi ----------
function heroSvg() {
  const c = 230;
  const rings = [{ r: 205, fase: 'Beginnen' }, { r: 140, fase: 'Verdiepen' }, { r: 75, fase: 'Volhouden' }];
  const hoeken = { 1: [0, 315], 2: [0, 0], 3: [0, 45], 4: [0, 90], 5: [1, 135], 6: [1, 180], 7: [1, 225], 8: [2, 150], 9: [2, 30] };
  const pos = (ring, deg) => {
    const a = (deg * Math.PI) / 180;
    return [c + rings[ring].r * Math.cos(a), c + rings[ring].r * Math.sin(a)];
  };
  const pts = modules.map((m) => pos(...hoeken[m.nummer]));
  pts.push([c, c]);
  const route = 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');
  const ringEls = rings.map((rg, i) => {
    const d = `M${c - rg.r},${c} a${rg.r},${rg.r} 0 1,1 ${2 * rg.r},0 a${rg.r},${rg.r} 0 1,1 ${-2 * rg.r},0`;
    return `<path id="ring${i}" d="${d}" class="ring ring-${i + 1}"/>
<text class="ringlabel"><textPath href="#ring${i}" startOffset="25%" text-anchor="middle">${rg.fase}</textPath></text>`;
  }).join('');
  const dots = modules.map((m, i) => {
    const [x, y] = pts[i];
    return `<a href="${m.href}" class="stip stip-${slug(m.fase)}"><title>Bijeenkomst ${m.nummer}: ${esc(m.titel)}</title>
<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="21"/><text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}">${m.nummer}</text></a>`;
  }).join('');
  return `<svg class="route" viewBox="0 0 460 460" role="img" aria-labelledby="route-titel">
<title id="route-titel">De cursus als route van buiten naar binnen: van nieuwe contacten naar een netwerk dat je draagt</title>
${ringEls}
<path d="${route}" class="pad"/>
<circle cx="${c}" cy="${c}" r="30" class="kern"/><text x="${c}" y="${c + 7}" class="kern-tekst">jij</text>
${dots}
</svg>`;
}

// ---------- pagina's ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'public'), OUT, { recursive: true });

// Home
const modLijst = fasen.map((f, i) => {
  const rows = modules.filter((m) => m.fase === f.naam).map((m) => `
<li><a href="${m.href}">
  <span class="nr">${m.nummer}</span>
  <span class="tekst"><strong>${esc(m.titel)}</strong><span>${esc(m.kort)}</span></span>
</a></li>`).join('');
  return `<section class="fase-blok fase-${slug(f.naam)}">
<h3><span class="fase-stip"></span>${f.naam}</h3>
<p class="fase-uitleg">${f.uitleg}</p>
<ol class="modlijst">${rows}</ol>
</section>`;
}).join('');

const home = `
<section class="hero">
  <div class="hero-tekst">
    <h1>Vrienden maken kun je leren</h1>
    <p class="lead">Een cursus in negen bijeenkomsten over contact leggen, vriendschappen verdiepen en ze volhouden. Met uitleg, oefeningen en werkbladen voor deelnemers en trainers.</p>
    <p class="knoppen"><a class="knop" href="module-1.html">Begin bij bijeenkomst 1</a> <a class="knop knop-licht" href="trainers.html">Ik ben trainer</a></p>
  </div>
  <div class="hero-beeld">${heroSvg()}</div>
</section>

<section class="uitleg">
  <h2 id="over">Over deze cursus</h2>
  <p>Vriendschap is voor een groot deel een vaardigheid. Je kunt het oefenen, net als fietsen of koken. Deze cursus is voor iedereen die meer of betere contacten wil, ongeacht leeftijd of ervaring. Elke bijeenkomst duurt 90 minuten en volgt dezelfde opbouw: een korte start, uitleg, oefeningen, een moment voor jezelf en een kleine opdracht voor thuis.</p>
  <p>Gedurende de cursus houd je een <a href="werkbladen.html#contactlogboek">contactlogboek</a> bij. Het doel: aan het eind minstens drie nieuwe contacten en een plan om ze te onderhouden.</p>
</section>

<section class="programma">
  <h2 id="programma">De negen bijeenkomsten</h2>
  <p>De route loopt van buiten naar binnen: van nieuwe mensen ontmoeten naar een kring die je draagt.</p>
  <div class="fasen-raster">${modLijst}</div>
</section>`;
writeFileSync(join(OUT, 'index.html'), page({ title: SITE, description: 'Een cursus in negen bijeenkomsten over contact leggen, vriendschappen verdiepen en volhouden.', body: home, current: 'index.html', wide: true }));

// Modules
modules.forEach((m, i) => {
  const vorige = modules[i - 1];
  const volgende = modules[i + 1];
  const trainer = m.blocks.trainer.map((t) => `<details class="trainer"><summary>Voor de trainer</summary><div class="trainer-inhoud">${tables(marked.parse(t))}</div></details>`).join('');
  const bronnen = m.blocks.bronnen.map((b) => `<section class="bronnen"><h2 id="bronnen">Bronnen</h2>${marked.parse(b)}</section>`).join('');
  const body = `
<article class="module fase-${slug(m.fase)}">
  <header class="module-kop">
    <p class="plaats">Bijeenkomst ${m.nummer} van ${modules.length} <span class="fase-label">${m.fase}</span></p>
    <h1>${esc(m.titel)}</h1>
    <p class="lead">${esc(m.kort)}</p>
    <dl class="feiten">
      <div><dt>Duur</dt><dd>${esc(m.duur)}</dd></div>
      <div><dt>Voorbereiding</dt><dd>${esc(m.voorbereiding)}</dd></div>
    </dl>
  </header>
  <div class="prose">${m.html}</div>
  ${trainer}
  ${bronnen}
  <nav class="bladeren" aria-label="Vorige en volgende bijeenkomst">
    ${vorige ? `<a class="vorige" href="${vorige.href}"><span>Vorige</span>${esc(vorige.titel)}</a>` : '<span></span>'}
    ${volgende ? `<a class="volgende" href="${volgende.href}"><span>Volgende</span>${esc(volgende.titel)}</a>` : '<a class="volgende" href="werkbladen.html#plan"><span>Na de cursus</span>Mijn plan</a>'}
  </nav>
</article>`;
  writeFileSync(join(OUT, m.href), page({ title: `${m.nummer}. ${m.titel} – ${SITE}`, description: m.kort, body, current: m.href }));
});

// Losse pagina's
for (const [file, name] of [['werkbladen.md', 'werkbladen.html'], ['trainers.md', 'trainers.html']]) {
  const { meta, body } = parse(join(ROOT, 'content', file));
  const r = render(body);
  const html = `<article class="pagina pagina-${name.replace('.html', '')}">
<header class="module-kop"><h1>${esc(meta.titel)}</h1><p class="lead">${esc(meta.kort)}</p>
${name === 'werkbladen.html' ? '<p><button class="knop knop-licht" data-print>Deze pagina printen</button></p>' : ''}</header>
<div class="prose">${r.html}</div></article>`;
  writeFileSync(join(OUT, name), page({ title: `${meta.titel} – ${SITE}`, description: meta.kort, body: html, current: name }));
}

// Bronnen: verzameld uit alle bijeenkomsten
const alle = new Map();
modules.forEach((m) => m.blocks.bronnen.forEach((b) => b.split('\n').filter((l) => l.startsWith('- ')).forEach((l) => {
  const key = l.slice(2).trim();
  if (!alle.has(key)) alle.set(key, []);
  alle.get(key).push(m.nummer);
})));
const bronLijst = [...alle.entries()].sort((a, b) => a[0].localeCompare(b[0], 'nl'))
  .map(([b, nrs]) => `<li>${marked.parseInline(b)} <span class="bij">Bijeenkomst ${nrs.join(', ')}</span></li>`).join('');
writeFileSync(join(OUT, 'bronnen.html'), page({
  title: `Bronnen – ${SITE}`, description: 'Het onderzoek en de literatuur waarop de cursus is gebaseerd.', current: 'bronnen.html',
  body: `<article class="pagina"><header class="module-kop"><h1>Bronnen</h1><p class="lead">Het onderzoek en de literatuur waarop de cursus is gebaseerd.</p></header><div class="prose"><ul class="bronlijst">${bronLijst}</ul></div></article>`,
}));

console.log(`Gebouwd: ${modules.length} bijeenkomsten + 4 pagina's in dist/`);
