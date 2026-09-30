import{$n as wt,$t as ge,A as Gv,An as qd,Cn as p,Ct as Y,Dt as Ze,En as pi,F as Ib,Fn as sT,G as Mb,H as L,Hn as ue,I as Ip,It as cS,Jn as vo,K as Mv,Kn as vb,Kt as fa,L as It$1,M as Hd,N as Hr,Nt as bd,O as Gd,Ot as _s,P as Hv,Pn as rr,Pt as be,R as Iy,Rn as tT,S as Ev,Sn as ot,Vn as ud,X as Pv,Xt as gE,Y as P,Yn as vv,Yt as fz,Zn as wb,_ as Do,_t as Vv,at as Rv,bn as nr,bt as Wd,c as Ba,cn as jz,ct as T,dr as zd,dt as Tv,er as wv,f as DC,fn as lS,ft as Ua,g as Db,gt as Va,ht as Uz,i as $r,ir as y,it as Rb,j as Ha,jn as qo,kn as qc,kt as aM,ln as kb,lr as z,m as DH,mn as m,mr as zv,nn as hM,nr as xp,nt as Qv,or as yH,pn as ln$1,pr as zr,pt as Ud,qn as ve,rt as R,sn as jd,sr as yb,st as Sa,t as $d,tr as xc,tt as Qn$1,un as ke,v as Dv,w as Fd,wt as Ye,x as Ep,xn as nt,xt as Wy,yn as ne,z as K,zt as dn$1}from"./chunk-nhGvsPud.js";import{C as X,D as b,F as v,L as zi$1,R as zt$1,S as Tt,T as Ye$1,a as Ft$1,c as Le,d as N,f as Nn$1,g as Q,k as di,m as Ot,o as H,s as Ki$1,w as Xe,y as Rt$1}from"./chunk-DYwCRHbF.js";import{_ as ge$1,a as Vt$1,c as zt$2,f as Pt,g as _e,h as Y$1,i as T$1,l as Et$1,m as X$1,o as ee,p as Rt$2,r as Ht,s as jt,u as F,v as kt,x as xt,y as vt}from"./main-JIBB2VR6.js";import{b as sn,f as Ue,g as fe,i as Fn$1,n as B,p as Xt,r as En$1,s as Nn$2,t as $t,u as Sn$1,v as p$1}from"./chunk-CNUMkw8D.js";import{a as de,d as ot$1,i as ce,l as lt,n as Tn$1,o as fe$1,p as zt$3,r as X$2,s as it,t as Rn$1,u as me$1}from"./chunk-CZ-1KsDD.js";import{t as I}from"./chunk-Bgmfr7dU.js";import{n as I$1}from"./chunk-CPJMuFRV.js";import{n as mt,t as Yt}from"./chunk-LREnJoEF.js";var dn=[[[`mat-icon`],[``,`matMenuItemIcon`,``]],`*`];var cn=[`mat-icon, [matMenuItemIcon]`,`*`];function mn(n,a){n&1&&(xp(),Sa(0,`svg`,2),Ua(1,`polygon`,3),Fd())}var un=[`*`];function pn(n,a){if(n&1){let e=Mb();jd(0,`div`,0),Mv(`click`,function(){Ep(e);return Ip(Rb().closed.emit(`click`))})(`animationstart`,function(i){Ep(e);return Ip(Rb()._onAnimationStart(i.animationName))})(`animationend`,function(i){Ep(e);return Ip(Rb()._onAnimationDone(i.animationName))})(`animationcancel`,function(i){Ep(e);return Ip(Rb()._onAnimationDone(i.animationName))}),jd(1,`div`,1),$d(2),Ud()()}if(n&2){let e=Rb();Wd(e._classList),Ha(`mat-menu-panel-animations-disabled`,e._animationsDisabled)(`mat-menu-panel-exit-animation`,e._panelAnimationState===`void`)(`mat-menu-panel-animating`,e._isAnimating()),Tv(`id`,e.panelId),rr(`aria-label`,e.ariaLabel||null)(`aria-labelledby`,e.ariaLabelledby||null)(`aria-describedby`,e.ariaDescribedby||null)}}var Et=new y(`MAT_MENU_PANEL`);var Ge=(()=>{class n{_elementRef=p(nt);_document=p(z);_focusMonitor=p(Tt);_parentMenu=p(Et,{optional:!0});_changeDetectorRef=p($r);role=`menuitem`;disabled=!1;disableRipple=!1;_hovered=new Y;_focused=new Y;_highlighted=!1;_triggersSubmenu=!1;constructor(){p(aM).load(Ye$1),this._parentMenu?.addItem?.(this)}focus(e,t){this._focusMonitor&&e?this._focusMonitor.focusVia(this._getHostElement(),e,t):this._getHostElement().focus(t),this._focused.next(this)}ngAfterViewInit(){this._focusMonitor&&this._focusMonitor.monitor(this._elementRef,!1)}ngOnDestroy(){this._focusMonitor&&this._focusMonitor.stopMonitoring(this._elementRef),this._parentMenu&&this._parentMenu.removeItem&&this._parentMenu.removeItem(this),this._hovered.complete(),this._focused.complete()}_getTabIndex(){return this.disabled?`-1`:`0`}_getHostElement(){return this._elementRef.nativeElement}_checkDisabled(e){this.disabled&&(e.preventDefault(),e.stopPropagation())}_handleMouseEnter(){this._hovered.next(this)}getLabel(){let e=this._elementRef.nativeElement.cloneNode(!0),t=e.querySelectorAll(`mat-icon, .material-icons`);for(let i=0;i<t.length;i++)t[i].remove();return e.textContent?.trim()||``}_setHighlighted(e){this._highlighted=e,this._changeDetectorRef.markForCheck()}_setTriggersSubmenu(e){this._triggersSubmenu=e,this._changeDetectorRef.markForCheck()}_hasFocus(){return this._document&&this._document.activeElement===this._getHostElement()}static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[``,`mat-menu-item`,``]],hostAttrs:[1,`mat-mdc-menu-item`,`mat-focus-indicator`],hostVars:8,hostBindings:function(t,i){t&1&&Ba(`click`,function(c){return i._checkDisabled(c)})(`mouseenter`,function(){return i._handleMouseEnter()}),t&2&&(rr(`role`,i.role)(`tabindex`,i._getTabIndex())(`aria-disabled`,i.disabled)(`disabled`,i.disabled||null),Ha(`mat-mdc-menu-item-highlighted`,i._highlighted)(`mat-mdc-menu-item-submenu-trigger`,i._triggersSubmenu))},inputs:{role:`role`,disabled:[2,`disabled`,`disabled`,zr],disableRipple:[2,`disableRipple`,`disableRipple`,zr]},exportAs:[`matMenuItem`],ngContentSelectors:cn,decls:5,vars:3,consts:[[1,`mat-mdc-menu-item-text`],[`matRipple`,``,1,`mat-mdc-menu-ripple`,3,`matRippleDisabled`,`matRippleTrigger`],[`viewBox`,`0 0 5 10`,`focusable`,`false`,`aria-hidden`,`true`,1,`mat-mdc-menu-submenu-icon`],[`points`,`0,0 5,5 0,10`]],template:function(t,i){t&1&&(Hd(dn),$d(0),Sa(1,`span`,0),$d(2,1),Fd(),Ua(3,`div`,1),vb(4,mn,2,0,`:svg:svg`,2)),t&2&&(DC(3),wv(`matRippleDisabled`,i.disableRipple||i.disabled)(`matRippleTrigger`,i._getHostElement()),DC(),yb(i._triggersSubmenu?4:-1))},dependencies:[di],encapsulation:2})}return n})();var hn=new y(`MatMenuContent`);var _n=new y(`mat-menu-default-options`,{providedIn:`root`,factory:()=>({overlapTrigger:!1,xPosition:`after`,yPosition:`below`,backdropClass:`cdk-overlay-transparent-backdrop`})});var It=`_mat-menu-enter`;var ct=`_mat-menu-exit`;var He=(()=>{class n{_elementRef=p(nt);_changeDetectorRef=p($r);_injector=p(ge);_keyManager;_xPosition;_yPosition;_firstItemFocusRef;_exitFallbackTimeout;_animationsDisabled=H();_allItems;_directDescendantItems=new fa;_classList={};_panelAnimationState=`void`;_animationDone=new Y;_isAnimating=K(!1);parentMenu;direction;overlayPanelClass;backdropClass;ariaLabel;ariaLabelledby;ariaDescribedby;get xPosition(){return this._xPosition}set xPosition(e){this._xPosition=e,this.setPositionClasses()}get yPosition(){return this._yPosition}set yPosition(e){this._yPosition=e,this.setPositionClasses()}templateRef;items;lazyContent;overlapTrigger=!1;hasBackdrop;get panelClass(){return this._previousPanelClass}set panelClass(e){let t=this._previousPanelClass,i=m({},this._classList);t&&t.length&&t.split(` `).forEach(r=>{i[r]=!1}),this._previousPanelClass=e,e&&e.length&&(e.split(` `).forEach(r=>{i[r]=!0}),this._elementRef.nativeElement.className=``),this._classList=i}_previousPanelClass=``;get classList(){return this.panelClass}set classList(e){this.panelClass=e}closed=new ue;close=this.closed;panelId=p(Ft$1).getId(`mat-menu-panel-`);constructor(){let e=p(_n);this.overlayPanelClass=e.overlayPanelClass||``,this._xPosition=e.xPosition,this._yPosition=e.yPosition,this.backdropClass=e.backdropClass,this.overlapTrigger=e.overlapTrigger,this.hasBackdrop=e.hasBackdrop}ngOnInit(){this.setPositionClasses()}ngAfterContentInit(){this._updateDirectDescendants(),this._keyManager=new Rt$1(this._directDescendantItems).withWrap().withTypeAhead().withHomeAndEnd(),this._keyManager.tabOut.subscribe(()=>this.closed.emit(`tab`)),this._directDescendantItems.changes.pipe(qc(this._directDescendantItems),ke(e=>gE(...e.map(t=>t._focused)))).subscribe(e=>this._keyManager.updateActiveItem(e)),this._directDescendantItems.changes.subscribe(e=>{let t=this._keyManager;if(this._panelAnimationState===`enter`&&t.activeItem?._hasFocus()){let i=e.toArray(),r=Math.max(0,Math.min(i.length-1,t.activeItemIndex||0));i[r]&&!i[r].disabled?t.setActiveItem(r):t.setNextItemActive()}})}ngOnDestroy(){this._keyManager?.destroy(),this._directDescendantItems.destroy(),this.closed.complete(),this._firstItemFocusRef?.destroy(),clearTimeout(this._exitFallbackTimeout)}_hovered(){return this._directDescendantItems.changes.pipe(qc(this._directDescendantItems),ke(t=>gE(...t.map(i=>i._hovered))))}addItem(e){}removeItem(e){}_handleKeydown(e){let t=e.keyCode,i=this._keyManager;switch(t){case 27:Le(e)||(e.preventDefault(),this.closed.emit(`keydown`));break;case 37:this.parentMenu&&this.direction===`ltr`&&this.closed.emit(`keydown`);break;case 39:this.parentMenu&&this.direction===`rtl`&&this.closed.emit(`keydown`);break;default:(t===38||t===40)&&i.setFocusOrigin(`keyboard`),i.onKeydown(e);return}}focusFirstItem(e=`program`){this._firstItemFocusRef?.destroy(),this._firstItemFocusRef=ud(()=>{let t=this._resolvePanel();if(!t||!t.contains(document.activeElement)){let i=this._keyManager;i.setFocusOrigin(e).setFirstItemActive(),!i.activeItem&&t&&t.focus()}},{injector:this._injector})}resetActiveItem(){this._keyManager.setActiveItem(-1)}setElevation(e){}setPositionClasses(e=this.xPosition,t=this.yPosition){this._classList=L(m({},this._classList),{"mat-menu-before":e===`before`,"mat-menu-after":e===`after`,"mat-menu-above":t===`above`,"mat-menu-below":t===`below`}),this._changeDetectorRef.markForCheck()}_onAnimationDone(e){let t=e===ct;(t||e===It)&&(t&&(clearTimeout(this._exitFallbackTimeout),this._exitFallbackTimeout=void 0),this._animationDone.next(t?`void`:`enter`),this._isAnimating.set(!1))}_onAnimationStart(e){(e===It||e===ct)&&this._isAnimating.set(!0)}_setIsOpen(e){if(this._panelAnimationState=e?`enter`:`void`,e){if(this._keyManager.activeItemIndex===0){let t=this._resolvePanel();t&&(t.scrollTop=0)}}else this._animationsDisabled||(this._exitFallbackTimeout=setTimeout(()=>this._onAnimationDone(ct),200));this._animationsDisabled&&setTimeout(()=>{this._onAnimationDone(e?It:ct)}),this._changeDetectorRef.markForCheck()}_updateDirectDescendants(){this._allItems.changes.pipe(qc(this._allItems)).subscribe(e=>{this._directDescendantItems.reset(e.filter(t=>t._parentMenu===this)),this._directDescendantItems.notifyOnChanges()})}_resolvePanel(){let e=null;return this._directDescendantItems.length&&(e=this._directDescendantItems.first._getHostElement().closest(`[role="menu"]`)),e}static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[`mat-menu`]],contentQueries:function(t,i,r){if(t&1&&Va(r,hn,5)(r,Ge,5)(r,Ge,4),t&2){let c;zd(c=Gd())&&(i.lazyContent=c.first),zd(c=Gd())&&(i._allItems=c),zd(c=Gd())&&(i.items=c)}},viewQuery:function(t,i){if(t&1&&Rv(ln$1,5),t&2){let r;zd(r=Gd())&&(i.templateRef=r.first)}},hostVars:3,hostBindings:function(t,i){t&2&&rr(`aria-label`,null)(`aria-labelledby`,null)(`aria-describedby`,null)},inputs:{backdropClass:`backdropClass`,ariaLabel:[0,`aria-label`,`ariaLabel`],ariaLabelledby:[0,`aria-labelledby`,`ariaLabelledby`],ariaDescribedby:[0,`aria-describedby`,`ariaDescribedby`],xPosition:`xPosition`,yPosition:`yPosition`,overlapTrigger:[2,`overlapTrigger`,`overlapTrigger`,zr],hasBackdrop:[2,`hasBackdrop`,`hasBackdrop`,e=>e==null?null:zr(e)],panelClass:[0,`class`,`panelClass`],classList:`classList`},outputs:{closed:`closed`,close:`close`},exportAs:[`matMenu`],features:[Qv([{provide:Et,useExisting:n}])],ngContentSelectors:un,decls:1,vars:0,consts:[[`tabindex`,`-1`,`role`,`menu`,1,`mat-mdc-menu-panel`,3,`click`,`animationstart`,`animationend`,`animationcancel`,`id`],[1,`mat-mdc-menu-content`]],template:function(t,i){t&1&&(Hd(),Ev(0,pn,3,12,`ng-template`))},styles:[`mat-menu {
  display: none;
}

.mat-mdc-menu-content {
  margin: 0;
  padding: 8px 0;
  outline: 0;
}
.mat-mdc-menu-content,
.mat-mdc-menu-content .mat-mdc-menu-item .mat-mdc-menu-item-text {
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  flex: 1;
  white-space: normal;
  font-family: var(--%NS%mat-menu-item-label-text-font, var(--%NS%mat-sys-label-large-font));
  line-height: var(--%NS%mat-menu-item-label-text-line-height, var(--%NS%mat-sys-label-large-line-height));
  font-size: var(--%NS%mat-menu-item-label-text-size, var(--%NS%mat-sys-label-large-size));
  letter-spacing: var(--%NS%mat-menu-item-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  font-weight: var(--%NS%mat-menu-item-label-text-weight, var(--%NS%mat-sys-label-large-weight));
}

@keyframes _mat-menu-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes _mat-menu-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.mat-mdc-menu-panel {
  min-width: 112px;
  max-width: 280px;
  overflow: auto;
  box-sizing: border-box;
  outline: 0;
  animation: _mat-menu-enter 120ms cubic-bezier(0, 0, 0.2, 1);
  border-radius: var(--%NS%mat-menu-container-shape, var(--%NS%mat-sys-corner-extra-small));
  background-color: var(--%NS%mat-menu-container-color, var(--%NS%mat-sys-surface-container));
  box-shadow: var(--%NS%mat-menu-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));
  will-change: transform, opacity;
}
.mat-mdc-menu-panel.mat-menu-panel-exit-animation {
  animation: _mat-menu-exit 100ms 25ms linear forwards;
}
.mat-mdc-menu-panel.mat-menu-panel-animations-disabled {
  animation: none;
}
.mat-mdc-menu-panel.mat-menu-panel-animating {
  pointer-events: none;
}
.mat-mdc-menu-panel.mat-menu-panel-animating:has(.mat-mdc-menu-content:empty) {
  display: none;
}
@media (forced-colors: active) {
  .mat-mdc-menu-panel {
    outline: solid 1px;
  }
}
.mat-mdc-menu-panel .mat-divider {
  border-top-color: var(--%NS%mat-menu-divider-color, var(--%NS%mat-sys-surface-variant));
  margin-bottom: var(--%NS%mat-menu-divider-bottom-spacing, 8px);
  margin-top: var(--%NS%mat-menu-divider-top-spacing, 8px);
}

.mat-mdc-menu-item {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
  color: inherit;
  font-size: inherit;
  background: none;
  text-decoration: none;
  margin: 0;
  min-height: 48px;
  padding-left: var(--%NS%mat-menu-item-leading-spacing, 12px);
  padding-right: var(--%NS%mat-menu-item-trailing-spacing, 12px);
  -webkit-user-select: none;
  user-select: none;
  cursor: pointer;
  outline: none;
  border: none;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-menu-item::-moz-focus-inner {
  border: 0;
}
[dir=rtl] .mat-mdc-menu-item {
  padding-left: var(--%NS%mat-menu-item-trailing-spacing, 12px);
  padding-right: var(--%NS%mat-menu-item-leading-spacing, 12px);
}
.mat-mdc-menu-item:has(.material-icons, mat-icon, [matButtonIcon]) {
  padding-left: var(--%NS%mat-menu-item-with-icon-leading-spacing, 12px);
  padding-right: var(--%NS%mat-menu-item-with-icon-trailing-spacing, 12px);
}
[dir=rtl] .mat-mdc-menu-item:has(.material-icons, mat-icon, [matButtonIcon]) {
  padding-left: var(--%NS%mat-menu-item-with-icon-trailing-spacing, 12px);
  padding-right: var(--%NS%mat-menu-item-with-icon-leading-spacing, 12px);
}
.mat-mdc-menu-item, .mat-mdc-menu-item:visited, .mat-mdc-menu-item:link {
  color: var(--%NS%mat-menu-item-label-text-color, var(--%NS%mat-sys-on-surface));
}
.mat-mdc-menu-item .mat-icon-no-color,
.mat-mdc-menu-item .mat-mdc-menu-submenu-icon {
  color: var(--%NS%mat-menu-item-icon-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-menu-item[disabled] {
  cursor: default;
  opacity: 0.38;
}
.mat-mdc-menu-item[disabled]::after {
  display: block;
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
.mat-mdc-menu-item:focus {
  outline: 0;
}
.mat-mdc-menu-item .mat-icon {
  flex-shrink: 0;
  margin-right: var(--%NS%mat-menu-item-spacing, 12px);
  height: var(--%NS%mat-menu-item-icon-size, 24px);
  width: var(--%NS%mat-menu-item-icon-size, 24px);
}
[dir=rtl] .mat-mdc-menu-item {
  text-align: right;
}
[dir=rtl] .mat-mdc-menu-item .mat-icon {
  margin-right: 0;
  margin-left: var(--%NS%mat-menu-item-spacing, 12px);
}
.mat-mdc-menu-item:not([disabled]):hover {
  background-color: var(--%NS%mat-menu-item-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-hover-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-menu-item:not([disabled]).cdk-program-focused, .mat-mdc-menu-item:not([disabled]).cdk-keyboard-focused, .mat-mdc-menu-item:not([disabled]).mat-mdc-menu-item-highlighted {
  background-color: var(--%NS%mat-menu-item-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-focus-state-layer-opacity) * 100%), transparent));
}
@media (forced-colors: active) {
  .mat-mdc-menu-item {
    margin-top: 1px;
  }
}

.mat-mdc-menu-submenu-icon {
  width: var(--%NS%mat-menu-item-icon-size, 24px);
  height: 10px;
  fill: currentColor;
  padding-left: var(--%NS%mat-menu-item-spacing, 12px);
}
[dir=rtl] .mat-mdc-menu-submenu-icon {
  padding-right: var(--%NS%mat-menu-item-spacing, 12px);
  padding-left: 0;
}
[dir=rtl] .mat-mdc-menu-submenu-icon polygon {
  transform: scaleX(-1);
  transform-origin: center;
}
@media (forced-colors: active) {
  .mat-mdc-menu-submenu-icon {
    fill: CanvasText;
  }
}

.mat-mdc-menu-item .mat-mdc-menu-ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}
`],encapsulation:2})}return n})();var gn=new y(`mat-menu-scroll-strategy`,{providedIn:`root`,factory:()=>{let n=p(ge);return()=>kt(n)}});var We=new WeakMap;var fn=(()=>{class n{_canHaveBackdrop;_element=p(nt);_viewContainerRef=p(It$1);_menuItemInstance=p(Ge,{optional:!0,self:!0});_dir=p(hM,{optional:!0});_focusMonitor=p(Tt);_ngZone=p(ve);_injector=p(ge);_scrollStrategy=p(gn);_changeDetectorRef=p($r);_animationsDisabled=H();_portal;_overlayRef=null;_menuOpen=!1;_closingActionsSubscription=ne.EMPTY;_menuCloseSubscription=ne.EMPTY;_pendingRemoval;_parentMaterialMenu;_parentInnerPadding;_openedBy=void 0;get _menu(){return this._menuInternal}set _menu(e){e!==this._menuInternal&&(this._menuInternal=e,this._menuCloseSubscription.unsubscribe(),e?(this._parentMaterialMenu,this._menuCloseSubscription=e.close.subscribe(t=>{this._destroyMenu(t),(t===`click`||t===`tab`)&&this._parentMaterialMenu&&this._parentMaterialMenu.closed.emit(t)})):this._destroyMenu(),this._menuItemInstance?._setTriggersSubmenu(this._triggersSubmenu()))}_menuInternal=null;constructor(e){this._canHaveBackdrop=e;let t=p(Et,{optional:!0});this._parentMaterialMenu=t instanceof He?t:void 0}ngOnDestroy(){this._menu&&this._ownsMenu(this._menu)&&We.delete(this._menu),this._pendingRemoval?.unsubscribe(),this._menuCloseSubscription.unsubscribe(),this._closingActionsSubscription.unsubscribe(),this._overlayRef&&(this._overlayRef.dispose(),this._overlayRef=null)}get menuOpen(){return this._menuOpen}get dir(){return this._dir&&this._dir.value===`rtl`?`rtl`:`ltr`}_triggersSubmenu(){return!!(this._menuItemInstance&&this._parentMaterialMenu&&this._menu)}_closeMenu(){this._menu?.close.emit()}_openMenu(e){if(this._triggerIsAriaDisabled())return;let t=this._menu;if(this._menuOpen||!t)return;this._pendingRemoval?.unsubscribe();let i=We.get(t);We.set(t,this),i&&i!==this&&i._closeMenu();let r=this._createOverlay(t),c=r.getConfig(),p=c.positionStrategy;this._setPosition(t,p),this._canHaveBackdrop?c.hasBackdrop=t.hasBackdrop==null?!this._triggersSubmenu():t.hasBackdrop:c.hasBackdrop=t.hasBackdrop??!1,r.hasAttached()||(r.attach(this._getPortal(t)),t.lazyContent?.attach(this.menuData)),this._closingActionsSubscription=this._menuClosingActions().subscribe(()=>this._closeMenu()),t.parentMenu=this._triggersSubmenu()?this._parentMaterialMenu:void 0,t.direction=this.dir,e&&t.focusFirstItem(this._openedBy||`program`),this._setIsMenuOpen(!0),t instanceof He&&(t._setIsOpen(!0),t._directDescendantItems.changes.pipe(Do(t.close)).subscribe(()=>{p.withLockedPosition(!1).reapplyLastPosition(),p.withLockedPosition(!0)}))}focus(e,t){this._focusMonitor&&e?this._focusMonitor.focusVia(this._element,e,t):this._element.nativeElement.focus(t)}_destroyMenu(e){let t=this._overlayRef,i=this._menu;!t||!this.menuOpen||(this._closingActionsSubscription.unsubscribe(),this._pendingRemoval?.unsubscribe(),i instanceof He&&this._ownsMenu(i)?(this._pendingRemoval=i._animationDone.pipe(Ze(1)).subscribe(()=>{t.detach(),We.has(i)||i.lazyContent?.detach()}),i._setIsOpen(!1)):(t.detach(),i?.lazyContent?.detach()),i&&this._ownsMenu(i)&&We.delete(i),this.restoreFocus&&(e===`keydown`||!this._openedBy||!this._triggersSubmenu())&&this.focus(this._openedBy),this._openedBy=void 0,this._setIsMenuOpen(!1))}_setIsMenuOpen(e){e!==this._menuOpen&&(this._menuOpen=e,this._menuOpen?this.menuOpened.emit():this.menuClosed.emit(),this._triggersSubmenu()&&this._menuItemInstance._setHighlighted(e),this._changeDetectorRef.markForCheck())}_createOverlay(e){if(!this._overlayRef){let t=this._getOverlayConfig(e);this._subscribeToPositions(e,t.positionStrategy),this._overlayRef=Pt(this._injector,t),this._overlayRef.keydownEvents().subscribe(i=>{this._menu instanceof He&&this._menu._handleKeydown(i)})}return this._overlayRef}_getOverlayConfig(e){return new X$1({positionStrategy:xt(this._injector,this._getOverlayOrigin()).withLockedPosition().withGrowAfterOpen().withTransformOriginOn(`.mat-menu-panel, .mat-mdc-menu-panel`),backdropClass:e.backdropClass||`cdk-overlay-transparent-backdrop`,panelClass:e.overlayPanelClass,scrollStrategy:this._scrollStrategy(),direction:this._dir||`ltr`,disableAnimations:this._animationsDisabled})}_subscribeToPositions(e,t){e.setPositionClasses&&t.positionChanges.subscribe(i=>{this._ngZone.run(()=>{let r=i.connectionPair.overlayX===`start`?`after`:`before`,c=i.connectionPair.overlayY===`top`?`below`:`above`;e.setPositionClasses(r,c)})})}_setPosition(e,t){let[i,r]=e.xPosition===`before`?[`end`,`start`]:[`start`,`end`],[c,p]=e.yPosition===`above`?[`bottom`,`top`]:[`top`,`bottom`],[g,R]=[c,p],[w,U]=[i,r],I=0;if(this._triggersSubmenu()){if(U=i=e.xPosition===`before`?`start`:`end`,r=w=i===`end`?`start`:`end`,this._parentMaterialMenu){if(this._parentInnerPadding==null){let Ut=this._parentMaterialMenu.items.first;this._parentInnerPadding=Ut?Ut._getHostElement().offsetTop:0}I=c===`bottom`?this._parentInnerPadding:-this._parentInnerPadding}}else e.overlapTrigger||(g=c===`top`?`bottom`:`top`,R=p===`top`?`bottom`:`top`);t.withPositions([{originX:i,originY:g,overlayX:w,overlayY:c,offsetY:I},{originX:r,originY:g,overlayX:U,overlayY:c,offsetY:I},{originX:i,originY:R,overlayX:w,overlayY:p,offsetY:-I},{originX:r,originY:R,overlayX:U,overlayY:p,offsetY:-I}])}_menuClosingActions(){let e=this._getOutsideClickStream(this._overlayRef),t=this._overlayRef.detachments();return gE(e,this._parentMaterialMenu?this._parentMaterialMenu.closed:T(),this._parentMaterialMenu?this._parentMaterialMenu._hovered().pipe(be(c=>this._menuOpen&&c!==this._menuItemInstance)):T(),t)}_getPortal(e){return(!this._portal||this._portal.templateRef!==e.templateRef)&&(this._portal=new Y$1(e.templateRef,this._viewContainerRef)),this._portal}_ownsMenu(e){return We.get(e)===this}_triggerIsAriaDisabled(){return zr(this._element.nativeElement.getAttribute(`aria-disabled`))}static ɵfac=function(t){bd()};static ɵdir=ot({type:n})}return n})();var Li=(()=>{class n extends fn{_cleanupTouchstart;_hoverSubscription=ne.EMPTY;get _deprecatedMatMenuTriggerFor(){return this.menu}set _deprecatedMatMenuTriggerFor(e){this.menu=e}get menu(){return this._menu}set menu(e){this._menu=e}menuData;restoreFocus=!0;menuOpened=new ue;onMenuOpen=this.menuOpened;menuClosed=new ue;onMenuClose=this.menuClosed;constructor(){super(!0);let e=p(Qn$1);this._cleanupTouchstart=e.listen(this._element.nativeElement,`touchstart`,t=>{X(t)||(this._openedBy=`touch`)},{passive:!0})}triggersSubmenu(){return super._triggersSubmenu()}toggleMenu(){return this.menuOpen?this.closeMenu():this.openMenu()}openMenu(){this._openMenu(!0)}closeMenu(){this._closeMenu()}updatePosition(){this._overlayRef?.updatePosition()}ngAfterContentInit(){this._handleHover()}ngOnDestroy(){super.ngOnDestroy(),this._cleanupTouchstart(),this._hoverSubscription.unsubscribe()}_getOverlayOrigin(){return this._element}_getOutsideClickStream(e){return e.backdropClick()}_handleMousedown(e){Q(e)||(this._openedBy=e.button===0?`mouse`:void 0,this.triggersSubmenu()&&e.preventDefault())}_handleKeydown(e){let t=e.keyCode;(t===13||t===32)&&(this._openedBy=`keyboard`),this.triggersSubmenu()&&(t===39&&this.dir===`ltr`||t===37&&this.dir===`rtl`)&&(this._openedBy=`keyboard`,this.openMenu())}_handleClick(e){this.triggersSubmenu()?(e.stopPropagation(),this.openMenu()):this.toggleMenu()}_handleHover(){this.triggersSubmenu()&&this._parentMaterialMenu&&(this._hoverSubscription=this._parentMaterialMenu._hovered().subscribe(e=>{e===this._menuItemInstance&&!e.disabled&&this._parentMaterialMenu?._panelAnimationState!==`void`&&(this._openedBy=`mouse`,this._openMenu(!1))}))}static ɵfac=function(t){return new(t||n)};static ɵdir=ot({type:n,selectors:[[``,`mat-menu-trigger-for`,``],[``,`matMenuTriggerFor`,``]],hostAttrs:[1,`mat-mdc-menu-trigger`],hostVars:3,hostBindings:function(t,i){t&1&&Ba(`click`,function(c){return i._handleClick(c)})(`mousedown`,function(c){return i._handleMousedown(c)})(`keydown`,function(c){return i._handleKeydown(c)}),t&2&&rr(`aria-haspopup`,i.menu?`menu`:null)(`aria-expanded`,i.menuOpen)(`aria-controls`,i.menuOpen?i.menu?.panelId:null)},inputs:{_deprecatedMatMenuTriggerFor:[0,`mat-menu-trigger-for`,`_deprecatedMatMenuTriggerFor`],menu:[0,`matMenuTriggerFor`,`menu`],menuData:[0,`matMenuTriggerData`,`menuData`],restoreFocus:[0,`matMenuTriggerRestoreFocus`,`restoreFocus`]},outputs:{menuOpened:`menuOpened`,onMenuOpen:`onMenuOpen`,menuClosed:`menuClosed`,onMenuClose:`onMenuClose`},exportAs:[`matMenuTrigger`],features:[vv]})}return n})();var zi=(()=>{class n{static ɵfac=function(t){return new(t||n)};static ɵmod=wt({type:n});static ɵinj=Ye({imports:[Xe,ge$1,Wy,vt]})}return n})();var _t=class n{dialogRef=p(T$1);name=``;cancel(){this.dialogRef.close()}add(){let a=this.name.trim();a&&this.dialogRef.close(a)}static ɵfac=function(e){return new(e||n)};static ɵcmp=nr({type:n,selectors:[[`app-paddle-add-player-dialog`]],decls:12,vars:2,consts:[[`mat-dialog-title`,``],[`mat-dialog-content`,``,1,`dialog-form`,3,`submit`],[`appearance`,`outline`],[`matInput`,``,`name`,`playerName`,`autocomplete`,`off`,`autofocus`,``,3,`ngModelChange`,`ngModel`],[`mat-dialog-actions`,``,`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`]],template:function(e,t){e&1&&(Sa(0,`h2`,0),tT(1,`Spieler hinzufügen`),Fd(),Sa(2,`form`,1),Ba(`submit`,function(r){return r.preventDefault(),t.add()}),Sa(3,`mat-form-field`,2)(4,`mat-label`),tT(5,`Name`),Fd(),Sa(6,`input`,3),Gv(`ngModelChange`,function(r){return sT(t.name,r)||(t.name=r),r}),Fd(),cS(),Fd()(),Sa(7,`div`,4)(8,`button`,5),Ba(`click`,function(){return t.cancel()}),tT(9,`Abbrechen`),Fd(),Sa(10,`button`,6),Ba(`click`,function(){return t.add()}),tT(11,` Hinzufügen `),Fd()()),e&2&&(DC(6),zv(`ngModel`,t.name),lS(),DC(4),wv(`disabled`,!t.name.trim()))},dependencies:[Sn$1,Nn$2,Ue,En$1,Fn$1,Xt,$t,Ki$1,zi$1,Ht,jt,zt$2,Vt$1,me$1,it,de,Rn$1,Tn$1],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:320px}.dialog-form[_ngcontent-%COMP%]{padding-top:4px}mat-form-field[_ngcontent-%COMP%]{width:100%}[mat-dialog-actions][_ngcontent-%COMP%]{gap:8px}`]})};var qe=class{_multiple;_emitChanges;compareWith;_selection=new Set;_deselectedToEmit=[];_selectedToEmit=[];_selected=null;get selected(){return this._selected||(this._selected=Array.from(this._selection.values())),this._selected}changed=new Y;bulk={select:a=>this._select(a),deselect:a=>this._deselect(a),setSelection:a=>this._setSelection(a)};constructor(a=!1,e,t=!0,i){this._multiple=a,this._emitChanges=t,this.compareWith=i,e&&e.length&&(a?e.forEach(r=>this._markSelected(r)):this._markSelected(e[0]),this._selectedToEmit.length=0)}select(...a){return this._select(a)}deselect(...a){return this._deselect(a)}setSelection(...a){return this._setSelection(a)}toggle(a){return this.isSelected(a)?this.deselect(a):this.select(a)}clear(a=!0){this._unmarkAll();let e=this._hasQueuedChanges();return a&&this._emitChangeEvent(),e}isSelected(a){return this._selection.has(this._getConcreteValue(a))}isEmpty(){return this._selection.size===0}hasValue(){return!this.isEmpty()}sort(a){this._multiple&&this.selected&&this._selected.sort(a)}isMultipleSelection(){return this._multiple}_select(a){this._verifyValueAssignment(a),a.forEach(t=>this._markSelected(t));let e=this._hasQueuedChanges();return this._emitChangeEvent(),e}_deselect(a){this._verifyValueAssignment(a),a.forEach(t=>this._unmarkSelected(t));let e=this._hasQueuedChanges();return this._emitChangeEvent(),e}_setSelection(a){this._verifyValueAssignment(a);let e=this.selected,t=new Set(a.map(r=>this._getConcreteValue(r)));a.forEach(r=>this._markSelected(r)),e.filter(r=>!t.has(this._getConcreteValue(r,t))).forEach(r=>this._unmarkSelected(r));let i=this._hasQueuedChanges();return this._emitChangeEvent(),i}_emitChangeEvent(){this._selected=null,(this._selectedToEmit.length||this._deselectedToEmit.length)&&(this.changed.next({source:this,added:this._selectedToEmit,removed:this._deselectedToEmit}),this._deselectedToEmit=[],this._selectedToEmit=[])}_markSelected(a){a=this._getConcreteValue(a),this.isSelected(a)||(this._multiple||this._unmarkAll(),this.isSelected(a)||this._selection.add(a),this._emitChanges&&this._selectedToEmit.push(a))}_unmarkSelected(a){a=this._getConcreteValue(a),this.isSelected(a)&&(this._selection.delete(a),this._emitChanges&&this._deselectedToEmit.push(a))}_unmarkAll(){this.isEmpty()||this._selection.forEach(a=>this._unmarkSelected(a))}_verifyValueAssignment(a){a.length>1&&this._multiple}_hasQueuedChanges(){return!!(this._deselectedToEmit.length||this._selectedToEmit.length)}_getConcreteValue(a,e){if(this.compareWith){e=e??this._selection;for(let t of e)if(this.compareWith(a,t))return t;return a}else return a}};var Xi=(()=>{class n{_animationsDisabled=H();state=`unchecked`;disabled=!1;appearance=`full`;static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[`mat-pseudo-checkbox`]],hostAttrs:[1,`mat-pseudo-checkbox`],hostVars:12,hostBindings:function(t,i){t&2&&Ha(`mat-pseudo-checkbox-indeterminate`,i.state===`indeterminate`)(`mat-pseudo-checkbox-checked`,i.state===`checked`)(`mat-pseudo-checkbox-disabled`,i.disabled)(`mat-pseudo-checkbox-minimal`,i.appearance===`minimal`)(`mat-pseudo-checkbox-full`,i.appearance===`full`)(`_mat-animation-noopable`,i._animationsDisabled)},inputs:{state:`state`,disabled:`disabled`,appearance:`appearance`},decls:0,vars:0,template:function(t,i){},styles:[`.mat-pseudo-checkbox {
  border-radius: 2px;
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
  box-sizing: border-box;
  position: relative;
  flex-shrink: 0;
  transition: border-color 90ms cubic-bezier(0, 0, 0.2, 0.1), background-color 90ms cubic-bezier(0, 0, 0.2, 0.1);
}
.mat-pseudo-checkbox::after {
  position: absolute;
  opacity: 0;
  content: "";
  border-bottom: 2px solid currentColor;
  transition: opacity 90ms cubic-bezier(0, 0, 0.2, 0.1);
}
.mat-pseudo-checkbox._mat-animation-noopable {
  transition: none !important;
  animation: none !important;
}
.mat-pseudo-checkbox._mat-animation-noopable::after {
  transition: none;
}

.mat-pseudo-checkbox-disabled {
  cursor: default;
}

.mat-pseudo-checkbox-indeterminate::after {
  left: 1px;
  opacity: 1;
  border-radius: 2px;
}

.mat-pseudo-checkbox-checked::after {
  left: 1px;
  border-left: 2px solid currentColor;
  transform: rotate(-45deg);
  opacity: 1;
  box-sizing: content-box;
}

.mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-checked::after, .mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-indeterminate::after {
  color: var(--%NS%mat-pseudo-checkbox-minimal-selected-checkmark-color, var(--%NS%mat-sys-primary));
}
.mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-checked.mat-pseudo-checkbox-disabled::after, .mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-indeterminate.mat-pseudo-checkbox-disabled::after {
  color: var(--%NS%mat-pseudo-checkbox-minimal-disabled-selected-checkmark-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}

.mat-pseudo-checkbox-full {
  border-color: var(--%NS%mat-pseudo-checkbox-full-unselected-icon-color, var(--%NS%mat-sys-on-surface-variant));
  border-width: 2px;
  border-style: solid;
}
.mat-pseudo-checkbox-full.mat-pseudo-checkbox-disabled {
  border-color: var(--%NS%mat-pseudo-checkbox-full-disabled-unselected-icon-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-pseudo-checkbox-full.mat-pseudo-checkbox-checked, .mat-pseudo-checkbox-full.mat-pseudo-checkbox-indeterminate {
  background-color: var(--%NS%mat-pseudo-checkbox-full-selected-icon-color, var(--%NS%mat-sys-primary));
  border-color: transparent;
}
.mat-pseudo-checkbox-full.mat-pseudo-checkbox-checked::after, .mat-pseudo-checkbox-full.mat-pseudo-checkbox-indeterminate::after {
  color: var(--%NS%mat-pseudo-checkbox-full-selected-checkmark-color, var(--%NS%mat-sys-on-primary));
}
.mat-pseudo-checkbox-full.mat-pseudo-checkbox-checked.mat-pseudo-checkbox-disabled, .mat-pseudo-checkbox-full.mat-pseudo-checkbox-indeterminate.mat-pseudo-checkbox-disabled {
  background-color: var(--%NS%mat-pseudo-checkbox-full-disabled-selected-icon-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-pseudo-checkbox-full.mat-pseudo-checkbox-checked.mat-pseudo-checkbox-disabled::after, .mat-pseudo-checkbox-full.mat-pseudo-checkbox-indeterminate.mat-pseudo-checkbox-disabled::after {
  color: var(--%NS%mat-pseudo-checkbox-full-disabled-selected-checkmark-color, var(--%NS%mat-sys-surface));
}

.mat-pseudo-checkbox {
  width: 18px;
  height: 18px;
}

.mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-checked::after {
  width: 14px;
  height: 6px;
  transform-origin: center;
  top: -4.2426406871px;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
}
.mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-indeterminate::after {
  top: 8px;
  width: 16px;
}

.mat-pseudo-checkbox-full.mat-pseudo-checkbox-checked::after {
  width: 10px;
  height: 4px;
  transform-origin: center;
  top: -2.8284271247px;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
}
.mat-pseudo-checkbox-full.mat-pseudo-checkbox-indeterminate::after {
  top: 6px;
  width: 12px;
}
`],encapsulation:2})}return n})();var yn=[`text`];var xn=[[[`mat-icon`]],`*`];var Sn=[`mat-icon`,`*`];function Mn(n,a){if(n&1&&Ua(0,`mat-pseudo-checkbox`,1),n&2){let e=Rb();wv(`disabled`,e.disabled)(`state`,e.selected?`checked`:`unchecked`)}}function kn(n,a){if(n&1&&Ua(0,`mat-pseudo-checkbox`,3),n&2)wv(`disabled`,Rb().disabled)}function Cn(n,a){if(n&1&&(Sa(0,`span`,4),tT(1),Fd()),n&2){let e=Rb();DC(),qd(`(`,e.group.label,`)`)}}var Rt=new y(`MAT_OPTION_PARENT_COMPONENT`);var At=new y(`MatOptgroup`);var Dt=class{source;isUserInput;constructor(a,e=!1){this.source=a,this.isUserInput=e}};var Qe=(()=>{class n{_element=p(nt);_changeDetectorRef=p($r);_parent=p(Rt,{optional:!0});group=p(At,{optional:!0});_signalDisableRipple=!1;_selected=!1;_active=!1;_mostRecentViewValue=``;get multiple(){return this._parent&&this._parent.multiple}get selected(){return this._selected}value;id=p(Ft$1).getId(`mat-option-`);get disabled(){return this.group&&this.group.disabled||this._disabled()}set disabled(e){this._disabled.set(e)}_disabled=K(!1);get disableRipple(){return this._signalDisableRipple?this._parent.disableRipple():!!this._parent?.disableRipple}get hideSingleSelectionIndicator(){return!!(this._parent&&this._parent.hideSingleSelectionIndicator)}onSelectionChange=new ue;_text;_stateChanges=new Y;constructor(){let e=p(aM);e.load(Ye$1),e.load(fz),this._signalDisableRipple=!!this._parent&&qo(this._parent.disableRipple)}get active(){return this._active}get viewValue(){return(this._text?.nativeElement.textContent||``).trim()}select(e=!0){this._selected||(this._selected=!0,this._changeDetectorRef.markForCheck(),e&&this._emitSelectionChangeEvent())}deselect(e=!0){this._selected&&(this._selected=!1,this._changeDetectorRef.markForCheck(),e&&this._emitSelectionChangeEvent())}focus(e,t){let i=this._getHostElement();typeof i.focus==`function`&&i.focus(t)}setActiveStyles(){this._active||(this._active=!0,this._changeDetectorRef.markForCheck())}setInactiveStyles(){this._active&&(this._active=!1,this._changeDetectorRef.markForCheck())}getLabel(){return this.viewValue}_handleKeydown(e){(e.keyCode===13||e.keyCode===32)&&!Le(e)&&(this._selectViaInteraction(),e.preventDefault())}_selectViaInteraction(){this.disabled||(this._selected=this.multiple?!this._selected:!0,this._changeDetectorRef.markForCheck(),this._emitSelectionChangeEvent(!0))}_getTabIndex(){return this.disabled?`-1`:`0`}_getHostElement(){return this._element.nativeElement}ngAfterViewChecked(){if(this._selected){let e=this.viewValue;e!==this._mostRecentViewValue&&(this._mostRecentViewValue&&this._stateChanges.next(),this._mostRecentViewValue=e)}}ngOnDestroy(){this._stateChanges.complete()}_emitSelectionChangeEvent(e=!1){this.onSelectionChange.emit(new Dt(this,e))}static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[`mat-option`]],viewQuery:function(t,i){if(t&1&&Rv(yn,7),t&2){let r;zd(r=Gd())&&(i._text=r.first)}},hostAttrs:[`role`,`option`,1,`mat-mdc-option`,`mdc-list-item`],hostVars:11,hostBindings:function(t,i){t&1&&Ba(`click`,function(){return i._selectViaInteraction()})(`keydown`,function(c){return i._handleKeydown(c)}),t&2&&(Tv(`id`,i.id),rr(`aria-selected`,i.selected)(`aria-disabled`,i.disabled.toString()),Ha(`mdc-list-item--selected`,i.selected)(`mat-mdc-option-multiple`,i.multiple)(`mat-mdc-option-active`,i.active)(`mdc-list-item--disabled`,i.disabled))},inputs:{value:`value`,id:`id`,disabled:[2,`disabled`,`disabled`,zr]},outputs:{onSelectionChange:`onSelectionChange`},exportAs:[`matOption`],ngContentSelectors:Sn,decls:8,vars:5,consts:[[`text`,``],[`aria-hidden`,`true`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`,`state`],[1,`mdc-list-item__primary-text`],[`state`,`checked`,`aria-hidden`,`true`,`appearance`,`minimal`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`],[1,`cdk-visually-hidden`],[`aria-hidden`,`true`,`mat-ripple`,``,1,`mat-mdc-option-ripple`,`mat-focus-indicator`,3,`matRippleTrigger`,`matRippleDisabled`]],template:function(t,i){t&1&&(Hd(xn),vb(0,Mn,1,2,`mat-pseudo-checkbox`,1),$d(1),Sa(2,`span`,2,0),$d(4,1),Fd(),vb(5,kn,1,1,`mat-pseudo-checkbox`,3),vb(6,Cn,2,1,`span`,4),Ua(7,`div`,5)),t&2&&(yb(i.multiple?0:-1),DC(5),yb(!i.multiple&&i.selected&&!i.hideSingleSelectionIndicator?5:-1),DC(),yb(i.group&&i.group._inert?6:-1),DC(),wv(`matRippleTrigger`,i._getHostElement())(`matRippleDisabled`,i.disabled||i.disableRipple))},dependencies:[Xi,di],styles:[`.mat-mdc-option {
  -webkit-user-select: none;
  user-select: none;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  min-height: 48px;
  padding: 0 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  color: var(--%NS%mat-option-label-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-option-label-text-font, var(--%NS%mat-sys-label-large-font));
  line-height: var(--%NS%mat-option-label-text-line-height, var(--%NS%mat-sys-label-large-line-height));
  font-size: var(--%NS%mat-option-label-text-size, var(--%NS%mat-sys-body-large-size));
  letter-spacing: var(--%NS%mat-option-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  font-weight: var(--%NS%mat-option-label-text-weight, var(--%NS%mat-sys-body-large-weight));
}
.mat-mdc-option:hover:not(.mdc-list-item--disabled) {
  background-color: var(--%NS%mat-option-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-hover-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-option:focus.mdc-list-item, .mat-mdc-option.mat-mdc-option-active.mdc-list-item {
  background-color: var(--%NS%mat-option-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-focus-state-layer-opacity) * 100%), transparent));
  outline: 0;
}
.mat-mdc-option.mdc-list-item--%NS%selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) {
  background-color: var(--%NS%mat-option-selected-state-layer-color, var(--%NS%mat-sys-secondary-container));
}
.mat-mdc-option.mdc-list-item--%NS%selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) .mdc-list-item__primary-text {
  color: var(--%NS%mat-option-selected-state-label-text-color, var(--%NS%mat-sys-on-secondary-container));
}
.mat-mdc-option .mat-pseudo-checkbox {
  --%NS%mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--%NS%mat-option-selected-state-label-text-color, var(--%NS%mat-sys-on-secondary-container));
}
.mat-mdc-option.mdc-list-item {
  align-items: center;
  background: transparent;
}
.mat-mdc-option.mdc-list-item--disabled {
  cursor: default;
  pointer-events: none;
}
.mat-mdc-option.mdc-list-item--disabled .mat-mdc-option-pseudo-checkbox, .mat-mdc-option.mdc-list-item--disabled .mdc-list-item__primary-text, .mat-mdc-option.mdc-list-item--disabled > mat-icon {
  opacity: 0.38;
}
.mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
  padding-left: 32px;
}
[dir=rtl] .mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
  padding-left: 16px;
  padding-right: 32px;
}
.mat-mdc-option .mat-icon,
.mat-mdc-option .mat-pseudo-checkbox-full {
  margin-right: 16px;
  flex-shrink: 0;
}
[dir=rtl] .mat-mdc-option .mat-icon,
[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-full {
  margin-right: 0;
  margin-left: 16px;
}
.mat-mdc-option .mat-pseudo-checkbox-minimal {
  margin-left: 16px;
  flex-shrink: 0;
}
[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-minimal {
  margin-right: 16px;
  margin-left: 0;
}
.mat-mdc-option .mat-mdc-option-ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}
.mat-mdc-option .mdc-list-item__primary-text {
  white-space: normal;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-family: inherit;
  text-decoration: inherit;
  text-transform: inherit;
  margin-right: auto;
}
[dir=rtl] .mat-mdc-option .mdc-list-item__primary-text {
  margin-right: 0;
  margin-left: auto;
}
@media (forced-colors: active) {
  .mat-mdc-option.mdc-list-item--%NS%selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    width: 10px;
    height: 0;
    border-bottom: solid 10px;
    border-radius: 10px;
  }
  [dir=rtl] .mat-mdc-option.mdc-list-item--%NS%selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {
    right: auto;
    left: 16px;
  }
}

.mat-mdc-option-multiple {
  --%NS%mat-list-list-item-selected-container-color: var(--%NS%mat-list-list-item-container-color, transparent);
}

.mat-mdc-option-active .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2})}return n})();function ji(n,a,e){if(e.length){let t=a.toArray(),i=e.toArray(),r=0;for(let c=0;c<n+1;c++)t[c].group&&t[c].group===i[r]&&r++;return r}return 0}function Qi(n,a,e,t){return n<e?n:n+a>e+t?Math.max(0,n-t+a):e}var Ki=(()=>{class n{static ɵfac=function(t){return new(t||n)};static ɵmod=wt({type:n});static ɵinj=Ye({imports:[Wy]})}return n})();var Vt=(()=>{class n{static ɵfac=function(t){return new(t||n)};static ɵmod=wt({type:n});static ɵinj=Ye({imports:[Xe,Ki,Qe,Wy]})}return n})();var Tn=[`trigger`];var In=[`panel`];var Pn=[[[`mat-select-trigger`]],`*`];var En=[`mat-select-trigger`,`*`];function Nn(n,a){if(n&1&&(Sa(0,`span`,4),tT(1),Fd()),n&2){let e=Rb();DC(),Vv(e.placeholder)}}function On(n,a){n&1&&$d(0)}function Dn(n,a){if(n&1&&(Sa(0,`span`,11),tT(1),Fd()),n&2){let e=Rb(2);DC(),Vv(e.triggerValue)}}function Rn(n,a){if(n&1&&(Sa(0,`span`,5),vb(1,On,1,0)(2,Dn,2,1,`span`,11),Fd()),n&2){let e=Rb();DC(),yb(e.customTrigger?1:2)}}function An(n,a){if(n&1){let e=Mb();Sa(0,`div`,12,1),Ba(`keydown`,function(i){Ep(e);return Ip(Rb()._handleKeydown(i))}),$d(2,1),Fd()}if(n&2){let e=Rb();Wd(e.panelClass),Ha(`mat-select-panel-animations-enabled`,!e._animationsDisabled)(`mat-primary`,e._parentFormField?.color===`primary`)(`mat-accent`,e._parentFormField?.color===`accent`)(`mat-warn`,e._parentFormField?.color===`warn`)(`mat-undefined`,!e._parentFormField?.color),rr(`id`,e.id+`-panel`)(`aria-multiselectable`,e.multiple)(`aria-label`,e.ariaLabel||null)(`aria-labelledby`,e._getPanelAriaLabelledby())}}var Vn=new y(`mat-select-scroll-strategy`,{providedIn:`root`,factory:()=>{let n=p(ge);return()=>kt(n)}});var Fn=new y(`MAT_SELECT_CONFIG`);var Yi=new y(`MatSelectTrigger`);var Ft=class{source;value;constructor(a,e){this.source=a,this.value=e}};var Gi=(()=>{class n{_viewportRuler=p(F);_changeDetectorRef=p($r);_elementRef=p(nt);_dir=p(hM,{optional:!0});_idGenerator=p(Ft$1);_renderer=p(Qn$1);_parentFormField=p(fe$1,{optional:!0});ngControl=p(p$1,{self:!0,optional:!0});_liveAnnouncer=p(Nn$1);_defaultOptions=p(Fn,{optional:!0});_animationsDisabled=H();_popoverLocation;_initialized=new Y;_cleanupDetach;options;optionGroups;customTrigger;_positions=[{originX:`start`,originY:`bottom`,overlayX:`start`,overlayY:`top`},{originX:`end`,originY:`bottom`,overlayX:`end`,overlayY:`top`},{originX:`start`,originY:`top`,overlayX:`start`,overlayY:`bottom`,panelClass:`mat-mdc-select-panel-above`},{originX:`end`,originY:`top`,overlayX:`end`,overlayY:`bottom`,panelClass:`mat-mdc-select-panel-above`}];_scrollOptionIntoView(e){let t=this.options.toArray()[e];if(t){let i=this.panel.nativeElement,r=ji(e,this.options,this.optionGroups),c=t._getHostElement();e===0&&r===1?i.scrollTop=0:i.scrollTop=Qi(c.offsetTop,c.offsetHeight,i.scrollTop,i.offsetHeight)}}_positioningSettled(){this._scrollOptionIntoView(this._keyManager.activeItemIndex||0)}_getChangeEvent(e){return new Ft(this,e)}_scrollStrategyFactory=p(Vn);_panelOpen=!1;_compareWith=(e,t)=>e===t;_uid=this._idGenerator.getId(`mat-select-`);_triggerAriaLabelledBy=null;_previousControl;_destroy=new Y;_errorStateTracker;stateChanges=new Y;disableAutomaticLabeling=!0;userAriaDescribedBy;_selectionModel;_keyManager;_preferredOverlayOrigin;_overlayWidth;_onChange=()=>{};_onTouched=()=>{};_valueId=this._idGenerator.getId(`mat-select-value-`);_scrollStrategy;_overlayPanelClass=this._defaultOptions?.overlayPanelClass||``;get focused(){return this._focused||this._panelOpen}_focused=!1;controlType=`mat-select`;trigger;panel;_overlayDir;panelClass;disabled=!1;get disableRipple(){return this._disableRipple()}set disableRipple(e){this._disableRipple.set(e)}_disableRipple=K(!1);tabIndex=0;get hideSingleSelectionIndicator(){return this._hideSingleSelectionIndicator}set hideSingleSelectionIndicator(e){this._hideSingleSelectionIndicator=e,this._syncParentProperties()}_hideSingleSelectionIndicator=this._defaultOptions?.hideSingleSelectionIndicator??!1;get placeholder(){return this._placeholder}set placeholder(e){this._placeholder=e,this.stateChanges.next()}_placeholder;get required(){return this._required??this.ngControl?.control?.hasValidator(fe.required)??!1}set required(e){this._required=e,this.stateChanges.next()}_required;get multiple(){return this._multiple}set multiple(e){this._selectionModel,this._multiple=e}_multiple=!1;disableOptionCentering=this._defaultOptions?.disableOptionCentering??!1;get compareWith(){return this._compareWith}set compareWith(e){this._compareWith=e,this._selectionModel&&this._initializeSelection()}get value(){return this._value}set value(e){this._assignValue(e)&&this._onChange(e)}_value;ariaLabel=``;ariaLabelledby;get errorStateMatcher(){return this._errorStateTracker.matcher}set errorStateMatcher(e){this._errorStateTracker.matcher=e}typeaheadDebounceInterval;sortComparator;get id(){return this._id}set id(e){this._id=e||this._uid,this.stateChanges.next()}_id;get errorState(){return this._errorStateTracker.errorState}set errorState(e){this._errorStateTracker.errorState=e}panelWidth=this._defaultOptions&&typeof this._defaultOptions.panelWidth<`u`?this._defaultOptions.panelWidth:`auto`;canSelectNullableOptions=this._defaultOptions?.canSelectNullableOptions??!1;optionSelectionChanges=vo(()=>{let e=this.options;return e?e.changes.pipe(qc(e),ke(()=>gE(...e.map(t=>t.onSelectionChange)))):this._initialized.pipe(ke(()=>this.optionSelectionChanges))});openedChange=new ue;_openedStream=this.openedChange.pipe(be(e=>e),P(()=>{}));_closedStream=this.openedChange.pipe(be(e=>!e),P(()=>{}));selectionChange=new ue;valueChange=new ue;constructor(){let e=p(lt),t=p($t,{optional:!0}),i=p(sn,{optional:!0}),r=p(new Hr(`tabindex`),{optional:!0}),c=p(Et$1,{optional:!0}),p$2=p(ot$1,{optional:!0,self:!0});this.ngControl&&(this.ngControl.valueAccessor=this),this._defaultOptions?.typeaheadDebounceInterval!=null&&(this.typeaheadDebounceInterval=this._defaultOptions.typeaheadDebounceInterval),this._errorStateTracker=new X$2(e,p$2||this.ngControl,i,t,this.stateChanges),this._scrollStrategy=this._scrollStrategyFactory(),this.tabIndex=r==null?0:parseInt(r)||0,this._popoverLocation=c?.usePopover===!1?null:`inline`,this.id=this.id}ngOnInit(){this._selectionModel=new qe(this.multiple),this.stateChanges.next(),this._viewportRuler.change().pipe(Do(this._destroy)).subscribe(()=>{this.panelOpen&&(this._overlayWidth=this._getOverlayWidth(this._preferredOverlayOrigin),this._changeDetectorRef.detectChanges())})}ngAfterContentInit(){this._initialized.next(),this._initialized.complete(),this._initKeyManager(),this._selectionModel.changed.pipe(Do(this._destroy)).subscribe(e=>{e.added.forEach(t=>t.select()),e.removed.forEach(t=>t.deselect())}),this.options.changes.pipe(qc(null),Do(this._destroy)).subscribe(()=>{this._resetOptions(),this._initializeSelection()})}ngDoCheck(){let e=this._getTriggerAriaLabelledby(),t=this.ngControl;if(e!==this._triggerAriaLabelledBy){let i=this._elementRef.nativeElement;this._triggerAriaLabelledBy=e,e?i.setAttribute(`aria-labelledby`,e):i.removeAttribute(`aria-labelledby`)}t&&(this._previousControl!==t.control&&(this._previousControl!==void 0&&t.disabled!==null&&t.disabled!==this.disabled&&(this.disabled=t.disabled),this._previousControl=t.control),this.updateErrorState())}ngOnChanges(e){(e.disabled||e.userAriaDescribedBy)&&this.stateChanges.next(),e.typeaheadDebounceInterval&&this._keyManager&&this._keyManager.withTypeAhead(this.typeaheadDebounceInterval),e.panelClass&&this.panelClass instanceof Set&&(this.panelClass=Array.from(this.panelClass))}ngOnDestroy(){this._cleanupDetach?.(),this._keyManager?.destroy(),this._destroy.next(),this._destroy.complete(),this.stateChanges.complete()}toggle(){this.panelOpen?this.close():this.open()}open(){this._canOpen()&&(this._parentFormField&&(this._preferredOverlayOrigin=this._parentFormField.getConnectedOverlayOrigin()),this._cleanupDetach?.(),this._overlayWidth=this._getOverlayWidth(this._preferredOverlayOrigin),this._panelOpen=!0,this._overlayDir.positionChange.pipe(Ze(1)).subscribe(()=>{this._changeDetectorRef.detectChanges(),this._positioningSettled()}),this._overlayDir.attachOverlay(),this._keyManager.withHorizontalOrientation(null),this._highlightCorrectOption(),this._changeDetectorRef.markForCheck(),this.stateChanges.next(),Promise.resolve().then(()=>this.openedChange.emit(!0)))}close(){this._panelOpen&&(this._panelOpen=!1,this._exitAndDetach(),this._keyManager.withHorizontalOrientation(this._isRtl()?`rtl`:`ltr`),this._changeDetectorRef.markForCheck(),this._onTouched(),this.stateChanges.next(),Promise.resolve().then(()=>this.openedChange.emit(!1)))}_exitAndDetach(){if(this._animationsDisabled||!this.panel){this._detachOverlay();return}this._cleanupDetach?.(),this._cleanupDetach=()=>{t(),clearTimeout(i),this._cleanupDetach=void 0};let e=this.panel.nativeElement,t=this._renderer.listen(e,`animationend`,r=>{r.animationName===`_mat-select-exit`&&(this._cleanupDetach?.(),this._detachOverlay())}),i=setTimeout(()=>{this._cleanupDetach?.(),this._detachOverlay()},200);e.classList.add(`mat-select-panel-exit`)}_detachOverlay(){this._overlayDir.detachOverlay(),this._changeDetectorRef.markForCheck()}writeValue(e){this._assignValue(e)}registerOnChange(e){this._onChange=e}registerOnTouched(e){this._onTouched=e}setDisabledState(e){this.disabled=e,this._changeDetectorRef.markForCheck(),this.stateChanges.next()}get panelOpen(){return this._panelOpen}get selected(){return this.multiple?this._selectionModel?.selected||[]:this._selectionModel?.selected[0]}get triggerValue(){if(this.empty)return``;if(this._multiple){let e=this._selectionModel.selected.map(t=>t.viewValue);return this._isRtl()&&e.reverse(),e.join(`, `)}return this._selectionModel.selected[0].viewValue}updateErrorState(){this._errorStateTracker.updateErrorState()}_isRtl(){return this._dir?this._dir.value===`rtl`:!1}_handleKeydown(e){this.disabled||(this.panelOpen?this._handleOpenKeydown(e):this._handleClosedKeydown(e))}_handleClosedKeydown(e){let t=e.keyCode,i=t===40||t===38||t===37||t===39,r=t===13||t===32,c=this._keyManager;if(!c.isTyping()&&r&&!Le(e)||(this.multiple||e.altKey)&&i)e.preventDefault(),this.open();else if(!this.multiple){let p=this.selected;c.onKeydown(e);let g=this.selected;g&&p!==g&&this._liveAnnouncer.announce(g.viewValue,1e4)}}_handleOpenKeydown(e){let t=this._keyManager,i=e.keyCode,r=i===40||i===38,c=t.isTyping();if(r&&e.altKey)e.preventDefault(),this.close();else if(!c&&(i===13||i===32)&&t.activeItem&&!Le(e))e.preventDefault(),t.activeItem._selectViaInteraction();else if(!c&&this._multiple&&i===65&&e.ctrlKey){e.preventDefault();let p=this.options.some(g=>!g.disabled&&!g.selected);this.options.forEach(g=>{g.disabled||(p?g.select():g.deselect())})}else{let p=t.activeItemIndex;t.onKeydown(e),this._multiple&&r&&e.shiftKey&&t.activeItem&&t.activeItemIndex!==p&&t.activeItem._selectViaInteraction()}}_handleOverlayKeydown(e){e.keyCode===27&&!Le(e)&&(e.preventDefault(),this.close())}_onFocus(){this.disabled||(this._focused=!0,this.stateChanges.next())}_onBlur(){this._focused=!1,this._keyManager?.cancelTypeahead(),!this.disabled&&!this.panelOpen&&(this._onTouched(),this._changeDetectorRef.markForCheck(),this.stateChanges.next())}get empty(){return!this._selectionModel||this._selectionModel.isEmpty()}_initializeSelection(){Promise.resolve().then(()=>{this.ngControl&&(this._value=this.ngControl.value),this._setSelectionByValue(this._value),this.stateChanges.next()})}_setSelectionByValue(e){if(this.options.forEach(t=>t.setInactiveStyles()),this._selectionModel.clear(),this.multiple&&e)e.forEach(t=>this._selectOptionByValue(t)),this._sortValues();else{let t=this._selectOptionByValue(e);t?this._keyManager.updateActiveItem(t):this.panelOpen||this._keyManager.updateActiveItem(-1)}this._changeDetectorRef.markForCheck()}_selectOptionByValue(e){let t=this.options.find(i=>{if(this._selectionModel.isSelected(i))return!1;try{return(i.value!=null||this.canSelectNullableOptions)&&this._compareWith(i.value,e)}catch{return!1}});return t&&this._selectionModel.select(t),t}_assignValue(e){return e!==this._value||this._multiple&&Array.isArray(e)?(this.options&&this._setSelectionByValue(e),this._value=e,!0):!1}_skipPredicate=e=>this.panelOpen?!1:e.disabled;_getOverlayWidth(e){return this.panelWidth===`auto`?(e instanceof Rt$2?e.elementRef:e||this._elementRef).nativeElement.getBoundingClientRect().width:this.panelWidth===null?``:this.panelWidth}_syncParentProperties(){if(this.options)for(let e of this.options)e._changeDetectorRef.markForCheck()}_initKeyManager(){this._keyManager=new Ot(this.options).withTypeAhead(this.typeaheadDebounceInterval).withVerticalOrientation().withHorizontalOrientation(this._isRtl()?`rtl`:`ltr`).withHomeAndEnd().withPageUpDown().withAllowedModifierKeys([`shiftKey`]).skipPredicate(this._skipPredicate),this._keyManager.tabOut.subscribe(()=>{this.panelOpen&&(!this.multiple&&this._keyManager.activeItem&&this._keyManager.activeItem._selectViaInteraction(),this.focus(),this.close())}),this._keyManager.change.subscribe(()=>{this._panelOpen&&this.panel?this._scrollOptionIntoView(this._keyManager.activeItemIndex||0):!this._panelOpen&&!this.multiple&&this._keyManager.activeItem&&this._keyManager.activeItem._selectViaInteraction()})}_resetOptions(){let e=gE(this.options.changes,this._destroy);this.optionSelectionChanges.pipe(Do(e)).subscribe(t=>{this._onSelect(t.source,t.isUserInput),t.isUserInput&&!this.multiple&&this._panelOpen&&(this.close(),this.focus())}),gE(...this.options.map(t=>t._stateChanges)).pipe(Do(e)).subscribe(()=>{this._changeDetectorRef.detectChanges(),this.stateChanges.next()})}_onSelect(e,t){let i=this._selectionModel.isSelected(e);!this.canSelectNullableOptions&&e.value==null&&!this._multiple?(e.deselect(),this._selectionModel.clear(),this.value!=null&&this._propagateChanges(e.value)):(i!==e.selected&&(e.selected?this._selectionModel.select(e):this._selectionModel.deselect(e)),t&&this._keyManager.setActiveItem(e),this.multiple&&(this._sortValues(),t&&this.focus())),i!==this._selectionModel.isSelected(e)&&this._propagateChanges(),this.stateChanges.next()}_sortValues(){if(this.multiple){let e=this.options.toArray();this._selectionModel.sort((t,i)=>this.sortComparator?this.sortComparator(t,i,e):e.indexOf(t)-e.indexOf(i)),this.stateChanges.next()}}_propagateChanges(e){let t;this.multiple?t=this.selected.map(i=>i.value):t=this.selected?this.selected.value:e,this._value=t,this.valueChange.emit(t),this._onChange(t),this.selectionChange.emit(this._getChangeEvent(t)),this._changeDetectorRef.markForCheck()}_highlightCorrectOption(){if(this._keyManager)if(this.empty){let e=-1;for(let t=0;t<this.options.length;t++)if(!this.options.get(t).disabled){e=t;break}this._keyManager.setActiveItem(e)}else this._keyManager.setActiveItem(this._selectionModel.selected[0])}_canOpen(){return!this._panelOpen&&!this.disabled&&this.options?.length>0&&!!this._overlayDir}focus(e){this._elementRef.nativeElement.focus(e)}_getPanelAriaLabelledby(){if(this.ariaLabel)return null;let e=this._parentFormField?.getLabelId()||null,t=e?e+` `:``;return this.ariaLabelledby?t+this.ariaLabelledby:e}_getAriaActiveDescendant(){return this.panelOpen&&this._keyManager&&this._keyManager.activeItem?this._keyManager.activeItem.id:null}_getTriggerAriaLabelledby(){if(this.ariaLabel)return null;let e=this._parentFormField?.getLabelId()||``;return this.ariaLabelledby&&(e+=` `+this.ariaLabelledby),e||(e=this._valueId),e}get describedByIds(){return this._elementRef.nativeElement.getAttribute(`aria-describedby`)?.split(` `)||[]}setDescribedByIds(e){let t=this._elementRef.nativeElement;e.length?t.setAttribute(`aria-describedby`,e.join(` `)):t.removeAttribute(`aria-describedby`)}onContainerClick(e){let t=N(e);t&&(t.tagName===`MAT-OPTION`||t.classList.contains(`cdk-overlay-backdrop`)||t.closest(`.mat-mdc-select-panel`))||(this.focus(),this.open())}get shouldLabelFloat(){return this.panelOpen||!this.empty||this.focused&&!!this.placeholder}static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[`mat-select`]],contentQueries:function(t,i,r){if(t&1&&Va(r,Yi,5)(r,Qe,5)(r,At,5),t&2){let c;zd(c=Gd())&&(i.customTrigger=c.first),zd(c=Gd())&&(i.options=c),zd(c=Gd())&&(i.optionGroups=c)}},viewQuery:function(t,i){if(t&1&&Rv(Tn,5)(In,5)(_e,5),t&2){let r;zd(r=Gd())&&(i.trigger=r.first),zd(r=Gd())&&(i.panel=r.first),zd(r=Gd())&&(i._overlayDir=r.first)}},hostAttrs:[`role`,`combobox`,`aria-haspopup`,`listbox`,1,`mat-mdc-select`],hostVars:21,hostBindings:function(t,i){t&1&&Ba(`keydown`,function(c){return i._handleKeydown(c)})(`focus`,function(){return i._onFocus()})(`blur`,function(){return i._onBlur()}),t&2&&(rr(`id`,i.id)(`tabindex`,i.disabled?-1:i.tabIndex)(`aria-controls`,i.panelOpen?i.id+`-panel`:null)(`aria-expanded`,i.panelOpen)(`aria-label`,i.ariaLabel||null)(`aria-required`,i.required.toString())(`aria-disabled`,i.disabled.toString())(`aria-invalid`,i.errorState)(`aria-activedescendant`,i._getAriaActiveDescendant()),Ha(`mat-mdc-select-disabled`,i.disabled)(`mat-mdc-select-invalid`,i.errorState)(`mat-mdc-select-required`,i.required)(`mat-mdc-select-empty`,i.empty)(`mat-mdc-select-multiple`,i.multiple)(`mat-select-open`,i.panelOpen))},inputs:{userAriaDescribedBy:[0,`aria-describedby`,`userAriaDescribedBy`],panelClass:`panelClass`,disabled:[2,`disabled`,`disabled`,zr],disableRipple:[2,`disableRipple`,`disableRipple`,zr],tabIndex:[2,`tabIndex`,`tabIndex`,e=>e==null?0:yH(e)],hideSingleSelectionIndicator:[2,`hideSingleSelectionIndicator`,`hideSingleSelectionIndicator`,zr],placeholder:`placeholder`,required:[2,`required`,`required`,zr],multiple:[2,`multiple`,`multiple`,zr],disableOptionCentering:[2,`disableOptionCentering`,`disableOptionCentering`,zr],compareWith:`compareWith`,value:`value`,ariaLabel:[0,`aria-label`,`ariaLabel`],ariaLabelledby:[0,`aria-labelledby`,`ariaLabelledby`],errorStateMatcher:`errorStateMatcher`,typeaheadDebounceInterval:[2,`typeaheadDebounceInterval`,`typeaheadDebounceInterval`,yH],sortComparator:`sortComparator`,id:`id`,panelWidth:`panelWidth`,canSelectNullableOptions:[2,`canSelectNullableOptions`,`canSelectNullableOptions`,zr]},outputs:{openedChange:`openedChange`,_openedStream:`opened`,_closedStream:`closed`,selectionChange:`selectionChange`,valueChange:`valueChange`},exportAs:[`matSelect`],features:[Qv([{provide:ce,useExisting:n},{provide:Rt,useExisting:n}]),dn$1],ngContentSelectors:En,decls:11,vars:10,consts:[[`fallbackOverlayOrigin`,`cdkOverlayOrigin`,`trigger`,``],[`panel`,``],[`cdk-overlay-origin`,``,1,`mat-mdc-select-trigger`,3,`click`],[1,`mat-mdc-select-value`],[1,`mat-mdc-select-placeholder`,`mat-mdc-select-min-line`],[1,`mat-mdc-select-value-text`],[1,`mat-mdc-select-arrow-wrapper`],[1,`mat-mdc-select-arrow`],[`viewBox`,`0 0 24 24`,`width`,`24px`,`height`,`24px`,`focusable`,`false`,`aria-hidden`,`true`],[`d`,`M7 10l5 5 5-5z`],[`cdk-connected-overlay`,``,`cdkConnectedOverlayHasBackdrop`,``,`cdkConnectedOverlayBackdropClass`,`cdk-overlay-transparent-backdrop`,3,`detach`,`backdropClick`,`overlayKeydown`,`cdkConnectedOverlayDisableClose`,`cdkConnectedOverlayPanelClass`,`cdkConnectedOverlayScrollStrategy`,`cdkConnectedOverlayOrigin`,`cdkConnectedOverlayPositions`,`cdkConnectedOverlayWidth`,`cdkConnectedOverlayFlexibleDimensions`,`cdkConnectedOverlayUsePopover`],[1,`mat-mdc-select-min-line`],[`role`,`listbox`,`tabindex`,`-1`,1,`mat-mdc-select-panel`,`mdc-menu-surface`,`mdc-menu-surface--open`,3,`keydown`]],template:function(t,i){if(t&1&&(Hd(Pn),Sa(0,`div`,2,0),Ba(`click`,function(){return i.open()}),Sa(3,`div`,3),vb(4,Nn,2,1,`span`,4)(5,Rn,3,1,`span`,5),Fd(),Sa(6,`div`,6)(7,`div`,7),xp(),Sa(8,`svg`,8),Ua(9,`path`,9),Fd()()()(),Dv(10,An,3,16,`ng-template`,10),Ba(`detach`,function(){return i.close()})(`backdropClick`,function(){return i.close()})(`overlayKeydown`,function(c){return i._handleOverlayKeydown(c)})),t&2){let r=kb(1);DC(3),rr(`id`,i._valueId),DC(),yb(i.empty?4:5),DC(6),wv(`cdkConnectedOverlayDisableClose`,!0)(`cdkConnectedOverlayPanelClass`,i._overlayPanelClass)(`cdkConnectedOverlayScrollStrategy`,i._scrollStrategy)(`cdkConnectedOverlayOrigin`,i._preferredOverlayOrigin||r)(`cdkConnectedOverlayPositions`,i._positions)(`cdkConnectedOverlayWidth`,i._overlayWidth)(`cdkConnectedOverlayFlexibleDimensions`,!0)(`cdkConnectedOverlayUsePopover`,i._popoverLocation)}},dependencies:[Rt$2,_e],styles:[`@keyframes _mat-select-enter {
  from {
    opacity: 0;
    transform: scaleY(0.8);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes _mat-select-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.mat-mdc-select {
  display: inline-block;
  width: 100%;
  outline: none;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  color: var(--%NS%mat-select-enabled-trigger-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-select-trigger-text-font, var(--%NS%mat-sys-body-large-font));
  line-height: var(--%NS%mat-select-trigger-text-line-height, var(--%NS%mat-sys-body-large-line-height));
  font-size: var(--%NS%mat-select-trigger-text-size, var(--%NS%mat-sys-body-large-size));
  font-weight: var(--%NS%mat-select-trigger-text-weight, var(--%NS%mat-sys-body-large-weight));
  letter-spacing: var(--%NS%mat-select-trigger-text-tracking, var(--%NS%mat-sys-body-large-tracking));
}

div.mat-mdc-select-panel {
  box-shadow: var(--%NS%mat-select-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));
}

.mat-mdc-select-disabled {
  color: var(--%NS%mat-select-disabled-trigger-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-mdc-select-disabled .mat-mdc-select-placeholder {
  color: var(--%NS%mat-select-disabled-trigger-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}

.mat-mdc-select-trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  width: 100%;
}
.mat-mdc-select-disabled .mat-mdc-select-trigger {
  -webkit-user-select: none;
  user-select: none;
  cursor: default;
}

.mat-mdc-select-value {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mat-mdc-select-value-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-mdc-select-arrow-wrapper {
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}
.mat-form-field-appearance-fill .mdc-text-field--no-label .mat-mdc-select-arrow-wrapper {
  transform: none;
}

.mat-mdc-form-field .mat-mdc-select.mat-mdc-select-invalid .mat-mdc-select-arrow,
.mat-form-field-invalid:not(.mat-form-field-disabled) .mat-mdc-form-field-infix::after {
  color: var(--%NS%mat-select-invalid-arrow-color, var(--%NS%mat-sys-error));
}

.mat-mdc-select-arrow {
  width: 10px;
  height: 5px;
  position: relative;
  color: var(--%NS%mat-select-enabled-arrow-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-form-field.mat-focused .mat-mdc-select-arrow {
  color: var(--%NS%mat-select-focused-arrow-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-form-field .mat-mdc-select.mat-mdc-select-disabled .mat-mdc-select-arrow {
  color: var(--%NS%mat-select-disabled-arrow-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-select-open .mat-mdc-select-arrow {
  transform: rotate(180deg);
}
.mat-form-field-animations-enabled .mat-mdc-select-arrow {
  transition: transform 80ms linear;
}
.mat-mdc-select-arrow svg {
  fill: currentColor;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
@media (forced-colors: active) {
  .mat-mdc-select-arrow svg {
    fill: CanvasText;
  }
  .mat-mdc-select-disabled .mat-mdc-select-arrow svg {
    fill: GrayText;
  }
}

div.mat-mdc-select-panel {
  width: 100%;
  max-height: 275px;
  outline: 0;
  overflow: auto;
  padding: 8px 0;
  box-sizing: border-box;
  transform-origin: top center;
  border-radius: 0 0 4px 4px;
  position: relative;
  background-color: var(--%NS%mat-select-panel-background-color, var(--%NS%mat-sys-surface-container));
}
.mat-mdc-select-panel-above div.mat-mdc-select-panel {
  border-radius: 4px 4px 0 0;
  transform-origin: bottom center;
}
@media (forced-colors: active) {
  div.mat-mdc-select-panel {
    outline: solid 1px;
  }
}

.mat-select-panel-animations-enabled {
  animation: _mat-select-enter 120ms cubic-bezier(0, 0, 0.2, 1);
}
.mat-select-panel-animations-enabled.mat-select-panel-exit {
  animation: _mat-select-exit 100ms linear;
}

.mat-mdc-select-placeholder {
  transition: color 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1);
  color: var(--%NS%mat-select-placeholder-text-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-form-field:not(.mat-form-field-animations-enabled) .mat-mdc-select-placeholder, ._mat-animation-noopable .mat-mdc-select-placeholder {
  transition: none;
}
.mat-form-field-hide-placeholder .mat-mdc-select-placeholder {
  color: transparent;
  -webkit-text-fill-color: transparent;
  transition: none;
  display: block;
}

.mat-mdc-form-field-type-mat-select:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper {
  cursor: pointer;
}
.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-fill .mat-mdc-floating-label {
  max-width: calc(100% - 18px);
}
.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-fill .mdc-floating-label--float-above {
  max-width: calc(100% / 0.75 - 24px);
}
.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-outline .mdc-notched-outline__notch {
  max-width: calc(100% - 60px);
}
.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-outline .mdc-text-field--label-floating .mdc-notched-outline__notch {
  max-width: calc(100% - 24px);
}

.mat-mdc-select-min-line:empty::before {
  content: " ";
  white-space: pre;
  width: 1px;
  display: inline-block;
  visibility: hidden;
}

.mat-form-field-appearance-fill .mat-mdc-select-arrow-wrapper {
  transform: var(--%NS%mat-select-arrow-transform, translateY(-8px));
}
`],encapsulation:2})}return n})();var qi=(()=>{class n{static ɵfac=function(t){return new(t||n)};static ɵdir=ot({type:n,selectors:[[`mat-select-trigger`]],features:[Qv([{provide:Yi,useExisting:n}])]})}return n})();var $i=(()=>{class n{static ɵfac=function(t){return new(t||n)};static ɵmod=wt({type:n});static ɵinj=Ye({imports:[ge$1,Vt,Wy,vt,me$1,Vt]})}return n})();var Ln=[`knob`];var zn=[`valueIndicatorContainer`];function Un(n,a){if(n&1&&(Sa(0,`div`,2,1)(2,`div`,5)(3,`span`,6),tT(4),Fd()()()),n&2){let e=Rb();DC(4),Vv(e.valueIndicatorText)}}var Wn=[`trackActive`];var Hn=[`*`];function Xn(n,a){if(n&1&&Ua(0,`div`),n&2){let e=a.$implicit,t=a.$index,i=Rb(3);Wd(e===0?`mdc-slider__tick-mark--active`:`mdc-slider__tick-mark--inactive`),Pv(`transform`,i._calcTickMarkTransform(t))}}function jn(n,a){if(n&1&&Ib(0,Xn,1,4,`div`,8,Db),n&2)wb(Rb(2)._tickMarks)}function Qn(n,a){if(n&1&&(Sa(0,`div`,6,1),vb(2,jn,2,0),Fd()),n&2){let e=Rb();DC(2),yb(e._cachedWidth?2:-1)}}function Kn(n,a){if(n&1&&Ua(0,`mat-slider-visual-thumb`,7),n&2){let e=Rb();wv(`discrete`,e.discrete)(`thumbPosition`,1)(`valueIndicatorText`,e.startValueIndicatorText)}}var u=(function(n){return n[n.START=1]=`START`,n[n.END=2]=`END`,n})(u||{});var Ke=(function(n){return n[n.ACTIVE=0]=`ACTIVE`,n[n.INACTIVE=1]=`INACTIVE`,n})(Ke||{});var Bt=new y(`_MatSlider`);var Zi=new y(`_MatSliderThumb`);var Yn=new y(`_MatSliderRangeThumb`);var Ji=new y(`_MatSliderVisualThumb`);var Gn=(()=>{class n{_cdr=p($r);_ngZone=p(ve);_slider=p(Bt);_renderer=p(Qn$1);_listenerCleanups;discrete=!1;thumbPosition;valueIndicatorText;_ripple;_knob;_valueIndicatorContainer;_sliderInput;_sliderInputEl;_hoverRippleRef;_focusRippleRef;_activeRippleRef;_isHovered=!1;_isActive=!1;_isValueIndicatorVisible=!1;_hostElement=p(nt).nativeElement;_platform=p(b);ngAfterViewInit(){let e=this._slider._getInput(this.thumbPosition);e&&(this._ripple.radius=24,this._sliderInput=e,this._sliderInputEl=this._sliderInput._hostElement,this._ngZone.runOutsideAngular(()=>{let t=this._sliderInputEl,i=this._renderer;this._listenerCleanups=[i.listen(t,`pointermove`,this._onPointerMove),i.listen(t,`pointerdown`,this._onDragStart),i.listen(t,`pointerup`,this._onDragEnd),i.listen(t,`pointerleave`,this._onMouseLeave),i.listen(t,`focus`,this._onFocus),i.listen(t,`blur`,this._onBlur)]}))}ngOnDestroy(){this._listenerCleanups?.forEach(e=>e())}_onPointerMove=e=>{if(this._sliderInput._isFocused)return;let t=this._hostElement.getBoundingClientRect(),i=this._slider._isCursorOnSliderThumb(e,t);this._isHovered=i,i?this._showHoverRipple():this._hideRipple(this._hoverRippleRef)};_onMouseLeave=()=>{this._isHovered=!1,this._hideRipple(this._hoverRippleRef)};_onFocus=()=>{this._hideRipple(this._hoverRippleRef),this._showFocusRipple(),this._hostElement.classList.add(`mdc-slider__thumb--focused`)};_onBlur=()=>{this._isActive||this._hideRipple(this._focusRippleRef),this._isHovered&&this._showHoverRipple(),this._hostElement.classList.remove(`mdc-slider__thumb--focused`)};_onDragStart=e=>{e.button===0&&(this._isActive=!0,this._showActiveRipple())};_onDragEnd=()=>{this._isActive=!1,this._hideRipple(this._activeRippleRef),this._sliderInput._isFocused||this._hideRipple(this._focusRippleRef),this._platform.SAFARI&&this._showHoverRipple()};_showHoverRipple(){this._isShowingRipple(this._hoverRippleRef)||(this._hoverRippleRef=this._showRipple({enterDuration:0,exitDuration:0}),this._hoverRippleRef?.element.classList.add(`mat-mdc-slider-hover-ripple`))}_showFocusRipple(){this._isShowingRipple(this._focusRippleRef)||(this._focusRippleRef=this._showRipple({enterDuration:0,exitDuration:0},!0),this._focusRippleRef?.element.classList.add(`mat-mdc-slider-focus-ripple`))}_showActiveRipple(){this._isShowingRipple(this._activeRippleRef)||(this._activeRippleRef=this._showRipple({enterDuration:225,exitDuration:400}),this._activeRippleRef?.element.classList.add(`mat-mdc-slider-active-ripple`))}_isShowingRipple(e){return e?.state===v.FADING_IN||e?.state===v.VISIBLE}_showRipple(e,t){if(!this._slider.disabled&&(this._showValueIndicator(),this._slider._isRange&&this._slider._getThumb(this.thumbPosition===u.START?u.END:u.START)._showValueIndicator(),!(this._slider._globalRippleOptions?.disabled&&!t)))return this._ripple.launch({animation:this._slider._noopAnimations?{enterDuration:0,exitDuration:0}:e,centered:!0,persistent:!0})}_hideRipple(e){if(e?.fadeOut(),this._isShowingAnyRipple())return;this._slider._isRange||this._hideValueIndicator();let t=this._getSibling();t._isShowingAnyRipple()||(this._hideValueIndicator(),t._hideValueIndicator())}_showValueIndicator(){this._hostElement.classList.add(`mdc-slider__thumb--with-indicator`)}_hideValueIndicator(){this._hostElement.classList.remove(`mdc-slider__thumb--with-indicator`)}_getSibling(){return this._slider._getThumb(this.thumbPosition===u.START?u.END:u.START)}_getValueIndicatorContainer(){return this._valueIndicatorContainer?.nativeElement}_getKnob(){return this._knob.nativeElement}_isShowingAnyRipple(){return this._isShowingRipple(this._hoverRippleRef)||this._isShowingRipple(this._focusRippleRef)||this._isShowingRipple(this._activeRippleRef)}static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[`mat-slider-visual-thumb`]],viewQuery:function(t,i){if(t&1&&Rv(di,5)(Ln,5)(zn,5),t&2){let r;zd(r=Gd())&&(i._ripple=r.first),zd(r=Gd())&&(i._knob=r.first),zd(r=Gd())&&(i._valueIndicatorContainer=r.first)}},hostAttrs:[1,`mdc-slider__thumb`,`mat-mdc-slider-visual-thumb`],inputs:{discrete:`discrete`,thumbPosition:`thumbPosition`,valueIndicatorText:`valueIndicatorText`},features:[Qv([{provide:Ji,useExisting:n}])],decls:4,vars:2,consts:[[`knob`,``],[`valueIndicatorContainer`,``],[1,`mdc-slider__value-indicator-container`],[1,`mdc-slider__thumb-knob`],[`matRipple`,``,1,`mat-focus-indicator`,3,`matRippleDisabled`],[1,`mdc-slider__value-indicator`],[1,`mdc-slider__value-indicator-text`]],template:function(t,i){t&1&&(vb(0,Un,5,1,`div`,2),Ua(1,`div`,3,0)(3,`div`,4)),t&2&&(yb(i.discrete?0:-1),DC(3),wv(`matRippleDisabled`,!0))},dependencies:[di],styles:[`.mat-mdc-slider-visual-thumb .mat-ripple {
  height: 100%;
  width: 100%;
}

.mat-mdc-slider .mdc-slider__tick-marks {
  justify-content: start;
}
.mat-mdc-slider .mdc-slider__tick-marks .mdc-slider__tick-mark--active,
.mat-mdc-slider .mdc-slider__tick-marks .mdc-slider__tick-mark--inactive {
  position: absolute;
  left: 2px;
}
`],encapsulation:2})}return n})();var en=(()=>{class n{_ngZone=p(ve);_cdr=p($r);_elementRef=p(nt);_dir=p(hM,{optional:!0});_globalRippleOptions=p(zt$1,{optional:!0});_trackActive;_thumbs;_input;_inputs;get disabled(){return this._disabled}set disabled(e){this._disabled=e;let t=this._getInput(u.END),i=this._getInput(u.START);t&&(t.disabled=this._disabled),i&&(i.disabled=this._disabled)}_disabled=!1;get discrete(){return this._discrete}set discrete(e){this._discrete=e,this._updateValueIndicatorUIs()}_discrete=!1;get showTickMarks(){return this._showTickMarks}set showTickMarks(e){this._showTickMarks=e,this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI())}_showTickMarks=!1;get min(){return this._min}set min(e){let t=e==null||isNaN(e)?this._min:e;this._min!==t&&this._updateMin(t)}_min=0;color;disableRipple=!1;_updateMin(e){let t=this._min;this._min=e,this._isRange?this._updateMinRange({old:t,new:e}):this._updateMinNonRange(e),this._onMinMaxOrStepChange()}_updateMinRange(e){let t=this._getInput(u.END),i=this._getInput(u.START),r=t.value,c=i.value;i.min=e.new,t.min=Math.max(e.new,i.value),i.max=Math.min(t.max,t.value),i._updateWidthInactive(),t._updateWidthInactive(),e.new<e.old?this._onTranslateXChangeBySideEffect(t,i):this._onTranslateXChangeBySideEffect(i,t),r!==t.value&&this._onValueChange(t),c!==i.value&&this._onValueChange(i)}_updateMinNonRange(e){let t=this._getInput(u.END);if(t){let i=t.value;t.min=e,t._updateThumbUIByValue(),this._updateTrackUI(t),i!==t.value&&this._onValueChange(t)}}get max(){return this._max}set max(e){let t=e==null||isNaN(e)?this._max:e;this._max!==t&&this._updateMax(t)}_max=100;_updateMax(e){let t=this._max;this._max=e,this._isRange?this._updateMaxRange({old:t,new:e}):this._updateMaxNonRange(e),this._onMinMaxOrStepChange()}_updateMaxRange(e){let t=this._getInput(u.END),i=this._getInput(u.START),r=t.value,c=i.value;t.max=e.new,i.max=Math.min(e.new,t.value),t.min=i.value,t._updateWidthInactive(),i._updateWidthInactive(),e.new>e.old?this._onTranslateXChangeBySideEffect(i,t):this._onTranslateXChangeBySideEffect(t,i),r!==t.value&&this._onValueChange(t),c!==i.value&&this._onValueChange(i)}_updateMaxNonRange(e){let t=this._getInput(u.END);if(t){let i=t.value;t.max=e,t._updateThumbUIByValue(),this._updateTrackUI(t),i!==t.value&&this._onValueChange(t)}}get step(){return this._step}set step(e){let t=isNaN(e)?this._step:e;this._step!==t&&this._updateStep(t)}_step=1;_updateStep(e){this._step=e,this._isRange?this._updateStepRange():this._updateStepNonRange(),this._onMinMaxOrStepChange()}_updateStepRange(){let e=this._getInput(u.END),t=this._getInput(u.START),i=e.value,r=t.value,c=t.value;e.min=this._min,t.max=this._max,e.step=this._step,t.step=this._step,this._platform.SAFARI&&(e.value=e.value,t.value=t.value),e.min=Math.max(this._min,t.value),t.max=Math.min(this._max,e.value),t._updateWidthInactive(),e._updateWidthInactive(),e.value<c?this._onTranslateXChangeBySideEffect(t,e):this._onTranslateXChangeBySideEffect(e,t),i!==e.value&&this._onValueChange(e),r!==t.value&&this._onValueChange(t)}_updateStepNonRange(){let e=this._getInput(u.END);if(e){let t=e.value;e.step=this._step,this._platform.SAFARI&&(e.value=e.value),e._updateThumbUIByValue(),t!==e.value&&this._onValueChange(e)}}displayWith=e=>`${e}`;_tickMarks;_noopAnimations=H();_resizeObserver=null;_cachedWidth;_cachedLeft;_rippleRadius=24;startValueIndicatorText=``;endValueIndicatorText=``;_endThumbTransform;_startThumbTransform;_isRange=!1;_isRtl=pi(()=>this._dir?.valueSignal()===`rtl`);_hasViewInitialized=!1;_tickMarkTrackWidth=0;_hasAnimation=!1;_resizeTimer=null;_platform=p(b);constructor(){p(aM).load(Ye$1);let e=this._isRtl();DH(()=>{let t=this._isRtl();t!==e&&(e=t,this._isRange?this._onDirChangeRange():this._onDirChangeNonRange(),this._updateTickMarkUI())})}_knobRadius=8;_inputPadding;ngAfterViewInit(){this._platform.isBrowser&&this._updateDimensions();let e=this._getInput(u.END),t=this._getInput(u.START);this._isRange=!!e&&!!t,this._cdr.detectChanges();let i=this._getThumb(u.END);this._rippleRadius=i._ripple.radius,this._inputPadding=this._rippleRadius-this._knobRadius,this._isRange?this._initUIRange(e,t):this._initUINonRange(e),this._updateTrackUI(e),this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._observeHostResize(),this._cdr.detectChanges()}_initUINonRange(e){e.initProps(),e.initUI(),this._updateValueIndicatorUI(e),this._hasViewInitialized=!0,e._updateThumbUIByValue()}_initUIRange(e,t){e.initProps(),e.initUI(),t.initProps(),t.initUI(),e._updateMinMax(),t._updateMinMax(),e._updateStaticStyles(),t._updateStaticStyles(),this._updateValueIndicatorUIs(),this._hasViewInitialized=!0,e._updateThumbUIByValue(),t._updateThumbUIByValue()}ngOnDestroy(){this._resizeObserver?.disconnect(),this._resizeObserver=null}_onDirChangeRange(){let e=this._getInput(u.END),t=this._getInput(u.START);e._setIsLeftThumb(),t._setIsLeftThumb(),e.translateX=e._calcTranslateXByValue(),t.translateX=t._calcTranslateXByValue(),e._updateStaticStyles(),t._updateStaticStyles(),e._updateWidthInactive(),t._updateWidthInactive(),e._updateThumbUIByValue(),t._updateThumbUIByValue()}_onDirChangeNonRange(){this._getInput(u.END)._updateThumbUIByValue()}_observeHostResize(){typeof ResizeObserver>`u`||!ResizeObserver||this._ngZone.runOutsideAngular(()=>{this._resizeObserver=new ResizeObserver(()=>{this._isActive()||(this._resizeTimer&&clearTimeout(this._resizeTimer),this._onResize())}),this._resizeObserver.observe(this._elementRef.nativeElement)})}_isActive(){return this._getThumb(u.START)._isActive||this._getThumb(u.END)._isActive}_getValue(e=u.END){let t=this._getInput(e);return t?t.value:this.min}_skipUpdate(){return!!(this._getInput(u.START)?._skipUIUpdate||this._getInput(u.END)?._skipUIUpdate)}_updateDimensions(){this._cachedWidth=this._elementRef.nativeElement.offsetWidth,this._cachedLeft=this._elementRef.nativeElement.getBoundingClientRect().left}_setTrackActiveStyles(e){let t=this._trackActive.nativeElement.style;t.left=e.left,t.right=e.right,t.transformOrigin=e.transformOrigin,t.transform=e.transform}_calcTickMarkTransform(e){let t=e*(this._tickMarkTrackWidth/(this._tickMarks.length-1));return`translateX(${this._isRtl()?this._cachedWidth-6-t:t}px)`}_onTranslateXChange(e){this._hasViewInitialized&&(this._updateThumbUI(e),this._updateTrackUI(e),this._updateOverlappingThumbUI(e))}_onTranslateXChangeBySideEffect(e,t){this._hasViewInitialized&&(e._updateThumbUIByValue(),t._updateThumbUIByValue())}_onValueChange(e){this._hasViewInitialized&&(this._updateValueIndicatorUI(e),this._updateTickMarkUI(),this._cdr.detectChanges())}_onMinMaxOrStepChange(){this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.markForCheck())}_onResize(){if(this._hasViewInitialized){if(this._updateDimensions(),this._isRange){let e=this._getInput(u.END),t=this._getInput(u.START);e._updateThumbUIByValue(),t._updateThumbUIByValue(),e._updateStaticStyles(),t._updateStaticStyles(),e._updateMinMax(),t._updateMinMax(),e._updateWidthInactive(),t._updateWidthInactive()}else{let e=this._getInput(u.END);e&&e._updateThumbUIByValue()}this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.detectChanges()}}_thumbsOverlap=!1;_areThumbsOverlapping(){let e=this._getInput(u.START),t=this._getInput(u.END);return!e||!t?!1:t.translateX-e.translateX<20}_updateOverlappingThumbClassNames(e){let t=e.getSibling(),i=this._getThumb(e.thumbPosition);this._getThumb(t.thumbPosition)._hostElement.classList.remove(`mdc-slider__thumb--top`),i._hostElement.classList.toggle(`mdc-slider__thumb--top`,this._thumbsOverlap)}_updateOverlappingThumbUI(e){!this._isRange||this._skipUpdate()||this._thumbsOverlap!==this._areThumbsOverlapping()&&(this._thumbsOverlap=!this._thumbsOverlap,this._updateOverlappingThumbClassNames(e))}_updateThumbUI(e){if(this._skipUpdate())return;let t=this._getThumb(e.thumbPosition===u.END?u.END:u.START);t._hostElement.style.transform=`translateX(${e.translateX}px)`}_updateValueIndicatorUI(e){if(this._skipUpdate())return;let t=this.displayWith(e.value);if(this._hasViewInitialized?e._valuetext.set(t):e._hostElement.setAttribute(`aria-valuetext`,t),this.discrete){e.thumbPosition===u.START?this.startValueIndicatorText=t:this.endValueIndicatorText=t;let i=this._getThumb(e.thumbPosition);t.length<3?i._hostElement.classList.add(`mdc-slider__thumb--short-value`):i._hostElement.classList.remove(`mdc-slider__thumb--short-value`)}}_updateValueIndicatorUIs(){let e=this._getInput(u.END),t=this._getInput(u.START);e&&this._updateValueIndicatorUI(e),t&&this._updateValueIndicatorUI(t)}_updateTickMarkTrackUI(){if(!this.showTickMarks||this._skipUpdate())return;let e=this._step&&this._step>0?this._step:1,i=(Math.floor(this.max/e)*e-this.min)/(this.max-this.min);this._tickMarkTrackWidth=(this._cachedWidth-6)*i}_updateTrackUI(e){this._skipUpdate()||(this._isRange?this._updateTrackUIRange(e):this._updateTrackUINonRange(e))}_updateTrackUIRange(e){let t=e.getSibling();if(!t||!this._cachedWidth)return;let i=Math.abs(t.translateX-e.translateX)/this._cachedWidth;e._isLeftThumb&&this._cachedWidth?this._setTrackActiveStyles({left:`auto`,right:`${this._cachedWidth-t.translateX}px`,transformOrigin:`right`,transform:`scaleX(${i})`}):this._setTrackActiveStyles({left:`${t.translateX}px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${i})`})}_updateTrackUINonRange(e){this._isRtl()?this._setTrackActiveStyles({left:`auto`,right:`0px`,transformOrigin:`right`,transform:`scaleX(${1-e.fillPercentage})`}):this._setTrackActiveStyles({left:`0px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${e.fillPercentage})`})}_updateTickMarkUI(){if(!this.showTickMarks||this.step===void 0||this.min===void 0||this.max===void 0)return;let e=this.step>0?this.step:1;this._isRange?this._updateTickMarkUIRange(e):this._updateTickMarkUINonRange(e)}_updateTickMarkUINonRange(e){let t=this._getValue(),i=Math.max(Math.round((t-this.min)/e),0)+1,r=Math.max(Math.round((this.max-t)/e),0)-1;this._isRtl()?i++:r++,this._tickMarks=Array(i).fill(Ke.ACTIVE).concat(Array(r).fill(Ke.INACTIVE))}_updateTickMarkUIRange(e){let t=this._getValue(),i=this._getValue(u.START),r=Math.max(Math.round((i-this.min)/e),0),c=Math.max(Math.round((t-i)/e)+1,0),p=Math.max(Math.round((this.max-t)/e),0);this._tickMarks=Array(r).fill(Ke.INACTIVE).concat(Array(c).fill(Ke.ACTIVE),Array(p).fill(Ke.INACTIVE))}_getInput(e){if(e===u.END&&this._input)return this._input;if(this._inputs?.length)return e===u.START?this._inputs.first:this._inputs.last}_getThumb(e){return e===u.END?this._thumbs?.last:this._thumbs?.first}_setTransition(e){this._hasAnimation=!this._platform.IOS&&e&&!this._noopAnimations,this._elementRef.nativeElement.classList.toggle(`mat-mdc-slider-with-animation`,this._hasAnimation)}_isCursorOnSliderThumb(e,t){let i=t.width/2,r=t.x+i,c=t.y+i,p=e.clientX-r,g=e.clientY-c;return Math.pow(p,2)+Math.pow(g,2)<Math.pow(i,2)}static ɵfac=function(t){return new(t||n)};static ɵcmp=nr({type:n,selectors:[[`mat-slider`]],contentQueries:function(t,i,r){if(t&1&&Va(r,Zi,5)(r,Yn,4),t&2){let c;zd(c=Gd())&&(i._input=c.first),zd(c=Gd())&&(i._inputs=c)}},viewQuery:function(t,i){if(t&1&&Rv(Wn,5)(Ji,5),t&2){let r;zd(r=Gd())&&(i._trackActive=r.first),zd(r=Gd())&&(i._thumbs=r)}},hostAttrs:[1,`mat-mdc-slider`,`mdc-slider`],hostVars:12,hostBindings:function(t,i){t&2&&(Wd(`mat-`+(i.color||`primary`)),Ha(`mdc-slider--range`,i._isRange)(`mdc-slider--disabled`,i.disabled)(`mdc-slider--discrete`,i.discrete)(`mdc-slider--tick-marks`,i.showTickMarks)(`_mat-animation-noopable`,i._noopAnimations))},inputs:{disabled:[2,`disabled`,`disabled`,zr],discrete:[2,`discrete`,`discrete`,zr],showTickMarks:[2,`showTickMarks`,`showTickMarks`,zr],min:[2,`min`,`min`,yH],color:`color`,disableRipple:[2,`disableRipple`,`disableRipple`,zr],max:[2,`max`,`max`,yH],step:[2,`step`,`step`,yH],displayWith:`displayWith`},exportAs:[`matSlider`],features:[Qv([{provide:Bt,useExisting:n}])],ngContentSelectors:Hn,decls:9,vars:5,consts:[[`trackActive`,``],[`tickMarkContainer`,``],[1,`mdc-slider__track`],[1,`mdc-slider__track--inactive`],[1,`mdc-slider__track--active`],[1,`mdc-slider__track--active_fill`],[1,`mdc-slider__tick-marks`],[3,`discrete`,`thumbPosition`,`valueIndicatorText`],[3,`class`,`transform`]],template:function(t,i){t&1&&(Hd(),$d(0),Sa(1,`div`,2),Ua(2,`div`,3),Sa(3,`div`,4),Ua(4,`div`,5,0),Fd(),vb(6,Qn,3,1,`div`,6),Fd(),vb(7,Kn,1,3,`mat-slider-visual-thumb`,7),Ua(8,`mat-slider-visual-thumb`,7)),t&2&&(DC(6),yb(i.showTickMarks?6:-1),DC(),yb(i._isRange?7:-1),DC(),wv(`discrete`,i.discrete)(`thumbPosition`,2)(`valueIndicatorText`,i.endValueIndicatorText))},dependencies:[Gn],styles:[`.mdc-slider__track {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  pointer-events: none;
  height: var(--%NS%mat-slider-inactive-track-height, 4px);
}

.mdc-slider__track--active,
.mdc-slider__track--inactive {
  display: flex;
  height: 100%;
  position: absolute;
  width: 100%;
}

.mdc-slider__track--active {
  overflow: hidden;
  border-radius: var(--%NS%mat-slider-active-track-shape, var(--%NS%mat-sys-corner-full));
  height: var(--%NS%mat-slider-active-track-height, 4px);
  top: calc((var(--%NS%mat-slider-inactive-track-height, 4px) - var(--%NS%mat-slider-active-track-height, 4px)) / 2);
}

.mdc-slider__track--active_fill {
  border-top-style: solid;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  position: relative;
  transform-origin: left;
  transition: transform 80ms ease;
  border-color: var(--%NS%mat-slider-active-track-color, var(--%NS%mat-sys-primary));
  border-top-width: var(--%NS%mat-slider-active-track-height, 4px);
}
.mdc-slider--disabled .mdc-slider__track--active_fill {
  border-color: var(--%NS%mat-slider-disabled-active-track-color, var(--%NS%mat-sys-on-surface));
}
[dir=rtl] .mdc-slider__track--active_fill {
  -webkit-transform-origin: right;
  transform-origin: right;
}

.mdc-slider__track--inactive {
  left: 0;
  top: 0;
  opacity: 0.24;
  background-color: var(--%NS%mat-slider-inactive-track-color, var(--%NS%mat-sys-surface-variant));
  height: var(--%NS%mat-slider-inactive-track-height, 4px);
  border-radius: var(--%NS%mat-slider-inactive-track-shape, var(--%NS%mat-sys-corner-full));
}
.mdc-slider--disabled .mdc-slider__track--inactive {
  background-color: var(--%NS%mat-slider-disabled-inactive-track-color, var(--%NS%mat-sys-on-surface));
  opacity: 0.24;
}
.mdc-slider__track--%NS%inactive::before {
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
@media (forced-colors: active) {
  .mdc-slider__track--%NS%inactive::before {
    border-color: CanvasText;
  }
}

.mdc-slider__value-indicator-container {
  bottom: 44px;
  left: 50%;
  pointer-events: none;
  position: absolute;
  transform: var(--%NS%mat-slider-value-indicator-container-transform, translateX(-50%) rotate(-45deg));
}
.mdc-slider__thumb--with-indicator .mdc-slider__value-indicator-container {
  pointer-events: auto;
}

.mdc-slider__value-indicator {
  display: flex;
  align-items: center;
  transform: scale(0);
  transform-origin: var(--%NS%mat-slider-value-indicator-transform-origin, 0 28px);
  transition: transform 100ms cubic-bezier(0.4, 0, 1, 1);
  word-break: normal;
  background-color: var(--%NS%mat-slider-label-container-color, var(--%NS%mat-sys-primary));
  color: var(--%NS%mat-slider-label-label-text-color, var(--%NS%mat-sys-on-primary));
  width: var(--%NS%mat-slider-value-indicator-width, 28px);
  height: var(--%NS%mat-slider-value-indicator-height, 28px);
  padding: var(--%NS%mat-slider-value-indicator-padding, 0);
  opacity: var(--%NS%mat-slider-value-indicator-opacity, 1);
  border-radius: var(--%NS%mat-slider-value-indicator-border-radius, 50% 50% 50% 0);
}
.mdc-slider__thumb--with-indicator .mdc-slider__value-indicator {
  transition: transform 100ms cubic-bezier(0, 0, 0.2, 1);
  transform: scale(1);
}
.mdc-slider__value-indicator::before {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid;
  bottom: -5px;
  content: "";
  height: 0;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  width: 0;
  display: var(--%NS%mat-slider-value-indicator-caret-display, none);
  border-top-color: var(--%NS%mat-slider-label-container-color, var(--%NS%mat-sys-primary));
}
.mdc-slider__value-indicator::after {
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
@media (forced-colors: active) {
  .mdc-slider__value-indicator::after {
    border-color: CanvasText;
  }
}

.mdc-slider__value-indicator-text {
  text-align: center;
  width: var(--%NS%mat-slider-value-indicator-width, 28px);
  transform: var(--%NS%mat-slider-value-indicator-text-transform, rotate(45deg));
  font-family: var(--%NS%mat-slider-label-label-text-font, var(--%NS%mat-sys-label-medium-font));
  font-size: var(--%NS%mat-slider-label-label-text-size, var(--%NS%mat-sys-label-medium-size));
  font-weight: var(--%NS%mat-slider-label-label-text-weight, var(--%NS%mat-sys-label-medium-weight));
  line-height: var(--%NS%mat-slider-label-label-text-line-height, var(--%NS%mat-sys-label-medium-line-height));
  letter-spacing: var(--%NS%mat-slider-label-label-text-tracking, var(--%NS%mat-sys-label-medium-tracking));
}

.mdc-slider__thumb {
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  left: -24px;
  outline: none;
  position: absolute;
  height: 48px;
  width: 48px;
  pointer-events: none;
}
.mdc-slider--discrete .mdc-slider__thumb {
  transition: transform 80ms ease;
}
.mdc-slider--disabled .mdc-slider__thumb {
  pointer-events: none;
}

.mdc-slider__thumb--top {
  z-index: 1;
}

.mdc-slider__thumb-knob {
  position: absolute;
  box-sizing: border-box;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-style: solid;
  width: var(--%NS%mat-slider-handle-width, 20px);
  height: var(--%NS%mat-slider-handle-height, 20px);
  border-width: calc(var(--%NS%mat-slider-handle-height, 20px) / 2) calc(var(--%NS%mat-slider-handle-width, 20px) / 2);
  box-shadow: var(--%NS%mat-slider-handle-elevation, var(--%NS%mat-sys-level1));
  background-color: var(--%NS%mat-slider-handle-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-slider-handle-color, var(--%NS%mat-sys-primary));
  border-radius: var(--%NS%mat-slider-handle-shape, var(--%NS%mat-sys-corner-full));
}
.mdc-slider__thumb:hover .mdc-slider__thumb-knob {
  background-color: var(--%NS%mat-slider-hover-handle-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-slider-hover-handle-color, var(--%NS%mat-sys-primary));
}
.mdc-slider__thumb--focused .mdc-slider__thumb-knob {
  background-color: var(--%NS%mat-slider-focus-handle-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-slider-focus-handle-color, var(--%NS%mat-sys-primary));
}
.mdc-slider--disabled .mdc-slider__thumb-knob {
  background-color: var(--%NS%mat-slider-disabled-handle-color, var(--%NS%mat-sys-on-surface));
  border-color: var(--%NS%mat-slider-disabled-handle-color, var(--%NS%mat-sys-on-surface));
}
.mdc-slider__thumb--top .mdc-slider__thumb-knob, .mdc-slider__thumb--top.mdc-slider__thumb:hover .mdc-slider__thumb-knob, .mdc-slider__thumb--top.mdc-slider__thumb--focused .mdc-slider__thumb-knob {
  border: solid 1px #fff;
  box-sizing: content-box;
  border-color: var(--%NS%mat-slider-with-overlap-handle-outline-color, var(--%NS%mat-sys-on-primary));
  border-width: var(--%NS%mat-slider-with-overlap-handle-outline-width, 1px);
}

.mdc-slider__tick-marks {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  height: 100%;
  justify-content: space-between;
  padding: 0 1px;
  position: absolute;
  width: 100%;
}

.mdc-slider__tick-mark--active,
.mdc-slider__tick-mark--inactive {
  width: var(--%NS%mat-slider-with-tick-marks-container-size, 2px);
  height: var(--%NS%mat-slider-with-tick-marks-container-size, 2px);
  border-radius: var(--%NS%mat-slider-with-tick-marks-container-shape, var(--%NS%mat-sys-corner-full));
}

.mdc-slider__tick-mark--inactive {
  opacity: var(--%NS%mat-slider-with-tick-marks-inactive-container-opacity, 0.38);
  background-color: var(--%NS%mat-slider-with-tick-marks-inactive-container-color, var(--%NS%mat-sys-on-surface-variant));
}
.mdc-slider--disabled .mdc-slider__tick-mark--inactive {
  opacity: var(--%NS%mat-slider-with-tick-marks-inactive-container-opacity, 0.38);
  background-color: var(--%NS%mat-slider-with-tick-marks-disabled-container-color, var(--%NS%mat-sys-on-surface));
}

.mdc-slider__tick-mark--active {
  opacity: var(--%NS%mat-slider-with-tick-marks-active-container-opacity, 0.38);
  background-color: var(--%NS%mat-slider-with-tick-marks-active-container-color, var(--%NS%mat-sys-on-primary));
}

.mdc-slider__input {
  cursor: pointer;
  left: 2px;
  margin: 0;
  height: 44px;
  opacity: 0;
  position: absolute;
  top: 2px;
  width: 44px;
  box-sizing: content-box;
}
.mdc-slider__input.mat-mdc-slider-input-no-pointer-events {
  pointer-events: none;
}
.mdc-slider__input.mat-slider__right-input {
  left: auto;
  right: 0;
}

.mat-mdc-slider {
  display: inline-block;
  box-sizing: border-box;
  outline: none;
  vertical-align: middle;
  cursor: pointer;
  height: 48px;
  margin: 0 8px;
  position: relative;
  touch-action: pan-y;
  width: auto;
  min-width: 112px;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-slider.mdc-slider--disabled {
  cursor: auto;
  opacity: 0.38;
}
.mat-mdc-slider.mdc-slider--disabled .mdc-slider__input {
  cursor: auto;
}
.mat-mdc-slider .mdc-slider__thumb,
.mat-mdc-slider .mdc-slider__track--active_fill {
  transition-duration: 0ms;
}
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__thumb,
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__track--active_fill {
  transition-duration: 80ms;
}
.mat-mdc-slider.mdc-slider--discrete .mdc-slider__thumb,
.mat-mdc-slider.mdc-slider--discrete .mdc-slider__track--active_fill {
  transition-duration: 0ms;
}
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__thumb,
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__track--active_fill {
  transition-duration: 80ms;
}
.mat-mdc-slider .mat-ripple .mat-ripple-element {
  background-color: var(--%NS%mat-slider-ripple-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-slider .mat-ripple .mat-mdc-slider-hover-ripple {
  background-color: var(--%NS%mat-slider-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-primary) 5%, transparent));
}
.mat-mdc-slider .mat-ripple .mat-mdc-slider-focus-ripple,
.mat-mdc-slider .mat-ripple .mat-mdc-slider-active-ripple {
  background-color: var(--%NS%mat-slider-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-primary) 20%, transparent));
}
.mat-mdc-slider._mat-animation-noopable.mdc-slider--discrete .mdc-slider__thumb, .mat-mdc-slider._mat-animation-noopable.mdc-slider--discrete .mdc-slider__track--active_fill,
.mat-mdc-slider._mat-animation-noopable .mdc-slider__value-indicator {
  transition: none;
}
.mat-mdc-slider .mat-focus-indicator::before {
  border-radius: 50%;
}

.mdc-slider__thumb--focused .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2})}return n})();var qn={provide:B,useExisting:_s(()=>Lt),multi:!0};var Lt=(()=>{class n{_ngZone=p(ve);_elementRef=p(nt);_cdr=p($r);_slider=p(Bt);_platform=p(b);_listenerCleanups;get value(){return yH(this._hostElement.value,0)}set value(e){e===null&&(e=this._getDefaultValue()),e=isNaN(e)?0:e;let t=e+``;if(!this._hasSetInitialValue){this._initialValue=t;return}this._isActive||this._setValue(t)}_setValue(e){this._hostElement.value=e,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges(),this._slider._cdr.markForCheck()}valueChange=new ue;dragStart=new ue;dragEnd=new ue;get translateX(){return this._slider.min>=this._slider.max?(this._translateX=this._tickMarkOffset,this._translateX):(this._translateX===void 0&&(this._translateX=this._calcTranslateXByValue()),this._translateX)}set translateX(e){this._translateX=e}_translateX;thumbPosition=u.END;get min(){return yH(this._hostElement.min,0)}set min(e){this._hostElement.min=e+``,this._cdr.detectChanges()}get max(){return yH(this._hostElement.max,0)}set max(e){this._hostElement.max=e+``,this._cdr.detectChanges()}get step(){return yH(this._hostElement.step,0)}set step(e){this._hostElement.step=e+``,this._cdr.detectChanges()}get disabled(){return zr(this._hostElement.disabled)}set disabled(e){this._hostElement.disabled=e,this._cdr.detectChanges(),this._slider.disabled!==this.disabled&&(this._slider.disabled=this.disabled)}get percentage(){return this._slider.min>=this._slider.max?this._slider._isRtl()?1:0:(this.value-this._slider.min)/(this._slider.max-this._slider.min)}get fillPercentage(){return this._slider._cachedWidth?this._translateX===0?0:this.translateX/this._slider._cachedWidth:this._slider._isRtl()?1:0}_hostElement=this._elementRef.nativeElement;_valuetext=K(``);_knobRadius=8;_tickMarkOffset=3;_isActive=!1;_isFocused=!1;_setIsFocused(e){this._isFocused=e}_hasSetInitialValue=!1;_initialValue;_formControl;_destroyed=new Y;_skipUIUpdate=!1;_onChangeFn;_onTouchedFn=()=>{};_isControlInitialized=!1;constructor(){let e=p(Qn$1);this._ngZone.runOutsideAngular(()=>{this._listenerCleanups=[e.listen(this._hostElement,`pointerdown`,this._onPointerDown.bind(this)),e.listen(this._hostElement,`pointermove`,this._onPointerMove.bind(this)),e.listen(this._hostElement,`pointerup`,this._onPointerUp.bind(this))]})}ngOnDestroy(){this._listenerCleanups.forEach(e=>e()),this._destroyed.next(),this._destroyed.complete(),this.dragStart.complete(),this.dragEnd.complete()}initProps(){this._updateWidthInactive(),this.disabled!==this._slider.disabled&&(this._slider.disabled=!0),this.step=this._slider.step,this.min=this._slider.min,this.max=this._slider.max,this._initValue()}initUI(){this._updateThumbUIByValue()}_initValue(){this._hasSetInitialValue=!0,this._initialValue===void 0?this.value=this._getDefaultValue():(this._hostElement.value=this._initialValue,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges())}_getDefaultValue(){return this.min}_onBlur(){this._setIsFocused(!1),this._onTouchedFn()}_onFocus(){this._slider._setTransition(!1),this._slider._updateTrackUI(this),this._setIsFocused(!0)}_onChange(){this.valueChange.emit(this.value),this._isActive&&this._updateThumbUIByValue({withAnimation:!0})}_onInput(){this._onChangeFn?.(this.value),(this._slider.step||!this._isActive)&&this._updateThumbUIByValue({withAnimation:!0}),this._slider._onValueChange(this)}_onNgControlValueChange(){(!this._isActive||!this._isFocused)&&(this._slider._onValueChange(this),this._updateThumbUIByValue()),this._slider.disabled=this._formControl.disabled}_onPointerDown(e){if(!(this.disabled||e.button!==0)){if(this._platform.IOS){let t=this._slider._isCursorOnSliderThumb(e,this._slider._getThumb(this.thumbPosition)._hostElement.getBoundingClientRect());this._isActive=t,this._updateWidthActive(),this._slider._updateDimensions();return}this._isActive=!0,this._setIsFocused(!0),this._updateWidthActive(),this._slider._updateDimensions(),this._slider.step||this._updateThumbUIByPointerEvent(e,{withAnimation:!0}),this.disabled||(this._handleValueCorrection(e),this.dragStart.emit({source:this,parent:this._slider,value:this.value}))}}_handleValueCorrection(e){this._skipUIUpdate=!0,setTimeout(()=>{this._skipUIUpdate=!1,this._fixValue(e)},0)}_fixValue(e){let t=e.clientX-this._slider._cachedLeft,i=this._slider._cachedWidth,r=this._slider.step===0?1:this._slider.step,c=Math.floor((this._slider.max-this._slider.min)/r),p=this._slider._isRtl()?1-t/i:t/i,R=Math.round(p*c)/c*(this._slider.max-this._slider.min)+this._slider.min,w=Math.round(R/r)*r;if(w===this.value){this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(e,{withAnimation:this._slider._hasAnimation});return}this.value=w,this.valueChange.emit(this.value),this._onChangeFn?.(this.value),this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(e,{withAnimation:this._slider._hasAnimation})}_onPointerMove(e){!this._slider.step&&this._isActive&&this._updateThumbUIByPointerEvent(e)}_onPointerUp(){this._isActive&&(this._isActive=!1,this._platform.SAFARI&&this._setIsFocused(!1),this.dragEnd.emit({source:this,parent:this._slider,value:this.value}),setTimeout(()=>this._updateWidthInactive(),this._platform.IOS?10:0))}_clamp(e){let t=this._tickMarkOffset,i=this._slider._cachedWidth-this._tickMarkOffset;return Math.max(Math.min(e,i),t)}_calcTranslateXByValue(){return this._slider._isRtl()?(1-this.percentage)*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset:this.percentage*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset}_calcTranslateXByPointerEvent(e){return e.clientX-this._slider._cachedLeft}_updateWidthActive(){}_updateWidthInactive(){this._hostElement.style.padding=`0 ${this._slider._inputPadding}px`,this._hostElement.style.width=`calc(100% + ${this._slider._inputPadding-this._tickMarkOffset*2}px)`,this._hostElement.style.left=`-${this._slider._rippleRadius-this._tickMarkOffset}px`}_updateThumbUIByValue(e){this.translateX=this._clamp(this._calcTranslateXByValue()),this._updateThumbUI(e)}_updateThumbUIByPointerEvent(e,t){this.translateX=this._clamp(this._calcTranslateXByPointerEvent(e)),this._updateThumbUI(t)}_updateThumbUI(e){this._slider._setTransition(!!e?.withAnimation),this._slider._onTranslateXChange(this)}writeValue(e){(this._isControlInitialized||e!==null)&&(this.value=e)}registerOnChange(e){this._onChangeFn=e,this._isControlInitialized=!0}registerOnTouched(e){this._onTouchedFn=e}setDisabledState(e){this.disabled=e}focus(){this._hostElement.focus()}blur(){this._hostElement.blur()}static ɵfac=function(t){return new(t||n)};static ɵdir=ot({type:n,selectors:[[`input`,`matSliderThumb`,``]],hostAttrs:[`type`,`range`,1,`mdc-slider__input`],hostVars:1,hostBindings:function(t,i){t&1&&Ba(`change`,function(){return i._onChange()})(`input`,function(){return i._onInput()})(`blur`,function(){return i._onBlur()})(`focus`,function(){return i._onFocus()}),t&2&&rr(`aria-valuetext`,i._valuetext())},inputs:{value:[2,`value`,`value`,yH]},outputs:{valueChange:`valueChange`,dragStart:`dragStart`,dragEnd:`dragEnd`},exportAs:[`matSliderThumb`],features:[Qv([qn,{provide:Zi,useExisting:n}])]})}return n})();var tn=(()=>{class n{static ɵfac=function(t){return new(t||n)};static ɵmod=wt({type:n});static ɵinj=Ye({imports:[Xe,Wy]})}return n})();var nn=`gameroster:paddle-players`;var an=`gameroster:paddle-debts`;var rn=`gameroster:paddle-win-value`;var gt=2.5;var me=class n{defaultWinValue=gt;winValue=K(this.loadWinValue());players=K(this.loadPlayers());debtEntries=K(this.loadDebtEntries());addPlayer(a){let e=a.trim();e&&(this.players.update(t=>[...t,{id:crypto.randomUUID(),name:e,wins:0,losses:0,balance:0}]),this.persist())}removePlayer(a){this.players.update(e=>e.filter(t=>t.id!==a)),this.persist()}recordWin(a){this.updatePlayer(a,e=>L(m({},e),{wins:e.wins+1,balance:e.balance+this.winValue()}))}recordLoss(a){this.updatePlayer(a,e=>L(m({},e),{losses:e.losses+1,balance:e.balance-this.winValue()}))}setWinValue(a){if(!Number.isFinite(a)||a<=0)return;let e=Math.round(a*100)/100;this.winValue.set(e);try{localStorage.setItem(rn,String(e))}catch{}}addDebtEntry(a,e,t=1){let i=[...new Set(a)],r=[...new Set(e)],c=new Set([...i,...r]),p=Number.isInteger(t)&&t>0?t:1,g=this.winValue();i.length===0||r.length===0||c.size<2||c.size>4||(this.players.update(R=>R.map(w=>{let U=i.includes(w.id)?p:0,I=r.includes(w.id)?p:0;return U||I?L(m({},w),{wins:w.wins+U,losses:w.losses+I,balance:w.balance+(U-I)*g}):w})),this.debtEntries.update(R=>[...R,{id:crypto.randomUUID(),winnerIds:i,loserIds:r,rounds:p,winValue:g}]),this.persist(),this.persistDebtEntries())}endGame(){this.players.set([]),this.debtEntries.set([]),this.persist(),this.persistDebtEntries()}updatePlayer(a,e){this.players.update(t=>t.map(i=>i.id===a?e(i):i)),this.persist()}persist(){try{localStorage.setItem(nn,JSON.stringify(this.players()))}catch{}}persistDebtEntries(){try{localStorage.setItem(an,JSON.stringify(this.debtEntries()))}catch{}}loadPlayers(){try{let a=localStorage.getItem(nn);if(!a)return[];let e=JSON.parse(a);return Array.isArray(e)?e:[]}catch{return[]}}loadDebtEntries(){try{let a=localStorage.getItem(an);if(!a)return[];let e=JSON.parse(a);return Array.isArray(e)?e:[]}catch{return[]}}loadWinValue(){try{let a=localStorage.getItem(rn);if(!a)return gt;let e=Number(a);return Number.isFinite(e)&&e>0?e:gt}catch{return gt}}static ɵfac=function(e){return new(e||n)};static ɵprov=R({token:n,factory:n.ɵfac,providedIn:`root`})};var on=(n,a)=>a.id;function Zn(n,a){if(n&1&&(Sa(0,`mat-option`,14),tT(1),Fd()),n&2){let e=a.$implicit,t=Rb();wv(`value`,e.id)(`disabled`,t.isOptionDisabled(e.id,`winner`)),DC(),qd(` `,e.name,` `)}}function Jn(n,a){if(n&1&&(Sa(0,`mat-option`,14),tT(1),Fd()),n&2){let e=a.$implicit,t=Rb();wv(`value`,e.id)(`disabled`,t.isOptionDisabled(e.id,`loser`)),DC(),qd(` `,e.name,` `)}}var ft=class n{dialogRef=p(T$1);paddle=p(me);players=pi(()=>this.paddle.players());winners=[];losers=[];rounds=1;get participantCount(){return this.winners.length+this.losers.length}get isValid(){return this.winners.length>0&&this.losers.length>0&&this.participantCount>=2&&Number.isInteger(this.rounds)&&this.rounds>=1}selectedPlayerNames(a){return a.map(e=>this.players().find(t=>t.id===e)?.name).filter(e=>!!e).join(`, `)}isOptionDisabled(a,e){let t=e===`winner`?this.losers:this.winners,i=e===`winner`?this.winners:this.losers;return t.includes(a)||!i.includes(a)&&this.participantCount>=4}cancel(){this.dialogRef.close()}add(){this.isValid&&this.dialogRef.close({winnerIds:this.winners,loserIds:this.losers,rounds:this.rounds})}static ɵfac=function(e){return new(e||n)};static ɵcmp=nr({type:n,selectors:[[`app-paddle-add-debt-dialog`]],decls:72,vars:11,consts:[[`mat-dialog-title`,``,1,`dialog-title`],[`aria-hidden`,`true`,1,`dialog-title-icon`],[1,`dialog-kicker`],[1,`dialog-title-text`],[1,`dialog-intro`],[1,`team-grid`],[1,`team-card`,`team-card--winners`],[1,`team-card-heading`],[`aria-hidden`,`true`,1,`team-indicator`],[1,`team-label`],[1,`team-count`],[`appearance`,`outline`,1,`team-field`],[`multiple`,``,3,`ngModelChange`,`ngModel`,`disableRipple`],[1,`selected-names`],[3,`value`,`disabled`],[`aria-hidden`,`true`,1,`versus`],[1,`team-card`,`team-card--losers`],[1,`rounds-control`],[1,`rounds-heading`],[1,`rounds-label`],[1,`rounds-hint`],[1,`rounds-slider-line`],[`aria-hidden`,`true`],[`min`,`1`,`max`,`15`,`step`,`1`,`showTickMarks`,``,`discrete`,``],[`matSliderThumb`,``,`aria-label`,`Anzahl gleicher Spiele`,3,`ngModelChange`,`ngModel`],[1,`rounds-value`],[`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`]],template:function(e,t){e&1&&(Sa(0,`h2`,0)(1,`span`,1)(2,`mat-icon`),tT(3,`swap_horiz`),Fd()(),Sa(4,`span`)(5,`span`,2),tT(6,`Paddle`),Fd(),Sa(7,`span`,3),tT(8,`Spiel eintragen`),Fd()()(),Sa(9,`mat-dialog-content`)(10,`p`,4),tT(11,`Teams auswählen und Ergebnis festhalten.`),Fd(),Sa(12,`div`,5)(13,`section`,6)(14,`div`,7)(15,`span`,8)(16,`mat-icon`),tT(17,`emoji_events`),Fd()(),Sa(18,`span`)(19,`span`,9),tT(20,`Gewinner`),Fd(),Sa(21,`span`,10),tT(22),Fd()()(),Sa(23,`mat-form-field`,11)(24,`mat-label`),tT(25,`Spieler auswählen`),Fd(),Sa(26,`mat-select`,12),Gv(`ngModelChange`,function(r){return sT(t.winners,r)||(t.winners=r),r}),Sa(27,`mat-select-trigger`)(28,`span`,13),tT(29),Fd()(),Ib(30,Zn,2,3,`mat-option`,14,on),Fd(),cS(),Fd()(),Sa(32,`div`,15),tT(33,`vs.`),Fd(),Sa(34,`section`,16)(35,`div`,7)(36,`span`,8)(37,`mat-icon`),tT(38,`flag`),Fd()(),Sa(39,`span`)(40,`span`,9),tT(41,`Verlierer`),Fd(),Sa(42,`span`,10),tT(43),Fd()()(),Sa(44,`mat-form-field`,11)(45,`mat-label`),tT(46,`Spieler auswählen`),Fd(),Sa(47,`mat-select`,12),Gv(`ngModelChange`,function(r){return sT(t.losers,r)||(t.losers=r),r}),Sa(48,`mat-select-trigger`)(49,`span`,13),tT(50),Fd()(),Ib(51,Jn,2,3,`mat-option`,14,on),Fd(),cS(),Fd()()(),Sa(53,`div`,17)(54,`div`,18)(55,`span`)(56,`span`,19),tT(57,`Anzahl gleicher Spiele`),Fd(),Sa(58,`span`,20),tT(59,`Mit den Pfeiltasten feinjustieren`),Fd()()(),Sa(60,`div`,21)(61,`mat-icon`,22),tT(62,`looks_one`),Fd(),Sa(63,`mat-slider`,23)(64,`input`,24),Gv(`ngModelChange`,function(r){return sT(t.rounds,r)||(t.rounds=r),r}),Fd(),cS(),Fd(),Sa(65,`output`,25),tT(66),Fd()()()(),Sa(67,`mat-dialog-actions`,26)(68,`button`,27),Ba(`click`,function(){return t.cancel()}),tT(69,`Abbrechen`),Fd(),Sa(70,`button`,28),Ba(`click`,function(){return t.add()}),tT(71,` Eintrag speichern `),Fd()()),e&2&&(DC(22),qd(``,t.winners.length,` ausgewählt`),DC(4),zv(`ngModel`,t.winners),wv(`disableRipple`,!0),lS(),DC(3),Vv(t.selectedPlayerNames(t.winners)||`Noch niemand`),DC(),wb(t.players()),DC(13),qd(``,t.losers.length,` ausgewählt`),DC(4),zv(`ngModel`,t.losers),wv(`disableRipple`,!0),lS(),DC(3),Vv(t.selectedPlayerNames(t.losers)||`Noch niemand`),DC(),wb(t.players()),DC(13),zv(`ngModel`,t.rounds),lS(),DC(2),Vv(t.rounds),DC(4),wv(`disabled`,!t.isValid))},dependencies:[Iy,Sn$1,Ue,En$1,Xt,Ki$1,zi$1,Ht,jt,zt$2,Vt$1,me$1,it,de,Uz,jz,$i,Gi,qi,Qe,tn,en,Lt],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:520px}.dialog-title[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px;margin-bottom:4px}.dialog-title-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light)}.dialog-title-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:22px;height:22px;font-size:22px}.dialog-kicker[_ngcontent-%COMP%], .dialog-title-text[_ngcontent-%COMP%], .team-label[_ngcontent-%COMP%], .team-count[_ngcontent-%COMP%], .rounds-label[_ngcontent-%COMP%], .rounds-hint[_ngcontent-%COMP%]{display:block}.dialog-kicker[_ngcontent-%COMP%]{margin-bottom:2px;color:var(--%NS%color-text-subtle);font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.dialog-title-text[_ngcontent-%COMP%]{font-size:22px;line-height:1.1}.dialog-intro[_ngcontent-%COMP%]{margin:0 0 20px;color:var(--%NS%color-text-muted);font-size:13px}.team-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px}.team-card[_ngcontent-%COMP%]{min-width:0;padding:14px;border:1px solid var(--%NS%color-white-10);border-radius:var(--%NS%radius-medium);background:var(--%NS%color-white-045)}.team-card--winners[_ngcontent-%COMP%]{border-color:var(--%NS%color-success-light-28)}.team-card--losers[_ngcontent-%COMP%]{border-color:var(--%NS%color-danger-light-28)}.team-card-heading[_ngcontent-%COMP%]{display:flex;align-items:center;gap:9px;margin-bottom:12px}.team-indicator[_ngcontent-%COMP%]{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border-radius:9px;background:var(--%NS%color-white-08)}.team-indicator[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:17px;height:17px;font-size:17px}.team-card--winners[_ngcontent-%COMP%]   .team-indicator[_ngcontent-%COMP%], .team-card--winners[_ngcontent-%COMP%]   .team-label[_ngcontent-%COMP%]{color:var(--%NS%color-success-light)}.team-card--losers[_ngcontent-%COMP%]   .team-indicator[_ngcontent-%COMP%], .team-card--losers[_ngcontent-%COMP%]   .team-label[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}.team-label[_ngcontent-%COMP%]{font-size:14px;font-weight:750}.team-count[_ngcontent-%COMP%]{margin-top:2px;color:var(--%NS%color-text-subtle);font-size:11px}.team-field[_ngcontent-%COMP%]{width:100%}.selected-names[_ngcontent-%COMP%]{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.team-card--winners[_ngcontent-%COMP%]   .team-field[_ngcontent-%COMP%]{--%NS%mdc-outlined-text-field-focus-outline-color: var(--%NS%color-success-light)}.team-card--losers[_ngcontent-%COMP%]   .team-field[_ngcontent-%COMP%]{--%NS%mdc-outlined-text-field-focus-outline-color: var(--%NS%color-danger-light)}.rounds-control[_ngcontent-%COMP%]{margin-top:22px;padding:12px 14px 8px;border:1px solid var(--%NS%color-white-10);border-radius:var(--%NS%radius-medium);background:var(--%NS%color-white-035)}.rounds-label[_ngcontent-%COMP%]{font-size:13px;font-weight:700}.rounds-hint[_ngcontent-%COMP%]{margin-top:2px;color:var(--%NS%color-text-subtle);font-size:11px}.rounds-slider-line[_ngcontent-%COMP%]{display:flex;align-items:center;gap:9px;margin-top:3px}.rounds-slider-line[_ngcontent-%COMP%] > mat-icon[_ngcontent-%COMP%]{flex:0 0 auto;width:18px;height:18px;color:var(--%NS%color-primary-light);font-size:18px}.rounds-slider-line[_ngcontent-%COMP%]   mat-slider[_ngcontent-%COMP%]{flex:1;min-width:0}.rounds-value[_ngcontent-%COMP%]{display:grid;place-items:center;flex:0 0 40px;width:40px;height:34px;border-radius:var(--%NS%radius-small);background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light);font-size:16px;font-weight:800}.versus[_ngcontent-%COMP%]{align-self:center;padding:7px 6px;border:1px solid var(--%NS%color-white-12);border-radius:var(--%NS%radius-pill);background:var(--%NS%color-surface);color:var(--%NS%color-text-subtle);font-size:12px;font-weight:700;text-transform:uppercase}[mat-dialog-actions][_ngcontent-%COMP%]{gap:10px;padding-top:8px}@media(max-width:520px){[_nghost-%COMP%]{max-width:100%}.team-grid[_ngcontent-%COMP%]{grid-template-columns:1fr}.versus[_ngcontent-%COMP%]{justify-self:center;margin:-3px 0}.rounds-slider-line[_ngcontent-%COMP%]{gap:6px}}`]})};var bt=class n{dialogRef=p(T$1);paddle=p(me);amountInput=this.paddle.winValue().toLocaleString(`de-DE`,{minimumFractionDigits:2,maximumFractionDigits:2});get parsedAmount(){return Number(this.amountInput.trim().replace(`,`,`.`))}get isValid(){return Number.isFinite(this.parsedAmount)&&this.parsedAmount>0}cancel(){this.dialogRef.close()}save(){this.isValid&&this.dialogRef.close(this.parsedAmount)}static ɵfac=function(e){return new(e||n)};static ɵcmp=nr({type:n,selectors:[[`app-paddle-set-value-dialog`]],decls:23,vars:2,consts:[[`mat-dialog-title`,``,1,`value-dialog-title`],[`aria-hidden`,`true`,1,`value-dialog-icon`],[1,`value-dialog-kicker`],[1,`value-dialog-heading`],[1,`value-dialog-intro`],[`appearance`,`outline`,1,`value-field`],[`matInput`,``,`type`,`text`,`inputmode`,`decimal`,`autocomplete`,`off`,`aria-describedby`,`value-hint`,3,`ngModelChange`,`keyup.enter`,`ngModel`],[`matSuffix`,``],[`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`]],template:function(e,t){e&1&&(Sa(0,`h2`,0)(1,`span`,1)(2,`mat-icon`),tT(3,`euro`),Fd()(),Sa(4,`span`)(5,`span`,2),tT(6,`Paddle`),Fd(),Sa(7,`span`,3),tT(8,`Einsatz ändern`),Fd()()(),Sa(9,`mat-dialog-content`)(10,`p`,4),tT(11,`Der neue Betrag gilt für zukünftige Spiele.`),Fd(),Sa(12,`mat-form-field`,5)(13,`mat-label`),tT(14,`Betrag pro Spiel`),Fd(),Sa(15,`input`,6),Gv(`ngModelChange`,function(r){return sT(t.amountInput,r)||(t.amountInput=r),r}),Ba(`keyup.enter`,function(){return t.save()}),Fd(),cS(),Sa(16,`span`,7),tT(17,`€`),Fd()()(),Sa(18,`mat-dialog-actions`,8)(19,`button`,9),Ba(`click`,function(){return t.cancel()}),tT(20,`Abbrechen`),Fd(),Sa(21,`button`,10),Ba(`click`,function(){return t.save()}),tT(22,` Betrag speichern `),Fd()()),e&2&&(DC(15),zv(`ngModel`,t.amountInput),lS(),DC(6),wv(`disabled`,!t.isValid))},dependencies:[Sn$1,Ue,En$1,Xt,Ki$1,zi$1,Ht,jt,zt$2,Vt$1,me$1,it,de,zt$3,Uz,jz,Rn$1,Tn$1],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:450px}.value-dialog-title[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px}.value-dialog-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light)}.value-dialog-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:21px;height:21px;font-size:21px}.value-dialog-kicker[_ngcontent-%COMP%], .value-dialog-heading[_ngcontent-%COMP%]{display:block}.value-dialog-kicker[_ngcontent-%COMP%]{margin-bottom:2px;color:var(--%NS%color-text-subtle);font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.value-dialog-heading[_ngcontent-%COMP%]{font-size:21px;line-height:1.1}mat-dialog-content[_ngcontent-%COMP%]{box-sizing:border-box;max-width:100%;max-height:min(68vh,680px);overflow-x:hidden;overflow-y:auto}.value-dialog-intro[_ngcontent-%COMP%]{margin:0 0 18px;color:var(--%NS%color-text-muted);font-size:13px}.value-field[_ngcontent-%COMP%]{width:100%}[mat-dialog-actions][_ngcontent-%COMP%]{gap:10px;padding-top:8px}@media(max-width:420px){[_nghost-%COMP%]{max-width:100%}}`]})};var zt=(n,a)=>a.player.id;function ea(n,a){if(n&1){let e=Mb();Sa(0,`button`,14)(1,`mat-icon`,4),tT(2,`more_vert`),Fd()(),Sa(3,`mat-menu`,15,0)(5,`button`,16),Ba(`click`,function(){Ep(e);return Ip(Rb().expandAllPlayers())}),Sa(6,`mat-icon`,4),tT(7,`unfold_more`),Fd(),Sa(8,`span`),tT(9,`Alle Karten öffnen`),Fd()(),Sa(10,`button`,16),Ba(`click`,function(){Ep(e);return Ip(Rb().collapseAllPlayers())}),Sa(11,`mat-icon`,4),tT(12,`unfold_less`),Fd(),Sa(13,`span`),tT(14,`Alle Karten schließen`),Fd()(),Sa(15,`button`,16),Ba(`click`,function(){Ep(e);return Ip(Rb().openSetValueDialog())}),Sa(16,`mat-icon`,4),tT(17,`euro`),Fd(),Sa(18,`span`),tT(19,`Einsatz ändern`),Fd()()()}if(n&2)wv(`matMenuTriggerFor`,kb(4))}function ta(n,a){if(n&1&&(Sa(0,`div`,37)(1,`span`),tT(2),Fd(),Sa(3,`strong`),tT(4),Fd()()),n&2){let e=a.$implicit,t=Rb(5);DC(2),Vv(e.player.name),DC(2),Vv(t.formatBalance(e.amount))}}function ia(n,a){if(n&1&&(Sa(0,`div`,32)(1,`p`,36),tT(2,`Schuldet`),Fd(),Ib(3,ta,5,2,`div`,37,zt),Fd()),n&2){let e=Rb(2).$implicit;DC(3),wb(e.owedTo)}}function na(n,a){if(n&1&&(Sa(0,`div`,37)(1,`span`),tT(2),Fd(),Sa(3,`strong`),tT(4),Fd()()),n&2){let e=a.$implicit,t=Rb(5);DC(2),Vv(e.player.name),DC(2),Vv(t.formatBalance(e.amount))}}function aa(n,a){if(n&1&&(Sa(0,`div`,33)(1,`p`,36),tT(2,`Bekommt von`),Fd(),Ib(3,na,5,2,`div`,37,zt),Fd()),n&2){let e=Rb(2).$implicit;DC(3),wb(e.owedBy)}}function ra(n,a){n&1&&(Sa(0,`p`,34),tT(1,`Noch keine offenen Schulden.`),Fd())}function oa(n,a){if(n&1&&(Sa(0,`div`,31),vb(1,ia,5,0,`div`,32),vb(2,aa,5,0,`div`,33),vb(3,ra,2,0,`p`,34),Sa(4,`div`,35)(5,`span`),tT(6,`Insgesamt zu zahlen`),Fd(),Sa(7,`strong`),tT(8),Fd()()()),n&2){let e=Rb().$implicit,t=Rb(2);wv(`id`,`debt-details-`+e.player.id),DC(),yb(e.owedTo.length?1:-1),DC(),yb(e.owedBy.length?2:-1),DC(),yb(!e.owedTo.length&&!e.owedBy.length?3:-1),DC(5),Vv(t.formatBalance(e.totalToPay))}}function sa(n,a){if(n&1){let e=Mb();Sa(0,`article`,23)(1,`button`,24),Ba(`click`,function(){let i=Ep(e).$implicit;return Ip(Rb(2).togglePlayer(i.player.id))}),Sa(2,`span`,25),tT(3),Fd(),Sa(4,`span`,26)(5,`span`,27),tT(6),Fd(),Sa(7,`span`,28),tT(8),Fd()(),Sa(9,`span`,29),tT(10),Fd(),Sa(11,`mat-icon`,30),tT(12,`chevron_right`),Fd()(),vb(13,oa,9,5,`div`,31),Fd()}if(n&2){let e=a.$implicit,t=a.$index,i=Rb(2);Ha(`paddle-player-card--expanded`,i.isPlayerExpanded(e.player.id)),DC(),rr(`aria-expanded`,i.isPlayerExpanded(e.player.id))(`aria-controls`,`debt-details-`+e.player.id),DC(2),Vv(t+1),DC(3),Vv(e.player.name),DC(2),Hv(` `,e.player.wins,` Siege · `,e.player.losses,` Niederlagen `),DC(),Ha(`player-result--negative`,e.player.balance<0),DC(),qd(` `,i.formatBalance(e.player.balance),` `),DC(3),yb(i.isPlayerExpanded(e.player.id)?13:-1)}}function la(n,a){if(n&1&&(Sa(0,`section`,8)(1,`div`,17)(2,`div`)(3,`p`,18),tT(4,`Aktueller Stand`),Fd(),Sa(5,`h2`,19),tT(6,`Ranking`),Fd()(),Sa(7,`div`,20)(8,`mat-icon`,4),tT(9,`leaderboard`),Fd()()(),Sa(10,`div`,21),Ib(11,sa,14,12,`article`,22,zt),Fd()()),n&2){let e=Rb();DC(11),wb(e.playerDebtDetails())}}function da(n,a){n&1&&(Sa(0,`section`,9)(1,`mat-icon`,4),tT(2,`groups`),Fd(),Sa(3,`p`),tT(4,`Füge Spieler hinzu, um die Rangliste zu starten.`),Fd()())}var ln=class n{paddle=p(me);dialog=p(ee);expandedPlayerIds=K(new Set);sortedPlayers=pi(()=>this.paddle.players().slice().sort((a,e)=>e.balance-a.balance||e.wins-a.wins));playerDebtDetails=pi(()=>this.sortedPlayers().map(a=>{let e=new Map,t=new Map;for(let p of this.paddle.debtEntries()){let g=p.rounds??1,R=p.winValue??this.paddle.defaultWinValue,w=p.winnerIds.includes(a.id),U=p.loserIds.includes(a.id);if(w)for(let I of p.loserIds)t.set(I,(t.get(I)??0)+R*g);if(U)for(let I of p.winnerIds)e.set(I,(e.get(I)??0)+R*g)}let i=new Map;for(let p of new Set([...e.keys(),...t.keys()])){let g=(e.get(p)??0)-(t.get(p)??0);g!==0&&i.set(p,g)}let r=new Map([...i.entries()].filter(([,p])=>p>0)),c=new Map([...i.entries()].map(([p,g])=>[p,Math.abs(g)]).filter(([p])=>(i.get(p)??0)<0));return{player:a,owedTo:this.toDebtList(r),owedBy:this.toDebtList(c),totalToPay:this.total(r)}}));toDebtList(a){return[...a.entries()].map(([e,t])=>({player:this.paddle.players().find(i=>i.id===e),amount:t})).filter(e=>!!e.player)}total(a){return[...a.values()].reduce((e,t)=>e+t,0)}togglePlayer(a){this.expandedPlayerIds.update(e=>{let t=new Set(e);return t.has(a)?t.delete(a):t.add(a),t})}isPlayerExpanded(a){return this.expandedPlayerIds().has(a)}expandAllPlayers(){this.expandedPlayerIds.set(new Set(this.sortedPlayers().map(a=>a.id)))}collapseAllPlayers(){this.expandedPlayerIds.set(new Set)}openSetValueDialog(){this.dialog.open(bt).afterClosed().subscribe(a=>{a!==void 0&&this.paddle.setWinValue(a)})}openAddDebtDialog(){this.dialog.open(ft).afterClosed().subscribe(a=>{a&&this.paddle.addDebtEntry(a.winnerIds,a.loserIds,a.rounds)})}openAddPlayerDialog(){this.dialog.open(_t).afterClosed().subscribe(a=>{a&&this.paddle.addPlayer(a)})}formatBalance(a){return new Intl.NumberFormat(`de-DE`,{style:`currency`,currency:`EUR`}).format(a)}endGame(){this.dialog.open(I,{data:{title:`Paddle-Spiel beenden?`,message:`Alle Spielstände werden gelöscht und können nicht wiederhergestellt werden.`,confirmLabel:`Spiel beenden`,icon:`warning`}}).afterClosed().subscribe(a=>{a&&this.paddle.endGame()})}static ɵfac=function(e){return new(e||n)};static ɵcmp=nr({type:n,selectors:[[`app-paddle-table`]],decls:28,vars:3,consts:[[`playerActionsMenu`,`matMenu`],[1,`paddle-root`,`ui-page-root`],[1,`ui-hero`,`paddle-header`],[`routerLink`,`/collection`,`matTooltip`,`Zur Sammlung`,`aria-label`,`Zur Sammlung zurück`,1,`collection-back-button`],[`aria-hidden`,`true`],[`aria-hidden`,`true`,1,`paddle-heading-icon`],[1,`ui-title`],[1,`ui-accent`],[`aria-labelledby`,`ranking-title`,1,`ranking-section`],[1,`empty-state`,`ui-surface`],[1,`primary-actions`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,1,`ui-button`,`add-player-button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,1,`ui-button`,`add-debt-button`,3,`click`,`disabled`],[`mat-flat-button`,``,`color`,`warn`,`type`,`button`,1,`end-game-button`,3,`click`],[`type`,`button`,`aria-label`,`Kartenaktionen öffnen`,`matTooltip`,`Kartenaktionen`,1,`ui-header-button`,`ui-header-button--end`,3,`matMenuTriggerFor`],[`xPosition`,`before`],[`mat-menu-item`,``,`type`,`button`,3,`click`],[1,`section-heading`],[1,`section-kicker`],[`id`,`ranking-title`],[1,`section-actions`],[1,`player-card-list`,`ui-surface`],[1,`paddle-player-card`,3,`paddle-player-card--expanded`],[1,`paddle-player-card`],[`type`,`button`,1,`player-summary`,3,`click`],[1,`ui-rank-badge`],[1,`player-details`],[1,`ui-player-name`],[1,`player-record`],[1,`player-result`],[`aria-hidden`,`true`,1,`player-chevron`],[1,`debt-details`,3,`id`],[1,`debt-group`],[1,`debt-group`,`debt-group--receive`],[1,`no-debts`],[1,`debt-total`],[1,`debt-group-title`],[1,`debt-row`]],template:function(e,t){e&1&&(Sa(0,`div`,1)(1,`header`,2)(2,`a`,3)(3,`mat-icon`,4),tT(4,`chevron_left`),Fd()(),vb(5,ea,20,1),Sa(6,`div`,5)(7,`mat-icon`),tT(8,`sports_tennis`),Fd()(),Sa(9,`h1`,6),tT(10,`Paddle `),Sa(11,`span`,7),tT(12,`Rangliste`),Fd()()(),vb(13,la,13,0,`section`,8)(14,da,5,0,`section`,9),Sa(15,`div`,10)(16,`button`,11),Ba(`click`,function(){return t.openAddPlayerDialog()}),Sa(17,`mat-icon`,4),tT(18,`person_add`),Fd(),tT(19,` Spieler hinzufügen `),Fd(),Sa(20,`button`,12),Ba(`click`,function(){return t.openAddDebtDialog()}),Sa(21,`mat-icon`,4),tT(22,`receipt_long`),Fd(),tT(23,` Schulden eintragen `),Fd()(),Sa(24,`button`,13),Ba(`click`,function(){return t.endGame()}),Sa(25,`mat-icon`,4),tT(26,`stop_circle`),Fd(),tT(27,` Spiel beenden `),Fd()()),e&2&&(DC(5),yb(t.sortedPlayers().length?5:-1),DC(8),yb(t.sortedPlayers().length?13:14),DC(7),wv(`disabled`,t.sortedPlayers().length<2))},dependencies:[Ki$1,zi$1,I$1,Ht,Uz,jz,zi,He,Ge,Li,Yt,mt,xc],styles:[`.paddle-header[_ngcontent-%COMP%], .flip-7-header[_ngcontent-%COMP%]{position:relative}.collection-back-button[_ngcontent-%COMP%]{position:absolute;top:0;left:0;display:grid;place-items:center;width:38px;height:38px;border-radius:10px;border:1px solid var(--%NS%color-border);background:var(--%NS%color-surface);color:var(--%NS%color-text-muted);text-decoration:none;transition:background-color .16s ease,color .16s ease}.collection-back-button[_ngcontent-%COMP%]:hover, .collection-back-button[_ngcontent-%COMP%]:focus-visible{background:var(--%NS%color-white-08);color:var(--%NS%color-text)}.collection-back-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:22px;height:22px;font-size:22px}.paddle-heading-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:52px;height:52px;margin:12px auto 0;border-radius:var(--%NS%radius-medium);background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light)}.paddle-heading-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:30px;height:30px;font-size:30px}.ranking-section[_ngcontent-%COMP%], .empty-state[_ngcontent-%COMP%]{width:min(100%,var(--%NS%content-width));box-sizing:border-box}.section-heading[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin:0}.ranking-section[_ngcontent-%COMP%]{margin-top:24px}.section-heading[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.section-actions[_ngcontent-%COMP%]{display:flex;align-items:center;gap:4px}.section-actions[_ngcontent-%COMP%] > mat-icon[_ngcontent-%COMP%]{color:var(--%NS%color-primary-light)}.section-kicker[_ngcontent-%COMP%]{margin:0 0 3px;color:var(--%NS%color-text-subtle);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.section-heading[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:22px}.paddle-player-card[_ngcontent-%COMP%]{width:100%;border-bottom:1px solid var(--%NS%color-white-08)}.paddle-player-card[_ngcontent-%COMP%]:last-child{border-bottom:0}.player-summary[_ngcontent-%COMP%]{display:flex;align-items:center;width:100%;min-height:78px;box-sizing:border-box;gap:12px;padding:12px 14px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.player-summary[_ngcontent-%COMP%]:hover, .player-summary[_ngcontent-%COMP%]:focus-visible{background:var(--%NS%color-white-05);outline:none}.player-summary[_ngcontent-%COMP%]   .ui-rank-badge[_ngcontent-%COMP%]{flex:0 0 40px}.player-details[_ngcontent-%COMP%]{display:flex;min-width:0;flex:1;flex-direction:column}.player-record[_ngcontent-%COMP%]{margin-top:4px;color:var(--%NS%color-text-subtle);font-size:12px}.player-result[_ngcontent-%COMP%]{color:var(--%NS%color-success-light);font-size:18px;font-weight:700;white-space:nowrap}.player-result--negative[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}.player-chevron[_ngcontent-%COMP%]{flex:0 0 auto;color:var(--%NS%color-text-subtle);transition:transform var(--%NS%transition-fast),color var(--%NS%transition-fast)}.paddle-player-card--expanded[_ngcontent-%COMP%]   .player-chevron[_ngcontent-%COMP%]{transform:rotate(90deg);color:var(--%NS%color-primary-light)}.debt-details[_ngcontent-%COMP%]{margin:0 14px 14px 66px;padding:12px;border-radius:var(--%NS%radius-small);background:var(--%NS%color-white-05)}.debt-group[_ngcontent-%COMP%] + .debt-group[_ngcontent-%COMP%]{margin-top:12px}.debt-group-title[_ngcontent-%COMP%]{margin:0 0 5px;color:var(--%NS%color-text-subtle);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.debt-group--receive[_ngcontent-%COMP%]   .debt-group-title[_ngcontent-%COMP%]{color:var(--%NS%color-success-light)}.debt-row[_ngcontent-%COMP%], .debt-total[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--%NS%color-text-muted);font-size:13px}.debt-row[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light);font-weight:600}.debt-group--receive[_ngcontent-%COMP%]   .debt-row[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%color-success-light)}.debt-total[_ngcontent-%COMP%]{margin-top:12px;padding-top:10px;border-top:1px solid var(--%NS%color-white-12);color:var(--%NS%color-text);font-weight:700}.debt-total[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}.no-debts[_ngcontent-%COMP%]{margin:0;color:var(--%NS%color-text-subtle);font-size:12px}.end-game-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%], .add-player-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%], .add-debt-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:18px;height:18px;font-size:18px}.empty-state[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;gap:8px;min-height:100px;margin-top:24px;padding:18px;color:var(--%NS%color-text-muted)}.empty-state[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--%NS%color-primary-light)}.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0}.end-game-button[_ngcontent-%COMP%]{align-self:center;min-height:44px;width:min(400px,100%);margin-top:12px;padding:0 22px;border:1px solid var(--%NS%color-danger-45)!important;border-radius:10px;background:transparent!important;color:var(--%NS%color-danger-light)!important}.primary-actions[_ngcontent-%COMP%]{display:grid;width:min(100%,var(--%NS%content-width));grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:24px}.add-player-button[_ngcontent-%COMP%], .add-debt-button[_ngcontent-%COMP%]{width:100%;box-sizing:border-box;min-height:48px;padding-inline:20px}`]})};export{ln as PaddleTable};