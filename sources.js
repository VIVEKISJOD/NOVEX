/* NOVEX v2: new Home, website import, creation mode, player extras. Loaded after app.js */
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return''}};
const SRCS=()=>S.get('sources',[]);
const srcFor=u=>SRCS().find(s=>s.host===hostOf(u));
const numCmp=(a,b)=>(a+'').localeCompare(b+'',undefined,{numeric:true});
function setBg(s){const im=$('#sceneimg');im.style.animation='none';void im.offsetWidth;im.style.animation='';const b=$('#pbg');if(b)b.style.backgroundImage='url("'+s+'")';$('#pthumb').src=s;$('#mthumb').src=s}
function uiX(){if(!cur)return;$('#ptitle').innerHTML='<b>'+esc(cur.title||'Chapter '+cur.num)+'</b><small>'+esc(cur.novel)+' · Ch '+esc(cur.num)+'</small>';$('#tl').textContent=segs.length?'Part '+Math.min(si+1,segs.length)+' / '+segs.length:'';$('#tr').textContent=segs.length?Math.round(100*si/segs.length)+'%':''}
function show(v,pop){if(!pop&&!(history.state&&history.state.v===v))history.pushState({v},'');document.body.className=v;$$('main>section').forEach(s=>s.hidden=s.id!==v);$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));({lib:renderLib,ed:renderEd,pl:renderPl,im:renderIm,st:renderSt,ad:renderAd,cr:()=>{}})[v]();scrollTo(0,0)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b&&!b.closest('#nav'))show(b.dataset.v)});

/* ---------- Home ---------- */
let homeF='all';
async function renderLib(){
 const l=await DB.all('chapters'),imgs=await DB.all('images');
 l.sort((a,b)=>(a.novel+'').localeCompare(b.novel+'')||numCmp(a.num,b.num));
 const q=S.get('queue',[]);
 $('#qbar').innerHTML=q.length?(qrun?'Working on '+q.length+' chapter(s)…':'<b>'+q.length+' chapter(s) waiting.</b> <button class="primary" id="qres">Resume</button>'):'';
 const qr=$('#qres');if(qr)qr.onclick=runQueue;
 const hr=new Date().getHours();$('#greet').textContent=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
 const cov=c=>{for(const s of c.scenes){const i=s.imageId&&imgs.find(x=>x.id===s.imageId);if(i)return blobUrl(i)}return''};
 const bg=u=>u?' style="background-image:url(\''+u+'\')"':'';
 const st=c=>{const d=c.chunks.filter(k=>k.status==='done').length;return{d,n:c.chunks.length,r:d===c.chunks.length}};
 const nov=[...new Set(l.map(c=>c.novel))];
 $('#tiles').innerHTML=nov.map(n=>{const cs=l.filter(c=>c.novel===n),u=cs.map(cov).find(Boolean)||'',rd=cs.filter(c=>st(c).r).length;return '<div class="tile" data-novel="'+esc(n)+'"><div class="cv"'+bg(u)+'>'+(u?'':esc(n.slice(0,1).toUpperCase()))+'</div><b>'+esc(n)+'</b><small>'+cs.length+' chapter'+(cs.length>1?'s':'')+' · '+rd+' ready</small></div>'}).join('')||'<div class="empty">Nothing here yet. Tap <b>＋</b> to add a novel.</div>';
 const f=l.filter(c=>homeF==='all'||(homeF==='ready'&&st(c).r)||(homeF==='todo'&&!st(c).r)||(homeF==='done'&&c.done));
 $('#chlist').innerHTML=f.map(c=>{const s=st(c);return '<div class="item" data-play="'+c.id+'"><div class="th"'+bg(cov(c))+'></div><div class="tx"><b>'+(c.title?esc(c.title):'Chapter '+esc(c.num))+'</b><small>'+esc(c.novel)+' · Ch '+esc(c.num)+' · '+(s.r?(c.done?'finished':'ready to listen'):'tap to create ('+s.d+'/'+s.n+')')+'</small></div><button data-open="'+c.id+'" aria-label="Edit">✎</button><button data-del="'+c.id+'" aria-label="Delete">✕</button></div>'}).join('')||(l.length?'<div class="empty">No chapters in this filter.</div>':'')}
$('#fchips').onclick=e=>{const f=e.target.dataset.f;if(!f)return;homeF=f;$$('#fchips button').forEach(b=>b.classList.toggle('on',b.dataset.f===f));renderLib()};
$('#lib').addEventListener('click',async e=>{const t=e.target.closest('[data-open],[data-del],[data-play],[data-novel]');if(!t)return;const d=t.dataset;
 if(d.open){cur=await DB.get('chapters',d.open);show('ed')}
 else if(d.del){if(confirm('Delete this chapter?')){await DB.del('chapters',d.del);if(cur&&cur.id===d.del)cur=null;renderLib()}}
 else if(d.play)createAndListen(d.play);
 else if(d.novel){const cs=(await DB.all('chapters')).filter(c=>c.novel===d.novel).sort((a,b)=>numCmp(a.num,b.num));const c=cs.find(x=>!x.done)||cs[0];if(c)createAndListen(c.id)}});

/* ---------- Creation mode: translate + images, then listen ---------- */
let crRun=false,crId=null,crT;
async function createAndListen(id){const c=await DB.get('chapters',id);if(!c)return;
 const EN=S.get('lang','hi')==='en';if(EN?(!S.get('imgon',false)||c.scenes.every(s=>s.imageId)):c.chunks.every(k=>k.status==='done')){cur=c;curScene=null;return show('pl')}
 if(crRun&&crId===id)return show('cr');
 if(crRun)return msg('Another chapter is being created. Please wait for it to finish.',1);
 if(!S.get('url','')&&!(EN&&!S.get('imgon',false))){msg('Set your backend link in Settings first.',1);return show('st')}
 cur=c;curScene=null;crId=id;show('cr');$('#crimgon').checked=S.get('imgon',false);crStart(c)}
function crUpd(c){const d=c.chunks.filter(k=>k.status==='done').length,n=c.chunks.length,im=c.scenes.filter(s=>s.imageId).length,m=c.scenes.length;const EN=S.get('lang','hi')==='en';$('#crfill').style.width=Math.round(EN?100*im/Math.max(1,m):100*(d+im)/Math.max(1,n+m))+'%';
 if(!crRun)return;$('#crs').textContent=d<n&&!EN?'Translating to Hindi: part '+(d+1)+' of '+n+'…':'Making pictures: '+im+' of '+m+' scenes…';
 const i=c.scenes.find(s=>s.imageId);if(i)DB.get('images',i.imageId).then(x=>{if(x)$('#crimg').style.backgroundImage='url("'+blobUrl(x)+'")'})}
async function crStart(c){$('#crt').textContent=(c.title||'Chapter '+c.num)+' · '+c.novel;$('#crplay').hidden=$('#crretry').hidden=true;$('#crimg').style.backgroundImage='';
 crRun=true;wake();clearInterval(crT);crT=setInterval(()=>crUpd(c),600);crUpd(c);
 try{await(S.get('lang','hi')==='en'?prepare(c):procChapter(c));crRun=false;crUpd(c);$('#crfill').style.width='100%';$('#crs').textContent='Ready! This chapter can now be listened to.';$('#crplay').hidden=false;if(document.body.className!=='cr')msg('"'+(c.title||'Chapter '+c.num)+'" is ready to listen.')}
 catch(e){crRun=false;$('#crs').textContent='Stopped: '+friendly(e);$('#crretry').hidden=false}
 clearInterval(crT);crRun=false;if(document.body.className==='lib')renderLib()}
$('#crplay').onclick=async()=>{cur=await DB.get('chapters',crId);curScene=null;show('pl');$('#b-play').click()};
$('#crretry').onclick=()=>createAndListen(crId);
$('#crback').onclick=()=>show('lib');
$('#crimgon').onchange=e=>S.set('imgon',e.target.checked);

/* ---------- Website import ---------- */
function extractPage(html,url,src){
 const d=new DOMParser().parseFromString(html,'text/html');
 const meta=p=>(d.querySelector('meta[property="'+p+'"]')||{}).content||'';
 const docTitle=(d.title||meta('og:title')||'').replace(/\s+/g,' ').trim();
 const q1=sel=>{try{return sel?d.querySelector(sel):null}catch{return null}};
 const hEl=q1(src&&src.selTitle)||d.querySelector('h1')||d.querySelector('h2'),h=hEl?hEl.textContent.replace(/\s+/g,' ').trim():'';
 const nEl=q1(src&&src.selNext)||d.querySelector('a[rel=next]')||[...d.querySelectorAll('a')].find(a=>/^\s*(next( chapter)?|→|›|»|>>?)\s*$/i.test(a.textContent));
 let next='';try{if(nEl&&nEl.getAttribute('href'))next=new URL(nEl.getAttribute('href'),url).href}catch{}
 const links=[];const seen=new Set();d.querySelectorAll('a[href]').forEach(a=>{try{const h2=new URL(a.getAttribute('href'),url).href.split('#')[0],t=a.textContent.replace(/\s+/g,' ').trim();if(t&&t.length<120&&hostOf(h2)===hostOf(url)&&!seen.has(h2)&&/chapter|\bch\b|\bch\.?\s*\d|episode|part\s*\d|^\d+$/i.test(t+' '+h2)){seen.add(h2);links.push({t,h:h2})}}catch{}});
 d.querySelectorAll('script,style,noscript,nav,header,footer,aside,form,iframe,select,button').forEach(e=>e.remove());
 let box=q1(src&&src.selText);
 if(!box){let best=0;d.querySelectorAll('div,article,section,main,td,body').forEach(e=>{let n=0;for(const c of e.children)if(c.tagName==='P')n+=c.textContent.trim().length;if(n>best){best=n;box=e}})}
 let text='';
 if(box){box.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));const ps=[...box.querySelectorAll('p')].map(p=>p.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);
  text=(ps.length>=3?ps:box.textContent.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean)).filter(x=>!/^(previous|next)( chapter)?$/i.test(x)).join('\n\n')}
 const parts=docTitle.split(/\s+[-|–—]\s+/),chp=parts.find(p=>/chapter|\bch\.?\s*\d|episode|part\s*\d/i.test(p))||'',title=h||chp||parts[0]||'',novel=parts.find(p=>p!==chp&&p!==title)||'';
 const num=(/(?:chapter|ch\.?|episode|part)\s*(\d+(?:\.\d+)?)/i.exec(title+' '+url)||[])[1]||'';
 return{text,title,novel,num,next,links,isToc:links.length>=8&&text.length<3000}}
let imp=null;
async function fetchPage(u){for(let t=0;;t++){try{const r=await api('/fetch',{url:u});return{x:extractPage(r.html,r.url||u,srcFor(u)),url:r.url||u}}catch(e){if(e.code==='RATE_LIMIT'&&t<3){msg('Waiting a minute for the backend…');await sleep(60000);continue}throw e}}}
async function saveCh(novel,num,title,text){const all=await DB.all('chapters');if(all.some(c=>c.novel===novel&&String(c.num)===String(num)&&c.en.length===text.length))return null;
 const c={id:'c'+Date.now()+Math.random().toString(36).slice(2,5),novel,num:String(num),title,en:text,chunks:chunk(text),pos:0,done:false,added:Date.now(),src:'web'};buildScenes(c);await DB.put('chapters',c);return c}
function showImp(){const x=imp.x,o=$('#wout');
 if(x.isToc){o.innerHTML='<div class="card"><h3>Contents page found</h3><input id="wnov" placeholder="Novel title" value="'+esc(x.novel||x.title)+'"><div style="max-height:260px;overflow:auto">'+x.links.slice(0,80).map((k,i)=>'<label><input type="checkbox" data-l="'+i+'"'+(i<5?' checked':'')+'> '+esc(k.t)+'</label>').join('')+'</div><button class="primary wide" id="wtoc">Add selected chapters</button></div>';return}
 if(x.text.length<300){o.innerHTML='<div class="card"><b>No chapter text found.</b><br><small>The site may hide its text behind JavaScript or block automatic readers. Try another link, or add a text-box selector under Saved websites → Advanced.</small></div>';return}
 o.innerHTML='<div class="card"><h3>Chapter found</h3><input id="wnov" placeholder="Novel title" value="'+esc(x.novel)+'"><input id="wnum" placeholder="Chapter number" value="'+esc(x.num)+'"><input id="wtit" placeholder="Chapter name" value="'+esc(x.title)+'"><small>'+x.text.length+' characters · about '+Math.ceil(x.text.length/1500)+' parts</small><p><small>'+esc(x.text.slice(0,260))+'…</small></p><div class="row"><button class="primary" id="wone">Add chapter</button>'+(x.next?'<button id="wmany">Add this + next 5</button>':'')+'</div></div>'}
$('#wgo').onclick=async()=>{const u=$('#wurl').value.trim();if(!/^https?:\/\//i.test(u))return msg('Paste a full link starting with https://',1);const o=$('#wout');o.innerHTML='<p>Reading the page…</p>';try{imp=await fetchPage(u);showImp()}catch(e){o.innerHTML='';msg(friendly(e),1)}};
$('#wout').onclick=async e=>{const id=e.target.id;if(!id||!imp)return;const nov=($('#wnov')||{}).value&&$('#wnov').value.trim()||'Untitled';
 try{
 if(id==='wone'){const c=await saveCh(nov,$('#wnum').value||'1',$('#wtit').value.trim(),imp.x.text);msg(c?'Added. It is now on Home — tap it to listen.':'That chapter is already in your library.');if(c)$('#wout').innerHTML=''}
 else if(id==='wmany'){let x=imp.x,u=imp.url,n=0,num=+($('#wnum').value||1);const title0=$('#wtit').value.trim();
  for(let i=0;i<6&&x;i++){if(x.text.length>=300){const c=await saveCh(nov,i===0?($('#wnum').value||'1'):(x.num||String(num+i)),i===0?title0:x.title,x.text);if(c)n++}msg('Added '+(i+1)+' of 6…');if(!x.next||x.next===u)break;u=x.next;await sleep(1200);x=(await fetchPage(u)).x}
  msg('Added '+n+' chapter(s). Tap one on Home to listen.');$('#wout').innerHTML=''}
 else if(id==='wtoc'){const sel=$$('#wout [data-l]:checked').map(b=>imp.x.links[+b.dataset.l]);if(!sel.length)return msg('Tick at least one chapter.',1);let n=0;
  for(let i=0;i<sel.length;i++){msg('Reading chapter '+(i+1)+' of '+sel.length+'…');const p=(await fetchPage(sel[i].h)).x;if(p.text.length>=300){const c=await saveCh(nov,p.num||(/\d+(\.\d+)?/.exec(sel[i].t)||[i+1])[0],p.title||sel[i].t,p.text);if(c)n++}await sleep(1200)}
  msg('Added '+n+' chapter(s). Tap one on Home to listen.');$('#wout').innerHTML=''}
 }catch(err){msg(friendly(err),1)}};
/* saved websites */
function renderAd(){$('#slist').innerHTML=SRCS().map((s,i)=>'<div class="item"><div class="tx"><b>'+esc(s.name)+'</b><small>'+esc(s.host)+'</small></div><button data-use="'+i+'">Use</button><button data-rmsrc="'+i+'">✕</button></div>').join('')||'<small>None yet. Websites you add here are remembered on this device.</small>'}
$('#slist').onclick=e=>{const d=e.target.dataset,l=SRCS();if(d.use!==undefined){$('#wurl').value=l[+d.use].url;$('#wurl').focus()}else if(d.rmsrc!==undefined){l.splice(+d.rmsrc,1);S.set('sources',l);renderAd()}};
$('#sfadd').onclick=()=>{const u=$('#sfurl').value.trim(),h=hostOf(u);if(!h)return msg('Enter a full website link first.',1);const l=SRCS().filter(s=>s.host!==h);l.push({name:$('#sfname').value.trim()||h,host:h,url:u,selText:$('#sftext').value.trim(),selTitle:$('#sftitle').value.trim(),selNext:$('#sfnext').value.trim()});S.set('sources',l);['#sfname','#sfurl','#sftext','#sftitle','#sfnext'].forEach(s=>$(s).value='');renderAd();msg('Website saved.')};

/* ---------- player extras ---------- */
function applyMode(){const m=S.get('pmode','vid'),p=$('#pl');p.classList.remove('lyr','vid','cov');p.classList.add(m);$$('#pbot button').forEach(b=>b.classList.toggle('on',b.dataset.m===m))}
$('#pbot').onclick=e=>{const m=e.target.dataset.m;if(m){S.set('pmode',m);applyMode()}};
$('#stage').onclick=()=>{if($('#pl').classList.contains('vid'))$('#pl').classList.toggle('hideui')};
$('#pdown').onclick=()=>history.state&&history.state.v!=='lib'?history.back():show('lib');
$('#fs').value=Math.max(+$('#fs').value,26);
applyMode();

function applyLang(){const g=S.get('lang','hi');$$('#langm button').forEach(b=>b.classList.toggle('on',b.dataset.g===g))}
$('#langm').onclick=e=>{const g=e.target.dataset.g;if(!g||g===S.get('lang','hi'))return;const r=segs.length?si/segs.length:0;playing=false;stopU();S.set('lang',g);applyLang();if(cur){curScene=null;mkSegs();cur.pos=Math.floor(r*segs.length);DB.put('chapters',cur);renderPl()}};
applyLang();

/* Back button / back gesture moves between screens instead of leaving the app */
history.replaceState({v:'lib'},'');
window.addEventListener('popstate',e=>{const v=(e.state&&e.state.v)||'lib';if(!$('#'+v)){return show('lib',true)}show(v,true)});
