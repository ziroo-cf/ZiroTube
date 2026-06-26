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
    
    // [تحسين التلفاز] تأخير ووتيرة مريحة للتكرار
    this.repeatDelay    = 350;   // مللي ثانية قبل بدء التكرار
    this.repeatInterval = 90;    // مللي ثانية بين كل حركة
    
    this._repeatTimer   = null;
    this._repeatIntervalId = null;
    this._isNavigating = false; // قفل لمنع التنفيذ المتزامن

    this.KEY = {
        LEFT:         37,
        UP:           38,
        RIGHT:        39,
        DOWN:         40,
        ENTER:        13,
        BACK:         8,
        ESC:          27,
        PAGE_UP:      33,
        PAGE_DOWN:    34,
        HOME:         36,
        END:          35,
        BACK_TIZEN:   10009,
        BACK_WEBOS:   461,
        BACK_ANDROID: 4
    };
    this._keydownHandler = null;
    this._keyupHandler   = null;
}

SpatialNavigation.prototype.init = function () {
    var self = this;
    if (this.isInitialized) return;
    this._refreshElements();
    if (this.autoFocusFirst && this.elements.length > 0) {
        this.focusIndex(0, true);
    }
    this._keydownHandler = function (e) { self._handleKeyDown(e); };
    this._keyupHandler   = function (e) { self._handleKeyUp(e); };
    document.addEventListener('keydown', this._keydownHandler, false);
    document.addEventListener('keyup', this._keyupHandler, false);
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
    var self = this;
    requestAnimationFrame(function() {
        try { self.currentElement.focus(); } catch (e) { }
    });
    if (!silent && typeof this.onFocusCallback === 'function') {
        this.onFocusCallback(this.currentElement, this.currentIndex);
    }
};

SpatialNavigation.prototype.getCurrentElement = function () { return this.currentElement; };
SpatialNavigation.prototype.getCurrentIndex   = function () { return this.currentIndex; };

SpatialNavigation.prototype._handleKeyDown = function (event) {
    var k = event.keyCode || event.which;
    var handled = false;

    switch (k) {
        case this.KEY.LEFT:
        case this.KEY.UP:
        case this.KEY.RIGHT:
        case this.KEY.DOWN:
            // منع التكرار السريع جداً
            if (this._isNavigating) return false;
            handled = this._navigateDirectionFromKey(k);
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
                this._startRepeat(k);
                return false;
            }
            break;
        case this.KEY.PAGE_UP:
        case this.KEY.PAGE_DOWN:
            handled = this._navigatePage(k === this.KEY.PAGE_DOWN ? 'down' : 'up');
            break;
        case this.KEY.HOME:
            handled = this._navigateEdge('first');
            break;
        case this.KEY.END:
            handled = this._navigateEdge('last');
            break;
        case this.KEY.ENTER:
            handled = this._handleSelect();
            break;
        case this.KEY.BACK:
        case this.KEY.ESC:
        case this.KEY.BACK_TIZEN:
        case this.KEY.BACK_WEBOS:
        case this.KEY.BACK_ANDROID:
            handled = this._handleBack();
            break;
        default:
            break;
    }

    if (handled) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
};

SpatialNavigation.prototype._handleKeyUp = function (event) {
    var k = event.keyCode || event.which;
    if (k === this.KEY.LEFT || k === this.KEY.UP || k === this.KEY.RIGHT || k === this.KEY.DOWN) {
        this._stopRepeat();
        this._isNavigating = false;
    }
};

SpatialNavigation.prototype._startRepeat = function (keyCode) {
    var self = this;
    if (this._repeatTimer) clearTimeout(this._repeatTimer);
    if (this._repeatIntervalId) clearInterval(this._repeatIntervalId);

    this._repeatTimer = setTimeout(function() {
        self._repeatIntervalId = setInterval(function() {
            if (!self._isNavigating) {
                self._navigateDirectionFromKey(keyCode);
            }
        }, self.repeatInterval);
    }, self.repeatDelay);
};

SpatialNavigation.prototype._stopRepeat = function () {
    if (this._repeatTimer) {
        clearTimeout(this._repeatTimer);
        this._repeatTimer = null;
    }
    if (this._repeatIntervalId) {
        clearInterval(this._repeatIntervalId);
        this._repeatIntervalId = null;
    }
};

SpatialNavigation.prototype._navigateDirectionFromKey = function (keyCode) {
    var direction;
    switch (keyCode) {
        case this.KEY.LEFT:  direction = 'left'; break;
        case this.KEY.UP:    direction = 'up'; break;
        case this.KEY.RIGHT: direction = 'right'; break;
        case this.KEY.DOWN:  direction = 'down'; break;
        default: return false;
    }
    return this._navigateDirection(direction);
};

SpatialNavigation.prototype._navigateDirection = function (direction) {
    if (!this.currentElement || this.elements.length < 2) return false;
    if (this._isNavigating) return false;
    
    this._isNavigating = true;
    var best = this._findBestCandidate(this.currentElement, direction);
    if (!best) {
        this._isNavigating = false;
        return false;
    }
    var idx = this.elements.indexOf(best);
    if (idx >= 0 && idx !== this.currentIndex) {
        this.focusIndex(idx, false);
        this._isNavigating = false;
        return true;
    }
    this._isNavigating = false;
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

        switch (direction) {
            case 'left':
                if (dx >= 0) continue;
                primary = -dx;
                secondary = Math.abs(dy);
                break;
            case 'right':
                if (dx <= 0) continue;
                primary = dx;
                secondary = Math.abs(dy);
                break;
            case 'up':
                if (dy >= 0) continue;
                primary = -dy;
                secondary = Math.abs(dx);
                break;
            case 'down':
                if (dy <= 0) continue;
                primary = dy;
                secondary = Math.abs(dx);
                break;
            default: continue;
        }

        // [تحسين خوارزمية التلفاز] تقليل وزن الثانوي + مكافأة التوافق
        var score = primary + secondary * 0.25;
        var threshold = 25;
        if (direction === 'left' || direction === 'right') {
            if (Math.abs(scy - cy) < threshold) score *= 0.7;
        } else {
            if (Math.abs(scx - cx) < threshold) score *= 0.7;
        }

        if (score < bestScore) {
            bestScore = score;
            best = el;
        }
    }
    return best;
};

SpatialNavigation.prototype._navigatePage = function (direction) {
    if (!this.currentElement || this.elements.length < 2) return false;
    var cols = this._estimateColumns();
    var step = direction === 'down' ? cols : -cols;
    var next = Math.max(0, Math.min(this.currentIndex + step, this.elements.length - 1));
    if (next === this.currentIndex) return false;
    this.focusIndex(next, false);
    return true;
};

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

SpatialNavigation.prototype._navigateEdge = function (which) {
    if (this.elements.length === 0) return false;
    var target = which === 'first' ? 0 : this.elements.length - 1;
    if (target === this.currentIndex) return false;
    this.focusIndex(target, false);
    return true;
};

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

SpatialNavigation.prototype.destroy = function () {
    this._stopRepeat();
    if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler, false);
        this._keydownHandler = null;
    }
    if (this._keyupHandler) {
        document.removeEventListener('keyup', this._keyupHandler, false);
        this._keyupHandler = null;
    }
    if (this.currentElement) this._removeClass(this.currentElement, this.activeClass);
    this.elements       = [];
    this.currentIndex   = -1;
    this.currentElement = null;
    this.isInitialized  = false;
};