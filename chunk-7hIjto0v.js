import{$ as Ns,$n as ty,At as Xd,Bt as Zd,Cn as m,D as Hd,E as Hb,En as mi,Et as Wa,F as Kd,Ft as Yd,G as MM,Ht as _S,I as Ke,In as qa,J as Mz,Jn as tT,Jt as ct$1,Kn as st,Ln as qd,M as K,Mn as oy,Mt as Y,N as Kb,Nn as p$1,Nt as Ya,O as Hr,On as nr,Pt as Yb,Qt as e8,R as L,Rn as qo,Rt as Yv,Sn as ly,St as Uc,Tn as me,U as Le,Un as sD,Ut as _T,Vn as rr,W as Lv,X as NE,Xt as dn$1,Z as NS,_t as Te,ar as wT,at as P,br as zv,d as Bv,dr as y,dt as R,er as ue,i as $r,ir as vo,it as Ov,jt as Xe,kn as ny,lt as Qd,mn as kM,mt as Ra,on as iy,ot as PH,p as Do,pn as kH,qn as t8,qt as bp,sn as jC,sr as wt,st as Py,t as $b,tn as eu,u as Bb,un as jb,ut as Qn,vr as zr,vt as Tp,xt as Ub,y as Fp,yn as le,zt as Za}from"./chunk-DXhR5ZmG.js";import{C as l,E as p$2,_ as ae,g as X,r as Fe,t as At,x as ji$1}from"./chunk-D3GaRpFW.js";import{D as ke,F as wn$1,M as qt,N as te,P as tt,S as di,T as hi$1,a as T,c as ee,d as An,f as E,g as Kt,l as jt,o as Vt,p as Ee,r as Ht,u as zt,v as Lt,x as Wt,y as Sn$1}from"./main-FJSGILHJ.js";import{t as I}from"./chunk-BHCSFjVY.js";import{b as sn$1,f as Ue,g as fe,i as Fn,n as B,p as Xt,r as En,s as Nn,t as $t,u as Sn$2,v as p$3}from"./chunk-CwgPINkt.js";import{a as de,d as ot,i as ce,l as lt$1,n as Tn$1,o as fe$1,p as zt$1,r as X$1,s as it,t as Rn,u as me$1}from"./chunk-B8GZNYI2.js";import{n as mt$1,t as Yt}from"./chunk-CY4IxYm8.js";import{i as Lt$1,n as G,r as I$1,t as Bt}from"./chunk-Du3h2CI5.js";import{n as I$2}from"./chunk-uPTmPr98.js";var Ge=class a{dialogRef=p$1(T);name=``;cancel(){this.dialogRef.close()}add(){let n=this.name.trim();n&&this.dialogRef.close(n)}static ɵfac=function(e){return new(e||a)};static ɵcmp=nr({type:a,selectors:[[`app-paddle-add-player-dialog`]],decls:12,vars:2,consts:[[`mat-dialog-title`,``],[`mat-dialog-content`,``,1,`dialog-form`,3,`submit`],[`appearance`,`outline`],[`matInput`,``,`name`,`playerName`,`autocomplete`,`off`,`cdkFocusInitial`,``,3,`ngModelChange`,`ngModel`],[`mat-dialog-actions`,``,`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`]],template:function(e,t){e&1&&(Ra(0,`h2`,0),wT(1,`Spieler hinzufügen`),Hd(),Ra(2,`form`,1),qa(`submit`,function(r){return r.preventDefault(),t.add()}),Ra(3,`mat-form-field`,2)(4,`mat-label`),wT(5,`Name`),Hd(),Ra(6,`input`,3),iy(`ngModelChange`,function(r){return _T(t.name,r)||(t.name=r),r}),Hd(),_S(),Hd()(),Ra(7,`div`,4)(8,`button`,5),qa(`click`,function(){return t.cancel()}),wT(9,`Abbrechen`),Hd(),Ra(10,`button`,6),qa(`click`,function(){return t.add()}),wT(11,` Hinzufügen `),Hd()()),e&2&&(jC(6),oy(`ngModel`,t.name),NS(),jC(4),Lv(`disabled`,!t.name.trim()))},dependencies:[Sn$2,Nn,Ue,En,Fn,Xt,$t,hi$1,di,Ht,jt,zt,Vt,me$1,it,de,Rn,Tn$1],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:320px}.dialog-form[_ngcontent-%COMP%]{padding-top:4px}mat-form-field[_ngcontent-%COMP%]{width:100%}[mat-dialog-actions][_ngcontent-%COMP%]{gap:8px}`]})};var Ne=class{_multiple;_emitChanges;compareWith;_selection=new Set;_deselectedToEmit=[];_selectedToEmit=[];_selected=null;get selected(){return this._selected||(this._selected=Array.from(this._selection.values())),this._selected}changed=new Y;bulk={select:n=>this._select(n),deselect:n=>this._deselect(n),setSelection:n=>this._setSelection(n)};constructor(n=!1,e,t=!0,i){this._multiple=n,this._emitChanges=t,this.compareWith=i,e&&e.length&&(n?e.forEach(r=>this._markSelected(r)):this._markSelected(e[0]),this._selectedToEmit.length=0)}select(...n){return this._select(n)}deselect(...n){return this._deselect(n)}setSelection(...n){return this._setSelection(n)}toggle(n){return this.isSelected(n)?this.deselect(n):this.select(n)}clear(n=!0){this._unmarkAll();let e=this._hasQueuedChanges();return n&&this._emitChangeEvent(),e}isSelected(n){return this._selection.has(this._getConcreteValue(n))}isEmpty(){return this._selection.size===0}hasValue(){return!this.isEmpty()}sort(n){this._multiple&&this.selected&&this._selected.sort(n)}isMultipleSelection(){return this._multiple}_select(n){this._verifyValueAssignment(n),n.forEach(t=>this._markSelected(t));let e=this._hasQueuedChanges();return this._emitChangeEvent(),e}_deselect(n){this._verifyValueAssignment(n),n.forEach(t=>this._unmarkSelected(t));let e=this._hasQueuedChanges();return this._emitChangeEvent(),e}_setSelection(n){this._verifyValueAssignment(n);let e=this.selected,t=new Set(n.map(r=>this._getConcreteValue(r)));n.forEach(r=>this._markSelected(r)),e.filter(r=>!t.has(this._getConcreteValue(r,t))).forEach(r=>this._unmarkSelected(r));let i=this._hasQueuedChanges();return this._emitChangeEvent(),i}_emitChangeEvent(){this._selected=null,(this._selectedToEmit.length||this._deselectedToEmit.length)&&(this.changed.next({source:this,added:this._selectedToEmit,removed:this._deselectedToEmit}),this._deselectedToEmit=[],this._selectedToEmit=[])}_markSelected(n){n=this._getConcreteValue(n),this.isSelected(n)||(this._multiple||this._unmarkAll(),this.isSelected(n)||this._selection.add(n),this._emitChanges&&this._selectedToEmit.push(n))}_unmarkSelected(n){n=this._getConcreteValue(n),this.isSelected(n)&&(this._selection.delete(n),this._emitChanges&&this._deselectedToEmit.push(n))}_unmarkAll(){this.isEmpty()||this._selection.forEach(n=>this._unmarkSelected(n))}_verifyValueAssignment(n){n.length>1&&this._multiple}_hasQueuedChanges(){return!!(this._deselectedToEmit.length||this._selectedToEmit.length)}_getConcreteValue(n,e){if(this.compareWith){e=e??this._selection;for(let t of e)if(this.compareWith(n,t))return t;return n}else return n}};var hi=(()=>{class a{_animationsDisabled=ji$1();state=`unchecked`;disabled=!1;appearance=`full`;static ɵfac=function(t){return new(t||a)};static ɵcmp=nr({type:a,selectors:[[`mat-pseudo-checkbox`]],hostAttrs:[1,`mat-pseudo-checkbox`],hostVars:12,hostBindings:function(t,i){t&2&&Ya(`mat-pseudo-checkbox-indeterminate`,i.state===`indeterminate`)(`mat-pseudo-checkbox-checked`,i.state===`checked`)(`mat-pseudo-checkbox-disabled`,i.disabled)(`mat-pseudo-checkbox-minimal`,i.appearance===`minimal`)(`mat-pseudo-checkbox-full`,i.appearance===`full`)(`_mat-animation-noopable`,i._animationsDisabled)},inputs:{state:`state`,disabled:`disabled`,appearance:`appearance`},decls:0,vars:0,template:function(t,i){},styles:[`.mat-pseudo-checkbox {
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
`],encapsulation:2})}return a})();var Ri=[`text`];var Ai=[[[`mat-icon`]],`*`];var Vi=[`mat-icon`,`*`];function Fi(a,n){if(a&1&&Wa(0,`mat-pseudo-checkbox`,1),a&2){let e=Kb();Lv(`disabled`,e.disabled)(`state`,e.selected?`checked`:`unchecked`)}}function Bi(a,n){if(a&1&&Wa(0,`mat-pseudo-checkbox`,3),a&2)Lv(`disabled`,Kb().disabled)}function zi(a,n){if(a&1&&(Ra(0,`span`,4),wT(1),Hd()),a&2){let e=Kb();jC(),Xd(`(`,e.group.label,`)`)}}var dt=new y(`MAT_OPTION_PARENT_COMPONENT`);var ct=new y(`MatOptgroup`);var lt=class{source;isUserInput;constructor(n,e=!1){this.source=n,this.isUserInput=e}};var Me=(()=>{class a{_element=p$1(st);_changeDetectorRef=p$1($r);_parent=p$1(dt,{optional:!0});group=p$1(ct,{optional:!0});_signalDisableRipple=!1;_selected=!1;_active=!1;_mostRecentViewValue=``;get multiple(){return this._parent&&this._parent.multiple}get selected(){return this._selected}value;id=p$1(X).getId(`mat-option-`);get disabled(){return this.group&&this.group.disabled||this._disabled()}set disabled(e){this._disabled.set(e)}_disabled=K(!1);get disableRipple(){return this._signalDisableRipple?this._parent.disableRipple():!!this._parent?.disableRipple}get hideSingleSelectionIndicator(){return!!(this._parent&&this._parent.hideSingleSelectionIndicator)}onSelectionChange=new ue;_text;_stateChanges=new Y;constructor(){let e=p$1(MM);e.load(ke),e.load(Mz),this._signalDisableRipple=!!this._parent&&qo(this._parent.disableRipple)}get active(){return this._active}get viewValue(){return(this._text?.nativeElement.textContent||``).trim()}select(e=!0){this._selected||(this._selected=!0,this._changeDetectorRef.markForCheck(),e&&this._emitSelectionChangeEvent())}deselect(e=!0){this._selected&&(this._selected=!1,this._changeDetectorRef.markForCheck(),e&&this._emitSelectionChangeEvent())}focus(e,t){let i=this._getHostElement();typeof i.focus==`function`&&i.focus(t)}setActiveStyles(){this._active||(this._active=!0,this._changeDetectorRef.markForCheck())}setInactiveStyles(){this._active&&(this._active=!1,this._changeDetectorRef.markForCheck())}getLabel(){return this.viewValue}_handleKeydown(e){(e.keyCode===13||e.keyCode===32)&&!Fe(e)&&(this._selectViaInteraction(),e.preventDefault())}_selectViaInteraction(){this.disabled||(this._selected=this.multiple?!this._selected:!0,this._changeDetectorRef.markForCheck(),this._emitSelectionChangeEvent(!0))}_getTabIndex(){return this.disabled?`-1`:`0`}_getHostElement(){return this._element.nativeElement}ngAfterViewChecked(){if(this._selected){let e=this.viewValue;e!==this._mostRecentViewValue&&(this._mostRecentViewValue&&this._stateChanges.next(),this._mostRecentViewValue=e)}}ngOnDestroy(){this._stateChanges.complete()}_emitSelectionChangeEvent(e=!1){this.onSelectionChange.emit(new lt(this,e))}static ɵfac=function(t){return new(t||a)};static ɵcmp=nr({type:a,selectors:[[`mat-option`]],viewQuery:function(t,i){if(t&1&&zv(Ri,7),t&2){let r;Yd(r=Qd())&&(i._text=r.first)}},hostAttrs:[`role`,`option`,1,`mat-mdc-option`,`mdc-list-item`],hostVars:11,hostBindings:function(t,i){t&1&&qa(`click`,function(){return i._selectViaInteraction()})(`keydown`,function(m){return i._handleKeydown(m)}),t&2&&(Bv(`id`,i.id),rr(`aria-selected`,i.selected)(`aria-disabled`,i.disabled.toString()),Ya(`mdc-list-item--selected`,i.selected)(`mat-mdc-option-multiple`,i.multiple)(`mat-mdc-option-active`,i.active)(`mdc-list-item--disabled`,i.disabled))},inputs:{value:`value`,id:`id`,disabled:[2,`disabled`,`disabled`,zr]},outputs:{onSelectionChange:`onSelectionChange`},exportAs:[`matOption`],ngContentSelectors:Vi,decls:8,vars:5,consts:[[`text`,``],[`aria-hidden`,`true`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`,`state`],[1,`mdc-list-item__primary-text`],[`state`,`checked`,`aria-hidden`,`true`,`appearance`,`minimal`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`],[1,`cdk-visually-hidden`],[`aria-hidden`,`true`,`mat-ripple`,``,1,`mat-mdc-option-ripple`,`mat-focus-indicator`,3,`matRippleTrigger`,`matRippleDisabled`]],template:function(t,i){t&1&&(qd(Ai),jb(0,Fi,1,2,`mat-pseudo-checkbox`,1),Zd(1),Ra(2,`span`,2,0),Zd(4,1),Hd(),jb(5,Bi,1,1,`mat-pseudo-checkbox`,3),jb(6,zi,2,1,`span`,4),Wa(7,`div`,5)),t&2&&(Ub(i.multiple?0:-1),jC(5),Ub(!i.multiple&&i.selected&&!i.hideSingleSelectionIndicator?5:-1),jC(),Ub(i.group&&i.group._inert?6:-1),jC(),Lv(`matRippleTrigger`,i._getHostElement())(`matRippleDisabled`,i.disabled||i.disableRipple))},dependencies:[hi,An],styles:[`.mat-mdc-option {
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
`],encapsulation:2})}return a})();function ui(a,n,e){if(e.length){let t=n.toArray(),i=e.toArray(),r=0;for(let m=0;m<a+1;m++)t[m].group&&t[m].group===i[r]&&r++;return r}return 0}function _i(a,n,e,t){return a<e?a:a+n>e+t?Math.max(0,a-t+n):e}var gi=(()=>{class a{static ɵfac=function(t){return new(t||a)};static ɵmod=wt({type:a});static ɵinj=Xe({imports:[sD]})}return a})();var mt=(()=>{class a{static ɵfac=function(t){return new(t||a)};static ɵmod=wt({type:a});static ɵinj=Xe({imports:[Ee,gi,Me,sD]})}return a})();var Hi=[`trigger`];var ji=[`panel`];var Ki=[[[`mat-select-trigger`]],`*`];var Gi=[`mat-select-trigger`,`*`];function Qi(a,n){if(a&1&&(Ra(0,`span`,4),wT(1),Hd()),a&2){let e=Kb();jC(),ty(e.placeholder)}}function qi(a,n){a&1&&Zd(0)}function $i(a,n){if(a&1&&(Ra(0,`span`,11),wT(1),Hd()),a&2){let e=Kb(2);jC(),ty(e.triggerValue)}}function Yi(a,n){if(a&1&&(Ra(0,`span`,5),jb(1,qi,1,0)(2,$i,2,1,`span`,11),Hd()),a&2){let e=Kb();jC(),Ub(e.customTrigger?1:2)}}function Zi(a,n){if(a&1){let e=Yb();Ra(0,`div`,12,1),qa(`keydown`,function(i){bp(e);return Tp(Kb()._handleKeydown(i))}),Zd(2,1),Hd()}if(a&2){let e=Kb();Kd(e.panelClass),Ya(`mat-select-panel-animations-enabled`,!e._animationsDisabled)(`mat-primary`,e._parentFormField?.color===`primary`)(`mat-accent`,e._parentFormField?.color===`accent`)(`mat-warn`,e._parentFormField?.color===`warn`)(`mat-undefined`,!e._parentFormField?.color),rr(`id`,e.id+`-panel`)(`aria-multiselectable`,e.multiple)(`aria-label`,e.ariaLabel||null)(`aria-labelledby`,e._getPanelAriaLabelledby())}}var Ji=new y(`mat-select-scroll-strategy`,{providedIn:`root`,factory:()=>{let a=p$1(me);return()=>qt(a)}});var en=new y(`MAT_SELECT_CONFIG`);var vi=new y(`MatSelectTrigger`);var pt=class{source;value;constructor(n,e){this.source=n,this.value=e}};var yi=(()=>{class a{_viewportRuler=p$1(tt);_changeDetectorRef=p$1($r);_elementRef=p$1(st);_dir=p$1(kM,{optional:!0});_idGenerator=p$1(X);_renderer=p$1(Qn);_parentFormField=p$1(fe$1,{optional:!0});ngControl=p$1(p$3,{self:!0,optional:!0});_liveAnnouncer=p$1(At);_defaultOptions=p$1(en,{optional:!0});_animationsDisabled=ji$1();_popoverLocation;_initialized=new Y;_cleanupDetach;options;optionGroups;customTrigger;_positions=[{originX:`start`,originY:`bottom`,overlayX:`start`,overlayY:`top`},{originX:`end`,originY:`bottom`,overlayX:`end`,overlayY:`top`},{originX:`start`,originY:`top`,overlayX:`start`,overlayY:`bottom`,panelClass:`mat-mdc-select-panel-above`},{originX:`end`,originY:`top`,overlayX:`end`,overlayY:`bottom`,panelClass:`mat-mdc-select-panel-above`}];_scrollOptionIntoView(e){let t=this.options.toArray()[e];if(t){let i=this.panel.nativeElement,r=ui(e,this.options,this.optionGroups),m=t._getHostElement();e===0&&r===1?i.scrollTop=0:i.scrollTop=_i(m.offsetTop,m.offsetHeight,i.scrollTop,i.offsetHeight)}}_positioningSettled(){this._scrollOptionIntoView(this._keyManager.activeItemIndex||0)}_getChangeEvent(e){return new pt(this,e)}_scrollStrategyFactory=p$1(Ji);_panelOpen=!1;_compareWith=(e,t)=>e===t;_uid=this._idGenerator.getId(`mat-select-`);_triggerAriaLabelledBy=null;_previousControl;_destroy=new Y;_errorStateTracker;stateChanges=new Y;disableAutomaticLabeling=!0;userAriaDescribedBy;_selectionModel;_keyManager;_preferredOverlayOrigin;_overlayWidth;_onChange=()=>{};_onTouched=()=>{};_valueId=this._idGenerator.getId(`mat-select-value-`);_scrollStrategy;_overlayPanelClass=this._defaultOptions?.overlayPanelClass||``;get focused(){return this._focused||this._panelOpen}_focused=!1;controlType=`mat-select`;trigger;panel;_overlayDir;panelClass;disabled=!1;get disableRipple(){return this._disableRipple()}set disableRipple(e){this._disableRipple.set(e)}_disableRipple=K(!1);tabIndex=0;get hideSingleSelectionIndicator(){return this._hideSingleSelectionIndicator}set hideSingleSelectionIndicator(e){this._hideSingleSelectionIndicator=e,this._syncParentProperties()}_hideSingleSelectionIndicator=this._defaultOptions?.hideSingleSelectionIndicator??!1;get placeholder(){return this._placeholder}set placeholder(e){this._placeholder=e,this.stateChanges.next()}_placeholder;get required(){return this._required??this.ngControl?.control?.hasValidator(fe.required)??!1}set required(e){this._required=e,this.stateChanges.next()}_required;get multiple(){return this._multiple}set multiple(e){this._selectionModel,this._multiple=e}_multiple=!1;disableOptionCentering=this._defaultOptions?.disableOptionCentering??!1;get compareWith(){return this._compareWith}set compareWith(e){this._compareWith=e,this._selectionModel&&this._initializeSelection()}get value(){return this._value}set value(e){this._assignValue(e)&&this._onChange(e)}_value;ariaLabel=``;ariaLabelledby;get errorStateMatcher(){return this._errorStateTracker.matcher}set errorStateMatcher(e){this._errorStateTracker.matcher=e}typeaheadDebounceInterval;sortComparator;get id(){return this._id}set id(e){this._id=e||this._uid,this.stateChanges.next()}_id;get errorState(){return this._errorStateTracker.errorState}set errorState(e){this._errorStateTracker.errorState=e}panelWidth=this._defaultOptions&&typeof this._defaultOptions.panelWidth<`u`?this._defaultOptions.panelWidth:`auto`;canSelectNullableOptions=this._defaultOptions?.canSelectNullableOptions??!1;optionSelectionChanges=vo(()=>{let e=this.options;return e?e.changes.pipe(eu(e),Le(()=>NE(...e.map(t=>t.onSelectionChange)))):this._initialized.pipe(Le(()=>this.optionSelectionChanges))});openedChange=new ue;_openedStream=this.openedChange.pipe(Te(e=>e),P(()=>{}));_closedStream=this.openedChange.pipe(Te(e=>!e),P(()=>{}));selectionChange=new ue;valueChange=new ue;constructor(){let e=p$1(lt$1),t=p$1($t,{optional:!0}),i=p$1(sn$1,{optional:!0}),r=p$1(new Hr(`tabindex`),{optional:!0}),m=p$1(te,{optional:!0}),h=p$1(ot,{optional:!0,self:!0});this.ngControl&&(this.ngControl.valueAccessor=this),this._defaultOptions?.typeaheadDebounceInterval!=null&&(this.typeaheadDebounceInterval=this._defaultOptions.typeaheadDebounceInterval),this._errorStateTracker=new X$1(e,h||this.ngControl,i,t,this.stateChanges),this._scrollStrategy=this._scrollStrategyFactory(),this.tabIndex=r==null?0:parseInt(r)||0,this._popoverLocation=m?.usePopover===!1?null:`inline`,this.id=this.id}ngOnInit(){this._selectionModel=new Ne(this.multiple),this.stateChanges.next(),this._viewportRuler.change().pipe(Do(this._destroy)).subscribe(()=>{this.panelOpen&&(this._overlayWidth=this._getOverlayWidth(this._preferredOverlayOrigin),this._changeDetectorRef.detectChanges())})}ngAfterContentInit(){this._initialized.next(),this._initialized.complete(),this._initKeyManager(),this._selectionModel.changed.pipe(Do(this._destroy)).subscribe(e=>{e.added.forEach(t=>t.select()),e.removed.forEach(t=>t.deselect())}),this.options.changes.pipe(eu(null),Do(this._destroy)).subscribe(()=>{this._resetOptions(),this._initializeSelection()})}ngDoCheck(){let e=this._getTriggerAriaLabelledby(),t=this.ngControl;if(e!==this._triggerAriaLabelledBy){let i=this._elementRef.nativeElement;this._triggerAriaLabelledBy=e,e?i.setAttribute(`aria-labelledby`,e):i.removeAttribute(`aria-labelledby`)}t&&(this._previousControl!==t.control&&(this._previousControl!==void 0&&t.disabled!==null&&t.disabled!==this.disabled&&(this.disabled=t.disabled),this._previousControl=t.control),this.updateErrorState())}ngOnChanges(e){(e.disabled||e.userAriaDescribedBy)&&this.stateChanges.next(),e.typeaheadDebounceInterval&&this._keyManager&&this._keyManager.withTypeAhead(this.typeaheadDebounceInterval),e.panelClass&&this.panelClass instanceof Set&&(this.panelClass=Array.from(this.panelClass))}ngOnDestroy(){this._cleanupDetach?.(),this._keyManager?.destroy(),this._destroy.next(),this._destroy.complete(),this.stateChanges.complete()}toggle(){this.panelOpen?this.close():this.open()}open(){this._canOpen()&&(this._parentFormField&&(this._preferredOverlayOrigin=this._parentFormField.getConnectedOverlayOrigin()),this._cleanupDetach?.(),this._overlayWidth=this._getOverlayWidth(this._preferredOverlayOrigin),this._panelOpen=!0,this._overlayDir.positionChange.pipe(Ke(1)).subscribe(()=>{this._changeDetectorRef.detectChanges(),this._positioningSettled()}),this._overlayDir.attachOverlay(),this._keyManager.withHorizontalOrientation(null),this._highlightCorrectOption(),this._changeDetectorRef.markForCheck(),this.stateChanges.next(),Promise.resolve().then(()=>this.openedChange.emit(!0)))}close(){this._panelOpen&&(this._panelOpen=!1,this._exitAndDetach(),this._keyManager.withHorizontalOrientation(this._isRtl()?`rtl`:`ltr`),this._changeDetectorRef.markForCheck(),this._onTouched(),this.stateChanges.next(),Promise.resolve().then(()=>this.openedChange.emit(!1)))}_exitAndDetach(){if(this._animationsDisabled||!this.panel){this._detachOverlay();return}this._cleanupDetach?.(),this._cleanupDetach=()=>{t(),clearTimeout(i),this._cleanupDetach=void 0};let e=this.panel.nativeElement,t=this._renderer.listen(e,`animationend`,r=>{r.animationName===`_mat-select-exit`&&(this._cleanupDetach?.(),this._detachOverlay())}),i=setTimeout(()=>{this._cleanupDetach?.(),this._detachOverlay()},200);e.classList.add(`mat-select-panel-exit`)}_detachOverlay(){this._overlayDir.detachOverlay(),this._changeDetectorRef.markForCheck()}writeValue(e){this._assignValue(e)}registerOnChange(e){this._onChange=e}registerOnTouched(e){this._onTouched=e}setDisabledState(e){this.disabled=e,this._changeDetectorRef.markForCheck(),this.stateChanges.next()}get panelOpen(){return this._panelOpen}get selected(){return this.multiple?this._selectionModel?.selected||[]:this._selectionModel?.selected[0]}get triggerValue(){if(this.empty)return``;if(this._multiple){let e=this._selectionModel.selected.map(t=>t.viewValue);return this._isRtl()&&e.reverse(),e.join(`, `)}return this._selectionModel.selected[0].viewValue}updateErrorState(){this._errorStateTracker.updateErrorState()}_isRtl(){return this._dir?this._dir.value===`rtl`:!1}_handleKeydown(e){this.disabled||(this.panelOpen?this._handleOpenKeydown(e):this._handleClosedKeydown(e))}_handleClosedKeydown(e){let t=e.keyCode,i=t===40||t===38||t===37||t===39,r=t===13||t===32,m=this._keyManager;if(!m.isTyping()&&r&&!Fe(e)||(this.multiple||e.altKey)&&i)e.preventDefault(),this.open();else if(!this.multiple){let h=this.selected;m.onKeydown(e);let g=this.selected;g&&h!==g&&this._liveAnnouncer.announce(g.viewValue,1e4)}}_handleOpenKeydown(e){let t=this._keyManager,i=e.keyCode,r=i===40||i===38,m=t.isTyping();if(r&&e.altKey)e.preventDefault(),this.close();else if(!m&&(i===13||i===32)&&t.activeItem&&!Fe(e))e.preventDefault(),t.activeItem._selectViaInteraction();else if(!m&&this._multiple&&i===65&&e.ctrlKey){e.preventDefault();let h=this.options.some(g=>!g.disabled&&!g.selected);this.options.forEach(g=>{g.disabled||(h?g.select():g.deselect())})}else{let h=t.activeItemIndex;t.onKeydown(e),this._multiple&&r&&e.shiftKey&&t.activeItem&&t.activeItemIndex!==h&&t.activeItem._selectViaInteraction()}}_handleOverlayKeydown(e){e.keyCode===27&&!Fe(e)&&(e.preventDefault(),this.close())}_onFocus(){this.disabled||(this._focused=!0,this.stateChanges.next())}_onBlur(){this._focused=!1,this._keyManager?.cancelTypeahead(),!this.disabled&&!this.panelOpen&&(this._onTouched(),this._changeDetectorRef.markForCheck(),this.stateChanges.next())}get empty(){return!this._selectionModel||this._selectionModel.isEmpty()}_initializeSelection(){Promise.resolve().then(()=>{this.ngControl&&(this._value=this.ngControl.value),this._setSelectionByValue(this._value),this.stateChanges.next()})}_setSelectionByValue(e){if(this.options.forEach(t=>t.setInactiveStyles()),this._selectionModel.clear(),this.multiple&&e)e.forEach(t=>this._selectOptionByValue(t)),this._sortValues();else{let t=this._selectOptionByValue(e);t?this._keyManager.updateActiveItem(t):this.panelOpen||this._keyManager.updateActiveItem(-1)}this._changeDetectorRef.markForCheck()}_selectOptionByValue(e){let t=this.options.find(i=>{if(this._selectionModel.isSelected(i))return!1;try{return(i.value!=null||this.canSelectNullableOptions)&&this._compareWith(i.value,e)}catch{return!1}});return t&&this._selectionModel.select(t),t}_assignValue(e){return e!==this._value||this._multiple&&Array.isArray(e)?(this.options&&this._setSelectionByValue(e),this._value=e,!0):!1}_skipPredicate=e=>this.panelOpen?!1:e.disabled;_getOverlayWidth(e){return this.panelWidth===`auto`?(e instanceof Kt?e.elementRef:e||this._elementRef).nativeElement.getBoundingClientRect().width:this.panelWidth===null?``:this.panelWidth}_syncParentProperties(){if(this.options)for(let e of this.options)e._changeDetectorRef.markForCheck()}_initKeyManager(){this._keyManager=new ae(this.options).withTypeAhead(this.typeaheadDebounceInterval).withVerticalOrientation().withHorizontalOrientation(this._isRtl()?`rtl`:`ltr`).withHomeAndEnd().withPageUpDown().withAllowedModifierKeys([`shiftKey`]).skipPredicate(this._skipPredicate),this._keyManager.tabOut.subscribe(()=>{this.panelOpen&&(!this.multiple&&this._keyManager.activeItem&&this._keyManager.activeItem._selectViaInteraction(),this.focus(),this.close())}),this._keyManager.change.subscribe(()=>{this._panelOpen&&this.panel?this._scrollOptionIntoView(this._keyManager.activeItemIndex||0):!this._panelOpen&&!this.multiple&&this._keyManager.activeItem&&this._keyManager.activeItem._selectViaInteraction()})}_resetOptions(){let e=NE(this.options.changes,this._destroy);this.optionSelectionChanges.pipe(Do(e)).subscribe(t=>{this._onSelect(t.source,t.isUserInput),t.isUserInput&&!this.multiple&&this._panelOpen&&(this.close(),this.focus())}),NE(...this.options.map(t=>t._stateChanges)).pipe(Do(e)).subscribe(()=>{this._changeDetectorRef.detectChanges(),this.stateChanges.next()})}_onSelect(e,t){let i=this._selectionModel.isSelected(e);!this.canSelectNullableOptions&&e.value==null&&!this._multiple?(e.deselect(),this._selectionModel.clear(),this.value!=null&&this._propagateChanges(e.value)):(i!==e.selected&&(e.selected?this._selectionModel.select(e):this._selectionModel.deselect(e)),t&&this._keyManager.setActiveItem(e),this.multiple&&(this._sortValues(),t&&this.focus())),i!==this._selectionModel.isSelected(e)&&this._propagateChanges(),this.stateChanges.next()}_sortValues(){if(this.multiple){let e=this.options.toArray();this._selectionModel.sort((t,i)=>this.sortComparator?this.sortComparator(t,i,e):e.indexOf(t)-e.indexOf(i)),this.stateChanges.next()}}_propagateChanges(e){let t;this.multiple?t=this.selected.map(i=>i.value):t=this.selected?this.selected.value:e,this._value=t,this.valueChange.emit(t),this._onChange(t),this.selectionChange.emit(this._getChangeEvent(t)),this._changeDetectorRef.markForCheck()}_highlightCorrectOption(){if(this._keyManager)if(this.empty){let e=-1;for(let t=0;t<this.options.length;t++)if(!this.options.get(t).disabled){e=t;break}this._keyManager.setActiveItem(e)}else this._keyManager.setActiveItem(this._selectionModel.selected[0])}_canOpen(){return!this._panelOpen&&!this.disabled&&this.options?.length>0&&!!this._overlayDir}focus(e){this._elementRef.nativeElement.focus(e)}_getPanelAriaLabelledby(){if(this.ariaLabel)return null;let e=this._parentFormField?.getLabelId()||null,t=e?e+` `:``;return this.ariaLabelledby?t+this.ariaLabelledby:e}_getAriaActiveDescendant(){return this.panelOpen&&this._keyManager&&this._keyManager.activeItem?this._keyManager.activeItem.id:null}_getTriggerAriaLabelledby(){if(this.ariaLabel)return null;let e=this._parentFormField?.getLabelId()||``;return this.ariaLabelledby&&(e+=` `+this.ariaLabelledby),e||(e=this._valueId),e}get describedByIds(){return this._elementRef.nativeElement.getAttribute(`aria-describedby`)?.split(` `)||[]}setDescribedByIds(e){let t=this._elementRef.nativeElement;e.length?t.setAttribute(`aria-describedby`,e.join(` `)):t.removeAttribute(`aria-describedby`)}onContainerClick(e){let t=p$2(e);t&&(t.tagName===`MAT-OPTION`||t.classList.contains(`cdk-overlay-backdrop`)||t.closest(`.mat-mdc-select-panel`))||(this.focus(),this.open())}get shouldLabelFloat(){return this.panelOpen||!this.empty||this.focused&&!!this.placeholder}static ɵfac=function(t){return new(t||a)};static ɵcmp=nr({type:a,selectors:[[`mat-select`]],contentQueries:function(t,i,r){if(t&1&&Za(r,vi,5)(r,Me,5)(r,ct,5),t&2){let m;Yd(m=Qd())&&(i.customTrigger=m.first),Yd(m=Qd())&&(i.options=m),Yd(m=Qd())&&(i.optionGroups=m)}},viewQuery:function(t,i){if(t&1&&zv(Hi,5)(ji,5)(Sn$1,5),t&2){let r;Yd(r=Qd())&&(i.trigger=r.first),Yd(r=Qd())&&(i.panel=r.first),Yd(r=Qd())&&(i._overlayDir=r.first)}},hostAttrs:[`role`,`combobox`,`aria-haspopup`,`listbox`,1,`mat-mdc-select`],hostVars:21,hostBindings:function(t,i){t&1&&qa(`keydown`,function(m){return i._handleKeydown(m)})(`focus`,function(){return i._onFocus()})(`blur`,function(){return i._onBlur()}),t&2&&(rr(`id`,i.id)(`tabindex`,i.disabled?-1:i.tabIndex)(`aria-controls`,i.panelOpen?i.id+`-panel`:null)(`aria-expanded`,i.panelOpen)(`aria-label`,i.ariaLabel||null)(`aria-required`,i.required.toString())(`aria-disabled`,i.disabled.toString())(`aria-invalid`,i.errorState)(`aria-activedescendant`,i._getAriaActiveDescendant()),Ya(`mat-mdc-select-disabled`,i.disabled)(`mat-mdc-select-invalid`,i.errorState)(`mat-mdc-select-required`,i.required)(`mat-mdc-select-empty`,i.empty)(`mat-mdc-select-multiple`,i.multiple)(`mat-select-open`,i.panelOpen))},inputs:{userAriaDescribedBy:[0,`aria-describedby`,`userAriaDescribedBy`],panelClass:`panelClass`,disabled:[2,`disabled`,`disabled`,zr],disableRipple:[2,`disableRipple`,`disableRipple`,zr],tabIndex:[2,`tabIndex`,`tabIndex`,e=>e==null?0:kH(e)],hideSingleSelectionIndicator:[2,`hideSingleSelectionIndicator`,`hideSingleSelectionIndicator`,zr],placeholder:`placeholder`,required:[2,`required`,`required`,zr],multiple:[2,`multiple`,`multiple`,zr],disableOptionCentering:[2,`disableOptionCentering`,`disableOptionCentering`,zr],compareWith:`compareWith`,value:`value`,ariaLabel:[0,`aria-label`,`ariaLabel`],ariaLabelledby:[0,`aria-labelledby`,`ariaLabelledby`],errorStateMatcher:`errorStateMatcher`,typeaheadDebounceInterval:[2,`typeaheadDebounceInterval`,`typeaheadDebounceInterval`,kH],sortComparator:`sortComparator`,id:`id`,panelWidth:`panelWidth`,canSelectNullableOptions:[2,`canSelectNullableOptions`,`canSelectNullableOptions`,zr]},outputs:{openedChange:`openedChange`,_openedStream:`opened`,_closedStream:`closed`,selectionChange:`selectionChange`,valueChange:`valueChange`},exportAs:[`matSelect`],features:[ly([{provide:ce,useExisting:a},{provide:dt,useExisting:a}]),dn$1],ngContentSelectors:Gi,decls:11,vars:10,consts:[[`fallbackOverlayOrigin`,`cdkOverlayOrigin`,`trigger`,``],[`panel`,``],[`cdk-overlay-origin`,``,1,`mat-mdc-select-trigger`,3,`click`],[1,`mat-mdc-select-value`],[1,`mat-mdc-select-placeholder`,`mat-mdc-select-min-line`],[1,`mat-mdc-select-value-text`],[1,`mat-mdc-select-arrow-wrapper`],[1,`mat-mdc-select-arrow`],[`viewBox`,`0 0 24 24`,`width`,`24px`,`height`,`24px`,`focusable`,`false`,`aria-hidden`,`true`],[`d`,`M7 10l5 5 5-5z`],[`cdk-connected-overlay`,``,`cdkConnectedOverlayHasBackdrop`,``,`cdkConnectedOverlayBackdropClass`,`cdk-overlay-transparent-backdrop`,3,`detach`,`backdropClick`,`overlayKeydown`,`cdkConnectedOverlayDisableClose`,`cdkConnectedOverlayPanelClass`,`cdkConnectedOverlayScrollStrategy`,`cdkConnectedOverlayOrigin`,`cdkConnectedOverlayPositions`,`cdkConnectedOverlayWidth`,`cdkConnectedOverlayFlexibleDimensions`,`cdkConnectedOverlayUsePopover`],[1,`mat-mdc-select-min-line`],[`role`,`listbox`,`tabindex`,`-1`,1,`mat-mdc-select-panel`,`mdc-menu-surface`,`mdc-menu-surface--open`,3,`keydown`]],template:function(t,i){if(t&1&&(qd(Ki),Ra(0,`div`,2,0),qa(`click`,function(){return i.open()}),Ra(3,`div`,3),jb(4,Qi,2,1,`span`,4)(5,Yi,3,1,`span`,5),Hd(),Ra(6,`div`,6)(7,`div`,7),Fp(),Ra(8,`svg`,8),Wa(9,`path`,9),Hd()()()(),Ov(10,Zi,3,16,`ng-template`,10),qa(`detach`,function(){return i.close()})(`backdropClick`,function(){return i.close()})(`overlayKeydown`,function(m){return i._handleOverlayKeydown(m)})),t&2){let r=tT(1);jC(3),rr(`id`,i._valueId),jC(),Ub(i.empty?4:5),jC(6),Lv(`cdkConnectedOverlayDisableClose`,!0)(`cdkConnectedOverlayPanelClass`,i._overlayPanelClass)(`cdkConnectedOverlayScrollStrategy`,i._scrollStrategy)(`cdkConnectedOverlayOrigin`,i._preferredOverlayOrigin||r)(`cdkConnectedOverlayPositions`,i._positions)(`cdkConnectedOverlayWidth`,i._overlayWidth)(`cdkConnectedOverlayFlexibleDimensions`,!0)(`cdkConnectedOverlayUsePopover`,i._popoverLocation)}},dependencies:[Kt,Sn$1],styles:[`@keyframes _mat-select-enter {
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
`],encapsulation:2})}return a})();var xi=(()=>{class a{static ɵfac=function(t){return new(t||a)};static ɵdir=ct$1({type:a,selectors:[[`mat-select-trigger`]],features:[ly([{provide:vi,useExisting:a}])]})}return a})();var Si=(()=>{class a{static ɵfac=function(t){return new(t||a)};static ɵmod=wt({type:a});static ɵinj=Xe({imports:[wn$1,mt,sD,Wt,me$1,mt]})}return a})();var nn=[`knob`];var an=[`valueIndicatorContainer`];function rn(a,n){if(a&1&&(Ra(0,`div`,2,1)(2,`div`,5)(3,`span`,6),wT(4),Hd()()()),a&2){let e=Kb();jC(4),ty(e.valueIndicatorText)}}var sn=[`trackActive`];var on=[`*`];function ln(a,n){if(a&1&&Wa(0,`div`),a&2){let e=n.$implicit,t=n.$index,i=Kb(3);Kd(e===0?`mdc-slider__tick-mark--active`:`mdc-slider__tick-mark--inactive`),Yv(`transform`,i._calcTickMarkTransform(t))}}function dn(a,n){if(a&1&&Hb(0,ln,1,4,`div`,8,Bb),a&2)$b(Kb(2)._tickMarks)}function cn(a,n){if(a&1&&(Ra(0,`div`,6,1),jb(2,dn,2,0),Hd()),a&2){let e=Kb();jC(2),Ub(e._cachedWidth?2:-1)}}function mn(a,n){if(a&1&&Wa(0,`mat-slider-visual-thumb`,7),a&2){let e=Kb();Lv(`discrete`,e.discrete)(`thumbPosition`,1)(`valueIndicatorText`,e.startValueIndicatorText)}}var p=(function(a){return a[a.START=1]=`START`,a[a.END=2]=`END`,a})(p||{});var Ce=(function(a){return a[a.ACTIVE=0]=`ACTIVE`,a[a.INACTIVE=1]=`INACTIVE`,a})(Ce||{});var ht=new y(`_MatSlider`);var ki=new y(`_MatSliderThumb`);var pn=new y(`_MatSliderRangeThumb`);var Mi=new y(`_MatSliderVisualThumb`);var hn=(()=>{class a{_cdr=p$1($r);_ngZone=p$1(le);_slider=p$1(ht);_renderer=p$1(Qn);_listenerCleanups;discrete=!1;thumbPosition;valueIndicatorText;_ripple;_knob;_valueIndicatorContainer;_sliderInput;_sliderInputEl;_hoverRippleRef;_focusRippleRef;_activeRippleRef;_isHovered=!1;_isActive=!1;_isValueIndicatorVisible=!1;_hostElement=p$1(st).nativeElement;_platform=p$1(l);ngAfterViewInit(){let e=this._slider._getInput(this.thumbPosition);e&&(this._ripple.radius=24,this._sliderInput=e,this._sliderInputEl=this._sliderInput._hostElement,this._ngZone.runOutsideAngular(()=>{let t=this._sliderInputEl,i=this._renderer;this._listenerCleanups=[i.listen(t,`pointermove`,this._onPointerMove),i.listen(t,`pointerdown`,this._onDragStart),i.listen(t,`pointerup`,this._onDragEnd),i.listen(t,`pointerleave`,this._onMouseLeave),i.listen(t,`focus`,this._onFocus),i.listen(t,`blur`,this._onBlur)]}))}ngOnDestroy(){this._listenerCleanups?.forEach(e=>e())}_onPointerMove=e=>{if(this._sliderInput._isFocused)return;let t=this._hostElement.getBoundingClientRect(),i=this._slider._isCursorOnSliderThumb(e,t);this._isHovered=i,i?this._showHoverRipple():this._hideRipple(this._hoverRippleRef)};_onMouseLeave=()=>{this._isHovered=!1,this._hideRipple(this._hoverRippleRef)};_onFocus=()=>{this._hideRipple(this._hoverRippleRef),this._showFocusRipple(),this._hostElement.classList.add(`mdc-slider__thumb--focused`)};_onBlur=()=>{this._isActive||this._hideRipple(this._focusRippleRef),this._isHovered&&this._showHoverRipple(),this._hostElement.classList.remove(`mdc-slider__thumb--focused`)};_onDragStart=e=>{e.button===0&&(this._isActive=!0,this._showActiveRipple())};_onDragEnd=()=>{this._isActive=!1,this._hideRipple(this._activeRippleRef),this._sliderInput._isFocused||this._hideRipple(this._focusRippleRef),this._platform.SAFARI&&this._showHoverRipple()};_showHoverRipple(){this._isShowingRipple(this._hoverRippleRef)||(this._hoverRippleRef=this._showRipple({enterDuration:0,exitDuration:0}),this._hoverRippleRef?.element.classList.add(`mat-mdc-slider-hover-ripple`))}_showFocusRipple(){this._isShowingRipple(this._focusRippleRef)||(this._focusRippleRef=this._showRipple({enterDuration:0,exitDuration:0},!0),this._focusRippleRef?.element.classList.add(`mat-mdc-slider-focus-ripple`))}_showActiveRipple(){this._isShowingRipple(this._activeRippleRef)||(this._activeRippleRef=this._showRipple({enterDuration:225,exitDuration:400}),this._activeRippleRef?.element.classList.add(`mat-mdc-slider-active-ripple`))}_isShowingRipple(e){return e?.state===E.FADING_IN||e?.state===E.VISIBLE}_showRipple(e,t){if(!this._slider.disabled&&(this._showValueIndicator(),this._slider._isRange&&this._slider._getThumb(this.thumbPosition===p.START?p.END:p.START)._showValueIndicator(),!(this._slider._globalRippleOptions?.disabled&&!t)))return this._ripple.launch({animation:this._slider._noopAnimations?{enterDuration:0,exitDuration:0}:e,centered:!0,persistent:!0})}_hideRipple(e){if(e?.fadeOut(),this._isShowingAnyRipple())return;this._slider._isRange||this._hideValueIndicator();let t=this._getSibling();t._isShowingAnyRipple()||(this._hideValueIndicator(),t._hideValueIndicator())}_showValueIndicator(){this._hostElement.classList.add(`mdc-slider__thumb--with-indicator`)}_hideValueIndicator(){this._hostElement.classList.remove(`mdc-slider__thumb--with-indicator`)}_getSibling(){return this._slider._getThumb(this.thumbPosition===p.START?p.END:p.START)}_getValueIndicatorContainer(){return this._valueIndicatorContainer?.nativeElement}_getKnob(){return this._knob.nativeElement}_isShowingAnyRipple(){return this._isShowingRipple(this._hoverRippleRef)||this._isShowingRipple(this._focusRippleRef)||this._isShowingRipple(this._activeRippleRef)}static ɵfac=function(t){return new(t||a)};static ɵcmp=nr({type:a,selectors:[[`mat-slider-visual-thumb`]],viewQuery:function(t,i){if(t&1&&zv(An,5)(nn,5)(an,5),t&2){let r;Yd(r=Qd())&&(i._ripple=r.first),Yd(r=Qd())&&(i._knob=r.first),Yd(r=Qd())&&(i._valueIndicatorContainer=r.first)}},hostAttrs:[1,`mdc-slider__thumb`,`mat-mdc-slider-visual-thumb`],inputs:{discrete:`discrete`,thumbPosition:`thumbPosition`,valueIndicatorText:`valueIndicatorText`},features:[ly([{provide:Mi,useExisting:a}])],decls:4,vars:2,consts:[[`knob`,``],[`valueIndicatorContainer`,``],[1,`mdc-slider__value-indicator-container`],[1,`mdc-slider__thumb-knob`],[`matRipple`,``,1,`mat-focus-indicator`,3,`matRippleDisabled`],[1,`mdc-slider__value-indicator`],[1,`mdc-slider__value-indicator-text`]],template:function(t,i){t&1&&(jb(0,rn,5,1,`div`,2),Wa(1,`div`,3,0)(3,`div`,4)),t&2&&(Ub(i.discrete?0:-1),jC(3),Lv(`matRippleDisabled`,!0))},dependencies:[An],styles:[`.mat-mdc-slider-visual-thumb .mat-ripple {
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
`],encapsulation:2})}return a})();var Ci=(()=>{class a{_ngZone=p$1(le);_cdr=p$1($r);_elementRef=p$1(st);_dir=p$1(kM,{optional:!0});_globalRippleOptions=p$1(Lt,{optional:!0});_trackActive;_thumbs;_input;_inputs;get disabled(){return this._disabled}set disabled(e){this._disabled=e;let t=this._getInput(p.END),i=this._getInput(p.START);t&&(t.disabled=this._disabled),i&&(i.disabled=this._disabled)}_disabled=!1;get discrete(){return this._discrete}set discrete(e){this._discrete=e,this._updateValueIndicatorUIs()}_discrete=!1;get showTickMarks(){return this._showTickMarks}set showTickMarks(e){this._showTickMarks=e,this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI())}_showTickMarks=!1;get min(){return this._min}set min(e){let t=e==null||isNaN(e)?this._min:e;this._min!==t&&this._updateMin(t)}_min=0;color;disableRipple=!1;_updateMin(e){let t=this._min;this._min=e,this._isRange?this._updateMinRange({old:t,new:e}):this._updateMinNonRange(e),this._onMinMaxOrStepChange()}_updateMinRange(e){let t=this._getInput(p.END),i=this._getInput(p.START),r=t.value,m=i.value;i.min=e.new,t.min=Math.max(e.new,i.value),i.max=Math.min(t.max,t.value),i._updateWidthInactive(),t._updateWidthInactive(),e.new<e.old?this._onTranslateXChangeBySideEffect(t,i):this._onTranslateXChangeBySideEffect(i,t),r!==t.value&&this._onValueChange(t),m!==i.value&&this._onValueChange(i)}_updateMinNonRange(e){let t=this._getInput(p.END);if(t){let i=t.value;t.min=e,t._updateThumbUIByValue(),this._updateTrackUI(t),i!==t.value&&this._onValueChange(t)}}get max(){return this._max}set max(e){let t=e==null||isNaN(e)?this._max:e;this._max!==t&&this._updateMax(t)}_max=100;_updateMax(e){let t=this._max;this._max=e,this._isRange?this._updateMaxRange({old:t,new:e}):this._updateMaxNonRange(e),this._onMinMaxOrStepChange()}_updateMaxRange(e){let t=this._getInput(p.END),i=this._getInput(p.START),r=t.value,m=i.value;t.max=e.new,i.max=Math.min(e.new,t.value),t.min=i.value,t._updateWidthInactive(),i._updateWidthInactive(),e.new>e.old?this._onTranslateXChangeBySideEffect(i,t):this._onTranslateXChangeBySideEffect(t,i),r!==t.value&&this._onValueChange(t),m!==i.value&&this._onValueChange(i)}_updateMaxNonRange(e){let t=this._getInput(p.END);if(t){let i=t.value;t.max=e,t._updateThumbUIByValue(),this._updateTrackUI(t),i!==t.value&&this._onValueChange(t)}}get step(){return this._step}set step(e){let t=isNaN(e)?this._step:e;this._step!==t&&this._updateStep(t)}_step=1;_updateStep(e){this._step=e,this._isRange?this._updateStepRange():this._updateStepNonRange(),this._onMinMaxOrStepChange()}_updateStepRange(){let e=this._getInput(p.END),t=this._getInput(p.START),i=e.value,r=t.value,m=t.value;e.min=this._min,t.max=this._max,e.step=this._step,t.step=this._step,this._platform.SAFARI&&(e.value=e.value,t.value=t.value),e.min=Math.max(this._min,t.value),t.max=Math.min(this._max,e.value),t._updateWidthInactive(),e._updateWidthInactive(),e.value<m?this._onTranslateXChangeBySideEffect(t,e):this._onTranslateXChangeBySideEffect(e,t),i!==e.value&&this._onValueChange(e),r!==t.value&&this._onValueChange(t)}_updateStepNonRange(){let e=this._getInput(p.END);if(e){let t=e.value;e.step=this._step,this._platform.SAFARI&&(e.value=e.value),e._updateThumbUIByValue(),t!==e.value&&this._onValueChange(e)}}displayWith=e=>`${e}`;_tickMarks;_noopAnimations=ji$1();_resizeObserver=null;_cachedWidth;_cachedLeft;_rippleRadius=24;startValueIndicatorText=``;endValueIndicatorText=``;_endThumbTransform;_startThumbTransform;_isRange=!1;_isRtl=mi(()=>this._dir?.valueSignal()===`rtl`);_hasViewInitialized=!1;_tickMarkTrackWidth=0;_hasAnimation=!1;_resizeTimer=null;_platform=p$1(l);constructor(){p$1(MM).load(ke);let e=this._isRtl();PH(()=>{let t=this._isRtl();t!==e&&(e=t,this._isRange?this._onDirChangeRange():this._onDirChangeNonRange(),this._updateTickMarkUI())})}_knobRadius=8;_inputPadding;ngAfterViewInit(){this._platform.isBrowser&&this._updateDimensions();let e=this._getInput(p.END),t=this._getInput(p.START);this._isRange=!!e&&!!t,this._cdr.detectChanges();let i=this._getThumb(p.END);this._rippleRadius=i._ripple.radius,this._inputPadding=this._rippleRadius-this._knobRadius,this._isRange?this._initUIRange(e,t):this._initUINonRange(e),this._updateTrackUI(e),this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._observeHostResize(),this._cdr.detectChanges()}_initUINonRange(e){e.initProps(),e.initUI(),this._updateValueIndicatorUI(e),this._hasViewInitialized=!0,e._updateThumbUIByValue()}_initUIRange(e,t){e.initProps(),e.initUI(),t.initProps(),t.initUI(),e._updateMinMax(),t._updateMinMax(),e._updateStaticStyles(),t._updateStaticStyles(),this._updateValueIndicatorUIs(),this._hasViewInitialized=!0,e._updateThumbUIByValue(),t._updateThumbUIByValue()}ngOnDestroy(){this._resizeObserver?.disconnect(),this._resizeObserver=null}_onDirChangeRange(){let e=this._getInput(p.END),t=this._getInput(p.START);e._setIsLeftThumb(),t._setIsLeftThumb(),e.translateX=e._calcTranslateXByValue(),t.translateX=t._calcTranslateXByValue(),e._updateStaticStyles(),t._updateStaticStyles(),e._updateWidthInactive(),t._updateWidthInactive(),e._updateThumbUIByValue(),t._updateThumbUIByValue()}_onDirChangeNonRange(){this._getInput(p.END)._updateThumbUIByValue()}_observeHostResize(){typeof ResizeObserver>`u`||!ResizeObserver||this._ngZone.runOutsideAngular(()=>{this._resizeObserver=new ResizeObserver(()=>{this._isActive()||(this._resizeTimer&&clearTimeout(this._resizeTimer),this._onResize())}),this._resizeObserver.observe(this._elementRef.nativeElement)})}_isActive(){return this._getThumb(p.START)._isActive||this._getThumb(p.END)._isActive}_getValue(e=p.END){let t=this._getInput(e);return t?t.value:this.min}_skipUpdate(){return!!(this._getInput(p.START)?._skipUIUpdate||this._getInput(p.END)?._skipUIUpdate)}_updateDimensions(){this._cachedWidth=this._elementRef.nativeElement.offsetWidth,this._cachedLeft=this._elementRef.nativeElement.getBoundingClientRect().left}_setTrackActiveStyles(e){let t=this._trackActive.nativeElement.style;t.left=e.left,t.right=e.right,t.transformOrigin=e.transformOrigin,t.transform=e.transform}_calcTickMarkTransform(e){let t=e*(this._tickMarkTrackWidth/(this._tickMarks.length-1));return`translateX(${this._isRtl()?this._cachedWidth-6-t:t}px)`}_onTranslateXChange(e){this._hasViewInitialized&&(this._updateThumbUI(e),this._updateTrackUI(e),this._updateOverlappingThumbUI(e))}_onTranslateXChangeBySideEffect(e,t){this._hasViewInitialized&&(e._updateThumbUIByValue(),t._updateThumbUIByValue())}_onValueChange(e){this._hasViewInitialized&&(this._updateValueIndicatorUI(e),this._updateTickMarkUI(),this._cdr.detectChanges())}_onMinMaxOrStepChange(){this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.markForCheck())}_onResize(){if(this._hasViewInitialized){if(this._updateDimensions(),this._isRange){let e=this._getInput(p.END),t=this._getInput(p.START);e._updateThumbUIByValue(),t._updateThumbUIByValue(),e._updateStaticStyles(),t._updateStaticStyles(),e._updateMinMax(),t._updateMinMax(),e._updateWidthInactive(),t._updateWidthInactive()}else{let e=this._getInput(p.END);e&&e._updateThumbUIByValue()}this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.detectChanges()}}_thumbsOverlap=!1;_areThumbsOverlapping(){let e=this._getInput(p.START),t=this._getInput(p.END);return!e||!t?!1:t.translateX-e.translateX<20}_updateOverlappingThumbClassNames(e){let t=e.getSibling(),i=this._getThumb(e.thumbPosition);this._getThumb(t.thumbPosition)._hostElement.classList.remove(`mdc-slider__thumb--top`),i._hostElement.classList.toggle(`mdc-slider__thumb--top`,this._thumbsOverlap)}_updateOverlappingThumbUI(e){!this._isRange||this._skipUpdate()||this._thumbsOverlap!==this._areThumbsOverlapping()&&(this._thumbsOverlap=!this._thumbsOverlap,this._updateOverlappingThumbClassNames(e))}_updateThumbUI(e){if(this._skipUpdate())return;let t=this._getThumb(e.thumbPosition===p.END?p.END:p.START);t._hostElement.style.transform=`translateX(${e.translateX}px)`}_updateValueIndicatorUI(e){if(this._skipUpdate())return;let t=this.displayWith(e.value);if(this._hasViewInitialized?e._valuetext.set(t):e._hostElement.setAttribute(`aria-valuetext`,t),this.discrete){e.thumbPosition===p.START?this.startValueIndicatorText=t:this.endValueIndicatorText=t;let i=this._getThumb(e.thumbPosition);t.length<3?i._hostElement.classList.add(`mdc-slider__thumb--short-value`):i._hostElement.classList.remove(`mdc-slider__thumb--short-value`)}}_updateValueIndicatorUIs(){let e=this._getInput(p.END),t=this._getInput(p.START);e&&this._updateValueIndicatorUI(e),t&&this._updateValueIndicatorUI(t)}_updateTickMarkTrackUI(){if(!this.showTickMarks||this._skipUpdate())return;let e=this._step&&this._step>0?this._step:1,i=(Math.floor(this.max/e)*e-this.min)/(this.max-this.min);this._tickMarkTrackWidth=(this._cachedWidth-6)*i}_updateTrackUI(e){this._skipUpdate()||(this._isRange?this._updateTrackUIRange(e):this._updateTrackUINonRange(e))}_updateTrackUIRange(e){let t=e.getSibling();if(!t||!this._cachedWidth)return;let i=Math.abs(t.translateX-e.translateX)/this._cachedWidth;e._isLeftThumb&&this._cachedWidth?this._setTrackActiveStyles({left:`auto`,right:`${this._cachedWidth-t.translateX}px`,transformOrigin:`right`,transform:`scaleX(${i})`}):this._setTrackActiveStyles({left:`${t.translateX}px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${i})`})}_updateTrackUINonRange(e){this._isRtl()?this._setTrackActiveStyles({left:`auto`,right:`0px`,transformOrigin:`right`,transform:`scaleX(${1-e.fillPercentage})`}):this._setTrackActiveStyles({left:`0px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${e.fillPercentage})`})}_updateTickMarkUI(){if(!this.showTickMarks||this.step===void 0||this.min===void 0||this.max===void 0)return;let e=this.step>0?this.step:1;this._isRange?this._updateTickMarkUIRange(e):this._updateTickMarkUINonRange(e)}_updateTickMarkUINonRange(e){let t=this._getValue(),i=Math.max(Math.round((t-this.min)/e),0)+1,r=Math.max(Math.round((this.max-t)/e),0)-1;this._isRtl()?i++:r++,this._tickMarks=Array(i).fill(Ce.ACTIVE).concat(Array(r).fill(Ce.INACTIVE))}_updateTickMarkUIRange(e){let t=this._getValue(),i=this._getValue(p.START),r=Math.max(Math.round((i-this.min)/e),0),m=Math.max(Math.round((t-i)/e)+1,0),h=Math.max(Math.round((this.max-t)/e),0);this._tickMarks=Array(r).fill(Ce.INACTIVE).concat(Array(m).fill(Ce.ACTIVE),Array(h).fill(Ce.INACTIVE))}_getInput(e){if(e===p.END&&this._input)return this._input;if(this._inputs?.length)return e===p.START?this._inputs.first:this._inputs.last}_getThumb(e){return e===p.END?this._thumbs?.last:this._thumbs?.first}_setTransition(e){this._hasAnimation=!this._platform.IOS&&e&&!this._noopAnimations,this._elementRef.nativeElement.classList.toggle(`mat-mdc-slider-with-animation`,this._hasAnimation)}_isCursorOnSliderThumb(e,t){let i=t.width/2,r=t.x+i,m=t.y+i,h=e.clientX-r,g=e.clientY-m;return Math.pow(h,2)+Math.pow(g,2)<Math.pow(i,2)}static ɵfac=function(t){return new(t||a)};static ɵcmp=nr({type:a,selectors:[[`mat-slider`]],contentQueries:function(t,i,r){if(t&1&&Za(r,ki,5)(r,pn,4),t&2){let m;Yd(m=Qd())&&(i._input=m.first),Yd(m=Qd())&&(i._inputs=m)}},viewQuery:function(t,i){if(t&1&&zv(sn,5)(Mi,5),t&2){let r;Yd(r=Qd())&&(i._trackActive=r.first),Yd(r=Qd())&&(i._thumbs=r)}},hostAttrs:[1,`mat-mdc-slider`,`mdc-slider`],hostVars:12,hostBindings:function(t,i){t&2&&(Kd(`mat-`+(i.color||`primary`)),Ya(`mdc-slider--range`,i._isRange)(`mdc-slider--disabled`,i.disabled)(`mdc-slider--discrete`,i.discrete)(`mdc-slider--tick-marks`,i.showTickMarks)(`_mat-animation-noopable`,i._noopAnimations))},inputs:{disabled:[2,`disabled`,`disabled`,zr],discrete:[2,`discrete`,`discrete`,zr],showTickMarks:[2,`showTickMarks`,`showTickMarks`,zr],min:[2,`min`,`min`,kH],color:`color`,disableRipple:[2,`disableRipple`,`disableRipple`,zr],max:[2,`max`,`max`,kH],step:[2,`step`,`step`,kH],displayWith:`displayWith`},exportAs:[`matSlider`],features:[ly([{provide:ht,useExisting:a}])],ngContentSelectors:on,decls:9,vars:5,consts:[[`trackActive`,``],[`tickMarkContainer`,``],[1,`mdc-slider__track`],[1,`mdc-slider__track--inactive`],[1,`mdc-slider__track--active`],[1,`mdc-slider__track--active_fill`],[1,`mdc-slider__tick-marks`],[3,`discrete`,`thumbPosition`,`valueIndicatorText`],[3,`class`,`transform`]],template:function(t,i){t&1&&(qd(),Zd(0),Ra(1,`div`,2),Wa(2,`div`,3),Ra(3,`div`,4),Wa(4,`div`,5,0),Hd(),jb(6,cn,3,1,`div`,6),Hd(),jb(7,mn,1,3,`mat-slider-visual-thumb`,7),Wa(8,`mat-slider-visual-thumb`,7)),t&2&&(jC(6),Ub(i.showTickMarks?6:-1),jC(),Ub(i._isRange?7:-1),jC(),Lv(`discrete`,i.discrete)(`thumbPosition`,2)(`valueIndicatorText`,i.endValueIndicatorText))},dependencies:[hn],styles:[`.mdc-slider__track {
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
`],encapsulation:2})}return a})();var un={provide:B,useExisting:Ns(()=>ut),multi:!0};var ut=(()=>{class a{_ngZone=p$1(le);_elementRef=p$1(st);_cdr=p$1($r);_slider=p$1(ht);_platform=p$1(l);_listenerCleanups;get value(){return kH(this._hostElement.value,0)}set value(e){e===null&&(e=this._getDefaultValue()),e=isNaN(e)?0:e;let t=e+``;if(!this._hasSetInitialValue){this._initialValue=t;return}this._isActive||this._setValue(t)}_setValue(e){this._hostElement.value=e,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges(),this._slider._cdr.markForCheck()}valueChange=new ue;dragStart=new ue;dragEnd=new ue;get translateX(){return this._slider.min>=this._slider.max?(this._translateX=this._tickMarkOffset,this._translateX):(this._translateX===void 0&&(this._translateX=this._calcTranslateXByValue()),this._translateX)}set translateX(e){this._translateX=e}_translateX;thumbPosition=p.END;get min(){return kH(this._hostElement.min,0)}set min(e){this._hostElement.min=e+``,this._cdr.detectChanges()}get max(){return kH(this._hostElement.max,0)}set max(e){this._hostElement.max=e+``,this._cdr.detectChanges()}get step(){return kH(this._hostElement.step,0)}set step(e){this._hostElement.step=e+``,this._cdr.detectChanges()}get disabled(){return zr(this._hostElement.disabled)}set disabled(e){this._hostElement.disabled=e,this._cdr.detectChanges(),this._slider.disabled!==this.disabled&&(this._slider.disabled=this.disabled)}get percentage(){return this._slider.min>=this._slider.max?this._slider._isRtl()?1:0:(this.value-this._slider.min)/(this._slider.max-this._slider.min)}get fillPercentage(){return this._slider._cachedWidth?this._translateX===0?0:this.translateX/this._slider._cachedWidth:this._slider._isRtl()?1:0}_hostElement=this._elementRef.nativeElement;_valuetext=K(``);_knobRadius=8;_tickMarkOffset=3;_isActive=!1;_isFocused=!1;_setIsFocused(e){this._isFocused=e}_hasSetInitialValue=!1;_initialValue;_formControl;_destroyed=new Y;_skipUIUpdate=!1;_onChangeFn;_onTouchedFn=()=>{};_isControlInitialized=!1;constructor(){let e=p$1(Qn);this._ngZone.runOutsideAngular(()=>{this._listenerCleanups=[e.listen(this._hostElement,`pointerdown`,this._onPointerDown.bind(this)),e.listen(this._hostElement,`pointermove`,this._onPointerMove.bind(this)),e.listen(this._hostElement,`pointerup`,this._onPointerUp.bind(this))]})}ngOnDestroy(){this._listenerCleanups.forEach(e=>e()),this._destroyed.next(),this._destroyed.complete(),this.dragStart.complete(),this.dragEnd.complete()}initProps(){this._updateWidthInactive(),this.disabled!==this._slider.disabled&&(this._slider.disabled=!0),this.step=this._slider.step,this.min=this._slider.min,this.max=this._slider.max,this._initValue()}initUI(){this._updateThumbUIByValue()}_initValue(){this._hasSetInitialValue=!0,this._initialValue===void 0?this.value=this._getDefaultValue():(this._hostElement.value=this._initialValue,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges())}_getDefaultValue(){return this.min}_onBlur(){this._setIsFocused(!1),this._onTouchedFn()}_onFocus(){this._slider._setTransition(!1),this._slider._updateTrackUI(this),this._setIsFocused(!0)}_onChange(){this.valueChange.emit(this.value),this._isActive&&this._updateThumbUIByValue({withAnimation:!0})}_onInput(){this._onChangeFn?.(this.value),(this._slider.step||!this._isActive)&&this._updateThumbUIByValue({withAnimation:!0}),this._slider._onValueChange(this)}_onNgControlValueChange(){(!this._isActive||!this._isFocused)&&(this._slider._onValueChange(this),this._updateThumbUIByValue()),this._slider.disabled=this._formControl.disabled}_onPointerDown(e){if(!(this.disabled||e.button!==0)){if(this._platform.IOS){let t=this._slider._isCursorOnSliderThumb(e,this._slider._getThumb(this.thumbPosition)._hostElement.getBoundingClientRect());this._isActive=t,this._updateWidthActive(),this._slider._updateDimensions();return}this._isActive=!0,this._setIsFocused(!0),this._updateWidthActive(),this._slider._updateDimensions(),this._slider.step||this._updateThumbUIByPointerEvent(e,{withAnimation:!0}),this.disabled||(this._handleValueCorrection(e),this.dragStart.emit({source:this,parent:this._slider,value:this.value}))}}_handleValueCorrection(e){this._skipUIUpdate=!0,setTimeout(()=>{this._skipUIUpdate=!1,this._fixValue(e)},0)}_fixValue(e){let t=e.clientX-this._slider._cachedLeft,i=this._slider._cachedWidth,r=this._slider.step===0?1:this._slider.step,m=Math.floor((this._slider.max-this._slider.min)/r),h=this._slider._isRtl()?1-t/i:t/i,z=Math.round(h*m)/m*(this._slider.max-this._slider.min)+this._slider.min,w=Math.round(z/r)*r;if(w===this.value){this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(e,{withAnimation:this._slider._hasAnimation});return}this.value=w,this.valueChange.emit(this.value),this._onChangeFn?.(this.value),this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(e,{withAnimation:this._slider._hasAnimation})}_onPointerMove(e){!this._slider.step&&this._isActive&&this._updateThumbUIByPointerEvent(e)}_onPointerUp(){this._isActive&&(this._isActive=!1,this._platform.SAFARI&&this._setIsFocused(!1),this.dragEnd.emit({source:this,parent:this._slider,value:this.value}),setTimeout(()=>this._updateWidthInactive(),this._platform.IOS?10:0))}_clamp(e){let t=this._tickMarkOffset,i=this._slider._cachedWidth-this._tickMarkOffset;return Math.max(Math.min(e,i),t)}_calcTranslateXByValue(){return this._slider._isRtl()?(1-this.percentage)*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset:this.percentage*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset}_calcTranslateXByPointerEvent(e){return e.clientX-this._slider._cachedLeft}_updateWidthActive(){}_updateWidthInactive(){this._hostElement.style.padding=`0 ${this._slider._inputPadding}px`,this._hostElement.style.width=`calc(100% + ${this._slider._inputPadding-this._tickMarkOffset*2}px)`,this._hostElement.style.left=`-${this._slider._rippleRadius-this._tickMarkOffset}px`}_updateThumbUIByValue(e){this.translateX=this._clamp(this._calcTranslateXByValue()),this._updateThumbUI(e)}_updateThumbUIByPointerEvent(e,t){this.translateX=this._clamp(this._calcTranslateXByPointerEvent(e)),this._updateThumbUI(t)}_updateThumbUI(e){this._slider._setTransition(!!e?.withAnimation),this._slider._onTranslateXChange(this)}writeValue(e){(this._isControlInitialized||e!==null)&&(this.value=e)}registerOnChange(e){this._onChangeFn=e,this._isControlInitialized=!0}registerOnTouched(e){this._onTouchedFn=e}setDisabledState(e){this.disabled=e}focus(){this._hostElement.focus()}blur(){this._hostElement.blur()}static ɵfac=function(t){return new(t||a)};static ɵdir=ct$1({type:a,selectors:[[`input`,`matSliderThumb`,``]],hostAttrs:[`type`,`range`,1,`mdc-slider__input`],hostVars:1,hostBindings:function(t,i){t&1&&qa(`change`,function(){return i._onChange()})(`input`,function(){return i._onInput()})(`blur`,function(){return i._onBlur()})(`focus`,function(){return i._onFocus()}),t&2&&rr(`aria-valuetext`,i._valuetext())},inputs:{value:[2,`value`,`value`,kH]},outputs:{valueChange:`valueChange`,dragStart:`dragStart`,dragEnd:`dragEnd`},exportAs:[`matSliderThumb`],features:[ly([un,{provide:ki,useExisting:a}])]})}return a})();var wi=(()=>{class a{static ɵfac=function(t){return new(t||a)};static ɵmod=wt({type:a});static ɵinj=Xe({imports:[Ee,sD]})}return a})();var Ti=`gameroster:paddle-players`;var Ii=`gameroster:paddle-debts`;var Ei=`gameroster:paddle-win-value`;var $e=2.5;var ie=class a{defaultWinValue=$e;winValue=K(this.loadWinValue());players=K(this.loadPlayers());debtEntries=K(this.loadDebtEntries());addPlayer(n){let e=n.trim();e&&(this.players.update(t=>[...t,{id:crypto.randomUUID(),name:e,wins:0,losses:0,balance:0}]),this.persist())}removePlayer(n){this.players.update(e=>e.filter(t=>t.id!==n)),this.persist()}recordWin(n){this.updatePlayer(n,e=>L(m({},e),{wins:e.wins+1,balance:e.balance+this.winValue()}))}recordLoss(n){this.updatePlayer(n,e=>L(m({},e),{losses:e.losses+1,balance:e.balance-this.winValue()}))}setWinValue(n){if(!Number.isFinite(n)||n<=0)return;let e=Math.round(n*100)/100;this.winValue.set(e);try{localStorage.setItem(Ei,String(e))}catch{}}addDebtEntry(n,e,t=1){let i=[...new Set(n)],r=[...new Set(e)],m$1=new Set([...i,...r]),h=Number.isInteger(t)&&t>0?t:1,g=this.winValue();i.length===0||r.length===0||m$1.size<2||m$1.size>4||(this.players.update(z=>z.map(w=>{let ne=i.includes(w.id)?h:0,A=r.includes(w.id)?h:0;return ne||A?L(m({},w),{wins:w.wins+ne,losses:w.losses+A,balance:w.balance+(ne-A)*g}):w})),this.debtEntries.update(z=>[...z,{id:crypto.randomUUID(),winnerIds:i,loserIds:r,rounds:h,winValue:g}]),this.persist(),this.persistDebtEntries())}endGame(){this.players.set([]),this.debtEntries.set([]),this.persist(),this.persistDebtEntries()}updatePlayer(n,e){this.players.update(t=>t.map(i=>i.id===n?e(i):i)),this.persist()}persist(){try{localStorage.setItem(Ti,JSON.stringify(this.players()))}catch{}}persistDebtEntries(){try{localStorage.setItem(Ii,JSON.stringify(this.debtEntries()))}catch{}}loadPlayers(){try{let n=localStorage.getItem(Ti);if(!n)return[];let e=JSON.parse(n);return Array.isArray(e)?e:[]}catch{return[]}}loadDebtEntries(){try{let n=localStorage.getItem(Ii);if(!n)return[];let e=JSON.parse(n);return Array.isArray(e)?e:[]}catch{return[]}}loadWinValue(){try{let n=localStorage.getItem(Ei);if(!n)return $e;let e=Number(n);return Number.isFinite(e)&&e>0?e:$e}catch{return $e}}static ɵfac=function(e){return new(e||a)};static ɵprov=R({token:a,factory:a.ɵfac,providedIn:`root`})};var Ni=(a,n)=>n.id;function gn(a,n){if(a&1&&(Ra(0,`mat-option`,14),wT(1),Hd()),a&2){let e=n.$implicit,t=Kb();Lv(`value`,e.id)(`disabled`,t.isOptionDisabled(e.id,`winner`)),jC(),Xd(` `,e.name,` `)}}function fn(a,n){if(a&1&&(Ra(0,`mat-option`,14),wT(1),Hd()),a&2){let e=n.$implicit,t=Kb();Lv(`value`,e.id)(`disabled`,t.isOptionDisabled(e.id,`loser`)),jC(),Xd(` `,e.name,` `)}}var Ye=class a{dialogRef=p$1(T);paddle=p$1(ie);players=mi(()=>this.paddle.players());winners=[];losers=[];rounds=1;get participantCount(){return this.winners.length+this.losers.length}get isValid(){return this.winners.length>0&&this.losers.length>0&&this.participantCount>=2&&Number.isInteger(this.rounds)&&this.rounds>=1}selectedPlayerNames(n){return n.map(e=>this.players().find(t=>t.id===e)?.name).filter(e=>!!e).join(`, `)}isOptionDisabled(n,e){let t=e===`winner`?this.losers:this.winners,i=e===`winner`?this.winners:this.losers;return t.includes(n)||!i.includes(n)&&this.participantCount>=4}cancel(){this.dialogRef.close()}add(){this.isValid&&this.dialogRef.close({winnerIds:this.winners,loserIds:this.losers,rounds:this.rounds})}static ɵfac=function(e){return new(e||a)};static ɵcmp=nr({type:a,selectors:[[`app-paddle-add-debt-dialog`]],decls:72,vars:11,consts:[[`mat-dialog-title`,``,1,`dialog-title`],[`aria-hidden`,`true`,1,`dialog-title-icon`],[1,`dialog-kicker`],[1,`dialog-title-text`],[1,`dialog-intro`],[1,`team-grid`],[1,`team-card`,`team-card--winners`],[1,`team-card-heading`],[`aria-hidden`,`true`,1,`team-indicator`],[1,`team-label`],[1,`team-count`],[`appearance`,`outline`,1,`team-field`],[`multiple`,``,3,`ngModelChange`,`ngModel`,`disableRipple`],[1,`selected-names`],[3,`value`,`disabled`],[`aria-hidden`,`true`,1,`versus`],[1,`team-card`,`team-card--losers`],[1,`rounds-control`],[1,`rounds-heading`],[1,`rounds-label`],[1,`rounds-hint`],[1,`rounds-slider-line`],[`aria-hidden`,`true`],[`min`,`1`,`max`,`15`,`step`,`1`,`showTickMarks`,``,`discrete`,``],[`matSliderThumb`,``,`aria-label`,`Anzahl gleicher Spiele`,3,`ngModelChange`,`ngModel`],[1,`rounds-value`],[`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`]],template:function(e,t){e&1&&(Ra(0,`h2`,0)(1,`span`,1)(2,`mat-icon`),wT(3,`swap_horiz`),Hd()(),Ra(4,`span`)(5,`span`,2),wT(6,`Paddle`),Hd(),Ra(7,`span`,3),wT(8,`Spiel eintragen`),Hd()()(),Ra(9,`mat-dialog-content`)(10,`p`,4),wT(11,`Teams auswählen und Ergebnis festhalten.`),Hd(),Ra(12,`div`,5)(13,`section`,6)(14,`div`,7)(15,`span`,8)(16,`mat-icon`),wT(17,`emoji_events`),Hd()(),Ra(18,`span`)(19,`span`,9),wT(20,`Gewinner`),Hd(),Ra(21,`span`,10),wT(22),Hd()()(),Ra(23,`mat-form-field`,11)(24,`mat-label`),wT(25,`Spieler auswählen`),Hd(),Ra(26,`mat-select`,12),iy(`ngModelChange`,function(r){return _T(t.winners,r)||(t.winners=r),r}),Ra(27,`mat-select-trigger`)(28,`span`,13),wT(29),Hd()(),Hb(30,gn,2,3,`mat-option`,14,Ni),Hd(),_S(),Hd()(),Ra(32,`div`,15),wT(33,`vs.`),Hd(),Ra(34,`section`,16)(35,`div`,7)(36,`span`,8)(37,`mat-icon`),wT(38,`flag`),Hd()(),Ra(39,`span`)(40,`span`,9),wT(41,`Verlierer`),Hd(),Ra(42,`span`,10),wT(43),Hd()()(),Ra(44,`mat-form-field`,11)(45,`mat-label`),wT(46,`Spieler auswählen`),Hd(),Ra(47,`mat-select`,12),iy(`ngModelChange`,function(r){return _T(t.losers,r)||(t.losers=r),r}),Ra(48,`mat-select-trigger`)(49,`span`,13),wT(50),Hd()(),Hb(51,fn,2,3,`mat-option`,14,Ni),Hd(),_S(),Hd()()(),Ra(53,`div`,17)(54,`div`,18)(55,`span`)(56,`span`,19),wT(57,`Anzahl gleicher Spiele`),Hd(),Ra(58,`span`,20),wT(59,`Mit den Pfeiltasten feinjustieren`),Hd()()(),Ra(60,`div`,21)(61,`mat-icon`,22),wT(62,`looks_one`),Hd(),Ra(63,`mat-slider`,23)(64,`input`,24),iy(`ngModelChange`,function(r){return _T(t.rounds,r)||(t.rounds=r),r}),Hd(),_S(),Hd(),Ra(65,`output`,25),wT(66),Hd()()()(),Ra(67,`mat-dialog-actions`,26)(68,`button`,27),qa(`click`,function(){return t.cancel()}),wT(69,`Abbrechen`),Hd(),Ra(70,`button`,28),qa(`click`,function(){return t.add()}),wT(71,` Eintrag speichern `),Hd()()),e&2&&(jC(22),Xd(``,t.winners.length,` ausgewählt`),jC(4),oy(`ngModel`,t.winners),Lv(`disableRipple`,!0),NS(),jC(3),ty(t.selectedPlayerNames(t.winners)||`Noch niemand`),jC(),$b(t.players()),jC(13),Xd(``,t.losers.length,` ausgewählt`),jC(4),oy(`ngModel`,t.losers),Lv(`disableRipple`,!0),NS(),jC(3),ty(t.selectedPlayerNames(t.losers)||`Noch niemand`),jC(),$b(t.players()),jC(13),oy(`ngModel`,t.rounds),NS(),jC(2),ty(t.rounds),jC(4),Lv(`disabled`,!t.isValid))},dependencies:[Py,Sn$2,Ue,En,Xt,hi$1,di,Ht,jt,zt,Vt,me$1,it,de,t8,e8,Si,yi,xi,Me,wi,Ci,ut],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:520px}.dialog-title[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px;margin-bottom:4px}.dialog-title-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light)}.dialog-title-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:22px;height:22px;font-size:22px}.dialog-kicker[_ngcontent-%COMP%], .dialog-title-text[_ngcontent-%COMP%], .team-label[_ngcontent-%COMP%], .team-count[_ngcontent-%COMP%], .rounds-label[_ngcontent-%COMP%], .rounds-hint[_ngcontent-%COMP%]{display:block}.dialog-kicker[_ngcontent-%COMP%]{margin-bottom:2px;color:var(--%NS%color-text-subtle);font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.dialog-title-text[_ngcontent-%COMP%]{font-size:22px;line-height:1.1}.dialog-intro[_ngcontent-%COMP%]{margin:0 0 20px;color:var(--%NS%color-text-muted);font-size:13px}.team-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px}.team-card[_ngcontent-%COMP%]{min-width:0;padding:14px;border:1px solid var(--%NS%color-white-10);border-radius:var(--%NS%radius-medium);background:var(--%NS%color-white-045)}.team-card--winners[_ngcontent-%COMP%]{border-color:var(--%NS%color-success-light-28)}.team-card--losers[_ngcontent-%COMP%]{border-color:var(--%NS%color-danger-light-28)}.team-card-heading[_ngcontent-%COMP%]{display:flex;align-items:center;gap:9px;margin-bottom:12px}.team-indicator[_ngcontent-%COMP%]{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border-radius:9px;background:var(--%NS%color-white-08)}.team-indicator[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:17px;height:17px;font-size:17px}.team-card--winners[_ngcontent-%COMP%]   .team-indicator[_ngcontent-%COMP%], .team-card--winners[_ngcontent-%COMP%]   .team-label[_ngcontent-%COMP%]{color:var(--%NS%color-success-light)}.team-card--losers[_ngcontent-%COMP%]   .team-indicator[_ngcontent-%COMP%], .team-card--losers[_ngcontent-%COMP%]   .team-label[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}.team-label[_ngcontent-%COMP%]{font-size:14px;font-weight:750}.team-count[_ngcontent-%COMP%]{margin-top:2px;color:var(--%NS%color-text-subtle);font-size:11px}.team-field[_ngcontent-%COMP%]{width:100%}.selected-names[_ngcontent-%COMP%]{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.team-card--winners[_ngcontent-%COMP%]   .team-field[_ngcontent-%COMP%]{--%NS%mdc-outlined-text-field-focus-outline-color: var(--%NS%color-success-light)}.team-card--losers[_ngcontent-%COMP%]   .team-field[_ngcontent-%COMP%]{--%NS%mdc-outlined-text-field-focus-outline-color: var(--%NS%color-danger-light)}.rounds-control[_ngcontent-%COMP%]{margin-top:22px;padding:12px 14px 8px;border:1px solid var(--%NS%color-white-10);border-radius:var(--%NS%radius-medium);background:var(--%NS%color-white-035)}.rounds-label[_ngcontent-%COMP%]{font-size:13px;font-weight:700}.rounds-hint[_ngcontent-%COMP%]{margin-top:2px;color:var(--%NS%color-text-subtle);font-size:11px}.rounds-slider-line[_ngcontent-%COMP%]{display:flex;align-items:center;gap:9px;margin-top:3px}.rounds-slider-line[_ngcontent-%COMP%] > mat-icon[_ngcontent-%COMP%]{flex:0 0 auto;width:18px;height:18px;color:var(--%NS%color-primary-light);font-size:18px}.rounds-slider-line[_ngcontent-%COMP%]   mat-slider[_ngcontent-%COMP%]{flex:1;min-width:0}.rounds-value[_ngcontent-%COMP%]{display:grid;place-items:center;flex:0 0 40px;width:40px;height:34px;border-radius:var(--%NS%radius-small);background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light);font-size:16px;font-weight:800}.versus[_ngcontent-%COMP%]{align-self:center;padding:7px 6px;border:1px solid var(--%NS%color-white-12);border-radius:var(--%NS%radius-pill);background:var(--%NS%color-surface);color:var(--%NS%color-text-subtle);font-size:12px;font-weight:700;text-transform:uppercase}[mat-dialog-actions][_ngcontent-%COMP%]{gap:10px;padding-top:8px}@media(max-width:520px){[_nghost-%COMP%]{max-width:100%}.team-grid[_ngcontent-%COMP%]{grid-template-columns:1fr}.versus[_ngcontent-%COMP%]{justify-self:center;margin:-3px 0}.rounds-slider-line[_ngcontent-%COMP%]{gap:6px}}`]})};var Ze=class a{dialogRef=p$1(T);paddle=p$1(ie);amountInput=this.paddle.winValue().toLocaleString(`de-DE`,{minimumFractionDigits:2,maximumFractionDigits:2});get parsedAmount(){return Number(this.amountInput.trim().replace(`,`,`.`))}get isValid(){return Number.isFinite(this.parsedAmount)&&this.parsedAmount>0}cancel(){this.dialogRef.close()}save(){this.isValid&&this.dialogRef.close(this.parsedAmount)}static ɵfac=function(e){return new(e||a)};static ɵcmp=nr({type:a,selectors:[[`app-paddle-set-value-dialog`]],decls:23,vars:2,consts:[[`mat-dialog-title`,``,1,`value-dialog-title`],[`aria-hidden`,`true`,1,`value-dialog-icon`],[1,`value-dialog-kicker`],[1,`value-dialog-heading`],[1,`value-dialog-intro`],[`appearance`,`outline`,1,`value-field`],[`matInput`,``,`type`,`text`,`inputmode`,`decimal`,`autocomplete`,`off`,`aria-describedby`,`value-hint`,3,`ngModelChange`,`keyup.enter`,`ngModel`],[`matSuffix`,``],[`align`,`end`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`]],template:function(e,t){e&1&&(Ra(0,`h2`,0)(1,`span`,1)(2,`mat-icon`),wT(3,`euro`),Hd()(),Ra(4,`span`)(5,`span`,2),wT(6,`Paddle`),Hd(),Ra(7,`span`,3),wT(8,`Einsatz ändern`),Hd()()(),Ra(9,`mat-dialog-content`)(10,`p`,4),wT(11,`Der neue Betrag gilt für zukünftige Spiele.`),Hd(),Ra(12,`mat-form-field`,5)(13,`mat-label`),wT(14,`Betrag pro Spiel`),Hd(),Ra(15,`input`,6),iy(`ngModelChange`,function(r){return _T(t.amountInput,r)||(t.amountInput=r),r}),qa(`keyup.enter`,function(){return t.save()}),Hd(),_S(),Ra(16,`span`,7),wT(17,`€`),Hd()()(),Ra(18,`mat-dialog-actions`,8)(19,`button`,9),qa(`click`,function(){return t.cancel()}),wT(20,`Abbrechen`),Hd(),Ra(21,`button`,10),qa(`click`,function(){return t.save()}),wT(22,` Betrag speichern `),Hd()()),e&2&&(jC(15),oy(`ngModel`,t.amountInput),NS(),jC(6),Lv(`disabled`,!t.isValid))},dependencies:[Sn$2,Ue,En,Xt,hi$1,di,Ht,jt,zt,Vt,me$1,it,de,zt$1,t8,e8,Rn,Tn$1],styles:[`[_nghost-%COMP%]{display:block;box-sizing:border-box;width:100%;max-width:450px}.value-dialog-title[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px}.value-dialog-icon[_ngcontent-%COMP%]{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--%NS%color-primary-soft);color:var(--%NS%color-primary-light)}.value-dialog-icon[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:21px;height:21px;font-size:21px}.value-dialog-kicker[_ngcontent-%COMP%], .value-dialog-heading[_ngcontent-%COMP%]{display:block}.value-dialog-kicker[_ngcontent-%COMP%]{margin-bottom:2px;color:var(--%NS%color-text-subtle);font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.value-dialog-heading[_ngcontent-%COMP%]{font-size:21px;line-height:1.1}mat-dialog-content[_ngcontent-%COMP%]{box-sizing:border-box;max-width:100%;max-height:min(68vh,680px);overflow-x:hidden;overflow-y:auto}.value-dialog-intro[_ngcontent-%COMP%]{margin:0 0 18px;color:var(--%NS%color-text-muted);font-size:13px}.value-field[_ngcontent-%COMP%]{width:100%}[mat-dialog-actions][_ngcontent-%COMP%]{gap:10px;padding-top:8px}@media(max-width:420px){[_nghost-%COMP%]{max-width:100%}}`]})};var _t=(a,n)=>n.player.id;function bn(a,n){if(a&1){let e=Yb();Ra(0,`button`,13)(1,`mat-icon`,4),wT(2,`more_vert`),Hd()(),Ra(3,`mat-menu`,14,0)(5,`button`,15),qa(`click`,function(){bp(e);return Tp(Kb().expandAllPlayers())}),Ra(6,`mat-icon`,4),wT(7,`unfold_more`),Hd(),Ra(8,`span`),wT(9,`Alle Karten öffnen`),Hd()(),Ra(10,`button`,15),qa(`click`,function(){bp(e);return Tp(Kb().collapseAllPlayers())}),Ra(11,`mat-icon`,4),wT(12,`unfold_less`),Hd(),Ra(13,`span`),wT(14,`Alle Karten schließen`),Hd()(),Ra(15,`button`,15),qa(`click`,function(){bp(e);return Tp(Kb().openSetValueDialog())}),Ra(16,`mat-icon`,4),wT(17,`euro`),Hd(),Ra(18,`span`),wT(19,`Einsatz ändern`),Hd()()()}if(a&2)Lv(`matMenuTriggerFor`,tT(4))}function vn(a,n){if(a&1&&(Ra(0,`div`,36)(1,`span`),wT(2),Hd(),Ra(3,`strong`),wT(4),Hd()()),a&2){let e=n.$implicit,t=Kb(5);jC(2),ty(e.player.name),jC(2),ty(t.formatBalance(e.amount))}}function yn(a,n){if(a&1&&(Ra(0,`div`,31)(1,`p`,35),wT(2,`Schuldet`),Hd(),Hb(3,vn,5,2,`div`,36,_t),Hd()),a&2){let e=Kb(2).$implicit;jC(3),$b(e.owedTo)}}function xn(a,n){if(a&1&&(Ra(0,`div`,36)(1,`span`),wT(2),Hd(),Ra(3,`strong`),wT(4),Hd()()),a&2){let e=n.$implicit,t=Kb(5);jC(2),ty(e.player.name),jC(2),ty(t.formatBalance(e.amount))}}function Sn(a,n){if(a&1&&(Ra(0,`div`,32)(1,`p`,35),wT(2,`Bekommt von`),Hd(),Hb(3,xn,5,2,`div`,36,_t),Hd()),a&2){let e=Kb(2).$implicit;jC(3),$b(e.owedBy)}}function kn(a,n){a&1&&(Ra(0,`p`,33),wT(1,`Noch keine offenen Schulden.`),Hd())}function Mn(a,n){if(a&1&&(Ra(0,`div`,30),jb(1,yn,5,0,`div`,31),jb(2,Sn,5,0,`div`,32),jb(3,kn,2,0,`p`,33),Ra(4,`div`,34)(5,`span`),wT(6,`Insgesamt zu zahlen`),Hd(),Ra(7,`strong`),wT(8),Hd()()()),a&2){let e=Kb().$implicit,t=Kb(2);Lv(`id`,`debt-details-`+e.player.id),jC(),Ub(e.owedTo.length?1:-1),jC(),Ub(e.owedBy.length?2:-1),jC(),Ub(!e.owedTo.length&&!e.owedBy.length?3:-1),jC(5),ty(t.formatBalance(e.totalToPay))}}function Cn(a,n){if(a&1){let e=Yb();Ra(0,`article`,22)(1,`button`,23),qa(`click`,function(){let i=bp(e).$implicit;return Tp(Kb(2).togglePlayer(i.player.id))}),Ra(2,`span`,24),wT(3),Hd(),Ra(4,`span`,25)(5,`span`,26),wT(6),Hd(),Ra(7,`span`,27),wT(8),Hd()(),Ra(9,`span`,28),wT(10),Hd(),Ra(11,`mat-icon`,29),wT(12,`chevron_right`),Hd()(),jb(13,Mn,9,5,`div`,30),Hd()}if(a&2){let e=n.$implicit,t=n.$index,i=Kb(2);Ya(`paddle-player-card--expanded`,i.isPlayerExpanded(e.player.id)),jC(),rr(`aria-expanded`,i.isPlayerExpanded(e.player.id))(`aria-controls`,`debt-details-`+e.player.id),jC(2),ty(t+1),jC(3),ty(e.player.name),jC(2),ny(` `,e.player.wins,` Siege · `,e.player.losses,` Niederlagen `),jC(),Ya(`player-result--negative`,e.player.balance<0),jC(),Xd(` `,i.formatBalance(e.player.balance),` `),jC(3),Ub(i.isPlayerExpanded(e.player.id)?13:-1)}}function wn(a,n){if(a&1&&(Ra(0,`section`,7)(1,`div`,16)(2,`div`)(3,`p`,17),wT(4,`Aktueller Stand`),Hd(),Ra(5,`h2`,18),wT(6,`Ranking`),Hd()(),Ra(7,`div`,19)(8,`mat-icon`,4),wT(9,`leaderboard`),Hd()()(),Ra(10,`div`,20),Hb(11,Cn,14,12,`article`,21,_t),Hd()()),a&2){let e=Kb();jC(11),$b(e.playerDebtDetails())}}function Tn(a,n){a&1&&(Ra(0,`section`,8)(1,`mat-icon`,4),wT(2,`groups`),Hd(),Ra(3,`p`),wT(4,`Füge Spieler hinzu, um die Rangliste zu starten.`),Hd()())}var Oi=class a{paddle=p$1(ie);dialog=p$1(ee);expandedPlayerIds=K(new Set);sortedPlayers=mi(()=>this.paddle.players().slice().sort((n,e)=>e.balance-n.balance||e.wins-n.wins));playerDebtDetails=mi(()=>this.sortedPlayers().map(n=>{let e=new Map,t=new Map;for(let h of this.paddle.debtEntries()){let g=h.rounds??1,z=h.winValue??this.paddle.defaultWinValue,w=h.winnerIds.includes(n.id),ne=h.loserIds.includes(n.id);if(w)for(let A of h.loserIds)t.set(A,(t.get(A)??0)+z*g);if(ne)for(let A of h.winnerIds)e.set(A,(e.get(A)??0)+z*g)}let i=new Map;for(let h of new Set([...e.keys(),...t.keys()])){let g=(e.get(h)??0)-(t.get(h)??0);g!==0&&i.set(h,g)}let r=new Map([...i.entries()].filter(([,h])=>h>0)),m=new Map([...i.entries()].map(([h,g])=>[h,Math.abs(g)]).filter(([h])=>(i.get(h)??0)<0));return{player:n,owedTo:this.toDebtList(r),owedBy:this.toDebtList(m),totalToPay:this.total(r)}}));toDebtList(n){return[...n.entries()].map(([e,t])=>({player:this.paddle.players().find(i=>i.id===e),amount:t})).filter(e=>!!e.player)}total(n){return[...n.values()].reduce((e,t)=>e+t,0)}togglePlayer(n){this.expandedPlayerIds.update(e=>{let t=new Set(e);return t.has(n)?t.delete(n):t.add(n),t})}isPlayerExpanded(n){return this.expandedPlayerIds().has(n)}expandAllPlayers(){this.expandedPlayerIds.set(new Set(this.sortedPlayers().map(n=>n.id)))}collapseAllPlayers(){this.expandedPlayerIds.set(new Set)}openSetValueDialog(){this.dialog.open(Ze).afterClosed().subscribe(n=>{n!==void 0&&this.paddle.setWinValue(n)})}openAddDebtDialog(){this.dialog.open(Ye).afterClosed().subscribe(n=>{n&&this.paddle.addDebtEntry(n.winnerIds,n.loserIds,n.rounds)})}openAddPlayerDialog(){this.dialog.open(Ge).afterClosed().subscribe(n=>{n&&this.paddle.addPlayer(n)})}formatBalance(n){return new Intl.NumberFormat(`de-DE`,{style:`currency`,currency:`EUR`}).format(n)}endGame(){this.dialog.open(I,{data:{title:`Paddle-Spiel beenden?`,message:`Alle Spielstände werden gelöscht und können nicht wiederhergestellt werden.`,confirmLabel:`Spiel beenden`,icon:`warning`}}).afterClosed().subscribe(n=>{n&&this.paddle.endGame()})}static ɵfac=function(e){return new(e||a)};static ɵcmp=nr({type:a,selectors:[[`app-paddle-table`]],decls:25,vars:3,consts:[[`playerActionsMenu`,`matMenu`],[1,`paddle-root`,`ui-page-root`],[1,`ui-hero`,`ui-header-nav`,`paddle-header`],[`routerLink`,`/collection`,`matTooltip`,`Zur Sammlung`,`aria-label`,`Zur Sammlung zurück`,1,`ui-header-button`,`ui-header-button--start`],[`aria-hidden`,`true`],[1,`ui-title`],[1,`ui-accent`],[`aria-labelledby`,`ranking-title`,1,`ranking-section`],[1,`empty-state`,`ui-surface`],[1,`primary-actions`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,1,`ui-button`,`add-player-button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,1,`ui-button`,`add-debt-button`,3,`click`,`disabled`],[`mat-flat-button`,``,`color`,`warn`,`type`,`button`,1,`end-game-button`,3,`click`],[`type`,`button`,`aria-label`,`Kartenaktionen öffnen`,`matTooltip`,`Kartenaktionen`,1,`ui-header-button`,`ui-header-button--end`,3,`matMenuTriggerFor`],[`xPosition`,`before`],[`mat-menu-item`,``,`type`,`button`,3,`click`],[1,`section-heading`],[1,`section-kicker`],[`id`,`ranking-title`],[1,`section-actions`],[1,`player-card-list`,`ui-surface`],[1,`paddle-player-card`,3,`paddle-player-card--expanded`],[1,`paddle-player-card`],[`type`,`button`,1,`player-summary`,3,`click`],[1,`ui-rank-badge`],[1,`player-details`],[1,`ui-player-name`],[1,`player-record`],[1,`player-result`],[`aria-hidden`,`true`,1,`player-chevron`],[1,`debt-details`,3,`id`],[1,`debt-group`],[1,`debt-group`,`debt-group--receive`],[1,`no-debts`],[1,`debt-total`],[1,`debt-group-title`],[1,`debt-row`]],template:function(e,t){e&1&&(Ra(0,`div`,1)(1,`header`,2)(2,`a`,3)(3,`mat-icon`,4),wT(4,`chevron_left`),Hd()(),jb(5,bn,20,1),Ra(6,`h1`,5),wT(7,`Paddle `),Ra(8,`span`,6),wT(9,`Rangliste`),Hd()()(),jb(10,wn,13,0,`section`,7)(11,Tn,5,0,`section`,8),Ra(12,`div`,9)(13,`button`,10),qa(`click`,function(){return t.openAddPlayerDialog()}),Ra(14,`mat-icon`,4),wT(15,`person_add`),Hd(),wT(16,` Spieler hinzufügen `),Hd(),Ra(17,`button`,11),qa(`click`,function(){return t.openAddDebtDialog()}),Ra(18,`mat-icon`,4),wT(19,`receipt_long`),Hd(),wT(20,` Schulden eintragen `),Hd()(),Ra(21,`button`,12),qa(`click`,function(){return t.endGame()}),Ra(22,`mat-icon`,4),wT(23,`stop_circle`),Hd(),wT(24,` Spiel beenden `),Hd()()),e&2&&(jC(5),Ub(t.sortedPlayers().length?5:-1),jC(5),Ub(t.sortedPlayers().length?10:11),jC(7),Lv(`disabled`,t.sortedPlayers().length<2))},dependencies:[hi$1,di,I$2,Ht,t8,e8,Lt$1,I$1,G,Bt,Yt,mt$1,Uc],styles:[`.paddle-header[_ngcontent-%COMP%], .flip-7-header[_ngcontent-%COMP%]{position:relative}.ranking-section[_ngcontent-%COMP%], .empty-state[_ngcontent-%COMP%]{width:min(100%,var(--%NS%content-width));box-sizing:border-box}.section-heading[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin:0}.ranking-section[_ngcontent-%COMP%]{margin-top:24px}.section-heading[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.section-actions[_ngcontent-%COMP%]{display:flex;align-items:center;gap:4px}.section-actions[_ngcontent-%COMP%] > mat-icon[_ngcontent-%COMP%]{color:var(--%NS%color-primary-light)}.section-kicker[_ngcontent-%COMP%]{margin:0 0 3px;color:var(--%NS%color-text-subtle);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.section-heading[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:22px}.paddle-player-card[_ngcontent-%COMP%]{width:100%;border-bottom:1px solid var(--%NS%color-white-08)}.paddle-player-card[_ngcontent-%COMP%]:last-child{border-bottom:0}.player-summary[_ngcontent-%COMP%]{display:flex;align-items:center;width:100%;min-height:78px;box-sizing:border-box;gap:12px;padding:12px 14px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.player-summary[_ngcontent-%COMP%]:hover, .player-summary[_ngcontent-%COMP%]:focus-visible{background:var(--%NS%color-white-05);outline:none}.player-summary[_ngcontent-%COMP%]   .ui-rank-badge[_ngcontent-%COMP%]{flex:0 0 40px}.player-details[_ngcontent-%COMP%]{display:flex;min-width:0;flex:1;flex-direction:column}.player-record[_ngcontent-%COMP%]{margin-top:4px;color:var(--%NS%color-text-subtle);font-size:12px}.player-result[_ngcontent-%COMP%]{color:var(--%NS%color-success-light);font-size:18px;font-weight:700;white-space:nowrap}.player-result--negative[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}.player-chevron[_ngcontent-%COMP%]{flex:0 0 auto;color:var(--%NS%color-text-subtle);transition:transform var(--%NS%transition-fast),color var(--%NS%transition-fast)}.paddle-player-card--expanded[_ngcontent-%COMP%]   .player-chevron[_ngcontent-%COMP%]{transform:rotate(90deg);color:var(--%NS%color-primary-light)}.debt-details[_ngcontent-%COMP%]{margin:0 14px 14px 66px;padding:12px;border-radius:var(--%NS%radius-small);background:var(--%NS%color-white-05)}.debt-group[_ngcontent-%COMP%] + .debt-group[_ngcontent-%COMP%]{margin-top:12px}.debt-group-title[_ngcontent-%COMP%]{margin:0 0 5px;color:var(--%NS%color-text-subtle);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.debt-group--receive[_ngcontent-%COMP%]   .debt-group-title[_ngcontent-%COMP%]{color:var(--%NS%color-success-light)}.debt-row[_ngcontent-%COMP%], .debt-total[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--%NS%color-text-muted);font-size:13px}.debt-row[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light);font-weight:600}.debt-group--receive[_ngcontent-%COMP%]   .debt-row[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%color-success-light)}.debt-total[_ngcontent-%COMP%]{margin-top:12px;padding-top:10px;border-top:1px solid var(--%NS%color-white-12);color:var(--%NS%color-text);font-weight:700}.debt-total[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%color-danger-light)}.no-debts[_ngcontent-%COMP%]{margin:0;color:var(--%NS%color-text-subtle);font-size:12px}.end-game-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%], .add-player-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%], .add-debt-button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{width:18px;height:18px;font-size:18px}.empty-state[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;gap:8px;min-height:100px;margin-top:24px;padding:18px;color:var(--%NS%color-text-muted)}.empty-state[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--%NS%color-primary-light)}.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0}.end-game-button[_ngcontent-%COMP%]{align-self:center;min-height:44px;width:min(400px,100%);margin-top:12px;padding:0 22px;border:1px solid var(--%NS%color-danger-45)!important;border-radius:10px;background:transparent!important;color:var(--%NS%color-danger-light)!important}.primary-actions[_ngcontent-%COMP%]{display:grid;width:min(100%,var(--%NS%content-width));grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:24px}.add-player-button[_ngcontent-%COMP%], .add-debt-button[_ngcontent-%COMP%]{width:100%;box-sizing:border-box;min-height:48px;padding-inline:20px}`]})};export{Oi as PaddleTable};