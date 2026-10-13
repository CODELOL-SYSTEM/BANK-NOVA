/* NovaBank — tout est stocké dans le navigateur (localStorage). */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const DB_KEY = 'novabank_db', SES_KEY = 'novabank_session';

let db = load();
let me = localStorage.getItem(SES_KEY);
let view = 'home';
let masked = false;
let preTo = '';       // bénéficiaire présélectionné
let histFilter = 'all';

/* ---------- Données ---------- */
function load() {
  const d = JSON.parse(localStorage.getItem(DB_KEY) || '{"users":{}}');
  Object.values(d.users).forEach(u => {           // migration anciennes versions
    u.contacts = (u.contacts || []).map(c => typeof c === 'string' ? c : c.username).filter(n => n && d.users[n] && n !== u.user);
    u.notifs = u.notifs || [];
    u.frozen = !!u.frozen;
    u.tx = (u.tx || []).map((t, i) => ({ id: t.id || 'T' + t.date + i, ref: t.ref || refCode(), type: t.type || (t.amount >= 0 ? 'in' : 'out'), ...t }));
  });
  return d;
}
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
const euro = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const rnd = n => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const refCode = () => 'NB' + Date.now().toString(36).toUpperCase() + rnd(3);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fullName = u => u.first + ' ' + u.last;
const shortName = u => u.first + ' ' + u.last[0].toUpperCase() + '.';
const ini = u => (u.first[0] + u.last[0]).toUpperCase();
const cur = () => db.users[me];
const findUser = q => {
  q = q.trim().toLowerCase().replace(/^@/, '');
  const clean = q.replace(/\s/g, '');
  return Object.values(db.users).find(u => u.user === q || u.card.iban.replace(/\s/g, '').toLowerCase() === clean);
};
function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h.toString(16); }

function genCard(first, last) {
  const now = new Date();
  return {
    number: ('4' + rnd(15)).replace(/(.{4})/g, '$1 ').trim(),
    exp: String(now.getMonth() + 1).padStart(2, '0') + '/' + String((now.getFullYear() + 4) % 100).padStart(2, '0'),
    cvv: rnd(3),
    holder: (first + ' ' + last).toUpperCase(),
    iban: 'FR76 ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(3)
  };
}
function addTx(u, o) { u.tx.push({ id: 'T' + Date.now() + rnd(3), ref: o.ref || refCode(), date: Date.now(), ...o }); }
function notify(u, text) { u.notifs.unshift({ text, date: Date.now(), read: false }); u.notifs = u.notifs.slice(0, 30); }

/* ---------- Auth ---------- */
$('#tabLogin').onclick = () => switchTab(true);
$('#tabSignup').onclick = () => switchTab(false);
function switchTab(l) {
  $('#tabLogin').classList.toggle('on', l); $('#tabSignup').classList.toggle('on', !l);
  $('#formLogin').classList.toggle('hidden', !l); $('#formSignup').classList.toggle('hidden', l);
  authErr('');
}
const authErr = m => $('#authErr').textContent = m;

$('#btnSignup').onclick = () => {
  const first = $('#sFirst').value.trim(), last = $('#sLast').value.trim();
  const user = $('#sUser').value.trim().toLowerCase(), pass = $('#sPass').value;
  if (!first || !last) return authErr('Prénom et nom obligatoires.');
  if (!/^[a-z0-9_.-]{3,20}$/.test(user)) return authErr('Nom d\'utilisateur : 3 à 20 caractères (lettres, chiffres, . _ -).');
  if (pass.length < 4) return authErr('Mot de passe : 4 caractères minimum.');
  db = load();
  if (db.users[user]) return authErr('Ce nom d\'utilisateur existe déjà.');
  db.users[user] = { first, last, user, pass: hash(pass), card: genCard(first, last), balance: 0, contacts: [], tx: [], notifs: [], frozen: false, created: Date.now() };
  notify(db.users[user], 'Bienvenue chez NovaBank, ' + first + ' ! Ton compte et ta carte sont prêts.');
  save(); login(user);
};
$('#btnLogin').onclick = () => {
  const user = $('#lUser').value.trim().toLowerCase(), pass = $('#lPass').value;
  db = load();
  const u = db.users[user];
  if (!u || u.pass !== hash(pass)) return authErr('Identifiants incorrects.');
  login(user);
};
['lUser', 'lPass'].forEach(id => $('#' + id).addEventListener('keydown', e => e.key === 'Enter' && $('#btnLogin').click()));
function login(user) {
  me = user; view = 'home'; localStorage.setItem(SES_KEY, me); render();
  const n = cur().notifs.filter(x => !x.read).length;
  if (n) toast('Tu as ' + n + ' nouvelle' + (n > 1 ? 's' : '') + ' notification' + (n > 1 ? 's' : ''), 'info');
}
$('#btnLogout').onclick = () => { me = null; localStorage.removeItem(SES_KEY); render(); };

/* ---------- Navigation & rendu ---------- */
const VIEWS = { home: ['Accueil', vHome], cards: ['Ma carte', vCards], transfer: ['Virements', vTransfer], contacts: ['Bénéficiaires', vContacts], history: ['Opérations', vHistory], help: ['Aide & FAQ', vHelp], settings: ['Paramètres', vSettings] };
$$('.nav').forEach(b => b.onclick = () => go(b.dataset.v));
function go(v) { view = v; $('#notifPanel').classList.add('hidden'); render(); window.scrollTo(0, 0); }

function render() {
  const u = cur();
  $('#auth').classList.toggle('hidden', !!u);
  $('#app').classList.toggle('hidden', !u);
  if (!u) { me = null; return; }
  $$('.nav').forEach(b => b.classList.toggle('on', b.dataset.v === view));
  $('#title').textContent = VIEWS[view][0];
  $('#avatar').textContent = ini(u);
  const n = u.notifs.filter(x => !x.read).length;
  $('#dot').textContent = n; $('#dot').classList.toggle('hidden', !n);
  VIEWS[view][1]();
}

$('#bell').onclick = () => {
  const p = $('#notifPanel'), u = cur();
  if (!p.classList.contains('hidden')) { p.classList.add('hidden'); return; }
  p.innerHTML = '<h3>Notifications</h3>' + (u.notifs.length ? u.notifs.slice(0, 8).map(n => `<div class="nt ${n.read ? '' : 'new'}">${esc(n.text)}<small>${fmtDate(n.date)}</small></div>`).join('') : '<div class="empty">Rien pour le moment.</div>');
  p.classList.remove('hidden');
  u.notifs.forEach(n => n.read = true); save();
  $('#dot').classList.add('hidden');
};

/* Réception en direct (autre onglet / autre session sur ce navigateur) */
window.addEventListener('storage', e => {
  if (e.key !== DB_KEY || !me) return;
  const before = cur() ? cur().notifs.filter(n => !n.read).length : 0;
  db = load();
  if (!cur()) { me = null; render(); return; }
  const fresh = cur().notifs.filter(n => !n.read);
  if (fresh.length > before) toast(fresh[0].text, 'info');
  if (!document.querySelector('#ov') && !document.activeElement.matches('input,select')) render();
  else { const n = fresh.length; $('#dot').textContent = n; $('#dot').classList.toggle('hidden', !n); }
});

/* ---------- Modales / toasts ---------- */
function openModal(html) {
  $('#modalRoot').innerHTML = `<div id="ov"><div class="modal"><button class="close" id="mClose">✕</button>${html}</div></div>`;
  $('#mClose').onclick = closeModal;
  $('#ov').onclick = e => { if (e.target.id === 'ov') closeModal(); };
}
const closeModal = () => $('#modalRoot').innerHTML = '';
function toast(msg, kind) {
  const t = document.createElement('div');
  t.className = 'toast' + (kind === true || kind === 'ko' ? ' ko' : kind === 'info' ? ' info' : '');
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- Ajout d'argent (clic sur le logo NovaBank) ---------- */
$('#logo').onclick = () => {
  if (!me) return;
  const methods = [['🏦', 'Virement'], ['💳', 'Carte'], ['💶', 'Espèces'], ['🎁', 'Code cadeau']];
  openModal(`
    <h2>Ajouter de l'argent</h2><p>Choisis une méthode de dépôt.</p>
    <div class="opts">${methods.map((m, i) => `<button class="opt ${i === 0 ? 'on' : ''}" data-m="${m[1]}"><i>${m[0]}</i>${m[1]}</button>`).join('')}</div>
    <label>Montant (€)</label><input id="amt" type="number" min="1" step="1" value="50">
    <button class="btn" id="doAdd">Ajouter</button>`);
  let method = 'Virement';
  $$('.opt').forEach(b => b.onclick = () => { $$('.opt').forEach(x => x.classList.remove('on')); b.classList.add('on'); method = b.dataset.m; });
  $('#doAdd').onclick = () => {
    const a = Math.round(parseFloat($('#amt').value) * 100) / 100, u = cur();
    if (!(a > 0) || a > 100000) return toast('Montant invalide', true);
    if (method === 'Carte' && u.frozen) return toast('Ta carte est bloquée', true);
    u.balance += a;
    addTx(u, { type: 'in', label: 'Dépôt par ' + method.toLowerCase(), amount: a, cat: 'deposit' });
    save(); closeModal(); render(); toast('+' + euro(a) + ' ajoutés ✔');
  };
};

/* ================= VUES ================= */
function txRow(t) {
  return `<div class="tx click" data-id="${t.id}"><div>${esc(t.label)}<small>${fmtDate(t.date)}</small></div><div class="${t.amount >= 0 ? 'plus' : 'minus'}">${t.amount >= 0 ? '+' : ''}${euro(t.amount)}</div></div>`;
}
function bindTx() { $$('.tx.click').forEach(el => el.onclick = () => txDetail(el.dataset.id)); }
function txDetail(id) {
  const t = cur().tx.find(x => x.id === id); if (!t) return;
  openModal(`<h2>Détail de l'opération</h2><p>${esc(t.label)}</p>
    <div class="recap" style="margin-top:14px">
      <div><span>Montant</span><b class="${t.amount >= 0 ? 'plus' : 'minus'}">${t.amount >= 0 ? '+' : ''}${euro(t.amount)}</b></div>
      <div><span>Date</span><span>${fmtDate(t.date)}</span></div>
      <div><span>Type</span><span>${t.type === 'in' ? 'Crédit' : 'Débit'}</span></div>
      ${t.motif ? `<div><span>Motif</span><span>${esc(t.motif)}</span></div>` : ''}
      <div><span>Référence</span><span>${esc(t.ref)}</span></div>
    </div>`);
}
const monthStats = u => {
  const d = new Date(), start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const m = u.tx.filter(t => t.date >= start);
  return { inn: m.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), out: -m.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0) };
};

/* --- Accueil --- */
function vHome() {
  const u = cur(), s = monthStats(u);
  $('#view').innerHTML = `
  <div class="grid">
    <div class="panel">
      <h3>Compte courant</h3>
      <div class="balance">${euro(u.balance)}</div>
      <div class="iban">${u.card.iban}</div>
      <div class="stat"><div>Entrées ce mois<b class="plus">+${euro(s.inn)}</b></div><div>Sorties ce mois<b class="minus">-${euro(s.out)}</b></div></div>
      <div class="actions"><button class="btn ghost" data-go="transfer">🔁 Faire un virement</button><button class="btn ghost" data-go="contacts">👥 Bénéficiaires</button></div>
    </div>
    <div class="panel">
      <h3>Dernières opérations</h3>
      ${u.tx.length ? u.tx.slice().reverse().slice(0, 5).map(txRow).join('') : '<div class="empty">Aucune opération pour l\'instant.</div>'}
      <div class="actions"><button class="btn ghost sm" data-go="history">Tout voir</button></div>
    </div>
    <div class="panel full">
      <h3>Virement rapide</h3>
      ${u.contacts.length ? `<div class="contacts">${u.contacts.map(n => { const c = db.users[n]; return `<div class="ct" data-to="${c.user}"><div class="av">${ini(c)}</div>${esc(shortName(c))}<small>@${esc(c.user)}</small></div>`; }).join('')}</div>` : '<div class="empty">Ajoute un bénéficiaire pour envoyer de l\'argent.</div>'}
    </div>
  </div>`;
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  $$('.ct[data-to]').forEach(b => b.onclick = () => { preTo = b.dataset.to; go('transfer'); });
  bindTx();
}

/* --- Carte --- */
function vCards() {
  const u = cur(), c = u.card;
  $('#view').innerHTML = `
  <div class="grid">
    <div class="panel">
      <h3>Carte NovaBank <small style="font-weight:400">(clique pour la retourner)</small></h3>
      <div class="scene"><div class="flip ${u.frozen ? 'frozen' : ''}" id="flip">
        <div class="face front"><div class="brand">NOVA</div><div class="chip"></div>
          <div class="num">${masked ? '•••• •••• •••• ' + c.number.slice(-4) : c.number}</div>
          <div class="meta"><div>Titulaire<b>${esc(c.holder)}</b></div><div>Expire<b>${c.exp}</b></div></div></div>
        <div class="face bk"><div class="strip"></div>
          <div class="sig"><div class="sg">${esc(fullName(u))}</div><div class="cvv">${masked ? '•••' : c.cvv}</div></div>
          <div class="note2">Carte NovaBank — utilisable uniquement sur NovaBank.</div></div>
      </div></div>
      <div class="note">${u.frozen ? '🔒 Carte bloquée' : 'Carte active'}</div>
    </div>
    <div class="panel">
      <h3>Gérer ma carte</h3>
      <div class="set"><div>Masquer les numéros<small>Cache le numéro et le CVV</small></div><div class="sw ${masked ? 'on' : ''}" id="swMask"></div></div>
      <div class="set"><div>Bloquer la carte<small>Empêche les dépôts par carte</small></div><div class="sw ${u.frozen ? 'on' : ''}" id="swFreeze"></div></div>
      <div class="set"><div>Plafond de virement<small>Par jour</small></div><b>2 000 €</b></div>
      <div class="set"><div>IBAN<small>${c.iban}</small></div><button class="btn ghost sm" id="cpIban">Copier</button></div>
    </div>
  </div>`;
  $('#flip').onclick = () => $('#flip').classList.toggle('back');
  $('#swMask').onclick = () => { masked = !masked; vCards(); };
  $('#swFreeze').onclick = () => { u.frozen = !u.frozen; save(); vCards(); toast(u.frozen ? 'Carte bloquée 🔒' : 'Carte débloquée ✔'); };
  $('#cpIban').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(c.iban); toast('IBAN copié'); };
}

/* --- Virements --- */
const DAILY_LIMIT = 2000;
function sentToday(u) {
  const s = new Date(); s.setHours(0, 0, 0, 0);
  return -u.tx.filter(t => t.date >= s.getTime() && t.cat === 'transfer' && t.amount < 0).reduce((a, t) => a + t.amount, 0);
}
function vTransfer() {
  const u = cur();
  if (!u.contacts.length) {
    $('#view').innerHTML = `<div class="panel"><h3>Nouveau virement</h3><div class="empty">Tu n'as encore aucun bénéficiaire. Ajoute d'abord la personne à qui tu veux envoyer de l'argent.</div><div class="actions"><button class="btn ghost" id="toC">Ajouter un bénéficiaire</button></div></div>`;
    $('#toC').onclick = () => go('contacts'); return;
  }
  $('#view').innerHTML = `
  <div class="grid"><div class="panel">
    <h3>Nouveau virement</h3>
    <label>Compte à débiter</label><input value="Compte courant — ${euro(u.balance)}" disabled>
    <label>Bénéficiaire</label>
    <select id="to">${u.contacts.map(n => `<option value="${n}" ${n === preTo ? 'selected' : ''}>${esc(fullName(db.users[n]))} (@${n})</option>`).join('')}</select>
    <label>Montant (€)</label><input id="sa" type="number" min="0.01" step="0.01" placeholder="0,00">
    <label>Motif (optionnel)</label><input id="sm" maxlength="40" placeholder="Ex : remboursement">
    <button class="btn" id="goRecap">Continuer</button>
  </div>
  <div class="panel"><h3>Infos</h3>
    <div class="set"><div>Délai<small>Immédiat entre comptes NovaBank</small></div><b>Instantané</b></div>
    <div class="set"><div>Frais</div><b>0 €</b></div>
    <div class="set"><div>Plafond restant aujourd'hui</div><b>${euro(Math.max(0, DAILY_LIMIT - sentToday(u)))}</b></div>
  </div></div>`;
  $('#goRecap').onclick = () => {
    const to = $('#to').value, a = Math.round(parseFloat($('#sa').value) * 100) / 100, m = $('#sm').value.trim();
    if (!(a > 0)) return toast('Montant invalide', true);
    if (a > u.balance) return toast('Solde insuffisant', true);
    if (sentToday(u) + a > DAILY_LIMIT) return toast('Plafond journalier dépassé (2 000 €)', true);
    const r = db.users[to];
    openModal(`<h2>Confirmer le virement</h2><p>Vérifie les informations puis valide avec ton mot de passe.</p>
      <div class="recap" style="margin-top:12px">
        <div><span>Bénéficiaire</span><b>${esc(fullName(r))}</b></div>
        <div><span>IBAN</span><span>${r.card.iban.slice(0, 9)} •••• ${r.card.iban.slice(-4)}</span></div>
        <div><span>Montant</span><b>${euro(a)}</b></div>
        ${m ? `<div><span>Motif</span><span>${esc(m)}</span></div>` : ''}
      </div>
      <label>Mot de passe</label><input id="pw" type="password" autocomplete="current-password">
      <button class="btn" id="confirmTr">Valider le virement</button>`);
    $('#pw').focus();
    $('#pw').addEventListener('keydown', e => e.key === 'Enter' && $('#confirmTr').click());
    $('#confirmTr').onclick = () => {
      if (hash($('#pw').value) !== u.pass) return toast('Mot de passe incorrect', true);
      db = load();
      const me2 = cur(), rec = db.users[to];
      if (!rec) return toast('Bénéficiaire introuvable', true);
      if (a > me2.balance) return toast('Solde insuffisant', true);
      const ref = refCode();
      me2.balance = Math.round((me2.balance - a) * 100) / 100;
      rec.balance = Math.round((rec.balance + a) * 100) / 100;
      addTx(me2, { type: 'out', cat: 'transfer', label: 'Virement à ' + fullName(rec), amount: -a, motif: m, ref });
      addTx(rec, { type: 'in', cat: 'transfer', label: 'Virement de ' + fullName(me2), amount: a, motif: m, ref });
      notify(rec, fullName(me2) + ' t\'a envoyé ' + euro(a) + (m ? ' — « ' + m + ' »' : ''));
      save(); preTo = '';
      openModal(`<div class="okcircle">✓</div><h2 style="text-align:center">Virement effectué</h2>
        <p style="text-align:center">${euro(a)} envoyés à ${esc(fullName(rec))}</p>
        <div class="recap" style="margin-top:14px"><div><span>Référence</span><span>${ref}</span></div><div><span>Nouveau solde</span><b>${euro(me2.balance)}</b></div></div>
        <button class="btn" id="okDone">Terminé</button>`);
      $('#okDone').onclick = () => { closeModal(); go('home'); };
    };
  };
}

/* --- Bénéficiaires --- */
function vContacts() {
  const u = cur();
  $('#view').innerHTML = `<div class="panel"><h3>Mes bénéficiaires</h3>
    <div class="contacts">
      ${u.contacts.map(n => { const c = db.users[n]; return `<div class="ct" data-to="${c.user}"><button class="rm" data-rm="${c.user}" title="Supprimer">✕</button><div class="av">${ini(c)}</div>${esc(fullName(c))}<small>@${esc(c.user)}</small></div>`; }).join('')}
      <div class="ct add" id="addCt">＋<small>Ajouter</small></div>
    </div></div>`;
  $$('.ct[data-to]').forEach(b => b.onclick = e => { if (e.target.dataset.rm) return; preTo = b.dataset.to; go('transfer'); });
  $$('[data-rm]').forEach(b => b.onclick = () => {
    const c = db.users[b.dataset.rm];
    if (confirm('Supprimer ' + fullName(c) + ' de tes bénéficiaires ?')) { u.contacts = u.contacts.filter(x => x !== c.user); save(); vContacts(); }
  });
  $('#addCt').onclick = openAddContact;
}
function openAddContact() {
  openModal(`<h2>Nouveau bénéficiaire</h2><p>Saisis son nom d'utilisateur NovaBank ou son IBAN. Il doit avoir un compte.</p>
    <label>Nom d'utilisateur ou IBAN</label><input id="cq" placeholder="@pseudo ou FR76 …">
    <div id="found"></div>
    <button class="btn" id="searchCt">Rechercher</button>`);
  $('#cq').focus();
  $('#cq').addEventListener('keydown', e => e.key === 'Enter' && $('#searchCt').click());
  $('#searchCt').onclick = () => {
    db = load();
    const r = findUser($('#cq').value), u = cur();
    if (!$('#cq').value.trim()) return;
    if (!r) { $('#found').innerHTML = ''; return toast('Aucun compte trouvé', true); }
    if (r.user === u.user) return toast('C\'est ton propre compte', true);
    if (u.contacts.includes(r.user)) return toast('Déjà dans tes bénéficiaires', true);
    $('#found').innerHTML = `<div class="found"><div class="av">${ini(r)}</div><div><b>${esc(fullName(r))}</b><br><small style="color:var(--mut)">@${esc(r.user)}</small></div></div>`;
    const b = $('#searchCt'); b.textContent = 'Ajouter ce bénéficiaire';
    b.onclick = () => { u.contacts.push(r.user); save(); closeModal(); render(); toast(fullName(r) + ' ajouté ✔'); };
  };
}

/* --- Opérations --- */
function vHistory() {
  const u = cur();
  let list = u.tx.slice().reverse();
  if (histFilter === 'in') list = list.filter(t => t.amount > 0);
  if (histFilter === 'out') list = list.filter(t => t.amount < 0);
  $('#view').innerHTML = `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="margin:0">Toutes les opérations</h3>
    <select id="flt" style="width:auto"><option value="all">Tout</option><option value="in">Reçus</option><option value="out">Envoyés</option></select></div>
    ${list.length ? list.map(txRow).join('') : '<div class="empty">Aucune opération.</div>'}</div>`;
  $('#flt').value = histFilter;
  $('#flt').onchange = e => { histFilter = e.target.value; vHistory(); };
  bindTx();
}

/* --- Aide & FAQ --- */
const FAQ = [
  ['Comment envoyer de l\'argent à quelqu\'un ?', 'Va dans « Bénéficiaires », ajoute la personne avec son nom d\'utilisateur ou son IBAN, puis ouvre « Virements », choisis-la et valide avec ton mot de passe. Elle reçoit l\'argent immédiatement.'],
  ['Puis-je envoyer de l\'argent à quelqu\'un qui n\'a pas de compte ?', 'Non. Un bénéficiaire doit avoir ouvert un compte NovaBank. Demande-lui de s\'inscrire, puis ajoute-le avec son nom d\'utilisateur.'],
  ['Comment ajouter de l\'argent sur mon compte ?', 'Tu peux déposer de l\'argent par virement, carte, espèces ou code cadeau. Cherche bien dans l\'interface : l\'accès au dépôt n\'est pas affiché de façon évidente.'],
  ['Où puis-je utiliser ma carte ?', 'Ta carte NovaBank fonctionne uniquement sur NovaBank, pour gérer ton compte. Elle ne peut pas être utilisée ailleurs.'],
  ['Quel est le plafond de virement ?', 'Le plafond est de 2 000 € par jour. Il se remet à zéro chaque jour à minuit.'],
  ['J\'ai oublié mon mot de passe', 'Pour le moment, tu peux le changer dans « Paramètres » une fois connecté. Si tu l\'as perdu, il faut ouvrir un nouveau compte.'],
  ['Mes virements ont-ils des frais ?', 'Non, les virements entre comptes NovaBank sont gratuits et instantanés.']
];
function vHelp() {
  $('#view').innerHTML = `<div class="grid"><div class="panel"><h3>Questions fréquentes</h3>
    ${FAQ.map(f => `<div class="faq"><button><span>${f[0]}</span><span class="pl">＋</span></button><div>${f[1]}</div></div>`).join('')}</div>
    <div class="panel"><h3>Nous contacter</h3>
      <label>Sujet</label><select id="hs"><option>Question sur mon compte</option><option>Un virement</option><option>Ma carte</option><option>Autre</option></select>
      <label>Message</label><textarea id="hm" rows="5" style="width:100%;padding:12px;border-radius:12px;border:1px solid #2c3258;background:var(--panel2);color:var(--txt);font-size:15px;resize:vertical"></textarea>
      <button class="btn" id="hsend">Envoyer</button>
      <div class="set" style="margin-top:16px"><div>Support<small>support@novabank.fr</small></div><span>Lun–Ven 9h–18h</span></div>
    </div></div>`;
  $$('.faq button').forEach(b => b.onclick = () => b.parentElement.classList.toggle('open'));
  $('#hsend').onclick = () => { if (!$('#hm').value.trim()) return toast('Écris un message', true); $('#hm').value = ''; toast('Message envoyé. Nous te répondons sous 48h ✔'); };
}

/* --- Paramètres --- */
function vSettings() {
  const u = cur();
  $('#view').innerHTML = `<div class="grid"><div class="panel"><h3>Mon profil</h3>
      <div class="set"><div>Nom<small>${esc(fullName(u))}</small></div></div>
      <div class="set"><div>Nom d'utilisateur<small>@${esc(u.user)}</small></div></div>
      <div class="set"><div>IBAN<small>${u.card.iban}</small></div></div>
      <div class="set"><div>Client depuis<small>${new Date(u.created || Date.now()).toLocaleDateString('fr-FR')}</small></div></div></div>
    <div class="panel"><h3>Sécurité</h3>
      <label>Mot de passe actuel</label><input id="p0" type="password">
      <label>Nouveau mot de passe</label><input id="p1" type="password">
      <button class="btn" id="chPw">Modifier le mot de passe</button></div></div>`;
  $('#chPw').onclick = () => {
    if (hash($('#p0').value) !== u.pass) return toast('Mot de passe actuel incorrect', true);
    if ($('#p1').value.length < 4) return toast('4 caractères minimum', true);
    u.pass = hash($('#p1').value); save(); $('#p0').value = $('#p1').value = ''; toast('Mot de passe modifié ✔');
  };
}

render();
