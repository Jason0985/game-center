import{$n as ty,A as Ib,An as oD,B as LH,Bt as Zd,Cn as m$2,D as Hd,Dn as mt$2,E as Hb,En as mi$1,Et as Wa,F as Kd,Fn as q_,Ft as Yd,G as MM,H as La,I as Ke$3,In as qa,It as Yg,Jt as ct$2,Kn as st$2,Kt as bI,L as Kn,Ln as qd,Lt as Yn,M as K$1,Mt as Y,N as Kb,Nn as p,Nt as Ya,On as nr,Pn as pe,Pt as Yb,Qt as e8,R as L$2,S as G,St as Uc,Tn as me,Tt as W,U as Le$2,Un as sD,Vn as rr,Vt as _I,W as Lv,X as NE,Xt as dn$1,Y as N,Zn as th,Zt as dr,_t as Te$1,a as AE,an as ho,ar as wT,at as P,b as Ft,bn as ln$1,br as zv,bt as UE,c as Av,ct as Q,d as Bv,dr as y$1,dt as R$1,en as ec,er as ue,et as Nv,f as C,fr as yR,ft as RE,gt as T$2,hr as zd,i as $r,in as gt,ir as vo,it as Ov,j as It,jn as oe$1,jt as Xe$2,kn as ny,lt as Qd,mn as kM,mr as z$1,mt as Ra,n as $d,nn as gR,or as we$1,p as Do,pn as kH,qn as t8,qt as bp,rr as ve,rt as OT,sn as jC,sr as wt$1,t as $b,tn as eu,tr as v,un as jb,ut as Qn,vn as lE,vr as zr,vt as Tp,w as Gp,x as Fv,xn as lt$2,xt as Ub,yn as le,yt as Ty,zn as qr}from"./chunk-DXhR5ZmG.js";import{t as m$3}from"./chunk-D3xFCZzn.js";import{t as cc}from"./chunk-Ba1ElzeW.js";import{n as m$4}from"./chunk-CPfe7RFz.js";import{n as r,t as a}from"./chunk-DLYoQ36v.js";import{A as st$3,C as l,D as q$1,E as p$1,O as rt$2,S as ks,b as ie$1,c as J$2,g as X$1,h as T$3,j as yt$1,l as Ls,m as Ss,p as Si,r as Fe$2,s as It$1,u as N$1,v as dt$2,w as nt$1,x as ji,y as ee$2}from"./chunk-D3GaRpFW.js";var f=[{id:`light`,label:`Hell`},{id:`dark`,label:`Dunkel`},{id:`system`,label:`Automatisch`}];var h$1=`game-center-theme`;var m$1={dark:`#1c1c1e`,light:`#f2f2f7`};function d(r){return r===`dark`||r===`light`||r===`system`}var c=class r{theme=K$1(this.readStored());prefersLight=typeof matchMedia==`function`?matchMedia(`(prefers-color-scheme: light)`):null;systemLight=K$1(this.prefersLight?.matches??!1);constructor(){let e=t=>this.systemLight.set(t.matches);this.prefersLight?.addEventListener(`change`,e),p(ve).onDestroy(()=>this.prefersLight?.removeEventListener(`change`,e)),Gp(()=>{let t=this.theme();this.apply(t===`system`?this.systemLight()?`light`:`dark`:t)})}setTheme(e){this.theme.set(e);try{localStorage.setItem(h$1,e)}catch{}}readStored(){try{let e=localStorage.getItem(h$1);return e===`graphite`?`dark`:d(e)?e:`dark`}catch{return`dark`}}apply(e){let t=document.documentElement;e===`light`?t.setAttribute(`data-theme`,`light`):t.removeAttribute(`data-theme`),document.querySelector(`meta[name="theme-color"]`)?.setAttribute(`content`,m$1[e])}static ɵfac=function(t){return new(t||r)};static ɵprov=R$1({token:r,factory:r.ɵfac,providedIn:`root`})};var e={friend_request:{category:`social`,label:`Freunde`,icon:`person_add`,tone:`social`,actions:`friend-request`},friend_accepted:{category:`social`,label:`Freunde`,icon:`how_to_reg`,tone:`success`,actions:`none`},game_invite:{category:`game`,label:`Spiele`,icon:`sports_esports`,tone:`game`,actions:`game-invite`},system_info:{category:`system`,label:`System`,icon:`campaign`,tone:`info`,actions:`none`},system_alert:{category:`system`,label:`Wichtig`,icon:`warning`,tone:`alert`,actions:`none`},app_error:{category:`system`,label:`Fehler`,icon:`error`,tone:`error`,actions:`none`}};function t(o){return e[o]??e.system_info}var i=[{type:`system_info`,label:`Info`},{type:`system_alert`,label:`Wichtig`}];function U$1(n){n||(n=p(ve));let e=new N(t=>{if(n.destroyed){t.next();return}return n.onDestroy(t.next.bind(t))});return t=>t.pipe(Do(e))}function T$1(n,e){let t=e?.injector??p(me),o=new ho(1),c=Gp(()=>{let r;try{r=n()}catch(i){W(()=>o.error(i));return}W(()=>o.next(r))},{injector:t,manualCleanup:!0});return t.get(ve).onDestroy(()=>{c.destroy(),o.complete()}),o.asObservable()}function F(n,e){let o=!e?.manualCleanup?e?.injector?.get(ve)??p(ve):null,c=h(e?.equal),r;e?.requireSync?r=K$1({kind:0},{equal:c}):r=K$1({kind:1,value:e?.initialValue},{equal:c});let i,v$1=n.subscribe({next:s=>r.set({kind:1,value:s}),error:s=>{r.set({kind:2,error:s}),i?.()},complete:()=>{i?.()}});if(e?.requireSync&&r().kind===0)throw new v(601,!1);return i=o?.onDestroy(v$1.unsubscribe.bind(v$1)),mi$1(()=>{let s=r();switch(s.kind){case 1:return s.value;case 2:throw s.error;case 0:throw new v(601,!1)}},{equal:e?.equal})}function h(n=Object.is){return(e,t)=>e.kind===1&&t.kind===1&&n(e.value,t.value)}var E$1=`Das hat nicht geklappt`;var R=5e3;var u=class a{injector=p(me);lastReported=new Map;report(e,t={}){let i=Date.now();if(i-(this.lastReported.get(e)??0)<R)return;this.lastReported.set(e,i);let r=t.title??E$1;t.toast!==!1&&this.injector.get(m$3).error(e,r),this.notifications.addLocalError(r,e)}get notifications(){return this.injector.get(g$1)}static ɵfac=function(t){return new(t||a)};static ɵprov=R$1({token:a,factory:a.ɵfac,providedIn:`root`})};var S$1=class a{injector=p(me);handleError(e){console.error(e),setTimeout(()=>{try{this.injector.get(u).report(this.describe(e),{title:`Unerwarteter Fehler`})}catch(t){console.error(`Fehler konnte nicht gemeldet werden.`,t)}})}describe(e){let t=e?.rejection??e;return t&&typeof t==`object`&&`code`in t?r(t):t instanceof TypeError&&/fetch|network/i.test(t.message)?r(t):`Etwas ist schiefgelaufen. Lade die Seite neu, falls etwas nicht funktioniert.`}static ɵfac=function(t){return new(t||a)};static ɵprov=R$1({token:a,factory:a.ɵfac})};var k=`gameroster:local-notifications:`;var L$1=`local-`;var D=20;var g$1=class a$1{session=p(m$4);injector=p(me);remote=K$1([]);local=K$1([]);notifications=mi$1(()=>[...this.local(),...this.remote()].sort((e,t)=>t.created_at.localeCompare(e.created_at)));loading=K$1(!0);loadedFor=K$1(null);incoming=new Y;loadedUserId=null;channel=null;unreadCount=mi$1(()=>this.notifications().filter(e=>!e.read_at).length);constructor(){Gp(()=>{if(!this.session.initialized())return;let e=this.session.user()?.id??null;e!==this.loadedUserId&&(this.loadedUserId=e,this.loadedFor.set(null),this.remote.set([]),this.local.set(e?this.loadLocal(e):[]),this.subscribe(e),e?(this.loading.set(!0),this.load(e)):this.loading.set(!1))})}async reload(){this.loadedUserId&&await this.load(this.loadedUserId)}addLocalError(e,t){let i=this.loadedUserId;if(!i)return;let r={id:L$1+crypto.randomUUID(),recipient_id:i,sender_id:null,sender_name:`Game Center`,type:`app_error`,title:e,message:t,related_id:null,created_at:new Date().toISOString(),read_at:null};this.local.update(n=>[r,...n].slice(0,D)),this.persistLocal()}async markRead(e){if(!this.loadedUserId)return;let t=new Set(this.notifications().filter(o=>!o.read_at&&(!e||e.includes(o.id))).map(o=>o.id));if(!t.size)return;let i=new Date().toISOString(),r=o=>t.has(o.id)?L$2(m$2({},o),{read_at:i}):o;this.local.update(o=>o.map(r)),this.remote.update(o=>o.map(r)),this.persistLocal();let n=[...t].filter(o=>!this.isLocal(o));if(!n.length)return;let{error:l}=await cc.from(`notifications`).update({read_at:i}).in(`id`,n);l&&console.error(`Benachrichtigungen konnten nicht als gelesen markiert werden.`,l)}async dismiss(e){if(this.isLocal(e))return this.local.update(r=>r.filter(n=>n.id!==e)),this.persistLocal(),{ok:!0};let t=this.remote();this.removeRemote(e);let{error:i}=await cc.from(`notifications`).delete().eq(`id`,e);return i?(this.remote.set(t),a(`Benachrichtigung konnte nicht gelöscht werden.`,i)):{ok:!0}}async respondToFriendRequest(e,t){if(!e.related_id)return a(`Freundschaftsanfrage ohne Verweis.`,{message:`related_id fehlt`});let{data:r,error:n}=await(t?cc.from(`friendships`).update({status:`accepted`,updated_at:new Date().toISOString()}):cc.from(`friendships`).delete()).eq(`id`,e.related_id).eq(`status`,`pending`).select(`id`);return n?a(`Freundschaftsanfrage konnte nicht beantwortet werden.`,n):r?.length?(this.removeRemote(e.id),{ok:!0}):(await this.dismiss(e.id),{ok:!1,message:`Diese Anfrage ist nicht mehr offen.`})}async sendSystemNotification(e,t,i){let{data:r$1,error:n}=await cc.rpc(`send_system_notification`,{p_type:e,p_title:t,p_message:i});return n?(console.error(`Systembenachrichtigung konnte nicht gesendet werden.`,n),{error:r(n)}):{recipients:r$1}}isLocal(e){return e.startsWith(L$1)}removeRemote(e){this.remote.update(t=>t.filter(i=>i.id!==e))}async load(e){let{data:t,error:i}=await cc.from(`notifications`).select(`*`).eq(`recipient_id`,e).order(`created_at`,{ascending:!1});this.loadedUserId===e&&(i&&(console.error(`Benachrichtigungen konnten nicht geladen werden.`,i),this.injector.get(u).report(r(i),{title:`Benachrichtigungen nicht geladen`})),this.remote.set(t??[]),this.loading.set(!1),this.loadedFor.set(e))}async subscribe(e){if(this.channel){let i=this.channel;this.channel=null,await cc.removeChannel(i)}if(!e)return;let t=`recipient_id=eq.${e}`;this.channel=cc.channel(`notifications:${e}`).on(`postgres_changes`,{event:`INSERT`,schema:`public`,table:`notifications`,filter:t},i=>{let r=i.new;this.loadedUserId===e&&(this.remote().some(n=>n.id===r.id)||(this.remote.update(n=>[r,...n]),this.incoming.next(r)))}).on(`postgres_changes`,{event:`UPDATE`,schema:`public`,table:`notifications`,filter:t},i=>{let r=i.new;this.remote.update(n=>n.map(l=>l.id===r.id?r:l))}).subscribe()}loadLocal(e){try{let t=localStorage.getItem(k+e),i=t?JSON.parse(t):[];return Array.isArray(i)?i.filter(r=>typeof r?.id==`string`&&this.isLocal(r.id)):[]}catch{return[]}}persistLocal(){if(this.loadedUserId)try{localStorage.setItem(k+this.loadedUserId,JSON.stringify(this.local()))}catch{}}static ɵfac=function(t){return new(t||a$1)};static ɵprov=R$1({token:a$1,factory:a$1.ɵfac,providedIn:`root`})};var m=`boardgame:players`;var y=class i{session=p(m$4);appErrors=p(u);playersSubject=new pe([]);players$=this.playersSubject.asObservable();roundCountSubject=new pe(0);roundCount$=this.roundCountSubject.asObservable();phaseSubject=new pe(`setup`);phase$=this.phaseSubject.asObservable();readyResolve;readyPromise=new Promise(e=>this.readyResolve=e);saveTimer=null;constructor(){Gp(()=>{if(!this.session.initialized())return;let e=this.session.user();e?this.loadFromDb(e.id):this.loadFromLocal()})}ready(){return this.readyPromise}currentPhase(){return this.phaseSubject.value}async loadFromDb(e){let{data:t,error:s}=await cc.from(`ranking_games`).select(`players, round_count, phase`).eq(`user_id`,e).maybeSingle();s&&(console.error(`Ranking-Spiel konnte nicht geladen werden.`,s),this.appErrors.report(r(s),{title:`Spielstand nicht geladen`})),this.playersSubject.next(t?.players??[]),this.roundCountSubject.next(t?.round_count??0),this.phaseSubject.next(t?.phase??`setup`),this.readyResolve()}loadFromLocal(){let e=[];try{let t=localStorage.getItem(m);e=t?JSON.parse(t):[]}catch{}this.playersSubject.next(e),this.roundCountSubject.next(0),this.phaseSubject.next(`setup`),this.readyResolve()}persist(){let e=this.playersSubject.value;try{localStorage.setItem(m,JSON.stringify(e))}catch{}let t=this.session.user();t&&(this.saveTimer&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>{this.persistToDb(t.id)},400))}async persistToDb(e){if(this.session.user()?.id!==e)return;let{error:t}=await cc.from(`ranking_games`).upsert({user_id:e,players:this.playersSubject.value,round_count:this.roundCountSubject.value,phase:this.phaseSubject.value,updated_at:new Date().toISOString()});t&&(console.error(`Ranking-Spiel konnte nicht gespeichert werden.`,t),this.appErrors.report(r(t),{title:`Spielstand nicht gespeichert`}))}getPlayers(){return[...this.playersSubject.value]}addPlayer(e){let t=(e||``).trim();t&&(this.playersSubject.next([...this.playersSubject.value,{id:Date.now().toString(),name:t,score:0}]),this.persist())}removePlayer(e){this.playersSubject.next(this.playersSubject.value.filter(t=>t.id!==e)),this.persist()}startGame(){this.phaseSubject.next(`playing`),this.persist()}finishGame(){this.phaseSubject.next(`finished`),this.persist()}completeRound(e){let t=this.playersSubject.value.map(s=>s.id in e&&Number.isFinite(e[s.id])?L$2(m$2({},s),{score:s.score+(e[s.id]??0)}):s);this.playersSubject.next(t),this.roundCountSubject.next(this.roundCountSubject.value+1),this.persist()}resetScores(){this.playersSubject.next(this.playersSubject.value.map(e=>L$2(m$2({},e),{score:0}))),this.roundCountSubject.next(0),this.phaseSubject.next(`setup`),this.persist()}resetGame(){this.playersSubject.next([]),this.roundCountSubject.next(0),this.phaseSubject.next(`setup`),this.persist()}static ɵfac=function(t){return new(t||i)};static ɵprov=R$1({token:i,factory:i.ɵfac,providedIn:`root`})};var E=(function(i){return i[i.FADING_IN=0]=`FADING_IN`,i[i.VISIBLE=1]=`VISIBLE`,i[i.FADING_OUT=2]=`FADING_OUT`,i[i.HIDDEN=3]=`HIDDEN`,i})(E||{});var zt$1=class{_renderer;element;config;_animationForciblyDisabledThroughCss;state=E.HIDDEN;constructor(e,t,n,o=!1){this._renderer=e,this.element=t,this.config=n,this._animationForciblyDisabledThroughCss=o}fadeOut(){this._renderer.fadeOutRipple(this)}};var ye=ee$2({passive:!0,capture:!0});var Vt$1=class{_events=new Map;addHandler(e,t,n,o){let a=this._events.get(t);if(a){let r=a.get(n);r?r.add(o):a.set(n,new Set([o]))}else this._events.set(t,new Map([[n,new Set([o])]])),e.runOutsideAngular(()=>{document.addEventListener(t,this._delegateEventHandler,ye)})}removeHandler(e,t,n){let o=this._events.get(e);if(!o)return;let a=o.get(t);a&&(a.delete(n),a.size===0&&o.delete(t),o.size===0&&(this._events.delete(e),document.removeEventListener(e,this._delegateEventHandler,ye)))}_delegateEventHandler=e=>{let t=p$1(e);t&&this._events.get(e.type)?.forEach((n,o)=>{(o===t||o.contains(t))&&n.forEach(a=>a.handleEvent(e))})}};var rt$1={enterDuration:225,exitDuration:150};var Qe$2=800;var Se=ee$2({passive:!0,capture:!0});var we=[`mousedown`,`touchstart`];var xe=[`mouseup`,`mouseleave`,`touchend`,`touchcancel`];var Je$1=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`ng-component`]],hostAttrs:[`mat-ripple-style-loader`,``],decls:0,vars:0,template:function(n,o){},styles:[`.mat-ripple {
  overflow: hidden;
  position: relative;
}
.mat-ripple:not(:empty) {
  transform: translateZ(0);
}

.mat-ripple.mat-ripple-unbounded {
  overflow: visible;
}

.mat-ripple-element {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transition: opacity, transform 0ms cubic-bezier(0, 0, 0.2, 1);
  transform: scale3d(0, 0, 0);
  background-color: var(--%NS%mat-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 10%, transparent));
}
@media (forced-colors: active) {
  .mat-ripple-element {
    display: none;
  }
}
.cdk-drag-preview .mat-ripple-element, .cdk-drag-placeholder .mat-ripple-element {
  display: none;
}
`],encapsulation:2})}return i})();var st$1=class i{_target;_ngZone;_platform;_containerElement;_triggerElement=null;_isPointerDown=!1;_activeRipples=new Map;_mostRecentTransientRipple=null;_lastTouchStartEvent;_pointerUpEventsRegistered=!1;_containerRect=null;static _eventManager=new Vt$1;constructor(e,t,n,o,a){this._target=e,this._ngZone=t,this._platform=o,o.isBrowser&&(this._containerElement=T$3(n)),a&&a.get(MM).load(Je$1)}fadeInRipple(e,t,n={}){let o=this._containerRect=this._containerRect||this._containerElement.getBoundingClientRect(),a=m$2(m$2({},rt$1),n.animation);n.centered&&(e=o.left+o.width/2,t=o.top+o.height/2);let r=n.radius||tn(e,t,o),c=e-o.left,d=t-o.top,m=a.enterDuration,l=document.createElement(`div`);l.classList.add(`mat-ripple-element`),l.style.left=`${c-r}px`,l.style.top=`${d-r}px`,l.style.height=`${r*2}px`,l.style.width=`${r*2}px`,n.color!=null&&(l.style.backgroundColor=n.color),l.style.transitionDuration=`${m}ms`,this._containerElement.appendChild(l);let h=window.getComputedStyle(l),g=h.transitionProperty,y=h.transitionDuration,f=g===`none`||y===`0s`||y===`0s, 0s`||o.width===0&&o.height===0,p=new zt$1(this,l,n,f);l.style.transform=`scale3d(1, 1, 1)`,p.state=E.FADING_IN,n.persistent||(this._mostRecentTransientRipple=p);let X=null;return!f&&(m||a.exitDuration)&&this._ngZone.runOutsideAngular(()=>{let ne=()=>{X&&(X.fallbackTimer=null),clearTimeout(ie),this._finishRippleTransition(p)},Ot=()=>this._destroyRipple(p),ie=setTimeout(Ot,m+100);l.addEventListener(`transitionend`,ne),l.addEventListener(`transitioncancel`,Ot),X={onTransitionEnd:ne,onTransitionCancel:Ot,fallbackTimer:ie}}),this._activeRipples.set(p,X),(f||!m)&&this._finishRippleTransition(p),p}fadeOutRipple(e){if(e.state===E.FADING_OUT||e.state===E.HIDDEN)return;let t=e.element,n=m$2(m$2({},rt$1),e.config.animation);t.style.transitionDuration=`${n.exitDuration}ms`,t.style.opacity=`0`,e.state=E.FADING_OUT,(e._animationForciblyDisabledThroughCss||!n.exitDuration)&&this._finishRippleTransition(e)}fadeOutAll(){this._getActiveRipples().forEach(e=>e.fadeOut())}fadeOutAllNonPersistent(){this._getActiveRipples().forEach(e=>{e.config.persistent||e.fadeOut()})}setupTriggerEvents(e){let t=T$3(e);!this._platform.isBrowser||!t||t===this._triggerElement||(this._removeTriggerEvents(),this._triggerElement=t,we.forEach(n=>{i._eventManager.addHandler(this._ngZone,n,t,this)}))}handleEvent(e){e.type===`mousedown`?this._onMousedown(e):e.type===`touchstart`?this._onTouchStart(e):this._onPointerUp(),this._pointerUpEventsRegistered||(this._ngZone.runOutsideAngular(()=>{xe.forEach(t=>{this._triggerElement.addEventListener(t,this,Se)})}),this._pointerUpEventsRegistered=!0)}_finishRippleTransition(e){e.state===E.FADING_IN?this._startFadeOutTransition(e):e.state===E.FADING_OUT&&this._destroyRipple(e)}_startFadeOutTransition(e){let t=e===this._mostRecentTransientRipple,{persistent:n}=e.config;e.state=E.VISIBLE,!n&&(!t||!this._isPointerDown)&&e.fadeOut()}_destroyRipple(e){let t=this._activeRipples.get(e)??null;this._activeRipples.delete(e),this._activeRipples.size||(this._containerRect=null),e===this._mostRecentTransientRipple&&(this._mostRecentTransientRipple=null),e.state=E.HIDDEN,t!==null&&(e.element.removeEventListener(`transitionend`,t.onTransitionEnd),e.element.removeEventListener(`transitioncancel`,t.onTransitionCancel),t.fallbackTimer!==null&&clearTimeout(t.fallbackTimer)),e.element.remove()}_onMousedown(e){let t=q$1(e),n=this._lastTouchStartEvent&&Date.now()<this._lastTouchStartEvent+Qe$2;!this._target.rippleDisabled&&!t&&!n&&(this._isPointerDown=!0,this.fadeInRipple(e.clientX,e.clientY,this._target.rippleConfig))}_onTouchStart(e){if(!this._target.rippleDisabled&&!J$2(e)){this._lastTouchStartEvent=Date.now(),this._isPointerDown=!0;let t=e.changedTouches;if(t)for(let n=0;n<t.length;n++)this.fadeInRipple(t[n].clientX,t[n].clientY,this._target.rippleConfig)}}_onPointerUp(){this._isPointerDown&&(this._isPointerDown=!1,this._getActiveRipples().forEach(e=>{let t=e.state===E.VISIBLE||e.config.terminateOnPointerUp&&e.state===E.FADING_IN;!e.config.persistent&&t&&e.fadeOut()}))}_getActiveRipples(){return Array.from(this._activeRipples.keys())}_removeTriggerEvents(){let e=this._triggerElement;e&&(we.forEach(t=>i._eventManager.removeHandler(t,e,this)),this._pointerUpEventsRegistered&&(xe.forEach(t=>e.removeEventListener(t,this,Se)),this._pointerUpEventsRegistered=!1))}};function tn(i,e,t){let n=Math.max(Math.abs(i-t.left),Math.abs(i-t.right)),o=Math.max(Math.abs(e-t.top),Math.abs(e-t.bottom));return Math.sqrt(n*n+o*o)}var Lt=new y$1(`mat-ripple-global-options`);var An=(()=>{class i{_elementRef=p(st$2);_animationsDisabled=ji();color;unbounded=!1;centered=!1;radius=0;animation;get disabled(){return this._disabled}set disabled(t){t&&this.fadeOutAllNonPersistent(),this._disabled=t,this._setupTriggerEventsIfEnabled()}_disabled=!1;get trigger(){return this._trigger||this._elementRef.nativeElement}set trigger(t){this._trigger=t,this._setupTriggerEventsIfEnabled()}_trigger;_rippleRenderer;_globalOptions;_isInitialized=!1;constructor(){let t=p(le),n=p(l),o=p(Lt,{optional:!0}),a=p(me);this._globalOptions=o||{},this._rippleRenderer=new st$1(this,t,this._elementRef,n,a)}ngOnInit(){this._isInitialized=!0,this._setupTriggerEventsIfEnabled()}ngOnDestroy(){this._rippleRenderer._removeTriggerEvents()}fadeOutAll(){this._rippleRenderer.fadeOutAll()}fadeOutAllNonPersistent(){this._rippleRenderer.fadeOutAllNonPersistent()}get rippleConfig(){return{centered:this.centered,radius:this.radius,color:this.color,animation:m$2(m$2(m$2({},this._globalOptions.animation),this._animationsDisabled?{enterDuration:0,exitDuration:0}:{}),this.animation),terminateOnPointerUp:this._globalOptions.terminateOnPointerUp}}get rippleDisabled(){return this.disabled||!!this._globalOptions.disabled}_setupTriggerEventsIfEnabled(){!this.disabled&&this._isInitialized&&this._rippleRenderer.setupTriggerEvents(this.trigger)}launch(t,n=0,o){return typeof t==`number`?this._rippleRenderer.fadeInRipple(t,n,m$2(m$2({},this.rippleConfig),o)):this._rippleRenderer.fadeInRipple(0,0,m$2(m$2({},this.rippleConfig),t))}static ɵfac=function(n){return new(n||i)};static ɵdir=ct$2({type:i,selectors:[[``,`mat-ripple`,``],[``,`matRipple`,``]],hostAttrs:[1,`mat-ripple`],hostVars:2,hostBindings:function(n,o){n&2&&Ya(`mat-ripple-unbounded`,o.unbounded)},inputs:{color:[0,`matRippleColor`,`color`],unbounded:[0,`matRippleUnbounded`,`unbounded`],centered:[0,`matRippleCentered`,`centered`],radius:[0,`matRippleRadius`,`radius`],animation:[0,`matRippleAnimation`,`animation`],disabled:[0,`matRippleDisabled`,`disabled`],trigger:[0,`matRippleTrigger`,`trigger`]},exportAs:[`matRipple`]})}return i})();var en={capture:!0};var nn=[`focus`,`mousedown`,`mouseenter`,`touchstart`];var jt$1=`mat-ripple-loader-uninitialized`;var Yt=`mat-ripple-loader-class-name`;var Ne$1=`mat-ripple-loader-centered`;var vt=`mat-ripple-loader-disabled`;var Ce=(()=>{class i{_document=p(z$1);_animationsDisabled=ji();_globalRippleOptions=p(Lt,{optional:!0});_platform=p(l);_ngZone=p(le);_injector=p(me);_eventCleanups;_hosts=new Map;constructor(){let t=p(Yn).createRenderer(null,null);this._eventCleanups=this._ngZone.runOutsideAngular(()=>nn.map(n=>t.listen(this._document,n,this._onInteraction,en)))}ngOnDestroy(){let t=this._hosts.keys();for(let n of t)this.destroyRipple(n);this._eventCleanups.forEach(n=>n())}configureRipple(t,n){t.setAttribute(jt$1,this._globalRippleOptions?.namespace??``),(n.className||!t.hasAttribute(Yt))&&t.setAttribute(Yt,n.className||``),n.centered&&t.setAttribute(Ne$1,``),n.disabled&&t.setAttribute(vt,``)}setDisabled(t,n){let o=this._hosts.get(t);o?(o.target.rippleDisabled=n,!n&&!o.hasSetUpEvents&&(o.hasSetUpEvents=!0,o.renderer.setupTriggerEvents(t))):n?t.setAttribute(vt,``):t.removeAttribute(vt)}_onInteraction=t=>{let n=p$1(t);if(n instanceof HTMLElement){let o=n.closest(`[${jt$1}="${this._globalRippleOptions?.namespace??``}"]`);o&&this._createRipple(o)}};_createRipple(t){if(!this._document||this._hosts.has(t))return;t.querySelector(`.mat-ripple`)?.remove();let n=this._document.createElement(`span`);n.classList.add(`mat-ripple`,t.getAttribute(Yt)),t.append(n);let o=this._globalRippleOptions,a=this._animationsDisabled?0:o?.animation?.enterDuration??rt$1.enterDuration,r=this._animationsDisabled?0:o?.animation?.exitDuration??rt$1.exitDuration,c={rippleDisabled:this._animationsDisabled||o?.disabled||t.hasAttribute(vt),rippleConfig:{centered:t.hasAttribute(Ne$1),terminateOnPointerUp:o?.terminateOnPointerUp,animation:{enterDuration:a,exitDuration:r}}},d=new st$1(c,this._ngZone,n,this._platform,this._injector),m=!c.rippleDisabled;m&&d.setupTriggerEvents(t),this._hosts.set(t,{target:c,renderer:d,hasSetUpEvents:m}),t.removeAttribute(jt$1)}destroyRipple(t){let n=this._hosts.get(t);n&&(n.renderer._removeTriggerEvents(),this._hosts.delete(t))}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var ke=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`structural-styles`]],decls:0,vars:0,template:function(n,o){},styles:[`.mat-focus-indicator {
  position: relative;
}
.mat-focus-indicator::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  display: var(--%NS%mat-focus-indicator-display, none);
  border-width: var(--%NS%mat-focus-indicator-border-width, 3px);
  border-style: var(--%NS%mat-focus-indicator-border-style, solid);
  border-color: var(--%NS%mat-focus-indicator-border-color, transparent);
  border-radius: var(--%NS%mat-focus-indicator-border-radius, 4px);
}
.mat-focus-indicator:focus-visible::before {
  content: "";
}

@media (forced-colors: active) {
  html {
    --%NS%mat-focus-indicator-display: block;
    --%NS%mat-focus-indicator-fallback-border-style: none;
  }
}
`],encapsulation:2})}return i})();var on=[`*`,[[``,`progressIndicator`,``]]];var an=[`*`,`[progressIndicator]`];function rn(i,e){i&1&&($d(0,`div`,1),Zd(1,1),zd())}var sn=new y$1(`MAT_BUTTON_CONFIG`);function Re$1(i){return i==null?void 0:kH(i)}var _t=(()=>{class i{_elementRef=p(st$2);_ngZone=p(le);_animationsDisabled=ji();_config=p(sn,{optional:!0});_focusMonitor=p(rt$2);_cleanupClick;_renderer=p(Qn);_rippleLoader=p(Ce);_isAnchor;_isFab=!1;color;get disableRipple(){return this._disableRipple}set disableRipple(t){this._disableRipple=t,this._updateRippleDisabled()}_disableRipple=!1;get disabled(){return this._disabled}set disabled(t){this._disabled=t,this._updateRippleDisabled()}_disabled=!1;ariaDisabled;disabledInteractive;tabIndex;set _tabindex(t){this.tabIndex=t}showProgress=ec(!1,{transform:zr});constructor(){p(MM).load(ke);let t=this._elementRef.nativeElement;this._isAnchor=t.tagName===`A`,this.disabledInteractive=this._config?.disabledInteractive??!1,this.color=this._config?.color??null,this._rippleLoader?.configureRipple(t,{className:`mat-mdc-button-ripple`})}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,!0),this._isAnchor&&this._setupAsAnchor()}ngOnDestroy(){this._cleanupClick?.(),this._focusMonitor.stopMonitoring(this._elementRef),this._rippleLoader?.destroyRipple(this._elementRef.nativeElement)}focus(t=`program`,n){t?this._focusMonitor.focusVia(this._elementRef.nativeElement,t,n):this._elementRef.nativeElement.focus(n)}_getAriaDisabled(){return this.ariaDisabled!=null?this.ariaDisabled:this._isAnchor?this.disabled||null:this.disabled&&this.disabledInteractive?!0:null}_getDisabledAttribute(){return this.disabledInteractive||!this.disabled?null:!0}_updateRippleDisabled(){this._rippleLoader?.setDisabled(this._elementRef.nativeElement,this.disableRipple||this.disabled)}_getTabIndex(){return this._isAnchor?this.disabled&&!this.disabledInteractive?-1:this.tabIndex:this.tabIndex}_setupAsAnchor(){this._cleanupClick=this._ngZone.runOutsideAngular(()=>this._renderer.listen(this._elementRef.nativeElement,`click`,t=>{this.disabled&&(t.preventDefault(),t.stopImmediatePropagation())}))}static ɵfac=function(n){return new(n||i)};static ɵdir=ct$2({type:i,hostAttrs:[1,`mat-mdc-button-base`],hostVars:15,hostBindings:function(n,o){n&2&&(rr(`disabled`,o._getDisabledAttribute())(`aria-disabled`,o._getAriaDisabled())(`tabindex`,o._getTabIndex()),Kd(o.color?`mat-`+o.color:``),Ya(`mat-mdc-button-progress-indicator-shown`,o.showProgress())(`mat-mdc-button-disabled`,o.disabled)(`mat-mdc-button-disabled-interactive`,o.disabledInteractive)(`mat-unthemed`,!o.color)(`_mat-animation-noopable`,o._animationsDisabled))},inputs:{color:`color`,disableRipple:[2,`disableRipple`,`disableRipple`,zr],disabled:[2,`disabled`,`disabled`,zr],ariaDisabled:[2,`aria-disabled`,`ariaDisabled`,zr],disabledInteractive:[2,`disabledInteractive`,`disabledInteractive`,zr],tabIndex:[2,`tabIndex`,`tabIndex`,Re$1],_tabindex:[2,`tabindex`,`_tabindex`,Re$1],showProgress:[1,`showProgress`]}})}return i})();var ln=(()=>{class i extends _t{constructor(){super(),this._rippleLoader.configureRipple(this._elementRef.nativeElement,{centered:!0})}static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`button`,`mat-icon-button`,``],[`a`,`mat-icon-button`,``],[`button`,`matIconButton`,``],[`a`,`matIconButton`,``]],hostAttrs:[1,`mdc-icon-button`,`mat-mdc-icon-button`],exportAs:[`matButton`,`matAnchor`],features:[Av],ngContentSelectors:an,decls:5,vars:1,consts:[[1,`mat-mdc-button-persistent-ripple`,`mdc-icon-button__ripple`],[1,`mat-mdc-button-progress-indicator-container`],[1,`mat-focus-indicator`],[1,`mat-mdc-button-touch-target`]],template:function(n,o){n&1&&(qd(on),Fv(0,`span`,0),Zd(1),jb(2,rn,2,0,`div`,1),Fv(3,`span`,2)(4,`span`,3)),n&2&&(jC(2),Ub(o.showProgress()?2:-1))},styles:[`.mat-mdc-icon-button {
  -webkit-user-select: none;
  user-select: none;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  border: none;
  outline: none;
  background-color: transparent;
  fill: currentColor;
  text-decoration: none;
  cursor: pointer;
  z-index: 0;
  overflow: visible;
  border-radius: var(--%NS%mat-icon-button-container-shape, var(--%NS%mat-sys-corner-full, 50%));
  flex-shrink: 0;
  text-align: center;
  width: var(--%NS%mat-icon-button-state-layer-size, 40px);
  height: var(--%NS%mat-icon-button-state-layer-size, 40px);
  padding: calc(calc(var(--%NS%mat-icon-button-state-layer-size, 40px) - var(--%NS%mat-icon-button-icon-size, 24px)) / 2);
  font-size: var(--%NS%mat-icon-button-icon-size, 24px);
  color: var(--%NS%mat-icon-button-icon-color, var(--%NS%mat-sys-on-surface-variant));
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-icon-button .mat-mdc-button-ripple,
.mat-mdc-icon-button .mat-mdc-button-persistent-ripple,
.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}
.mat-mdc-icon-button .mat-mdc-button-ripple {
  overflow: hidden;
}
.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before {
  content: "";
  opacity: 0;
}
.mat-mdc-icon-button .mdc-button__label,
.mat-mdc-icon-button .mat-icon {
  z-index: 1;
  position: relative;
}
.mat-mdc-icon-button .mat-focus-indicator {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  border-radius: inherit;
}
.mat-mdc-icon-button:focus-visible > .mat-focus-indicator::before {
  content: "";
  border-radius: inherit;
}
.mat-mdc-icon-button .mat-ripple-element {
  background-color: var(--%NS%mat-icon-button-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface-variant) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-icon-button-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-icon-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-icon-button-disabled-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-icon-button:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-icon-button-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-icon-button.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-icon-button.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-icon-button.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-icon-button-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-icon-button:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-icon-button-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}
.mat-mdc-icon-button .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-icon-button-touch-target-size, 48px);
  display: var(--%NS%mat-icon-button-touch-target-display, block);
  left: 50%;
  width: var(--%NS%mat-icon-button-touch-target-size, 48px);
  transform: translate(-50%, -50%);
}
.mat-mdc-icon-button._mat-animation-noopable {
  transition: none !important;
  animation: none !important;
}
.mat-mdc-icon-button[disabled], .mat-mdc-icon-button.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-icon-button-disabled-icon-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-mdc-icon-button.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}
.mat-mdc-icon-button img,
.mat-mdc-icon-button svg {
  width: var(--%NS%mat-icon-button-icon-size, 24px);
  height: var(--%NS%mat-icon-button-icon-size, 24px);
  vertical-align: baseline;
}
.mat-mdc-icon-button .mat-mdc-button-progress-indicator-container .mdc-circular-progress__determinate-circle-graphic {
  width: inherit;
  height: inherit;
}
.mat-mdc-icon-button .mat-mdc-button-progress-indicator-container .mdc-circular-progress__indeterminate-circle-graphic {
  height: 100%;
}
.mat-mdc-icon-button .mat-mdc-button-persistent-ripple {
  border-radius: var(--%NS%mat-icon-button-container-shape, var(--%NS%mat-sys-corner-full, 50%));
}
.mat-mdc-icon-button[hidden] {
  display: none;
}
.mat-mdc-icon-button.mat-unthemed:not(.mdc-ripple-upgraded):focus::before, .mat-mdc-icon-button.mat-primary:not(.mdc-ripple-upgraded):focus::before, .mat-mdc-icon-button.mat-accent:not(.mdc-ripple-upgraded):focus::before, .mat-mdc-icon-button.mat-warn:not(.mdc-ripple-upgraded):focus::before {
  background: transparent;
  opacity: 1;
}

.mat-mdc-button-progress-indicator-container {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.mat-mdc-button-progress-indicator-shown mat-icon {
  visibility: hidden;
}
`,`@media (forced-colors: active) {
  .mat-mdc-button:not(.mdc-button--outlined),
  .mat-mdc-unelevated-button:not(.mdc-button--outlined),
  .mat-mdc-raised-button:not(.mdc-button--outlined),
  .mat-mdc-outlined-button:not(.mdc-button--outlined),
  .mat-mdc-button-base.mat-tonal-button,
  .mat-mdc-icon-button.mat-mdc-icon-button,
  .mat-mdc-outlined-button .mdc-button__ripple {
    outline: solid 1px;
  }
}
`],encapsulation:2})}return i})();var Ee=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({imports:[sD]})}return i})();var De=[[[``,8,`material-icons`,3,`iconPositionEnd`,``],[`mat-icon`,3,`iconPositionEnd`,``],[``,`matButtonIcon`,``,3,`iconPositionEnd`,``]],`*`,[[``,`iconPositionEnd`,``,8,`material-icons`],[`mat-icon`,`iconPositionEnd`,``],[``,`matButtonIcon`,``,`iconPositionEnd`,``]],[[``,`progressIndicator`,``]]];var Pe$1=[`.material-icons:not([iconPositionEnd]), mat-icon:not([iconPositionEnd]), [matButtonIcon]:not([iconPositionEnd])`,`*`,`.material-icons[iconPositionEnd], mat-icon[iconPositionEnd], [matButtonIcon][iconPositionEnd]`,`[progressIndicator]`];function cn(i,e){i&1&&($d(0,`div`,2),Zd(1,3),zd())}function dn(i,e){i&1&&($d(0,`div`,2),Zd(1,3),zd())}var mn=`.mat-mdc-fab-base {
  -webkit-user-select: none;
  user-select: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 56px;
  height: 56px;
  padding: 0;
  border: none;
  fill: currentColor;
  text-decoration: none;
  cursor: pointer;
  -moz-appearance: none;
  -webkit-appearance: none;
  overflow: visible;
  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 15ms linear 30ms, transform 270ms 0ms cubic-bezier(0, 0, 0.2, 1);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-fab-base .mat-mdc-button-ripple,
.mat-mdc-fab-base .mat-mdc-button-persistent-ripple,
.mat-mdc-fab-base .mat-mdc-button-persistent-ripple::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}
.mat-mdc-fab-base .mat-mdc-button-ripple {
  overflow: hidden;
}
.mat-mdc-fab-base .mat-mdc-button-persistent-ripple::before {
  content: "";
  opacity: 0;
}
.mat-mdc-fab-base .mdc-button__label,
.mat-mdc-fab-base .mat-icon {
  z-index: 1;
  position: relative;
}
.mat-mdc-fab-base .mat-focus-indicator {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-mdc-fab-base:focus-visible > .mat-focus-indicator::before {
  content: "";
}
.mat-mdc-fab-base._mat-animation-noopable {
  transition: none !important;
  animation: none !important;
}
.mat-mdc-fab-base::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 1px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}
.mat-mdc-fab-base[hidden] {
  display: none;
}
.mat-mdc-fab-base::-moz-focus-inner {
  padding: 0;
  border: 0;
}
.mat-mdc-fab-base:active, .mat-mdc-fab-base:focus {
  outline: none;
}
.mat-mdc-fab-base:hover {
  cursor: pointer;
}
.mat-mdc-fab-base > svg {
  width: 100%;
}
.mat-mdc-fab-base .mat-icon, .mat-mdc-fab-base .material-icons {
  transition: transform 180ms 90ms cubic-bezier(0, 0, 0.2, 1);
  fill: currentColor;
  will-change: transform;
}
.mat-mdc-fab-base .mat-focus-indicator::before {
  margin: calc(calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 2px) * -1);
  border-radius: calc(var(--%NS%mat-fab-container-shape, var(--%NS%mat-sys-corner-large)) + calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 2px));
}
.mat-mdc-fab-base[disabled], .mat-mdc-fab-base.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
}
.mat-mdc-fab-base[disabled], .mat-mdc-fab-base[disabled]:focus, .mat-mdc-fab-base.mat-mdc-button-disabled, .mat-mdc-fab-base.mat-mdc-button-disabled:focus {
  box-shadow: none;
}
.mat-mdc-fab-base.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}

.mat-mdc-fab {
  background-color: var(--%NS%mat-fab-container-color, var(--%NS%mat-sys-primary-container));
  border-radius: var(--%NS%mat-fab-container-shape, var(--%NS%mat-sys-corner-large));
  color: var(--%NS%mat-fab-foreground-color, var(--%NS%mat-sys-on-primary-container, inherit));
  box-shadow: var(--%NS%mat-fab-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
@media (hover: hover) {
  .mat-mdc-fab:hover {
    box-shadow: var(--%NS%mat-fab-hover-container-elevation-shadow, var(--%NS%mat-sys-level4));
  }
}
.mat-mdc-fab:focus {
  box-shadow: var(--%NS%mat-fab-focus-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
.mat-mdc-fab:active, .mat-mdc-fab:focus:active {
  box-shadow: var(--%NS%mat-fab-pressed-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
.mat-mdc-fab[disabled], .mat-mdc-fab.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-fab-disabled-state-foreground-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
  background-color: var(--%NS%mat-fab-disabled-state-container-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));
}
.mat-mdc-fab.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}
.mat-mdc-fab .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-fab-touch-target-size, 48px);
  display: var(--%NS%mat-fab-touch-target-display, block);
  left: 50%;
  width: var(--%NS%mat-fab-touch-target-size, 48px);
  transform: translate(-50%, -50%);
}
.mat-mdc-fab .mat-ripple-element {
  background-color: var(--%NS%mat-fab-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-primary-container) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-fab .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-fab-state-layer-color, var(--%NS%mat-sys-on-primary-container));
}
.mat-mdc-fab.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-fab-disabled-state-layer-color);
}
.mat-mdc-fab:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-fab-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-fab.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-fab.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-fab.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-fab-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-fab:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-fab-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}

.mat-mdc-mini-fab {
  width: 40px;
  height: 40px;
  background-color: var(--%NS%mat-fab-small-container-color, var(--%NS%mat-sys-primary-container));
  border-radius: var(--%NS%mat-fab-small-container-shape, var(--%NS%mat-sys-corner-medium));
  color: var(--%NS%mat-fab-small-foreground-color, var(--%NS%mat-sys-on-primary-container, inherit));
  box-shadow: var(--%NS%mat-fab-small-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
@media (hover: hover) {
  .mat-mdc-mini-fab:hover {
    box-shadow: var(--%NS%mat-fab-small-hover-container-elevation-shadow, var(--%NS%mat-sys-level4));
  }
}
.mat-mdc-mini-fab:focus {
  box-shadow: var(--%NS%mat-fab-small-focus-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
.mat-mdc-mini-fab:active, .mat-mdc-mini-fab:focus:active {
  box-shadow: var(--%NS%mat-fab-small-pressed-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
.mat-mdc-mini-fab .mat-focus-indicator::before {
  border-radius: calc(var(--%NS%mat-fab-small-container-shape, var(--%NS%mat-sys-corner-medium)) + calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 2px));
}
.mat-mdc-mini-fab[disabled], .mat-mdc-mini-fab.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-fab-small-disabled-state-foreground-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
  background-color: var(--%NS%mat-fab-small-disabled-state-container-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));
}
.mat-mdc-mini-fab.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}
.mat-mdc-mini-fab .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-fab-small-touch-target-size, 48px);
  display: var(--%NS%mat-fab-small-touch-target-display);
  left: 50%;
  width: var(--%NS%mat-fab-small-touch-target-size, 48px);
  transform: translate(-50%, -50%);
}
.mat-mdc-mini-fab .mat-ripple-element {
  background-color: var(--%NS%mat-fab-small-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-primary-container) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-mini-fab .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-fab-small-state-layer-color, var(--%NS%mat-sys-on-primary-container));
}
.mat-mdc-mini-fab.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-fab-small-disabled-state-layer-color);
}
.mat-mdc-mini-fab:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-fab-small-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-mini-fab.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-mini-fab.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-mini-fab.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-fab-small-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-mini-fab:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-fab-small-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}

.mat-mdc-extended-fab {
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  padding-left: 20px;
  padding-right: 20px;
  width: auto;
  max-width: 100%;
  line-height: normal;
  box-shadow: var(--%NS%mat-fab-extended-container-elevation-shadow, var(--%NS%mat-sys-level3));
  height: var(--%NS%mat-fab-extended-container-height, 56px);
  border-radius: var(--%NS%mat-fab-extended-container-shape, var(--%NS%mat-sys-corner-large));
  font-family: var(--%NS%mat-fab-extended-label-text-font, var(--%NS%mat-sys-label-large-font));
  font-size: var(--%NS%mat-fab-extended-label-text-size, var(--%NS%mat-sys-label-large-size));
  font-weight: var(--%NS%mat-fab-extended-label-text-weight, var(--%NS%mat-sys-label-large-weight));
  letter-spacing: var(--%NS%mat-fab-extended-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
}
@media (hover: hover) {
  .mat-mdc-extended-fab:hover {
    box-shadow: var(--%NS%mat-fab-extended-hover-container-elevation-shadow, var(--%NS%mat-sys-level4));
  }
}
.mat-mdc-extended-fab:focus {
  box-shadow: var(--%NS%mat-fab-extended-focus-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
.mat-mdc-extended-fab:active, .mat-mdc-extended-fab:focus:active {
  box-shadow: var(--%NS%mat-fab-extended-pressed-container-elevation-shadow, var(--%NS%mat-sys-level3));
}
.mat-mdc-extended-fab[disabled], .mat-mdc-extended-fab.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
}
.mat-mdc-extended-fab[disabled], .mat-mdc-extended-fab[disabled]:focus, .mat-mdc-extended-fab.mat-mdc-button-disabled, .mat-mdc-extended-fab.mat-mdc-button-disabled:focus {
  box-shadow: none;
}
.mat-mdc-extended-fab.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}
[dir=rtl] .mat-mdc-extended-fab .mdc-button__label + .mat-icon, [dir=rtl] .mat-mdc-extended-fab .mdc-button__label + .material-icons,
.mat-mdc-extended-fab > .mat-icon,
.mat-mdc-extended-fab > .material-icons {
  margin-left: -8px;
  margin-right: 12px;
}
.mat-mdc-extended-fab .mdc-button__label + .mat-icon,
.mat-mdc-extended-fab .mdc-button__label + .material-icons, [dir=rtl] .mat-mdc-extended-fab > .mat-icon, [dir=rtl] .mat-mdc-extended-fab > .material-icons {
  margin-left: 12px;
  margin-right: -8px;
}
.mat-mdc-extended-fab .mat-mdc-button-touch-target {
  width: 100%;
}

.mat-mdc-button-progress-indicator-container {
  position: absolute;
  inset-inline-start: 0;
  margin-block-start: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.mat-mdc-button-progress-indicator-shown mat-icon,
.mat-mdc-button-progress-indicator-shown [matButtonIcon],
.mat-mdc-button-progress-indicator-shown .mdc-button__label {
  visibility: hidden;
}
`;var Oe=new Map([[`text`,[`mat-mdc-button`]],[`filled`,[`mdc-button--unelevated`,`mat-mdc-unelevated-button`]],[`elevated`,[`mdc-button--raised`,`mat-mdc-raised-button`]],[`outlined`,[`mdc-button--outlined`,`mat-mdc-outlined-button`]],[`tonal`,[`mat-tonal-button`]]]);var di=(()=>{class i extends _t{get appearance(){return this._appearance}set appearance(t){this.setAppearance(t||this._config?.defaultAppearance||`text`)}_appearance=null;constructor(){super();let t=hn(this._elementRef.nativeElement);t&&this.setAppearance(t)}setAppearance(t){if(t===this._appearance)return;let n=this._elementRef.nativeElement.classList,o=this._appearance?Oe.get(this._appearance):null,a=Oe.get(t);o&&n.remove(...o),n.add(...a),this._appearance=t}static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`button`,`matButton`,``],[`a`,`matButton`,``],[`button`,`mat-button`,``],[`button`,`mat-raised-button`,``],[`button`,`mat-flat-button`,``],[`button`,`mat-stroked-button`,``],[`a`,`mat-button`,``],[`a`,`mat-raised-button`,``],[`a`,`mat-flat-button`,``],[`a`,`mat-stroked-button`,``]],hostAttrs:[1,`mdc-button`],inputs:{appearance:[0,`matButton`,`appearance`]},exportAs:[`matButton`,`matAnchor`],features:[Av],ngContentSelectors:Pe$1,decls:8,vars:5,consts:[[1,`mat-mdc-button-persistent-ripple`],[1,`mdc-button__label`],[1,`mat-mdc-button-progress-indicator-container`],[1,`mat-focus-indicator`],[1,`mat-mdc-button-touch-target`]],template:function(n,o){n&1&&(qd(De),Fv(0,`span`,0),Zd(1),$d(2,`span`,1),Zd(3,1),zd(),Zd(4,2),jb(5,cn,2,0,`div`,2),Fv(6,`span`,3)(7,`span`,4)),n&2&&(Ya(`mdc-button__ripple`,!o._isFab)(`mdc-fab__ripple`,o._isFab),jC(5),Ub(o.showProgress()?5:-1))},styles:[`.mat-mdc-button-base {
  text-decoration: none;
}
.mat-mdc-button-base .mat-icon {
  min-height: fit-content;
  flex-shrink: 0;
}
@media (hover: none) {
  .mat-mdc-button-base:hover > span.mat-mdc-button-persistent-ripple::before {
    opacity: 0;
  }
}

.mdc-button {
  -webkit-user-select: none;
  user-select: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 64px;
  border: none;
  outline: none;
  line-height: inherit;
  -webkit-appearance: none;
  overflow: visible;
  vertical-align: middle;
  background: transparent;
  padding: 0 8px;
}
.mdc-button::-moz-focus-inner {
  padding: 0;
  border: 0;
}
.mdc-button:active {
  outline: none;
}
.mdc-button:hover {
  cursor: pointer;
}
.mdc-button:disabled {
  cursor: default;
  pointer-events: none;
}
.mdc-button[hidden] {
  display: none;
}
.mdc-button .mdc-button__label {
  position: relative;
}

.mat-mdc-button {
  padding: 0 var(--%NS%mat-button-text-horizontal-padding, 12px);
  height: var(--%NS%mat-button-text-container-height, 40px);
  font-family: var(--%NS%mat-button-text-label-text-font, var(--%NS%mat-sys-label-large-font));
  font-size: var(--%NS%mat-button-text-label-text-size, var(--%NS%mat-sys-label-large-size));
  letter-spacing: var(--%NS%mat-button-text-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  text-transform: var(--%NS%mat-button-text-label-text-transform);
  font-weight: var(--%NS%mat-button-text-label-text-weight, var(--%NS%mat-sys-label-large-weight));
}
.mat-mdc-button, .mat-mdc-button .mdc-button__ripple {
  border-radius: var(--%NS%mat-button-text-container-shape, var(--%NS%mat-sys-corner-full));
}
.mat-mdc-button:not(:disabled) {
  color: var(--%NS%mat-button-text-label-text-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-button[disabled], .mat-mdc-button.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-button-text-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-mdc-button.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}
.mat-mdc-button:has(.material-icons, mat-icon, [matButtonIcon]) {
  padding: 0 var(--%NS%mat-button-text-with-icon-horizontal-padding, 16px);
}
.mat-mdc-button > .mat-icon {
  margin-right: var(--%NS%mat-button-text-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-text-icon-offset, -4px);
}
[dir=rtl] .mat-mdc-button > .mat-icon {
  margin-right: var(--%NS%mat-button-text-icon-offset, -4px);
  margin-left: var(--%NS%mat-button-text-icon-spacing, 8px);
}
.mat-mdc-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-text-icon-offset, -4px);
  margin-left: var(--%NS%mat-button-text-icon-spacing, 8px);
}
[dir=rtl] .mat-mdc-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-text-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-text-icon-offset, -4px);
}
.mat-mdc-button .mat-ripple-element {
  background-color: var(--%NS%mat-button-text-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-primary) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-button .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-text-state-layer-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-text-disabled-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-button:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-text-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-button.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-button.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-button.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-text-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-button:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-text-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}
.mat-mdc-button .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-button-text-touch-target-size, 48px);
  display: var(--%NS%mat-button-text-touch-target-display, block);
  left: 0;
  right: 0;
  transform: translateY(-50%);
}

.mat-mdc-unelevated-button {
  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
  height: var(--%NS%mat-button-filled-container-height, 40px);
  font-family: var(--%NS%mat-button-filled-label-text-font, var(--%NS%mat-sys-label-large-font));
  font-size: var(--%NS%mat-button-filled-label-text-size, var(--%NS%mat-sys-label-large-size));
  letter-spacing: var(--%NS%mat-button-filled-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  text-transform: var(--%NS%mat-button-filled-label-text-transform);
  font-weight: var(--%NS%mat-button-filled-label-text-weight, var(--%NS%mat-sys-label-large-weight));
  padding: 0 var(--%NS%mat-button-filled-horizontal-padding, 24px);
}
.mat-mdc-unelevated-button > .mat-icon {
  margin-right: var(--%NS%mat-button-filled-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-filled-icon-offset, -8px);
}
[dir=rtl] .mat-mdc-unelevated-button > .mat-icon {
  margin-right: var(--%NS%mat-button-filled-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-filled-icon-spacing, 8px);
}
.mat-mdc-unelevated-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-filled-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-filled-icon-spacing, 8px);
}
[dir=rtl] .mat-mdc-unelevated-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-filled-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-filled-icon-offset, -8px);
}
.mat-mdc-unelevated-button .mat-ripple-element {
  background-color: var(--%NS%mat-button-filled-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-primary) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-unelevated-button .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-filled-state-layer-color, var(--%NS%mat-sys-on-primary));
}
.mat-mdc-unelevated-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-filled-disabled-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-unelevated-button:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-filled-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-unelevated-button.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-unelevated-button.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-unelevated-button.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-filled-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-unelevated-button:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-filled-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}
.mat-mdc-unelevated-button .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-button-filled-touch-target-size, 48px);
  display: var(--%NS%mat-button-filled-touch-target-display, block);
  left: 0;
  right: 0;
  transform: translateY(-50%);
}
.mat-mdc-unelevated-button:not(:disabled) {
  color: var(--%NS%mat-button-filled-label-text-color, var(--%NS%mat-sys-on-primary));
  background-color: var(--%NS%mat-button-filled-container-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-unelevated-button, .mat-mdc-unelevated-button .mdc-button__ripple {
  border-radius: var(--%NS%mat-button-filled-container-shape, var(--%NS%mat-sys-corner-full));
}
.mat-mdc-unelevated-button .mat-mdc-button-progress-indicator-container {
  --%NS%mat-progress-spinner-active-indicator-color: var(--%NS%mat-button-filled-progress-active-indicator-color, var(--%NS%mat-sys-on-primary));
}
.mat-mdc-unelevated-button[disabled], .mat-mdc-unelevated-button.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-button-filled-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
  background-color: var(--%NS%mat-button-filled-disabled-container-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));
}
.mat-mdc-unelevated-button.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}

.mat-mdc-raised-button {
  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--%NS%mat-button-protected-container-elevation-shadow, var(--%NS%mat-sys-level1));
  height: var(--%NS%mat-button-protected-container-height, 40px);
  font-family: var(--%NS%mat-button-protected-label-text-font, var(--%NS%mat-sys-label-large-font));
  font-size: var(--%NS%mat-button-protected-label-text-size, var(--%NS%mat-sys-label-large-size));
  letter-spacing: var(--%NS%mat-button-protected-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  text-transform: var(--%NS%mat-button-protected-label-text-transform);
  font-weight: var(--%NS%mat-button-protected-label-text-weight, var(--%NS%mat-sys-label-large-weight));
  padding: 0 var(--%NS%mat-button-protected-horizontal-padding, 24px);
}
.mat-mdc-raised-button > .mat-icon {
  margin-right: var(--%NS%mat-button-protected-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-protected-icon-offset, -8px);
}
[dir=rtl] .mat-mdc-raised-button > .mat-icon {
  margin-right: var(--%NS%mat-button-protected-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-protected-icon-spacing, 8px);
}
.mat-mdc-raised-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-protected-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-protected-icon-spacing, 8px);
}
[dir=rtl] .mat-mdc-raised-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-protected-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-protected-icon-offset, -8px);
}
.mat-mdc-raised-button .mat-ripple-element {
  background-color: var(--%NS%mat-button-protected-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-primary) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-raised-button .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-protected-state-layer-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-raised-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-protected-disabled-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-raised-button:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-protected-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-raised-button.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-raised-button.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-raised-button.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-protected-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-raised-button:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-protected-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}
.mat-mdc-raised-button .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-button-protected-touch-target-size, 48px);
  display: var(--%NS%mat-button-protected-touch-target-display, block);
  left: 0;
  right: 0;
  transform: translateY(-50%);
}
.mat-mdc-raised-button:not(:disabled) {
  color: var(--%NS%mat-button-protected-label-text-color, var(--%NS%mat-sys-primary));
  background-color: var(--%NS%mat-button-protected-container-color, var(--%NS%mat-sys-surface));
}
.mat-mdc-raised-button, .mat-mdc-raised-button .mdc-button__ripple {
  border-radius: var(--%NS%mat-button-protected-container-shape, var(--%NS%mat-sys-corner-full));
}
@media (hover: hover) {
  .mat-mdc-raised-button:hover {
    box-shadow: var(--%NS%mat-button-protected-hover-container-elevation-shadow, var(--%NS%mat-sys-level2));
  }
}
.mat-mdc-raised-button:focus {
  box-shadow: var(--%NS%mat-button-protected-focus-container-elevation-shadow, var(--%NS%mat-sys-level1));
}
.mat-mdc-raised-button:active, .mat-mdc-raised-button:focus:active {
  box-shadow: var(--%NS%mat-button-protected-pressed-container-elevation-shadow, var(--%NS%mat-sys-level1));
}
.mat-mdc-raised-button[disabled], .mat-mdc-raised-button.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-button-protected-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
  background-color: var(--%NS%mat-button-protected-disabled-container-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));
}
.mat-mdc-raised-button[disabled].mat-mdc-button-disabled, .mat-mdc-raised-button.mat-mdc-button-disabled.mat-mdc-button-disabled {
  box-shadow: var(--%NS%mat-button-protected-disabled-container-elevation-shadow, var(--%NS%mat-sys-level0));
}
.mat-mdc-raised-button.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}

.mat-mdc-outlined-button {
  border-style: solid;
  transition: border 280ms cubic-bezier(0.4, 0, 0.2, 1);
  height: var(--%NS%mat-button-outlined-container-height, 40px);
  font-family: var(--%NS%mat-button-outlined-label-text-font, var(--%NS%mat-sys-label-large-font));
  font-size: var(--%NS%mat-button-outlined-label-text-size, var(--%NS%mat-sys-label-large-size));
  letter-spacing: var(--%NS%mat-button-outlined-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  text-transform: var(--%NS%mat-button-outlined-label-text-transform);
  font-weight: var(--%NS%mat-button-outlined-label-text-weight, var(--%NS%mat-sys-label-large-weight));
  border-radius: var(--%NS%mat-button-outlined-container-shape, var(--%NS%mat-sys-corner-full));
  border-width: var(--%NS%mat-button-outlined-outline-width, 1px);
  padding: 0 var(--%NS%mat-button-outlined-horizontal-padding, 24px);
}
.mat-mdc-outlined-button > .mat-icon {
  margin-right: var(--%NS%mat-button-outlined-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-outlined-icon-offset, -8px);
}
[dir=rtl] .mat-mdc-outlined-button > .mat-icon {
  margin-right: var(--%NS%mat-button-outlined-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-outlined-icon-spacing, 8px);
}
.mat-mdc-outlined-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-outlined-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-outlined-icon-spacing, 8px);
}
[dir=rtl] .mat-mdc-outlined-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-outlined-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-outlined-icon-offset, -8px);
}
.mat-mdc-outlined-button .mat-ripple-element {
  background-color: var(--%NS%mat-button-outlined-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-primary) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-outlined-button .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-outlined-state-layer-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-outlined-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-outlined-disabled-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-outlined-button:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-outlined-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-mdc-outlined-button.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-outlined-button.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-mdc-outlined-button.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-outlined-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-mdc-outlined-button:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-outlined-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}
.mat-mdc-outlined-button .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-button-outlined-touch-target-size, 48px);
  display: var(--%NS%mat-button-outlined-touch-target-display, block);
  left: 0;
  right: 0;
  transform: translateY(-50%);
}
.mat-mdc-outlined-button:not(:disabled) {
  color: var(--%NS%mat-button-outlined-label-text-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-button-outlined-outline-color, var(--%NS%mat-sys-outline));
}
.mat-mdc-outlined-button[disabled], .mat-mdc-outlined-button.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-button-outlined-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
  border-color: var(--%NS%mat-button-outlined-disabled-outline-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));
}
.mat-mdc-outlined-button.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}

.mat-tonal-button {
  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
  height: var(--%NS%mat-button-tonal-container-height, 40px);
  font-family: var(--%NS%mat-button-tonal-label-text-font, var(--%NS%mat-sys-label-large-font));
  font-size: var(--%NS%mat-button-tonal-label-text-size, var(--%NS%mat-sys-label-large-size));
  letter-spacing: var(--%NS%mat-button-tonal-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  text-transform: var(--%NS%mat-button-tonal-label-text-transform);
  font-weight: var(--%NS%mat-button-tonal-label-text-weight, var(--%NS%mat-sys-label-large-weight));
  padding: 0 var(--%NS%mat-button-tonal-horizontal-padding, 24px);
}
.mat-tonal-button:not(:disabled) {
  color: var(--%NS%mat-button-tonal-label-text-color, var(--%NS%mat-sys-on-secondary-container));
  background-color: var(--%NS%mat-button-tonal-container-color, var(--%NS%mat-sys-secondary-container));
}
.mat-tonal-button, .mat-tonal-button .mdc-button__ripple {
  border-radius: var(--%NS%mat-button-tonal-container-shape, var(--%NS%mat-sys-corner-full));
}
.mat-tonal-button[disabled], .mat-tonal-button.mat-mdc-button-disabled {
  cursor: default;
  pointer-events: none;
  color: var(--%NS%mat-button-tonal-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
  background-color: var(--%NS%mat-button-tonal-disabled-container-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));
}
.mat-tonal-button.mat-mdc-button-disabled-interactive {
  pointer-events: auto;
}
.mat-tonal-button > .mat-icon {
  margin-right: var(--%NS%mat-button-tonal-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-tonal-icon-offset, -8px);
}
[dir=rtl] .mat-tonal-button > .mat-icon {
  margin-right: var(--%NS%mat-button-tonal-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-tonal-icon-spacing, 8px);
}
.mat-tonal-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-tonal-icon-offset, -8px);
  margin-left: var(--%NS%mat-button-tonal-icon-spacing, 8px);
}
[dir=rtl] .mat-tonal-button .mdc-button__label + .mat-icon {
  margin-right: var(--%NS%mat-button-tonal-icon-spacing, 8px);
  margin-left: var(--%NS%mat-button-tonal-icon-offset, -8px);
}
.mat-tonal-button .mat-ripple-element {
  background-color: var(--%NS%mat-button-tonal-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-secondary-container) calc(var(--%NS%mat-sys-pressed-state-layer-opacity) * 100%), transparent));
}
.mat-tonal-button .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-tonal-state-layer-color, var(--%NS%mat-sys-on-secondary-container));
}
.mat-tonal-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before {
  background-color: var(--%NS%mat-button-tonal-disabled-state-layer-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-tonal-button:hover > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-tonal-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}
.mat-tonal-button.cdk-program-focused > .mat-mdc-button-persistent-ripple::before, .mat-tonal-button.cdk-keyboard-focused > .mat-mdc-button-persistent-ripple::before, .mat-tonal-button.mat-mdc-button-disabled-interactive:focus > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-tonal-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}
.mat-tonal-button:active > .mat-mdc-button-persistent-ripple::before {
  opacity: var(--%NS%mat-button-tonal-pressed-state-layer-opacity, var(--%NS%mat-sys-pressed-state-layer-opacity));
}
.mat-tonal-button .mat-mdc-button-touch-target {
  position: absolute;
  top: 50%;
  height: var(--%NS%mat-button-tonal-touch-target-size, 48px);
  display: var(--%NS%mat-button-tonal-touch-target-display, block);
  left: 0;
  right: 0;
  transform: translateY(-50%);
}

.mat-mdc-button,
.mat-mdc-unelevated-button,
.mat-mdc-raised-button,
.mat-mdc-outlined-button,
.mat-tonal-button {
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-button .mat-mdc-button-ripple,
.mat-mdc-button .mat-mdc-button-persistent-ripple,
.mat-mdc-button .mat-mdc-button-persistent-ripple::before,
.mat-mdc-unelevated-button .mat-mdc-button-ripple,
.mat-mdc-unelevated-button .mat-mdc-button-persistent-ripple,
.mat-mdc-unelevated-button .mat-mdc-button-persistent-ripple::before,
.mat-mdc-raised-button .mat-mdc-button-ripple,
.mat-mdc-raised-button .mat-mdc-button-persistent-ripple,
.mat-mdc-raised-button .mat-mdc-button-persistent-ripple::before,
.mat-mdc-outlined-button .mat-mdc-button-ripple,
.mat-mdc-outlined-button .mat-mdc-button-persistent-ripple,
.mat-mdc-outlined-button .mat-mdc-button-persistent-ripple::before,
.mat-tonal-button .mat-mdc-button-ripple,
.mat-tonal-button .mat-mdc-button-persistent-ripple,
.mat-tonal-button .mat-mdc-button-persistent-ripple::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}
.mat-mdc-button .mat-mdc-button-ripple,
.mat-mdc-unelevated-button .mat-mdc-button-ripple,
.mat-mdc-raised-button .mat-mdc-button-ripple,
.mat-mdc-outlined-button .mat-mdc-button-ripple,
.mat-tonal-button .mat-mdc-button-ripple {
  overflow: hidden;
}
.mat-mdc-button .mat-mdc-button-persistent-ripple::before,
.mat-mdc-unelevated-button .mat-mdc-button-persistent-ripple::before,
.mat-mdc-raised-button .mat-mdc-button-persistent-ripple::before,
.mat-mdc-outlined-button .mat-mdc-button-persistent-ripple::before,
.mat-tonal-button .mat-mdc-button-persistent-ripple::before {
  content: "";
  opacity: 0;
}
.mat-mdc-button .mdc-button__label,
.mat-mdc-button .mat-icon,
.mat-mdc-unelevated-button .mdc-button__label,
.mat-mdc-unelevated-button .mat-icon,
.mat-mdc-raised-button .mdc-button__label,
.mat-mdc-raised-button .mat-icon,
.mat-mdc-outlined-button .mdc-button__label,
.mat-mdc-outlined-button .mat-icon,
.mat-tonal-button .mdc-button__label,
.mat-tonal-button .mat-icon {
  z-index: 1;
  position: relative;
}
.mat-mdc-button .mat-focus-indicator,
.mat-mdc-unelevated-button .mat-focus-indicator,
.mat-mdc-raised-button .mat-focus-indicator,
.mat-mdc-outlined-button .mat-focus-indicator,
.mat-tonal-button .mat-focus-indicator {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  border-radius: inherit;
}
.mat-mdc-button:focus-visible > .mat-focus-indicator::before,
.mat-mdc-unelevated-button:focus-visible > .mat-focus-indicator::before,
.mat-mdc-raised-button:focus-visible > .mat-focus-indicator::before,
.mat-mdc-outlined-button:focus-visible > .mat-focus-indicator::before,
.mat-tonal-button:focus-visible > .mat-focus-indicator::before {
  content: "";
  border-radius: inherit;
}
.mat-mdc-button._mat-animation-noopable,
.mat-mdc-unelevated-button._mat-animation-noopable,
.mat-mdc-raised-button._mat-animation-noopable,
.mat-mdc-outlined-button._mat-animation-noopable,
.mat-tonal-button._mat-animation-noopable {
  transition: none !important;
  animation: none !important;
}
.mat-mdc-button > .mat-icon,
.mat-mdc-unelevated-button > .mat-icon,
.mat-mdc-raised-button > .mat-icon,
.mat-mdc-outlined-button > .mat-icon,
.mat-tonal-button > .mat-icon {
  display: inline-block;
  position: relative;
  vertical-align: top;
  font-size: 1.125rem;
  height: 1.125rem;
  width: 1.125rem;
}

.mat-mdc-outlined-button .mat-mdc-button-ripple,
.mat-mdc-outlined-button .mdc-button__ripple {
  top: -1px;
  left: -1px;
  bottom: -1px;
  right: -1px;
}

.mat-mdc-unelevated-button .mat-focus-indicator::before,
.mat-tonal-button .mat-focus-indicator::before,
.mat-mdc-raised-button .mat-focus-indicator::before {
  margin: calc(calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 2px) * -1);
}

.mat-mdc-outlined-button .mat-focus-indicator::before {
  margin: calc(calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 3px) * -1);
}

.mat-mdc-button-progress-indicator-container {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.mat-mdc-button-progress-indicator-shown mat-icon,
.mat-mdc-button-progress-indicator-shown [matButtonIcon],
.mat-mdc-button-progress-indicator-shown .mdc-button__label {
  visibility: hidden;
}
`,`@media (forced-colors: active) {
  .mat-mdc-button:not(.mdc-button--outlined),
  .mat-mdc-unelevated-button:not(.mdc-button--outlined),
  .mat-mdc-raised-button:not(.mdc-button--outlined),
  .mat-mdc-outlined-button:not(.mdc-button--outlined),
  .mat-mdc-button-base.mat-tonal-button,
  .mat-mdc-icon-button.mat-mdc-icon-button,
  .mat-mdc-outlined-button .mdc-button__ripple {
    outline: solid 1px;
  }
}
`],encapsulation:2})}return i})();function hn(i){return i.hasAttribute(`mat-raised-button`)?`elevated`:i.hasAttribute(`mat-stroked-button`)?`outlined`:i.hasAttribute(`mat-flat-button`)?`filled`:i.hasAttribute(`mat-button`)?`text`:null}var un=new y$1(`mat-mdc-fab-default-options`,{providedIn:`root`,factory:()=>Ht$1});var Ht$1={color:`accent`};var mi=(()=>{class i extends _t{_options=p(un,{optional:!0});_isFab=!0;constructor(){super(),this._options=this._options||Ht$1,this.color=this._options.color||Ht$1.color}static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`button`,`mat-mini-fab`,``],[`a`,`mat-mini-fab`,``],[`button`,`matMiniFab`,``],[`a`,`matMiniFab`,``]],hostAttrs:[1,`mdc-fab`,`mat-mdc-fab-base`,`mdc-fab--mini`,`mat-mdc-mini-fab`],exportAs:[`matButton`,`matAnchor`],features:[Av],ngContentSelectors:Pe$1,decls:8,vars:5,consts:[[1,`mat-mdc-button-persistent-ripple`],[1,`mdc-button__label`],[1,`mat-mdc-button-progress-indicator-container`],[1,`mat-focus-indicator`],[1,`mat-mdc-button-touch-target`]],template:function(n,o){n&1&&(qd(De),Fv(0,`span`,0),Zd(1),$d(2,`span`,1),Zd(3,1),zd(),Zd(4,2),jb(5,dn,2,0,`div`,2),Fv(6,`span`,3)(7,`span`,4)),n&2&&(Ya(`mdc-button__ripple`,!o._isFab)(`mdc-fab__ripple`,o._isFab),jC(5),Ub(o.showProgress()?5:-1))},styles:[mn],encapsulation:2})}return i})();var hi=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({imports:[Ee,sD]})}return i})();var pn=20;var lt$1=(()=>{class i{_ngZone=p(le);_platform=p(l);_renderer=p(Yn).createRenderer(null,null);_cleanupGlobalListener;_scrolled=new Y;_scrolledCount=0;scrollContainers=new Map;register(t){this.scrollContainers.has(t)||this.scrollContainers.set(t,t.elementScrolled().subscribe(()=>this._scrolled.next(t)))}deregister(t){let n=this.scrollContainers.get(t);n&&(n.unsubscribe(),this.scrollContainers.delete(t))}scrolled(t=pn){return this._platform.isBrowser?new N(n=>{this._cleanupGlobalListener||(this._cleanupGlobalListener=this._ngZone.runOutsideAngular(()=>this._renderer.listen(`document`,`scroll`,()=>this._scrolled.next())));let o=t>0?this._scrolled.pipe(AE(t)).subscribe(n):this._scrolled.subscribe(n);return this._scrolledCount++,()=>{o.unsubscribe(),this._scrolledCount--,this._scrolledCount||(this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0)}}):T$2()}ngOnDestroy(){this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0,this.scrollContainers.forEach((t,n)=>this.deregister(n)),this._scrolled.complete()}ancestorScrolled(t,n){let o=this.getAncestorScrollContainers(t);return this.scrolled(n).pipe(Te$1(a=>!a||o.indexOf(a)>-1))}getAncestorScrollContainers(t){let n=[];return this.scrollContainers.forEach((o,a)=>{this._targetContainsElement(a,t)&&n.push(a)}),n}_targetContainsElement(t,n){let o=T$3(n),a=t.getElementRef().nativeElement;do if(o==a)return!0;while(o=o.parentElement);return!1}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var fn=(()=>{class i{elementRef=p(st$2);scrollDispatcher=p(lt$1);ngZone=p(le);dir=p(kM,{optional:!0});_scrollElement=this.elementRef.nativeElement;_destroyed=new Y;_renderer=p(Qn);_cleanupScroll;_elementScrolled=new Y;ngOnInit(){this._cleanupScroll=this.ngZone.runOutsideAngular(()=>this._renderer.listen(this._scrollElement,`scroll`,t=>this._elementScrolled.next(t))),this.scrollDispatcher.register(this)}ngOnDestroy(){this._cleanupScroll?.(),this._elementScrolled.complete(),this.scrollDispatcher.deregister(this),this._destroyed.next(),this._destroyed.complete()}elementScrolled(){return this._elementScrolled}getElementRef(){return this.elementRef}scrollTo(t){let n=this.elementRef.nativeElement,o=this.dir&&this.dir.value==`rtl`;t.left??=o?t.end:t.start,t.right??=o?t.start:t.end,t.bottom!=null&&(t.top=n.scrollHeight-n.clientHeight-t.bottom),o&&Ls()!=N$1.NORMAL?(t.left!=null&&(t.right=n.scrollWidth-n.clientWidth-t.left),Ls()==N$1.INVERTED?t.left=t.right:Ls()==N$1.NEGATED&&(t.left=t.right?-t.right:t.right)):t.right!=null&&(t.left=n.scrollWidth-n.clientWidth-t.right),this._applyScrollToOptions(t)}_applyScrollToOptions(t){let n=this.elementRef.nativeElement;Ss()?n.scrollTo(t):(t.top!=null&&(n.scrollTop=t.top),t.left!=null&&(n.scrollLeft=t.left))}measureScrollOffset(t){let n=`left`,o=`right`,a=this.elementRef.nativeElement;if(t==`top`)return a.scrollTop;if(t==`bottom`)return a.scrollHeight-a.clientHeight-a.scrollTop;let r=this.dir&&this.dir.value==`rtl`;return t==`start`?t=r?o:n:t==`end`&&(t=r?n:o),r&&Ls()==N$1.INVERTED?t==n?a.scrollWidth-a.clientWidth-a.scrollLeft:a.scrollLeft:r&&Ls()==N$1.NEGATED?t==n?a.scrollLeft+a.scrollWidth-a.clientWidth:-a.scrollLeft:t==n?a.scrollLeft:a.scrollWidth-a.clientWidth-a.scrollLeft}static ɵfac=function(n){return new(n||i)};static ɵdir=ct$2({type:i,selectors:[[``,`cdk-scrollable`,``],[``,`cdkScrollable`,``]]})}return i})();var bn=20;var tt$1=(()=>{class i{_platform=p(l);_listeners;_viewportSize=null;_change=new Y;_document=p(z$1);constructor(){let t=p(le),n=p(Yn).createRenderer(null,null);t.runOutsideAngular(()=>{if(this._platform.isBrowser){let o=a=>this._change.next(a);this._listeners=[n.listen(`window`,`resize`,o),n.listen(`window`,`orientationchange`,o)]}this.change().subscribe(()=>this._viewportSize=null)})}ngOnDestroy(){this._listeners?.forEach(t=>t()),this._change.complete()}getViewportSize(){this._viewportSize||this._updateViewportSize();let t={width:this._viewportSize.width,height:this._viewportSize.height};return this._platform.isBrowser||(this._viewportSize=null),t}getViewportRect(){let t=this.getViewportScrollPosition(),{width:n,height:o}=this.getViewportSize();return{top:t.top,left:t.left,bottom:t.top+o,right:t.left+n,height:o,width:n}}getViewportScrollPosition(){if(!this._platform.isBrowser)return{top:0,left:0};let t=this._document,n=this._getWindow(),o=t.documentElement,a=o.getBoundingClientRect();return{top:-a.top||t.body?.scrollTop||n.scrollY||o.scrollTop||0,left:-a.left||t.body?.scrollLeft||n.scrollX||o.scrollLeft||0}}change(t=bn){return t>0?this._change.pipe(AE(t)):this._change}_getWindow(){return this._document.defaultView||window}_updateViewportSize(){let t=this._getWindow();this._viewportSize=this._platform.isBrowser?{width:t.innerWidth,height:t.innerHeight}:{width:0,height:0}}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var Wt=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({})}return i})();var Xt=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({imports:[sD,Wt,sD,Wt]})}return i})();var ct$1=class{_attachedHost=null;attach(e){return this._attachedHost=e,e.attach(this)}detach(){let e=this._attachedHost;e!=null&&(this._attachedHost=null,e.detach())}get isAttached(){return this._attachedHost!=null}setAttachedHost(e){this._attachedHost=e}};var Ut=class extends ct$1{component;viewContainerRef;injector;projectableNodes;bindings;directives;constructor(e,t,n,o,a,r){super(),this.component=e,this.viewContainerRef=t,this.injector=n,this.projectableNodes=o,this.bindings=a||null,this.directives=r||null}};var dt$1=class extends ct$1{templateRef;viewContainerRef;context;injector;constructor(e,t,n,o){super(),this.templateRef=e,this.viewContainerRef=t,this.context=n,this.injector=o}get origin(){return this.templateRef.elementRef}attach(e,t=this.context){return this.context=t,super.attach(e)}detach(){return this.context=void 0,super.detach()}};var Zt=class extends ct$1{element;constructor(e){super(),this.element=e instanceof st$2?e.nativeElement:e}};var yt=class{_attachedPortal=null;_disposeFn=null;_isDisposed=!1;hasAttached(){return!!this._attachedPortal}attach(e){if(e instanceof Ut)return this._attachedPortal=e,this.attachComponentPortal(e);if(e instanceof dt$1)return this._attachedPortal=e,this.attachTemplatePortal(e);if(this.attachDomPortal&&e instanceof Zt)return this._attachedPortal=e,this.attachDomPortal(e)}attachDomPortal=null;detach(){this._attachedPortal&&(this._attachedPortal.setAttachedHost(null),this._attachedPortal=null),this._invokeDisposeFn()}dispose(){this.hasAttached()&&this.detach(),this._invokeDisposeFn(),this._isDisposed=!0}setDisposeFn(e){this._disposeFn=e}_invokeDisposeFn(){this._disposeFn&&(this._disposeFn(),this._disposeFn=null)}};var St=class extends yt{outletElement;_appRef;_defaultInjector;constructor(e,t,n){super(),this.outletElement=e,this._appRef=t,this._defaultInjector=n}attachComponentPortal(e){let t;if(e.viewContainerRef){let n=e.injector||e.viewContainerRef.injector,o=n.get(Kn,null,{optional:!0})||void 0;t=e.viewContainerRef.createComponent(e.component,{index:e.viewContainerRef.length,injector:n,ngModuleRef:o,projectableNodes:e.projectableNodes||void 0,bindings:e.bindings||void 0,directives:e.directives||void 0}),this.setDisposeFn(()=>t.destroy())}else{let n=this._appRef,o=e.injector||this._defaultInjector||me.NULL,a=o.get(Q,n.injector);t=Ty(e.component,{elementInjector:o,environmentInjector:a,projectableNodes:e.projectableNodes||void 0,bindings:e.bindings||void 0,directives:e.directives||void 0}),n.attachView(t.hostView),this.setDisposeFn(()=>{n.viewCount>0&&n.detachView(t.hostView),t.destroy()})}return this.outletElement.appendChild(this._getComponentRootNode(t)),this._attachedPortal=e,t}attachTemplatePortal(e){let t=e.viewContainerRef,n=t.createEmbeddedView(e.templateRef,e.context,{injector:e.injector});return n.rootNodes.forEach(o=>this.outletElement.appendChild(o)),n.detectChanges(),this.setDisposeFn(()=>{let o=t.indexOf(n);o!==-1&&t.remove(o)}),this._attachedPortal=e,n}attachDomPortal=e=>{let t=e.element;t.parentNode;let n=this.outletElement.ownerDocument.createComment(`dom-portal`);t.parentNode.insertBefore(n,t),this.outletElement.appendChild(t),this._attachedPortal=e,super.setDisposeFn(()=>{n.parentNode&&n.parentNode.replaceChild(t,n)})};dispose(){super.dispose(),this.outletElement.remove()}_getComponentRootNode(e){return e.hostView.rootNodes[0]}};var oo=(()=>{class i extends yt{_moduleRef=p(Kn,{optional:!0});_document=p(z$1);_viewContainerRef=p(It);_isInitialized=!1;_attachedRef=null;get portal(){return this._attachedPortal}set portal(t){this.hasAttached()&&!t&&!this._isInitialized||(this.hasAttached()&&super.detach(),t&&super.attach(t),this._attachedPortal=t||null)}attached=new ue;get attachedRef(){return this._attachedRef}ngOnInit(){this._isInitialized=!0}ngOnDestroy(){super.dispose(),this._attachedRef=this._attachedPortal=null}attachComponentPortal(t){t.setAttachedHost(this);let n=t.viewContainerRef!=null?t.viewContainerRef:this._viewContainerRef,o=n.createComponent(t.component,{index:n.length,injector:t.injector||n.injector,projectableNodes:t.projectableNodes||void 0,ngModuleRef:this._moduleRef||void 0,bindings:t.bindings||void 0,directives:t.directives||void 0});return n!==this._viewContainerRef&&this._getRootNode().appendChild(o.hostView.rootNodes[0]),super.setDisposeFn(()=>o.destroy()),this._attachedPortal=t,this._attachedRef=o,this.attached.emit(o),o}attachTemplatePortal(t){t.setAttachedHost(this);let n=this._viewContainerRef.createEmbeddedView(t.templateRef,t.context,{injector:t.injector});return super.setDisposeFn(()=>this._viewContainerRef.clear()),this._attachedPortal=t,this._attachedRef=n,this.attached.emit(n),n}attachDomPortal=t=>{let n=t.element;n.parentNode;let o=this._document.createComment(`dom-portal`);t.setAttachedHost(this),n.parentNode.insertBefore(o,n),this._getRootNode().appendChild(n),this._attachedPortal=t,super.setDisposeFn(()=>{o.parentNode&&o.parentNode.replaceChild(n,o)})};_getRootNode(){let t=this._viewContainerRef.element.nativeElement;return t.nodeType===t.ELEMENT_NODE?t:t.parentNode}static ɵfac=(()=>{let t;return function(o){return(t||(t=Yg(i)))(o||i)}})();static ɵdir=ct$2({type:i,selectors:[[``,`cdkPortalOutlet`,``]],inputs:{portal:[0,`cdkPortalOutlet`,`portal`]},outputs:{attached:`attached`},exportAs:[`cdkPortalOutlet`],features:[Av]})}return i})();var Me$1=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({})}return i})();var Ae=Ss();function Le$1(i){return new wt(i.get(tt$1),i.get(z$1))}var wt=class{_viewportRuler;_previousHTMLStyles={top:``,left:``};_previousScrollPosition;_isEnabled=!1;_document;constructor(e,t){this._viewportRuler=e,this._document=t}attach(){}enable(){if(this._canBeEnabled()){let e=this._document.documentElement;this._previousScrollPosition=this._viewportRuler.getViewportScrollPosition(),this._previousHTMLStyles.left=e.style.left||``,this._previousHTMLStyles.top=e.style.top||``,e.style.left=Si(-this._previousScrollPosition.left),e.style.top=Si(-this._previousScrollPosition.top),e.classList.add(`cdk-global-scrollblock`),this._isEnabled=!0}}disable(){if(this._isEnabled){let e=this._document.documentElement,t=this._document.body,n=e.style,o=t.style,a=n.scrollBehavior||``,r=o.scrollBehavior||``;this._isEnabled=!1,n.left=this._previousHTMLStyles.left,n.top=this._previousHTMLStyles.top,e.classList.remove(`cdk-global-scrollblock`),Ae&&(n.scrollBehavior=o.scrollBehavior=`auto`),window.scroll(this._previousScrollPosition.left,this._previousScrollPosition.top),Ae&&(n.scrollBehavior=a,o.scrollBehavior=r)}}_canBeEnabled(){if(this._document.documentElement.classList.contains(`cdk-global-scrollblock`)||this._isEnabled)return!1;let t=this._document.documentElement,n=this._viewportRuler.getViewportSize();return t.scrollHeight>n.height||t.scrollWidth>n.width}};function je$1(i,e){return new xt(i.get(lt$1),i.get(le),i.get(tt$1),e)}var xt=class{_scrollDispatcher;_ngZone;_viewportRuler;_config;_scrollSubscription=null;_overlayRef;_initialScrollPosition;constructor(e,t,n,o){this._scrollDispatcher=e,this._ngZone=t,this._viewportRuler=n,this._config=o}attach(e){this._overlayRef,this._overlayRef=e}enable(){if(this._scrollSubscription)return;let e=this._scrollDispatcher.scrolled(0).pipe(Te$1(t=>!t||!this._overlayRef.overlayElement.contains(t.getElementRef().nativeElement)));this._config&&this._config.threshold&&this._config.threshold>1?(this._initialScrollPosition=this._viewportRuler.getViewportScrollPosition().top,this._scrollSubscription=e.subscribe(()=>{let t=this._viewportRuler.getViewportScrollPosition().top;Math.abs(t-this._initialScrollPosition)>this._config.threshold?this._detach():this._overlayRef.updatePosition()})):this._scrollSubscription=e.subscribe(this._detach)}disable(){this._scrollSubscription&&(this._scrollSubscription.unsubscribe(),this._scrollSubscription=null)}detach(){this.disable(),this._overlayRef=null}_detach=()=>{this.disable(),this._overlayRef.hasAttached()&&this._ngZone.run(()=>this._overlayRef.detach())}};var mt$1=class{enable(){}disable(){}attach(){}};function Gt(i,e){return e.some(t=>{let n=i.bottom<t.top,o=i.top>t.bottom,a=i.right<t.left,r=i.left>t.right;return n||o||a||r})}function Te(i,e){return e.some(t=>{let n=i.top<t.top,o=i.bottom>t.bottom,a=i.left<t.left,r=i.right>t.right;return n||o||a||r})}function qt(i,e){return new Nt(i.get(lt$1),i.get(tt$1),i.get(le),e)}var Nt=class{_scrollDispatcher;_viewportRuler;_ngZone;_config;_scrollSubscription=null;_overlayRef;constructor(e,t,n,o){this._scrollDispatcher=e,this._viewportRuler=t,this._ngZone=n,this._config=o}attach(e){this._overlayRef,this._overlayRef=e}enable(){if(!this._scrollSubscription){let e=this._config?this._config.scrollThrottle:0;this._scrollSubscription=this._scrollDispatcher.scrolled(e).subscribe(()=>{if(this._overlayRef.updatePosition(),this._config&&this._config.autoClose){let t=this._overlayRef.overlayElement.getBoundingClientRect(),{width:n,height:o}=this._viewportRuler.getViewportSize();Gt(t,[{width:n,height:o,bottom:o,right:n,top:0,left:0}])&&(this.disable(),this._ngZone.run(()=>this._overlayRef.detach()))}})}}disable(){this._scrollSubscription&&(this._scrollSubscription.unsubscribe(),this._scrollSubscription=null)}detach(){this.disable(),this._overlayRef=null}};var Ye$2=(()=>{class i{_injector=p(me);noop=()=>new mt$1;close=t=>je$1(this._injector,t);block=()=>Le$1(this._injector);reposition=t=>qt(this._injector,t);static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var ht=class{positionStrategy;scrollStrategy=new mt$1;panelClass=``;hasBackdrop=!1;backdropClass=`cdk-overlay-dark-backdrop`;disableAnimations;width;height;minWidth;minHeight;maxWidth;maxHeight;direction;disposeOnNavigation=!1;usePopover;eventPredicate;constructor(e){if(e){let t=Object.keys(e);for(let n of t)e[n]!==void 0&&(this[n]=e[n])}}};var Ct=class{connectionPair;scrollableViewProperties;constructor(e,t){this.connectionPair=e,this.scrollableViewProperties=t}};var He$1=(()=>{class i{_attachedOverlays=[];_document=p(z$1);_isAttached=!1;ngOnDestroy(){this.detach()}add(t){this.remove(t),this._attachedOverlays.push(t)}remove(t){let n=this._attachedOverlays.indexOf(t);n>-1&&this._attachedOverlays.splice(n,1),this._attachedOverlays.length===0&&this.detach()}canReceiveEvent(t,n,o){return o.observers.length<1?!1:t.eventPredicate?t.eventPredicate(n):!0}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var We$1=(()=>{class i extends He$1{_ngZone=p(le);_renderer=p(Yn).createRenderer(null,null);_cleanupKeydown;add(t){super.add(t),this._isAttached||(this._ngZone.runOutsideAngular(()=>{this._cleanupKeydown=this._renderer.listen(`body`,`keydown`,this._keydownListener)}),this._isAttached=!0)}detach(){this._isAttached&&(this._cleanupKeydown?.(),this._isAttached=!1)}_keydownListener=t=>{let n=this._attachedOverlays;for(let o=n.length-1;o>-1;o--){let a=n[o];if(this.canReceiveEvent(a,t,a._keydownEvents)){this._ngZone.run(()=>a._keydownEvents.next(t));break}}};static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var Xe$1=(()=>{class i extends He$1{_platform=p(l);_ngZone=p(le);_renderer=p(Yn).createRenderer(null,null);_cursorOriginalValue;_cursorStyleIsSet=!1;_pointerDownEventTarget=null;_cleanups;add(t){if(super.add(t),!this._isAttached){let n=this._document.body,o={capture:!0},a=this._renderer;this._cleanups=this._ngZone.runOutsideAngular(()=>[a.listen(n,`pointerdown`,this._pointerDownListener,o),a.listen(n,`click`,this._clickListener,o),a.listen(n,`auxclick`,this._clickListener,o),a.listen(n,`contextmenu`,this._clickListener,o)]),this._platform.IOS&&!this._cursorStyleIsSet&&(this._cursorOriginalValue=n.style.cursor,n.style.cursor=`pointer`,this._cursorStyleIsSet=!0),this._isAttached=!0}}detach(){this._isAttached&&(this._cleanups?.forEach(t=>t()),this._cleanups=void 0,this._platform.IOS&&this._cursorStyleIsSet&&(this._document.body.style.cursor=this._cursorOriginalValue,this._cursorStyleIsSet=!1),this._isAttached=!1)}_pointerDownListener=t=>{this._pointerDownEventTarget=p$1(t)};_clickListener=t=>{let n=p$1(t),o=t.type===`click`&&this._pointerDownEventTarget?this._pointerDownEventTarget:n;this._pointerDownEventTarget=null;let a=this._attachedOverlays.slice();for(let r=a.length-1;r>-1;r--){let c=a[r],d=c._outsidePointerEvents;if(!(!c.hasAttached()||!this.canReceiveEvent(c,t,d))){if(Fe$1(c.overlayElement,n)||Fe$1(c.overlayElement,o))break;this._ngZone?this._ngZone.run(()=>d.next(t)):d.next(t)}}};static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();function Fe$1(i,e){let t=typeof ShadowRoot<`u`&&ShadowRoot,n=e;for(;n;){if(n===i)return!0;n=t&&n instanceof ShadowRoot?n.host:n.parentNode}return!1}var Ue$1=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`ng-component`]],hostAttrs:[`cdk-overlay-style-loader`,``],decls:0,vars:0,template:function(n,o){},styles:[`.cdk-overlay-container, .cdk-global-overlay-wrapper {
  pointer-events: none;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}

.cdk-overlay-container {
  position: fixed;
}
@layer cdk-overlay {
  .cdk-overlay-container {
    z-index: 1000;
  }
}
.cdk-overlay-container:empty {
  display: none;
}

.cdk-global-overlay-wrapper {
  display: flex;
  position: absolute;
}
@layer cdk-overlay {
  .cdk-global-overlay-wrapper {
    z-index: 1000;
  }
}

.cdk-overlay-pane {
  position: absolute;
  pointer-events: auto;
  box-sizing: border-box;
  display: flex;
  max-width: 100%;
  max-height: 100%;
}
@layer cdk-overlay {
  .cdk-overlay-pane {
    z-index: 1000;
  }
}

.cdk-overlay-backdrop {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  opacity: 0;
  touch-action: manipulation;
}
@layer cdk-overlay {
  .cdk-overlay-backdrop {
    z-index: 1000;
    transition: opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
  }
}
@media (prefers-reduced-motion) {
  .cdk-overlay-backdrop {
    transition-duration: 1ms;
  }
}

.cdk-overlay-backdrop-showing {
  opacity: 1;
}
@media (forced-colors: active) {
  .cdk-overlay-backdrop-showing {
    opacity: 0.6;
  }
}

@layer cdk-overlay {
  .cdk-overlay-dark-backdrop {
    background: rgba(0, 0, 0, 0.32);
  }
}

.cdk-overlay-transparent-backdrop {
  transition: visibility 1ms linear, opacity 1ms linear;
  visibility: hidden;
  opacity: 1;
}
.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing, .cdk-high-contrast-active .cdk-overlay-transparent-backdrop {
  opacity: 0;
  visibility: visible;
}

.cdk-overlay-backdrop-noop-animation {
  transition: none;
}

.cdk-overlay-connected-position-bounding-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 1px;
  min-height: 1px;
}
@layer cdk-overlay {
  .cdk-overlay-connected-position-bounding-box {
    z-index: 1000;
  }
}

.cdk-global-scrollblock {
  position: fixed;
  width: 100%;
  overflow-y: scroll;
}

.cdk-overlay-popover {
  background: none;
  border: none;
  padding: 0;
  outline: 0;
  overflow: visible;
  position: fixed;
  pointer-events: none;
  white-space: normal;
  color: inherit;
  text-decoration: none;
  width: 100%;
  height: 100%;
  inset: auto;
  top: 0;
  left: 0;
}
.cdk-overlay-popover::backdrop {
  display: none;
}
.cdk-overlay-popover .cdk-overlay-backdrop {
  position: fixed;
  z-index: auto;
}
`],encapsulation:2})}return i})();var Ze$2=(()=>{class i{_platform=p(l);_containerElement;_document=p(z$1);_styleLoader=p(MM);ngOnDestroy(){this._containerElement?.remove()}getContainerElement(){return this._loadStyles(),this._containerElement||this._createContainer(),this._containerElement}_createContainer(){let t=`cdk-overlay-container`;if(this._platform.isBrowser||ks()){let o=this._document.querySelectorAll(`.${t}[platform="server"], .${t}[platform="test"]`);for(let a=0;a<o.length;a++)o[a].remove()}let n=this._document.createElement(`div`);n.classList.add(t),ks()?n.setAttribute(`platform`,`test`):this._platform.isBrowser||n.setAttribute(`platform`,`server`),this._document.body.appendChild(n),this._containerElement=n}_loadStyles(){this._styleLoader.load(Ue$1)}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var $t=class{_renderer;_ngZone;element;_cleanupClick;_cleanupTransitionEnd;_fallbackTimeout;constructor(e,t,n,o){this._renderer=t,this._ngZone=n,this.element=e.createElement(`div`),this.element.classList.add(`cdk-overlay-backdrop`),this._cleanupClick=t.listen(this.element,`click`,o)}detach(){this._ngZone.runOutsideAngular(()=>{let e=this.element;clearTimeout(this._fallbackTimeout),this._cleanupTransitionEnd?.(),this._cleanupTransitionEnd=this._renderer.listen(e,`transitionend`,this.dispose),this._fallbackTimeout=setTimeout(this.dispose,500),e.style.pointerEvents=`none`,e.classList.remove(`cdk-overlay-backdrop-showing`)})}dispose=()=>{clearTimeout(this._fallbackTimeout),this._cleanupClick?.(),this._cleanupTransitionEnd?.(),this._cleanupClick=this._cleanupTransitionEnd=this._fallbackTimeout=void 0,this.element.remove()}};function Qt(i){return i&&i.nodeType===1}var kt=class{_portalOutlet;_host;_pane;_config;_ngZone;_keyboardDispatcher;_document;_location;_outsideClickDispatcher;_animationsDisabled;_injector;_renderer;_backdropClick=new Y;_attachments=new Y;_detachments=new Y;_positionStrategy;_scrollStrategy;_locationChanges=oe$1.EMPTY;_backdropRef=null;_detachContentMutationObserver;_detachContentAfterRenderRef;_disposed=!1;_previousHostParent;_keydownEvents=new Y;_outsidePointerEvents=new Y;_afterNextRenderRef;constructor(e,t,n,o,a,r,c,d,m,l=!1,h,g){this._portalOutlet=e,this._host=t,this._pane=n,this._config=o,this._ngZone=a,this._keyboardDispatcher=r,this._document=c,this._location=d,this._outsideClickDispatcher=m,this._animationsDisabled=l,this._injector=h,this._renderer=g,o.scrollStrategy&&(this._scrollStrategy=o.scrollStrategy,this._scrollStrategy.attach(this)),this._positionStrategy=o.positionStrategy}get overlayElement(){return this._pane}get backdropElement(){return this._backdropRef?.element||null}get hostElement(){return this._host}get eventPredicate(){return this._config?.eventPredicate||null}attach(e){if(this._disposed)return null;this._attachHost();let t=this._portalOutlet.attach(e);return this._positionStrategy?.attach(this),this._updateStackingOrder(),this._updateElementSize(),this._updateElementDirection(),this._scrollStrategy&&this._scrollStrategy.enable(),this._afterNextRenderRef?.destroy(),this._afterNextRenderRef=La(()=>{this.hasAttached()&&this.updatePosition()},{injector:this._injector}),this._togglePointerEvents(!0),this._config.hasBackdrop&&this._attachBackdrop(),this._config.panelClass&&this._toggleClasses(this._pane,this._config.panelClass,!0),this._attachments.next(),this._completeDetachContent(),this._keyboardDispatcher.add(this),this._config.disposeOnNavigation&&(this._locationChanges=this._location.subscribe(()=>this.dispose())),this._outsideClickDispatcher.add(this),typeof t?.onDestroy==`function`&&t.onDestroy(()=>{this.hasAttached()&&this._ngZone.runOutsideAngular(()=>Promise.resolve().then(()=>this.detach()))}),t}detach(){if(!this.hasAttached())return;this.detachBackdrop(),this._togglePointerEvents(!1),this._positionStrategy&&this._positionStrategy.detach&&this._positionStrategy.detach(),this._scrollStrategy&&this._scrollStrategy.disable();let e=this._portalOutlet.detach();return this._detachments.next(),this._completeDetachContent(),this._keyboardDispatcher.remove(this),this._detachContentWhenEmpty(),this._locationChanges.unsubscribe(),this._outsideClickDispatcher.remove(this),e}dispose(){if(this._disposed)return;let e=this.hasAttached();this._positionStrategy&&this._positionStrategy.dispose(),this._disposeScrollStrategy(),this._backdropRef?.dispose(),this._locationChanges.unsubscribe(),this._keyboardDispatcher.remove(this),this._portalOutlet.dispose(),this._attachments.complete(),this._backdropClick.complete(),this._keydownEvents.complete(),this._outsidePointerEvents.complete(),this._outsideClickDispatcher.remove(this),this._host?.remove(),this._afterNextRenderRef?.destroy(),this._previousHostParent=this._pane=this._host=this._backdropRef=null,e&&this._detachments.next(),this._detachments.complete(),this._completeDetachContent(),this._disposed=!0}hasAttached(){return this._portalOutlet.hasAttached()}backdropClick(){return this._backdropClick}attachments(){return this._attachments}detachments(){return this._detachments}keydownEvents(){return this._keydownEvents}outsidePointerEvents(){return this._outsidePointerEvents}getConfig(){return this._config}updatePosition(){this._positionStrategy&&this._positionStrategy.apply()}updatePositionStrategy(e){e!==this._positionStrategy&&(this._positionStrategy&&this._positionStrategy.dispose(),this._positionStrategy=e,this.hasAttached()&&(e.attach(this),this.updatePosition()))}updateSize(e){this._config=m$2(m$2({},this._config),e),this._updateElementSize()}setDirection(e){this._config=L$2(m$2({},this._config),{direction:e}),this._updateElementDirection()}addPanelClass(e){this._pane&&this._toggleClasses(this._pane,e,!0)}removePanelClass(e){this._pane&&this._toggleClasses(this._pane,e,!1)}getDirection(){let e=this._config.direction;return e?typeof e==`string`?e:e.value:`ltr`}updateScrollStrategy(e){e!==this._scrollStrategy&&(this._disposeScrollStrategy(),this._scrollStrategy=e,this.hasAttached()&&(e.attach(this),e.enable()))}_updateElementDirection(){this._host.setAttribute(`dir`,this.getDirection())}_updateElementSize(){if(!this._pane)return;let e=this._pane.style;e.width=Si(this._config.width),e.height=Si(this._config.height),e.minWidth=Si(this._config.minWidth),e.minHeight=Si(this._config.minHeight),e.maxWidth=Si(this._config.maxWidth),e.maxHeight=Si(this._config.maxHeight)}_togglePointerEvents(e){this._pane.style.pointerEvents=e?``:`none`}_attachHost(){if(!this._host.parentElement){let e=this._config.usePopover?this._positionStrategy?.getPopoverInsertionPoint?.():null;Qt(e)?e.after(this._host):e?.type===`parent`?e.element.appendChild(this._host):this._previousHostParent?.appendChild(this._host)}if(this._config.usePopover)try{this._host.showPopover()}catch{}}_attachBackdrop(){let e=`cdk-overlay-backdrop-showing`;this._backdropRef?.dispose(),this._backdropRef=new $t(this._document,this._renderer,this._ngZone,t=>{this._backdropClick.next(t)}),this._animationsDisabled&&this._backdropRef.element.classList.add(`cdk-overlay-backdrop-noop-animation`),this._config.backdropClass&&this._toggleClasses(this._backdropRef.element,this._config.backdropClass,!0),this._config.usePopover?this._host.prepend(this._backdropRef.element):this._host.parentElement.insertBefore(this._backdropRef.element,this._host),!this._animationsDisabled&&typeof requestAnimationFrame<`u`?this._ngZone.runOutsideAngular(()=>{requestAnimationFrame(()=>this._backdropRef?.element.classList.add(e))}):this._backdropRef.element.classList.add(e)}_updateStackingOrder(){!this._config.usePopover&&this._host.nextSibling&&this._host.parentNode.appendChild(this._host)}detachBackdrop(){this._animationsDisabled?(this._backdropRef?.dispose(),this._backdropRef=null):this._backdropRef?.detach()}_toggleClasses(e,t,n){let o=ie$1(t||[]).filter(a=>!!a);o.length&&(n?e.classList.add(...o):e.classList.remove(...o))}_detachContentWhenEmpty(){let e=!1;try{this._detachContentAfterRenderRef=La(()=>{e=!0,this._detachContent()},{injector:this._injector})}catch(t){if(e)throw t;this._detachContent()}globalThis.MutationObserver&&this._pane&&(this._detachContentMutationObserver||=new globalThis.MutationObserver(()=>{this._detachContent()}),this._detachContentMutationObserver.observe(this._pane,{childList:!0}))}_detachContent(){(!this._pane||!this._host||this._pane.children.length===0)&&(this._pane&&this._config.panelClass&&this._toggleClasses(this._pane,this._config.panelClass,!1),this._host&&this._host.parentElement&&(this._previousHostParent=this._host.parentElement,this._host.remove()),this._completeDetachContent())}_completeDetachContent(){this._detachContentAfterRenderRef?.destroy(),this._detachContentAfterRenderRef=void 0,this._detachContentMutationObserver?.disconnect()}_disposeScrollStrategy(){let e=this._scrollStrategy;e?.disable(),e?.detach?.()}};var Be$1=`cdk-overlay-connected-position-bounding-box`;var gn=/([A-Za-z%]+)$/;function Jt(i,e){return new Rt(e,i.get(tt$1),i.get(z$1),i.get(l),i.get(Ze$2))}var Rt=class{_viewportRuler;_document;_platform;_overlayContainer;_overlayRef;_isInitialRender=!1;_lastBoundingBoxSize={width:0,height:0};_isPushed=!1;_canPush=!0;_growAfterOpen=!1;_hasFlexibleDimensions=!0;_positionLocked=!1;_originRect;_overlayRect;_viewportRect;_containerRect;_viewportMargin=0;_scrollables=[];_preferredPositions=[];_origin;_pane;_isDisposed=!1;_boundingBox=null;_lastPosition=null;_lastScrollVisibility=null;_positionChanges=new Y;_resizeSubscription=oe$1.EMPTY;_offsetX=0;_offsetY=0;_transformOriginSelector;_appliedPanelClasses=[];_previousPushAmount=null;_popoverLocation=`global`;positionChanges=this._positionChanges;get positions(){return this._preferredPositions}constructor(e,t,n,o,a){this._viewportRuler=t,this._document=n,this._platform=o,this._overlayContainer=a,this.setOrigin(e)}attach(e){this._overlayRef&&this._overlayRef,this._validatePositions(),e.hostElement.classList.add(Be$1),this._overlayRef=e,this._boundingBox=e.hostElement,this._pane=e.overlayElement,this._isDisposed=!1,this._isInitialRender=!0,this._lastPosition=null,this._resizeSubscription.unsubscribe(),this._resizeSubscription=this._viewportRuler.change().subscribe(()=>{this._isInitialRender=!0,this.apply()})}apply(){if(this._isDisposed||!this._platform.isBrowser)return;if(!this._isInitialRender&&this._positionLocked&&this._lastPosition){this.reapplyLastPosition();return}this._clearPanelClasses(),this._resetOverlayElementStyles(),this._resetBoundingBoxStyles(),this._viewportRect=this._getNarrowedViewportRect(),this._originRect=this._getOriginRect(),this._overlayRect=this._pane.getBoundingClientRect(),this._containerRect=this._getContainerRect();let e=this._originRect,t=this._overlayRect,n=this._viewportRect,o=this._containerRect,a=[],r;for(let c of this._preferredPositions){let d=this._getOriginPoint(e,o,c),m=this._getOverlayPoint(d,t,c),l=this._getOverlayFit(m,t,n,c);if(l.isCompletelyWithinViewport){this._isPushed=!1,this._applyPosition(c,d);return}if(this._canFitWithFlexibleDimensions(l,m,n)){a.push({position:c,origin:d,overlayRect:t,boundingBoxRect:this._calculateBoundingBoxRect(d,c)});continue}(!r||r.overlayFit.visibleArea<l.visibleArea)&&(r={overlayFit:l,overlayPoint:m,originPoint:d,position:c,overlayRect:t})}if(a.length){let c=null,d=-1;for(let m of a){let l=m.boundingBoxRect.width*m.boundingBoxRect.height*(m.position.weight||1);l>d&&(d=l,c=m)}this._isPushed=!1,this._applyPosition(c.position,c.origin);return}if(this._canPush){this._isPushed=!0,this._applyPosition(r.position,r.originPoint);return}this._applyPosition(r.position,r.originPoint)}detach(){this._clearPanelClasses(),this._lastPosition=null,this._previousPushAmount=null,this._resizeSubscription.unsubscribe()}dispose(){this._isDisposed||(this._boundingBox&&Z$1(this._boundingBox.style,{top:``,left:``,right:``,bottom:``,height:``,width:``,alignItems:``,justifyContent:``}),this._pane&&this._resetOverlayElementStyles(),this._overlayRef&&this._overlayRef.hostElement.classList.remove(Be$1),this.detach(),this._positionChanges.complete(),this._overlayRef=this._boundingBox=null,this._isDisposed=!0)}reapplyLastPosition(){if(this._isDisposed||!this._platform.isBrowser)return;let e=this._lastPosition;e?(this._originRect=this._getOriginRect(),this._overlayRect=this._pane.getBoundingClientRect(),this._viewportRect=this._getNarrowedViewportRect(),this._containerRect=this._getContainerRect(),this._applyPosition(e,this._getOriginPoint(this._originRect,this._containerRect,e))):this.apply()}withScrollableContainers(e){return this._scrollables=e,this}withPositions(e){return this._preferredPositions=e,e.indexOf(this._lastPosition)===-1&&(this._lastPosition=null),this._validatePositions(),this}withViewportMargin(e){return this._viewportMargin=e,this}withFlexibleDimensions(e=!0){return this._hasFlexibleDimensions=e,this}withGrowAfterOpen(e=!0){return this._growAfterOpen=e,this}withPush(e=!0){return this._canPush=e,this}withLockedPosition(e=!0){return this._positionLocked=e,this}setOrigin(e){return this._origin=e,this}withDefaultOffsetX(e){return this._offsetX=e,this}withDefaultOffsetY(e){return this._offsetY=e,this}withTransformOriginOn(e){return this._transformOriginSelector=e,this}withPopoverLocation(e){return this._popoverLocation=e,this}getPopoverInsertionPoint(){return this._popoverLocation===`global`?null:this._popoverLocation!==`inline`?this._popoverLocation:this._origin instanceof st$2?this._origin.nativeElement:Qt(this._origin)?this._origin:null}_getOriginPoint(e,t,n){let o;if(n.originX==`center`)o=e.left+e.width/2;else{let r=this._isRtl()?e.right:e.left,c=this._isRtl()?e.left:e.right;o=n.originX==`start`?r:c}t.left<0&&(o-=t.left);let a;return n.originY==`center`?a=e.top+e.height/2:a=n.originY==`top`?e.top:e.bottom,t.top<0&&(a-=t.top),{x:o,y:a}}_getOverlayPoint(e,t,n){let o;n.overlayX==`center`?o=-t.width/2:n.overlayX===`start`?o=this._isRtl()?-t.width:0:o=this._isRtl()?0:-t.width;let a;return n.overlayY==`center`?a=-t.height/2:a=n.overlayY==`top`?0:-t.height,{x:e.x+o,y:e.y+a}}_getOverlayFit(e,t,n,o){let a=ze$1(t),{x:r,y:c}=e,d=this._getOffset(o,`x`),m=this._getOffset(o,`y`);d&&(r+=d),m&&(c+=m);let l=0-r,h=r+a.width-n.width,g=0-c,y=c+a.height-n.height,f=this._subtractOverflows(a.width,l,h),p=this._subtractOverflows(a.height,g,y),X=f*p;return{visibleArea:X,isCompletelyWithinViewport:a.width*a.height===X,fitsInViewportVertically:p===a.height,fitsInViewportHorizontally:f==a.width}}_canFitWithFlexibleDimensions(e,t,n){if(this._hasFlexibleDimensions){let o=n.bottom-t.y,a=n.right-t.x,r=Ie(this._overlayRef.getConfig().minHeight),c=Ie(this._overlayRef.getConfig().minWidth),d=e.fitsInViewportVertically||r!=null&&r<=o,m=e.fitsInViewportHorizontally||c!=null&&c<=a;return d&&m}return!1}_pushOverlayOnScreen(e,t,n){if(this._previousPushAmount&&this._positionLocked)return{x:e.x+this._previousPushAmount.x,y:e.y+this._previousPushAmount.y};let o=ze$1(t),a=this._viewportRect,r=Math.max(e.x+o.width-a.width,0),c=Math.max(e.y+o.height-a.height,0),d=Math.max(a.top-n.top-e.y,0),m=Math.max(a.left-n.left-e.x,0),l=0,h=0;return o.width<=a.width?l=m||-r:l=e.x<this._getViewportMarginStart()?a.left-n.left-e.x:0,o.height<=a.height?h=d||-c:h=e.y<this._getViewportMarginTop()?a.top-n.top-e.y:0,this._previousPushAmount={x:l,y:h},{x:e.x+l,y:e.y+h}}_applyPosition(e,t){if(this._setTransformOrigin(e),this._setOverlayElementStyles(t,e),this._setBoundingBoxStyles(t,e),e.panelClass&&this._addPanelClasses(e.panelClass),this._positionChanges.observers.length){let n=this._getScrollVisibility();if(e!==this._lastPosition||!this._lastScrollVisibility||!vn(this._lastScrollVisibility,n)){let o=new Ct(e,n);this._positionChanges.next(o)}this._lastScrollVisibility=n}this._lastPosition=e,this._isInitialRender=!1}_setTransformOrigin(e){if(!this._transformOriginSelector)return;let t=this._boundingBox.querySelectorAll(this._transformOriginSelector),n,o=e.overlayY;e.overlayX===`center`?n=`center`:this._isRtl()?n=e.overlayX===`start`?`right`:`left`:n=e.overlayX===`start`?`left`:`right`;for(let a=0;a<t.length;a++)t[a].style.transformOrigin=`${n} ${o}`}_calculateBoundingBoxRect(e,t){let n=this._viewportRect,o=this._isRtl(),a,r,c;if(t.overlayY===`top`)r=e.y,a=n.height-r+this._getViewportMarginBottom();else if(t.overlayY===`bottom`)c=n.height-e.y+this._getViewportMarginTop()+this._getViewportMarginBottom(),a=n.height-c+this._getViewportMarginTop();else{let y=Math.min(n.bottom-e.y+n.top,e.y),f=this._lastBoundingBoxSize.height;a=y*2,r=e.y-y,a>f&&!this._isInitialRender&&!this._growAfterOpen&&(r=e.y-f/2)}let d=t.overlayX===`start`&&!o||t.overlayX===`end`&&o,m=t.overlayX===`end`&&!o||t.overlayX===`start`&&o,l,h,g;if(m)g=n.width-e.x+this._getViewportMarginStart()+this._getViewportMarginEnd(),l=e.x-this._getViewportMarginStart();else if(d)h=e.x,l=n.right-e.x-this._getViewportMarginEnd();else{let y=Math.min(n.right-e.x+n.left,e.x),f=this._lastBoundingBoxSize.width;l=y*2,h=e.x-y,l>f&&!this._isInitialRender&&!this._growAfterOpen&&(h=e.x-f/2)}return{top:r,left:h,bottom:c,right:g,width:l,height:a}}_setBoundingBoxStyles(e,t){let n=this._calculateBoundingBoxRect(e,t);!this._isInitialRender&&!this._growAfterOpen&&(n.height=Math.min(n.height,this._lastBoundingBoxSize.height),n.width=Math.min(n.width,this._lastBoundingBoxSize.width));let o={};if(this._hasExactPosition())o.top=o.left=`0`,o.bottom=o.right=`auto`,o.maxHeight=o.maxWidth=``,o.width=o.height=`100%`;else{let a=this._overlayRef.getConfig().maxHeight,r=this._overlayRef.getConfig().maxWidth;o.width=Si(n.width),o.height=Si(n.height),o.top=Si(n.top)||`auto`,o.bottom=Si(n.bottom)||`auto`,o.left=Si(n.left)||`auto`,o.right=Si(n.right)||`auto`,t.overlayX===`center`?o.alignItems=`center`:o.alignItems=t.overlayX===`end`?`flex-end`:`flex-start`,t.overlayY===`center`?o.justifyContent=`center`:o.justifyContent=t.overlayY===`bottom`?`flex-end`:`flex-start`,a&&(o.maxHeight=Si(a)),r&&(o.maxWidth=Si(r))}this._lastBoundingBoxSize=n,Z$1(this._boundingBox.style,o)}_resetBoundingBoxStyles(){Z$1(this._boundingBox.style,{top:`0`,left:`0`,right:`0`,bottom:`0`,height:``,width:``,alignItems:``,justifyContent:``})}_resetOverlayElementStyles(){Z$1(this._pane.style,{top:``,left:``,bottom:``,right:``,position:``,transform:``})}_setOverlayElementStyles(e,t){let n={},o=this._hasExactPosition(),a=this._hasFlexibleDimensions,r=this._overlayRef.getConfig();if(o){let l=this._viewportRuler.getViewportScrollPosition();Z$1(n,this._getExactOverlayY(t,e,l)),Z$1(n,this._getExactOverlayX(t,e,l))}else n.position=`static`;let c=``,d=this._getOffset(t,`x`),m=this._getOffset(t,`y`);d&&(c+=`translateX(${d}px) `),m&&(c+=`translateY(${m}px)`),n.transform=c.trim(),r.maxHeight&&(o?n.maxHeight=Si(r.maxHeight):a&&(n.maxHeight=``)),r.maxWidth&&(o?n.maxWidth=Si(r.maxWidth):a&&(n.maxWidth=``)),Z$1(this._pane.style,n)}_getExactOverlayY(e,t,n){let o={top:``,bottom:``},a=this._getOverlayPoint(t,this._overlayRect,e);if(this._isPushed&&(a=this._pushOverlayOnScreen(a,this._overlayRect,n)),e.overlayY===`bottom`)o.bottom=`${this._document.documentElement.clientHeight-(a.y+this._overlayRect.height)}px`;else o.top=Si(a.y);return o}_getExactOverlayX(e,t,n){let o={left:``,right:``},a=this._getOverlayPoint(t,this._overlayRect,e);this._isPushed&&(a=this._pushOverlayOnScreen(a,this._overlayRect,n));let r;if(this._isRtl()?r=e.overlayX===`end`?`left`:`right`:r=e.overlayX===`end`?`right`:`left`,r===`right`)o.right=`${this._document.documentElement.clientWidth-(a.x+this._overlayRect.width)}px`;else o.left=Si(a.x);return o}_getScrollVisibility(){let e=this._getOriginRect(),t=this._pane.getBoundingClientRect(),n=this._scrollables.map(o=>o.getElementRef().nativeElement.getBoundingClientRect());return{isOriginClipped:Te(e,n),isOriginOutsideView:Gt(e,n),isOverlayClipped:Te(t,n),isOverlayOutsideView:Gt(t,n)}}_subtractOverflows(e,...t){return t.reduce((n,o)=>n-Math.max(o,0),e)}_getNarrowedViewportRect(){let e=this._document.documentElement.clientWidth,t=this._document.documentElement.clientHeight,n=this._viewportRuler.getViewportScrollPosition();return{top:n.top+this._getViewportMarginTop(),left:n.left+this._getViewportMarginStart(),right:n.left+e-this._getViewportMarginEnd(),bottom:n.top+t-this._getViewportMarginBottom(),width:e-this._getViewportMarginStart()-this._getViewportMarginEnd(),height:t-this._getViewportMarginTop()-this._getViewportMarginBottom()}}_isRtl(){return this._overlayRef.getDirection()===`rtl`}_hasExactPosition(){return!this._hasFlexibleDimensions||this._isPushed}_getOffset(e,t){return t===`x`?e.offsetX==null?this._offsetX:e.offsetX:e.offsetY==null?this._offsetY:e.offsetY}_validatePositions(){}_addPanelClasses(e){this._pane&&ie$1(e).forEach(t=>{t!==``&&this._appliedPanelClasses.indexOf(t)===-1&&(this._appliedPanelClasses.push(t),this._pane.classList.add(t))})}_clearPanelClasses(){this._pane&&(this._appliedPanelClasses.forEach(e=>{this._pane.classList.remove(e)}),this._appliedPanelClasses=[])}_getViewportMarginStart(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.start??0}_getViewportMarginEnd(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.end??0}_getViewportMarginTop(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.top??0}_getViewportMarginBottom(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.bottom??0}_getOriginRect(){let e=this._origin;if(e instanceof st$2)return e.nativeElement.getBoundingClientRect();if(e instanceof Element)return e.getBoundingClientRect();let t=e.width||0,n=e.height||0;return{top:e.y,bottom:e.y+n,left:e.x,right:e.x+t,height:n,width:t}}_getContainerRect(){let e=this._overlayRef.getConfig().usePopover&&this._popoverLocation!==`global`,t=this._overlayContainer.getContainerElement();e&&(t.style.display=`block`);let n=t.getBoundingClientRect();return e&&(t.style.display=``),n}};function Z$1(i,e){for(let t in e)e.hasOwnProperty(t)&&(i[t]=e[t]);return i}function Ie(i){if(typeof i!=`number`&&i!=null){let[e,t]=i.split(gn);return!t||t===`px`?parseFloat(e):null}return i||null}function ze$1(i){return{top:Math.floor(i.top),right:Math.floor(i.right),bottom:Math.floor(i.bottom),left:Math.floor(i.left),width:Math.floor(i.width),height:Math.floor(i.height)}}function vn(i,e){return i===e?!0:i.isOriginClipped===e.isOriginClipped&&i.isOriginOutsideView===e.isOriginOutsideView&&i.isOverlayClipped===e.isOverlayClipped&&i.isOverlayOutsideView===e.isOverlayOutsideView}var Ve=`cdk-global-overlay-wrapper`;function Ge$2(i){return new Et}var Et=class{_overlayRef;_cssPosition=`static`;_topOffset=``;_bottomOffset=``;_alignItems=``;_xPosition=``;_xOffset=``;_width=``;_height=``;_isDisposed=!1;attach(e){let t=e.getConfig();this._overlayRef=e,this._width&&!t.width&&e.updateSize({width:this._width}),this._height&&!t.height&&e.updateSize({height:this._height}),e.hostElement.classList.add(Ve),this._isDisposed=!1}top(e=``){return this._bottomOffset=``,this._topOffset=e,this._alignItems=`flex-start`,this}left(e=``){return this._xOffset=e,this._xPosition=`left`,this}bottom(e=``){return this._topOffset=``,this._bottomOffset=e,this._alignItems=`flex-end`,this}right(e=``){return this._xOffset=e,this._xPosition=`right`,this}start(e=``){return this._xOffset=e,this._xPosition=`start`,this}end(e=``){return this._xOffset=e,this._xPosition=`end`,this}width(e=``){return this._overlayRef?this._overlayRef.updateSize({width:e}):this._width=e,this}height(e=``){return this._overlayRef?this._overlayRef.updateSize({height:e}):this._height=e,this}centerHorizontally(e=``){return this.left(e),this._xPosition=`center`,this}centerVertically(e=``){return this.top(e),this._alignItems=`center`,this}apply(){if(!this._overlayRef||!this._overlayRef.hasAttached())return;let e=this._overlayRef.overlayElement.style,t=this._overlayRef.hostElement.style,{width:o,height:a,maxWidth:r,maxHeight:c}=this._overlayRef.getConfig(),d=(o===`100%`||o===`100vw`)&&(!r||r===`100%`||r===`100vw`),m=(a===`100%`||a===`100vh`)&&(!c||c===`100%`||c===`100vh`),l=this._xPosition,h=this._xOffset,g=this._overlayRef.getConfig().direction===`rtl`,y=``,f=``,p=``;d?p=`flex-start`:l===`center`?(p=`center`,g?f=h:y=h):g?l===`left`||l===`end`?(p=`flex-end`,y=h):(l===`right`||l===`start`)&&(p=`flex-start`,f=h):l===`left`||l===`start`?(p=`flex-start`,y=h):(l===`right`||l===`end`)&&(p=`flex-end`,f=h),e.position=this._cssPosition,e.marginLeft=d?`0`:y,e.marginTop=m?`0`:this._topOffset,e.marginBottom=this._bottomOffset,e.marginRight=d?`0`:f,t.justifyContent=p,t.alignItems=m?`flex-start`:this._alignItems}dispose(){if(this._isDisposed||!this._overlayRef)return;let e=this._overlayRef.overlayElement.style,t=this._overlayRef.hostElement,n=t.style;t.classList.remove(Ve),n.justifyContent=n.alignItems=e.marginTop=e.marginBottom=e.marginLeft=e.marginRight=e.position=``,this._overlayRef=null,this._isDisposed=!0}};var $e$2=(()=>{class i{_injector=p(me);global(){return Ge$2()}flexibleConnectedTo(t){return Jt(this._injector,t)}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var te=new y$1(`OVERLAY_DEFAULT_CONFIG`);function ee$1(i,e){i.get(MM).load(Ue$1);let t=i.get(Ze$2),n=i.get(z$1),o=i.get(X$1),a=i.get(Ft),r=i.get(kM),c=i.get(Qn,null,{optional:!0})||i.get(Yn).createRenderer(null,null),d=new ht(e),m=i.get(te,null,{optional:!0})?.usePopover??!0;d.direction=d.direction||r.value,!n.body||!(`showPopover`in n.body)?d.usePopover=!1:d.usePopover=e?.usePopover??m;let l=n.createElement(`div`),h=n.createElement(`div`);l.id=o.getId(`cdk-overlay-`),l.classList.add(`cdk-overlay-pane`),h.appendChild(l),d.usePopover&&(h.setAttribute(`popover`,`manual`),h.classList.add(`cdk-overlay-popover`));let g=d.usePopover?d.positionStrategy?.getPopoverInsertionPoint?.():null;return Qt(g)?g.after(h):g?.type===`parent`?g.element.appendChild(h):t.getContainerElement().appendChild(h),new kt(new St(l,a,i),h,l,d,i.get(le),i.get(We$1),n,i.get(qr),i.get(Xe$1),e?.disableAnimations??i.get(_I,null,{optional:!0})===`NoopAnimations`,i.get(Q),c)}var Ke$2=(()=>{class i{scrollStrategies=p(Ye$2);_positionBuilder=p($e$2);_injector=p(me);create(t){return ee$1(this._injector,t)}position(){return this._positionBuilder}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var _n=[{originX:`start`,originY:`bottom`,overlayX:`start`,overlayY:`top`},{originX:`start`,originY:`top`,overlayX:`start`,overlayY:`bottom`},{originX:`end`,originY:`top`,overlayX:`end`,overlayY:`bottom`},{originX:`end`,originY:`bottom`,overlayX:`end`,overlayY:`top`}];var yn=new y$1(`cdk-connected-overlay-scroll-strategy`,{providedIn:`root`,factory:()=>{let i=p(me);return()=>qt(i)}});var Kt=(()=>{class i{elementRef=p(st$2);static ɵfac=function(n){return new(n||i)};static ɵdir=ct$2({type:i,selectors:[[``,`cdk-overlay-origin`,``],[``,`overlay-origin`,``],[``,`cdkOverlayOrigin`,``]],exportAs:[`cdkOverlayOrigin`]})}return i})();var qe$2=new y$1(`cdk-connected-overlay-default-config`);var Sn=(()=>{class i{_dir=p(kM,{optional:!0});_injector=p(me);_overlayRef;_templatePortal;_backdropSubscription=oe$1.EMPTY;_attachSubscription=oe$1.EMPTY;_detachSubscription=oe$1.EMPTY;_positionSubscription=oe$1.EMPTY;_offsetX;_offsetY;_position;_scrollStrategyFactory=p(yn);_ngZone=p(le);origin;positions;positionStrategy;get offsetX(){return this._offsetX}set offsetX(t){this._offsetX=t,this._position&&this._updatePositionStrategy(this._position)}get offsetY(){return this._offsetY}set offsetY(t){this._offsetY=t,this._position&&this._updatePositionStrategy(this._position)}width;height;minWidth;minHeight;backdropClass;panelClass;viewportMargin=0;scrollStrategy;open=!1;disableClose=!1;transformOriginSelector;hasBackdrop=!1;lockPosition=!1;flexibleDimensions=!1;growAfterOpen=!1;push=!1;disposeOnNavigation=!1;usePopover;matchWidth=!1;set _config(t){typeof t!=`string`&&this._assignConfig(t)}backdropClick=new ue;positionChange=new ue;attach=new ue;detach=new ue;overlayKeydown=new ue;overlayOutsideClick=new ue;constructor(){let t=p(ln$1),n=p(It),o=p(qe$2,{optional:!0}),a=p(te,{optional:!0});this.usePopover=a?.usePopover===!1?null:`global`,this._templatePortal=new dt$1(t,n),this.scrollStrategy=this._scrollStrategyFactory(),o&&this._assignConfig(o)}get overlayRef(){return this._overlayRef}get dir(){return this._dir?this._dir.value:`ltr`}ngOnDestroy(){this._attachSubscription.unsubscribe(),this._detachSubscription.unsubscribe(),this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this._overlayRef?.dispose()}ngOnChanges(t){this._position&&(this._updatePositionStrategy(this._position),this._overlayRef?.updateSize({width:this._getWidth(),minWidth:this.minWidth,height:this.height,minHeight:this.minHeight}),t.origin&&this.open&&this._position.apply()),t.open&&(this.open?this.attachOverlay():this.detachOverlay())}_createOverlay(){(!this.positions||!this.positions.length)&&(this.positions=_n);let t=this._overlayRef=ee$1(this._injector,this._buildConfig());this._attachSubscription=t.attachments().subscribe(()=>this.attach.emit()),this._detachSubscription=t.detachments().subscribe(()=>this.detach.emit()),t.keydownEvents().subscribe(n=>{this.overlayKeydown.next(n),n.keyCode===27&&!this.disableClose&&!Fe$2(n)&&(n.preventDefault(),this.detachOverlay())}),this._overlayRef.outsidePointerEvents().subscribe(n=>{let o=this._getOriginElement(),a=p$1(n);(!o||o!==a&&!o.contains(a))&&this.overlayOutsideClick.next(n)})}_buildConfig(){let t=this._position=this.positionStrategy||this._createPositionStrategy(),n=new ht({direction:this._dir||`ltr`,positionStrategy:t,scrollStrategy:this.scrollStrategy,hasBackdrop:this.hasBackdrop,disposeOnNavigation:this.disposeOnNavigation,usePopover:!!this.usePopover});return(this.height||this.height===0)&&(n.height=this.height),(this.minWidth||this.minWidth===0)&&(n.minWidth=this.minWidth),(this.minHeight||this.minHeight===0)&&(n.minHeight=this.minHeight),this.backdropClass&&(n.backdropClass=this.backdropClass),this.panelClass&&(n.panelClass=this.panelClass),n}_updatePositionStrategy(t){let n=this.positions.map(o=>({originX:o.originX,originY:o.originY,overlayX:o.overlayX,overlayY:o.overlayY,offsetX:o.offsetX||this.offsetX,offsetY:o.offsetY||this.offsetY,panelClass:o.panelClass||void 0}));return t.setOrigin(this._getOrigin()).withPositions(n).withFlexibleDimensions(this.flexibleDimensions).withPush(this.push).withGrowAfterOpen(this.growAfterOpen).withViewportMargin(this.viewportMargin).withLockedPosition(this.lockPosition).withTransformOriginOn(this.transformOriginSelector).withPopoverLocation(this.usePopover===null?`global`:this.usePopover)}_createPositionStrategy(){let t=Jt(this._injector,this._getOrigin());return this._updatePositionStrategy(t),t}_getOrigin(){return this.origin instanceof Kt?this.origin.elementRef:this.origin}_getOriginElement(){return this.origin instanceof Kt?this.origin.elementRef.nativeElement:this.origin instanceof st$2?this.origin.nativeElement:typeof Element<`u`&&this.origin instanceof Element?this.origin:null}_getWidth(){return this.width?this.width:this.matchWidth?this._getOriginElement()?.getBoundingClientRect?.().width:void 0}attachOverlay(){this._overlayRef||this._createOverlay();let t=this._overlayRef;t.getConfig().hasBackdrop=this.hasBackdrop,t.updateSize({width:this._getWidth()}),t.hasAttached()||t.attach(this._templatePortal),this.hasBackdrop?this._backdropSubscription=t.backdropClick().subscribe(n=>this.backdropClick.emit(n)):this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this.positionChange.observers.length>0&&(this._positionSubscription=this._position.positionChanges.pipe(UE(()=>this.positionChange.observers.length>0)).subscribe(n=>{this._ngZone.run(()=>this.positionChange.emit(n)),this.positionChange.observers.length===0&&this._positionSubscription.unsubscribe()})),this.open=!0}detachOverlay(){this._overlayRef?.detach(),this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this.open=!1}_assignConfig(t){this.origin=t.origin??this.origin,this.positions=t.positions??this.positions,this.positionStrategy=t.positionStrategy??this.positionStrategy,this.offsetX=t.offsetX??this.offsetX,this.offsetY=t.offsetY??this.offsetY,this.width=t.width??this.width,this.height=t.height??this.height,this.minWidth=t.minWidth??this.minWidth,this.minHeight=t.minHeight??this.minHeight,this.backdropClass=t.backdropClass??this.backdropClass,this.panelClass=t.panelClass??this.panelClass,this.viewportMargin=t.viewportMargin??this.viewportMargin,this.scrollStrategy=t.scrollStrategy??this.scrollStrategy,this.disableClose=t.disableClose??this.disableClose,this.transformOriginSelector=t.transformOriginSelector??this.transformOriginSelector,this.hasBackdrop=t.hasBackdrop??this.hasBackdrop,this.lockPosition=t.lockPosition??this.lockPosition,this.flexibleDimensions=t.flexibleDimensions??this.flexibleDimensions,this.growAfterOpen=t.growAfterOpen??this.growAfterOpen,this.push=t.push??this.push,this.disposeOnNavigation=t.disposeOnNavigation??this.disposeOnNavigation,this.usePopover=t.usePopover??this.usePopover,this.matchWidth=t.matchWidth??this.matchWidth}static ɵfac=function(n){return new(n||i)};static ɵdir=ct$2({type:i,selectors:[[``,`cdk-connected-overlay`,``],[``,`connected-overlay`,``],[``,`cdkConnectedOverlay`,``]],inputs:{origin:[0,`cdkConnectedOverlayOrigin`,`origin`],positions:[0,`cdkConnectedOverlayPositions`,`positions`],positionStrategy:[0,`cdkConnectedOverlayPositionStrategy`,`positionStrategy`],offsetX:[0,`cdkConnectedOverlayOffsetX`,`offsetX`],offsetY:[0,`cdkConnectedOverlayOffsetY`,`offsetY`],width:[0,`cdkConnectedOverlayWidth`,`width`],height:[0,`cdkConnectedOverlayHeight`,`height`],minWidth:[0,`cdkConnectedOverlayMinWidth`,`minWidth`],minHeight:[0,`cdkConnectedOverlayMinHeight`,`minHeight`],backdropClass:[0,`cdkConnectedOverlayBackdropClass`,`backdropClass`],panelClass:[0,`cdkConnectedOverlayPanelClass`,`panelClass`],viewportMargin:[0,`cdkConnectedOverlayViewportMargin`,`viewportMargin`],scrollStrategy:[0,`cdkConnectedOverlayScrollStrategy`,`scrollStrategy`],open:[0,`cdkConnectedOverlayOpen`,`open`],disableClose:[0,`cdkConnectedOverlayDisableClose`,`disableClose`],transformOriginSelector:[0,`cdkConnectedOverlayTransformOriginOn`,`transformOriginSelector`],hasBackdrop:[2,`cdkConnectedOverlayHasBackdrop`,`hasBackdrop`,zr],lockPosition:[2,`cdkConnectedOverlayLockPosition`,`lockPosition`,zr],flexibleDimensions:[2,`cdkConnectedOverlayFlexibleDimensions`,`flexibleDimensions`,zr],growAfterOpen:[2,`cdkConnectedOverlayGrowAfterOpen`,`growAfterOpen`,zr],push:[2,`cdkConnectedOverlayPush`,`push`,zr],disposeOnNavigation:[2,`cdkConnectedOverlayDisposeOnNavigation`,`disposeOnNavigation`,zr],usePopover:[0,`cdkConnectedOverlayUsePopover`,`usePopover`],matchWidth:[2,`cdkConnectedOverlayMatchWidth`,`matchWidth`,zr],_config:[0,`cdkConnectedOverlay`,`_config`]},outputs:{backdropClick:`backdropClick`,positionChange:`positionChange`,attach:`attach`,detach:`detach`,overlayKeydown:`overlayKeydown`,overlayOutsideClick:`overlayOutsideClick`},exportAs:[`cdkConnectedOverlay`],features:[dn$1]})}return i})();var wn=(()=>{class i{static ɵfac=function(n){return new(n||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({providers:[Ke$2],imports:[sD,Me$1,Xt,Xt]})}return i})();function ze(i,a){}var g=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;positionStrategy;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;closeOnNavigation=!0;closeOnDestroy=!0;closeOnOverlayDetachments=!0;disableAnimations=!1;providers;container;templateContext;bindings};var K=(()=>{class i extends yt{_elementRef=p(st$2);_focusTrapFactory=p(yt$1);_config;_interactivityChecker=p(dt$2);_ngZone=p(le);_focusMonitor=p(rt$2);_renderer=p(Qn);_changeDetectorRef=p($r);_injector=p(me);_platform=p(l);_document=p(z$1);_portalOutlet;_focusTrapped=new Y;_focusTrap=null;_elementFocusedBeforeDialogWasOpened=null;_closeInteractionType=null;_ariaLabelledByQueue=[];_isDestroyed=!1;constructor(){super(),this._config=p(g,{optional:!0})||new g,this._config.ariaLabelledBy&&this._ariaLabelledByQueue.push(this._config.ariaLabelledBy)}_addAriaLabelledBy(e){this._ariaLabelledByQueue.push(e),this._changeDetectorRef.markForCheck()}_removeAriaLabelledBy(e){let t=this._ariaLabelledByQueue.indexOf(e);t>-1&&(this._ariaLabelledByQueue.splice(t,1),this._changeDetectorRef.markForCheck())}_contentAttached(){this._initializeFocusTrap(),this._captureInitialFocus()}_captureInitialFocus(){this._trapFocus()}ngOnDestroy(){this._focusTrapped.complete(),this._isDestroyed=!0,this._restoreFocus()}attachComponentPortal(e){this._portalOutlet.hasAttached();let t=this._portalOutlet.attachComponentPortal(e);return this._contentAttached(),t}attachTemplatePortal(e){this._portalOutlet.hasAttached();let t=this._portalOutlet.attachTemplatePortal(e);return this._contentAttached(),t}attachDomPortal=e=>{this._portalOutlet.hasAttached();let t=this._portalOutlet.attachDomPortal(e);return this._contentAttached(),t};_recaptureFocus(){this._containsFocus()||this._trapFocus()}_forceFocus(e,t){this._interactivityChecker.isFocusable(e)||(e.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let n=()=>{o(),l(),e.removeAttribute(`tabindex`)},o=this._renderer.listen(e,`blur`,n),l=this._renderer.listen(e,`mousedown`,n)})),e.focus(t)}_focusByCssSelector(e,t){let n=this._elementRef.nativeElement.querySelector(e);n&&this._forceFocus(n,t)}_trapFocus(e){this._isDestroyed||La(()=>{let t=this._elementRef.nativeElement;switch(this._config.autoFocus){case!1:case`dialog`:this._containsFocus()||t.focus(e);break;case!0:case`first-tabbable`:this._focusTrap?.focusInitialElement(e)||this._focusDialogContainer(e);break;case`first-heading`:this._focusByCssSelector(`h1, h2, h3, h4, h5, h6, [role="heading"]`,e);break;default:this._focusByCssSelector(this._config.autoFocus,e);break}this._focusTrapped.next()},{injector:this._injector})}_restoreFocus(){let e=this._config.restoreFocus,t=null;if(typeof e==`string`?t=this._document.querySelector(e):typeof e==`boolean`?t=e?this._elementFocusedBeforeDialogWasOpened:null:e&&(t=e),this._config.restoreFocus&&t&&typeof t.focus==`function`){let n=st$3(),o=this._elementRef.nativeElement;(!n||n===this._document.body||n===o||o.contains(n))&&(this._focusMonitor?(this._focusMonitor.focusVia(t,this._closeInteractionType),this._closeInteractionType=null):t.focus())}this._focusTrap&&this._focusTrap.destroy()}_focusDialogContainer(e){this._elementRef.nativeElement.focus?.(e)}_containsFocus(){let e=this._elementRef.nativeElement,t=st$3();return e===t||e.contains(t)}_initializeFocusTrap(){this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._document&&(this._elementFocusedBeforeDialogWasOpened=st$3()))}static ɵfac=function(t){return new(t||i)};static ɵcmp=nr({type:i,selectors:[[`cdk-dialog-container`]],viewQuery:function(t,n){if(t&1&&zv(oo,7),t&2){let o;Yd(o=Qd())&&(n._portalOutlet=o.first)}},hostAttrs:[`tabindex`,`-1`,1,`cdk-dialog-container`],hostVars:6,hostBindings:function(t,n){t&2&&rr(`id`,n._config.id||null)(`role`,n._config.role)(`aria-modal`,n._config.ariaModal)(`aria-labelledby`,n._config.ariaLabel?null:n._ariaLabelledByQueue[0])(`aria-label`,n._config.ariaLabel)(`aria-describedby`,n._config.ariaDescribedBy||null)},features:[Av],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(t,n){t&1&&Ov(0,ze,0,0,`ng-template`,0)},dependencies:[oo],styles:[`.cdk-dialog-container {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  max-height: inherit;
}
`],encapsulation:2,changeDetection:1})}return i})();var S=class{overlayRef;config;componentInstance=null;componentRef=null;containerInstance;disableClose;closed=new Y;backdropClick;keydownEvents;outsidePointerEvents;id;_detachSubscription;constructor(a,e){this.overlayRef=a,this.config=e,this.disableClose=e.disableClose,this.backdropClick=a.backdropClick(),this.keydownEvents=a.keydownEvents(),this.outsidePointerEvents=a.outsidePointerEvents(),this.id=e.id,this.keydownEvents.subscribe(t=>{t.keyCode===27&&!this.disableClose&&!Fe$2(t)&&(t.preventDefault(),this.close(void 0,{focusOrigin:`keyboard`}))}),this.backdropClick.subscribe(()=>{!this.disableClose&&this._canClose()?this.close(void 0,{focusOrigin:`mouse`}):this.containerInstance._recaptureFocus?.()}),this._detachSubscription=a.detachments().subscribe(()=>{e.closeOnOverlayDetachments!==!1&&this.close()})}close(a,e){if(this._canClose(a)){let t=this.closed;this.containerInstance._closeInteractionType=e?.focusOrigin||`program`,this._detachSubscription.unsubscribe(),this.overlayRef.dispose(),t.next(a),t.complete(),this.componentInstance=this.containerInstance=null}}updatePosition(){return this.overlayRef.updatePosition(),this}updateSize(a=``,e=``){return this.overlayRef.updateSize({width:a,height:e}),this}addPanelClass(a){return this.overlayRef.addPanelClass(a),this}removePanelClass(a){return this.overlayRef.removePanelClass(a),this}_canClose(a){let e=this.config;return!!this.containerInstance&&(!e.closePredicate||e.closePredicate(a,e,this.componentInstance))}};var He=new y$1(`DialogScrollStrategy`,{providedIn:`root`,factory:()=>{let i=p(me);return()=>Le$1(i)}});var Ge$1=new y$1(`DialogData`);var We=new y$1(`DefaultDialogConfig`);function Qe$1(i){let a=K$1(i),e=new ue;return{valueSignal:a,get value(){return a()},change:e,ngOnDestroy(){e.complete()}}}var X=(()=>{class i{_injector=p(me);_defaultOptions=p(We,{optional:!0});_parentDialog=p(i,{optional:!0,skipSelf:!0});_overlayContainer=p(Ze$2);_idGenerator=p(X$1);_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new Y;_afterOpenedAtThisLevel=new Y;_ariaHiddenElements=new Map;_scrollStrategy=p(He);get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}afterAllClosed=vo(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(eu(void 0)));open(e,t){t=m$2(m$2({},this._defaultOptions||new g),t),t.id=t.id||this._idGenerator.getId(`cdk-dialog-`),t.id&&this.getDialogById(t.id);let o=this._getOverlayConfig(t),l=ee$1(this._injector,o),r=new S(l,t),d=this._attachContainer(l,r,t);if(r.containerInstance=d,!this.openDialogs.length){let H=this._overlayContainer.getContainerElement();d._focusTrapped?d._focusTrapped.pipe(Ke$3(1)).subscribe(()=>{this._hideNonDialogContentFromAssistiveTechnology(H)}):this._hideNonDialogContentFromAssistiveTechnology(H)}return this._attachDialogContent(e,r,d,t),this.openDialogs.push(r),r.closed.subscribe(()=>this._removeOpenDialog(r,!0)),this.afterOpened.next(r),r}closeAll(){$(this.openDialogs,e=>e.close())}getDialogById(e){return this.openDialogs.find(t=>t.id===e)}ngOnDestroy(){$(this._openDialogsAtThisLevel,e=>{e.config.closeOnDestroy===!1&&this._removeOpenDialog(e,!1)}),$(this._openDialogsAtThisLevel,e=>e.close()),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete(),this._openDialogsAtThisLevel=[]}_getOverlayConfig(e){let t=new ht({positionStrategy:e.positionStrategy||Ge$2().centerHorizontally().centerVertically(),scrollStrategy:e.scrollStrategy||this._scrollStrategy(),panelClass:e.panelClass,hasBackdrop:e.hasBackdrop,direction:e.direction,minWidth:e.minWidth,minHeight:e.minHeight,maxWidth:e.maxWidth,maxHeight:e.maxHeight,width:e.width,height:e.height,disposeOnNavigation:e.closeOnNavigation,disableAnimations:e.disableAnimations});return e.backdropClass&&(t.backdropClass=e.backdropClass),t}_attachContainer(e,t,n){let o=n.injector||n.viewContainerRef?.injector,l=[{provide:g,useValue:n},{provide:S,useValue:t},{provide:kt,useValue:e}],r;n.container?typeof n.container==`function`?r=n.container:(r=n.container.type,l.push(...n.container.providers(n))):r=K;let d=new Ut(r,n.viewContainerRef,me.create({parent:o||this._injector,providers:l}));return e.attach(d).instance}_attachDialogContent(e,t,n,o){if(e instanceof ln$1){let l=this._createInjector(o,t,n,void 0),r={$implicit:o.data,dialogRef:t};o.templateContext&&(r=m$2(m$2({},r),typeof o.templateContext==`function`?o.templateContext():o.templateContext)),n.attachTemplatePortal(new dt$1(e,null,r,l))}else{let l=this._createInjector(o,t,n,this._injector),r=n.attachComponentPortal(new Ut(e,o.viewContainerRef,l,null,o.bindings));t.componentRef=r,t.componentInstance=r.instance}}_createInjector(e,t,n,o){let l=e.injector||e.viewContainerRef?.injector,r=[{provide:Ge$1,useValue:e.data},{provide:S,useValue:t}];return e.providers&&(typeof e.providers==`function`?r.push(...e.providers(t,e,n)):r.push(...e.providers)),e.direction&&(!l||!l.get(kM,null,{optional:!0}))&&r.push({provide:kM,useValue:Qe$1(e.direction)}),me.create({parent:l||o,providers:r})}_removeOpenDialog(e,t){let n=this.openDialogs.indexOf(e);n>-1&&(this.openDialogs.splice(n,1),this.openDialogs.length||(this._ariaHiddenElements.forEach((o,l)=>{o?l.setAttribute(`aria-hidden`,o):l.removeAttribute(`aria-hidden`)}),this._ariaHiddenElements.clear(),t&&this._getAfterAllClosed().next()))}_hideNonDialogContentFromAssistiveTechnology(e){if(e.parentElement){let t=e.parentElement.children;for(let n=t.length-1;n>-1;n--){let o=t[n];o!==e&&o.nodeName!==`SCRIPT`&&o.nodeName!==`STYLE`&&!o.hasAttribute(`aria-live`)&&!o.hasAttribute(`popover`)&&(this._ariaHiddenElements.set(o,o.getAttribute(`aria-hidden`)),o.setAttribute(`aria-hidden`,`true`))}}}_getAfterAllClosed(){let e=this._parentDialog;return e?e._getAfterAllClosed():this._afterAllClosedAtThisLevel}static ɵfac=function(t){return new(t||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();function $(i,a){let e=i.length;for(;e--;)a(i[e])}var Fe=(()=>{class i{static ɵfac=function(t){return new(t||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({providers:[X],imports:[wn,Me$1,It$1,Me$1]})}return i})();function qe$1(i,a){}var z=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;position;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;delayFocusTrap=!0;scrollStrategy;closeOnNavigation=!0;enterAnimationDuration;exitAnimationDuration;bindings};var J$1=`mdc-dialog--open`;var Ne=`mdc-dialog--opening`;var Le=`mdc-dialog--closing`;var Ue=150;var Ye$1=75;var Ze$1=(()=>{class i extends K{_animationStateChanged=new ue;_animationsEnabled=!ji();_actionSectionCount=0;_hostElement=this._elementRef.nativeElement;_enterAnimationDuration=this._animationsEnabled?Pe(this._config.enterAnimationDuration)??Ue:0;_exitAnimationDuration=this._animationsEnabled?Pe(this._config.exitAnimationDuration)??Ye$1:0;_animationTimer=null;_contentAttached(){super._contentAttached(),this._startOpenAnimation()}_startOpenAnimation(){this._animationStateChanged.emit({state:`opening`,totalTime:this._enterAnimationDuration}),this._animationsEnabled?(this._hostElement.style.setProperty(Re,`${this._enterAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(Ne,J$1)),this._waitForAnimationToComplete(this._enterAnimationDuration,this._finishDialogOpen)):(this._hostElement.classList.add(J$1),Promise.resolve().then(()=>this._finishDialogOpen()))}_startExitAnimation(){this._animationStateChanged.emit({state:`closing`,totalTime:this._exitAnimationDuration}),this._hostElement.classList.remove(J$1),this._animationsEnabled?(this._hostElement.style.setProperty(Re,`${this._exitAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(Le)),this._waitForAnimationToComplete(this._exitAnimationDuration,this._finishDialogClose)):Promise.resolve().then(()=>this._finishDialogClose())}_updateActionSectionCount(e){this._actionSectionCount+=e,this._changeDetectorRef.markForCheck()}_finishDialogOpen=()=>{this._clearAnimationClasses(),this._openAnimationDone(this._enterAnimationDuration)};_finishDialogClose=()=>{this._clearAnimationClasses(),this._animationStateChanged.emit({state:`closed`,totalTime:this._exitAnimationDuration})};_clearAnimationClasses(){this._hostElement.classList.remove(Ne,Le)}_waitForAnimationToComplete(e,t){this._animationTimer!==null&&clearTimeout(this._animationTimer),this._animationTimer=setTimeout(t,e)}_requestAnimationFrame(e){this._ngZone.runOutsideAngular(()=>{typeof requestAnimationFrame==`function`?requestAnimationFrame(e):e()})}_captureInitialFocus(){this._config.delayFocusTrap||this._trapFocus()}_openAnimationDone(e){this._config.delayFocusTrap&&this._trapFocus(),this._animationStateChanged.next({state:`opened`,totalTime:e})}ngOnDestroy(){super.ngOnDestroy(),this._animationTimer!==null&&clearTimeout(this._animationTimer)}attachComponentPortal(e){let t=super.attachComponentPortal(e);return t.location.nativeElement.classList.add(`mat-mdc-dialog-component-host`),t}static ɵfac=(()=>{let e;return function(n){return(e||(e=Yg(i)))(n||i)}})();static ɵcmp=nr({type:i,selectors:[[`mat-dialog-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-mdc-dialog-container`,`mdc-dialog`],hostVars:10,hostBindings:function(t,n){t&2&&(Bv(`id`,n._config.id),rr(`aria-modal`,n._config.ariaModal)(`role`,n._config.role)(`aria-labelledby`,n._config.ariaLabel?null:n._ariaLabelledByQueue[0])(`aria-label`,n._config.ariaLabel)(`aria-describedby`,n._config.ariaDescribedBy||null),Ya(`_mat-animation-noopable`,!n._animationsEnabled)(`mat-mdc-dialog-container-with-actions`,n._actionSectionCount>0))},features:[Av],decls:3,vars:0,consts:[[1,`mat-mdc-dialog-inner-container`,`mdc-dialog__container`],[1,`mat-mdc-dialog-surface`,`mdc-dialog__surface`],[`cdkPortalOutlet`,``]],template:function(t,n){t&1&&(Ra(0,`div`,0)(1,`div`,1),Ov(2,qe$1,0,0,`ng-template`,2),Hd()())},dependencies:[oo],styles:[`.mat-mdc-dialog-container {
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
  outline: 0;
}

.cdk-overlay-pane.mat-mdc-dialog-panel {
  max-width: var(--%NS%mat-dialog-container-max-width, 560px);
  min-width: var(--%NS%mat-dialog-container-min-width, 280px);
}
@media (max-width: 599px) {
  .cdk-overlay-pane.mat-mdc-dialog-panel {
    max-width: var(--%NS%mat-dialog-container-small-max-width, calc(100vw - 32px));
  }
}

.mat-mdc-dialog-inner-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
  height: 100%;
  opacity: 0;
  transition: opacity linear var(--%NS%mat-dialog-transition-duration, 0ms);
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
}
.mdc-dialog--closing .mat-mdc-dialog-inner-container {
  transition: opacity 75ms linear;
  transform: none;
}
.mdc-dialog--open .mat-mdc-dialog-inner-container {
  opacity: 1;
}
._mat-animation-noopable .mat-mdc-dialog-inner-container {
  transition: none;
}

.mat-mdc-dialog-surface {
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
  outline: 0;
  transform: scale(0.8);
  transition: transform var(--%NS%mat-dialog-transition-duration, 0ms) cubic-bezier(0, 0, 0.2, 1);
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
  box-shadow: var(--%NS%mat-dialog-container-elevation-shadow, none);
  border-radius: var(--%NS%mat-dialog-container-shape, var(--%NS%mat-sys-corner-extra-large, 4px));
  background-color: var(--%NS%mat-dialog-container-color, var(--%NS%mat-sys-surface, white));
}
[dir=rtl] .mat-mdc-dialog-surface {
  text-align: right;
}
.mdc-dialog--open .mat-mdc-dialog-surface, .mdc-dialog--closing .mat-mdc-dialog-surface {
  transform: none;
}
._mat-animation-noopable .mat-mdc-dialog-surface {
  transition: none;
}
.mat-mdc-dialog-surface::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 2px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}

.mat-mdc-dialog-title {
  display: block;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  margin: 0 0 1px;
  padding: var(--%NS%mat-dialog-headline-padding, 6px 24px 13px);
}
.mat-mdc-dialog-title::before {
  display: inline-block;
  width: 0;
  height: 40px;
  content: "";
  vertical-align: 0;
}
[dir=rtl] .mat-mdc-dialog-title {
  text-align: right;
}
.mat-mdc-dialog-container .mat-mdc-dialog-title {
  color: var(--%NS%mat-dialog-subhead-color, var(--%NS%mat-sys-on-surface, rgba(0, 0, 0, 0.87)));
  font-family: var(--%NS%mat-dialog-subhead-font, var(--%NS%mat-sys-headline-small-font, inherit));
  line-height: var(--%NS%mat-dialog-subhead-line-height, var(--%NS%mat-sys-headline-small-line-height, 1.5rem));
  font-size: var(--%NS%mat-dialog-subhead-size, var(--%NS%mat-sys-headline-small-size, 1rem));
  font-weight: var(--%NS%mat-dialog-subhead-weight, var(--%NS%mat-sys-headline-small-weight, 400));
  letter-spacing: var(--%NS%mat-dialog-subhead-tracking, var(--%NS%mat-sys-headline-small-tracking, 0.03125em));
}

.mat-mdc-dialog-content {
  display: block;
  flex-grow: 1;
  box-sizing: border-box;
  margin: 0;
  overflow: auto;
  max-height: 65vh;
}
.mat-mdc-dialog-content > :first-child {
  margin-top: 0;
}
.mat-mdc-dialog-content > :last-child {
  margin-bottom: 0;
}
.mat-mdc-dialog-container .mat-mdc-dialog-content {
  color: var(--%NS%mat-dialog-supporting-text-color, var(--%NS%mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6)));
  font-family: var(--%NS%mat-dialog-supporting-text-font, var(--%NS%mat-sys-body-medium-font, inherit));
  line-height: var(--%NS%mat-dialog-supporting-text-line-height, var(--%NS%mat-sys-body-medium-line-height, 1.5rem));
  font-size: var(--%NS%mat-dialog-supporting-text-size, var(--%NS%mat-sys-body-medium-size, 1rem));
  font-weight: var(--%NS%mat-dialog-supporting-text-weight, var(--%NS%mat-sys-body-medium-weight, 400));
  letter-spacing: var(--%NS%mat-dialog-supporting-text-tracking, var(--%NS%mat-sys-body-medium-tracking, 0.03125em));
}
.mat-mdc-dialog-container .mat-mdc-dialog-content {
  padding: var(--%NS%mat-dialog-content-padding, 20px 24px);
}
.mat-mdc-dialog-container-with-actions .mat-mdc-dialog-content {
  padding: var(--%NS%mat-dialog-with-actions-content-padding, 20px 24px 0);
}
.mat-mdc-dialog-container .mat-mdc-dialog-title + .mat-mdc-dialog-content {
  padding-top: 0;
}

.mat-mdc-dialog-actions {
  display: flex;
  position: relative;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;
  min-height: 52px;
  margin: 0;
  border-top: 1px solid transparent;
  padding: var(--%NS%mat-dialog-actions-padding, 16px 24px);
  justify-content: var(--%NS%mat-dialog-actions-alignment, flex-end);
}
@media (forced-colors: active) {
  .mat-mdc-dialog-actions {
    border-top-color: CanvasText;
  }
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-start, .mat-mdc-dialog-actions[align=start] {
  justify-content: start;
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-center, .mat-mdc-dialog-actions[align=center] {
  justify-content: center;
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-end, .mat-mdc-dialog-actions[align=end] {
  justify-content: flex-end;
}
.mat-mdc-dialog-actions .mat-button-base + .mat-button-base,
.mat-mdc-dialog-actions .mat-mdc-button-base + .mat-mdc-button-base {
  margin-left: 8px;
}
[dir=rtl] .mat-mdc-dialog-actions .mat-button-base + .mat-button-base,
[dir=rtl] .mat-mdc-dialog-actions .mat-mdc-button-base + .mat-mdc-button-base {
  margin-left: 0;
  margin-right: 8px;
}

.mat-mdc-dialog-component-host {
  display: contents;
}
`],encapsulation:2,changeDetection:1})}return i})();var Re=`--mat-dialog-transition-duration`;function Pe(i){return i==null?null:typeof i==`number`?i:i.endsWith(`ms`)?nt$1(i.substring(0,i.length-2)):i.endsWith(`s`)?nt$1(i.substring(0,i.length-1))*1e3:i===`0`?0:null}var V=(function(i){return i[i.OPEN=0]=`OPEN`,i[i.CLOSING=1]=`CLOSING`,i[i.CLOSED=2]=`CLOSED`,i})(V||{});var T=class{_ref;_config;_containerInstance;componentInstance;componentRef=null;disableClose;id;_afterOpened=new ho(1);_beforeClosed=new ho(1);_result;_closeFallbackTimeout;_state=V.OPEN;_closeInteractionType;constructor(a,e,t){this._ref=a,this._config=e,this._containerInstance=t,this.disableClose=e.disableClose,this.id=a.id,a.addPanelClass(`mat-mdc-dialog-panel`),t._animationStateChanged.pipe(Te$1(n=>n.state===`opened`),Ke$3(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),t._animationStateChanged.pipe(Te$1(n=>n.state===`closed`),Ke$3(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._finishDialogClose()}),a.overlayRef.detachments().subscribe(()=>{this._beforeClosed.next(this._result),this._beforeClosed.complete(),this._finishDialogClose()}),NE(this.backdropClick(),this.keydownEvents().pipe(Te$1(n=>n.keyCode===27&&!this.disableClose&&!Fe$2(n)))).subscribe(n=>{this.disableClose||(n.preventDefault(),Me(this,n.type===`keydown`?`keyboard`:`mouse`))})}close(a){let e=this._config.closePredicate;e&&!e(a,this._config,this.componentInstance)||(this._result=a,this._containerInstance._animationStateChanged.pipe(Te$1(t=>t.state===`closing`),Ke$3(1)).subscribe(t=>{this._beforeClosed.next(a),this._beforeClosed.complete(),this._ref.overlayRef.detachBackdrop(),this._closeFallbackTimeout=setTimeout(()=>this._finishDialogClose(),t.totalTime+100)}),this._state=V.CLOSING,this._containerInstance._startExitAnimation())}afterOpened(){return this._afterOpened}afterClosed(){return this._ref.closed}beforeClosed(){return this._beforeClosed}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}updatePosition(a){let e=this._ref.config.positionStrategy;return a&&(a.left||a.right)?a.left?e.left(a.left):e.right(a.right):e.centerHorizontally(),a&&(a.top||a.bottom)?a.top?e.top(a.top):e.bottom(a.bottom):e.centerVertically(),this._ref.updatePosition(),this}updateSize(a=``,e=``){return this._ref.updateSize(a,e),this}addPanelClass(a){return this._ref.addPanelClass(a),this}removePanelClass(a){return this._ref.removePanelClass(a),this}getState(){return this._state}_finishDialogClose(){this._state=V.CLOSED,this._ref.close(this._result,{focusOrigin:this._closeInteractionType}),this.componentInstance=null}};function Me(i,a,e){return i._closeInteractionType=a,i.close(e)}var $e$1=new y$1(`MatMdcDialogData`);var Ke$1=new y$1(`mat-mdc-dialog-default-options`);var Xe=new y$1(`mat-mdc-dialog-scroll-strategy`,{providedIn:`root`,factory:()=>{let i=p(me);return()=>Le$1(i)}});var ee=(()=>{class i{_defaultOptions=p(Ke$1,{optional:!0});_scrollStrategy=p(Xe);_parentDialog=p(i,{optional:!0,skipSelf:!0});_idGenerator=p(X$1);_injector=p(me);_dialog=p(X);_animationsDisabled=ji();_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new Y;_afterOpenedAtThisLevel=new Y;dialogConfigClass=z;_dialogRefConstructor;_dialogContainerType;_dialogDataToken;get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}_getAfterAllClosed(){let e=this._parentDialog;return e?e._getAfterAllClosed():this._afterAllClosedAtThisLevel}afterAllClosed=vo(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(eu(void 0)));constructor(){this._dialogRefConstructor=T,this._dialogContainerType=Ze$1,this._dialogDataToken=$e$1}open(e,t){let n;t=m$2(m$2({},this._defaultOptions||new z),t),t.id=t.id||this._idGenerator.getId(`mat-mdc-dialog-`),t.scrollStrategy=t.scrollStrategy||this._scrollStrategy();let o=this._dialog.open(e,L$2(m$2({},t),{positionStrategy:Ge$2(this._injector).centerHorizontally().centerVertically(),disableClose:!0,closePredicate:void 0,closeOnDestroy:!1,closeOnOverlayDetachments:!1,disableAnimations:this._animationsDisabled||t.enterAnimationDuration?.toLocaleString()===`0`||t.exitAnimationDuration?.toString()===`0`,container:{type:this._dialogContainerType,providers:()=>[{provide:this.dialogConfigClass,useValue:t},{provide:g,useValue:t}]},templateContext:()=>({dialogRef:n}),providers:(l,r,d)=>(n=new this._dialogRefConstructor(l,t,d),n.updatePosition(t?.position),[{provide:this._dialogContainerType,useValue:d},{provide:this._dialogDataToken,useValue:r.data},{provide:this._dialogRefConstructor,useValue:n}])}));return n.componentRef=o.componentRef,n.componentInstance=o.componentInstance,this.openDialogs.push(n),this.afterOpened.next(n),n.afterClosed().subscribe(()=>{let l=this.openDialogs.indexOf(n);l>-1&&(this.openDialogs.splice(l,1),this.openDialogs.length||this._getAfterAllClosed().next())}),n}closeAll(){this._closeDialogs(this.openDialogs)}getDialogById(e){return this.openDialogs.find(t=>t.id===e)}ngOnDestroy(){this._closeDialogs(this._openDialogsAtThisLevel),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete()}_closeDialogs(e){let t=e.length;for(;t--;)e[t].close()}static ɵfac=function(t){return new(t||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();var Bt=(()=>{class i{dialogRef=p(T,{optional:!0});_elementRef=p(st$2);_dialog=p(ee);ariaLabel;type=`button`;dialogResult;_matDialogClose;ngOnInit(){this.dialogRef||(this.dialogRef=je(this._elementRef,this._dialog.openDialogs))}ngOnChanges(e){let t=e._matDialogClose;t&&(this.dialogResult=t.currentValue)}_onButtonClick(e){this._elementRef.nativeElement.getAttribute(`aria-disabled`)!==`true`&&Me(this.dialogRef,e.screenX===0&&e.screenY===0?`keyboard`:`mouse`,this.dialogResult)}static ɵfac=function(t){return new(t||i)};static ɵdir=ct$2({type:i,selectors:[[``,`mat-dialog-close`,``],[``,`matDialogClose`,``]],hostVars:2,hostBindings:function(t,n){t&1&&qa(`click`,function(l){return n._onButtonClick(l)}),t&2&&rr(`aria-label`,n.ariaLabel||null)(`type`,n.type)},inputs:{ariaLabel:[0,`aria-label`,`ariaLabel`],type:`type`,dialogResult:[0,`mat-dialog-close`,`dialogResult`],_matDialogClose:[0,`matDialogClose`,`_matDialogClose`]},exportAs:[`matDialogClose`],features:[dn$1]})}return i})();var Be=(()=>{class i{_dialogRef=p(T,{optional:!0});_elementRef=p(st$2);_dialog=p(ee);ngOnInit(){this._dialogRef||(this._dialogRef=je(this._elementRef,this._dialog.openDialogs)),this._dialogRef&&Promise.resolve().then(()=>{this._onAdd()})}ngOnDestroy(){this._dialogRef?._containerInstance&&Promise.resolve().then(()=>{this._onRemove()})}static ɵfac=function(t){return new(t||i)};static ɵdir=ct$2({type:i})}return i})();var jt=(()=>{class i extends Be{id=p(X$1).getId(`mat-mdc-dialog-title-`);_onAdd(){this._dialogRef._containerInstance?._addAriaLabelledBy?.(this.id)}_onRemove(){this._dialogRef?._containerInstance?._removeAriaLabelledBy?.(this.id)}static ɵfac=(()=>{let e;return function(n){return(e||(e=Yg(i)))(n||i)}})();static ɵdir=ct$2({type:i,selectors:[[``,`mat-dialog-title`,``],[``,`matDialogTitle`,``]],hostAttrs:[1,`mat-mdc-dialog-title`,`mdc-dialog__title`],hostVars:1,hostBindings:function(t,n){t&2&&Bv(`id`,n.id)},inputs:{id:`id`},exportAs:[`matDialogTitle`],features:[Av]})}return i})();var Vt=(()=>{class i{static ɵfac=function(t){return new(t||i)};static ɵdir=ct$2({type:i,selectors:[[``,`mat-dialog-content`,``],[`mat-dialog-content`],[``,`matDialogContent`,``]],hostAttrs:[1,`mat-mdc-dialog-content`,`mdc-dialog__content`],features:[Ib([fn])]})}return i})();var zt=(()=>{class i extends Be{align;_onAdd(){this._dialogRef._containerInstance?._updateActionSectionCount?.(1)}_onRemove(){this._dialogRef._containerInstance?._updateActionSectionCount?.(-1)}static ɵfac=(()=>{let e;return function(n){return(e||(e=Yg(i)))(n||i)}})();static ɵdir=ct$2({type:i,selectors:[[``,`mat-dialog-actions`,``],[`mat-dialog-actions`],[``,`matDialogActions`,``]],hostAttrs:[1,`mat-mdc-dialog-actions`,`mdc-dialog__actions`],hostVars:6,hostBindings:function(t,n){t&2&&Ya(`mat-mdc-dialog-actions-align-start`,n.align===`start`)(`mat-mdc-dialog-actions-align-center`,n.align===`center`)(`mat-mdc-dialog-actions-align-end`,n.align===`end`)},inputs:{align:`align`},features:[Av]})}return i})();function je(i,a){let e=i.nativeElement.parentElement;for(;e&&!e.classList.contains(`mat-mdc-dialog-container`);)e=e.parentElement;return e?a.find(t=>t.id===e.id):null}var Ht=(()=>{class i{static ɵfac=function(t){return new(t||i)};static ɵmod=wt$1({type:i});static ɵinj=Xe$2({providers:[ee],imports:[Fe,wn,Me$1,sD]})}return i})();var ie=`Service workers are disabled or not supported by this browser`;var A=class{serviceWorker;worker;registration;events;constructor(n,t){if(this.serviceWorker=n,!n)this.worker=this.events=this.registration=new N(o=>o.error(new v(5601,!1)));else{let o=null,i=new Y;this.worker=new N(g=>(o!==null&&g.next(o),i.subscribe(j=>g.next(j))));let l=()=>{let{controller:g}=n;g!==null&&(o=g,i.next(o))};n.addEventListener(`controllerchange`,l),l(),this.registration=this.worker.pipe(Le$2(()=>n.getRegistration().then(g=>{if(!g)throw new v(5601,!1);return g})));let d=new Y;this.events=d.asObservable();let x=g=>{let{data:j}=g;j?.type&&d.next(j)};n.addEventListener(`message`,x),t?.get(Ft,null,{optional:!0})?.onDestroy(()=>{n.removeEventListener(`controllerchange`,l),n.removeEventListener(`message`,x)})}}postMessage(n,t){return new Promise(o=>{this.worker.pipe(Ke$3(1)).subscribe(i=>{i.postMessage(m$2({action:n},t)),o()})})}postMessageWithOperation(n,t,o){let i=this.waitForOperationCompleted(o),l=this.postMessage(n,t);return Promise.all([l,i]).then(([,d])=>d)}generateNonce(){return Math.round(Math.random()*1e7)}eventsOfType(n){let t;return typeof n==`string`?t=o=>o.type===n:t=o=>n.includes(o.type),this.events.pipe(Te$1(t))}nextEventOfType(n){return this.eventsOfType(n).pipe(Ke$3(1))}waitForOperationCompleted(n){return new Promise((t,o)=>{this.eventsOfType(`OPERATION_COMPLETED`).pipe(Te$1(i=>i.nonce===n),Ke$3(1),P(i=>{if(i.result!==void 0)return i.result;throw new Error(i.error)})).subscribe({next:t,error:o})})}get isEnabled(){return!!this.serviceWorker}};var tt=(()=>{class e{sw;messages;notificationClicks;notificationCloses;pushSubscriptionChanges;subscription;get isEnabled(){return this.sw.isEnabled}pushManager=null;subscriptionChanges=new Y;constructor(t){if(this.sw=t,!t.isEnabled){this.messages=RE,this.notificationClicks=RE,this.notificationCloses=RE,this.pushSubscriptionChanges=RE,this.subscription=RE;return}this.messages=this.sw.eventsOfType(`PUSH`).pipe(P(i=>i.data)),this.notificationClicks=this.sw.eventsOfType(`NOTIFICATION_CLICK`).pipe(P(i=>i.data)),this.notificationCloses=this.sw.eventsOfType(`NOTIFICATION_CLOSE`).pipe(P(i=>i.data)),this.pushSubscriptionChanges=this.sw.eventsOfType(`PUSH_SUBSCRIPTION_CHANGE`).pipe(P(i=>i.data)),this.pushManager=this.sw.registration.pipe(P(i=>i.pushManager));let o=this.pushManager.pipe(Le$2(i=>i.getSubscription()));this.subscription=new N(i=>{let l=o.subscribe(i),d=this.subscriptionChanges.subscribe(i);return()=>{l.unsubscribe(),d.unsubscribe()}})}requestSubscription(t){if(!this.sw.isEnabled||this.pushManager===null)return Promise.reject(new Error(ie));let o={userVisibleOnly:!0},i=this.decodeBase64(t.serverPublicKey.replace(/_/g,`/`).replace(/-/g,`+`)),l=new Uint8Array(new ArrayBuffer(i.length));for(let d=0;d<i.length;d++)l[d]=i.charCodeAt(d);return o.applicationServerKey=l,new Promise((d,x)=>{this.pushManager.pipe(Le$2(N=>N.subscribe(o)),Ke$3(1)).subscribe({next:N=>{this.subscriptionChanges.next(N),d(N)},error:x})})}unsubscribe(){if(!this.sw.isEnabled)return Promise.reject(new Error(ie));let t=o=>{if(o===null)throw new v(5602,!1);return o.unsubscribe().then(i=>{if(!i)throw new v(5603,!1);this.subscriptionChanges.next(null)})};return new Promise((o,i)=>{this.subscription.pipe(Ke$3(1),Le$2(t)).subscribe({next:o,error:i})})}decodeBase64(t){return atob(t)}static ɵfac=function(o){return new(o||e)(C(A))};static ɵprov=R$1({token:e,factory:e.ɵfac})}return e})();var nt=(()=>{class e{sw;versionUpdates;unrecoverable;get isEnabled(){return this.sw.isEnabled}ongoingCheckForUpdate=null;constructor(t){if(this.sw=t,!t.isEnabled){this.versionUpdates=RE,this.unrecoverable=RE;return}this.versionUpdates=this.sw.eventsOfType([`VERSION_DETECTED`,`VERSION_INSTALLATION_FAILED`,`VERSION_READY`,`NO_NEW_VERSION_DETECTED`]),this.unrecoverable=this.sw.eventsOfType(`UNRECOVERABLE_STATE`)}checkForUpdate(){if(!this.sw.isEnabled)return Promise.reject(new Error(ie));if(this.ongoingCheckForUpdate)return this.ongoingCheckForUpdate;let t=this.sw.generateNonce();return this.ongoingCheckForUpdate=this.sw.postMessageWithOperation(`CHECK_FOR_UPDATES`,{nonce:t},t).finally(()=>{this.ongoingCheckForUpdate=null}),this.ongoingCheckForUpdate}activateUpdate(){if(!this.sw.isEnabled)return Promise.reject(new v(5601,!1));let t=this.sw.generateNonce();return this.sw.postMessageWithOperation(`ACTIVATE_UPDATE`,{nonce:t},t)}static ɵfac=function(o){return new(o||e)(C(A))};static ɵprov=R$1({token:e,factory:e.ɵfac})}return e})();var $e=new y$1(``);function it(){let e=p(L);if(!(`serviceWorker`in navigator&&e.enabled!==!1))return;let n=p($e),t=p(le),o=p(Ft);t.runOutsideAngular(()=>{let i=navigator.serviceWorker,l=()=>i.controller?.postMessage({action:`INITIALIZE`});i.addEventListener(`controllerchange`,l),o.onDestroy(()=>{i.removeEventListener(`controllerchange`,l)})}),t.runOutsideAngular(()=>{let i,{registrationStrategy:l}=e;if(typeof l==`function`)i=new Promise(d=>l().subscribe(()=>d()));else{let[d,...x]=(l||`registerWhenStable:30000`).split(`:`);switch(d){case`registerImmediately`:i=Promise.resolve();break;case`registerWithDelay`:i=Ge(+x[0]||0);break;case`registerWhenStable`:i=Promise.race([o.whenStable(),Ge(+x[0])]);break;default:throw new v(5600,!1)}}i.then(()=>{o.destroyed||navigator.serviceWorker.register(n,{scope:e.scope,updateViaCache:e.updateViaCache,type:e.type}).catch(d=>console.error(gt(5604,!1)))})})}function Ge(e){return new Promise(n=>setTimeout(n,e))}function ot(){let e=p(L),n=p(me);return new A(e.enabled!==!1?navigator.serviceWorker:void 0,n)}var L=class{enabled;updateViaCache;type;scope;registrationStrategy};function Ke(e,n={}){return mt$2([tt,nt,{provide:$e,useValue:e},{provide:L,useValue:n},{provide:A,useFactory:ot},Nv(it)])}function Ye(...e){return async()=>{let n=p(m$4),t=p(dr);return await lE(T$1(n.initialized).pipe(Te$1(Boolean))),(e.length?n.hasAnyRole(e):n.isLoggedIn())||t.parseUrl(`/collection`)}}var Ze=async()=>{let e=p(m$4),n=p(dr);return await lE(T$1(e.initialized).pipe(Te$1(Boolean))),e.hasSession()||n.parseUrl(`/multiplayer`)};var qe=async()=>{let e=p(y),n=p(dr);await e.ready();let t=e.currentPhase();return t===`playing`?n.parseUrl(`/ranking/game`):t===`finished`?n.parseUrl(`/ranking/end-score`):!0};var Je=[{path:``,loadComponent:()=>import(`./chunk-WeqSAXnq.js`).then(e=>e.Home)},{path:`ranking`,canActivate:[qe],loadComponent:()=>import(`./chunk-BAlSW25J.js`).then(e=>e.GameSetup)},{path:`ranking/game`,loadComponent:()=>import(`./chunk-PKA_C-WY.js`).then(e=>e.Scoreboard)},{path:`ranking/end-score`,loadComponent:()=>import(`./chunk-C9kwpNKv.js`).then(e=>e.EndScore)},{path:`collection`,loadComponent:()=>import(`./chunk-B7RW-s-U.js`).then(e=>e.Collection)},{path:`collection/paddle-table`,loadComponent:()=>import(`./chunk-7hIjto0v.js`).then(e=>e.PaddleTable)},{path:`collection/arrival-planner`,loadComponent:()=>import(`./chunk-BwC3reag2.js`).then(e=>e.ArrivalPlanner)},{path:`multiplayer`,loadComponent:()=>import(`./chunk-B6O_lWvH.js`).then(e=>e.Multiplayer)},{path:`multiplayer/:lobbyId`,canActivate:[Ze],loadComponent:()=>import(`./chunk-fk46UZra.js`).then(e=>e.Lobby)},{path:`collection/f1-strategy`,loadComponent:()=>import(`./chunk-DMs3BaBj.js`).then(e=>e.F1Strategy)},{path:`collection/f1-strategy/:trackId`,loadComponent:()=>import(`./chunk-o18IOmLP.js`).then(e=>e.DetailedView)},{path:`collection/race-results`,canActivate:[Ye(`race_results`)],loadComponent:()=>import(`./chunk-CEFeNmJ-2.js`).then(e=>e.RaceResults)},{path:`profile`,loadComponent:()=>import(`./chunk-DIbVrio-.js`).then(e=>e.Profile)},{path:`profile/auth`,loadComponent:()=>import(`./chunk-O5zC54hA.js`).then(e=>e.Auth)},{path:`profile/password`,loadComponent:()=>import(`./chunk-n1XUFnen2.js`).then(e=>e.PasswordReset)},{path:`settings`,loadComponent:()=>import(`./chunk-DszOWziF.js`).then(e=>e.Settings)},{path:`legal/impressum`,loadComponent:()=>import(`./chunk-CbD1nKC1.js`).then(e=>e.Imprint)},{path:`legal/datenschutz`,loadComponent:()=>import(`./chunk-B7DN2-7P2.js`).then(e=>e.Privacy)},{path:`legal/nutzungsbedingungen`,loadComponent:()=>import(`./chunk-SUK7j65u.js`).then(e=>e.Terms)},{path:`legal/lizenzen`,loadComponent:()=>import(`./chunk-BqVycJpu.js`).then(e=>e.Licenses)},{path:`notifications`,loadComponent:()=>import(`./chunk-Dw1ouWBv2.js`).then(e=>e.Notifications)}];var Qe={providers:[bI(),{provide:we$1,useClass:S$1},Nv(()=>{p(oD).setDefaultFontSetClass(`material-icons-outlined`)}),yR(Je),{provide:Ke$1,useValue:{maxWidth:`92vw`,maxHeight:`90vh`}},Ke(`ngsw-worker.js`,{enabled:!LH(),registrationStrategy:`registerImmediately`})]};function rt(e,n){if(e&1&&(Ra(0,`p`,6),wT(1),Hd()),e&2){let t=Kb();jC(),ny(` und `,t.data.moreCount,` weitere wichtige `,t.data.moreCount===1?`Nachricht`:`Nachrichten`,` `)}}function at(e,n){if(e&1){let t=Yb();Ra(0,`button`,10),qa(`click`,function(){bp(t);return Tp(Kb().close(`all`))}),wT(1,`Alle ansehen`),Hd()}}var Z=class e{dialogRef=p(T);data=p($e$1);config=t(this.data.alert.type);close(n){this.dialogRef.close(n)}static ɵfac=function(t){return new(t||e)};static ɵcmp=nr({type:e,selectors:[[`app-system-alert-dialog`]],decls:16,vars:7,consts:[[1,`alert`],[`aria-hidden`,`true`,1,`alert-icon`],[1,`alert-kicker`],[`mat-dialog-title`,``],[`mat-dialog-content`,``],[1,`alert-message`],[1,`alert-more`],[`mat-dialog-actions`,``,`align`,`end`],[`mat-button`,``,`type`,`button`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`],[`mat-button`,``,`type`,`button`,3,`click`]],template:function(t,o){t&1&&(Ra(0,`div`,0)(1,`span`,1)(2,`mat-icon`),wT(3),Hd()(),Ra(4,`p`,2),wT(5),Hd(),Ra(6,`h2`,3),wT(7),Hd(),Ra(8,`div`,4)(9,`p`,5),wT(10),Hd(),jb(11,rt,2,2,`p`,6),Hd()(),Ra(12,`div`,7),jb(13,at,2,0,`button`,8),Ra(14,`button`,9),qa(`click`,function(){return o.close(`acknowledged`)}),wT(15,` Verstanden `),Hd()()),t&2&&(rr(`data-tone`,o.config.tone),jC(3),ty(o.config.icon),jC(2),ty(o.config.label),jC(2),ty(o.data.alert.title),jC(3),ty(o.data.alert.message),jC(),Ub(o.data.moreCount>0?11:-1),jC(2),Ub(o.data.moreCount>0?13:-1))},dependencies:[hi,di,Ht,jt,zt,Vt,t8,e8],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:360px}.alert[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;padding-top:20px;text-align:center}.alert-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--%NS%tone-soft);color:var(--%NS%tone)}.alert-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:28px;height:28px;font-size:28px}.alert-kicker[_ngcontent-%COMP%]{margin:12px 0 0;color:var(--%NS%tone);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.alert[_ngcontent-%COMP%]   [mat-dialog-title][_ngcontent-%COMP%]{padding-top:4px}.alert-message[_ngcontent-%COMP%]{margin:0;color:var(--%NS%color-text);font-size:14px;line-height:1.45;white-space:pre-line}.alert-more[_ngcontent-%COMP%]{margin:12px 0 0;color:var(--%NS%color-text-muted);font-size:12px}[mat-dialog-actions][_ngcontent-%COMP%]{gap:8px}`]})};var U=`/notifications`;var oe=`incoming-notification`;var q=class e{notificationsService=p(g$1);session=p(m$4);toastService=p(m$3);dialog=p(ee);router=p(dr);announcedUserId=null;liveBurst=0;constructor(){Gp(()=>{let n=this.notificationsService.loadedFor();!n||n===this.announcedUserId||(this.announcedUserId=n,W(()=>this.announceOnStart()))}),this.notificationsService.incoming.pipe(U$1()).subscribe(n=>this.announceLive(n))}announceOnStart(){if(this.onNotificationsPage())return;let n=this.notificationsService.notifications().filter(i=>!i.read_at),t$1=n.filter(i=>i.type===`system_alert`),o=n.filter(i=>i.type===`system_info`);if(t$1.length&&this.dialog.open(Z,{data:{alert:t$1[0],moreCount:t$1.length-1},width:`360px`}).afterClosed().subscribe(i=>{this.notificationsService.markRead(t$1.map(l=>l.id)),i===`all`&&this.router.navigateByUrl(U)}),o.length){let i=t(`system_info`),l=o.length===1;this.toastService.show({tone:i.tone,icon:i.icon,title:l?o[0].title:`${o.length} neue Systeminfos`,message:l?o[0].message:`Tippe, um sie anzusehen.`,link:U},6e3)}}announceLive(n){if(this.onNotificationsPage()||n.sender_id&&n.sender_id===this.session.user()?.id)return;this.liveBurst=this.toastService.isVisible(oe)?this.liveBurst+1:1;let t$2=t(n.type);this.toastService.show(this.liveBurst===1?{key:oe,tone:t$2.tone,icon:t$2.icon,title:n.title,message:n.message,link:U}:{key:oe,tone:`info`,icon:`notifications`,title:`${this.liveBurst} neue Benachrichtigungen`,message:`Tippe, um sie anzusehen.`,link:U})}onNotificationsPage(){return this.router.url.startsWith(U)}static ɵfac=function(t){return new(t||e)};static ɵprov=R$1({token:e,factory:e.ɵfac,providedIn:`root`})};var st=(e,n)=>n.id;function lt(e,n){if(e&1&&(Ra(0,`span`),wT(1),Hd()),e&2){let t=Kb().$implicit;jC(),ty(t.message)}}function ct(e,n){if(e&1){let t=Yb();Ra(0,`div`,2)(1,`button`,3),qa(`click`,function(){let i=bp(t).$implicit;return Tp(Kb().open(i))}),Ra(2,`span`,4)(3,`mat-icon`),wT(4),Hd()(),Ra(5,`span`,5)(6,`strong`),wT(7),Hd(),jb(8,lt,2,1,`span`),Hd()(),Ra(9,`button`,6),qa(`click`,function(){let i=bp(t).$implicit;return Tp(Kb().toastService.dismiss(i.id))}),Ra(10,`mat-icon`,7),wT(11,`close`),Hd()()()}if(e&2){let t=n.$implicit;Ya(`toast--link`,t.link),rr(`data-tone`,t.tone)(`role`,t.tone===`error`?`alert`:`status`),jC(),Lv(`disabled`,!t.link),rr(`aria-label`,t.link?t.title+` – öffnen`:null),jC(3),ty(t.icon),jC(3),ty(t.title),jC(),Ub(t.message?8:-1)}}var J=class e{router=p(dr);toastService=p(m$3);open(n){n.link&&(this.toastService.dismiss(n.id),this.router.navigateByUrl(n.link))}static ɵfac=function(t){return new(t||e)};static ɵcmp=nr({type:e,selectors:[[`app-toast-host`]],decls:3,vars:0,consts:[[`aria-live`,`polite`,1,`toast-stack`],[1,`toast`,3,`toast--link`],[1,`toast`],[`type`,`button`,1,`toast-body`,3,`click`,`disabled`],[`aria-hidden`,`true`,1,`toast-icon`],[1,`toast-copy`],[`type`,`button`,`aria-label`,`Hinweis schließen`,1,`toast-close`,3,`click`],[`aria-hidden`,`true`]],template:function(t,o){t&1&&(Ra(0,`div`,0),Hb(1,ct,12,9,`div`,1,st),Hd()),t&2&&(jC(),$b(o.toastService.toasts()))},dependencies:[t8,e8],styles:[`.toast-stack[_ngcontent-%COMP%]{position:fixed;top:52px;left:50%;z-index:1100;display:flex;width:min(100% - 32px,400px);flex-direction:column;gap:8px;transform:translate(-50%);pointer-events:none}.toast[_ngcontent-%COMP%]{display:flex;align-items:stretch;overflow:hidden;border:1px solid color-mix(in srgb,var(--%NS%tone) 45%,transparent);border-radius:var(--%NS%radius-medium);background-color:color-mix(in srgb,var(--%NS%tone) 14%,var(--%NS%color-neutral-raised));box-shadow:var(--%NS%shadow-surface);pointer-events:auto;animation:_ngcontent-%COMP%_toast-in .22s ease-out}.toast-body[_ngcontent-%COMP%]{display:flex;min-width:0;flex:1;align-items:center;gap:10px;padding:10px 4px 10px 12px;border:0;background:transparent;color:var(--%NS%color-text);font:inherit;text-align:left}.toast--link[_ngcontent-%COMP%]   .toast-body[_ngcontent-%COMP%]{cursor:pointer}.toast-body[_ngcontent-%COMP%]:disabled{cursor:default}.toast-icon[_ngcontent-%COMP%]{display:grid;flex:0 0 34px;place-items:center;width:34px;height:34px;border-radius:var(--%NS%radius-small);background:var(--%NS%tone-soft);color:var(--%NS%tone)}.toast-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:19px;height:19px;font-size:19px}.toast-copy[_ngcontent-%COMP%]{display:flex;min-width:0;flex-direction:column;gap:2px}.toast-copy[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%], .toast-copy[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.toast-copy[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{font-size:13px}.toast-copy[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{color:var(--%NS%color-text-muted);font-size:12px}.toast-close[_ngcontent-%COMP%]{display:grid;flex:0 0 40px;place-items:center;padding:0;border:0;background:transparent;color:var(--%NS%color-text-subtle);cursor:pointer}.toast-close[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:18px;height:18px;font-size:18px}.toast-body[_ngcontent-%COMP%]:focus, .toast-close[_ngcontent-%COMP%]:focus{outline:none}.toast-body[_ngcontent-%COMP%]:focus-visible, .toast-close[_ngcontent-%COMP%]:focus-visible{outline:2px solid var(--%NS%tone);outline-offset:-2px}@keyframes _ngcontent-%COMP%_toast-in{0%{opacity:0;transform:translateY(-8px)}}@media(prefers-reduced-motion:reduce){.toast[_ngcontent-%COMP%]{animation:none}}`]})};var pt=()=>({exact:!0});function dt(e,n){e&1&&(Ra(0,`a`,5)(1,`mat-icon`,7),wT(2,`settings`),Hd()())}function mt(e,n){if(e&1&&(Ra(0,`span`,8),wT(1),Hd()),e&2){let t=n;jC(),ty(t>9?`9+`:t)}}q_(class e{notifications=p(g$1);session=p(m$4);router=p(dr);url=F(this.router.events.pipe(Te$1(n=>n instanceof lt$2),P(n=>n.urlAfterRedirects)),{initialValue:this.router.url});onProfile=mi$1(()=>this.url().split(/[?#]/)[0]===`/profile`);constructor(){p(q),p(u),p(c)}static ɵfac=function(t){return new(t||e)};static ɵcmp=nr({type:e,selectors:[[`app-root`]],decls:35,vars:5,consts:[[1,`app-shell`],[1,`top-bar`],[`routerLink`,`/`,`aria-label`,`Game Center, zur Startseite`,1,`top-bar-title`],[`src`,`icons/app-icon.svg`,`alt`,``,`aria-hidden`,`true`],[1,`header-actions`],[`routerLink`,`/settings`,`aria-label`,`Einstellungen`,1,`header-icon-button`],[`routerLink`,`/notifications`,`routerLinkActive`,`header-icon-button--active`,1,`header-icon-button`],[`aria-hidden`,`true`],[`aria-hidden`,`true`,1,`notification-badge`],[`aria-label`,`Hauptnavigation`,1,`bottom-nav`],[`routerLink`,`/`,`routerLinkActive`,`active`,`ariaCurrentWhenActive`,`page`,1,`bottom-nav-link`,3,`routerLinkActiveOptions`],[`routerLink`,`/multiplayer`,`routerLinkActive`,`active`,`ariaCurrentWhenActive`,`page`,1,`bottom-nav-link`],[`routerLink`,`/collection`,`routerLinkActive`,`active`,`ariaCurrentWhenActive`,`page`,1,`bottom-nav-link`],[`routerLink`,`/profile`,`routerLinkActive`,`active`,`ariaCurrentWhenActive`,`page`,1,`bottom-nav-link`]],template:function(t,o){if(t&1&&(Ra(0,`div`,0)(1,`header`,1)(2,`a`,2),Wa(3,`img`,3),wT(4,` Game Center `),Hd(),Ra(5,`div`,4),jb(6,dt,3,0,`a`,5),Ra(7,`a`,6)(8,`mat-icon`,7),wT(9,`notifications`),Hd(),jb(10,mt,2,1,`span`,8),Hd()()(),Wa(11,`app-toast-host`),Ra(12,`main`),Wa(13,`router-outlet`),Hd(),Ra(14,`nav`,9)(15,`a`,10)(16,`mat-icon`,7),wT(17,`home`),Hd(),Ra(18,`span`),wT(19,`Home`),Hd()(),Ra(20,`a`,11)(21,`mat-icon`,7),wT(22,`groups`),Hd(),Ra(23,`span`),wT(24,`Multiplayer`),Hd()(),Ra(25,`a`,12)(26,`mat-icon`,7),wT(27,`apps`),Hd(),Ra(28,`span`),wT(29,`Sammlung`),Hd()(),Ra(30,`a`,13)(31,`mat-icon`,7),wT(32,`person`),Hd(),Ra(33,`span`),wT(34,`Profil`),Hd()()()()),t&2){let i;jC(6),Ub(o.onProfile()?6:-1),jC(),rr(`aria-label`,o.notifications.unreadCount()?`Benachrichtigungen, `+o.notifications.unreadCount()+` neu`:`Benachrichtigungen`),jC(3),Ub((i=o.notifications.unreadCount())?10:-1,i),jC(5),Lv(`routerLinkActiveOptions`,OT(4,pt))}},dependencies:[t8,e8,Uc,gR,th,J],styles:[`.app-shell[_ngcontent-%COMP%]{display:flex;flex-direction:column;width:100%;min-height:100dvh}main[_ngcontent-%COMP%]{flex:1;min-height:0;width:100%;box-sizing:border-box;padding-bottom:var(--%NS%bottom-nav-space)}.top-bar[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:var(--%NS%top-bar-height);box-sizing:border-box;padding:4px 6px 4px 16px}.top-bar-title[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:10px;min-height:44px;color:var(--%NS%color-text);font-size:16px;font-weight:600;letter-spacing:-.01em;text-decoration:none;-webkit-tap-highlight-color:transparent}.top-bar-title[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{display:block;width:30px;height:30px;border-radius:8px;object-fit:cover}.top-bar-title[_ngcontent-%COMP%]:focus-visible{border-radius:8px;outline:2px solid var(--%NS%color-primary-light);outline-offset:2px}.header-actions[_ngcontent-%COMP%]{display:flex;align-items:center}.header-icon-button[_ngcontent-%COMP%]{position:relative;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;color:var(--%NS%color-text);text-decoration:none;-webkit-tap-highlight-color:transparent;transition:background-color var(--%NS%transition-fast)}.header-icon-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:24px;height:24px;font-size:24px}.header-icon-button[_ngcontent-%COMP%]:hover{background:var(--%NS%color-white-06)}.header-icon-button--active[_ngcontent-%COMP%]{background:var(--%NS%color-surface)}.header-icon-button[_ngcontent-%COMP%]:focus{outline:none}.header-icon-button[_ngcontent-%COMP%]:focus-visible{outline:2px solid var(--%NS%color-primary-light);outline-offset:-2px}.notification-badge[_ngcontent-%COMP%]{position:absolute;top:6px;right:6px;display:grid;place-items:center;min-width:17px;height:17px;box-sizing:border-box;padding:0 4px;border:2px solid var(--%NS%color-background);border-radius:var(--%NS%radius-pill);background:var(--%NS%color-notification);color:var(--%NS%color-white);font-size:10px;font-weight:700;line-height:1;pointer-events:none}.bottom-nav[_ngcontent-%COMP%]{position:fixed;right:0;bottom:0;left:0;z-index:10;display:flex;justify-content:center;padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--%NS%color-border);background-color:var(--%NS%color-navigation-surface);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px)}.bottom-nav-link[_ngcontent-%COMP%]{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:2px;max-width:120px;min-height:48px;border-radius:12px;color:var(--%NS%color-text-subtle);font-size:11px;font-weight:500;text-decoration:none;transition:color var(--%NS%transition-fast)}.bottom-nav-link[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:26px;height:26px;font-size:26px}.bottom-nav-link[_ngcontent-%COMP%]:hover{color:var(--%NS%color-text-muted)}.bottom-nav-link.active[_ngcontent-%COMP%]{color:var(--%NS%color-text);font-weight:600}.bottom-nav-link[_ngcontent-%COMP%]:active{transform:scale(.96)}`]})},Qe).catch(e=>console.error(e));export{mi as A,i as B,dt$1 as C,ke as D,ht as E,wn as F,c as H,y as I,g$1 as L,qt as M,te as N,ln as O,tt$1 as P,u as R,di as S,hi as T,f as U,t as V,Le$1 as _,T as a,Ut as b,ee as c,An as d,E as f,Kt as g,Jt as h,K as i,oo as j,lt$1 as k,jt as l,Ge$2 as m,Bt as n,Vt as o,Ee as p,Ht as r,X as s,$e$1 as t,zt as u,Lt as v,ee$1 as w,Wt as x,Sn as y,F as z};