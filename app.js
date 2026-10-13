const $=s=>document.querySelector(s),E=n=>n.toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const R=n=>Array.from({length:n},()=>Math.random()*10|0).join(''),N=s=>(s||'').replace(/\s/g,'').toUpperCase(),spc=s=>(s||'').replace(/(.{4})/g,'$1 ').trim();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Date.now()+''+(Math.random()*1e4|0),fd=d=>new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
let DB={users:{}},me=null,view='home',tf={mode:'iban'},pend=null,looping=0;
try{DB=JSON.parse(localStorage.getItem('nb')||'{"users":{}}')}catch(e){}
const save=()=>{try{localStorage.setItem('nb',JSON.stringify(DB))}catch(e){}};
const NP=['Lina Moreau','Karim Benali','Chloé Dubois','Yanis Martin','Sarah Lopez','Mathis Roux','Inès Girard','Hugo Petit'].map((n,i)=>({name:n,iban:'FR76300040000123456789'+i+'001',pan:'49701234567890'+i+'1',trust:.5+Math.random()*.45}));
const RS=['Remboursement resto','Cadeau 🎁','Loyer','Pari gagné','Courses','Vente Vinted','Salaire'];
const all=()=>[...NP,...Object.values(DB.users)],byI=i=>all().find(x=>x.iban==i);
const find=q=>{q=N(q);return q.length<8?null:all().find(x=>x!==me&&(N(x.iban)==q||N(x.pan)==q))||null};
const ini=n=>esc(n[0]||'?');
// AUTH
$('#tL').onclick=()=>{$('#fL').classList.remove('hidden');$('#fS').classList.add('hidden');$('#tL').classList.add('on');$('#tS').classList.remove('on');$('#ae').textContent=''};
$('#tS').onclick=()=>{$('#fS').classList.remove('hidden');$('#fL').classList.add('hidden');$('#tS').classList.add('on');$('#tL').classList.remove('on');$('#ae').textContent=''};
$('#bS').onclick=()=>{const f=$('#sF').value.trim(),l=$('#sN').value.trim(),u=$('#sU').value.trim().toLowerCase(),p=$('#sP').value;
 if(!f||!l||u.length<3||p.length<4)return $('#ae').textContent='Remplis tout (pseudo 3+, mot de passe 4+).';
 if(DB.users[u])return $('#ae').textContent='Ce nom d\'utilisateur existe déjà.';
 DB.users[u]={user:u,pass:p,name:f+' '+l,iban:'FR7630004'+R(18),pan:'4'+R(15),cvv:R(3),bal:1500,contacts:[],txs:[],notifs:[{m:'Bienvenue chez NovaBank ! 1 500 € offerts 🎉',d:Date.now(),new:1}],frozen:0,online:1,inc:1,trust:.9};
 save();login(u)};
$('#bL').onclick=()=>{const u=$('#lU').value.trim().toLowerCase(),x=DB.users[u];if(!x||x.pass!==$('#lP').value)return $('#ae').textContent='Identifiants incorrects.';login(u)};
function login(u){me=DB.users[u];DB.s=u;save();$('#auth').classList.add('hidden');$('#app').classList.remove('hidden');$('#av').textContent=ini(me.name);$('#gift').classList.toggle('hidden',!isA(me));view='home';render();if(!looping){looping=1;setTimeout(inc,6000)}}
function logout(){me=null;DB.s=null;save();$('#app').classList.add('hidden');$('#auth').classList.remove('hidden');$('#ae').textContent='';stop3d();setTimeout(()=>mount3d($('#c3a'),DEMO),60)}
// UI helpers
function toast(m,c){const t=document.createElement('div');t.className='toast '+(c||'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3800)}
function modal(h){$('#mr').innerHTML=`<div id="ov" data-act="close"><div class="modal" onclick="event.stopPropagation()"><button class="close" data-act="close">✕</button>${h}</div></div>`}
const closeM=()=>$('#mr').innerHTML='';
function bell(){const n=me.notifs.filter(x=>x.new).length;$('#dot').textContent=n;$('#dot').classList.toggle('hidden',!n)}
function list(a,nw){return a.length?a.map((t,i)=>`<div class="tx ${nw&&i==0&&t.fresh?'new':''}" data-act="tx" data-id="${t.id}"><div>${esc(t.n)}<small>${esc(t.m||'Virement')} · ${fd(t.d)}</small></div><div class="${t.t=='in'?'plus':'minus'}">${t.t=='in'?'+':'−'}${E(t.a)}</div></div>`).join(''):'<div class="empty">Aucune opération pour le moment.</div>'}
const person=p=>`<div class="found"><div class="av">${ini(p.name)}</div><div><b>${esc(p.name)}</b><div class="iban">Compte NovaBank vérifié ✔</div></div></div>`;
const grid=(add)=>`<div class="contacts">${me.contacts.map((c,i)=>{const p=byI(c);return p?`<div class="ct" data-act="pick" data-i="${i}"><button class="rm" data-act="rm" data-i="${i}">✕</button><div class="av">${ini(p.name)}</div>${esc(p.name)}<small>…${p.iban.slice(-4)}</small></div>`:''}).join('')}${add?'<div class="ct add" data-act="addm">＋<small>Ajouter</small></div>':''}</div>`;
const sw=(k,t,s)=>`<div class="set"><div>${t}<small>${s}</small></div><div class="sw ${me[k]?'on':''}" data-act="sw" data-k="${k}"></div></div>`;
const T={home:'Accueil',cards:'Ma carte',transfer:'Virements',contacts:'Bénéficiaires',history:'Opérations',help:'Aide & FAQ',settings:'Paramètres'};
const V={
home:()=>{const s=t=>me.txs.filter(x=>x.t==t).reduce((a,x)=>a+x.a,0);return `<div class="grid"><div class="panel"><h3>Solde disponible</h3><div class="balance">${E(me.bal)}</div><div class="iban">IBAN ${spc(me.iban)}</div><div class="actions"><button class="btn sm" data-act="go" data-v="transfer">Faire un virement</button><button class="btn sm ghost" data-act="go" data-v="cards">Ma carte</button></div><div class="stat"><div>Reçu<b>${E(s('in'))}</b></div><div>Envoyé<b>${E(s('out'))}</b></div></div></div><div class="panel"><h3>Dernières opérations</h3>${list(me.txs.slice(0,5),1)}</div></div>`},
cards:()=>`<div class="grid"><div class="panel"><div class="scene" id="sc"><div class="tilt" id="tl"><div class="flip ${me.frozen?'frozen':''}" data-act="flip"><div class="face front"><div class="brand">VISA</div><div class="chip"></div><div class="num">${spc(me.pan)}</div><div class="meta"><div>Titulaire<b>${esc(me.name)}</b></div><div>Expire<b>12/30</b></div></div><div class="gl"></div></div><div class="face bk"><div class="strip"></div><div class="sig"><div class="sg">${esc(me.name)}</div><div class="cvv">${me.cvv}</div></div><div class="gl"></div></div></div></div></div><div class="note">Survole pour incliner · clique pour retourner</div></div><div class="panel"><h3>Réglages de la carte</h3>${sw('frozen','Bloquer la carte','Les paiements par carte sont refusés')}${sw('online','Paiements en ligne','Autoriser les virements par n° de carte')}</div></div>`,
transfer:()=>{const m=tf.mode;return `<div class="grid"><div class="panel"><h3>Nouveau virement</h3><div class="tabs">${[['iban','IBAN'],['pan','N° de carte'],['auth','Autorisation']].map(([k,l])=>`<button class="${m==k?'on':''}" data-act="mode" data-k="${k}">${l}</button>`).join('')}</div>${m=='auth'?(me.contacts.length?`<label>Bénéficiaire (devra autoriser)</label><select id="who">${me.contacts.map(c=>`<option value="${c}" ${c==tf.who?'selected':''}>${esc(byI(c).name)}</option>`).join('')}</select>`:'<div class="empty">Ajoute d\'abord un bénéficiaire.</div>'):`<label>${m=='iban'?'IBAN':'Numéro de carte'} du bénéficiaire</label><input id="q" value="${esc(tf.q||'')}"><div style="margin-top:8px"><button class="btn sm ghost" data-act="look">Vérifier</button></div>${tf.found?person(tf.found):''}`}<label>Montant (€)</label><input id="amt" type="number" min="1" step="0.01"><label>Motif</label><input id="mo" placeholder="Optionnel" maxlength="40"><button class="btn" data-act="pre">Continuer</button><div class="err" id="er"></div></div><div class="panel"><h3>Bénéficiaires rapides</h3>${me.contacts.length?grid():'<div class="empty">Aucun bénéficiaire.</div>'}</div></div>`},
contacts:()=>`<div class="panel"><h3>Mes bénéficiaires</h3>${grid(1)}</div>`,
history:()=>`<div class="panel"><h3>Toutes les opérations</h3>${list(me.txs)}</div>`,
help:()=>`<div class="panel">${[['Comment envoyer de l\'argent ?','Trois méthodes : IBAN, numéro de carte, ou autorisation (le bénéficiaire doit accepter, il peut refuser).'],['Puis-je ajouter n\'importe qui ?','Non. Seuls les comptes existants chez NovaBank sont reconnus.'],['Pourquoi je reçois des virements ?','C\'est un jeu : des clients fictifs t\'envoient de l\'argent. Désactivable dans les paramètres.'],['À quoi sert le blocage de carte ?','Il bloque les virements par numéro de carte.']].map(([q,a])=>`<div class="faq" data-act="faq"><button>${q}</button><div>${a}</div></div>`).join('')}</div>`,
settings:()=>`<div class="panel">${sw('inc','Virements entrants (jeu)','Des clients fictifs t\'envoient de l\'argent')}<div class="actions"><button class="btn sm ghost" data-act="reset">Remettre 1 500 €</button><button class="btn sm danger" data-act="del">Supprimer mon compte</button></div></div>`};
function render(){$('#title').textContent=T[view];document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('on',b.dataset.v==view));stop3d();const vw=$('#view');vw.innerHTML=V[view]();bell();mount3d($('#c3d'),me);if(view!=LV){LV=view;vw.classList.remove('vi');void vw.offsetWidth;vw.classList.add('vi')}}
// logic
function exec(p,a,m,mode){BG.fly();me.bal-=a;me.txs.unshift({id:uid(),t:'out',n:p.name,a,m,d:Date.now(),mode});
 if(!p.trust||DB.users[p.user]){const u=DB.users[p.user];if(u){u.bal+=a;u.txs.unshift({id:uid(),t:'in',n:me.name,a,m,d:Date.now(),mode});u.notifs.unshift({m:`${me.name} t'a envoyé ${E(a)}`,d:Date.now(),new:1})}}save()}
function done(p,a){BG.burst(10);modal(`<div class="okc">✓</div><h2 style="text-align:center">Virement effectué</h2><div class="recap"><div><span>Bénéficiaire</span><span>${esc(p.name)}</span></div><div><span>Montant</span><span>${E(a)}</span></div></div><button class="btn" data-act="fin">Voir mes opérations</button>`)}
function inc(){if(me&&me.inc){const p=NP[Math.random()*NP.length|0],a=Math.round((5+Math.random()*Math.random()*400)*100)/100;me.bal+=a;me.txs.unshift({id:uid(),t:'in',n:p.name,a,m:RS[Math.random()*RS.length|0],d:Date.now(),mode:'virement',fresh:1});me.notifs.unshift({m:`${p.name} t'a envoyé ${E(a)}`,d:Date.now(),new:1});save();toast(`💸 ${p.name} : +${E(a)}`);if(view=='home'||view=='history')render();bell()}setTimeout(inc,10000+Math.random()*15000)}
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el){$('#np').classList.add('hidden');return}const d=el.dataset,a=d.act;
 if(a=='gift'){modal(`<h2>🎁 Se donner de l'argent</h2><p>Réservé à Alexandre Lestriez.</p><input id="ga" type="number" min="1" value="1000" style="margin-top:14px"><button class="btn" data-act="givego">Recevoir</button>`)}
 else if(a=='givego'){const g=Math.round(parseFloat($('#ga').value)*100)/100;if(!(g>0&&g<=1e9))return;me.bal+=g;me.txs.unshift({id:uid(),t:'in',n:'NovaBank',a:g,m:'Cadeau 🎁',d:Date.now(),mode:'virement',fresh:1});me.notifs.unshift({m:`Tu t'es donné ${E(g)} 🎁`,d:Date.now(),new:1});save();closeM();render();if(A3)A3.bump=1;BG.burst(70);toast('🎁 +'+E(g))}
 else if(a=='cnet'){me.net=d.k;save();render()}
 else if(a=='ccol'){me.col=d.k;save();render()}
 else if(a=='flip3'){if(A3)A3.flip()}
 else if(a=='go'){view=d.v;render()}
 else if(a=='out')logout();
 else if(a=='close'){if(e.target==el||el.className=='close')closeM()}
 else if(a=='fin'){closeM();view='history';render()}
 else if(a=='bell'){const n=$('#np');n.innerHTML=me.notifs.length?me.notifs.slice(0,8).map(x=>`<div class="nt">${esc(x.m)}<small>${fd(x.d)}</small></div>`).join(''):'Aucune notification.';n.classList.toggle('hidden');me.notifs.forEach(x=>x.new=0);save();bell();e.stopPropagation()}
 else if(a=='flip')el.classList.toggle('back');
 else if(a=='faq')el.classList.toggle('open');
 else if(a=='sw'){me[d.k]=!me[d.k];save();render()}
 else if(a=='mode'){tf={mode:d.k};render()}
 else if(a=='look'){tf.q=$('#q').value;tf.found=find(tf.q);render();if(!tf.found)$('#er').textContent='Aucun compte trouvé : ce bénéficiaire n\'existe pas.'}
 else if(a=='pick'){const p=byI(me.contacts[d.i]);if(view!='transfer'){tf={mode:'iban'};view='transfer'}tf.found=p;tf.who=p.iban;tf.q=tf.mode=='pan'?p.pan:p.iban;render()}
 else if(a=='rm'){me.contacts.splice(d.i,1);save();render();e.stopPropagation()}
 else if(a=='addm')modal(`<h2>Ajouter un bénéficiaire</h2><p>IBAN ou numéro de carte d'un compte existant.</p><input id="ci" style="margin-top:14px"><button class="btn" data-act="addc">Ajouter</button><div class="err" id="ce"></div>`)
 else if(a=='addc'){const p=find($('#ci').value),er=$('#ce');if(!p)return er.textContent='Compte introuvable : impossible d\'ajouter un bénéficiaire qui n\'existe pas.';if(me.contacts.includes(p.iban))return er.textContent='Déjà dans tes bénéficiaires.';me.contacts.push(p.iban);save();closeM();render();toast('Bénéficiaire ajouté')}
 else if(a=='pre'){const m=tf.mode,am=Math.round(parseFloat($('#amt').value)*100)/100,er=$('#er');let p;
  if(m=='auth')p=byI($('#who')&&$('#who').value);else p=find($('#q').value);
  if(!p)return er.textContent=m=='auth'?'Choisis un bénéficiaire.':'Bénéficiaire introuvable : ce compte n\'existe pas.';
  if(m=='pan'&&me.frozen)return er.textContent='Ta carte est bloquée.';
  if(!(am>0))return er.textContent='Montant invalide.';if(am>me.bal)return er.textContent='Solde insuffisant.';
  pend={p,am,m:$('#mo').value.trim()||'Virement',mode:m};
  modal(`<h2>Confirmer</h2><div class="recap" style="margin-top:10px"><div><span>Vers</span><span>${esc(p.name)}</span></div><div><span>Méthode</span><span>${{iban:'IBAN',pan:'N° de carte',auth:'Autorisation'}[m]}</span></div><div><span>Montant</span><span>${E(am)}</span></div><div><span>Motif</span><span>${esc(pend.m)}</span></div></div><button class="btn" data-act="pay">Confirmer</button>`)}
 else if(a=='pay'){const{p,am,m,mode}=pend;
  if(mode!='auth'){exec(p,am,m,mode);return done(p,am)}
  modal(`<h2 style="text-align:center">En attente…</h2><div class="spin"></div><p style="text-align:center">${esc(p.name)} doit autoriser le paiement</p>`);
  setTimeout(()=>{if(!me)return;if(Math.random()<(p.trust||.9)){exec(p,am,m,mode);done(p,am)}else modal(`<div class="okc" style="background:#4f1d1d;color:var(--ko)">✕</div><h2 style="text-align:center">Autorisation refusée</h2><p style="text-align:center">${esc(p.name)} a refusé le paiement. Rien n'a été débité.</p>`)},2000+Math.random()*2000)}
 else if(a=='tx'){const t=me.txs.find(x=>x.id==d.id);modal(`<h2>${t.t=='in'?'Virement reçu':'Virement émis'}</h2><div class="recap" style="margin-top:10px"><div><span>${t.t=='in'?'De':'À'}</span><span>${esc(t.n)}</span></div><div><span>Montant</span><span>${E(t.a)}</span></div><div><span>Motif</span><span>${esc(t.m||'-')}</span></div><div><span>Date</span><span>${fd(t.d)}</span></div></div>`)}
 else if(a=='reset'){me.bal=1500;save();render();toast('Solde remis à 1 500 €')}
 else if(a=='del'&&confirm('Supprimer ce compte ?')){delete DB.users[me.user];logout()}
});
document.addEventListener('mousemove',e=>{const t=$('#tl');if(!t)return;const s=e.target.closest&&e.target.closest('#sc');if(!s){t.style.transform='';return}const b=s.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;t.style.transform=`rotateY(${x*30}deg) rotateX(${-y*30}deg)`;t.style.setProperty('--gx',(x+.5)*100+'%');t.style.setProperty('--gy',(y+.5)*100+'%')});
const isA=u=>[u.name,u.user].some(x=>(x||'').toLowerCase().replace(/\s+/g,' ').trim()=='alexandre lestriez');
const CC={violet:['#3b2fc9','#00cec9','#fff'],noir:['#0c0d12','#3d4052','#e8e8f0'],or:['#a67c00','#f7e08a','#2b2000'],rouge:['#8f0a22','#ff6b6b','#fff'],bleu:['#082a6b','#4aa8ff','#fff'],vert:['#064d39','#2ee6a6','#fff'],rose:['#a3124f','#ff8ad8','#fff'],argent:['#7b828c','#f4f6f8','#1b1f27']};
let K=null,LV,A3=null;
function stop3d(){if(A3){cancelAnimationFrame(A3.raf);A3.ro.disconnect();A3.r.forceContextLoss();A3.r.dispose();A3=null}}
function logo(x,b,tc){const n=K.net||'visa';x.save();
 if(n=='visa'){x.font='italic 800 108px Georgia,serif';x.fillStyle=b?'#fff':tc;x.fillText('VISA',700,590)}
 else if(n=='mc'){x.fillStyle=b?'#fff':'#eb001b';x.beginPath();x.arc(840,540,62,0,7);x.fill();x.fillStyle=b?'#fff':'#f79e1b';x.globalAlpha=b?1:.92;x.beginPath();x.arc(910,540,62,0,7);x.fill()}
 else{x.fillStyle=b?'#fff':tc;x.font='800 64px system-ui';x.fillText('◆ NOVA',690,585)}
 x.restore()}
function face(back,b){const cv=document.createElement('canvas');cv.width=1024;cv.height=644;const x=cv.getContext('2d'),[c1,c2,tc]=CC[K.col||'violet'];
 const tt=(s,X,Y,f)=>{x.font=f;x.fillStyle=b?'#fff':tc;x.fillText(s,X,Y)};
 if(b){x.fillStyle='#000';x.fillRect(0,0,1024,644)}else{const g=x.createLinearGradient(0,0,1024,644);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,1024,644);x.globalAlpha=.1;x.strokeStyle=tc;x.lineWidth=2;for(let i=0;i<28;i++){x.beginPath();x.ellipse(800,160,50+i*28,30+i*18,i*.1,0,7);x.stroke()}x.globalAlpha=1}
 if(!back){tt('NOVABANK',60,100,'800 52px system-ui');
  const g=x.createLinearGradient(60,200,170,290);g.addColorStop(0,'#f6e08a');g.addColorStop(1,'#b8892f');x.fillStyle=b?'#888':g;x.fillRect(60,200,120,92);x.strokeStyle=b?'#000':'#6b4d12';x.lineWidth=3;x.strokeRect(60,200,120,92);x.beginPath();x.moveTo(60,246);x.lineTo(180,246);x.moveTo(110,200);x.lineTo(110,292);x.moveTo(150,200);x.lineTo(150,292);x.stroke();
  x.strokeStyle=b?'#fff':tc;x.lineWidth=7;for(let i=1;i<4;i++){x.beginPath();x.arc(235,246,i*17,-.9,.9);x.stroke()}
  tt(spc(K.pan),60,410,'600 70px "Courier New",monospace');tt('VALIDE JUSQU\'AU 12/30',60,490,'600 28px system-ui');tt(K.name.toUpperCase(),60,570,'600 42px system-ui')}
 else{x.fillStyle=b?'#333':'#0a0a0a';x.fillRect(0,70,1024,110);x.fillStyle=b?'#777':'#f4f4f4';x.fillRect(60,230,620,90);x.fillStyle='#fff';x.fillRect(720,230,160,90);x.fillStyle='#000';x.font='italic 44px serif';x.fillText(K.name,80,288);x.font='700 48px "Courier New",monospace';x.fillText(K.cvv,745,290);tt('Service client NovaBank · jeu fictif',60,420,'26px system-ui')}
 logo(x,b,tc);
 const t=new THREE.CanvasTexture(cv);t.anisotropy=8;t.encoding=b?THREE.LinearEncoding:THREE.sRGBEncoding;return t}
function mount3d(el,u){K=u;if(!el||!window.THREE)return;let W=el.clientWidth,H=el.clientHeight;
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(W,H);r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;el.append(r.domElement);
 const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(28,W/H,.1,60);cam.position.set(0,.9,9.4);cam.lookAt(0,0,0);
 const env=new THREE.Scene();env.background=new THREE.Color(0x1c2234);
 [[0,4,3,6,2,0xffffff,14],[-5,0,2,2,5,0x88aaff,7],[5,-1,2,2,5,0xffb3e6,6],[0,-4,-3,8,1,0x444466,2]].forEach(([X,Y,Z,w,h,c,i])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i),side:2}));m.position.set(X,Y,Z);m.lookAt(0,0,0);env.add(m)});
 sc.environment=new THREE.PMREMGenerator(r).fromScene(env,.04).texture;
 const dl=new THREE.DirectionalLight(0xffffff,1.1);dl.position.set(2,3,5);sc.add(dl);
 const w=3.4,h=2.14,q=.2,s=new THREE.Shape();s.moveTo(-w/2+q,-h/2);s.lineTo(w/2-q,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+q);s.lineTo(w/2,h/2-q);s.quadraticCurveTo(w/2,h/2,w/2-q,h/2);s.lineTo(-w/2+q,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-q);s.lineTo(-w/2,-h/2+q);s.quadraticCurveTo(-w/2,-h/2,-w/2+q,-h/2);
 const geo=new THREE.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:4,curveSegments:24});geo.translate(0,0,-.02);
 const col=CC[K.col||'violet'],body=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:new THREE.Color(col[0]).multiplyScalar(.6),metalness:.9,roughness:.28,clearcoat:.6}));
 const mk=bk=>{const g=new THREE.ShapeGeometry(s,24),u=g.attributes.uv,p=g.attributes.position;for(let i=0;i<u.count;i++)u.setXY(i,(p.getX(i)+w/2)/w,(p.getY(i)+h/2)/h);const m=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({map:face(bk),bumpMap:face(bk,1),bumpScale:bk?1:4,metalness:.3,roughness:.4,clearcoat:1,clearcoatRoughness:.06}));m.position.z=bk?-.0365:.0365;if(bk)m.rotation.y=Math.PI;return m};
 const fr=mk(0),card=new THREE.Group();if(K.frozen)fr.material.color.setScalar(.3);const hu={uT:{value:0}},hol=new THREE.Mesh(new THREE.CircleGeometry(.24,48),new THREE.ShaderMaterial({uniforms:hu,transparent:true,vertexShader:'varying vec3 vN,vV;varying vec2 vU;void main(){vU=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform float uT;varying vec3 vN,vV;varying vec2 vU;void main(){float d=dot(vN,vV);vec2 p=vU-.5;float s=.5+.5*sin(atan(p.y,p.x)*6.+uT*2.);vec3 c=.55+.45*cos(6.2831*(d*2.5+s*.3+vec3(0.,.33,.67)));gl_FragColor=vec4(c,.92);}'}));hol.position.set(1.15,.6,.0375);card.add(body,fr,mk(1),hol);card.scale.setScalar(1.15);sc.add(card);
 const c2=document.createElement('canvas');c2.width=c2.height=128;const g2=c2.getContext('2d'),rg=g2.createRadialGradient(64,64,0,64,64,64);rg.addColorStop(0,'rgba(0,0,0,.6)');rg.addColorStop(1,'rgba(0,0,0,0)');g2.fillStyle=rg;g2.fillRect(0,0,128,128);
 const shd=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c2),transparent:true,depthWrite:false}));shd.rotation.x=-Math.PI/2;shd.position.y=-1.95;sc.add(shd);
 let ty=0,tx=0,cy=0,cx=0,drag=0,lx=0,ly=0,t=0,mx=0,my=0;const dom=r.domElement;dom.style.touchAction='pan-y';dom.style.cursor='grab';
 dom.onpointerdown=e=>{drag=1;lx=e.clientX;ly=e.clientY;dom.setPointerCapture(e.pointerId)};
 dom.onpointermove=e=>{const b=dom.getBoundingClientRect();mx=(e.clientX-b.left)/b.width-.5;my=(e.clientY-b.top)/b.height-.5;if(drag){ty+=(e.clientX-lx)*.012;tx=Math.max(-.7,Math.min(.7,tx+(e.clientY-ly)*.008));lx=e.clientX;ly=e.clientY}};
 dom.onpointerup=()=>{drag=0;ty=Math.round(ty/Math.PI)*Math.PI;tx=0};dom.onpointerleave=()=>{mx=my=0};
 const A={r,bump:0,flip(){ty=Math.round(ty/Math.PI)*Math.PI+Math.PI}};A3=A;
 A.ro=new ResizeObserver(()=>{W=el.clientWidth;H=el.clientHeight;if(!W||!H)return;r.setSize(W,H);cam.aspect=W/H;cam.updateProjectionMatrix()});A.ro.observe(el);
 (function lp(){A.raf=requestAnimationFrame(lp);t+=.016;hu.uT.value=t;const id=drag?0:1;
  cy+=(ty+id*(mx*.7+Math.sin(t*.6)*.12)-cy)*.09;cx+=(tx+id*(my*.5+Math.cos(t*.5)*.05)-cx)*.09;card.rotation.set(cx,cy,Math.sin(t*.4)*.02*id);
  card.position.y=Math.sin(t*1.1)*.08+(A.bump>0?Math.sin(A.bump*18)*.14:0);if(A.bump>0)A.bump-=.025;
  shd.scale.setScalar(1-Math.sin(t*1.1)*.05);dl.position.x=2+mx*6;dl.position.y=3-my*4;r.render(sc,cam)})()}
V.home=()=>{const s=t=>me.txs.filter(x=>x.t==t).reduce((a,x)=>a+x.a,0);return `<div class="grid"><div class="panel"><h3>Solde disponible</h3><div class="balance">${E(me.bal)}</div><div class="iban">IBAN ${spc(me.iban)}</div><div class="actions"><button class="btn sm" data-act="go" data-v="transfer">💸 Virement</button></div><div class="stat"><div>Reçu<b>${E(s('in'))}</b></div><div>Envoyé<b>${E(s('out'))}</b></div></div></div><div class="panel hero"><div id="c3d" class="c3d"></div></div><div class="panel" style="grid-column:1/-1"><h3>Dernières opérations</h3>${list(me.txs.slice(0,5),1)}</div></div>`};
V.cards=()=>`<div class="grid"><div class="panel hero"><div id="c3d" class="c3d tall"></div><div class="actions" style="justify-content:center"><button class="btn sm ghost" data-act="flip3">🔄 Retourner</button></div><div class="note" style="margin-top:10px">Glisse pour faire tourner la carte</div></div><div class="panel"><h3>Réseau</h3><div class="pk">${[['visa','Visa'],['mc','Mastercard'],['nova','Nova']].map(([k,l])=>`<button class="${(me.net||'visa')==k?'on':''}" data-act="cnet" data-k="${k}">${l}</button>`).join('')}</div><h3 style="margin-top:16px">Couleur</h3><div class="pk">${Object.keys(CC).map(k=>`<button class="sd ${(me.col||'violet')==k?'on':''}" style="background:linear-gradient(135deg,${CC[k][0]},${CC[k][1]})" title="${k}" data-act="ccol" data-k="${k}"></button>`).join('')}</div>${sw('frozen','Bloquer la carte','Les paiements par carte sont refusés')}${sw('online','Paiements en ligne','Autoriser les virements par n° de carte')}</div></div>`;
const oi=inc;inc=function(){const b=me&&me.bal;oi();if(me&&me.bal!==b){if(A3)A3.bump=1;BG.burst(14)}};
document.addEventListener('mousemove',e=>{const p=e.target.closest&&e.target.closest('.panel:not(.hero),.ct');document.querySelectorAll('.tt').forEach(x=>{if(x!==p){x.style.transform='';x.classList.remove('tt')}});if(!p)return;const b=p.getBoundingClientRect(),X=(e.clientX-b.left)/b.width-.5,Y=(e.clientY-b.top)/b.height-.5;p.classList.add('tt');p.style.transform=`perspective(900px) rotateY(${X*6}deg) rotateX(${-Y*6}deg) translateZ(6px)`});
const DEMO={name:'VOTRE NOM',pan:'4970123456789012',cvv:'123',col:'violet',net:'visa',frozen:0};
const BG=(()=>{if(!window.THREE)return{burst(){},fly(){}};
const cv=document.createElement('canvas');cv.id='bg3d';document.body.prepend(cv);
const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,1,.1,100);cam.position.z=12;
const en=new THREE.Scene();en.background=new THREE.Color(0x1c2234);[[0,4,3,6,2,0xffffff,14],[-5,0,2,2,5,0x88aaff,7],[5,-1,2,2,5,0xffb3e6,6]].forEach(([X,Y,Z,w,h,c,i])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i),side:2}));m.position.set(X,Y,Z);m.lookAt(0,0,0);en.add(m)});
sc.environment=new THREE.PMREMGenerator(r).fromScene(en,.04).texture;
const k=document.createElement('canvas');k.width=k.height=256;const x=k.getContext('2d'),g=x.createRadialGradient(128,100,10,128,128,128);g.addColorStop(0,'#fff0a8');g.addColorStop(1,'#c9962b');x.fillStyle=g;x.fillRect(0,0,256,256);x.strokeStyle='#8a5f10';x.lineWidth=10;x.beginPath();x.arc(128,128,100,0,7);x.stroke();x.fillStyle='#8a5f10';x.font='bold 150px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.fillText('\u20ac',128,138);
const t=new THREE.CanvasTexture(k);t.encoding=THREE.sRGBEncoding;
const cap=new THREE.MeshStandardMaterial({map:t,metalness:1,roughness:.3}),sd=new THREE.MeshStandardMaterial({color:0xc99a2e,metalness:1,roughness:.28}),geo=new THREE.CylinderGeometry(.5,.5,.1,48);
const coin=s=>{const m=new THREE.Mesh(geo,[sd,cap,cap]);m.scale.setScalar(s);m.rotation.set(Math.random()*6,Math.random()*6,0);sc.add(m);return m},rn=(a,b)=>a+Math.random()*(b-a);
const F=[],n=innerWidth<700?16:34;
for(let i=0;i<n;i++){const m=coin(rn(.5,1.1));m.position.set(rn(-15,15),rn(-9,9),rn(-16,2));F.push({m,ry:rn(.004,.015),rx:rn(.002,.01),ph:rn(0,6),y:m.position.y})}
const S=[0x6c5ce7,0x00cec9,0xff7ab8].flatMap(c=>[0,1,2].map(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(rn(.3,.8),32,24),new THREE.MeshPhysicalMaterial({color:c,metalness:.1,roughness:.05,clearcoat:1,transparent:true,opacity:.5}));m.position.set(rn(-14,14),rn(-8,8),rn(-14,0));sc.add(m);return{m,ph:rn(0,6),y:m.position.y}}));
const B=[];let mx=0,my=0,sy=0,tt=0;
addEventListener('mousemove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});addEventListener('scroll',()=>sy=scrollY,{passive:true});
function rs(){r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',rs);rs();
(function lp(){requestAnimationFrame(lp);tt+=.01;
 F.forEach(o=>{o.m.rotation.y+=o.ry;o.m.rotation.x+=o.rx;o.m.position.y=o.y+Math.sin(tt+o.ph)*.5});
 S.forEach(o=>o.m.position.y=o.y+Math.sin(tt*.8+o.ph)*.6);
 for(let i=B.length-1;i>=0;i--){const b=B[i];if(b.fly){b.t++;const p=b.t/80;b.m.position.set(-6+12*p,-3+4*p+Math.sin(p*Math.PI)*3.5,3-2*p);b.m.rotation.y+=.3;b.m.rotation.x+=.1;if(p>=1){sc.remove(b.m);B.splice(i,1)}}else{b.vy-=.012;b.m.position.x+=b.vx;b.m.position.y+=b.vy;b.m.position.z+=b.vz;b.m.rotation.x+=b.rx;b.m.rotation.y+=b.ry;if(b.m.position.y<-11){sc.remove(b.m);B.splice(i,1)}}}
 cam.position.x+=(mx*3-cam.position.x)*.04;cam.position.y+=(-my*2-sy*.004-cam.position.y)*.04;cam.lookAt(0,-sy*.002,0);r.render(sc,cam)})();
return{burst(c){for(let i=0;i<c;i++){const m=coin(rn(.4,.8));m.position.set(rn(-8,8),rn(9,14),rn(-3,5));B.push({m,vx:rn(-.02,.02),vy:rn(-.1,0),vz:rn(-.01,.03),rx:rn(.05,.2),ry:rn(.05,.2)})}},fly(){const m=coin(.9);m.position.set(-6,-3,3);B.push({m,fly:1,t:0})}}})();
if(DB.s&&DB.users[DB.s])login(DB.s);else mount3d($('#c3a'),DEMO);
