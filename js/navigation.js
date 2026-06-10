/* ============================================================
   navigation.js — Spatial Navigation Engine (Strict ES5)
   D-pad + Page Up/Down for TV remote. Grid-aware.
   ============================================================ */
   'use strict';

   function SpatialNavigation(options) {
       var opts = options || {};
   
       this.focusableSelector = opts.focusableSelector || '[data-nav-focusable]';
       this.activeClass       = opts.activeClass || 'nav-focused';
       this.container         = opts.container || document;
       this.onSelectCallback  = opts.onSelect || null;
       this.onFocusCallback   = opts.onFocus  || null;
       this.onBackCallback    = opts.onBack   || null;
       this.autoFocusFirst    = (opts.autoFocusFirst !== false);
   
       this.elements       = [];
       this.currentIndex   = -1;
       this.currentElement = null;
       this.isInitialized  = false;
   
       this.KEY = {
           LEFT:         37,
           UP:           38,
           RIGHT:        39,
           DOWN:         40,
           ENTER:        13,
           BACK:         8,
           ESC:          27,
           PAGE_UP:      33,   // Channel Up on some remotes
           PAGE_DOWN:    34,   // Channel Down on some remotes
           HOME:         36,   // jump to first card
           END:          35,   // jump to last card
           BACK_TIZEN:   10009,
           BACK_WEBOS:   461,
           BACK_ANDROID: 4
       };
   
       this._keydownHandler = null;
   }
   
   SpatialNavigation.prototype.init = function () {
       var self = this;
       if (this.isInitialized) return;
   
       this._refreshElements();
   
       if (this.autoFocusFirst && this.elements.length > 0) {
           this.focusIndex(0, true);
       }
   
       this._keydownHandler = function (e) { self._handleKeyDown(e); };
       document.addEventListener('keydown', this._keydownHandler, false);
       this.isInitialized = true;
   };
   
   SpatialNavigation.prototype._refreshElements = function () {
       var nodeList = (typeof this.container.querySelectorAll === 'function')
           ? this.container.querySelectorAll(this.focusableSelector)
           : document.querySelectorAll(this.focusableSelector);
   
       this.elements = [];
       for (var i = 0; i < nodeList.length; i++) {
           this.elements.push(nodeList[i]);
       }
   };
   
   SpatialNavigation.prototype.refresh = function () {
       var prev = this.currentElement;
       this._refreshElements();
   
       if (prev && this.elements.length > 0) {
           var idx = this.elements.indexOf(prev);
           this.focusIndex(idx >= 0 ? idx : 0, true);
       } else if (this.elements.length > 0 && this.currentIndex < 0) {
           this.focusIndex(0, true);
       }
   };
   
   SpatialNavigation.prototype.focusIndex = function (index, silent) {
       if (index < 0 || index >= this.elements.length) return;
   
       if (this.currentElement) this._removeClass(this.currentElement, this.activeClass);
   
       this.currentIndex   = index;
       this.currentElement = this.elements[index];
       this._addClass(this.currentElement, this.activeClass);
   
       try { this.currentElement.focus(); } catch (e) { /* ignore */ }
   
       if (!silent && typeof this.onFocusCallback === 'function') {
           this.onFocusCallback(this.currentElement, this.currentIndex);
       }
   };
   
   SpatialNavigation.prototype.getCurrentElement = function () { return this.currentElement; };
   SpatialNavigation.prototype.getCurrentIndex   = function () { return this.currentIndex; };
   
   /* ── KEY HANDLER ── */
   SpatialNavigation.prototype._handleKeyDown = function (event) {
       var k = event.keyCode || event.which;
       var handled = false;
   
       switch (k) {
           case this.KEY.LEFT:        handled = this._navigateDirection('left');  break;
           case this.KEY.UP:          handled = this._navigateDirection('up');    break;
           case this.KEY.RIGHT:       handled = this._navigateDirection('right'); break;
           case this.KEY.DOWN:        handled = this._navigateDirection('down');  break;
           case this.KEY.PAGE_UP:     handled = this._navigatePage('up');         break;
           case this.KEY.PAGE_DOWN:   handled = this._navigatePage('down');       break;
           case this.KEY.HOME:        handled = this._navigateEdge('first');      break;
           case this.KEY.END:         handled = this._navigateEdge('last');       break;
           case this.KEY.ENTER:       handled = this._handleSelect();             break;
           case this.KEY.BACK:
           case this.KEY.ESC:
           case this.KEY.BACK_TIZEN:
           case this.KEY.BACK_WEBOS:
           case this.KEY.BACK_ANDROID: handled = this._handleBack(); break;
           default: break;
       }
   
       if (handled) {
           event.preventDefault();
           event.stopPropagation();
           return false;
       }
   };
   
   /* ── DIRECTIONAL NAVIGATION ── */
   SpatialNavigation.prototype._navigateDirection = function (direction) {
       if (!this.currentElement || this.elements.length < 2) return false;
   
       var best = this._findBestCandidate(this.currentElement, direction);
       if (!best) return false;
   
       var idx = this.elements.indexOf(best);
       if (idx >= 0) { this.focusIndex(idx, false); return true; }
       return false;
   };
   
   SpatialNavigation.prototype._findBestCandidate = function (source, direction) {
       var sr  = source.getBoundingClientRect();
       var scx = sr.left + sr.width  / 2;
       var scy = sr.top  + sr.height / 2;
   
       var best  = null;
       var bestScore = Infinity;
   
       for (var i = 0; i < this.elements.length; i++) {
           var el = this.elements[i];
           if (el === source) continue;
   
           var r = el.getBoundingClientRect();
           if (r.width === 0 || r.height === 0) continue;
   
           var cx = r.left + r.width  / 2;
           var cy = r.top  + r.height / 2;
           var dx = cx - scx;
           var dy = cy - scy;
   
           var primary, secondary;
   
           if      (direction === 'left')  { if (dx >= 0) continue; primary = -dx; secondary = Math.abs(dy); }
           else if (direction === 'right') { if (dx <= 0) continue; primary =  dx; secondary = Math.abs(dy); }
           else if (direction === 'up')    { if (dy >= 0) continue; primary = -dy; secondary = Math.abs(dx); }
           else if (direction === 'down')  { if (dy <= 0) continue; primary =  dy; secondary = Math.abs(dx); }
           else continue;
   
           // Weighted score: primary axis distance + secondary alignment penalty
           var score = primary + secondary * 0.55;
   
           // Bonus for elements that overlap on the secondary axis
           var overlap = this._overlap(sr, r, direction);
           if (overlap > 0) score -= overlap * 0.25;
   
           if (score < bestScore) { bestScore = score; best = el; }
       }
   
       return best;
   };
   
   SpatialNavigation.prototype._overlap = function (a, b, direction) {
       if (direction === 'left' || direction === 'right') {
           return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
       }
       return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
   };
   
   /* ── PAGE UP / DOWN (jump one row) ── */
   SpatialNavigation.prototype._navigatePage = function (direction) {
       if (!this.currentElement || this.elements.length < 2) return false;
   
       var cols = this._estimateColumns();
       var step = direction === 'down' ? cols : -cols;
       var next = Math.max(0, Math.min(this.currentIndex + step, this.elements.length - 1));
   
       if (next === this.currentIndex) return false;
       this.focusIndex(next, false);
       return true;
   };
   
   /* Estimate number of grid columns from how many elements share the same top Y */
   SpatialNavigation.prototype._estimateColumns = function () {
       if (!this.currentElement) return 1;
       var sourceTop = this.currentElement.getBoundingClientRect().top;
       var cols = 0;
       for (var i = 0; i < this.elements.length; i++) {
           var top = this.elements[i].getBoundingClientRect().top;
           if (Math.abs(top - sourceTop) < 10) cols++;
       }
       return Math.max(cols, 1);
   };
   
   /* ── HOME / END ── */
   SpatialNavigation.prototype._navigateEdge = function (which) {
       if (this.elements.length === 0) return false;
       var target = which === 'first' ? 0 : this.elements.length - 1;
       if (target === this.currentIndex) return false;
       this.focusIndex(target, false);
       return true;
   };
   
   /* ── SELECT / BACK ── */
   SpatialNavigation.prototype._handleSelect = function () {
       if (this.currentElement && typeof this.onSelectCallback === 'function') {
           this.onSelectCallback(this.currentElement, this.currentIndex);
           return true;
       }
       return false;
   };
   
   SpatialNavigation.prototype._handleBack = function () {
       if (typeof this.onBackCallback === 'function') {
           this.onBackCallback();
           return true;
       }
       return false;
   };
   
   /* ── CLASS HELPERS ── */
   SpatialNavigation.prototype._addClass = function (el, cls) {
       if (!el) return;
       if (el.classList) { el.classList.add(cls); return; }
       if ((' ' + el.className + ' ').indexOf(' ' + cls + ' ') < 0) el.className += ' ' + cls;
   };
   
   SpatialNavigation.prototype._removeClass = function (el, cls) {
       if (!el) return;
       if (el.classList) { el.classList.remove(cls); return; }
       el.className = (' ' + el.className + ' ').replace(' ' + cls + ' ', ' ').trim();
   };
   
   /* ── DESTROY ── */
   SpatialNavigation.prototype.destroy = function () {
       if (this._keydownHandler) {
           document.removeEventListener('keydown', this._keydownHandler, false);
           this._keydownHandler = null;
       }
       if (this.currentElement) this._removeClass(this.currentElement, this.activeClass);
       this.elements       = [];
       this.currentIndex   = -1;
       this.currentElement = null;
       this.isInitialized  = false;
   };