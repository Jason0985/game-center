import{$ as Qc,$n as yv,An as rt$1,Bt as fv,D as H,Dn as rC,Et as _d,Fn as tb,G as Od,H as NN,In as tt,Jn as xd,K as Ov,L as La,Lt as er,M as Jn,Nt as dE,Qt as ka,Rn as ue$1,S as Fb,Tt as Zn,Ut as ge,V as N8,Y as Pd,Yn as y,Z as Q$1,Zn as ya,a as Ae,cn as m,dn as mo,h as Dt,jt as cn,k as Hr,kn as rd,mn as nb,mt as We,nt as RD,o as Ag,on as lv,q as P,qn as wv,s as BS,t as $,tt as R8,un as me$1,wn as qe,xt as Z,y as Eo,yn as p,zt as fb}from"./chunk-ChRAHA96.js";import{D as yt,S as st$1,_ as nt$1,a as It,h as l,i as Fs,k as ze,p as dt,v as oe$1,x as rt$2}from"./chunk-BwMlHgOq.js";import{l as zn,n as Cn}from"./chunk-BOkHEkob.js";import{_ as pi,a as Kt$1,b as wt,c as X,f as ge$1,g as oe$2,h as ne$1,i as J,l as Y,o as Pt,p as he$1,u as Yt$1,v as st$2}from"./chunk-BFvGQULy.js";function ee(i,a){}var f=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;positionStrategy;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;closeOnNavigation=!0;closeOnDestroy=!0;closeOnOverlayDetachments=!0;disableAnimations=!1;providers;container;templateContext;bindings};var at=(()=>{class i extends J{_elementRef=p(tt);_focusTrapFactory=p(yt);_config;_interactivityChecker=p(dt);_ngZone=p(me$1);_focusMonitor=p(rt$2);_renderer=p(Zn);_changeDetectorRef=p(Hr);_injector=p(ge);_platform=p(l);_document=p(H);_portalOutlet;_focusTrapped=new Z;_focusTrap=null;_elementFocusedBeforeDialogWasOpened=null;_closeInteractionType=null;_ariaLabelledByQueue=[];_isDestroyed=!1;constructor(){super(),this._config=p(f,{optional:!0})||new f,this._config.ariaLabelledBy&&this._ariaLabelledByQueue.push(this._config.ariaLabelledBy)}_addAriaLabelledBy(t){this._ariaLabelledByQueue.push(t),this._changeDetectorRef.markForCheck()}_removeAriaLabelledBy(t){let e=this._ariaLabelledByQueue.indexOf(t);e>-1&&(this._ariaLabelledByQueue.splice(e,1),this._changeDetectorRef.markForCheck())}_contentAttached(){this._initializeFocusTrap(),this._captureInitialFocus()}_captureInitialFocus(){this._trapFocus()}ngOnDestroy(){this._focusTrapped.complete(),this._isDestroyed=!0,this._restoreFocus()}attachComponentPortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachComponentPortal(t);return this._contentAttached(),e}attachTemplatePortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachTemplatePortal(t);return this._contentAttached(),e}attachDomPortal=t=>{this._portalOutlet.hasAttached();let e=this._portalOutlet.attachDomPortal(t);return this._contentAttached(),e};_recaptureFocus(){this._containsFocus()||this._trapFocus()}_forceFocus(t,e){this._interactivityChecker.isFocusable(t)||(t.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let n=()=>{o(),l(),t.removeAttribute(`tabindex`)},o=this._renderer.listen(t,`blur`,n),l=this._renderer.listen(t,`mousedown`,n)})),t.focus(e)}_focusByCssSelector(t,e){let n=this._elementRef.nativeElement.querySelector(t);n&&this._forceFocus(n,e)}_trapFocus(t){this._isDestroyed||rd(()=>{let e=this._elementRef.nativeElement;switch(this._config.autoFocus){case!1:case`dialog`:this._containsFocus()||e.focus(t);break;case!0:case`first-tabbable`:this._focusTrap?.focusInitialElement(t)||this._focusDialogContainer(t);break;case`first-heading`:this._focusByCssSelector(`h1, h2, h3, h4, h5, h6, [role="heading"]`,t);break;default:this._focusByCssSelector(this._config.autoFocus,t);break}this._focusTrapped.next()},{injector:this._injector})}_restoreFocus(){let t=this._config.restoreFocus,e=null;if(typeof t==`string`?e=this._document.querySelector(t):typeof t==`boolean`?e=t?this._elementFocusedBeforeDialogWasOpened:null:t&&(e=t),this._config.restoreFocus&&e&&typeof e.focus==`function`){let n=st$1(),o=this._elementRef.nativeElement;(!n||n===this._document.body||n===o||o.contains(n))&&(this._focusMonitor?(this._focusMonitor.focusVia(e,this._closeInteractionType),this._closeInteractionType=null):e.focus())}this._focusTrap&&this._focusTrap.destroy()}_focusDialogContainer(t){this._elementRef.nativeElement.focus?.(t)}_containsFocus(){let t=this._elementRef.nativeElement,e=st$1();return t===e||t.contains(e)}_initializeFocusTrap(){this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._document&&(this._elementFocusedBeforeDialogWasOpened=st$1()))}static ɵfac=function(e){return new(e||i)};static ɵcmp=Jn({type:i,selectors:[[`cdk-dialog-container`]],viewQuery:function(e,n){if(e&1&&wv(pi,7),e&2){let o;xd(o=Od())&&(n._portalOutlet=o.first)}},hostAttrs:[`tabindex`,`-1`,1,`cdk-dialog-container`],hostVars:6,hostBindings:function(e,n){e&2&&er(`id`,n._config.id||null)(`role`,n._config.role)(`aria-modal`,n._config.ariaModal)(`aria-labelledby`,n._config.ariaLabel?null:n._ariaLabelledByQueue[0])(`aria-label`,n._config.ariaLabel)(`aria-describedby`,n._config.ariaDescribedBy||null)},features:[lv],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(e,n){e&1&&fv(0,ee,0,0,`ng-template`,0)},dependencies:[pi],styles:[`.cdk-dialog-container {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  max-height: inherit;
}
`],encapsulation:2,changeDetection:1})}return i})();var w=class{overlayRef;config;componentInstance=null;componentRef=null;containerInstance;disableClose;closed=new Z;backdropClick;keydownEvents;outsidePointerEvents;id;_detachSubscription;constructor(a,t){this.overlayRef=a,this.config=t,this.disableClose=t.disableClose,this.backdropClick=a.backdropClick(),this.keydownEvents=a.keydownEvents(),this.outsidePointerEvents=a.outsidePointerEvents(),this.id=t.id,this.keydownEvents.subscribe(e=>{e.keyCode===27&&!this.disableClose&&!ze(e)&&(e.preventDefault(),this.close(void 0,{focusOrigin:`keyboard`}))}),this.backdropClick.subscribe(()=>{!this.disableClose&&this._canClose()?this.close(void 0,{focusOrigin:`mouse`}):this.containerInstance._recaptureFocus?.()}),this._detachSubscription=a.detachments().subscribe(()=>{t.closeOnOverlayDetachments!==!1&&this.close()})}close(a,t){if(this._canClose(a)){let e=this.closed;this.containerInstance._closeInteractionType=t?.focusOrigin||`program`,this._detachSubscription.unsubscribe(),this.overlayRef.dispose(),e.next(a),e.complete(),this.componentInstance=this.containerInstance=null}}updatePosition(){return this.overlayRef.updatePosition(),this}updateSize(a=``,t=``){return this.overlayRef.updateSize({width:a,height:t}),this}addPanelClass(a){return this.overlayRef.addPanelClass(a),this}removePanelClass(a){return this.overlayRef.removePanelClass(a),this}_canClose(a){let t=this.config;return!!this.containerInstance&&(!t.closePredicate||t.closePredicate(a,t,this.componentInstance))}};var ie=new y(`DialogScrollStrategy`,{providedIn:`root`,factory:()=>{let i=p(ge);return()=>Kt$1(i)}});var ne=new y(`DialogData`);var ae=new y(`DefaultDialogConfig`);function oe(i){let a=Q$1(i),t=new ue$1;return{valueSignal:a,get value(){return a()},change:t,ngOnDestroy(){t.complete()}}}var ot=(()=>{class i{_injector=p(ge);_defaultOptions=p(ae,{optional:!0});_parentDialog=p(i,{optional:!0,skipSelf:!0});_overlayContainer=p(ne$1);_idGenerator=p(oe$1);_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new Z;_afterOpenedAtThisLevel=new Z;_ariaHiddenElements=new Map;_scrollStrategy=p(ie);get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}afterAllClosed=Eo(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(Qc(void 0)));open(t,e){e=m(m({},this._defaultOptions||new f),e),e.id=e.id||this._idGenerator.getId(`cdk-dialog-`),e.id&&this.getDialogById(e.id);let o=this._getOverlayConfig(e),l=Pt(this._injector,o),r=new w(l,e),d=this._attachContainer(l,r,e);if(r.containerInstance=d,!this.openDialogs.length){let U=this._overlayContainer.getContainerElement();d._focusTrapped?d._focusTrapped.pipe(We(1)).subscribe(()=>{this._hideNonDialogContentFromAssistiveTechnology(U)}):this._hideNonDialogContentFromAssistiveTechnology(U)}return this._attachDialogContent(t,r,d,e),this.openDialogs.push(r),r.closed.subscribe(()=>this._removeOpenDialog(r,!0)),this.afterOpened.next(r),r}closeAll(){nt(this.openDialogs,t=>t.close())}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){nt(this._openDialogsAtThisLevel,t=>{t.config.closeOnDestroy===!1&&this._removeOpenDialog(t,!1)}),nt(this._openDialogsAtThisLevel,t=>t.close()),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete(),this._openDialogsAtThisLevel=[]}_getOverlayConfig(t){let e=new X({positionStrategy:t.positionStrategy||oe$2().centerHorizontally().centerVertically(),scrollStrategy:t.scrollStrategy||this._scrollStrategy(),panelClass:t.panelClass,hasBackdrop:t.hasBackdrop,direction:t.direction,minWidth:t.minWidth,minHeight:t.minHeight,maxWidth:t.maxWidth,maxHeight:t.maxHeight,width:t.width,height:t.height,disposeOnNavigation:t.closeOnNavigation,disableAnimations:t.disableAnimations});return t.backdropClass&&(e.backdropClass=t.backdropClass),e}_attachContainer(t,e,n){let o=n.injector||n.viewContainerRef?.injector,l=[{provide:f,useValue:n},{provide:w,useValue:e},{provide:st$2,useValue:t}],r;n.container?typeof n.container==`function`?r=n.container:(r=n.container.type,l.push(...n.container.providers(n))):r=at;let d=new wt(r,n.viewContainerRef,ge.create({parent:o||this._injector,providers:l}));return t.attach(d).instance}_attachDialogContent(t,e,n,o){if(t instanceof cn){let l=this._createInjector(o,e,n,void 0),r={$implicit:o.data,dialogRef:e};o.templateContext&&(r=m(m({},r),typeof o.templateContext==`function`?o.templateContext():o.templateContext)),n.attachTemplatePortal(new Y(t,null,r,l))}else{let l=this._createInjector(o,e,n,this._injector),r=n.attachComponentPortal(new wt(t,o.viewContainerRef,l,null,o.bindings));e.componentRef=r,e.componentInstance=r.instance}}_createInjector(t,e,n,o){let l=t.injector||t.viewContainerRef?.injector,r=[{provide:ne,useValue:t.data},{provide:w,useValue:e}];return t.providers&&(typeof t.providers==`function`?r.push(...t.providers(e,t,n)):r.push(...t.providers)),t.direction&&(!l||!l.get(NN,null,{optional:!0}))&&r.push({provide:NN,useValue:oe(t.direction)}),ge.create({parent:l||o,providers:r})}_removeOpenDialog(t,e){let n=this.openDialogs.indexOf(t);n>-1&&(this.openDialogs.splice(n,1),this.openDialogs.length||(this._ariaHiddenElements.forEach((o,l)=>{o?l.setAttribute(`aria-hidden`,o):l.removeAttribute(`aria-hidden`)}),this._ariaHiddenElements.clear(),e&&this._getAfterAllClosed().next()))}_hideNonDialogContentFromAssistiveTechnology(t){if(t.parentElement){let e=t.parentElement.children;for(let n=e.length-1;n>-1;n--){let o=e[n];o!==t&&o.nodeName!==`SCRIPT`&&o.nodeName!==`STYLE`&&!o.hasAttribute(`aria-live`)&&!o.hasAttribute(`popover`)&&(this._ariaHiddenElements.set(o,o.getAttribute(`aria-hidden`)),o.setAttribute(`aria-hidden`,`true`))}}}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}static ɵfac=function(e){return new(e||i)};static ɵprov=$({token:i,factory:i.ɵfac})}return i})();function nt(i,a){let t=i.length;for(;t--;)a(i[t])}var Ht=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵmod=Dt({type:i});static ɵinj=qe({providers:[ot],imports:[ge$1,Yt$1,It,Yt$1]})}return i})();function se(i,a){}var q=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;position;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;delayFocusTrap=!0;scrollStrategy;closeOnNavigation=!0;enterAnimationDuration;exitAnimationDuration;bindings};var st=`mdc-dialog--open`;var Wt=`mdc-dialog--opening`;var Qt=`mdc-dialog--closing`;var re=150;var le=75;var de=(()=>{class i extends at{_animationStateChanged=new ue$1;_animationsEnabled=!Fs();_actionSectionCount=0;_hostElement=this._elementRef.nativeElement;_enterAnimationDuration=this._animationsEnabled?Ut(this._config.enterAnimationDuration)??re:0;_exitAnimationDuration=this._animationsEnabled?Ut(this._config.exitAnimationDuration)??le:0;_animationTimer=null;_contentAttached(){super._contentAttached(),this._startOpenAnimation()}_startOpenAnimation(){this._animationStateChanged.emit({state:`opening`,totalTime:this._enterAnimationDuration}),this._animationsEnabled?(this._hostElement.style.setProperty(qt,`${this._enterAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(Wt,st)),this._waitForAnimationToComplete(this._enterAnimationDuration,this._finishDialogOpen)):(this._hostElement.classList.add(st),Promise.resolve().then(()=>this._finishDialogOpen()))}_startExitAnimation(){this._animationStateChanged.emit({state:`closing`,totalTime:this._exitAnimationDuration}),this._hostElement.classList.remove(st),this._animationsEnabled?(this._hostElement.style.setProperty(qt,`${this._exitAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(Qt)),this._waitForAnimationToComplete(this._exitAnimationDuration,this._finishDialogClose)):Promise.resolve().then(()=>this._finishDialogClose())}_updateActionSectionCount(t){this._actionSectionCount+=t,this._changeDetectorRef.markForCheck()}_finishDialogOpen=()=>{this._clearAnimationClasses(),this._openAnimationDone(this._enterAnimationDuration)};_finishDialogClose=()=>{this._clearAnimationClasses(),this._animationStateChanged.emit({state:`closed`,totalTime:this._exitAnimationDuration})};_clearAnimationClasses(){this._hostElement.classList.remove(Wt,Qt)}_waitForAnimationToComplete(t,e){this._animationTimer!==null&&clearTimeout(this._animationTimer),this._animationTimer=setTimeout(e,t)}_requestAnimationFrame(t){this._ngZone.runOutsideAngular(()=>{typeof requestAnimationFrame==`function`?requestAnimationFrame(t):t()})}_captureInitialFocus(){this._config.delayFocusTrap||this._trapFocus()}_openAnimationDone(t){this._config.delayFocusTrap&&this._trapFocus(),this._animationStateChanged.next({state:`opened`,totalTime:t})}ngOnDestroy(){super.ngOnDestroy(),this._animationTimer!==null&&clearTimeout(this._animationTimer)}attachComponentPortal(t){let e=super.attachComponentPortal(t);return e.location.nativeElement.classList.add(`mat-mdc-dialog-component-host`),e}static ɵfac=(()=>{let t;return function(n){return(t||(t=Ag(i)))(n||i)}})();static ɵcmp=Jn({type:i,selectors:[[`mat-dialog-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-mdc-dialog-container`,`mdc-dialog`],hostVars:10,hostBindings:function(e,n){e&2&&(yv(`id`,n._config.id),er(`aria-modal`,n._config.ariaModal)(`role`,n._config.role)(`aria-labelledby`,n._config.ariaLabel?null:n._ariaLabelledByQueue[0])(`aria-label`,n._config.ariaLabel)(`aria-describedby`,n._config.ariaDescribedBy||null),La(`_mat-animation-noopable`,!n._animationsEnabled)(`mat-mdc-dialog-container-with-actions`,n._actionSectionCount>0))},features:[lv],decls:3,vars:0,consts:[[1,`mat-mdc-dialog-inner-container`,`mdc-dialog__container`],[1,`mat-mdc-dialog-surface`,`mdc-dialog__surface`],[`cdkPortalOutlet`,``]],template:function(e,n){e&1&&(ya(0,`div`,0)(1,`div`,1),fv(2,se,0,0,`ng-template`,2),_d()())},dependencies:[pi],styles:[`.mat-mdc-dialog-container {
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
`],encapsulation:2,changeDetection:1})}return i})();var qt=`--mat-dialog-transition-duration`;function Ut(i){return i==null?null:typeof i==`number`?i:i.endsWith(`ms`)?nt$1(i.substring(0,i.length-2)):i.endsWith(`s`)?nt$1(i.substring(0,i.length-1))*1e3:i===`0`?0:null}var Q=(function(i){return i[i.OPEN=0]=`OPEN`,i[i.CLOSING=1]=`CLOSING`,i[i.CLOSED=2]=`CLOSED`,i})(Q||{});var C=class{_ref;_config;_containerInstance;componentInstance;componentRef=null;disableClose;id;_afterOpened=new mo(1);_beforeClosed=new mo(1);_result;_closeFallbackTimeout;_state=Q.OPEN;_closeInteractionType;constructor(a,t,e){this._ref=a,this._config=t,this._containerInstance=e,this.disableClose=t.disableClose,this.id=a.id,a.addPanelClass(`mat-mdc-dialog-panel`),e._animationStateChanged.pipe(Ae(n=>n.state===`opened`),We(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),e._animationStateChanged.pipe(Ae(n=>n.state===`closed`),We(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._finishDialogClose()}),a.overlayRef.detachments().subscribe(()=>{this._beforeClosed.next(this._result),this._beforeClosed.complete(),this._finishDialogClose()}),dE(this.backdropClick(),this.keydownEvents().pipe(Ae(n=>n.keyCode===27&&!this.disableClose&&!ze(n)))).subscribe(n=>{this.disableClose||(n.preventDefault(),ce(this,n.type===`keydown`?`keyboard`:`mouse`))})}close(a){let t=this._config.closePredicate;t&&!t(a,this._config,this.componentInstance)||(this._result=a,this._containerInstance._animationStateChanged.pipe(Ae(e=>e.state===`closing`),We(1)).subscribe(e=>{this._beforeClosed.next(a),this._beforeClosed.complete(),this._ref.overlayRef.detachBackdrop(),this._closeFallbackTimeout=setTimeout(()=>this._finishDialogClose(),e.totalTime+100)}),this._state=Q.CLOSING,this._containerInstance._startExitAnimation())}afterOpened(){return this._afterOpened}afterClosed(){return this._ref.closed}beforeClosed(){return this._beforeClosed}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}updatePosition(a){let t=this._ref.config.positionStrategy;return a&&(a.left||a.right)?a.left?t.left(a.left):t.right(a.right):t.centerHorizontally(),a&&(a.top||a.bottom)?a.top?t.top(a.top):t.bottom(a.bottom):t.centerVertically(),this._ref.updatePosition(),this}updateSize(a=``,t=``){return this._ref.updateSize(a,t),this}addPanelClass(a){return this._ref.addPanelClass(a),this}removePanelClass(a){return this._ref.removePanelClass(a),this}getState(){return this._state}_finishDialogClose(){this._state=Q.CLOSED,this._ref.close(this._result,{focusOrigin:this._closeInteractionType}),this.componentInstance=null}};function ce(i,a,t){return i._closeInteractionType=a,i.close(t)}var rt=new y(`MatMdcDialogData`);var me=new y(`mat-mdc-dialog-default-options`);var he=new y(`mat-mdc-dialog-scroll-strategy`,{providedIn:`root`,factory:()=>{let i=p(ge);return()=>Kt$1(i)}});var Yt=(()=>{class i{_defaultOptions=p(me,{optional:!0});_scrollStrategy=p(he);_parentDialog=p(i,{optional:!0,skipSelf:!0});_idGenerator=p(oe$1);_injector=p(ge);_dialog=p(ot);_animationsDisabled=Fs();_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new Z;_afterOpenedAtThisLevel=new Z;dialogConfigClass=q;_dialogRefConstructor;_dialogContainerType;_dialogDataToken;get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}afterAllClosed=Eo(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(Qc(void 0)));constructor(){this._dialogRefConstructor=C,this._dialogContainerType=de,this._dialogDataToken=rt}open(t,e){let n;e=m(m({},this._defaultOptions||new q),e),e.id=e.id||this._idGenerator.getId(`mat-mdc-dialog-`),e.scrollStrategy=e.scrollStrategy||this._scrollStrategy();let o=this._dialog.open(t,P(m({},e),{positionStrategy:oe$2(this._injector).centerHorizontally().centerVertically(),disableClose:!0,closePredicate:void 0,closeOnDestroy:!1,closeOnOverlayDetachments:!1,disableAnimations:this._animationsDisabled||e.enterAnimationDuration?.toLocaleString()===`0`||e.exitAnimationDuration?.toString()===`0`,container:{type:this._dialogContainerType,providers:()=>[{provide:this.dialogConfigClass,useValue:e},{provide:f,useValue:e}]},templateContext:()=>({dialogRef:n}),providers:(l,r,d)=>(n=new this._dialogRefConstructor(l,e,d),n.updatePosition(e?.position),[{provide:this._dialogContainerType,useValue:d},{provide:this._dialogDataToken,useValue:r.data},{provide:this._dialogRefConstructor,useValue:n}])}));return n.componentRef=o.componentRef,n.componentInstance=o.componentInstance,this.openDialogs.push(n),this.afterOpened.next(n),n.afterClosed().subscribe(()=>{let l=this.openDialogs.indexOf(n);l>-1&&(this.openDialogs.splice(l,1),this.openDialogs.length||this._getAfterAllClosed().next())}),n}closeAll(){this._closeDialogs(this.openDialogs)}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){this._closeDialogs(this._openDialogsAtThisLevel),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete()}_closeDialogs(t){let e=t.length;for(;e--;)t[e].close()}static ɵfac=function(e){return new(e||i)};static ɵprov=$({token:i,factory:i.ɵfac})}return i})();var Zt=(()=>{class i{_dialogRef=p(C,{optional:!0});_elementRef=p(tt);_dialog=p(Yt);ngOnInit(){this._dialogRef||(this._dialogRef=ue(this._elementRef,this._dialog.openDialogs)),this._dialogRef&&Promise.resolve().then(()=>{this._onAdd()})}ngOnDestroy(){this._dialogRef?._containerInstance&&Promise.resolve().then(()=>{this._onRemove()})}static ɵfac=function(e){return new(e||i)};static ɵdir=rt$1({type:i})}return i})();var $t=(()=>{class i extends Zt{id=p(oe$1).getId(`mat-mdc-dialog-title-`);_onAdd(){this._dialogRef._containerInstance?._addAriaLabelledBy?.(this.id)}_onRemove(){this._dialogRef?._containerInstance?._removeAriaLabelledBy?.(this.id)}static ɵfac=(()=>{let t;return function(n){return(t||(t=Ag(i)))(n||i)}})();static ɵdir=rt$1({type:i,selectors:[[``,`mat-dialog-title`,``],[``,`matDialogTitle`,``]],hostAttrs:[1,`mat-mdc-dialog-title`,`mdc-dialog__title`],hostVars:1,hostBindings:function(e,n){e&2&&yv(`id`,n.id)},inputs:{id:`id`},exportAs:[`matDialogTitle`],features:[lv]})}return i})();var Kt=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵdir=rt$1({type:i,selectors:[[``,`mat-dialog-content`,``],[`mat-dialog-content`],[``,`matDialogContent`,``]],hostAttrs:[1,`mat-mdc-dialog-content`,`mdc-dialog__content`],features:[BS([he$1])]})}return i})();var Xt=(()=>{class i extends Zt{align;_onAdd(){this._dialogRef._containerInstance?._updateActionSectionCount?.(1)}_onRemove(){this._dialogRef._containerInstance?._updateActionSectionCount?.(-1)}static ɵfac=(()=>{let t;return function(n){return(t||(t=Ag(i)))(n||i)}})();static ɵdir=rt$1({type:i,selectors:[[``,`mat-dialog-actions`,``],[`mat-dialog-actions`],[``,`matDialogActions`,``]],hostAttrs:[1,`mat-mdc-dialog-actions`,`mdc-dialog__actions`],hostVars:6,hostBindings:function(e,n){e&2&&La(`mat-mdc-dialog-actions-align-start`,n.align===`start`)(`mat-mdc-dialog-actions-align-center`,n.align===`center`)(`mat-mdc-dialog-actions-align-end`,n.align===`end`)},inputs:{align:`align`},features:[lv]})}return i})();function ue(i,a){let t=i.nativeElement.parentElement;for(;t&&!t.classList.contains(`mat-mdc-dialog-container`);)t=t.parentElement;return t?a.find(e=>e.id===t.id):null}var Jt=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵmod=Dt({type:i});static ɵinj=qe({providers:[Yt],imports:[Ht,ge$1,Yt$1,RD]})}return i})();function pe(i,a){if(i&1&&(ya(0,`mat-icon`,1),Fb(1),_d()),i&2){let t=fb();rC(),Ov(t.data.icon)}}var te=class i{data=p(rt);dialogRef=p(C);cancel(){this.dialogRef.close(!1)}confirm(){this.dialogRef.close(!0)}static ɵfac=function(t){return new(t||i)};static ɵcmp=Jn({type:i,selectors:[[`app-confirmation-dialog`]],decls:10,vars:4,consts:[[`mat-dialog-title`,``],[`aria-hidden`,`true`],[`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`warn`,`type`,`button`,3,`click`]],template:function(t,e){t&1&&(ya(0,`h2`,0),tb(1,pe,2,1,`mat-icon`,1),Fb(2),_d(),ya(3,`mat-dialog-content`),Fb(4),_d(),ya(5,`mat-dialog-actions`,2)(6,`button`,3),ka(`click`,function(){return e.cancel()}),Fb(7,`Abbrechen`),_d(),ya(8,`button`,4),ka(`click`,function(){return e.confirm()}),Fb(9),_d()()),t&2&&(rC(),nb(e.data.icon?1:-1),rC(),Pd(` `,e.data.title,`
`),rC(2),Ov(e.data.message),rC(5),Pd(` `,e.data.confirmLabel??`Beenden`,` `))},dependencies:[Cn,zn,Jt,$t,Xt,Kt,R8,N8],styles:[`h2[mat-dialog-title][_ngcontent-%COMP%]{display:flex;align-items:center;gap:8px;margin-bottom:4px;color:var(--%NS%color-text)}h2[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}mat-dialog-content[_ngcontent-%COMP%]{max-width:360px;padding-top:8px!important;color:var(--%NS%color-text-muted);line-height:1.5}mat-dialog-actions[_ngcontent-%COMP%]{padding-bottom:8px}`]})};export{Xt as a,Kt as i,C as n,Yt as o,Jt as r,te as s,$t as t};