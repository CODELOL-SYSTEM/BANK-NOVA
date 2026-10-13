<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NovaBank</title>
<style>
  :root{--bg:#0f1220;--panel:#171b2e;--panel2:#1f2440;--txt:#eef0ff;--mut:#8b91b8;--acc:#6c5ce7;--acc2:#00cec9;--ok:#2ecc71;--ko:#ff6b6b;--warn:#fdcb6e;--r:18px;--line:#262c50}
  *{box-sizing:border-box;margin:0;padding:0;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif}
  body{background:radial-gradient(1200px 600px at 10% -10%,#262b55 0,transparent 60%),var(--bg);color:var(--txt);min-height:100vh}
  button{cursor:pointer;border:0;color:inherit;font-size:inherit}
  input,select,textarea{width:100%;padding:12px 14px;border-radius:12px;border:1px solid #2c3258;background:var(--panel2);color:var(--txt);font-size:15px;outline:none}
  input:focus,select:focus{border-color:var(--acc)}
  label{font-size:12px;color:var(--mut);display:block;margin:12px 0 6px}
  .btn{background:linear-gradient(135deg,var(--acc),#8e7dff);padding:12px 18px;border-radius:12px;font-weight:600;font-size:15px;width:100%;margin-top:16px;transition:.15s}
  .btn:hover{transform:translateY(-1px);filter:brightness(1.1)}
  .btn.ghost{background:var(--panel2);width:auto;margin:0;padding:10px 16px;font-size:14px}
  .btn.sm{width:auto;margin:0;padding:8px 14px;font-size:13px}
  .btn.danger{background:#3a1f2c;color:var(--ko)}
  .hidden{display:none!important}

  /* AUTH */
  #auth{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .box{background:var(--panel);border-radius:var(--r);padding:30px;width:100%;max-width:420px;box-shadow:0 20px 60px #0007}
  .logo{font-weight:800;font-size:24px;letter-spacing:.5px}
  .logo span{color:var(--acc2)}
  .tabs{display:flex;background:var(--panel2);border-radius:12px;padding:4px;margin:20px 0 6px}
  .tabs button{flex:1;padding:10px;border-radius:9px;background:transparent;color:var(--mut);font-weight:600}
  .tabs button.on{background:var(--acc);color:#fff}
  .row{display:flex;gap:10px}.row>div{flex:1}
  .err{color:var(--ko);font-size:13px;margin-top:10px;min-height:16px}

  /* LAYOUT */
  #app{display:flex;min-height:100vh}
  aside{width:230px;background:var(--panel);padding:22px 14px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh;flex-shrink:0}
  aside .logo{padding:0 10px 20px;cursor:pointer;user-select:none}
  .nav{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:transparent;color:var(--mut);font-weight:600;text-align:left;font-size:14px}
  .nav:hover{background:var(--panel2);color:var(--txt)}
  .nav.on{background:var(--acc);color:#fff}
  .nav .ic{width:20px;text-align:center}
  .spacer{flex:1}
  .content{flex:1;min-width:0}
  .top{display:flex;justify-content:space-between;align-items:center;padding:20px 30px}
  .top h1{font-size:22px}
  .who{display:flex;align-items:center;gap:14px;color:var(--mut);font-size:14px;position:relative}
  .bell{background:var(--panel);width:42px;height:42px;border-radius:12px;position:relative;font-size:18px}
  .bell .dot{position:absolute;top:-5px;right:-5px;background:var(--ko);color:#fff;font-size:11px;border-radius:10px;min-width:19px;height:19px;display:flex;align-items:center;justify-content:center;font-weight:700}
  .avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff}
  #notifPanel{position:absolute;top:56px;right:0;width:320px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:0 20px 50px #000a;z-index:5}
  .nt{padding:10px 0;border-bottom:1px solid var(--line);font-size:13px}.nt:last-child{border:0}
  .nt small{color:var(--mut);display:block;margin-top:2px}.nt.new{color:#fff;font-weight:600}
  #view{padding:0 30px 50px;max-width:1100px}
  .grid{display:grid;grid-template-columns:1.1fr 1fr;gap:22px}
  .full{grid-column:1/-1}
  @media(max-width:900px){
    #app{flex-direction:column}
    aside{width:100%;height:auto;position:fixed;bottom:0;left:0;top:auto;flex-direction:row;padding:6px;z-index:8;overflow-x:auto;border-top:1px solid var(--line)}
    aside .logo,.spacer,.nav span.t{display:none}
    .nav{flex:1;justify-content:center;padding:12px 8px}
    #view{padding:0 14px 90px}.top{padding:16px 14px}.grid{grid-template-columns:1fr}
    #notifPanel{width:280px}
  }
  .panel{background:var(--panel);border-radius:var(--r);padding:24px}
  .panel+.panel{margin-top:0}
  h3{font-size:15px;color:var(--mut);font-weight:600;margin-bottom:14px}
  .balance{font-size:44px;font-weight:800;margin:4px 0 2px}
  .iban{color:var(--mut);font-size:13px;margin-bottom:6px}
  .actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
  .stat{display:flex;gap:12px;margin-top:18px}
  .stat div{flex:1;background:var(--panel2);border-radius:12px;padding:12px;font-size:12px;color:var(--mut)}
  .stat b{display:block;font-size:17px;color:var(--txt);margin-top:3px}

  /* CARTE */
  .scene{perspective:1000px;width:100%;max-width:380px;height:230px;margin:18px auto 8px}
  .flip{position:relative;width:100%;height:100%;transition:transform .7s;transform-style:preserve-3d;cursor:pointer}
  .flip.back{transform:rotateY(180deg)}
  .face{position:absolute;inset:0;border-radius:18px;backface-visibility:hidden;padding:22px;box-shadow:0 18px 40px #0008;overflow:hidden}
  .front{background:linear-gradient(135deg,#6c5ce7,#00cec9 120%)}
  .front::after{content:"";position:absolute;width:300px;height:300px;border-radius:50%;background:#fff1;right:-100px;top:-120px}
  .frozen .front{filter:grayscale(1) brightness(.7)}
  .bk{transform:rotateY(180deg);background:linear-gradient(135deg,#2d3436,#1b1f3a);padding:0}
  .strip{height:42px;background:#000;margin-top:26px}
  .sig{margin:20px 22px 0;display:flex;gap:8px;align-items:center}
  .sig .sg{flex:1;height:36px;background:repeating-linear-gradient(45deg,#fff,#fff 6px,#e8e8e8 6px,#e8e8e8 12px);border-radius:4px;color:#222;font-style:italic;padding:8px;font-size:13px}
  .sig .cvv{background:#fff;color:#111;padding:8px 12px;border-radius:4px;font-weight:700;letter-spacing:2px}
  .chip{width:44px;height:32px;border-radius:7px;background:linear-gradient(135deg,#f6d365,#fda085);margin-top:26px}
  .num{font-size:21px;letter-spacing:2.5px;margin-top:20px;font-weight:600;text-shadow:0 1px 2px #0004}
  .meta{display:flex;justify-content:space-between;margin-top:16px;font-size:12px;text-transform:uppercase}
  .meta b{display:block;font-size:14px;letter-spacing:1px}
  .brand{position:absolute;right:22px;top:20px;font-weight:800;font-style:italic;font-size:20px}
  .note{font-size:12px;color:var(--mut);text-align:center;margin-top:6px}
  .bk .note2{position:absolute;bottom:14px;left:22px;right:22px;font-size:10px;color:#9aa0c8}
  .set{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--line);font-size:14px}
  .set small{color:var(--mut);display:block;margin-top:2px}
  .sw{width:46px;height:26px;border-radius:13px;background:#343b6b;position:relative;transition:.2s;flex-shrink:0}
  .sw::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
  .sw.on{background:var(--acc2)}.sw.on::after{left:23px}

  /* CONTACTS */
  .contacts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .ct{background:var(--panel2);border-radius:14px;padding:18px 10px;text-align:center;cursor:pointer;transition:.15s;border:1px solid transparent;position:relative}
  .ct:hover{border-color:var(--acc);transform:translateY(-2px)}
  .av{width:48px;height:48px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-weight:700;background:linear-gradient(135deg,var(--acc),var(--acc2))}
  .ct small{color:var(--mut);display:block;font-size:11px;margin-top:2px}
  .ct .rm{position:absolute;top:6px;right:8px;background:none;color:var(--mut);font-size:14px}
  .ct .rm:hover{color:var(--ko)}
  .ct.add{border:2px dashed #343b6b;background:transparent;color:var(--mut);display:flex;flex-direction:column;justify-content:center;font-size:26px}
  .ct.add small{font-size:12px}

  /* HISTORIQUE */
  .tx{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid var(--line);font-size:14px;gap:10px}
  .tx small{color:var(--mut);display:block;margin-top:2px}
  .tx.click{cursor:pointer}.tx.click:hover{background:#ffffff08}
  .plus{color:var(--ok);font-weight:700;white-space:nowrap}.minus{color:var(--ko);font-weight:700;white-space:nowrap}
  .empty{color:var(--mut);font-size:14px;padding:10px 0}
  .found{background:var(--panel2);border-radius:12px;padding:14px;margin-top:12px;display:flex;align-items:center;gap:12px}
  .found .av{margin:0}
  .recap div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}
  .recap span:first-child{color:var(--mut)}
  .okcircle{width:70px;height:70px;border-radius:50%;background:#1d4f33;color:var(--ok);font-size:34px;display:flex;align-items:center;justify-content:center;margin:6px auto 14px}

  /* FAQ */
  .faq{border-bottom:1px solid var(--line)}
  .faq button{width:100%;background:none;text-align:left;padding:16px 0;font-weight:600;display:flex;justify-content:space-between;font-size:15px}
  .faq div{color:var(--mut);font-size:14px;line-height:1.55;padding:0 0 16px;display:none}
  .faq.open div{display:block}
  .faq.open .pl{transform:rotate(45deg)}.pl{transition:.2s}

  /* MODAL */
  #ov{position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;padding:20px;z-index:10;animation:fade .2s}
  .modal{background:var(--panel);border-radius:var(--r);padding:26px;width:100%;max-width:430px;animation:pop .25s;max-height:90vh;overflow:auto}
  .modal h2{margin-bottom:6px}
  .modal p{color:var(--mut);font-size:14px}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
  .opt{background:var(--panel2);padding:16px 10px;border-radius:14px;text-align:center;border:2px solid transparent;font-size:14px;font-weight:600}
  .opt i{display:block;font-style:normal;font-size:24px;margin-bottom:6px}
  .opt.on{border-color:var(--acc2)}
  .close{float:right;background:none;font-size:22px;color:var(--mut)}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ok);color:#06210f;padding:12px 20px;border-radius:12px;font-weight:600;z-index:20;animation:pop .25s;max-width:90%}
  .toast.ko{background:var(--ko);color:#2b0505}.toast.info{background:var(--acc);color:#fff}
  @keyframes fade{from{opacity:0}}@keyframes pop{from{opacity:0;transform:scale(.94)}}
</style>
</head>
<body>

<!-- CONNEXION / INSCRIPTION -->
<section id="auth">
  <div class="box">
    <div class="logo">Nova<span>Bank</span></div>
    <div class="tabs">
      <button id="tabLogin" class="on">Connexion</button>
      <button id="tabSignup">Ouvrir un compte</button>
    </div>
    <div id="formLogin">
      <label>Nom d'utilisateur</label><input id="lUser" autocomplete="username">
      <label>Mot de passe</label><input id="lPass" type="password" autocomplete="current-password">
      <button class="btn" id="btnLogin">Se connecter</button>
    </div>
    <div id="formSignup" class="hidden">
      <div class="row">
        <div><label>Prénom</label><input id="sFirst"></div>
        <div><label>Nom</label><input id="sLast"></div>
      </div>
      <label>Nom d'utilisateur</label><input id="sUser" autocomplete="username">
      <label>Mot de passe</label><input id="sPass" type="password" autocomplete="new-password">
      <button class="btn" id="btnSignup">Ouvrir mon compte</button>
    </div>
    <div class="err" id="authErr"></div>
  </div>
</section>

<!-- APPLI -->
<section id="app" class="hidden">
  <aside>
    <div class="logo" id="logo">Nova<span>Bank</span></div>
    <button class="nav" data-v="home"><span class="ic">🏠</span><span class="t">Accueil</span></button>
    <button class="nav" data-v="cards"><span class="ic">💳</span><span class="t">Ma carte</span></button>
    <button class="nav" data-v="transfer"><span class="ic">🔁</span><span class="t">Virements</span></button>
    <button class="nav" data-v="contacts"><span class="ic">👥</span><span class="t">Bénéficiaires</span></button>
    <button class="nav" data-v="history"><span class="ic">📄</span><span class="t">Opérations</span></button>
    <button class="nav" data-v="help"><span class="ic">❓</span><span class="t">Aide &amp; FAQ</span></button>
    <div class="spacer"></div>
    <button class="nav" data-v="settings"><span class="ic">⚙️</span><span class="t">Paramètres</span></button>
  </aside>
  <div class="content">
    <div class="top">
      <h1 id="title"></h1>
      <div class="who">
        <button class="bell" id="bell">🔔<span class="dot hidden" id="dot">0</span></button>
        <div id="notifPanel" class="hidden"></div>
        <div class="avatar" id="avatar"></div>
        <button class="btn ghost" id="btnLogout">Déconnexion</button>
      </div>
    </div>
    <div id="view"></div>
  </div>
</section>

<div id="modalRoot"></div>
<script src="app.js"></script>
</body>
</html>
