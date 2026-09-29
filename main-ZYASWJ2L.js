import{$ as T$1,$n as xd,$t as iH,A as Hr,An as qb,At as ar,B as Od,Bn as sb,Bt as er,C as Ff,Cn as ny,Ct as _t$2,D as H$2,Dt as aa,En as p,Et as aH,Fn as rb,Ft as cv,Gn as uE,Gt as ge$1,H as P$1,Hn as tI,Ht as fo,In as rd,It as dt$1,Jn as v$2,K as Pt$2,Kn as ue$1,Kt as gr,L as Md,Ln as sE,Mn as qn,Mt as be,N as L$1,Nt as c8,O as HS,On as pb,Ot as ab,Pn as rI,Pt as cE,Qn as wv,Qt as iC,R as N$3,S as Fa,Sn as nt$3,St as _p,T as G$1,Tn as ot$2,Tt as aE,U as P8,Ut as fv,V as Ov,Vn as sp,Vt as fb,W as Pa,Wn as u8,Wt as gE,X as R$1,Xt as hf,Yt as he$1,Z as Rd,_ as E$1,_n as me,a as AN,an as kd,b as Et$2,bt as Zn,c as Ag,cn as lE,ct as Vo$1,dn as lv,dt as Wr,er as y$1,et as Ub,f as Cc,g as Dt$1,gn as mN,gt as Z,h as Da,hn as mE,ht as Yn,i as AD,in as ka,ir as zo$1,j as Jn,jn as qe$3,jt as bN,k as Ho,kn as pe,kt as ap,ln as li$1,m as DN,mt as Y$1,nn as jc,nr as yo,nt as V$,o as Ad,on as ke$1,ot as Va,pn as m$1,q as Q$1,qn as un$1,qt as gv,r as $r,rn as k8,rr as yv,s as Ae$2,sn as kv,st as Vc,t as $$1,u as Bo$1,un as ln$1,v as Ee$1,vn as mo,wn as ob,xn as ne$2,xt as _d,yn as mv,yt as Ze$3,z as Nd,zn as s_}from"./chunk-Ba2khakM.js";import{t as nc}from"./chunk-ISiuc1t9.js";var e={friend_request:{category:`social`,label:`Freunde`,icon:`person_add`,tone:`social`,actions:`friend-request`},friend_accepted:{category:`social`,label:`Freunde`,icon:`how_to_reg`,tone:`success`,actions:`none`},game_invite:{category:`game`,label:`Spiele`,icon:`sports_esports`,tone:`game`,actions:`game-invite`},system_info:{category:`system`,label:`System`,icon:`campaign`,tone:`info`,actions:`none`},system_alert:{category:`system`,label:`Wichtig`,icon:`warning`,tone:`alert`,actions:`none`},app_error:{category:`system`,label:`Fehler`,icon:`error`,tone:`error`,actions:`none`}};function t(o){return e[o]??e.system_info}var i=[{type:`system_info`,label:`Info`},{type:`system_alert`,label:`Wichtig`}];var v$1=class n{async getProfile(e){let{data:t,error:r}=await nc.from(`profiles`).select(`*`).eq(`id`,e).maybeSingle();return r?null:t}async findByUsername(e){let{data:t,error:r}=await nc.from(`profiles`).select(`*`).eq(`username`,e).maybeSingle();return r?null:t}async searchProfiles(e,t){let r=e.replace(/[,()"\\%*]/g,``).trim();if(!r)return[];let{data:i,error:o}=await nc.from(`profiles`).select(`*`).or(`username.ilike.%${r}%,display_name.ilike.%${r}%`).neq(`id`,t).order(`username`).limit(8);return o?[]:i}async listProfiles(){let{data:e,error:t}=await nc.from(`profiles`).select(`*`).order(`username`);return t?[]:e}async setRole(e,t){return nc.rpc(`set_user_role`,{p_user_id:e,p_role:t}).single()}async updateDisplayName(e,t){return nc.from(`profiles`).update({display_name:t}).eq(`id`,e).select().single()}static ɵfac=function(t){return new(t||n)};static ɵprov=R$1({token:n,factory:n.ɵfac,providedIn:`root`})};var I=class n{profileService=p(v$1);currentUser=Q$1(null);currentProfile=Q$1(null);sessionInitialized=Q$1(!1);initialized=this.sessionInitialized.asReadonly();user=this.currentUser.asReadonly();profile=this.currentProfile.asReadonly();isLoggedIn=li$1(()=>this.currentUser()!==null);displayName=li$1(()=>this.currentProfile()?.display_name??this.currentProfile()?.username??``);username=li$1(()=>this.currentProfile()?.username??``);isAdmin=li$1(()=>this.currentProfile()?.role===`admin`);constructor(){nc.auth.getSession().then(async({data:e})=>{await this.setUser(e.session?.user??null),this.sessionInitialized.set(!0)}),nc.auth.onAuthStateChange((e,t)=>{this.setUser(t?.user??null)})}setProfile(e){this.currentProfile.set(e)}async setUser(e){this.currentUser.set(e),this.currentProfile.set(e?await this.profileService.getProfile(e.id):null)}static ɵfac=function(t){return new(t||n)};static ɵprov=R$1({token:n,factory:n.ɵfac,providedIn:`root`})};function f(n){let e=n?.message??``;if(/failed to fetch|networkerror|load failed/i.test(e))return`Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.`;switch(n?.code){case`42501`:return`Dafür fehlt dir die Berechtigung.`;case`23505`:return`Das existiert bereits.`;case`23514`:case`22023`:return`Die Eingabe ist ungültig.`;case`PGRST116`:return`Der Eintrag wurde nicht gefunden.`;case`PGRST301`:case`PGRST303`:return`Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.`;default:return`Etwas ist schiefgelaufen. Bitte versuche es erneut.`}}function w(n,e){return console.error(n,e),{ok:!1,message:f(e)}}var T=4e3;var U$2=3;var P=class n{toasts=Q$1([]);nextId=1;timers=new Map;show(e,t=T){let r=e.key?this.toasts().find(o=>o.key===e.key):void 0;r&&this.dismiss(r.id);let i=P$1(m$1({},e),{id:this.nextId++});return this.toasts.update(o=>[i,...o].slice(0,U$2)),this.timers.set(i.id,setTimeout(()=>this.dismiss(i.id),t)),i.id}success(e,t){return this.show({tone:`success`,icon:`check_circle`,title:e,message:t})}error(e,t=`Das hat nicht geklappt`){return this.show({tone:`error`,icon:`error`,title:t,message:e},6e3)}isVisible(e){return this.toasts().some(t=>t.key===e)}dismiss(e){clearTimeout(this.timers.get(e)),this.timers.delete(e),this.toasts.update(t=>t.filter(r=>r.id!==e))}static ɵfac=function(t){return new(t||n)};static ɵprov=R$1({token:n,factory:n.ɵfac,providedIn:`root`})};var E=`Das hat nicht geklappt`;var L=5e3;var h=class n{injector=p(ge$1);lastReported=new Map;report(e,t={}){let r=Date.now();if(r-(this.lastReported.get(e)??0)<L)return;this.lastReported.set(e,r);let i=t.title??E;t.toast!==!1&&this.injector.get(P).error(e,i),this.notifications.addLocalError(i,e)}get notifications(){return this.injector.get(S)}static ɵfac=function(t){return new(t||n)};static ɵprov=R$1({token:n,factory:n.ɵfac,providedIn:`root`})};var _=class n{injector=p(ge$1);handleError(e){console.error(e),setTimeout(()=>{try{this.injector.get(h).report(this.describe(e),{title:`Unerwarteter Fehler`})}catch(t){console.error(`Fehler konnte nicht gemeldet werden.`,t)}})}describe(e){let t=e?.rejection??e;return t&&typeof t==`object`&&`code`in t?f(t):t instanceof TypeError&&/fetch|network/i.test(t.message)?f(t):`Etwas ist schiefgelaufen. Lade die Seite neu, falls etwas nicht funktioniert.`}static ɵfac=function(t){return new(t||n)};static ɵprov=R$1({token:n,factory:n.ɵfac})};var D$1=`gameroster:local-notifications:`;var R=`local-`;var j$2=20;var S=class n{session=p(I);injector=p(ge$1);remote=Q$1([]);local=Q$1([]);notifications=li$1(()=>[...this.local(),...this.remote()].sort((e,t)=>t.created_at.localeCompare(e.created_at)));loading=Q$1(!0);loadedFor=Q$1(null);incoming=new Z;loadedUserId=null;channel=null;unreadCount=li$1(()=>this.notifications().filter(e=>!e.read_at).length);constructor(){_p(()=>{if(!this.session.initialized())return;let e=this.session.user()?.id??null;e!==this.loadedUserId&&(this.loadedUserId=e,this.loadedFor.set(null),this.remote.set([]),this.local.set(e?this.loadLocal(e):[]),this.subscribe(e),e?(this.loading.set(!0),this.load(e)):this.loading.set(!1))})}async reload(){this.loadedUserId&&await this.load(this.loadedUserId)}addLocalError(e,t){let r=this.loadedUserId;if(!r)return;let i={id:R+crypto.randomUUID(),recipient_id:r,sender_id:null,sender_name:`Game Center`,type:`app_error`,title:e,message:t,related_id:null,created_at:new Date().toISOString(),read_at:null};this.local.update(o=>[i,...o].slice(0,j$2)),this.persistLocal()}async markRead(e){if(!this.loadedUserId)return;let t=new Set(this.notifications().filter(a=>!a.read_at&&(!e||e.includes(a.id))).map(a=>a.id));if(!t.size)return;let r=new Date().toISOString(),i=a=>t.has(a.id)?P$1(m$1({},a),{read_at:r}):a;this.local.update(a=>a.map(i)),this.remote.update(a=>a.map(i)),this.persistLocal();let o=[...t].filter(a=>!this.isLocal(a));if(!o.length)return;let{error:m}=await nc.from(`notifications`).update({read_at:r}).in(`id`,o);m&&console.error(`Benachrichtigungen konnten nicht als gelesen markiert werden.`,m)}async dismiss(e){if(this.isLocal(e))return this.local.update(i=>i.filter(o=>o.id!==e)),this.persistLocal(),{ok:!0};let t=this.remote();this.removeRemote(e);let{error:r}=await nc.from(`notifications`).delete().eq(`id`,e);return r?(this.remote.set(t),w(`Benachrichtigung konnte nicht gelöscht werden.`,r)):{ok:!0}}async respondToFriendRequest(e,t){if(!e.related_id)return w(`Freundschaftsanfrage ohne Verweis.`,{message:`related_id fehlt`});let{data:i,error:o}=await(t?nc.from(`friendships`).update({status:`accepted`,updated_at:new Date().toISOString()}):nc.from(`friendships`).delete()).eq(`id`,e.related_id).eq(`status`,`pending`).select(`id`);return o?w(`Freundschaftsanfrage konnte nicht beantwortet werden.`,o):i?.length?(this.removeRemote(e.id),{ok:!0}):(await this.dismiss(e.id),{ok:!1,message:`Diese Anfrage ist nicht mehr offen.`})}async sendSystemNotification(e,t,r){let{data:i,error:o}=await nc.rpc(`send_system_notification`,{p_type:e,p_title:t,p_message:r});return o?(console.error(`Systembenachrichtigung konnte nicht gesendet werden.`,o),{error:f(o)}):{recipients:i}}isLocal(e){return e.startsWith(R)}removeRemote(e){this.remote.update(t=>t.filter(r=>r.id!==e))}async load(e){let{data:t,error:r}=await nc.from(`notifications`).select(`*`).eq(`recipient_id`,e).order(`created_at`,{ascending:!1});this.loadedUserId===e&&(r&&(console.error(`Benachrichtigungen konnten nicht geladen werden.`,r),this.injector.get(h).report(f(r),{title:`Benachrichtigungen nicht geladen`})),this.remote.set(t??[]),this.loading.set(!1),this.loadedFor.set(e))}async subscribe(e){if(this.channel){let r=this.channel;this.channel=null,await nc.removeChannel(r)}if(!e)return;let t=`recipient_id=eq.${e}`;this.channel=nc.channel(`notifications:${e}`).on(`postgres_changes`,{event:`INSERT`,schema:`public`,table:`notifications`,filter:t},r=>{let i=r.new;this.loadedUserId===e&&(this.remote().some(o=>o.id===i.id)||(this.remote.update(o=>[i,...o]),this.incoming.next(i)))}).on(`postgres_changes`,{event:`UPDATE`,schema:`public`,table:`notifications`,filter:t},r=>{let i=r.new;this.remote.update(o=>o.map(m=>m.id===i.id?i:m))}).subscribe()}loadLocal(e){try{let t=localStorage.getItem(D$1+e),r=t?JSON.parse(t):[];return Array.isArray(r)?r.filter(i=>typeof i?.id==`string`&&this.isLocal(i.id)):[]}catch{return[]}}persistLocal(){if(this.loadedUserId)try{localStorage.setItem(D$1+this.loadedUserId,JSON.stringify(this.local()))}catch{}}static ɵfac=function(t){return new(t||n)};static ɵprov=R$1({token:n,factory:n.ɵfac,providedIn:`root`})};var m=`boardgame:players`;var y=class i{session=p(I);appErrors=p(h);playersSubject=new he$1([]);players$=this.playersSubject.asObservable();roundCountSubject=new he$1(0);roundCount$=this.roundCountSubject.asObservable();phaseSubject=new he$1(`setup`);phase$=this.phaseSubject.asObservable();readyResolve;readyPromise=new Promise(e=>this.readyResolve=e);saveTimer=null;constructor(){_p(()=>{if(!this.session.initialized())return;let e=this.session.user();e?this.loadFromDb(e.id):this.loadFromLocal()})}ready(){return this.readyPromise}currentPhase(){return this.phaseSubject.value}async loadFromDb(e){let{data:t,error:s}=await nc.from(`ranking_games`).select(`players, round_count, phase`).eq(`user_id`,e).maybeSingle();s&&(console.error(`Ranking-Spiel konnte nicht geladen werden.`,s),this.appErrors.report(f(s),{title:`Spielstand nicht geladen`})),this.playersSubject.next(t?.players??[]),this.roundCountSubject.next(t?.round_count??0),this.phaseSubject.next(t?.phase??`setup`),this.readyResolve()}loadFromLocal(){let e=[];try{let t=localStorage.getItem(m);e=t?JSON.parse(t):[]}catch{}this.playersSubject.next(e),this.roundCountSubject.next(0),this.phaseSubject.next(`setup`),this.readyResolve()}persist(){let e=this.playersSubject.value;try{localStorage.setItem(m,JSON.stringify(e))}catch{}let t=this.session.user();t&&(this.saveTimer&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>{this.persistToDb(t.id)},400))}async persistToDb(e){if(this.session.user()?.id!==e)return;let{error:t}=await nc.from(`ranking_games`).upsert({user_id:e,players:this.playersSubject.value,round_count:this.roundCountSubject.value,phase:this.phaseSubject.value,updated_at:new Date().toISOString()});t&&(console.error(`Ranking-Spiel konnte nicht gespeichert werden.`,t),this.appErrors.report(f(t),{title:`Spielstand nicht gespeichert`}))}getPlayers(){return[...this.playersSubject.value]}addPlayer(e){let t=(e||``).trim();t&&(this.playersSubject.next([...this.playersSubject.value,{id:Date.now().toString(),name:t,score:0}]),this.persist())}removePlayer(e){this.playersSubject.next(this.playersSubject.value.filter(t=>t.id!==e)),this.persist()}startGame(){this.phaseSubject.next(`playing`),this.persist()}finishGame(){this.phaseSubject.next(`finished`),this.persist()}completeRound(e){let t=this.playersSubject.value.map(s=>s.id in e&&Number.isFinite(e[s.id])?P$1(m$1({},s),{score:s.score+(e[s.id]??0)}):s);this.playersSubject.next(t),this.roundCountSubject.next(this.roundCountSubject.value+1),this.persist()}resetScores(){this.playersSubject.next(this.playersSubject.value.map(e=>P$1(m$1({},e),{score:0}))),this.roundCountSubject.next(0),this.phaseSubject.next(`setup`),this.persist()}resetGame(){this.playersSubject.next([]),this.roundCountSubject.next(0),this.phaseSubject.next(`setup`),this.persist()}static ɵfac=function(t){return new(t||i)};static ɵprov=R$1({token:i,factory:i.ɵfac,providedIn:`root`})};function Q(e){return e.buttons===0||e.detail===0}function X$1(e){let a=e.touches&&e.touches[0]||e.changedTouches&&e.changedTouches[0];return!!a&&a.identifier===-1&&(a.radiusX==null||a.radiusX===1)&&(a.radiusY==null||a.radiusY===1)}var Et$1;function _e(){if(Et$1==null){let e=typeof document<`u`?document.head:null;Et$1=!!(e&&(e.createShadowRoot||e.attachShadow))}return Et$1}function wt(e){if(_e()){let a=e.getRootNode?e.getRootNode():null;if(typeof ShadowRoot<`u`&&ShadowRoot&&a instanceof ShadowRoot)return a}return null}function nn(){let e=typeof document<`u`&&document?document.activeElement:null;for(;e&&e.shadowRoot;){let a=e.shadowRoot.activeElement;if(a===e)break;e=a}return e}function N$2(e){if(e.composedPath)try{return e.composedPath()[0]}catch{}return e.target}var At$1;try{At$1=typeof Intl<`u`&&Intl.v8BreakIterator}catch{At$1=!1}var b=(()=>{class e{_platformId=p(Vo$1);isBrowser=this._platformId?V$(this._platformId):typeof document==`object`&&!!document;EDGE=this.isBrowser&&/(edge)/i.test(navigator.userAgent);TRIDENT=this.isBrowser&&/(msie|trident)/i.test(navigator.userAgent);BLINK=this.isBrowser&&!!(window.chrome||At$1)&&typeof CSS<`u`&&!this.EDGE&&!this.TRIDENT;WEBKIT=this.isBrowser&&/AppleWebKit/i.test(navigator.userAgent)&&!this.BLINK&&!this.EDGE&&!this.TRIDENT;IOS=this.isBrowser&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!(`MSStream`in window);FIREFOX=this.isBrowser&&/(firefox|minefield)/i.test(navigator.userAgent);ANDROID=this.isBrowser&&/android/i.test(navigator.userAgent)&&!this.TRIDENT;SAFARI=this.isBrowser&&/safari/i.test(navigator.userAgent)&&this.WEBKIT;static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var q;function ge(){if(q==null&&typeof window<`u`)try{window.addEventListener(`test`,null,Object.defineProperty({},"passive",{get:()=>q=!0}))}finally{q=q||!1}return q}function z(e){return ge()?e:!!e.capture}function an(e,a=0){return ye(e)?Number(e):arguments.length===2?a:0}function ye(e){return!isNaN(parseFloat(e))&&!isNaN(Number(e))}function D(e){return e instanceof nt$3?e.nativeElement:e}var Ne$1=new y$1(`cdk-input-modality-detector-options`);var Se={ignoreKeys:[18,17,224,91,16]};var xe=650;var It={passive:!0,capture:!0};var Ee=(()=>{class e{_platform=p(b);_listenerCleanups;modalityDetected;modalityChanged;get mostRecentModality(){return this._modality.value}_mostRecentTarget=null;_modality=new he$1(null);_options;_lastTouchMs=0;_onKeydown=t=>{this._options?.ignoreKeys?.some(n=>n===t.keyCode)||(this._modality.next(`keyboard`),this._mostRecentTarget=N$2(t))};_onMousedown=t=>{Date.now()-this._lastTouchMs<xe||(this._modality.next(Q(t)?`keyboard`:`mouse`),this._mostRecentTarget=N$2(t))};_onTouchstart=t=>{if(X$1(t)){this._modality.next(`keyboard`);return}this._lastTouchMs=Date.now(),this._modality.next(`touch`),this._mostRecentTarget=N$2(t)};constructor(){let t=p(me),n=p(H$2),o=p(Ne$1,{optional:!0});if(this._options=m$1(m$1({},Se),o),this.modalityDetected=this._modality.pipe(gE(1)),this.modalityChanged=this.modalityDetected.pipe(lE()),this._platform.isBrowser){let i=p(qn).createRenderer(null,null);this._listenerCleanups=t.runOutsideAngular(()=>[i.listen(n,`keydown`,this._onKeydown,It),i.listen(n,`mousedown`,this._onMousedown,It),i.listen(n,`touchstart`,this._onTouchstart,It)])}}ngOnDestroy(){this._modality.complete(),this._listenerCleanups?.forEach(t=>t())}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var J$1=(function(e){return e[e.IMMEDIATE=0]=`IMMEDIATE`,e[e.EVENTUAL=1]=`EVENTUAL`,e})(J$1||{});var we=new y$1(`cdk-focus-monitor-default-options`);var lt=z({passive:!0,capture:!0});var Tt$1=(()=>{class e{_ngZone=p(me);_platform=p(b);_inputModalityDetector=p(Ee);_origin=null;_lastFocusOrigin=null;_windowFocused=!1;_windowFocusTimeoutId;_originTimeoutId;_originFromTouchInteraction=!1;_elementInfo=new Map;_monitoredElementCount=0;_rootNodeFocusListenerCount=new Map;_detectionMode;_windowFocusListener=()=>{this._windowFocused=!0,this._windowFocusTimeoutId=setTimeout(()=>this._windowFocused=!1)};_document=p(H$2);_stopInputModalityDetector=new Z;constructor(){let t=p(we,{optional:!0});this._detectionMode=t?.detectionMode||J$1.IMMEDIATE}_rootNodeFocusAndBlurListener=t=>{let n=N$2(t);for(let o=n;o;o=o.parentElement)t.type===`focus`?this._onFocus(t,o):this._onBlur(t,o)};monitor(t,n=!1){let o=D(t);if(!this._platform.isBrowser||o.nodeType!==1)return T$1();let i=wt(o)||this._document,s=this._elementInfo.get(o);if(s)return n&&(s.checkChildren=!0),s.subject;let c={checkChildren:n,subject:new Z,rootNode:i};return this._elementInfo.set(o,c),this._registerGlobalListeners(c),c.subject}stopMonitoring(t){let n=D(t),o=this._elementInfo.get(n);o&&(o.subject.complete(),this._setClasses(n),this._elementInfo.delete(n),this._removeGlobalListeners(o))}focusVia(t,n,o){let i=D(t);i===this._document.activeElement?this._getClosestElementsInfo(i).forEach(([c,_])=>this._originChanged(c,n,_)):(this._setOrigin(n),typeof i.focus==`function`&&i.focus(o))}ngOnDestroy(){this._elementInfo.forEach((t,n)=>this.stopMonitoring(n))}_getWindow(){return this._document.defaultView||window}_getFocusOrigin(t){return this._origin?this._originFromTouchInteraction?this._shouldBeAttributedToTouch(t)?`touch`:`program`:this._origin:this._windowFocused&&this._lastFocusOrigin?this._lastFocusOrigin:t&&this._isLastInteractionFromInputLabel(t)?`mouse`:`program`}_shouldBeAttributedToTouch(t){return this._detectionMode===J$1.EVENTUAL||!!t?.contains(this._inputModalityDetector._mostRecentTarget)}_setClasses(t,n){t.classList.toggle(`cdk-focused`,!!n),t.classList.toggle(`cdk-touch-focused`,n===`touch`),t.classList.toggle(`cdk-keyboard-focused`,n===`keyboard`),t.classList.toggle(`cdk-mouse-focused`,n===`mouse`),t.classList.toggle(`cdk-program-focused`,n===`program`)}_setOrigin(t,n=!1){this._ngZone.runOutsideAngular(()=>{if(this._origin=t,this._originFromTouchInteraction=t===`touch`&&n,this._detectionMode===J$1.IMMEDIATE){clearTimeout(this._originTimeoutId);let o=this._originFromTouchInteraction?xe:1;this._originTimeoutId=setTimeout(()=>this._origin=null,o)}})}_onFocus(t,n){let o=this._elementInfo.get(n),i=N$2(t);!o||!o.checkChildren&&n!==i||this._originChanged(n,this._getFocusOrigin(i),o)}_onBlur(t,n){let o=this._elementInfo.get(n);!o||o.checkChildren&&t.relatedTarget instanceof Node&&n.contains(t.relatedTarget)||(this._setClasses(n),this._emitOrigin(o,null))}_emitOrigin(t,n){t.subject.observers.length&&this._ngZone.run(()=>t.subject.next(n))}_registerGlobalListeners(t){if(!this._platform.isBrowser)return;let n=t.rootNode,o=this._rootNodeFocusListenerCount.get(n)||0;o||this._ngZone.runOutsideAngular(()=>{n.addEventListener(`focus`,this._rootNodeFocusAndBlurListener,lt),n.addEventListener(`blur`,this._rootNodeFocusAndBlurListener,lt)}),this._rootNodeFocusListenerCount.set(n,o+1),++this._monitoredElementCount===1&&(this._ngZone.runOutsideAngular(()=>{this._getWindow().addEventListener(`focus`,this._windowFocusListener)}),this._inputModalityDetector.modalityDetected.pipe(yo(this._stopInputModalityDetector)).subscribe(i=>{this._setOrigin(i,!0)}))}_removeGlobalListeners(t){let n=t.rootNode;if(this._rootNodeFocusListenerCount.has(n)){let o=this._rootNodeFocusListenerCount.get(n);o>1?this._rootNodeFocusListenerCount.set(n,o-1):(n.removeEventListener(`focus`,this._rootNodeFocusAndBlurListener,lt),n.removeEventListener(`blur`,this._rootNodeFocusAndBlurListener,lt),this._rootNodeFocusListenerCount.delete(n))}--this._monitoredElementCount||(this._getWindow().removeEventListener(`focus`,this._windowFocusListener),this._stopInputModalityDetector.next(),clearTimeout(this._windowFocusTimeoutId),clearTimeout(this._originTimeoutId))}_originChanged(t,n,o){this._setClasses(t,n),this._emitOrigin(o,n),this._lastFocusOrigin=n}_getClosestElementsInfo(t){let n=[];return this._elementInfo.forEach((o,i)=>{(i===t||o.checkChildren&&i.contains(t))&&n.push([i,o])}),n}_isLastInteractionFromInputLabel(t){let{_mostRecentTarget:n,mostRecentModality:o}=this._inputModalityDetector;if(o!==`mouse`||!n||n===t||t.nodeName!==`INPUT`&&t.nodeName!==`TEXTAREA`||t.disabled)return!1;let i=t.labels;if(i){for(let s=0;s<i.length;s++)if(i[s].contains(n))return!0}return!1}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();function Mt$1(e){return Array.isArray(e)?e:[e]}var Ae$1=new Set;var B;var ut$1=(()=>{class e{_platform=p(b);_nonce=p(Ho,{optional:!0});_matchMedia;constructor(){this._matchMedia=this._platform.isBrowser&&window.matchMedia?window.matchMedia.bind(window):rn}matchMedia(t){return(this._platform.WEBKIT||this._platform.BLINK)&&on(t,this._nonce),this._matchMedia(t)}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();function on(e,a){if(!Ae$1.has(e))try{B||(B=document.createElement(`style`),a&&B.setAttribute(`nonce`,a),B.setAttribute(`type`,`text/css`),document.head.appendChild(B)),B.sheet&&(B.sheet.insertRule(`@media ${e.replace(/[{}]/g,``)} {body{ }}`,0),Ae$1.add(e))}catch(t){console.error(t)}}function rn(e){return{matches:e===`all`||e===``,media:e,addListener:()=>{},removeListener:()=>{}}}var Dt=(()=>{class e{_mediaMatcher=p(ut$1);_zone=p(me);_queries=new Map;_destroySubject=new Z;ngOnDestroy(){this._destroySubject.next(),this._destroySubject.complete()}isMatched(t){return Ie$1(Mt$1(t)).some(o=>this._registerQuery(o).mql.matches)}observe(t){let i=jc(Ie$1(Mt$1(t)).map(s=>this._registerQuery(s).observable));return i=gr(i.pipe(qe$3(1)),i.pipe(gE(1),uE(0))),i.pipe(L$1(s=>{let c={matches:!1,breakpoints:{}};return s.forEach(({matches:_,query:S})=>{c.matches=c.matches||_,c.breakpoints[S]=_}),c}))}_registerQuery(t){if(this._queries.has(t))return this._queries.get(t);let n=this._mediaMatcher.matchMedia(t),i={observable:new N$3(s=>{let c=_=>this._zone.run(()=>s.next(_));return n.addListener(c),()=>{n.removeListener(c)}}).pipe(Vc(n),L$1(({matches:s})=>({query:t,matches:s})),yo(this._destroySubject)),mql:n};return this._queries.set(t,i),i}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();function Ie$1(e){return e.map(a=>a.split(`,`)).reduce((a,t)=>a.concat(t)).map(a=>a.trim())}var sn=(()=>{class e{create(t){return typeof MutationObserver>`u`?null:new MutationObserver(t)}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var Te$1=(()=>{class e{static ɵfac=function(n){return new(n||e)};static ɵmod=Et$2({type:e});static ɵinj=Ze$3({providers:[sn]})}return e})();var cn=(()=>{class e{_platform=p(b);isDisabled(t){return t.hasAttribute(`disabled`)}isVisible(t){return mn(t)&&getComputedStyle(t).visibility===`visible`}isTabbable(t){if(!this._platform.isBrowser)return!1;let n=dn(_n(t));if(n&&(Me$1(n)===-1||!this.isVisible(n)))return!1;let o=t.nodeName.toLowerCase(),i=Me$1(t);return t.hasAttribute(`contenteditable`)?i!==-1:o===`iframe`||o===`object`||this._platform.WEBKIT&&this._platform.IOS&&!hn(t)?!1:o===`audio`?t.hasAttribute(`controls`)?i!==-1:!1:o===`video`?i===-1?!1:i!==null?!0:this._platform.FIREFOX||t.hasAttribute(`controls`):t.tabIndex>=0}isFocusable(t,n){return vn(t)&&!this.isDisabled(t)&&(n?.ignoreVisibility||this.isVisible(t))}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();function dn(e){try{return e.frameElement}catch{return null}}function mn(e){return!!(e.offsetWidth||e.offsetHeight||typeof e.getClientRects==`function`&&e.getClientRects().length)}function ln(e){let a=e.nodeName.toLowerCase();return a===`input`||a===`select`||a===`button`||a===`textarea`}function un(e){return pn(e)&&e.type==`hidden`}function bn(e){return fn(e)&&e.hasAttribute(`href`)}function pn(e){return e.nodeName.toLowerCase()==`input`}function fn(e){return e.nodeName.toLowerCase()==`a`}function Ce(e){if(!e.hasAttribute(`tabindex`)||e.tabIndex===void 0)return!1;let a=e.getAttribute(`tabindex`);return!!(a&&!isNaN(parseInt(a,10)))}function Me$1(e){if(!Ce(e))return null;let a=parseInt(e.getAttribute(`tabindex`)||``,10);return isNaN(a)?-1:a}function hn(e){let a=e.nodeName.toLowerCase(),t=a===`input`&&e.type;return t===`text`||t===`password`||a===`select`||a===`textarea`}function vn(e){return un(e)?!1:ln(e)||bn(e)||e.hasAttribute(`contenteditable`)||Ce(e)}function _n(e){return e.ownerDocument&&e.ownerDocument.defaultView||window}var Ct=class{_element;_checker;_ngZone;_document;_injector;_startAnchor=null;_endAnchor=null;_hasAttached=!1;startAnchorListener=()=>this.focusLastTabbableElement();endAnchorListener=()=>this.focusFirstTabbableElement();get enabled(){return this._enabled}set enabled(a){this._enabled=a,this._startAnchor&&this._endAnchor&&(this._toggleAnchorTabIndex(a,this._startAnchor),this._toggleAnchorTabIndex(a,this._endAnchor))}_enabled=!0;constructor(a,t,n,o,i=!1,s){this._element=a,this._checker=t,this._ngZone=n,this._document=o,this._injector=s,i||this.attachAnchors()}destroy(){let a=this._startAnchor,t=this._endAnchor;a&&(a.removeEventListener(`focus`,this.startAnchorListener),a.remove()),t&&(t.removeEventListener(`focus`,this.endAnchorListener),t.remove()),this._startAnchor=this._endAnchor=null,this._hasAttached=!1}attachAnchors(){return this._hasAttached?!0:(this._ngZone.runOutsideAngular(()=>{this._startAnchor||(this._startAnchor=this._createAnchor(),this._startAnchor.addEventListener(`focus`,this.startAnchorListener)),this._endAnchor||(this._endAnchor=this._createAnchor(),this._endAnchor.addEventListener(`focus`,this.endAnchorListener))}),this._element.parentNode&&(this._element.parentNode.insertBefore(this._startAnchor,this._element),this._element.parentNode.insertBefore(this._endAnchor,this._element.nextSibling),this._hasAttached=!0),this._hasAttached)}focusInitialElementWhenReady(a){return new Promise(t=>{this._executeOnStable(()=>t(this.focusInitialElement(a)))})}focusFirstTabbableElementWhenReady(a){return new Promise(t=>{this._executeOnStable(()=>t(this.focusFirstTabbableElement(a)))})}focusLastTabbableElementWhenReady(a){return new Promise(t=>{this._executeOnStable(()=>t(this.focusLastTabbableElement(a)))})}_getRegionBoundary(a){let t=this._element.querySelectorAll(`[cdk-focus-region-${a}], [cdkFocusRegion${a}], [cdk-focus-${a}]`);return a==`start`?t.length?t[0]:this._getFirstTabbableElement(this._element):t.length?t[t.length-1]:this._getLastTabbableElement(this._element)}focusInitialElement(a){let t=this._element.querySelector(`[cdk-focus-initial], [cdkFocusInitial]`);if(t){if(!this._checker.isFocusable(t)){let n=this._getFirstTabbableElement(t);return n?.focus(a),!!n}return t.focus(a),!0}return this.focusFirstTabbableElement(a)}focusFirstTabbableElement(a){let t=this._getRegionBoundary(`start`);return t&&t.focus(a),!!t}focusLastTabbableElement(a){let t=this._getRegionBoundary(`end`);return t&&t.focus(a),!!t}hasAttached(){return this._hasAttached}_getFirstTabbableElement(a){if(this._checker.isFocusable(a)&&this._checker.isTabbable(a))return a;let t=a.children;for(let n=0;n<t.length;n++){let o=t[n].nodeType===this._document.ELEMENT_NODE?this._getFirstTabbableElement(t[n]):null;if(o)return o}return null}_getLastTabbableElement(a){if(this._checker.isFocusable(a)&&this._checker.isTabbable(a))return a;let t=a.children;for(let n=t.length-1;n>=0;n--){let o=t[n].nodeType===this._document.ELEMENT_NODE?this._getLastTabbableElement(t[n]):null;if(o)return o}return null}_createAnchor(){let a=this._document.createElement(`div`);return this._toggleAnchorTabIndex(this._enabled,a),a.classList.add(`cdk-visually-hidden`),a.classList.add(`cdk-focus-trap-anchor`),a.setAttribute(`aria-hidden`,`true`),a}_toggleAnchorTabIndex(a,t){a?t.setAttribute(`tabindex`,`0`):t.removeAttribute(`tabindex`)}toggleAnchors(a){this._startAnchor&&this._endAnchor&&(this._toggleAnchorTabIndex(a,this._startAnchor),this._toggleAnchorTabIndex(a,this._endAnchor))}_executeOnStable(a){rd(a,{injector:this._injector})}};var gn=(()=>{class e{_checker=p(cn);_ngZone=p(me);_document=p(H$2);_injector=p(ge$1);constructor(){p(bN).load(c8)}create(t,n=!1){return new Ct(t,this._checker,this._ngZone,this._document,n,this._injector)}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var Oe=new y$1(`liveAnnouncerElement`,{providedIn:`root`,factory:()=>null});var Re=new y$1(`LIVE_ANNOUNCER_DEFAULT_OPTIONS`);var yn=0;var Nn=(()=>{class e{_ngZone=p(me);_defaultOptions=p(Re,{optional:!0});_liveElement;_document=p(H$2);_sanitizer=p(hf);_previousTimeout;_currentPromise;_currentResolve;constructor(){let t=p(Oe,{optional:!0});this._liveElement=t||this._createLiveElement()}announce(t,...n){let o=this._defaultOptions,i,s;return n.length===1&&typeof n[0]==`number`?s=n[0]:[i,s]=n,this.clear(),clearTimeout(this._previousTimeout),i||(i=o&&o.politeness?o.politeness:`polite`),s==null&&o&&(s=o.duration),this._liveElement.setAttribute(`aria-live`,i),this._liveElement.id&&this._exposeAnnouncerToModals(this._liveElement.id),this._ngZone.runOutsideAngular(()=>(this._currentPromise||(this._currentPromise=new Promise(c=>this._currentResolve=c)),clearTimeout(this._previousTimeout),this._previousTimeout=setTimeout(()=>{!t||typeof t==`string`?this._liveElement.textContent=t:u8(this._liveElement,t,this._sanitizer),typeof s==`number`&&(this._previousTimeout=setTimeout(()=>this.clear(),s)),this._currentResolve?.(),this._currentPromise=this._currentResolve=void 0},100),this._currentPromise))}clear(){this._liveElement&&(this._liveElement.textContent=``)}ngOnDestroy(){clearTimeout(this._previousTimeout),this._liveElement?.remove(),this._liveElement=null,this._currentResolve?.(),this._currentPromise=this._currentResolve=void 0}_createLiveElement(){let t=`cdk-live-announcer-element`,n=this._document.getElementsByClassName(t),o=this._document.createElement(`div`);for(let i=0;i<n.length;i++)n[i].remove();return o.classList.add(t),o.classList.add(`cdk-visually-hidden`),o.setAttribute(`aria-atomic`,`true`),o.setAttribute(`aria-live`,`polite`),o.id=`cdk-live-announcer-${yn++}`,this._document.body.appendChild(o),o}_exposeAnnouncerToModals(t){let n=this._document.querySelectorAll(`body > .cdk-overlay-container [aria-modal="true"]`);for(let o=0;o<n.length;o++){let i=n[o],s=i.getAttribute(`aria-owns`);s?s.indexOf(t)===-1&&i.setAttribute(`aria-owns`,s+` `+t):i.setAttribute(`aria-owns`,t)}}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var k=(function(e){return e[e.NONE=0]=`NONE`,e[e.BLACK_ON_WHITE=1]=`BLACK_ON_WHITE`,e[e.WHITE_ON_BLACK=2]=`WHITE_ON_BLACK`,e})(k||{});var De=`cdk-high-contrast-black-on-white`;var ke=`cdk-high-contrast-white-on-black`;var kt=`cdk-high-contrast-active`;var Fe$1=(()=>{class e{_platform=p(b);_hasCheckedHighContrastMode=!1;_document=p(H$2);_breakpointSubscription;constructor(){this._breakpointSubscription=p(Dt).observe(`(forced-colors: active)`).subscribe(()=>{this._hasCheckedHighContrastMode&&(this._hasCheckedHighContrastMode=!1,this._applyBodyHighContrastModeCssClasses())})}getHighContrastMode(){if(!this._platform.isBrowser)return k.NONE;let t=this._document.createElement(`div`);t.style.backgroundColor=`rgb(1,2,3)`,t.style.position=`absolute`,this._document.body.appendChild(t);let n=this._document.defaultView||window,o=n&&n.getComputedStyle?n.getComputedStyle(t):null,i=(o&&o.backgroundColor||``).replace(/ /g,``);switch(t.remove(),i){case`rgb(0,0,0)`:case`rgb(45,50,54)`:case`rgb(32,32,32)`:return k.WHITE_ON_BLACK;case`rgb(255,255,255)`:case`rgb(255,250,239)`:return k.BLACK_ON_WHITE}return k.NONE}ngOnDestroy(){this._breakpointSubscription.unsubscribe()}_applyBodyHighContrastModeCssClasses(){if(!this._hasCheckedHighContrastMode&&this._platform.isBrowser&&this._document.body){let t=this._document.body.classList;t.remove(kt,De,ke),this._hasCheckedHighContrastMode=!0;let n=this.getHighContrastMode();n===k.BLACK_ON_WHITE?t.add(kt,De):n===k.WHITE_ON_BLACK&&t.add(kt,ke)}}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var Sn=(()=>{class e{constructor(){p(Fe$1)._applyBodyHighContrastModeCssClasses()}static ɵfac=function(n){return new(n||e)};static ɵmod=Et$2({type:e});static ɵinj=Ze$3({imports:[Te$1]})}return e})();var xn=200;var bt=class{_letterKeyStream=new Z;_items=[];_selectedItemIndex=-1;_pressedLetters=[];_skipPredicateFn;_selectedItem=new Z;selectedItem=this._selectedItem;constructor(a,t){let n=typeof t?.debounceInterval==`number`?t.debounceInterval:xn;t?.skipPredicate&&(this._skipPredicateFn=t.skipPredicate),this.setItems(a),this._setupKeyHandler(n)}destroy(){this._pressedLetters=[],this._letterKeyStream.complete(),this._selectedItem.complete()}setCurrentSelectedItemIndex(a){this._selectedItemIndex=a}setItems(a){this._items=a}handleKey(a){let t=a.keyCode;a.key&&a.key.length===1?this._letterKeyStream.next(a.key.toLocaleUpperCase()):(t>=65&&t<=90||t>=48&&t<=57)&&this._letterKeyStream.next(String.fromCharCode(t))}isTyping(){return this._pressedLetters.length>0}reset(){this._pressedLetters=[]}_setupKeyHandler(a){this._letterKeyStream.pipe(pe(t=>this._pressedLetters.push(t)),uE(a),Ae$2(()=>this._pressedLetters.length>0),L$1(()=>this._pressedLetters.join(``).toLocaleUpperCase())).subscribe(t=>{for(let n=1;n<this._items.length+1;n++){let o=(this._selectedItemIndex+n)%this._items.length,i=this._items[o];if(!this._skipPredicateFn?.(i)&&i.getLabel?.().toLocaleUpperCase().trim().indexOf(t)===0){this._selectedItem.next(i);break}}this._pressedLetters=[]})}};function Le$2(e,...a){return a.length?a.some(t=>e[t]):e.altKey||e.shiftKey||e.ctrlKey||e.metaKey}var j$1=class{_items;_activeItemIndex=Q$1(-1);_activeItem=Q$1(null);_wrap=!1;_typeaheadSubscription=ne$2.EMPTY;_itemChangesSubscription;_vertical=!0;_horizontal=null;_allowedModifierKeys=[];_homeAndEnd=!1;_pageUpAndDown={enabled:!1,delta:10};_effectRef;_typeahead;_skipPredicateFn=a=>a.disabled;constructor(a,t){this._items=a,a instanceof aa?this._itemChangesSubscription=a.changes.subscribe(n=>this._itemsChanged(n.toArray())):zo$1(a)&&(this._effectRef=_p(()=>this._itemsChanged(a()),{injector:t}))}tabOut=new Z;change=new Z;skipPredicate(a){return this._skipPredicateFn=a,this}withWrap(a=!0){return this._wrap=a,this}withVerticalOrientation(a=!0){return this._vertical=a,this}withHorizontalOrientation(a){return this._horizontal=a,this}withAllowedModifierKeys(a){return this._allowedModifierKeys=a,this}withTypeAhead(a=200){this._typeaheadSubscription.unsubscribe();let t=this._getItemsArray();return this._typeahead=new bt(t,{debounceInterval:typeof a==`number`?a:void 0,skipPredicate:n=>this._skipPredicateFn(n)}),this._typeaheadSubscription=this._typeahead.selectedItem.subscribe(n=>{this.setActiveItem(n)}),this}cancelTypeahead(){return this._typeahead?.reset(),this}withHomeAndEnd(a=!0){return this._homeAndEnd=a,this}withPageUpDown(a=!0,t=10){return this._pageUpAndDown={enabled:a,delta:t},this}setActiveItem(a){let t=this._activeItem();this.updateActiveItem(a),this._activeItem()!==t&&this.change.next(this._activeItemIndex())}onKeydown(a){let t=a.keyCode,o=[`altKey`,`ctrlKey`,`metaKey`,`shiftKey`].every(i=>!a[i]||this._allowedModifierKeys.indexOf(i)>-1);switch(t){case 9:this.tabOut.next();return;case 40:if(this._vertical&&o){this.setNextItemActive();break}else return;case 38:if(this._vertical&&o){this.setPreviousItemActive();break}else return;case 39:if(this._horizontal&&o){this._horizontal===`rtl`?this.setPreviousItemActive():this.setNextItemActive();break}else return;case 37:if(this._horizontal&&o){this._horizontal===`rtl`?this.setNextItemActive():this.setPreviousItemActive();break}else return;case 36:if(this._homeAndEnd&&o){this.setFirstItemActive();break}else return;case 35:if(this._homeAndEnd&&o){this.setLastItemActive();break}else return;case 33:if(this._pageUpAndDown.enabled&&o){let i=this._activeItemIndex()-this._pageUpAndDown.delta;this._setActiveItemByIndex(i>0?i:0,1);break}else return;case 34:if(this._pageUpAndDown.enabled&&o){let i=this._activeItemIndex()+this._pageUpAndDown.delta,s=this._getItemsArray().length;this._setActiveItemByIndex(i<s?i:s-1,-1);break}else return;default:(o||Le$2(a,`shiftKey`))&&this._typeahead?.handleKey(a);return}this._typeahead?.reset(),a.preventDefault()}get activeItemIndex(){return this._activeItemIndex()}get activeItem(){return this._activeItem()}isTyping(){return!!this._typeahead&&this._typeahead.isTyping()}setFirstItemActive(){this._setActiveItemByIndex(0,1)}setLastItemActive(){this._setActiveItemByIndex(this._getItemsArray().length-1,-1)}setNextItemActive(){this._activeItemIndex()<0?this.setFirstItemActive():this._setActiveItemByDelta(1)}setPreviousItemActive(){this._activeItemIndex()<0&&this._wrap?this.setLastItemActive():this._setActiveItemByDelta(-1)}updateActiveItem(a){let t=this._getItemsArray(),n=typeof a==`number`?a:t.indexOf(a),o=t[n];this._activeItem.set(o??null),this._activeItemIndex.set(n),this._typeahead?.setCurrentSelectedItemIndex(n)}destroy(){this._typeaheadSubscription.unsubscribe(),this._itemChangesSubscription?.unsubscribe(),this._effectRef?.destroy(),this._typeahead?.destroy(),this.tabOut.complete(),this.change.complete()}_setActiveItemByDelta(a){this._wrap?this._setActiveInWrapMode(a):this._setActiveInDefaultMode(a)}_setActiveInWrapMode(a){let t=this._getItemsArray();for(let n=1;n<=t.length;n++){let o=(this._activeItemIndex()+a*n+t.length)%t.length,i=t[o];if(!this._skipPredicateFn(i)){this.setActiveItem(o);return}}}_setActiveInDefaultMode(a){this._setActiveItemByIndex(this._activeItemIndex()+a,a)}_setActiveItemByIndex(a,t){let n=this._getItemsArray();if(n[a]){for(;this._skipPredicateFn(n[a]);)if(a+=t,!n[a])return;this.setActiveItem(a)}}_getItemsArray(){return zo$1(this._items)?this._items():this._items instanceof aa?this._items.toArray():this._items}_itemsChanged(a){this._typeahead?.setItems(a);let t=this._activeItem();if(t){let n=a.indexOf(t);n>-1&&n!==this._activeItemIndex()&&(this._activeItemIndex.set(n),this._typeahead?.setCurrentSelectedItemIndex(n))}}};var Ot=class extends j$1{setActiveItem(a){this.activeItem&&this.activeItem.setInactiveStyles(),super.setActiveItem(a),this.activeItem&&this.activeItem.setActiveStyles()}};var Rt$1=class extends j$1{_origin=`program`;setFocusOrigin(a){return this._origin=a,this}setActiveItem(a){super.setActiveItem(a),this.activeItem&&this.activeItem.focus(this._origin)}};var Pe=new Map;var Ft$1=class e{_appId=p(Bo$1);static _infix=`a${Math.floor(Math.random()*1e5).toString()}`;getId(a,t=!1){this._appId!==`ng`&&(a+=this._appId);let n=Pe.get(a);return n===void 0?n=0:n++,Pe.set(a,n),`${a}${t?e._infix+`-`:``}${n}`}static ɵfac=function(t){return new(t||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})};var Ue$1=` `;function En(e,a,t){let n=ft$1(e,a);t=t.trim(),!n.some(o=>o.trim()===t)&&(n.push(t),e.setAttribute(a,n.join(Ue$1)))}function wn(e,a,t){let n=ft$1(e,a);t=t.trim();let o=n.filter(i=>i!==t);o.length?e.setAttribute(a,o.join(Ue$1)):e.removeAttribute(a)}function ft$1(e,a){return e.getAttribute(a)?.match(/\S+/g)??[]}var ze$2=`cdk-describedby-message`;var pt$1=`cdk-describedby-host`;var Pt$1=0;var wo=(()=>{class e{_platform=p(b);_document=p(H$2);_messageRegistry=new Map;_messagesContainer=null;_id=`${Pt$1++}`;constructor(){p(bN).load(c8),this._id=p(Bo$1)+`-`+Pt$1++}describe(t,n,o){if(!this._canBeDescribed(t,n))return;let i=Lt(n,o);typeof n!=`string`?(Be$2(n,this._id),this._messageRegistry.set(i,{messageElement:n,referenceCount:0})):this._messageRegistry.has(i)||this._createMessageElement(n,o),this._isElementDescribedByMessage(t,i)||this._addMessageReference(t,i)}removeDescription(t,n,o){if(!n||!this._isElementNode(t))return;let i=Lt(n,o);if(this._isElementDescribedByMessage(t,i)&&this._removeMessageReference(t,i),typeof n==`string`){let s=this._messageRegistry.get(i);s&&s.referenceCount===0&&this._deleteMessageElement(i)}this._messagesContainer?.childNodes.length===0&&(this._messagesContainer.remove(),this._messagesContainer=null)}ngOnDestroy(){let t=this._document.querySelectorAll(`[${pt$1}="${this._id}"]`);for(let n=0;n<t.length;n++)this._removeCdkDescribedByReferenceIds(t[n]),t[n].removeAttribute(pt$1);this._messagesContainer?.remove(),this._messagesContainer=null,this._messageRegistry.clear()}_createMessageElement(t,n){let o=this._document.createElement(`div`);Be$2(o,this._id),o.textContent=t,n&&o.setAttribute(`role`,n),this._createMessagesContainer(),this._messagesContainer.appendChild(o),this._messageRegistry.set(Lt(t,n),{messageElement:o,referenceCount:0})}_deleteMessageElement(t){this._messageRegistry.get(t)?.messageElement?.remove(),this._messageRegistry.delete(t)}_createMessagesContainer(){if(this._messagesContainer)return;let t=`cdk-describedby-message-container`,n=this._document.querySelectorAll(`.${t}[platform="server"]`);for(let i=0;i<n.length;i++)n[i].remove();let o=this._document.createElement(`div`);o.style.visibility=`hidden`,o.classList.add(t),o.classList.add(`cdk-visually-hidden`),this._platform.isBrowser||o.setAttribute(`platform`,`server`),this._document.body.appendChild(o),this._messagesContainer=o}_removeCdkDescribedByReferenceIds(t){let n=ft$1(t,`aria-describedby`).filter(o=>o.indexOf(ze$2)!=0);t.setAttribute(`aria-describedby`,n.join(` `))}_addMessageReference(t,n){let o=this._messageRegistry.get(n);En(t,`aria-describedby`,o.messageElement.id),t.setAttribute(pt$1,this._id),o.referenceCount++}_removeMessageReference(t,n){let o=this._messageRegistry.get(n);o.referenceCount--,wn(t,`aria-describedby`,o.messageElement.id),t.removeAttribute(pt$1)}_isElementDescribedByMessage(t,n){let o=ft$1(t,`aria-describedby`),i=this._messageRegistry.get(n),s=i&&i.messageElement.id;return!!s&&o.indexOf(s)!=-1}_canBeDescribed(t,n){if(!this._isElementNode(t))return!1;if(n&&typeof n==`object`)return!0;let o=n==null?``:`${n}`.trim(),i=t.getAttribute(`aria-label`);return o?!i||i.trim()!==o:!1}_isElementNode(t){return t.nodeType===this._document.ELEMENT_NODE}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();function Lt(e,a){return typeof e==`string`?`${a||``}/${e}`:e}function Be$2(e,a){e.id||(e.id=`${ze$2}-${a}-${Pt$1++}`)}var tt$2=(function(e){return e[e.NORMAL=0]=`NORMAL`,e[e.NEGATED=1]=`NEGATED`,e[e.INVERTED=2]=`INVERTED`,e})(tt$2||{});var ht$1;var U$1;function Oo(){if(U$1==null){if(typeof document!=`object`||!document||typeof Element!=`function`||!Element)return U$1=!1,U$1;if(document.documentElement?.style&&`scrollBehavior`in document.documentElement.style)U$1=!0;else{let e=Element.prototype.scrollTo;e?U$1=!/\{\s*\[native code\]\s*\}/.test(e.toString()):U$1=!1}}return U$1}function Ro(){if(typeof document!=`object`||!document)return tt$2.NORMAL;if(ht$1==null){let e=document.createElement(`div`),a=e.style;e.dir=`rtl`,a.width=`1px`,a.overflow=`auto`,a.visibility=`hidden`,a.pointerEvents=`none`,a.position=`absolute`;let t=document.createElement(`div`),n=t.style;n.width=`2px`,n.height=`1px`,e.appendChild(t),document.body.appendChild(e),ht$1=tt$2.NORMAL,e.scrollLeft===0&&(e.scrollLeft=1,ht$1=e.scrollLeft===0?tt$2.NEGATED:tt$2.INVERTED),e.remove()}return ht$1}function Lo$1(){return typeof __karma__<`u`&&!!__karma__||typeof jasmine<`u`&&!!jasmine||typeof jest<`u`&&!!jest||typeof Mocha<`u`&&!!Mocha}var K$1;var je$1=[`color`,`button`,`checkbox`,`date`,`datetime-local`,`email`,`file`,`hidden`,`image`,`month`,`number`,`password`,`radio`,`range`,`reset`,`search`,`submit`,`tel`,`text`,`time`,`url`,`week`];function Bo(){if(K$1)return K$1;if(typeof document!=`object`||!document)return K$1=new Set(je$1),K$1;let e=document.createElement(`input`);return K$1=new Set(je$1.filter(a=>(e.setAttribute(`type`,a),e.type===a))),K$1}var An=new y$1(`MATERIAL_ANIMATIONS`);var Ke$2=null;function In(){return p(An,{optional:!0})?.animationsDisabled||p(rI,{optional:!0})===`NoopAnimations`?`di-disabled`:(Ke$2??=p(ut$1).matchMedia(`(prefers-reduced-motion)`).matches,Ke$2?`reduced-motion`:`enabled`)}function H$1(){return In()!==`enabled`}function $o(e){return e==null?``:typeof e==`string`?e:`${e}px`}function Qo(e){return e!=null&&`${e}`!=`false`}var v=(function(e){return e[e.FADING_IN=0]=`FADING_IN`,e[e.VISIBLE=1]=`VISIBLE`,e[e.FADING_OUT=2]=`FADING_OUT`,e[e.HIDDEN=3]=`HIDDEN`,e})(v||{});var Bt$1=class{_renderer;element;config;_animationForciblyDisabledThroughCss;state=v.HIDDEN;constructor(a,t,n,o=!1){this._renderer=a,this.element=t,this.config=n,this._animationForciblyDisabledThroughCss=o}fadeOut(){this._renderer.fadeOutRipple(this)}};var He$2=z({passive:!0,capture:!0});var Ut=class{_events=new Map;addHandler(a,t,n,o){let i=this._events.get(t);if(i){let s=i.get(n);s?s.add(o):i.set(n,new Set([o]))}else this._events.set(t,new Map([[n,new Set([o])]])),a.runOutsideAngular(()=>{document.addEventListener(t,this._delegateEventHandler,He$2)})}removeHandler(a,t,n){let o=this._events.get(a);if(!o)return;let i=o.get(t);i&&(i.delete(n),i.size===0&&o.delete(t),o.size===0&&(this._events.delete(a),document.removeEventListener(a,this._delegateEventHandler,He$2)))}_delegateEventHandler=a=>{let t=N$2(a);t&&this._events.get(a.type)?.forEach((n,o)=>{(o===t||o.contains(t))&&n.forEach(i=>i.handleEvent(a))})}};var et$2={enterDuration:225,exitDuration:150};var Tn=800;var Ve$2=z({passive:!0,capture:!0});var We$2=[`mousedown`,`touchstart`];var Ze$2=[`mouseup`,`mouseleave`,`touchend`,`touchcancel`];var Mn=(()=>{class e{static ɵfac=function(n){return new(n||e)};static ɵcmp=Jn({type:e,selectors:[[`ng-component`]],hostAttrs:[`mat-ripple-style-loader`,``],decls:0,vars:0,template:function(n,o){},styles:[`.mat-ripple {
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
`],encapsulation:2})}return e})();var nt$2=class e{_target;_ngZone;_platform;_containerElement;_triggerElement=null;_isPointerDown=!1;_activeRipples=new Map;_mostRecentTransientRipple=null;_lastTouchStartEvent;_pointerUpEventsRegistered=!1;_containerRect=null;static _eventManager=new Ut;constructor(a,t,n,o,i){this._target=a,this._ngZone=t,this._platform=o,o.isBrowser&&(this._containerElement=D(n)),i&&i.get(bN).load(Mn)}fadeInRipple(a,t,n={}){let o=this._containerRect=this._containerRect||this._containerElement.getBoundingClientRect(),i=m$1(m$1({},et$2),n.animation);n.centered&&(a=o.left+o.width/2,t=o.top+o.height/2);let s=n.radius||Dn(a,t,o),c=a-o.left,_=t-o.top,S=i.enterDuration,p=document.createElement(`div`);p.classList.add(`mat-ripple-element`),p.style.left=`${c-s}px`,p.style.top=`${_-s}px`,p.style.height=`${s*2}px`,p.style.width=`${s*2}px`,n.color!=null&&(p.style.backgroundColor=n.color),p.style.transitionDuration=`${S}ms`,this._containerElement.appendChild(p);let Vt=window.getComputedStyle(p),en=Vt.transitionProperty,Wt=Vt.transitionDuration,gt=en===`none`||Wt===`0s`||Wt===`0s, 0s`||o.width===0&&o.height===0,C=new Bt$1(this,p,n,gt);p.style.transform=`scale3d(1, 1, 1)`,C.state=v.FADING_IN,n.persistent||(this._mostRecentTransientRipple=C);let at=null;return!gt&&(S||i.exitDuration)&&this._ngZone.runOutsideAngular(()=>{let Zt=()=>{at&&(at.fallbackTimer=null),clearTimeout(Gt),this._finishRippleTransition(C)},yt=()=>this._destroyRipple(C),Gt=setTimeout(yt,S+100);p.addEventListener(`transitionend`,Zt),p.addEventListener(`transitioncancel`,yt),at={onTransitionEnd:Zt,onTransitionCancel:yt,fallbackTimer:Gt}}),this._activeRipples.set(C,at),(gt||!S)&&this._finishRippleTransition(C),C}fadeOutRipple(a){if(a.state===v.FADING_OUT||a.state===v.HIDDEN)return;let t=a.element,n=m$1(m$1({},et$2),a.config.animation);t.style.transitionDuration=`${n.exitDuration}ms`,t.style.opacity=`0`,a.state=v.FADING_OUT,(a._animationForciblyDisabledThroughCss||!n.exitDuration)&&this._finishRippleTransition(a)}fadeOutAll(){this._getActiveRipples().forEach(a=>a.fadeOut())}fadeOutAllNonPersistent(){this._getActiveRipples().forEach(a=>{a.config.persistent||a.fadeOut()})}setupTriggerEvents(a){let t=D(a);!this._platform.isBrowser||!t||t===this._triggerElement||(this._removeTriggerEvents(),this._triggerElement=t,We$2.forEach(n=>{e._eventManager.addHandler(this._ngZone,n,t,this)}))}handleEvent(a){a.type===`mousedown`?this._onMousedown(a):a.type===`touchstart`?this._onTouchStart(a):this._onPointerUp(),this._pointerUpEventsRegistered||(this._ngZone.runOutsideAngular(()=>{Ze$2.forEach(t=>{this._triggerElement.addEventListener(t,this,Ve$2)})}),this._pointerUpEventsRegistered=!0)}_finishRippleTransition(a){a.state===v.FADING_IN?this._startFadeOutTransition(a):a.state===v.FADING_OUT&&this._destroyRipple(a)}_startFadeOutTransition(a){let t=a===this._mostRecentTransientRipple,{persistent:n}=a.config;a.state=v.VISIBLE,!n&&(!t||!this._isPointerDown)&&a.fadeOut()}_destroyRipple(a){let t=this._activeRipples.get(a)??null;this._activeRipples.delete(a),this._activeRipples.size||(this._containerRect=null),a===this._mostRecentTransientRipple&&(this._mostRecentTransientRipple=null),a.state=v.HIDDEN,t!==null&&(a.element.removeEventListener(`transitionend`,t.onTransitionEnd),a.element.removeEventListener(`transitioncancel`,t.onTransitionCancel),t.fallbackTimer!==null&&clearTimeout(t.fallbackTimer)),a.element.remove()}_onMousedown(a){let t=Q(a),n=this._lastTouchStartEvent&&Date.now()<this._lastTouchStartEvent+Tn;!this._target.rippleDisabled&&!t&&!n&&(this._isPointerDown=!0,this.fadeInRipple(a.clientX,a.clientY,this._target.rippleConfig))}_onTouchStart(a){if(!this._target.rippleDisabled&&!X$1(a)){this._lastTouchStartEvent=Date.now(),this._isPointerDown=!0;let t=a.changedTouches;if(t)for(let n=0;n<t.length;n++)this.fadeInRipple(t[n].clientX,t[n].clientY,this._target.rippleConfig)}}_onPointerUp(){this._isPointerDown&&(this._isPointerDown=!1,this._getActiveRipples().forEach(a=>{let t=a.state===v.VISIBLE||a.config.terminateOnPointerUp&&a.state===v.FADING_IN;!a.config.persistent&&t&&a.fadeOut()}))}_getActiveRipples(){return Array.from(this._activeRipples.keys())}_removeTriggerEvents(){let a=this._triggerElement;a&&(We$2.forEach(t=>e._eventManager.removeHandler(t,a,this)),this._pointerUpEventsRegistered&&(Ze$2.forEach(t=>a.removeEventListener(t,this,Ve$2)),this._pointerUpEventsRegistered=!1))}};function Dn(e,a,t){let n=Math.max(Math.abs(e-t.left),Math.abs(e-t.right)),o=Math.max(Math.abs(a-t.top),Math.abs(a-t.bottom));return Math.sqrt(n*n+o*o)}var zt=new y$1(`mat-ripple-global-options`);var di$1=(()=>{class e{_elementRef=p(nt$3);_animationsDisabled=H$1();color;unbounded=!1;centered=!1;radius=0;animation;get disabled(){return this._disabled}set disabled(t){t&&this.fadeOutAllNonPersistent(),this._disabled=t,this._setupTriggerEventsIfEnabled()}_disabled=!1;get trigger(){return this._trigger||this._elementRef.nativeElement}set trigger(t){this._trigger=t,this._setupTriggerEventsIfEnabled()}_trigger;_rippleRenderer;_globalOptions;_isInitialized=!1;constructor(){let t=p(me),n=p(b),o=p(zt,{optional:!0}),i=p(ge$1);this._globalOptions=o||{},this._rippleRenderer=new nt$2(this,t,this._elementRef,n,i)}ngOnInit(){this._isInitialized=!0,this._setupTriggerEventsIfEnabled()}ngOnDestroy(){this._rippleRenderer._removeTriggerEvents()}fadeOutAll(){this._rippleRenderer.fadeOutAll()}fadeOutAllNonPersistent(){this._rippleRenderer.fadeOutAllNonPersistent()}get rippleConfig(){return{centered:this.centered,radius:this.radius,color:this.color,animation:m$1(m$1(m$1({},this._globalOptions.animation),this._animationsDisabled?{enterDuration:0,exitDuration:0}:{}),this.animation),terminateOnPointerUp:this._globalOptions.terminateOnPointerUp}}get rippleDisabled(){return this.disabled||!!this._globalOptions.disabled}_setupTriggerEventsIfEnabled(){!this.disabled&&this._isInitialized&&this._rippleRenderer.setupTriggerEvents(this.trigger)}launch(t,n=0,o){return typeof t==`number`?this._rippleRenderer.fadeInRipple(t,n,m$1(m$1({},this.rippleConfig),o)):this._rippleRenderer.fadeInRipple(0,0,m$1(m$1({},this.rippleConfig),t))}static ɵfac=function(n){return new(n||e)};static ɵdir=ot$2({type:e,selectors:[[``,`mat-ripple`,``],[``,`matRipple`,``]],hostAttrs:[1,`mat-ripple`],hostVars:2,hostBindings:function(n,o){n&2&&Fa(`mat-ripple-unbounded`,o.unbounded)},inputs:{color:[0,`matRippleColor`,`color`],unbounded:[0,`matRippleUnbounded`,`unbounded`],centered:[0,`matRippleCentered`,`centered`],radius:[0,`matRippleRadius`,`radius`],animation:[0,`matRippleAnimation`,`animation`],disabled:[0,`matRippleDisabled`,`disabled`],trigger:[0,`matRippleTrigger`,`trigger`]},exportAs:[`matRipple`]})}return e})();var kn={capture:!0};var Cn=[`focus`,`mousedown`,`mouseenter`,`touchstart`];var jt=`mat-ripple-loader-uninitialized`;var Kt$1=`mat-ripple-loader-class-name`;var Ge$1=`mat-ripple-loader-centered`;var vt=`mat-ripple-loader-disabled`;var $e$1=(()=>{class e{_document=p(H$2);_animationsDisabled=H$1();_globalRippleOptions=p(zt,{optional:!0});_platform=p(b);_ngZone=p(me);_injector=p(ge$1);_eventCleanups;_hosts=new Map;constructor(){let t=p(qn).createRenderer(null,null);this._eventCleanups=this._ngZone.runOutsideAngular(()=>Cn.map(n=>t.listen(this._document,n,this._onInteraction,kn)))}ngOnDestroy(){let t=this._hosts.keys();for(let n of t)this.destroyRipple(n);this._eventCleanups.forEach(n=>n())}configureRipple(t,n){t.setAttribute(jt,this._globalRippleOptions?.namespace??``),(n.className||!t.hasAttribute(Kt$1))&&t.setAttribute(Kt$1,n.className||``),n.centered&&t.setAttribute(Ge$1,``),n.disabled&&t.setAttribute(vt,``)}setDisabled(t,n){let o=this._hosts.get(t);o?(o.target.rippleDisabled=n,!n&&!o.hasSetUpEvents&&(o.hasSetUpEvents=!0,o.renderer.setupTriggerEvents(t))):n?t.setAttribute(vt,``):t.removeAttribute(vt)}_onInteraction=t=>{let n=N$2(t);if(n instanceof HTMLElement){let o=n.closest(`[${jt}="${this._globalRippleOptions?.namespace??``}"]`);o&&this._createRipple(o)}};_createRipple(t){if(!this._document||this._hosts.has(t))return;t.querySelector(`.mat-ripple`)?.remove();let n=this._document.createElement(`span`);n.classList.add(`mat-ripple`,t.getAttribute(Kt$1)),t.append(n);let o=this._globalRippleOptions,i=this._animationsDisabled?0:o?.animation?.enterDuration??et$2.enterDuration,s=this._animationsDisabled?0:o?.animation?.exitDuration??et$2.exitDuration,c={rippleDisabled:this._animationsDisabled||o?.disabled||t.hasAttribute(vt),rippleConfig:{centered:t.hasAttribute(Ge$1),terminateOnPointerUp:o?.terminateOnPointerUp,animation:{enterDuration:i,exitDuration:s}}},_=new nt$2(c,this._ngZone,n,this._platform,this._injector),S=!c.rippleDisabled;S&&_.setupTriggerEvents(t),this._hosts.set(t,{target:c,renderer:_,hasSetUpEvents:S}),t.removeAttribute(jt)}destroyRipple(t){let n=this._hosts.get(t);n&&(n.renderer._removeTriggerEvents(),this._hosts.delete(t))}static ɵfac=function(n){return new(n||e)};static ɵprov=$$1({token:e,factory:e.ɵfac})}return e})();var Ye$2=(()=>{class e{static ɵfac=function(n){return new(n||e)};static ɵcmp=Jn({type:e,selectors:[[`structural-styles`]],decls:0,vars:0,template:function(n,o){},styles:[`.mat-focus-indicator {
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
`],encapsulation:2})}return e})();var On=[`*`,[[``,`progressIndicator`,``]]];var Rn=[`*`,`[progressIndicator]`];function Fn(e,a){e&1&&(Md(0,`div`,1),Ad(1,1),Nd())}var Ln=new y$1(`MAT_BUTTON_CONFIG`);function Qe$2(e){return e==null?void 0:iH(e)}var _t$1=(()=>{class e{_elementRef=p(nt$3);_ngZone=p(me);_animationsDisabled=H$1();_config=p(Ln,{optional:!0});_focusMonitor=p(Tt$1);_cleanupClick;_renderer=p(Zn);_rippleLoader=p($e$1);_isAnchor;_isFab=!1;color;get disableRipple(){return this._disableRipple}set disableRipple(t){this._disableRipple=t,this._updateRippleDisabled()}_disableRipple=!1;get disabled(){return this._disabled}set disabled(t){this._disabled=t,this._updateRippleDisabled()}_disabled=!1;ariaDisabled;disabledInteractive;tabIndex;set _tabindex(t){this.tabIndex=t}showProgress=Va(!1,{transform:$r});constructor(){p(bN).load(Ye$2);let t=this._elementRef.nativeElement;this._isAnchor=t.tagName===`A`,this.disabledInteractive=this._config?.disabledInteractive??!1,this.color=this._config?.color??null,this._rippleLoader?.configureRipple(t,{className:`mat-mdc-button-ripple`})}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,!0),this._isAnchor&&this._setupAsAnchor()}ngOnDestroy(){this._cleanupClick?.(),this._focusMonitor.stopMonitoring(this._elementRef),this._rippleLoader?.destroyRipple(this._elementRef.nativeElement)}focus(t=`program`,n){t?this._focusMonitor.focusVia(this._elementRef.nativeElement,t,n):this._elementRef.nativeElement.focus(n)}_getAriaDisabled(){return this.ariaDisabled!=null?this.ariaDisabled:this._isAnchor?this.disabled||null:this.disabled&&this.disabledInteractive?!0:null}_getDisabledAttribute(){return this.disabledInteractive||!this.disabled?null:!0}_updateRippleDisabled(){this._rippleLoader?.setDisabled(this._elementRef.nativeElement,this.disableRipple||this.disabled)}_getTabIndex(){return this._isAnchor?this.disabled&&!this.disabledInteractive?-1:this.tabIndex:this.tabIndex}_setupAsAnchor(){this._cleanupClick=this._ngZone.runOutsideAngular(()=>this._renderer.listen(this._elementRef.nativeElement,`click`,t=>{this.disabled&&(t.preventDefault(),t.stopImmediatePropagation())}))}static ɵfac=function(n){return new(n||e)};static ɵdir=ot$2({type:e,hostAttrs:[1,`mat-mdc-button-base`],hostVars:15,hostBindings:function(n,o){n&2&&(er(`disabled`,o._getDisabledAttribute())(`aria-disabled`,o._getAriaDisabled())(`tabindex`,o._getTabIndex()),kd(o.color?`mat-`+o.color:``),Fa(`mat-mdc-button-progress-indicator-shown`,o.showProgress())(`mat-mdc-button-disabled`,o.disabled)(`mat-mdc-button-disabled-interactive`,o.disabledInteractive)(`mat-unthemed`,!o.color)(`_mat-animation-noopable`,o._animationsDisabled))},inputs:{color:`color`,disableRipple:[2,`disableRipple`,`disableRipple`,$r],disabled:[2,`disabled`,`disabled`,$r],ariaDisabled:[2,`aria-disabled`,`ariaDisabled`,$r],disabledInteractive:[2,`disabledInteractive`,`disabledInteractive`,$r],tabIndex:[2,`tabIndex`,`tabIndex`,Qe$2],_tabindex:[2,`tabindex`,`_tabindex`,Qe$2],showProgress:[1,`showProgress`]}})}return e})();var Pn=(()=>{class e extends _t$1{constructor(){super(),this._rippleLoader.configureRipple(this._elementRef.nativeElement,{centered:!0})}static ɵfac=function(n){return new(n||e)};static ɵcmp=Jn({type:e,selectors:[[`button`,`mat-icon-button`,``],[`a`,`mat-icon-button`,``],[`button`,`matIconButton`,``],[`a`,`matIconButton`,``]],hostAttrs:[1,`mdc-icon-button`,`mat-mdc-icon-button`],exportAs:[`matButton`,`matAnchor`],features:[lv],ngContentSelectors:Rn,decls:5,vars:1,consts:[[1,`mat-mdc-button-persistent-ripple`,`mdc-icon-button__ripple`],[1,`mat-mdc-button-progress-indicator-container`],[1,`mat-focus-indicator`],[1,`mat-mdc-button-touch-target`]],template:function(n,o){n&1&&(Rd(On),mv(0,`span`,0),Ad(1),rb(2,Fn,2,0,`div`,1),mv(3,`span`,2)(4,`span`,3)),n&2&&(iC(2),ob(o.showProgress()?2:-1))},styles:[`.mat-mdc-icon-button {
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
`],encapsulation:2})}return e})();var Xe$2=(()=>{class e{static ɵfac=function(n){return new(n||e)};static ɵmod=Et$2({type:e});static ɵinj=Ze$3({imports:[AD]})}return e})();var Je$2=[[[``,8,`material-icons`,3,`iconPositionEnd`,``],[`mat-icon`,3,`iconPositionEnd`,``],[``,`matButtonIcon`,``,3,`iconPositionEnd`,``]],`*`,[[``,`iconPositionEnd`,``,8,`material-icons`],[`mat-icon`,`iconPositionEnd`,``],[``,`matButtonIcon`,``,`iconPositionEnd`,``]],[[``,`progressIndicator`,``]]];var tn=[`.material-icons:not([iconPositionEnd]), mat-icon:not([iconPositionEnd]), [matButtonIcon]:not([iconPositionEnd])`,`*`,`.material-icons[iconPositionEnd], mat-icon[iconPositionEnd], [matButtonIcon][iconPositionEnd]`,`[progressIndicator]`];function Bn(e,a){e&1&&(Md(0,`div`,2),Ad(1,3),Nd())}function Un(e,a){e&1&&(Md(0,`div`,2),Ad(1,3),Nd())}var zn=`.mat-mdc-fab-base {
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
`;var qe$2=new Map([[`text`,[`mat-mdc-button`]],[`filled`,[`mdc-button--unelevated`,`mat-mdc-unelevated-button`]],[`elevated`,[`mdc-button--raised`,`mat-mdc-raised-button`]],[`outlined`,[`mdc-button--outlined`,`mat-mdc-outlined-button`]],[`tonal`,[`mat-tonal-button`]]]);var zi=(()=>{class e extends _t$1{get appearance(){return this._appearance}set appearance(t){this.setAppearance(t||this._config?.defaultAppearance||`text`)}_appearance=null;constructor(){super();let t=jn(this._elementRef.nativeElement);t&&this.setAppearance(t)}setAppearance(t){if(t===this._appearance)return;let n=this._elementRef.nativeElement.classList,o=this._appearance?qe$2.get(this._appearance):null,i=qe$2.get(t);o&&n.remove(...o),n.add(...i),this._appearance=t}static ɵfac=function(n){return new(n||e)};static ɵcmp=Jn({type:e,selectors:[[`button`,`matButton`,``],[`a`,`matButton`,``],[`button`,`mat-button`,``],[`button`,`mat-raised-button`,``],[`button`,`mat-flat-button`,``],[`button`,`mat-stroked-button`,``],[`a`,`mat-button`,``],[`a`,`mat-raised-button`,``],[`a`,`mat-flat-button`,``],[`a`,`mat-stroked-button`,``]],hostAttrs:[1,`mdc-button`],inputs:{appearance:[0,`matButton`,`appearance`]},exportAs:[`matButton`,`matAnchor`],features:[lv],ngContentSelectors:tn,decls:8,vars:5,consts:[[1,`mat-mdc-button-persistent-ripple`],[1,`mdc-button__label`],[1,`mat-mdc-button-progress-indicator-container`],[1,`mat-focus-indicator`],[1,`mat-mdc-button-touch-target`]],template:function(n,o){n&1&&(Rd(Je$2),mv(0,`span`,0),Ad(1),Md(2,`span`,1),Ad(3,1),Nd(),Ad(4,2),rb(5,Bn,2,0,`div`,2),mv(6,`span`,3)(7,`span`,4)),n&2&&(Fa(`mdc-button__ripple`,!o._isFab)(`mdc-fab__ripple`,o._isFab),iC(5),ob(o.showProgress()?5:-1))},styles:[`.mat-mdc-button-base {
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
`],encapsulation:2})}return e})();function jn(e){return e.hasAttribute(`mat-raised-button`)?`elevated`:e.hasAttribute(`mat-stroked-button`)?`outlined`:e.hasAttribute(`mat-flat-button`)?`filled`:e.hasAttribute(`mat-button`)?`text`:null}var Kn=new y$1(`mat-mdc-fab-default-options`,{providedIn:`root`,factory:()=>Ht});var Ht={color:`accent`};var ji=(()=>{class e extends _t$1{_options=p(Kn,{optional:!0});_isFab=!0;constructor(){super(),this._options=this._options||Ht,this.color=this._options.color||Ht.color}static ɵfac=function(n){return new(n||e)};static ɵcmp=Jn({type:e,selectors:[[`button`,`mat-mini-fab`,``],[`a`,`mat-mini-fab`,``],[`button`,`matMiniFab`,``],[`a`,`matMiniFab`,``]],hostAttrs:[1,`mdc-fab`,`mat-mdc-fab-base`,`mdc-fab--mini`,`mat-mdc-mini-fab`],exportAs:[`matButton`,`matAnchor`],features:[lv],ngContentSelectors:tn,decls:8,vars:5,consts:[[1,`mat-mdc-button-persistent-ripple`],[1,`mdc-button__label`],[1,`mat-mdc-button-progress-indicator-container`],[1,`mat-focus-indicator`],[1,`mat-mdc-button-touch-target`]],template:function(n,o){n&1&&(Rd(Je$2),mv(0,`span`,0),Ad(1),Md(2,`span`,1),Ad(3,1),Nd(),Ad(4,2),rb(5,Un,2,0,`div`,2),mv(6,`span`,3)(7,`span`,4)),n&2&&(Fa(`mdc-button__ripple`,!o._isFab)(`mdc-fab__ripple`,o._isFab),iC(5),ob(o.showProgress()?5:-1))},styles:[zn],encapsulation:2})}return e})();var Ki=(()=>{class e{static ɵfac=function(n){return new(n||e)};static ɵmod=Et$2({type:e});static ɵinj=Ze$3({imports:[Xe$2,AD]})}return e})();var ei=20;var ct=(()=>{class n{_ngZone=p(me);_platform=p(b);_renderer=p(qn).createRenderer(null,null);_cleanupGlobalListener;_scrolled=new Z;_scrolledCount=0;scrollContainers=new Map;register(t){this.scrollContainers.has(t)||this.scrollContainers.set(t,t.elementScrolled().subscribe(()=>this._scrolled.next(t)))}deregister(t){let e=this.scrollContainers.get(t);e&&(e.unsubscribe(),this.scrollContainers.delete(t))}scrolled(t=ei){return this._platform.isBrowser?new N$3(e=>{this._cleanupGlobalListener||(this._cleanupGlobalListener=this._ngZone.runOutsideAngular(()=>this._renderer.listen(`document`,`scroll`,()=>this._scrolled.next())));let o=t>0?this._scrolled.pipe(cE(t)).subscribe(e):this._scrolled.subscribe(e);return this._scrolledCount++,()=>{o.unsubscribe(),this._scrolledCount--,this._scrolledCount||(this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0)}}):T$1()}ngOnDestroy(){this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0,this.scrollContainers.forEach((t,e)=>this.deregister(e)),this._scrolled.complete()}ancestorScrolled(t,e){let o=this.getAncestorScrollContainers(t);return this.scrolled(e).pipe(Ae$2(s=>!s||o.indexOf(s)>-1))}getAncestorScrollContainers(t){let e=[];return this.scrollContainers.forEach((o,s)=>{this._targetContainsElement(s,t)&&e.push(s)}),e}_targetContainsElement(t,e){let o=D(e),s=t.getElementRef().nativeElement;do if(o==s)return!0;while(o=o.parentElement);return!1}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var Qt=(()=>{class n{elementRef=p(nt$3);scrollDispatcher=p(ct);ngZone=p(me);dir=p(AN,{optional:!0});_scrollElement=this.elementRef.nativeElement;_destroyed=new Z;_renderer=p(Zn);_cleanupScroll;_elementScrolled=new Z;ngOnInit(){this._cleanupScroll=this.ngZone.runOutsideAngular(()=>this._renderer.listen(this._scrollElement,`scroll`,t=>this._elementScrolled.next(t))),this.scrollDispatcher.register(this)}ngOnDestroy(){this._cleanupScroll?.(),this._elementScrolled.complete(),this.scrollDispatcher.deregister(this),this._destroyed.next(),this._destroyed.complete()}elementScrolled(){return this._elementScrolled}getElementRef(){return this.elementRef}scrollTo(t){let e=this.elementRef.nativeElement,o=this.dir&&this.dir.value==`rtl`;t.left??=o?t.end:t.start,t.right??=o?t.start:t.end,t.bottom!=null&&(t.top=e.scrollHeight-e.clientHeight-t.bottom),o&&Ro()!=tt$2.NORMAL?(t.left!=null&&(t.right=e.scrollWidth-e.clientWidth-t.left),Ro()==tt$2.INVERTED?t.left=t.right:Ro()==tt$2.NEGATED&&(t.left=t.right?-t.right:t.right)):t.right!=null&&(t.left=e.scrollWidth-e.clientWidth-t.right),this._applyScrollToOptions(t)}_applyScrollToOptions(t){let e=this.elementRef.nativeElement;Oo()?e.scrollTo(t):(t.top!=null&&(e.scrollTop=t.top),t.left!=null&&(e.scrollLeft=t.left))}measureScrollOffset(t){let e=`left`,o=`right`,s=this.elementRef.nativeElement;if(t==`top`)return s.scrollTop;if(t==`bottom`)return s.scrollHeight-s.clientHeight-s.scrollTop;let r=this.dir&&this.dir.value==`rtl`;return t==`start`?t=r?o:e:t==`end`&&(t=r?e:o),r&&Ro()==tt$2.INVERTED?t==e?s.scrollWidth-s.clientWidth-s.scrollLeft:s.scrollLeft:r&&Ro()==tt$2.NEGATED?t==e?s.scrollLeft+s.scrollWidth-s.clientWidth:-s.scrollLeft:t==e?s.scrollLeft:s.scrollWidth-s.clientWidth-s.scrollLeft}static ɵfac=function(e){return new(e||n)};static ɵdir=ot$2({type:n,selectors:[[``,`cdk-scrollable`,``],[``,`cdkScrollable`,``]]})}return n})();var ii=20;var J=(()=>{class n{_platform=p(b);_listeners;_viewportSize=null;_change=new Z;_document=p(H$2);constructor(){let t=p(me),e=p(qn).createRenderer(null,null);t.runOutsideAngular(()=>{if(this._platform.isBrowser){let o=s=>this._change.next(s);this._listeners=[e.listen(`window`,`resize`,o),e.listen(`window`,`orientationchange`,o)]}this.change().subscribe(()=>this._viewportSize=null)})}ngOnDestroy(){this._listeners?.forEach(t=>t()),this._change.complete()}getViewportSize(){this._viewportSize||this._updateViewportSize();let t={width:this._viewportSize.width,height:this._viewportSize.height};return this._platform.isBrowser||(this._viewportSize=null),t}getViewportRect(){let t=this.getViewportScrollPosition(),{width:e,height:o}=this.getViewportSize();return{top:t.top,left:t.left,bottom:t.top+o,right:t.left+e,height:o,width:e}}getViewportScrollPosition(){if(!this._platform.isBrowser)return{top:0,left:0};let t=this._document,e=this._getWindow(),o=t.documentElement,s=o.getBoundingClientRect();return{top:-s.top||t.body?.scrollTop||e.scrollY||o.scrollTop||0,left:-s.left||t.body?.scrollLeft||e.scrollX||o.scrollLeft||0}}change(t=ii){return t>0?this._change.pipe(cE(t)):this._change}_getWindow(){return this._document.defaultView||window}_updateViewportSize(){let t=this._getWindow();this._viewportSize=this._platform.isBrowser?{width:t.innerWidth,height:t.innerHeight}:{width:0,height:0}}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var Kt=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=Et$2({type:n});static ɵinj=Ze$3({})}return n})();var Jt=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=Et$2({type:n});static ɵinj=Ze$3({imports:[AD,Kt,AD,Kt]})}return n})();var ht=class{_attachedHost=null;attach(i){return this._attachedHost=i,i.attach(this)}detach(){let i=this._attachedHost;i!=null&&(this._attachedHost=null,i.detach())}get isAttached(){return this._attachedHost!=null}setAttachedHost(i){this._attachedHost=i}};var tt$1=class extends ht{component;viewContainerRef;injector;projectableNodes;bindings;directives;constructor(i,t,e,o,s,r){super(),this.component=i,this.viewContainerRef=t,this.injector=e,this.projectableNodes=o,this.bindings=s||null,this.directives=r||null}};var W=class extends ht{templateRef;viewContainerRef;context;injector;constructor(i,t,e,o){super(),this.templateRef=i,this.viewContainerRef=t,this.context=e,this.injector=o}get origin(){return this.templateRef.elementRef}attach(i,t=this.context){return this.context=t,super.attach(i)}detach(){return this.context=void 0,super.detach()}};var te=class extends ht{element;constructor(i){super(),this.element=i instanceof nt$3?i.nativeElement:i}};var et$1=class{_attachedPortal=null;_disposeFn=null;_isDisposed=!1;hasAttached(){return!!this._attachedPortal}attach(i){if(i instanceof tt$1)return this._attachedPortal=i,this.attachComponentPortal(i);if(i instanceof W)return this._attachedPortal=i,this.attachTemplatePortal(i);if(this.attachDomPortal&&i instanceof te)return this._attachedPortal=i,this.attachDomPortal(i)}attachDomPortal=null;detach(){this._attachedPortal&&(this._attachedPortal.setAttachedHost(null),this._attachedPortal=null),this._invokeDisposeFn()}dispose(){this.hasAttached()&&this.detach(),this._invokeDisposeFn(),this._isDisposed=!0}setDisposeFn(i){this._disposeFn=i}_invokeDisposeFn(){this._disposeFn&&(this._disposeFn(),this._disposeFn=null)}};var Rt=class extends et$1{outletElement;_appRef;_defaultInjector;constructor(i,t,e){super(),this.outletElement=i,this._appRef=t,this._defaultInjector=e}attachComponentPortal(i){let t;if(i.viewContainerRef){let e=i.injector||i.viewContainerRef.injector,o=e.get(Yn,null,{optional:!0})||void 0;t=i.viewContainerRef.createComponent(i.component,{index:i.viewContainerRef.length,injector:e,ngModuleRef:o,projectableNodes:i.projectableNodes||void 0,bindings:i.bindings||void 0,directives:i.directives||void 0}),this.setDisposeFn(()=>t.destroy())}else{let e=this._appRef,o=i.injector||this._defaultInjector||ge$1.NULL,s=o.get(Y$1,e.injector);t=ny(i.component,{elementInjector:o,environmentInjector:s,projectableNodes:i.projectableNodes||void 0,bindings:i.bindings||void 0,directives:i.directives||void 0}),e.attachView(t.hostView),this.setDisposeFn(()=>{e.viewCount>0&&e.detachView(t.hostView),t.destroy()})}return this.outletElement.appendChild(this._getComponentRootNode(t)),this._attachedPortal=i,t}attachTemplatePortal(i){let t=i.viewContainerRef,e=t.createEmbeddedView(i.templateRef,i.context,{injector:i.injector});return e.rootNodes.forEach(o=>this.outletElement.appendChild(o)),e.detectChanges(),this.setDisposeFn(()=>{let o=t.indexOf(e);o!==-1&&t.remove(o)}),this._attachedPortal=i,e}attachDomPortal=i=>{let t=i.element;t.parentNode;let e=this.outletElement.ownerDocument.createComment(`dom-portal`);t.parentNode.insertBefore(e,t),this.outletElement.appendChild(t),this._attachedPortal=i,super.setDisposeFn(()=>{e.parentNode&&e.parentNode.replaceChild(t,e)})};dispose(){super.dispose(),this.outletElement.remove()}_getComponentRootNode(i){return i.hostView.rootNodes[0]}};var dt=(()=>{class n extends et$1{_moduleRef=p(Yn,{optional:!0});_document=p(H$2);_viewContainerRef=p(Dt$1);_isInitialized=!1;_attachedRef=null;get portal(){return this._attachedPortal}set portal(t){this.hasAttached()&&!t&&!this._isInitialized||(this.hasAttached()&&super.detach(),t&&super.attach(t),this._attachedPortal=t||null)}attached=new ue$1;get attachedRef(){return this._attachedRef}ngOnInit(){this._isInitialized=!0}ngOnDestroy(){super.dispose(),this._attachedRef=this._attachedPortal=null}attachComponentPortal(t){t.setAttachedHost(this);let e=t.viewContainerRef!=null?t.viewContainerRef:this._viewContainerRef,o=e.createComponent(t.component,{index:e.length,injector:t.injector||e.injector,projectableNodes:t.projectableNodes||void 0,ngModuleRef:this._moduleRef||void 0,bindings:t.bindings||void 0,directives:t.directives||void 0});return e!==this._viewContainerRef&&this._getRootNode().appendChild(o.hostView.rootNodes[0]),super.setDisposeFn(()=>o.destroy()),this._attachedPortal=t,this._attachedRef=o,this.attached.emit(o),o}attachTemplatePortal(t){t.setAttachedHost(this);let e=this._viewContainerRef.createEmbeddedView(t.templateRef,t.context,{injector:t.injector});return super.setDisposeFn(()=>this._viewContainerRef.clear()),this._attachedPortal=t,this._attachedRef=e,this.attached.emit(e),e}attachDomPortal=t=>{let e=t.element;e.parentNode;let o=this._document.createComment(`dom-portal`);t.setAttachedHost(this),e.parentNode.insertBefore(o,e),this._getRootNode().appendChild(e),this._attachedPortal=t,super.setDisposeFn(()=>{o.parentNode&&o.parentNode.replaceChild(e,o)})};_getRootNode(){let t=this._viewContainerRef.element.nativeElement;return t.nodeType===t.ELEMENT_NODE?t:t.parentNode}static ɵfac=(()=>{let t;return function(o){return(t||(t=Ag(n)))(o||n)}})();static ɵdir=ot$2({type:n,selectors:[[``,`cdkPortalOutlet`,``]],inputs:{portal:[0,`cdkPortalOutlet`,`portal`]},outputs:{attached:`attached`},exportAs:[`cdkPortalOutlet`],features:[lv]})}return n})();var H=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=Et$2({type:n});static ɵinj=Ze$3({})}return n})();var Ae=Oo();function nt$1(n){return new xt(n.get(J),n.get(H$2))}var xt=class{_viewportRuler;_previousHTMLStyles={top:``,left:``};_previousScrollPosition;_isEnabled=!1;_document;constructor(i,t){this._viewportRuler=i,this._document=t}attach(){}enable(){if(this._canBeEnabled()){let i=this._document.documentElement;this._previousScrollPosition=this._viewportRuler.getViewportScrollPosition(),this._previousHTMLStyles.left=i.style.left||``,this._previousHTMLStyles.top=i.style.top||``,i.style.left=$o(-this._previousScrollPosition.left),i.style.top=$o(-this._previousScrollPosition.top),i.classList.add(`cdk-global-scrollblock`),this._isEnabled=!0}}disable(){if(this._isEnabled){let i=this._document.documentElement,t=this._document.body,e=i.style,o=t.style,s=e.scrollBehavior||``,r=o.scrollBehavior||``;this._isEnabled=!1,e.left=this._previousHTMLStyles.left,e.top=this._previousHTMLStyles.top,i.classList.remove(`cdk-global-scrollblock`),Ae&&(e.scrollBehavior=o.scrollBehavior=`auto`),window.scroll(this._previousScrollPosition.left,this._previousScrollPosition.top),Ae&&(e.scrollBehavior=s,o.scrollBehavior=r)}}_canBeEnabled(){if(this._document.documentElement.classList.contains(`cdk-global-scrollblock`)||this._isEnabled)return!1;let t=this._document.documentElement,e=this._viewportRuler.getViewportSize();return t.scrollHeight>e.height||t.scrollWidth>e.width}};function Ie(n,i){return new Et(n.get(ct),n.get(me),n.get(J),i)}var Et=class{_scrollDispatcher;_ngZone;_viewportRuler;_config;_scrollSubscription=null;_overlayRef;_initialScrollPosition;constructor(i,t,e,o){this._scrollDispatcher=i,this._ngZone=t,this._viewportRuler=e,this._config=o}attach(i){this._overlayRef,this._overlayRef=i}enable(){if(this._scrollSubscription)return;let i=this._scrollDispatcher.scrolled(0).pipe(Ae$2(t=>!t||!this._overlayRef.overlayElement.contains(t.getElementRef().nativeElement)));this._config&&this._config.threshold&&this._config.threshold>1?(this._initialScrollPosition=this._viewportRuler.getViewportScrollPosition().top,this._scrollSubscription=i.subscribe(()=>{let t=this._viewportRuler.getViewportScrollPosition().top;Math.abs(t-this._initialScrollPosition)>this._config.threshold?this._detach():this._overlayRef.updatePosition()})):this._scrollSubscription=i.subscribe(this._detach)}disable(){this._scrollSubscription&&(this._scrollSubscription.unsubscribe(),this._scrollSubscription=null)}detach(){this.disable(),this._overlayRef=null}_detach=()=>{this.disable(),this._overlayRef.hasAttached()&&this._ngZone.run(()=>this._overlayRef.detach())}};var ut=class{enable(){}disable(){}attach(){}};function ee(n,i){return i.some(t=>{let e=n.bottom<t.top,o=n.top>t.bottom,s=n.right<t.left,r=n.left>t.right;return e||o||s||r})}function Me(n,i){return i.some(t=>{let e=n.top<t.top,o=n.bottom>t.bottom,s=n.left<t.left,r=n.right>t.right;return e||o||s||r})}function se(n,i){return new Pt(n.get(ct),n.get(J),n.get(me),i)}var Pt=class{_scrollDispatcher;_viewportRuler;_ngZone;_config;_scrollSubscription=null;_overlayRef;constructor(i,t,e,o){this._scrollDispatcher=i,this._viewportRuler=t,this._ngZone=e,this._config=o}attach(i){this._overlayRef,this._overlayRef=i}enable(){if(!this._scrollSubscription){let i=this._config?this._config.scrollThrottle:0;this._scrollSubscription=this._scrollDispatcher.scrolled(i).subscribe(()=>{if(this._overlayRef.updatePosition(),this._config&&this._config.autoClose){let t=this._overlayRef.overlayElement.getBoundingClientRect(),{width:e,height:o}=this._viewportRuler.getViewportSize();ee(t,[{width:e,height:o,bottom:o,right:e,top:0,left:0}])&&(this.disable(),this._ngZone.run(()=>this._overlayRef.detach()))}})}}disable(){this._scrollSubscription&&(this._scrollSubscription.unsubscribe(),this._scrollSubscription=null)}detach(){this.disable(),this._overlayRef=null}};var Ve$1=(()=>{class n{_injector=p(ge$1);noop=()=>new ut;close=t=>Ie(this._injector,t);block=()=>nt$1(this._injector);reposition=t=>se(this._injector,t);static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var X=class{positionStrategy;scrollStrategy=new ut;panelClass=``;hasBackdrop=!1;backdropClass=`cdk-overlay-dark-backdrop`;disableAnimations;width;height;minWidth;minHeight;maxWidth;maxHeight;direction;disposeOnNavigation=!1;usePopover;eventPredicate;constructor(i){if(i){let t=Object.keys(i);for(let e of t)i[e]!==void 0&&(this[e]=i[e])}}};var At=class{connectionPair;scrollableViewProperties;constructor(i,t){this.connectionPair=i,this.scrollableViewProperties=t}};var ze$1=(()=>{class n{_attachedOverlays=[];_document=p(H$2);_isAttached=!1;ngOnDestroy(){this.detach()}add(t){this.remove(t),this._attachedOverlays.push(t)}remove(t){let e=this._attachedOverlays.indexOf(t);e>-1&&this._attachedOverlays.splice(e,1),this._attachedOverlays.length===0&&this.detach()}canReceiveEvent(t,e,o){return o.observers.length<1?!1:t.eventPredicate?t.eventPredicate(e):!0}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var je=(()=>{class n extends ze$1{_ngZone=p(me);_renderer=p(qn).createRenderer(null,null);_cleanupKeydown;add(t){super.add(t),this._isAttached||(this._ngZone.runOutsideAngular(()=>{this._cleanupKeydown=this._renderer.listen(`body`,`keydown`,this._keydownListener)}),this._isAttached=!0)}detach(){this._isAttached&&(this._cleanupKeydown?.(),this._isAttached=!1)}_keydownListener=t=>{let e=this._attachedOverlays;for(let o=e.length-1;o>-1;o--){let s=e[o];if(this.canReceiveEvent(s,t,s._keydownEvents)){this._ngZone.run(()=>s._keydownEvents.next(t));break}}};static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var We$1=(()=>{class n extends ze$1{_platform=p(b);_ngZone=p(me);_renderer=p(qn).createRenderer(null,null);_cursorOriginalValue;_cursorStyleIsSet=!1;_pointerDownEventTarget=null;_cleanups;add(t){if(super.add(t),!this._isAttached){let e=this._document.body,o={capture:!0},s=this._renderer;this._cleanups=this._ngZone.runOutsideAngular(()=>[s.listen(e,`pointerdown`,this._pointerDownListener,o),s.listen(e,`click`,this._clickListener,o),s.listen(e,`auxclick`,this._clickListener,o),s.listen(e,`contextmenu`,this._clickListener,o)]),this._platform.IOS&&!this._cursorStyleIsSet&&(this._cursorOriginalValue=e.style.cursor,e.style.cursor=`pointer`,this._cursorStyleIsSet=!0),this._isAttached=!0}}detach(){this._isAttached&&(this._cleanups?.forEach(t=>t()),this._cleanups=void 0,this._platform.IOS&&this._cursorStyleIsSet&&(this._document.body.style.cursor=this._cursorOriginalValue,this._cursorStyleIsSet=!1),this._isAttached=!1)}_pointerDownListener=t=>{this._pointerDownEventTarget=N$2(t)};_clickListener=t=>{let e=N$2(t),o=t.type===`click`&&this._pointerDownEventTarget?this._pointerDownEventTarget:e;this._pointerDownEventTarget=null;let s=this._attachedOverlays.slice();for(let r=s.length-1;r>-1;r--){let a=s[r],c=a._outsidePointerEvents;if(!(!a.hasAttached()||!this.canReceiveEvent(a,t,c))){if(Te(a.overlayElement,e)||Te(a.overlayElement,o))break;this._ngZone?this._ngZone.run(()=>c.next(t)):c.next(t)}}};static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();function Te(n,i){let t=typeof ShadowRoot<`u`&&ShadowRoot,e=i;for(;e;){if(e===n)return!0;e=t&&e instanceof ShadowRoot?e.host:e.parentNode}return!1}var He$1=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵcmp=Jn({type:n,selectors:[[`ng-component`]],hostAttrs:[`cdk-overlay-style-loader`,``],decls:0,vars:0,template:function(e,o){},styles:[`.cdk-overlay-container, .cdk-global-overlay-wrapper {
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
`],encapsulation:2})}return n})();var Ft=(()=>{class n{_platform=p(b);_containerElement;_document=p(H$2);_styleLoader=p(bN);ngOnDestroy(){this._containerElement?.remove()}getContainerElement(){return this._loadStyles(),this._containerElement||this._createContainer(),this._containerElement}_createContainer(){let t=`cdk-overlay-container`;if(this._platform.isBrowser||Lo$1()){let o=this._document.querySelectorAll(`.${t}[platform="server"], .${t}[platform="test"]`);for(let s=0;s<o.length;s++)o[s].remove()}let e=this._document.createElement(`div`);e.classList.add(t),Lo$1()?e.setAttribute(`platform`,`test`):this._platform.isBrowser||e.setAttribute(`platform`,`server`),this._document.body.appendChild(e),this._containerElement=e}_loadStyles(){this._styleLoader.load(He$1)}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var ie=class{_renderer;_ngZone;element;_cleanupClick;_cleanupTransitionEnd;_fallbackTimeout;constructor(i,t,e,o){this._renderer=t,this._ngZone=e,this.element=i.createElement(`div`),this.element.classList.add(`cdk-overlay-backdrop`),this._cleanupClick=t.listen(this.element,`click`,o)}detach(){this._ngZone.runOutsideAngular(()=>{let i=this.element;clearTimeout(this._fallbackTimeout),this._cleanupTransitionEnd?.(),this._cleanupTransitionEnd=this._renderer.listen(i,`transitionend`,this.dispose),this._fallbackTimeout=setTimeout(this.dispose,500),i.style.pointerEvents=`none`,i.classList.remove(`cdk-overlay-backdrop-showing`)})}dispose=()=>{clearTimeout(this._fallbackTimeout),this._cleanupClick?.(),this._cleanupTransitionEnd?.(),this._cleanupClick=this._cleanupTransitionEnd=this._fallbackTimeout=void 0,this.element.remove()}};function re(n){return n&&n.nodeType===1}var it$1=class{_portalOutlet;_host;_pane;_config;_ngZone;_keyboardDispatcher;_document;_location;_outsideClickDispatcher;_animationsDisabled;_injector;_renderer;_backdropClick=new Z;_attachments=new Z;_detachments=new Z;_positionStrategy;_scrollStrategy;_locationChanges=ne$2.EMPTY;_backdropRef=null;_detachContentMutationObserver;_detachContentAfterRenderRef;_disposed=!1;_previousHostParent;_keydownEvents=new Z;_outsidePointerEvents=new Z;_afterNextRenderRef;constructor(i,t,e,o,s,r,a,c,d,h=!1,u,m){this._portalOutlet=i,this._host=t,this._pane=e,this._config=o,this._ngZone=s,this._keyboardDispatcher=r,this._document=a,this._location=c,this._outsideClickDispatcher=d,this._animationsDisabled=h,this._injector=u,this._renderer=m,o.scrollStrategy&&(this._scrollStrategy=o.scrollStrategy,this._scrollStrategy.attach(this)),this._positionStrategy=o.positionStrategy}get overlayElement(){return this._pane}get backdropElement(){return this._backdropRef?.element||null}get hostElement(){return this._host}get eventPredicate(){return this._config?.eventPredicate||null}attach(i){if(this._disposed)return null;this._attachHost();let t=this._portalOutlet.attach(i);return this._positionStrategy?.attach(this),this._updateStackingOrder(),this._updateElementSize(),this._updateElementDirection(),this._scrollStrategy&&this._scrollStrategy.enable(),this._afterNextRenderRef?.destroy(),this._afterNextRenderRef=rd(()=>{this.hasAttached()&&this.updatePosition()},{injector:this._injector}),this._togglePointerEvents(!0),this._config.hasBackdrop&&this._attachBackdrop(),this._config.panelClass&&this._toggleClasses(this._pane,this._config.panelClass,!0),this._attachments.next(),this._completeDetachContent(),this._keyboardDispatcher.add(this),this._config.disposeOnNavigation&&(this._locationChanges=this._location.subscribe(()=>this.dispose())),this._outsideClickDispatcher.add(this),typeof t?.onDestroy==`function`&&t.onDestroy(()=>{this.hasAttached()&&this._ngZone.runOutsideAngular(()=>Promise.resolve().then(()=>this.detach()))}),t}detach(){if(!this.hasAttached())return;this.detachBackdrop(),this._togglePointerEvents(!1),this._positionStrategy&&this._positionStrategy.detach&&this._positionStrategy.detach(),this._scrollStrategy&&this._scrollStrategy.disable();let i=this._portalOutlet.detach();return this._detachments.next(),this._completeDetachContent(),this._keyboardDispatcher.remove(this),this._detachContentWhenEmpty(),this._locationChanges.unsubscribe(),this._outsideClickDispatcher.remove(this),i}dispose(){if(this._disposed)return;let i=this.hasAttached();this._positionStrategy&&this._positionStrategy.dispose(),this._disposeScrollStrategy(),this._backdropRef?.dispose(),this._locationChanges.unsubscribe(),this._keyboardDispatcher.remove(this),this._portalOutlet.dispose(),this._attachments.complete(),this._backdropClick.complete(),this._keydownEvents.complete(),this._outsidePointerEvents.complete(),this._outsideClickDispatcher.remove(this),this._host?.remove(),this._afterNextRenderRef?.destroy(),this._previousHostParent=this._pane=this._host=this._backdropRef=null,i&&this._detachments.next(),this._detachments.complete(),this._completeDetachContent(),this._disposed=!0}hasAttached(){return this._portalOutlet.hasAttached()}backdropClick(){return this._backdropClick}attachments(){return this._attachments}detachments(){return this._detachments}keydownEvents(){return this._keydownEvents}outsidePointerEvents(){return this._outsidePointerEvents}getConfig(){return this._config}updatePosition(){this._positionStrategy&&this._positionStrategy.apply()}updatePositionStrategy(i){i!==this._positionStrategy&&(this._positionStrategy&&this._positionStrategy.dispose(),this._positionStrategy=i,this.hasAttached()&&(i.attach(this),this.updatePosition()))}updateSize(i){this._config=m$1(m$1({},this._config),i),this._updateElementSize()}setDirection(i){this._config=P$1(m$1({},this._config),{direction:i}),this._updateElementDirection()}addPanelClass(i){this._pane&&this._toggleClasses(this._pane,i,!0)}removePanelClass(i){this._pane&&this._toggleClasses(this._pane,i,!1)}getDirection(){let i=this._config.direction;return i?typeof i==`string`?i:i.value:`ltr`}updateScrollStrategy(i){i!==this._scrollStrategy&&(this._disposeScrollStrategy(),this._scrollStrategy=i,this.hasAttached()&&(i.attach(this),i.enable()))}_updateElementDirection(){this._host.setAttribute(`dir`,this.getDirection())}_updateElementSize(){if(!this._pane)return;let i=this._pane.style;i.width=$o(this._config.width),i.height=$o(this._config.height),i.minWidth=$o(this._config.minWidth),i.minHeight=$o(this._config.minHeight),i.maxWidth=$o(this._config.maxWidth),i.maxHeight=$o(this._config.maxHeight)}_togglePointerEvents(i){this._pane.style.pointerEvents=i?``:`none`}_attachHost(){if(!this._host.parentElement){let i=this._config.usePopover?this._positionStrategy?.getPopoverInsertionPoint?.():null;re(i)?i.after(this._host):i?.type===`parent`?i.element.appendChild(this._host):this._previousHostParent?.appendChild(this._host)}if(this._config.usePopover)try{this._host.showPopover()}catch{}}_attachBackdrop(){let i=`cdk-overlay-backdrop-showing`;this._backdropRef?.dispose(),this._backdropRef=new ie(this._document,this._renderer,this._ngZone,t=>{this._backdropClick.next(t)}),this._animationsDisabled&&this._backdropRef.element.classList.add(`cdk-overlay-backdrop-noop-animation`),this._config.backdropClass&&this._toggleClasses(this._backdropRef.element,this._config.backdropClass,!0),this._config.usePopover?this._host.prepend(this._backdropRef.element):this._host.parentElement.insertBefore(this._backdropRef.element,this._host),!this._animationsDisabled&&typeof requestAnimationFrame<`u`?this._ngZone.runOutsideAngular(()=>{requestAnimationFrame(()=>this._backdropRef?.element.classList.add(i))}):this._backdropRef.element.classList.add(i)}_updateStackingOrder(){!this._config.usePopover&&this._host.nextSibling&&this._host.parentNode.appendChild(this._host)}detachBackdrop(){this._animationsDisabled?(this._backdropRef?.dispose(),this._backdropRef=null):this._backdropRef?.detach()}_toggleClasses(i,t,e){let o=Mt$1(t||[]).filter(s=>!!s);o.length&&(e?i.classList.add(...o):i.classList.remove(...o))}_detachContentWhenEmpty(){let i=!1;try{this._detachContentAfterRenderRef=rd(()=>{i=!0,this._detachContent()},{injector:this._injector})}catch(t){if(i)throw t;this._detachContent()}globalThis.MutationObserver&&this._pane&&(this._detachContentMutationObserver||=new globalThis.MutationObserver(()=>{this._detachContent()}),this._detachContentMutationObserver.observe(this._pane,{childList:!0}))}_detachContent(){(!this._pane||!this._host||this._pane.children.length===0)&&(this._pane&&this._config.panelClass&&this._toggleClasses(this._pane,this._config.panelClass,!1),this._host&&this._host.parentElement&&(this._previousHostParent=this._host.parentElement,this._host.remove()),this._completeDetachContent())}_completeDetachContent(){this._detachContentAfterRenderRef?.destroy(),this._detachContentAfterRenderRef=void 0,this._detachContentMutationObserver?.disconnect()}_disposeScrollStrategy(){let i=this._scrollStrategy;i?.disable(),i?.detach?.()}};var Fe=`cdk-overlay-connected-position-bounding-box`;var oi=/([A-Za-z%]+)$/;function ae(n,i){return new Mt(i,n.get(J),n.get(H$2),n.get(b),n.get(Ft))}var Mt=class{_viewportRuler;_document;_platform;_overlayContainer;_overlayRef;_isInitialRender=!1;_lastBoundingBoxSize={width:0,height:0};_isPushed=!1;_canPush=!0;_growAfterOpen=!1;_hasFlexibleDimensions=!0;_positionLocked=!1;_originRect;_overlayRect;_viewportRect;_containerRect;_viewportMargin=0;_scrollables=[];_preferredPositions=[];_origin;_pane;_isDisposed=!1;_boundingBox=null;_lastPosition=null;_lastScrollVisibility=null;_positionChanges=new Z;_resizeSubscription=ne$2.EMPTY;_offsetX=0;_offsetY=0;_transformOriginSelector;_appliedPanelClasses=[];_previousPushAmount=null;_popoverLocation=`global`;positionChanges=this._positionChanges;get positions(){return this._preferredPositions}constructor(i,t,e,o,s){this._viewportRuler=t,this._document=e,this._platform=o,this._overlayContainer=s,this.setOrigin(i)}attach(i){this._overlayRef&&this._overlayRef,this._validatePositions(),i.hostElement.classList.add(Fe),this._overlayRef=i,this._boundingBox=i.hostElement,this._pane=i.overlayElement,this._isDisposed=!1,this._isInitialRender=!0,this._lastPosition=null,this._resizeSubscription.unsubscribe(),this._resizeSubscription=this._viewportRuler.change().subscribe(()=>{this._isInitialRender=!0,this.apply()})}apply(){if(this._isDisposed||!this._platform.isBrowser)return;if(!this._isInitialRender&&this._positionLocked&&this._lastPosition){this.reapplyLastPosition();return}this._clearPanelClasses(),this._resetOverlayElementStyles(),this._resetBoundingBoxStyles(),this._viewportRect=this._getNarrowedViewportRect(),this._originRect=this._getOriginRect(),this._overlayRect=this._pane.getBoundingClientRect(),this._containerRect=this._getContainerRect();let i=this._originRect,t=this._overlayRect,e=this._viewportRect,o=this._containerRect,s=[],r;for(let a of this._preferredPositions){let c=this._getOriginPoint(i,o,a),d=this._getOverlayPoint(c,t,a),h=this._getOverlayFit(d,t,e,a);if(h.isCompletelyWithinViewport){this._isPushed=!1,this._applyPosition(a,c);return}if(this._canFitWithFlexibleDimensions(h,d,e)){s.push({position:a,origin:c,overlayRect:t,boundingBoxRect:this._calculateBoundingBoxRect(c,a)});continue}(!r||r.overlayFit.visibleArea<h.visibleArea)&&(r={overlayFit:h,overlayPoint:d,originPoint:c,position:a,overlayRect:t})}if(s.length){let a=null,c=-1;for(let d of s){let h=d.boundingBoxRect.width*d.boundingBoxRect.height*(d.position.weight||1);h>c&&(c=h,a=d)}this._isPushed=!1,this._applyPosition(a.position,a.origin);return}if(this._canPush){this._isPushed=!0,this._applyPosition(r.position,r.originPoint);return}this._applyPosition(r.position,r.originPoint)}detach(){this._clearPanelClasses(),this._lastPosition=null,this._previousPushAmount=null,this._resizeSubscription.unsubscribe()}dispose(){this._isDisposed||(this._boundingBox&&Y(this._boundingBox.style,{top:``,left:``,right:``,bottom:``,height:``,width:``,alignItems:``,justifyContent:``}),this._pane&&this._resetOverlayElementStyles(),this._overlayRef&&this._overlayRef.hostElement.classList.remove(Fe),this.detach(),this._positionChanges.complete(),this._overlayRef=this._boundingBox=null,this._isDisposed=!0)}reapplyLastPosition(){if(this._isDisposed||!this._platform.isBrowser)return;let i=this._lastPosition;i?(this._originRect=this._getOriginRect(),this._overlayRect=this._pane.getBoundingClientRect(),this._viewportRect=this._getNarrowedViewportRect(),this._containerRect=this._getContainerRect(),this._applyPosition(i,this._getOriginPoint(this._originRect,this._containerRect,i))):this.apply()}withScrollableContainers(i){return this._scrollables=i,this}withPositions(i){return this._preferredPositions=i,i.indexOf(this._lastPosition)===-1&&(this._lastPosition=null),this._validatePositions(),this}withViewportMargin(i){return this._viewportMargin=i,this}withFlexibleDimensions(i=!0){return this._hasFlexibleDimensions=i,this}withGrowAfterOpen(i=!0){return this._growAfterOpen=i,this}withPush(i=!0){return this._canPush=i,this}withLockedPosition(i=!0){return this._positionLocked=i,this}setOrigin(i){return this._origin=i,this}withDefaultOffsetX(i){return this._offsetX=i,this}withDefaultOffsetY(i){return this._offsetY=i,this}withTransformOriginOn(i){return this._transformOriginSelector=i,this}withPopoverLocation(i){return this._popoverLocation=i,this}getPopoverInsertionPoint(){return this._popoverLocation===`global`?null:this._popoverLocation!==`inline`?this._popoverLocation:this._origin instanceof nt$3?this._origin.nativeElement:re(this._origin)?this._origin:null}_getOriginPoint(i,t,e){let o;if(e.originX==`center`)o=i.left+i.width/2;else{let r=this._isRtl()?i.right:i.left,a=this._isRtl()?i.left:i.right;o=e.originX==`start`?r:a}t.left<0&&(o-=t.left);let s;return e.originY==`center`?s=i.top+i.height/2:s=e.originY==`top`?i.top:i.bottom,t.top<0&&(s-=t.top),{x:o,y:s}}_getOverlayPoint(i,t,e){let o;e.overlayX==`center`?o=-t.width/2:e.overlayX===`start`?o=this._isRtl()?-t.width:0:o=this._isRtl()?0:-t.width;let s;return e.overlayY==`center`?s=-t.height/2:s=e.overlayY==`top`?0:-t.height,{x:i.x+o,y:i.y+s}}_getOverlayFit(i,t,e,o){let s=Ne(t),{x:r,y:a}=i,c=this._getOffset(o,`x`),d=this._getOffset(o,`y`);c&&(r+=c),d&&(a+=d);let h=0-r,u=r+s.width-e.width,m=0-a,O=a+s.height-e.height,y=this._subtractOverflows(s.width,h,u),E=this._subtractOverflows(s.height,m,O),pe=y*E;return{visibleArea:pe,isCompletelyWithinViewport:s.width*s.height===pe,fitsInViewportVertically:E===s.height,fitsInViewportHorizontally:y==s.width}}_canFitWithFlexibleDimensions(i,t,e){if(this._hasFlexibleDimensions){let o=e.bottom-t.y,s=e.right-t.x,r=Be$1(this._overlayRef.getConfig().minHeight),a=Be$1(this._overlayRef.getConfig().minWidth),c=i.fitsInViewportVertically||r!=null&&r<=o,d=i.fitsInViewportHorizontally||a!=null&&a<=s;return c&&d}return!1}_pushOverlayOnScreen(i,t,e){if(this._previousPushAmount&&this._positionLocked)return{x:i.x+this._previousPushAmount.x,y:i.y+this._previousPushAmount.y};let o=Ne(t),s=this._viewportRect,r=Math.max(i.x+o.width-s.width,0),a=Math.max(i.y+o.height-s.height,0),c=Math.max(s.top-e.top-i.y,0),d=Math.max(s.left-e.left-i.x,0),h=0,u=0;return o.width<=s.width?h=d||-r:h=i.x<this._getViewportMarginStart()?s.left-e.left-i.x:0,o.height<=s.height?u=c||-a:u=i.y<this._getViewportMarginTop()?s.top-e.top-i.y:0,this._previousPushAmount={x:h,y:u},{x:i.x+h,y:i.y+u}}_applyPosition(i,t){if(this._setTransformOrigin(i),this._setOverlayElementStyles(t,i),this._setBoundingBoxStyles(t,i),i.panelClass&&this._addPanelClasses(i.panelClass),this._positionChanges.observers.length){let e=this._getScrollVisibility();if(i!==this._lastPosition||!this._lastScrollVisibility||!si(this._lastScrollVisibility,e)){let o=new At(i,e);this._positionChanges.next(o)}this._lastScrollVisibility=e}this._lastPosition=i,this._isInitialRender=!1}_setTransformOrigin(i){if(!this._transformOriginSelector)return;let t=this._boundingBox.querySelectorAll(this._transformOriginSelector),e,o=i.overlayY;i.overlayX===`center`?e=`center`:this._isRtl()?e=i.overlayX===`start`?`right`:`left`:e=i.overlayX===`start`?`left`:`right`;for(let s=0;s<t.length;s++)t[s].style.transformOrigin=`${e} ${o}`}_calculateBoundingBoxRect(i,t){let e=this._viewportRect,o=this._isRtl(),s,r,a;if(t.overlayY===`top`)r=i.y,s=e.height-r+this._getViewportMarginBottom();else if(t.overlayY===`bottom`)a=e.height-i.y+this._getViewportMarginTop()+this._getViewportMarginBottom(),s=e.height-a+this._getViewportMarginTop();else{let O=Math.min(e.bottom-i.y+e.top,i.y),y=this._lastBoundingBoxSize.height;s=O*2,r=i.y-O,s>y&&!this._isInitialRender&&!this._growAfterOpen&&(r=i.y-y/2)}let c=t.overlayX===`start`&&!o||t.overlayX===`end`&&o,d=t.overlayX===`end`&&!o||t.overlayX===`start`&&o,h,u,m;if(d)m=e.width-i.x+this._getViewportMarginStart()+this._getViewportMarginEnd(),h=i.x-this._getViewportMarginStart();else if(c)u=i.x,h=e.right-i.x-this._getViewportMarginEnd();else{let O=Math.min(e.right-i.x+e.left,i.x),y=this._lastBoundingBoxSize.width;h=O*2,u=i.x-O,h>y&&!this._isInitialRender&&!this._growAfterOpen&&(u=i.x-y/2)}return{top:r,left:u,bottom:a,right:m,width:h,height:s}}_setBoundingBoxStyles(i,t){let e=this._calculateBoundingBoxRect(i,t);!this._isInitialRender&&!this._growAfterOpen&&(e.height=Math.min(e.height,this._lastBoundingBoxSize.height),e.width=Math.min(e.width,this._lastBoundingBoxSize.width));let o={};if(this._hasExactPosition())o.top=o.left=`0`,o.bottom=o.right=`auto`,o.maxHeight=o.maxWidth=``,o.width=o.height=`100%`;else{let s=this._overlayRef.getConfig().maxHeight,r=this._overlayRef.getConfig().maxWidth;o.width=$o(e.width),o.height=$o(e.height),o.top=$o(e.top)||`auto`,o.bottom=$o(e.bottom)||`auto`,o.left=$o(e.left)||`auto`,o.right=$o(e.right)||`auto`,t.overlayX===`center`?o.alignItems=`center`:o.alignItems=t.overlayX===`end`?`flex-end`:`flex-start`,t.overlayY===`center`?o.justifyContent=`center`:o.justifyContent=t.overlayY===`bottom`?`flex-end`:`flex-start`,s&&(o.maxHeight=$o(s)),r&&(o.maxWidth=$o(r))}this._lastBoundingBoxSize=e,Y(this._boundingBox.style,o)}_resetBoundingBoxStyles(){Y(this._boundingBox.style,{top:`0`,left:`0`,right:`0`,bottom:`0`,height:``,width:``,alignItems:``,justifyContent:``})}_resetOverlayElementStyles(){Y(this._pane.style,{top:``,left:``,bottom:``,right:``,position:``,transform:``})}_setOverlayElementStyles(i,t){let e={},o=this._hasExactPosition(),s=this._hasFlexibleDimensions,r=this._overlayRef.getConfig();if(o){let h=this._viewportRuler.getViewportScrollPosition();Y(e,this._getExactOverlayY(t,i,h)),Y(e,this._getExactOverlayX(t,i,h))}else e.position=`static`;let a=``,c=this._getOffset(t,`x`),d=this._getOffset(t,`y`);c&&(a+=`translateX(${c}px) `),d&&(a+=`translateY(${d}px)`),e.transform=a.trim(),r.maxHeight&&(o?e.maxHeight=$o(r.maxHeight):s&&(e.maxHeight=``)),r.maxWidth&&(o?e.maxWidth=$o(r.maxWidth):s&&(e.maxWidth=``)),Y(this._pane.style,e)}_getExactOverlayY(i,t,e){let o={top:``,bottom:``},s=this._getOverlayPoint(t,this._overlayRect,i);if(this._isPushed&&(s=this._pushOverlayOnScreen(s,this._overlayRect,e)),i.overlayY===`bottom`)o.bottom=`${this._document.documentElement.clientHeight-(s.y+this._overlayRect.height)}px`;else o.top=$o(s.y);return o}_getExactOverlayX(i,t,e){let o={left:``,right:``},s=this._getOverlayPoint(t,this._overlayRect,i);this._isPushed&&(s=this._pushOverlayOnScreen(s,this._overlayRect,e));let r;if(this._isRtl()?r=i.overlayX===`end`?`left`:`right`:r=i.overlayX===`end`?`right`:`left`,r===`right`)o.right=`${this._document.documentElement.clientWidth-(s.x+this._overlayRect.width)}px`;else o.left=$o(s.x);return o}_getScrollVisibility(){let i=this._getOriginRect(),t=this._pane.getBoundingClientRect(),e=this._scrollables.map(o=>o.getElementRef().nativeElement.getBoundingClientRect());return{isOriginClipped:Me(i,e),isOriginOutsideView:ee(i,e),isOverlayClipped:Me(t,e),isOverlayOutsideView:ee(t,e)}}_subtractOverflows(i,...t){return t.reduce((e,o)=>e-Math.max(o,0),i)}_getNarrowedViewportRect(){let i=this._document.documentElement.clientWidth,t=this._document.documentElement.clientHeight,e=this._viewportRuler.getViewportScrollPosition();return{top:e.top+this._getViewportMarginTop(),left:e.left+this._getViewportMarginStart(),right:e.left+i-this._getViewportMarginEnd(),bottom:e.top+t-this._getViewportMarginBottom(),width:i-this._getViewportMarginStart()-this._getViewportMarginEnd(),height:t-this._getViewportMarginTop()-this._getViewportMarginBottom()}}_isRtl(){return this._overlayRef.getDirection()===`rtl`}_hasExactPosition(){return!this._hasFlexibleDimensions||this._isPushed}_getOffset(i,t){return t===`x`?i.offsetX==null?this._offsetX:i.offsetX:i.offsetY==null?this._offsetY:i.offsetY}_validatePositions(){}_addPanelClasses(i){this._pane&&Mt$1(i).forEach(t=>{t!==``&&this._appliedPanelClasses.indexOf(t)===-1&&(this._appliedPanelClasses.push(t),this._pane.classList.add(t))})}_clearPanelClasses(){this._pane&&(this._appliedPanelClasses.forEach(i=>{this._pane.classList.remove(i)}),this._appliedPanelClasses=[])}_getViewportMarginStart(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.start??0}_getViewportMarginEnd(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.end??0}_getViewportMarginTop(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.top??0}_getViewportMarginBottom(){return typeof this._viewportMargin==`number`?this._viewportMargin:this._viewportMargin?.bottom??0}_getOriginRect(){let i=this._origin;if(i instanceof nt$3)return i.nativeElement.getBoundingClientRect();if(i instanceof Element)return i.getBoundingClientRect();let t=i.width||0,e=i.height||0;return{top:i.y,bottom:i.y+e,left:i.x,right:i.x+t,height:e,width:t}}_getContainerRect(){let i=this._overlayRef.getConfig().usePopover&&this._popoverLocation!==`global`,t=this._overlayContainer.getContainerElement();i&&(t.style.display=`block`);let e=t.getBoundingClientRect();return i&&(t.style.display=``),e}};function Y(n,i){for(let t in i)i.hasOwnProperty(t)&&(n[t]=i[t]);return n}function Be$1(n){if(typeof n!=`number`&&n!=null){let[i,t]=n.split(oi);return!t||t===`px`?parseFloat(i):null}return n||null}function Ne(n){return{top:Math.floor(n.top),right:Math.floor(n.right),bottom:Math.floor(n.bottom),left:Math.floor(n.left),width:Math.floor(n.width),height:Math.floor(n.height)}}function si(n,i){return n===i?!0:n.isOriginClipped===i.isOriginClipped&&n.isOriginOutsideView===i.isOriginOutsideView&&n.isOverlayClipped===i.isOverlayClipped&&n.isOverlayOutsideView===i.isOverlayOutsideView}var Le$1=`cdk-global-overlay-wrapper`;function ot$1(n){return new Tt}var Tt=class{_overlayRef;_cssPosition=`static`;_topOffset=``;_bottomOffset=``;_alignItems=``;_xPosition=``;_xOffset=``;_width=``;_height=``;_isDisposed=!1;attach(i){let t=i.getConfig();this._overlayRef=i,this._width&&!t.width&&i.updateSize({width:this._width}),this._height&&!t.height&&i.updateSize({height:this._height}),i.hostElement.classList.add(Le$1),this._isDisposed=!1}top(i=``){return this._bottomOffset=``,this._topOffset=i,this._alignItems=`flex-start`,this}left(i=``){return this._xOffset=i,this._xPosition=`left`,this}bottom(i=``){return this._topOffset=``,this._bottomOffset=i,this._alignItems=`flex-end`,this}right(i=``){return this._xOffset=i,this._xPosition=`right`,this}start(i=``){return this._xOffset=i,this._xPosition=`start`,this}end(i=``){return this._xOffset=i,this._xPosition=`end`,this}width(i=``){return this._overlayRef?this._overlayRef.updateSize({width:i}):this._width=i,this}height(i=``){return this._overlayRef?this._overlayRef.updateSize({height:i}):this._height=i,this}centerHorizontally(i=``){return this.left(i),this._xPosition=`center`,this}centerVertically(i=``){return this.top(i),this._alignItems=`center`,this}apply(){if(!this._overlayRef||!this._overlayRef.hasAttached())return;let i=this._overlayRef.overlayElement.style,t=this._overlayRef.hostElement.style,{width:o,height:s,maxWidth:r,maxHeight:a}=this._overlayRef.getConfig(),c=(o===`100%`||o===`100vw`)&&(!r||r===`100%`||r===`100vw`),d=(s===`100%`||s===`100vh`)&&(!a||a===`100%`||a===`100vh`),h=this._xPosition,u=this._xOffset,m=this._overlayRef.getConfig().direction===`rtl`,O=``,y=``,E=``;c?E=`flex-start`:h===`center`?(E=`center`,m?y=u:O=u):m?h===`left`||h===`end`?(E=`flex-end`,O=u):(h===`right`||h===`start`)&&(E=`flex-start`,y=u):h===`left`||h===`start`?(E=`flex-start`,O=u):(h===`right`||h===`end`)&&(E=`flex-end`,y=u),i.position=this._cssPosition,i.marginLeft=c?`0`:O,i.marginTop=d?`0`:this._topOffset,i.marginBottom=this._bottomOffset,i.marginRight=c?`0`:y,t.justifyContent=E,t.alignItems=d?`flex-start`:this._alignItems}dispose(){if(this._isDisposed||!this._overlayRef)return;let i=this._overlayRef.overlayElement.style,t=this._overlayRef.hostElement,e=t.style;t.classList.remove(Le$1),e.justifyContent=e.alignItems=i.marginTop=i.marginBottom=i.marginLeft=i.marginRight=i.position=``,this._overlayRef=null,this._isDisposed=!0}};var Ye$1=(()=>{class n{_injector=p(ge$1);global(){return ot$1()}flexibleConnectedTo(t){return ae(this._injector,t)}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var le=new y$1(`OVERLAY_DEFAULT_CONFIG`);function ft(n,i){n.get(bN).load(He$1);let t=n.get(Ft),e=n.get(H$2),o=n.get(Ft$1),s=n.get(Pt$2),r=n.get(AN),a=n.get(Zn,null,{optional:!0})||n.get(qn).createRenderer(null,null),c=new X(i),d=n.get(le,null,{optional:!0})?.usePopover??!0;c.direction=c.direction||r.value,!e.body||!(`showPopover`in e.body)?c.usePopover=!1:c.usePopover=i?.usePopover??d;let h=e.createElement(`div`),u=e.createElement(`div`);h.id=o.getId(`cdk-overlay-`),h.classList.add(`cdk-overlay-pane`),u.appendChild(h),c.usePopover&&(u.setAttribute(`popover`,`manual`),u.classList.add(`cdk-overlay-popover`));let m=c.usePopover?c.positionStrategy?.getPopoverInsertionPoint?.():null;return re(m)?m.after(u):m?.type===`parent`?m.element.appendChild(u):t.getContainerElement().appendChild(u),new it$1(new Rt(h,s,n),u,h,c,n.get(me),n.get(je),e,n.get(Wr),n.get(We$1),i?.disableAnimations??n.get(rI,null,{optional:!0})===`NoopAnimations`,n.get(Y$1),a)}var Xe$1=(()=>{class n{scrollStrategies=p(Ve$1);_positionBuilder=p(Ye$1);_injector=p(ge$1);create(t){return ft(this._injector,t)}position(){return this._positionBuilder}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var ri=[{originX:`start`,originY:`bottom`,overlayX:`start`,overlayY:`top`},{originX:`start`,originY:`top`,overlayX:`start`,overlayY:`bottom`},{originX:`end`,originY:`top`,overlayX:`end`,overlayY:`bottom`},{originX:`end`,originY:`bottom`,overlayX:`end`,overlayY:`top`}];var ai=new y$1(`cdk-connected-overlay-scroll-strategy`,{providedIn:`root`,factory:()=>{let n=p(ge$1);return()=>se(n)}});var ne$1=(()=>{class n{elementRef=p(nt$3);static ɵfac=function(e){return new(e||n)};static ɵdir=ot$2({type:n,selectors:[[``,`cdk-overlay-origin`,``],[``,`overlay-origin`,``],[``,`cdkOverlayOrigin`,``]],exportAs:[`cdkOverlayOrigin`]})}return n})();var Ge=new y$1(`cdk-connected-overlay-default-config`);var li=(()=>{class n{_dir=p(AN,{optional:!0});_injector=p(ge$1);_overlayRef;_templatePortal;_backdropSubscription=ne$2.EMPTY;_attachSubscription=ne$2.EMPTY;_detachSubscription=ne$2.EMPTY;_positionSubscription=ne$2.EMPTY;_offsetX;_offsetY;_position;_scrollStrategyFactory=p(ai);_ngZone=p(me);origin;positions;positionStrategy;get offsetX(){return this._offsetX}set offsetX(t){this._offsetX=t,this._position&&this._updatePositionStrategy(this._position)}get offsetY(){return this._offsetY}set offsetY(t){this._offsetY=t,this._position&&this._updatePositionStrategy(this._position)}width;height;minWidth;minHeight;backdropClass;panelClass;viewportMargin=0;scrollStrategy;open=!1;disableClose=!1;transformOriginSelector;hasBackdrop=!1;lockPosition=!1;flexibleDimensions=!1;growAfterOpen=!1;push=!1;disposeOnNavigation=!1;usePopover;matchWidth=!1;set _config(t){typeof t!=`string`&&this._assignConfig(t)}backdropClick=new ue$1;positionChange=new ue$1;attach=new ue$1;detach=new ue$1;overlayKeydown=new ue$1;overlayOutsideClick=new ue$1;constructor(){let t=p(un$1),e=p(Dt$1),o=p(Ge,{optional:!0}),s=p(le,{optional:!0});this.usePopover=s?.usePopover===!1?null:`global`,this._templatePortal=new W(t,e),this.scrollStrategy=this._scrollStrategyFactory(),o&&this._assignConfig(o)}get overlayRef(){return this._overlayRef}get dir(){return this._dir?this._dir.value:`ltr`}ngOnDestroy(){this._attachSubscription.unsubscribe(),this._detachSubscription.unsubscribe(),this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this._overlayRef?.dispose()}ngOnChanges(t){this._position&&(this._updatePositionStrategy(this._position),this._overlayRef?.updateSize({width:this._getWidth(),minWidth:this.minWidth,height:this.height,minHeight:this.minHeight}),t.origin&&this.open&&this._position.apply()),t.open&&(this.open?this.attachOverlay():this.detachOverlay())}_createOverlay(){(!this.positions||!this.positions.length)&&(this.positions=ri);let t=this._overlayRef=ft(this._injector,this._buildConfig());this._attachSubscription=t.attachments().subscribe(()=>this.attach.emit()),this._detachSubscription=t.detachments().subscribe(()=>this.detach.emit()),t.keydownEvents().subscribe(e=>{this.overlayKeydown.next(e),e.keyCode===27&&!this.disableClose&&!Le$2(e)&&(e.preventDefault(),this.detachOverlay())}),this._overlayRef.outsidePointerEvents().subscribe(e=>{let o=this._getOriginElement(),s=N$2(e);(!o||o!==s&&!o.contains(s))&&this.overlayOutsideClick.next(e)})}_buildConfig(){let t=this._position=this.positionStrategy||this._createPositionStrategy(),e=new X({direction:this._dir||`ltr`,positionStrategy:t,scrollStrategy:this.scrollStrategy,hasBackdrop:this.hasBackdrop,disposeOnNavigation:this.disposeOnNavigation,usePopover:!!this.usePopover});return(this.height||this.height===0)&&(e.height=this.height),(this.minWidth||this.minWidth===0)&&(e.minWidth=this.minWidth),(this.minHeight||this.minHeight===0)&&(e.minHeight=this.minHeight),this.backdropClass&&(e.backdropClass=this.backdropClass),this.panelClass&&(e.panelClass=this.panelClass),e}_updatePositionStrategy(t){let e=this.positions.map(o=>({originX:o.originX,originY:o.originY,overlayX:o.overlayX,overlayY:o.overlayY,offsetX:o.offsetX||this.offsetX,offsetY:o.offsetY||this.offsetY,panelClass:o.panelClass||void 0}));return t.setOrigin(this._getOrigin()).withPositions(e).withFlexibleDimensions(this.flexibleDimensions).withPush(this.push).withGrowAfterOpen(this.growAfterOpen).withViewportMargin(this.viewportMargin).withLockedPosition(this.lockPosition).withTransformOriginOn(this.transformOriginSelector).withPopoverLocation(this.usePopover===null?`global`:this.usePopover)}_createPositionStrategy(){let t=ae(this._injector,this._getOrigin());return this._updatePositionStrategy(t),t}_getOrigin(){return this.origin instanceof ne$1?this.origin.elementRef:this.origin}_getOriginElement(){return this.origin instanceof ne$1?this.origin.elementRef.nativeElement:this.origin instanceof nt$3?this.origin.nativeElement:typeof Element<`u`&&this.origin instanceof Element?this.origin:null}_getWidth(){return this.width?this.width:this.matchWidth?this._getOriginElement()?.getBoundingClientRect?.().width:void 0}attachOverlay(){this._overlayRef||this._createOverlay();let t=this._overlayRef;t.getConfig().hasBackdrop=this.hasBackdrop,t.updateSize({width:this._getWidth()}),t.hasAttached()||t.attach(this._templatePortal),this.hasBackdrop?this._backdropSubscription=t.backdropClick().subscribe(e=>this.backdropClick.emit(e)):this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this.positionChange.observers.length>0&&(this._positionSubscription=this._position.positionChanges.pipe(mE(()=>this.positionChange.observers.length>0)).subscribe(e=>{this._ngZone.run(()=>this.positionChange.emit(e)),this.positionChange.observers.length===0&&this._positionSubscription.unsubscribe()})),this.open=!0}detachOverlay(){this._overlayRef?.detach(),this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this.open=!1}_assignConfig(t){this.origin=t.origin??this.origin,this.positions=t.positions??this.positions,this.positionStrategy=t.positionStrategy??this.positionStrategy,this.offsetX=t.offsetX??this.offsetX,this.offsetY=t.offsetY??this.offsetY,this.width=t.width??this.width,this.height=t.height??this.height,this.minWidth=t.minWidth??this.minWidth,this.minHeight=t.minHeight??this.minHeight,this.backdropClass=t.backdropClass??this.backdropClass,this.panelClass=t.panelClass??this.panelClass,this.viewportMargin=t.viewportMargin??this.viewportMargin,this.scrollStrategy=t.scrollStrategy??this.scrollStrategy,this.disableClose=t.disableClose??this.disableClose,this.transformOriginSelector=t.transformOriginSelector??this.transformOriginSelector,this.hasBackdrop=t.hasBackdrop??this.hasBackdrop,this.lockPosition=t.lockPosition??this.lockPosition,this.flexibleDimensions=t.flexibleDimensions??this.flexibleDimensions,this.growAfterOpen=t.growAfterOpen??this.growAfterOpen,this.push=t.push??this.push,this.disposeOnNavigation=t.disposeOnNavigation??this.disposeOnNavigation,this.usePopover=t.usePopover??this.usePopover,this.matchWidth=t.matchWidth??this.matchWidth}static ɵfac=function(e){return new(e||n)};static ɵdir=ot$2({type:n,selectors:[[``,`cdk-connected-overlay`,``],[``,`connected-overlay`,``],[``,`cdkConnectedOverlay`,``]],inputs:{origin:[0,`cdkConnectedOverlayOrigin`,`origin`],positions:[0,`cdkConnectedOverlayPositions`,`positions`],positionStrategy:[0,`cdkConnectedOverlayPositionStrategy`,`positionStrategy`],offsetX:[0,`cdkConnectedOverlayOffsetX`,`offsetX`],offsetY:[0,`cdkConnectedOverlayOffsetY`,`offsetY`],width:[0,`cdkConnectedOverlayWidth`,`width`],height:[0,`cdkConnectedOverlayHeight`,`height`],minWidth:[0,`cdkConnectedOverlayMinWidth`,`minWidth`],minHeight:[0,`cdkConnectedOverlayMinHeight`,`minHeight`],backdropClass:[0,`cdkConnectedOverlayBackdropClass`,`backdropClass`],panelClass:[0,`cdkConnectedOverlayPanelClass`,`panelClass`],viewportMargin:[0,`cdkConnectedOverlayViewportMargin`,`viewportMargin`],scrollStrategy:[0,`cdkConnectedOverlayScrollStrategy`,`scrollStrategy`],open:[0,`cdkConnectedOverlayOpen`,`open`],disableClose:[0,`cdkConnectedOverlayDisableClose`,`disableClose`],transformOriginSelector:[0,`cdkConnectedOverlayTransformOriginOn`,`transformOriginSelector`],hasBackdrop:[2,`cdkConnectedOverlayHasBackdrop`,`hasBackdrop`,$r],lockPosition:[2,`cdkConnectedOverlayLockPosition`,`lockPosition`,$r],flexibleDimensions:[2,`cdkConnectedOverlayFlexibleDimensions`,`flexibleDimensions`,$r],growAfterOpen:[2,`cdkConnectedOverlayGrowAfterOpen`,`growAfterOpen`,$r],push:[2,`cdkConnectedOverlayPush`,`push`,$r],disposeOnNavigation:[2,`cdkConnectedOverlayDisposeOnNavigation`,`disposeOnNavigation`,$r],usePopover:[0,`cdkConnectedOverlayUsePopover`,`usePopover`],matchWidth:[2,`cdkConnectedOverlayMatchWidth`,`matchWidth`,$r],_config:[0,`cdkConnectedOverlay`,`_config`]},outputs:{backdropClick:`backdropClick`,positionChange:`positionChange`,attach:`attach`,detach:`detach`,overlayKeydown:`overlayKeydown`,overlayOutsideClick:`overlayOutsideClick`},exportAs:[`cdkConnectedOverlay`],features:[ln$1]})}return n})();var pt=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=Et$2({type:n});static ɵinj=Ze$3({providers:[Xe$1],imports:[AD,H,Jt,Jt]})}return n})();function ci(n,i){}var N$1=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;positionStrategy;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;closeOnNavigation=!0;closeOnDestroy=!0;closeOnOverlayDetachments=!0;disableAnimations=!1;providers;container;templateContext;bindings};var he=(()=>{class n extends et$1{_elementRef=p(nt$3);_focusTrapFactory=p(gn);_config;_interactivityChecker=p(cn);_ngZone=p(me);_focusMonitor=p(Tt$1);_renderer=p(Zn);_changeDetectorRef=p(Hr);_injector=p(ge$1);_platform=p(b);_document=p(H$2);_portalOutlet;_focusTrapped=new Z;_focusTrap=null;_elementFocusedBeforeDialogWasOpened=null;_closeInteractionType=null;_ariaLabelledByQueue=[];_isDestroyed=!1;constructor(){super(),this._config=p(N$1,{optional:!0})||new N$1,this._config.ariaLabelledBy&&this._ariaLabelledByQueue.push(this._config.ariaLabelledBy)}_addAriaLabelledBy(t){this._ariaLabelledByQueue.push(t),this._changeDetectorRef.markForCheck()}_removeAriaLabelledBy(t){let e=this._ariaLabelledByQueue.indexOf(t);e>-1&&(this._ariaLabelledByQueue.splice(e,1),this._changeDetectorRef.markForCheck())}_contentAttached(){this._initializeFocusTrap(),this._captureInitialFocus()}_captureInitialFocus(){this._trapFocus()}ngOnDestroy(){this._focusTrapped.complete(),this._isDestroyed=!0,this._restoreFocus()}attachComponentPortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachComponentPortal(t);return this._contentAttached(),e}attachTemplatePortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachTemplatePortal(t);return this._contentAttached(),e}attachDomPortal=t=>{this._portalOutlet.hasAttached();let e=this._portalOutlet.attachDomPortal(t);return this._contentAttached(),e};_recaptureFocus(){this._containsFocus()||this._trapFocus()}_forceFocus(t,e){this._interactivityChecker.isFocusable(t)||(t.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let o=()=>{s(),r(),t.removeAttribute(`tabindex`)},s=this._renderer.listen(t,`blur`,o),r=this._renderer.listen(t,`mousedown`,o)})),t.focus(e)}_focusByCssSelector(t,e){let o=this._elementRef.nativeElement.querySelector(t);o&&this._forceFocus(o,e)}_trapFocus(t){this._isDestroyed||rd(()=>{let e=this._elementRef.nativeElement;switch(this._config.autoFocus){case!1:case`dialog`:this._containsFocus()||e.focus(t);break;case!0:case`first-tabbable`:this._focusTrap?.focusInitialElement(t)||this._focusDialogContainer(t);break;case`first-heading`:this._focusByCssSelector(`h1, h2, h3, h4, h5, h6, [role="heading"]`,t);break;default:this._focusByCssSelector(this._config.autoFocus,t);break}this._focusTrapped.next()},{injector:this._injector})}_restoreFocus(){let t=this._config.restoreFocus,e=null;if(typeof t==`string`?e=this._document.querySelector(t):typeof t==`boolean`?e=t?this._elementFocusedBeforeDialogWasOpened:null:t&&(e=t),this._config.restoreFocus&&e&&typeof e.focus==`function`){let o=nn(),s=this._elementRef.nativeElement;(!o||o===this._document.body||o===s||s.contains(o))&&(this._focusMonitor?(this._focusMonitor.focusVia(e,this._closeInteractionType),this._closeInteractionType=null):e.focus())}this._focusTrap&&this._focusTrap.destroy()}_focusDialogContainer(t){this._elementRef.nativeElement.focus?.(t)}_containsFocus(){let t=this._elementRef.nativeElement,e=nn();return t===e||t.contains(e)}_initializeFocusTrap(){this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._document&&(this._elementFocusedBeforeDialogWasOpened=nn()))}static ɵfac=function(e){return new(e||n)};static ɵcmp=Jn({type:n,selectors:[[`cdk-dialog-container`]],viewQuery:function(e,o){if(e&1&&wv(dt,7),e&2){let s;xd(s=Od())&&(o._portalOutlet=s.first)}},hostAttrs:[`tabindex`,`-1`,1,`cdk-dialog-container`],hostVars:6,hostBindings:function(e,o){e&2&&er(`id`,o._config.id||null)(`role`,o._config.role)(`aria-modal`,o._config.ariaModal)(`aria-labelledby`,o._config.ariaLabel?null:o._ariaLabelledByQueue[0])(`aria-label`,o._config.ariaLabel)(`aria-describedby`,o._config.ariaDescribedBy||null)},features:[lv],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(e,o){e&1&&fv(0,ci,0,0,`ng-template`,0)},dependencies:[dt],styles:[`.cdk-dialog-container {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  max-height: inherit;
}
`],encapsulation:2,changeDetection:1})}return n})();var gt=class{overlayRef;config;componentInstance=null;componentRef=null;containerInstance;disableClose;closed=new Z;backdropClick;keydownEvents;outsidePointerEvents;id;_detachSubscription;constructor(i,t){this.overlayRef=i,this.config=t,this.disableClose=t.disableClose,this.backdropClick=i.backdropClick(),this.keydownEvents=i.keydownEvents(),this.outsidePointerEvents=i.outsidePointerEvents(),this.id=t.id,this.keydownEvents.subscribe(e=>{e.keyCode===27&&!this.disableClose&&!Le$2(e)&&(e.preventDefault(),this.close(void 0,{focusOrigin:`keyboard`}))}),this.backdropClick.subscribe(()=>{!this.disableClose&&this._canClose()?this.close(void 0,{focusOrigin:`mouse`}):this.containerInstance._recaptureFocus?.()}),this._detachSubscription=i.detachments().subscribe(()=>{t.closeOnOverlayDetachments!==!1&&this.close()})}close(i,t){if(this._canClose(i)){let e=this.closed;this.containerInstance._closeInteractionType=t?.focusOrigin||`program`,this._detachSubscription.unsubscribe(),this.overlayRef.dispose(),e.next(i),e.complete(),this.componentInstance=this.containerInstance=null}}updatePosition(){return this.overlayRef.updatePosition(),this}updateSize(i=``,t=``){return this.overlayRef.updateSize({width:i,height:t}),this}addPanelClass(i){return this.overlayRef.addPanelClass(i),this}removePanelClass(i){return this.overlayRef.removePanelClass(i),this}_canClose(i){let t=this.config;return!!this.containerInstance&&(!t.closePredicate||t.closePredicate(i,t,this.componentInstance))}};var hi=new y$1(`DialogScrollStrategy`,{providedIn:`root`,factory:()=>{let n=p(ge$1);return()=>nt$1(n)}});var di=new y$1(`DialogData`);var ui=new y$1(`DefaultDialogConfig`);function fi(n){let i=Q$1(n),t=new ue$1;return{valueSignal:i,get value(){return i()},change:t,ngOnDestroy(){t.complete()}}}var de=(()=>{class n{_injector=p(ge$1);_defaultOptions=p(ui,{optional:!0});_parentDialog=p(n,{optional:!0,skipSelf:!0});_overlayContainer=p(Ft);_idGenerator=p(Ft$1);_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new Z;_afterOpenedAtThisLevel=new Z;_ariaHiddenElements=new Map;_scrollStrategy=p(hi);get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}afterAllClosed=mo(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(Vc(void 0)));open(t,e){e=m$1(m$1({},this._defaultOptions||new N$1),e),e.id=e.id||this._idGenerator.getId(`cdk-dialog-`),e.id&&this.getDialogById(e.id);let s=this._getOverlayConfig(e),r=ft(this._injector,s),a=new gt(r,e),c=this._attachContainer(r,a,e);if(a.containerInstance=c,!this.openDialogs.length){let d=this._overlayContainer.getContainerElement();c._focusTrapped?c._focusTrapped.pipe(qe$3(1)).subscribe(()=>{this._hideNonDialogContentFromAssistiveTechnology(d)}):this._hideNonDialogContentFromAssistiveTechnology(d)}return this._attachDialogContent(t,a,c,e),this.openDialogs.push(a),a.closed.subscribe(()=>this._removeOpenDialog(a,!0)),this.afterOpened.next(a),a}closeAll(){ce(this.openDialogs,t=>t.close())}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){ce(this._openDialogsAtThisLevel,t=>{t.config.closeOnDestroy===!1&&this._removeOpenDialog(t,!1)}),ce(this._openDialogsAtThisLevel,t=>t.close()),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete(),this._openDialogsAtThisLevel=[]}_getOverlayConfig(t){let e=new X({positionStrategy:t.positionStrategy||ot$1().centerHorizontally().centerVertically(),scrollStrategy:t.scrollStrategy||this._scrollStrategy(),panelClass:t.panelClass,hasBackdrop:t.hasBackdrop,direction:t.direction,minWidth:t.minWidth,minHeight:t.minHeight,maxWidth:t.maxWidth,maxHeight:t.maxHeight,width:t.width,height:t.height,disposeOnNavigation:t.closeOnNavigation,disableAnimations:t.disableAnimations});return t.backdropClass&&(e.backdropClass=t.backdropClass),e}_attachContainer(t,e,o){let s=o.injector||o.viewContainerRef?.injector,r=[{provide:N$1,useValue:o},{provide:gt,useValue:e},{provide:it$1,useValue:t}],a;o.container?typeof o.container==`function`?a=o.container:(a=o.container.type,r.push(...o.container.providers(o))):a=he;let c=new tt$1(a,o.viewContainerRef,ge$1.create({parent:s||this._injector,providers:r}));return t.attach(c).instance}_attachDialogContent(t,e,o,s){if(t instanceof un$1){let r=this._createInjector(s,e,o,void 0),a={$implicit:s.data,dialogRef:e};s.templateContext&&(a=m$1(m$1({},a),typeof s.templateContext==`function`?s.templateContext():s.templateContext)),o.attachTemplatePortal(new W(t,null,a,r))}else{let r=this._createInjector(s,e,o,this._injector),a=o.attachComponentPortal(new tt$1(t,s.viewContainerRef,r,null,s.bindings));e.componentRef=a,e.componentInstance=a.instance}}_createInjector(t,e,o,s){let r=t.injector||t.viewContainerRef?.injector,a=[{provide:di,useValue:t.data},{provide:gt,useValue:e}];return t.providers&&(typeof t.providers==`function`?a.push(...t.providers(e,t,o)):a.push(...t.providers)),t.direction&&(!r||!r.get(AN,null,{optional:!0}))&&a.push({provide:AN,useValue:fi(t.direction)}),ge$1.create({parent:r||s,providers:a})}_removeOpenDialog(t,e){let o=this.openDialogs.indexOf(t);o>-1&&(this.openDialogs.splice(o,1),this.openDialogs.length||(this._ariaHiddenElements.forEach((s,r)=>{s?r.setAttribute(`aria-hidden`,s):r.removeAttribute(`aria-hidden`)}),this._ariaHiddenElements.clear(),e&&this._getAfterAllClosed().next()))}_hideNonDialogContentFromAssistiveTechnology(t){if(t.parentElement){let e=t.parentElement.children;for(let o=e.length-1;o>-1;o--){let s=e[o];s!==t&&s.nodeName!==`SCRIPT`&&s.nodeName!==`STYLE`&&!s.hasAttribute(`aria-live`)&&!s.hasAttribute(`popover`)&&(this._ariaHiddenElements.set(s,s.getAttribute(`aria-hidden`)),s.setAttribute(`aria-hidden`,`true`))}}}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();function ce(n,i){let t=n.length;for(;t--;)i(n[t])}var Ze$1=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=Et$2({type:n});static ɵinj=Ze$3({providers:[de],imports:[pt,H,Sn,H]})}return n})();function pi(n,i){}var Nt=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;position;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;delayFocusTrap=!0;scrollStrategy;closeOnNavigation=!0;enterAnimationDuration;exitAnimationDuration;bindings};var ue=`mdc-dialog--open`;var Ue=`mdc-dialog--opening`;var $e=`mdc-dialog--closing`;var gi=150;var _i=75;var mi=(()=>{class n extends he{_animationStateChanged=new ue$1;_animationsEnabled=!H$1();_actionSectionCount=0;_hostElement=this._elementRef.nativeElement;_enterAnimationDuration=this._animationsEnabled?Ke$1(this._config.enterAnimationDuration)??gi:0;_exitAnimationDuration=this._animationsEnabled?Ke$1(this._config.exitAnimationDuration)??_i:0;_animationTimer=null;_contentAttached(){super._contentAttached(),this._startOpenAnimation()}_startOpenAnimation(){this._animationStateChanged.emit({state:`opening`,totalTime:this._enterAnimationDuration}),this._animationsEnabled?(this._hostElement.style.setProperty(qe$1,`${this._enterAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(Ue,ue)),this._waitForAnimationToComplete(this._enterAnimationDuration,this._finishDialogOpen)):(this._hostElement.classList.add(ue),Promise.resolve().then(()=>this._finishDialogOpen()))}_startExitAnimation(){this._animationStateChanged.emit({state:`closing`,totalTime:this._exitAnimationDuration}),this._hostElement.classList.remove(ue),this._animationsEnabled?(this._hostElement.style.setProperty(qe$1,`${this._exitAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add($e)),this._waitForAnimationToComplete(this._exitAnimationDuration,this._finishDialogClose)):Promise.resolve().then(()=>this._finishDialogClose())}_updateActionSectionCount(t){this._actionSectionCount+=t,this._changeDetectorRef.markForCheck()}_finishDialogOpen=()=>{this._clearAnimationClasses(),this._openAnimationDone(this._enterAnimationDuration)};_finishDialogClose=()=>{this._clearAnimationClasses(),this._animationStateChanged.emit({state:`closed`,totalTime:this._exitAnimationDuration})};_clearAnimationClasses(){this._hostElement.classList.remove(Ue,$e)}_waitForAnimationToComplete(t,e){this._animationTimer!==null&&clearTimeout(this._animationTimer),this._animationTimer=setTimeout(e,t)}_requestAnimationFrame(t){this._ngZone.runOutsideAngular(()=>{typeof requestAnimationFrame==`function`?requestAnimationFrame(t):t()})}_captureInitialFocus(){this._config.delayFocusTrap||this._trapFocus()}_openAnimationDone(t){this._config.delayFocusTrap&&this._trapFocus(),this._animationStateChanged.next({state:`opened`,totalTime:t})}ngOnDestroy(){super.ngOnDestroy(),this._animationTimer!==null&&clearTimeout(this._animationTimer)}attachComponentPortal(t){let e=super.attachComponentPortal(t);return e.location.nativeElement.classList.add(`mat-mdc-dialog-component-host`),e}static ɵfac=(()=>{let t;return function(o){return(t||(t=Ag(n)))(o||n)}})();static ɵcmp=Jn({type:n,selectors:[[`mat-dialog-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-mdc-dialog-container`,`mdc-dialog`],hostVars:10,hostBindings:function(e,o){e&2&&(yv(`id`,o._config.id),er(`aria-modal`,o._config.ariaModal)(`role`,o._config.role)(`aria-labelledby`,o._config.ariaLabel?null:o._ariaLabelledByQueue[0])(`aria-label`,o._config.ariaLabel)(`aria-describedby`,o._config.ariaDescribedBy||null),Fa(`_mat-animation-noopable`,!o._animationsEnabled)(`mat-mdc-dialog-container-with-actions`,o._actionSectionCount>0))},features:[lv],decls:3,vars:0,consts:[[1,`mat-mdc-dialog-inner-container`,`mdc-dialog__container`],[1,`mat-mdc-dialog-surface`,`mdc-dialog__surface`],[`cdkPortalOutlet`,``]],template:function(e,o){e&1&&(Da(0,`div`,0)(1,`div`,1),fv(2,pi,0,0,`ng-template`,2),_d()())},dependencies:[dt],styles:[`.mat-mdc-dialog-container {
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
`],encapsulation:2,changeDetection:1})}return n})();var qe$1=`--mat-dialog-transition-duration`;function Ke$1(n){return n==null?null:typeof n==`number`?n:n.endsWith(`ms`)?an(n.substring(0,n.length-2)):n.endsWith(`s`)?an(n.substring(0,n.length-1))*1e3:n===`0`?0:null}var Bt=(function(n){return n[n.OPEN=0]=`OPEN`,n[n.CLOSING=1]=`CLOSING`,n[n.CLOSED=2]=`CLOSED`,n})(Bt||{});var _t=class{_ref;_config;_containerInstance;componentInstance;componentRef=null;disableClose;id;_afterOpened=new fo(1);_beforeClosed=new fo(1);_result;_closeFallbackTimeout;_state=Bt.OPEN;_closeInteractionType;constructor(i,t,e){this._ref=i,this._config=t,this._containerInstance=e,this.disableClose=t.disableClose,this.id=i.id,i.addPanelClass(`mat-mdc-dialog-panel`),e._animationStateChanged.pipe(Ae$2(o=>o.state===`opened`),qe$3(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),e._animationStateChanged.pipe(Ae$2(o=>o.state===`closed`),qe$3(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._finishDialogClose()}),i.overlayRef.detachments().subscribe(()=>{this._beforeClosed.next(this._result),this._beforeClosed.complete(),this._finishDialogClose()}),sE(this.backdropClick(),this.keydownEvents().pipe(Ae$2(o=>o.keyCode===27&&!this.disableClose&&!Le$2(o)))).subscribe(o=>{this.disableClose||(o.preventDefault(),Qe$1(this,o.type===`keydown`?`keyboard`:`mouse`))})}close(i){let t=this._config.closePredicate;t&&!t(i,this._config,this.componentInstance)||(this._result=i,this._containerInstance._animationStateChanged.pipe(Ae$2(e=>e.state===`closing`),qe$3(1)).subscribe(e=>{this._beforeClosed.next(i),this._beforeClosed.complete(),this._ref.overlayRef.detachBackdrop(),this._closeFallbackTimeout=setTimeout(()=>this._finishDialogClose(),e.totalTime+100)}),this._state=Bt.CLOSING,this._containerInstance._startExitAnimation())}afterOpened(){return this._afterOpened}afterClosed(){return this._ref.closed}beforeClosed(){return this._beforeClosed}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}updatePosition(i){let t=this._ref.config.positionStrategy;return i&&(i.left||i.right)?i.left?t.left(i.left):t.right(i.right):t.centerHorizontally(),i&&(i.top||i.bottom)?i.top?t.top(i.top):t.bottom(i.bottom):t.centerVertically(),this._ref.updatePosition(),this}updateSize(i=``,t=``){return this._ref.updateSize(i,t),this}addPanelClass(i){return this._ref.addPanelClass(i),this}removePanelClass(i){return this._ref.removePanelClass(i),this}getState(){return this._state}_finishDialogClose(){this._state=Bt.CLOSED,this._ref.close(this._result,{focusOrigin:this._closeInteractionType}),this.componentInstance=null}};function Qe$1(n,i,t){return n._closeInteractionType=i,n.close(t)}var vi=new y$1(`MatMdcDialogData`);var yi=new y$1(`mat-mdc-dialog-default-options`);var bi=new y$1(`mat-mdc-dialog-scroll-strategy`,{providedIn:`root`,factory:()=>{let n=p(ge$1);return()=>nt$1(n)}});var fe=(()=>{class n{_defaultOptions=p(yi,{optional:!0});_scrollStrategy=p(bi);_parentDialog=p(n,{optional:!0,skipSelf:!0});_idGenerator=p(Ft$1);_injector=p(ge$1);_dialog=p(de);_animationsDisabled=H$1();_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new Z;_afterOpenedAtThisLevel=new Z;dialogConfigClass=Nt;_dialogRefConstructor;_dialogContainerType;_dialogDataToken;get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}afterAllClosed=mo(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(Vc(void 0)));constructor(){this._dialogRefConstructor=_t,this._dialogContainerType=mi,this._dialogDataToken=vi}open(t,e){let o;e=m$1(m$1({},this._defaultOptions||new Nt),e),e.id=e.id||this._idGenerator.getId(`mat-mdc-dialog-`),e.scrollStrategy=e.scrollStrategy||this._scrollStrategy();let s=this._dialog.open(t,P$1(m$1({},e),{positionStrategy:ot$1(this._injector).centerHorizontally().centerVertically(),disableClose:!0,closePredicate:void 0,closeOnDestroy:!1,closeOnOverlayDetachments:!1,disableAnimations:this._animationsDisabled||e.enterAnimationDuration?.toLocaleString()===`0`||e.exitAnimationDuration?.toString()===`0`,container:{type:this._dialogContainerType,providers:()=>[{provide:this.dialogConfigClass,useValue:e},{provide:N$1,useValue:e}]},templateContext:()=>({dialogRef:o}),providers:(r,a,c)=>(o=new this._dialogRefConstructor(r,e,c),o.updatePosition(e?.position),[{provide:this._dialogContainerType,useValue:c},{provide:this._dialogDataToken,useValue:a.data},{provide:this._dialogRefConstructor,useValue:o}])}));return o.componentRef=s.componentRef,o.componentInstance=s.componentInstance,this.openDialogs.push(o),this.afterOpened.next(o),o.afterClosed().subscribe(()=>{let r=this.openDialogs.indexOf(o);r>-1&&(this.openDialogs.splice(r,1),this.openDialogs.length||this._getAfterAllClosed().next())}),o}closeAll(){this._closeDialogs(this.openDialogs)}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){this._closeDialogs(this._openDialogsAtThisLevel),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete()}_closeDialogs(t){let e=t.length;for(;e--;)t[e].close()}static ɵfac=function(e){return new(e||n)};static ɵprov=$$1({token:n,factory:n.ɵfac})}return n})();var Lo=(()=>{class n{dialogRef=p(_t,{optional:!0});_elementRef=p(nt$3);_dialog=p(fe);ariaLabel;type=`button`;dialogResult;_matDialogClose;ngOnInit(){this.dialogRef||(this.dialogRef=ti(this._elementRef,this._dialog.openDialogs))}ngOnChanges(t){let e=t._matDialogClose;e&&(this.dialogResult=e.currentValue)}_onButtonClick(t){this._elementRef.nativeElement.getAttribute(`aria-disabled`)!==`true`&&Qe$1(this.dialogRef,t.screenX===0&&t.screenY===0?`keyboard`:`mouse`,this.dialogResult)}static ɵfac=function(e){return new(e||n)};static ɵdir=ot$2({type:n,selectors:[[``,`mat-dialog-close`,``],[``,`matDialogClose`,``]],hostVars:2,hostBindings:function(e,o){e&1&&Pa(`click`,function(r){return o._onButtonClick(r)}),e&2&&er(`aria-label`,o.ariaLabel||null)(`type`,o.type)},inputs:{ariaLabel:[0,`aria-label`,`ariaLabel`],type:`type`,dialogResult:[0,`mat-dialog-close`,`dialogResult`],_matDialogClose:[0,`matDialogClose`,`_matDialogClose`]},exportAs:[`matDialogClose`],features:[ln$1]})}return n})();var Je$1=(()=>{class n{_dialogRef=p(_t,{optional:!0});_elementRef=p(nt$3);_dialog=p(fe);ngOnInit(){this._dialogRef||(this._dialogRef=ti(this._elementRef,this._dialog.openDialogs)),this._dialogRef&&Promise.resolve().then(()=>{this._onAdd()})}ngOnDestroy(){this._dialogRef?._containerInstance&&Promise.resolve().then(()=>{this._onRemove()})}static ɵfac=function(e){return new(e||n)};static ɵdir=ot$2({type:n})}return n})();var Io=(()=>{class n extends Je$1{id=p(Ft$1).getId(`mat-mdc-dialog-title-`);_onAdd(){this._dialogRef._containerInstance?._addAriaLabelledBy?.(this.id)}_onRemove(){this._dialogRef?._containerInstance?._removeAriaLabelledBy?.(this.id)}static ɵfac=(()=>{let t;return function(o){return(t||(t=Ag(n)))(o||n)}})();static ɵdir=ot$2({type:n,selectors:[[``,`mat-dialog-title`,``],[``,`matDialogTitle`,``]],hostAttrs:[1,`mat-mdc-dialog-title`,`mdc-dialog__title`],hostVars:1,hostBindings:function(e,o){e&2&&yv(`id`,o.id)},inputs:{id:`id`},exportAs:[`matDialogTitle`],features:[lv]})}return n})();var Vo=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵdir=ot$2({type:n,selectors:[[``,`mat-dialog-content`,``],[`mat-dialog-content`],[``,`matDialogContent`,``]],hostAttrs:[1,`mat-mdc-dialog-content`,`mdc-dialog__content`],features:[HS([Qt])]})}return n})();var zo=(()=>{class n extends Je$1{align;_onAdd(){this._dialogRef._containerInstance?._updateActionSectionCount?.(1)}_onRemove(){this._dialogRef._containerInstance?._updateActionSectionCount?.(-1)}static ɵfac=(()=>{let t;return function(o){return(t||(t=Ag(n)))(o||n)}})();static ɵdir=ot$2({type:n,selectors:[[``,`mat-dialog-actions`,``],[`mat-dialog-actions`],[``,`matDialogActions`,``]],hostAttrs:[1,`mat-mdc-dialog-actions`,`mdc-dialog__actions`],hostVars:6,hostBindings:function(e,o){e&2&&Fa(`mat-mdc-dialog-actions-align-start`,o.align===`start`)(`mat-mdc-dialog-actions-align-center`,o.align===`center`)(`mat-mdc-dialog-actions-align-end`,o.align===`end`)},inputs:{align:`align`},features:[lv]})}return n})();function ti(n,i){let t=n.nativeElement.parentElement;for(;t&&!t.classList.contains(`mat-mdc-dialog-container`);)t=t.parentElement;return t?i.find(e=>e.id===t.id):null}var jo=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=Et$2({type:n});static ɵinj=Ze$3({providers:[fe],imports:[Ze$1,pt,H,AD]})}return n})();var ne=`Service workers are disabled or not supported by this browser`;var N=class{serviceWorker;worker;registration;events;constructor(n,e){if(this.serviceWorker=n,!n)this.worker=this.events=this.registration=new N$3(i=>i.error(new v$2(5601,!1)));else{let i=null,o=new Z;this.worker=new N$3(m=>(i!==null&&m.next(i),o.subscribe(F=>m.next(F))));let c=()=>{let{controller:m}=n;m!==null&&(i=m,o.next(i))};n.addEventListener(`controllerchange`,c),c(),this.registration=this.worker.pipe(ke$1(()=>n.getRegistration().then(m=>{if(!m)throw new v$2(5601,!1);return m})));let d=new Z;this.events=d.asObservable();let h=m=>{let{data:F}=m;F?.type&&d.next(F)};n.addEventListener(`message`,h),e?.get(Pt$2,null,{optional:!0})?.onDestroy(()=>{n.removeEventListener(`controllerchange`,c),n.removeEventListener(`message`,h)})}}postMessage(n,e){return new Promise(i=>{this.worker.pipe(qe$3(1)).subscribe(o=>{o.postMessage(m$1({action:n},e)),i()})})}postMessageWithOperation(n,e,i){let o=this.waitForOperationCompleted(i),c=this.postMessage(n,e);return Promise.all([c,o]).then(([,d])=>d)}generateNonce(){return Math.round(Math.random()*1e7)}eventsOfType(n){let e;return typeof n==`string`?e=i=>i.type===n:e=i=>n.includes(i.type),this.events.pipe(Ae$2(e))}nextEventOfType(n){return this.eventsOfType(n).pipe(qe$3(1))}waitForOperationCompleted(n){return new Promise((e,i)=>{this.eventsOfType(`OPERATION_COMPLETED`).pipe(Ae$2(o=>o.nonce===n),qe$3(1),L$1(o=>{if(o.result!==void 0)return o.result;throw new Error(o.error)})).subscribe({next:e,error:i})})}get isEnabled(){return!!this.serviceWorker}};var Ke=(()=>{class t{sw;messages;notificationClicks;notificationCloses;pushSubscriptionChanges;subscription;get isEnabled(){return this.sw.isEnabled}pushManager=null;subscriptionChanges=new Z;constructor(e){if(this.sw=e,!e.isEnabled){this.messages=aE,this.notificationClicks=aE,this.notificationCloses=aE,this.pushSubscriptionChanges=aE,this.subscription=aE;return}this.messages=this.sw.eventsOfType(`PUSH`).pipe(L$1(o=>o.data)),this.notificationClicks=this.sw.eventsOfType(`NOTIFICATION_CLICK`).pipe(L$1(o=>o.data)),this.notificationCloses=this.sw.eventsOfType(`NOTIFICATION_CLOSE`).pipe(L$1(o=>o.data)),this.pushSubscriptionChanges=this.sw.eventsOfType(`PUSH_SUBSCRIPTION_CHANGE`).pipe(L$1(o=>o.data)),this.pushManager=this.sw.registration.pipe(L$1(o=>o.pushManager));let i=this.pushManager.pipe(ke$1(o=>o.getSubscription()));this.subscription=new N$3(o=>{let c=i.subscribe(o),d=this.subscriptionChanges.subscribe(o);return()=>{c.unsubscribe(),d.unsubscribe()}})}requestSubscription(e){if(!this.sw.isEnabled||this.pushManager===null)return Promise.reject(new Error(ne));let i={userVisibleOnly:!0},o=this.decodeBase64(e.serverPublicKey.replace(/_/g,`/`).replace(/-/g,`+`)),c=new Uint8Array(new ArrayBuffer(o.length));for(let d=0;d<o.length;d++)c[d]=o.charCodeAt(d);return i.applicationServerKey=c,new Promise((d,h)=>{this.pushManager.pipe(ke$1(D=>D.subscribe(i)),qe$3(1)).subscribe({next:D=>{this.subscriptionChanges.next(D),d(D)},error:h})})}unsubscribe(){if(!this.sw.isEnabled)return Promise.reject(new Error(ne));let e=i=>{if(i===null)throw new v$2(5602,!1);return i.unsubscribe().then(o=>{if(!o)throw new v$2(5603,!1);this.subscriptionChanges.next(null)})};return new Promise((i,o)=>{this.subscription.pipe(qe$3(1),ke$1(e)).subscribe({next:i,error:o})})}decodeBase64(e){return atob(e)}static ɵfac=function(i){return new(i||t)(E$1(N))};static ɵprov=R$1({token:t,factory:t.ɵfac})}return t})();var Xe=(()=>{class t{sw;versionUpdates;unrecoverable;get isEnabled(){return this.sw.isEnabled}ongoingCheckForUpdate=null;constructor(e){if(this.sw=e,!e.isEnabled){this.versionUpdates=aE,this.unrecoverable=aE;return}this.versionUpdates=this.sw.eventsOfType([`VERSION_DETECTED`,`VERSION_INSTALLATION_FAILED`,`VERSION_READY`,`NO_NEW_VERSION_DETECTED`]),this.unrecoverable=this.sw.eventsOfType(`UNRECOVERABLE_STATE`)}checkForUpdate(){if(!this.sw.isEnabled)return Promise.reject(new Error(ne));if(this.ongoingCheckForUpdate)return this.ongoingCheckForUpdate;let e=this.sw.generateNonce();return this.ongoingCheckForUpdate=this.sw.postMessageWithOperation(`CHECK_FOR_UPDATES`,{nonce:e},e).finally(()=>{this.ongoingCheckForUpdate=null}),this.ongoingCheckForUpdate}activateUpdate(){if(!this.sw.isEnabled)return Promise.reject(new v$2(5601,!1));let e=this.sw.generateNonce();return this.sw.postMessageWithOperation(`ACTIVATE_UPDATE`,{nonce:e},e)}static ɵfac=function(i){return new(i||t)(E$1(N))};static ɵprov=R$1({token:t,factory:t.ɵfac})}return t})();var ze=new y$1(``);function Ye(){let t=p(j);if(!(`serviceWorker`in navigator&&t.enabled!==!1))return;let n=p(ze),e=p(me),i=p(Pt$2);e.runOutsideAngular(()=>{let o=navigator.serviceWorker,c=()=>o.controller?.postMessage({action:`INITIALIZE`});o.addEventListener(`controllerchange`,c),i.onDestroy(()=>{o.removeEventListener(`controllerchange`,c)})}),e.runOutsideAngular(()=>{let o,{registrationStrategy:c}=t;if(typeof c==`function`)o=new Promise(d=>c().subscribe(()=>d()));else{let[d,...h]=(c||`registerWhenStable:30000`).split(`:`);switch(d){case`registerImmediately`:o=Promise.resolve();break;case`registerWithDelay`:o=Le(+h[0]||0);break;case`registerWhenStable`:o=Promise.race([i.whenStable(),Le(+h[0])]);break;default:throw new v$2(5600,!1)}}o.then(()=>{i.destroyed||navigator.serviceWorker.register(n,{scope:t.scope,updateViaCache:t.updateViaCache,type:t.type}).catch(d=>console.error(_t$2(5604,!1)))})})}function Le(t){return new Promise(n=>setTimeout(n,t))}function Ze(){let t=p(j),n=p(ge$1);return new N(t.enabled!==!1?navigator.serviceWorker:void 0,n)}var j=class{enabled;updateViaCache;type;scope;registrationStrategy};function Ve(t,n={}){return dt$1([Ke,Xe,{provide:ze,useValue:t},{provide:j,useValue:n},{provide:N,useFactory:Ze},cv(Ye)])}var He=async()=>{let t=p(y),n=p(ar);await t.ready();let e=t.currentPhase();return e===`playing`?n.parseUrl(`/ranking/game`):e===`finished`?n.parseUrl(`/ranking/end-score`):!0};var We=[{path:``,loadComponent:()=>import(`./chunk-Bj6fNvCH.js`).then(t=>t.Home)},{path:`ranking`,canActivate:[He],loadComponent:()=>import(`./chunk-B0z0aFBe.js`).then(t=>t.GameSetup)},{path:`ranking/game`,loadComponent:()=>import(`./chunk-lp_EohbG.js`).then(t=>t.Scoreboard)},{path:`ranking/end-score`,loadComponent:()=>import(`./chunk-o-1U3P6L.js`).then(t=>t.EndScore)},{path:`collection`,loadComponent:()=>import(`./chunk-Dfq9zcGA.js`).then(t=>t.Collection)},{path:`collection/paddle-table`,loadComponent:()=>import(`./chunk-Ww_Y1gbH.js`).then(t=>t.PaddleTable)},{path:`collection/arrival-planner`,loadComponent:()=>import(`./chunk-4loTK30y.js`).then(t=>t.ArrivalPlanner)},{path:`multiplayer`,loadComponent:()=>import(`./chunk-Dku1Usdw.js`).then(t=>t.Multiplayer)},{path:`collection/f1-strategy`,loadComponent:()=>import(`./chunk-BJEvpyxS.js`).then(t=>t.F1Strategy)},{path:`collection/f1-strategy/:trackId`,loadComponent:()=>import(`./chunk-DY_Vpoko.js`).then(t=>t.DetailedView)},{path:`profile`,loadComponent:()=>import(`./chunk-BQcJzumq.js`).then(t=>t.Profile)},{path:`profile/auth`,loadComponent:()=>import(`./chunk-_ebjzjeT.js`).then(t=>t.Auth)},{path:`settings`,loadComponent:()=>import(`./chunk-DTn7Fpj-.js`).then(t=>t.Settings)},{path:`notifications`,loadComponent:()=>import(`./chunk-CRbFlZxe.js`).then(t=>t.Notifications)}];var Be={providers:[tI(),{provide:be,useClass:_},DN(We),{provide:yi,useValue:{maxWidth:`92vw`,maxHeight:`90vh`}},Ve(`ngsw-worker.js`,{enabled:!aH(),registrationStrategy:`registerImmediately`})]};function qe(t){t||(t=p(Ee$1));let n=new N$3(e=>{if(t.destroyed){e.next();return}return t.onDestroy(e.next.bind(e))});return e=>e.pipe(yo(n))}function Je(t,n){if(t&1&&(Da(0,`p`,6),Ub(1),_d()),t&2){let e=pb();iC(),kv(` und `,e.data.moreCount,` weitere wichtige `,e.data.moreCount===1?`Nachricht`:`Nachrichten`,` `)}}function Qe(t,n){if(t&1){let e=fb();Da(0,`button`,10),Pa(`click`,function(){sp(e);return ap(pb().close(`all`))}),Ub(1,`Alle ansehen`),_d()}}var G=class t$1{dialogRef=p(_t);data=p(vi);config=t(this.data.alert.type);close(n){this.dialogRef.close(n)}static ɵfac=function(e){return new(e||t$1)};static ɵcmp=Jn({type:t$1,selectors:[[`app-system-alert-dialog`]],decls:16,vars:7,consts:[[1,`alert`],[`aria-hidden`,`true`,1,`alert-icon`],[1,`alert-kicker`],[`mat-dialog-title`,``],[`mat-dialog-content`,``],[1,`alert-message`],[1,`alert-more`],[`mat-dialog-actions`,``,`align`,`end`],[`mat-button`,``,`type`,`button`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`],[`mat-button`,``,`type`,`button`,3,`click`]],template:function(e,i){e&1&&(Da(0,`div`,0)(1,`span`,1)(2,`mat-icon`),Ub(3),_d()(),Da(4,`p`,2),Ub(5),_d(),Da(6,`h2`,3),Ub(7),_d(),Da(8,`div`,4)(9,`p`,5),Ub(10),_d(),rb(11,Je,2,2,`p`,6),_d()(),Da(12,`div`,7),rb(13,Qe,2,0,`button`,8),Da(14,`button`,9),Pa(`click`,function(){return i.close(`acknowledged`)}),Ub(15,` Verstanden `),_d()()),e&2&&(er(`data-tone`,i.config.tone),iC(3),Ov(i.config.icon),iC(2),Ov(i.config.label),iC(2),Ov(i.data.alert.title),iC(3),Ov(i.data.alert.message),iC(),ob(i.data.moreCount>0?11:-1),iC(2),ob(i.data.moreCount>0?13:-1))},dependencies:[Ki,zi,jo,Io,zo,Vo,P8,k8],styles:[`[data-tone][_ngcontent-%COMP%]{--%NS%tone-soft: color-mix(in srgb, var(--%NS%tone) 16%, transparent)}[data-tone=social][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-primary-light)}[data-tone=success][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-success-light)}[data-tone=game][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-rank-badge)}[data-tone=info][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-chart-cyan)}[data-tone=alert][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-warning)}[data-tone=error][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-danger-light)}[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:360px}.alert[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;padding-top:20px;text-align:center}.alert-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--%NS%tone-soft);color:var(--%NS%tone)}.alert-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:28px;height:28px;font-size:28px}.alert-kicker[_ngcontent-%COMP%]{margin:12px 0 0;color:var(--%NS%tone);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.alert[_ngcontent-%COMP%]   [mat-dialog-title][_ngcontent-%COMP%]{padding-top:4px}.alert-message[_ngcontent-%COMP%]{margin:0;color:var(--%NS%color-text);font-size:14px;line-height:1.45;white-space:pre-line}.alert-more[_ngcontent-%COMP%]{margin:12px 0 0;color:var(--%NS%color-text-muted);font-size:12px}[mat-dialog-actions][_ngcontent-%COMP%]{gap:8px}`]})};var U=`/notifications`;var oe=`incoming-notification`;var $=class t$2{notificationsService=p(S);session=p(I);toastService=p(P);dialog=p(fe);router=p(ar);announcedUserId=null;liveBurst=0;constructor(){_p(()=>{let n=this.notificationsService.loadedFor();!n||n===this.announcedUserId||(this.announcedUserId=n,G$1(()=>this.announceOnStart()))}),this.notificationsService.incoming.pipe(qe()).subscribe(n=>this.announceLive(n))}announceOnStart(){if(this.onNotificationsPage())return;let n=this.notificationsService.notifications().filter(o=>!o.read_at),e=n.filter(o=>o.type===`system_alert`),i=n.filter(o=>o.type===`system_info`);if(e.length&&this.dialog.open(G,{data:{alert:e[0],moreCount:e.length-1},width:`360px`}).afterClosed().subscribe(o=>{this.notificationsService.markRead(e.map(c=>c.id)),o===`all`&&this.router.navigateByUrl(U)}),i.length){let o=t(`system_info`),c=i.length===1;this.toastService.show({tone:o.tone,icon:o.icon,title:c?i[0].title:`${i.length} neue Systeminfos`,message:c?i[0].message:`Tippe, um sie anzusehen.`,link:U},6e3)}}announceLive(n){if(this.onNotificationsPage()||n.sender_id&&n.sender_id===this.session.user()?.id)return;this.liveBurst=this.toastService.isVisible(oe)?this.liveBurst+1:1;let e=t(n.type);this.toastService.show(this.liveBurst===1?{key:oe,tone:e.tone,icon:e.icon,title:n.title,message:n.message,link:U}:{key:oe,tone:`info`,icon:`notifications`,title:`${this.liveBurst} neue Benachrichtigungen`,message:`Tippe, um sie anzusehen.`,link:U})}onNotificationsPage(){return this.router.url.startsWith(U)}static ɵfac=function(e){return new(e||t$2)};static ɵprov=R$1({token:t$2,factory:t$2.ɵfac,providedIn:`root`})};var et=(t,n)=>n.id;function tt(t,n){if(t&1&&(Da(0,`span`),Ub(1),_d()),t&2){let e=pb().$implicit;iC(),Ov(e.message)}}function nt(t,n){if(t&1){let e=fb();Da(0,`div`,2)(1,`button`,3),Pa(`click`,function(){let o=sp(e).$implicit;return ap(pb().open(o))}),Da(2,`span`,4)(3,`mat-icon`),Ub(4),_d()(),Da(5,`span`,5)(6,`strong`),Ub(7),_d(),rb(8,tt,2,1,`span`),_d()(),Da(9,`button`,6),Pa(`click`,function(){let o=sp(e).$implicit;return ap(pb().toastService.dismiss(o.id))}),Da(10,`mat-icon`,7),Ub(11,`close`),_d()()()}if(t&2){let e=n.$implicit;Fa(`toast--link`,e.link),er(`data-tone`,e.tone)(`role`,e.tone===`error`?`alert`:`status`),iC(),gv(`disabled`,!e.link),er(`aria-label`,e.link?e.title+` – öffnen`:null),iC(3),Ov(e.icon),iC(3),Ov(e.title),iC(),ob(e.message?8:-1)}}var K=class t{router=p(ar);toastService=p(P);open(n){n.link&&(this.toastService.dismiss(n.id),this.router.navigateByUrl(n.link))}static ɵfac=function(e){return new(e||t)};static ɵcmp=Jn({type:t,selectors:[[`app-toast-host`]],decls:3,vars:0,consts:[[`aria-live`,`polite`,1,`toast-stack`],[1,`toast`,3,`toast--link`],[1,`toast`],[`type`,`button`,1,`toast-body`,3,`click`,`disabled`],[`aria-hidden`,`true`,1,`toast-icon`],[1,`toast-copy`],[`type`,`button`,`aria-label`,`Hinweis schließen`,1,`toast-close`,3,`click`],[`aria-hidden`,`true`]],template:function(e,i){e&1&&(Da(0,`div`,0),sb(1,nt,12,9,`div`,1,et),_d()),e&2&&(iC(),ab(i.toastService.toasts()))},dependencies:[P8,k8],styles:[`[data-tone][_ngcontent-%COMP%]{--%NS%tone-soft: color-mix(in srgb, var(--%NS%tone) 16%, transparent)}[data-tone=social][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-primary-light)}[data-tone=success][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-success-light)}[data-tone=game][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-rank-badge)}[data-tone=info][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-chart-cyan)}[data-tone=alert][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-warning)}[data-tone=error][_ngcontent-%COMP%]{--%NS%tone: var(--%NS%color-danger-light)}.toast-stack[_ngcontent-%COMP%]{position:fixed;top:52px;left:50%;z-index:900;display:flex;width:min(100% - 32px,400px);flex-direction:column;gap:8px;transform:translate(-50%);pointer-events:none}.toast[_ngcontent-%COMP%]{display:flex;align-items:stretch;overflow:hidden;border:1px solid color-mix(in srgb,var(--%NS%tone) 45%,transparent);border-radius:var(--%NS%radius-medium);background-color:color-mix(in srgb,var(--%NS%tone) 14%,var(--%NS%color-neutral-raised));box-shadow:var(--%NS%shadow-surface);pointer-events:auto;animation:_ngcontent-%COMP%_toast-in .22s ease-out}.toast-body[_ngcontent-%COMP%]{display:flex;min-width:0;flex:1;align-items:center;gap:10px;padding:10px 4px 10px 12px;border:0;background:transparent;color:var(--%NS%color-text);font:inherit;text-align:left}.toast--link[_ngcontent-%COMP%]   .toast-body[_ngcontent-%COMP%]{cursor:pointer}.toast-body[_ngcontent-%COMP%]:disabled{cursor:default}.toast-icon[_ngcontent-%COMP%]{display:grid;flex:0 0 34px;place-items:center;width:34px;height:34px;border-radius:var(--%NS%radius-small);background:var(--%NS%tone-soft);color:var(--%NS%tone)}.toast-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:19px;height:19px;font-size:19px}.toast-copy[_ngcontent-%COMP%]{display:flex;min-width:0;flex-direction:column;gap:2px}.toast-copy[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%], .toast-copy[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.toast-copy[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{font-size:13px}.toast-copy[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{color:var(--%NS%color-text-muted);font-size:12px}.toast-close[_ngcontent-%COMP%]{display:grid;flex:0 0 40px;place-items:center;padding:0;border:0;background:transparent;color:var(--%NS%color-text-subtle);cursor:pointer}.toast-close[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:18px;height:18px;font-size:18px}.toast-body[_ngcontent-%COMP%]:focus, .toast-close[_ngcontent-%COMP%]:focus{outline:none}.toast-body[_ngcontent-%COMP%]:focus-visible, .toast-close[_ngcontent-%COMP%]:focus-visible{outline:2px solid var(--%NS%tone);outline-offset:-2px}@keyframes _ngcontent-%COMP%_toast-in{0%{opacity:0;transform:translateY(-8px)}}@media(prefers-reduced-motion:reduce){.toast[_ngcontent-%COMP%]{animation:none}}`]})};var ot=()=>({exact:!0});function it(t,n){if(t&1&&(Da(0,`span`,7),Ub(1),_d()),t&2){let e=n;iC(),Ov(e>9?`9+`:e)}}s_(class t{notifications=p(S);constructor(){p($),p(h)}static ɵfac=function(e){return new(e||t)};static ɵcmp=Jn({type:t,selectors:[[`app-root`]],decls:37,vars:4,consts:[[1,`app-shell`],[1,`top-bar`],[1,`top-bar-title`],[`src`,`game-center-logo.png`,`alt`,``,`aria-hidden`,`true`],[1,`header-actions`],[`mat-icon-button`,``,`routerLink`,`/notifications`,1,`header-icon-button`,`notification-button`],[`aria-hidden`,`true`],[`aria-hidden`,`true`,1,`notification-badge`],[`mat-icon-button`,``,`routerLink`,`/settings`,`aria-label`,`Einstellungen`,1,`header-icon-button`],[`aria-label`,`Hauptnavigation`,1,`bottom-nav`],[`routerLink`,`/`,`routerLinkActive`,`active`,`aria-label`,`Home`,1,`bottom-nav-link`,3,`routerLinkActiveOptions`],[`routerLink`,`/multiplayer`,`routerLinkActive`,`active`,`aria-label`,`Multiplayer`,1,`bottom-nav-link`],[`routerLink`,`/collection`,`routerLinkActive`,`active`,`aria-label`,`Sammlung`,1,`bottom-nav-link`],[`routerLink`,`/profile`,`routerLinkActive`,`active`,`aria-label`,`Profil`,1,`bottom-nav-link`]],template:function(e,i){if(e&1&&(Da(0,`div`,0)(1,`header`,1)(2,`span`,2),ka(3,`img`,3),Ub(4,` Game Center `),_d(),Da(5,`div`,4)(6,`button`,5)(7,`mat-icon`,6),Ub(8,`notifications`),_d(),rb(9,it,2,1,`span`,7),_d(),Da(10,`button`,8)(11,`mat-icon`,6),Ub(12,`settings`),_d()()()(),ka(13,`app-toast-host`),Da(14,`main`),ka(15,`router-outlet`),_d(),Da(16,`nav`,9)(17,`a`,10)(18,`mat-icon`,6),Ub(19,`home`),_d(),Da(20,`span`),Ub(21,`Home`),_d()(),Da(22,`a`,11)(23,`mat-icon`,6),Ub(24,`groups`),_d(),Da(25,`span`),Ub(26,`Multiplayer`),_d()(),Da(27,`a`,12)(28,`mat-icon`,6),Ub(29,`apps`),_d(),Da(30,`span`),Ub(31,`Sammlung`),_d()(),Da(32,`a`,13)(33,`mat-icon`,6),Ub(34,`person`),_d(),Da(35,`span`),Ub(36,`Profil`),_d()()()()),e&2){let o;iC(6),er(`aria-label`,i.notifications.unreadCount()?`Benachrichtigungen, `+i.notifications.unreadCount()+` neu`:`Benachrichtigungen`),iC(3),ob((o=i.notifications.unreadCount())?9:-1,o),iC(8),gv(`routerLinkActiveOptions`,qb(3,ot))}},dependencies:[P8,k8,Cc,mN,Ff,K],styles:[`.app-shell[_ngcontent-%COMP%]{display:flex;flex-direction:column;width:100%;min-height:100dvh}main[_ngcontent-%COMP%]{flex:1;min-height:0;width:100%;box-sizing:border-box;padding-top:4px;padding-bottom:var(--%NS%bottom-nav-space)}.top-bar[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:48px;box-sizing:border-box;padding:7px 14px 7px 18px}.top-bar-title[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:8px;color:var(--%NS%color-text);font-size:15px;font-weight:800;letter-spacing:.01em}.top-bar-title[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{display:block;width:24px;height:24px;padding:3px;box-sizing:border-box;border-radius:9px;background:var(--%NS%color-white-08);object-fit:contain}@media(max-width:600px){.top-bar-title[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:36px;height:36px}}.header-actions[_ngcontent-%COMP%]{display:flex;align-items:center;gap:4px}.header-icon-button[_ngcontent-%COMP%]{position:relative;display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:transparent!important;box-shadow:none!important;color:var(--%NS%color-text-muted);appearance:none;-webkit-appearance:none;-webkit-tap-highlight-color:transparent;transition:background-color var(--%NS%transition-fast),color var(--%NS%transition-fast),transform var(--%NS%transition-fast)}.notification-button[_ngcontent-%COMP%]:before, .notification-button[_ngcontent-%COMP%]:after{display:none}.header-icon-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:18px;height:18px;font-size:18px}.header-icon-button[_ngcontent-%COMP%]:hover{color:var(--%NS%color-primary-light)}.header-icon-button[_ngcontent-%COMP%]:active{background:var(--%NS%color-primary-soft)!important;transform:scale(.92)}.header-icon-button[_ngcontent-%COMP%]:focus{outline:none}.header-icon-button[_ngcontent-%COMP%]:focus-visible{outline:2px solid var(--%NS%color-primary-light);outline-offset:2px}.notification-badge[_ngcontent-%COMP%]{position:absolute;top:2px;right:1px;display:grid;place-items:center;min-width:16px;height:16px;box-sizing:border-box;padding:0 4px;border-radius:var(--%NS%radius-pill);background:var(--%NS%color-notification);color:var(--%NS%color-white);font-size:10px;font-weight:700;line-height:1;pointer-events:none}.bottom-nav[_ngcontent-%COMP%]{position:fixed;left:50%;bottom:12px;z-index:10;display:flex;width:min(100% - 32px,400px);box-sizing:border-box;transform:translate(-50%);padding:7px 4px 5px;overflow:hidden;isolation:isolate;border-radius:28px;background-color:var(--%NS%color-navigation-surface);backdrop-filter:blur(3px) saturate(180%);-webkit-backdrop-filter:blur(3px) saturate(180%)}.bottom-nav[_ngcontent-%COMP%]:before{position:absolute;top:4px;bottom:4px;left:4px;z-index:0;width:calc((100% - 8px)/4);border-radius:26px;background:linear-gradient(135deg,var(--%NS%color-navigation-highlight),var(--%NS%color-primary-20));content:"";pointer-events:none}.bottom-nav[_ngcontent-%COMP%]:has(.bottom-nav-link:nth-child(1).active):before{transform:translate(0) scaleX(1.02)}.bottom-nav[_ngcontent-%COMP%]:has(.bottom-nav-link:nth-child(2).active):before{transform:translate(100%) scaleX(1.04)}.bottom-nav[_ngcontent-%COMP%]:has(.bottom-nav-link:nth-child(3).active):before{transform:translate(200%) scaleX(1.02)}.bottom-nav[_ngcontent-%COMP%]:has(.bottom-nav-link:nth-child(4).active):before{transform:translate(300%) scaleX(1.02)}.bottom-nav-link[_ngcontent-%COMP%]{position:relative;z-index:1;display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:42px;border-radius:300px;color:var(--%NS%color-neutral-muted);font-size:10px;font-weight:600;text-decoration:none}.bottom-nav-link[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:20px;height:20px;font-size:20px}.bottom-nav-link.active[_ngcontent-%COMP%]{color:var(--%NS%color-text)}.bottom-nav-link[_ngcontent-%COMP%]:active{transform:scale(.96)}.bottom-nav-link[_ngcontent-%COMP%]:focus{outline:none}`]})},Be).catch(t=>console.error(t));export{S as $,Ot as A,Ye$2 as B,D as C,Le$2 as D,Ki as E,Sn as F,ut$1 as G,b as H,Te$1 as I,zi as J,v as K,Tt$1 as L,Q as M,Qo as N,N$2 as O,Rt$1 as P,P as Q,X$1 as R,Bo as S,H$1 as T,di$1 as U,an as V,ji as W,y as X,zt as Y,I as Z,pt as _,Vo as a,t as at,vi as b,_t as c,fe as d,f as et,ft as f,ne$1 as g,li as h,Lo as i,i as it,Pn as j,Nn as k,ae as l,le as m,J as n,v$1 as nt,W as o,jo as p,wo as q,Kt as r,w as rt,X as s,Io as t,h as tt,ct as u,se as v,Ft$1 as w,zo as x,tt$1 as y,Xe$2 as z};