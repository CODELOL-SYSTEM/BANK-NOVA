/* NovaBank — démo 100% fictive. Tout est stocké dans le navigateur (localStorage). */
const $ = s => document.querySelector(s);
const DB_KEY = 'novabank_db', SES_KEY = 'novabank_session';

let db = JSON.parse(localStorage.getItem(DB_KEY) || '{"users":{}}');
let me = localStorage.getItem(SES_KEY);
let masked = false;

const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
const euro = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const rnd = n => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// petit hash (démo uniquement, pas de la vraie sécurité)
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

/* ---------- Génération de la fausse carte ---------- */
function genCard(first, last) {
  const num = '4' + rnd(15); // commence par 4 comme une Visa, mais c'est du faux
  const now = new Date();
  const exp = String(now.getMonth() + 1).padStart(2, '0') + '/' + String((now.getFullYear() + 4) % 100).padStart(2, '0');
  return {
    number: num.replace(/(.{4})/g, '$1 ').trim(),
    exp,
    cvv: rnd(3),
    holder: (first + ' ' + last).toUpperCase(),
    iban: 'FR76 ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(4) + ' ' + rnd(3)
  };
}

/* ---------- Auth ---------- */
$('#tabLogin').onclick = () => switchTab(true);
$('#tabSignup').onclick = () => switchTab(false);
function switchTab(login) {
  $('#tabLogin').classList.toggle('on', login);
  $('#tabSignup').classList.toggle('on', !login);
  $('#formLogin').classList.toggle('hidden', !login);
  $('#formSignup').classList.toggle('hidden', login);
  $('#authErr').textContent = '';
}

$('#btnSignup').onclick = () => {
  const first = $('#sFirst').value.trim(), last = $('#sLast').value.trim();
  const user = $('#sUser').value.trim().toLowerCase(), pass = $('#sPass').value;
  if (!first || !last || !user || pass.length < 4) return authErr('Remplis tout (mot de passe : 4 caractères min).');
  if (db.users[user]) return authErr('Ce nom d\'utilisateur existe déjà.');
  db.users[user] = {
    first, last, user, pass: hash(pass),
    card: genCard(first, last),
    balance: 0, contacts: [], tx: []
  };
  save();
  login(user);
};

$('#btnLogin').onclick = () => {
  const user = $('#lUser').value.trim().toLowerCase(), pass = $('#lPass').value;
  const u = db.users[user];
  if (!u || u.pass !== hash(pass)) return authErr('Identifiants incorrects.');
  login(user);
};
function authErr(m) { $('#authErr').textContent = m; }

function login(user) {
  me = user;
  localStorage.setItem(SES_KEY, me);
  render();
}
$('#btnLogout').onclick = () => {
  me = null;
  localStorage.removeItem(SES_KEY);
  render();
};

/* ---------- Affichage ---------- */
function render() {
  const u = db.users[me];
  $('#auth').classList.toggle('hidden', !!u);
  $('#app').classList.toggle('hidden', !u);
  if (!u) { me = null; return; }

  $('#whoName').textContent = u.first + ' ' + u.last + ' (@' + u.user + ')';
  $('#balance').textContent = euro(u.balance);
  $('#iban').textContent = u.card.iban;

  const num = masked ? '•••• •••• •••• ' + u.card.number.slice(-4) : u.card.number;
  $('#cNum').textContent = num;
  $('#cName').textContent = u.card.holder;
  $('#cExp').textContent = u.card.exp;
  $('#cCvv').textContent = masked ? '•••' : u.card.cvv;
  $('#cSig').textContent = u.first + ' ' + u.last;

  // contacts
  $('#contacts').innerHTML =
    u.contacts.map((c, i) => `
      <div class="ct" data-i="${i}">
        <div class="av">${esc(c.name[0].toUpperCase())}</div>
        ${esc(c.name)}<small>${c.username ? '@' + esc(c.username) : 'externe'}</small>
      </div>`).join('') +
    `<div class="ct add" id="addCt">＋<small>Ajouter</small></div>`;
  document.querySelectorAll('.ct[data-i]').forEach(el => el.onclick = () => openSend(+el.dataset.i));
  $('#addCt').onclick = openAddContact;

  // historique
  $('#history').innerHTML = u.tx.length
    ? u.tx.slice().reverse().slice(0, 12).map(t => `
        <div class="tx">
          <div>${esc(t.label)}<small>${new Date(t.date).toLocaleString('fr-FR')}</small></div>
          <div class="${t.amount >= 0 ? 'plus' : 'minus'}">${t.amount >= 0 ? '+' : ''}${euro(t.amount)}</div>
        </div>`).join('')
    : '<div class="empty">Aucune opération pour l\'instant.</div>';
}

$('#flip').onclick = () => $('#flip').classList.toggle('back');
$('#btnShow').onclick = () => { masked = !masked; render(); };
$('#btnSend').onclick = () => openSend(-1);

/* ---------- Modales ---------- */
function openModal(html) {
  $('#modalRoot').innerHTML = `<div id="ov"><div class="modal"><button class="close" id="mClose">✕</button>${html}</div></div>`;
  $('#mClose').onclick = closeModal;
  $('#ov').onclick = e => { if (e.target.id === 'ov') closeModal(); };
}
function closeModal() { $('#modalRoot').innerHTML = ''; }
function toast(msg, ko) {
  const t = document.createElement('div');
  t.className = 'toast' + (ko ? ' ko' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function addTx(u, label, amount) { u.tx.push({ label, amount, date: Date.now() }); }

/* --- Ajout d'argent : endroit caché = clic sur le logo "NovaBank" en haut à gauche --- */
$('#logo').onclick = () => {
  if (!me) return;
  const methods = [
    ['🏦', 'Virement'], ['💳', 'Carte'], ['💶', 'Espèces'], ['🎁', 'Code cadeau']
  ];
  openModal(`
    <h2>Ajouter de l'argent</h2>
    <p>Choisis une méthode.</p>
    <div class="opts">${methods.map((m, i) => `<button class="opt ${i === 0 ? 'on' : ''}" data-m="${m[1]}"><i>${m[0]}</i>${m[1]}</button>`).join('')}</div>
    <label>Montant (€)</label><input id="amt" type="number" min="1" step="1" value="50">
    <button class="btn" id="doAdd">Ajouter</button>`);
  let method = 'Virement';
  document.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    document.querySelectorAll('.opt').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); method = b.dataset.m;
  });
  $('#doAdd').onclick = () => {
    const a = parseFloat($('#amt').value);
    if (!(a > 0) || a > 100000) return toast('Montant invalide', true);
    const u = db.users[me];
    u.balance += a;
    addTx(u, 'Ajout par ' + method.toLowerCase(), a);
    save(); closeModal(); render(); toast('+' + euro(a) + ' ajoutés ✔');
  };
};

/* --- Contacts --- */
function openAddContact() {
  openModal(`
    <h2>Nouveau contact</h2>
    <label>Nom</label><input id="cn">
    <label>Nom d'utilisateur NovaBank (optionnel)</label><input id="cu" placeholder="pour envoyer à un autre compte du site">
    <button class="btn" id="saveCt">Enregistrer</button>`);
  $('#saveCt').onclick = () => {
    const name = $('#cn').value.trim(), username = $('#cu').value.trim().toLowerCase();
    if (!name) return toast('Mets un nom', true);
    if (username && !db.users[username]) return toast('Utilisateur introuvable', true);
    if (username === me) return toast('C\'est toi !', true);
    db.users[me].contacts.push({ name, username });
    save(); closeModal(); render();
  };
}

/* --- Envoyer de l'argent --- */
function openSend(idx) {
  const u = db.users[me];
  if (!u.contacts.length) { toast('Ajoute d\'abord un contact', true); return openAddContact(); }
  openModal(`
    <h2>Envoyer de l'argent</h2>
    <label>Destinataire</label>
    <select id="to">${u.contacts.map((c, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <label>Montant (€)</label><input id="sa" type="number" min="1" step="0.01">
    <label>Message (optionnel)</label><input id="sm" maxlength="40">
    <button class="btn" id="doSend">Envoyer</button>`);
  $('#doSend').onclick = () => {
    const c = u.contacts[+$('#to').value], a = parseFloat($('#sa').value), m = $('#sm').value.trim();
    if (!(a > 0)) return toast('Montant invalide', true);
    if (a > u.balance) return toast('Solde insuffisant', true);
    u.balance -= a;
    addTx(u, 'Envoi à ' + c.name + (m ? ' — ' + m : ''), -a);
    if (c.username && db.users[c.username]) {
      db.users[c.username].balance += a;
      addTx(db.users[c.username], 'Reçu de ' + u.first + (m ? ' — ' + m : ''), a);
    }
    save(); closeModal(); render(); toast(euro(a) + ' envoyés à ' + c.name + ' ✔');
  };
}

render();
