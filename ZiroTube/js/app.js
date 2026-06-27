'use strict';
(function () {

    /* ──────────────────────────────────────────────────
       DOM refs
       ────────────────────────────────────────────────── */
    var leftRail         = document.getElementById('leftRail');
    var videoGrid        = document.getElementById('videoGrid');
    var emptyState       = document.getElementById('emptyState');
    var videoCount       = document.getElementById('videoCount');
    var loadingIndicator = document.getElementById('loadingIndicator');

    /* ──────────────────────────────────────────────────
       Config
       ────────────────────────────────────────────────── */
    var MAX_STAGGER = 14;
    var PAGE_SIZE   = 20;

    /* ──────────────────────────────────────────────────
       State
       ────────────────────────────────────────────────── */
    var allVideos         = [];
    var renderedCount     = 0;
    var nav               = null;
    var currentCategory   = '';   
    var loadingKey        = null; 
    var isTouchOrMouse    = false;

    // Advanced Navigation Guards for TV Grid Stability
    var lastPressedKey    = '';
    var lastFocusedCard   = null;
    var isCurrentlyInGrid = false;

/* ──────────────────────────────────────────────────
       Input-type & Key Tracking
       ────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────
       Input-type & Key Tracking
       ────────────────────────────────────────────────── */
       function detectInputType() {
        document.addEventListener('mousemove', function () {
            isTouchOrMouse = true;
        }, { passive: true });
        
        document.addEventListener('touchstart', function () {
            isTouchOrMouse = true;
        }, { passive: true });

        document.addEventListener('keydown', function (e) {
            lastPressedKey = e.key;

            var keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
            if (keys.indexOf(e.key) !== -1) {
                isTouchOrMouse = false;
            }

            /* ── 🛑 حارس زر اليسار (تعطيله تماماً داخل القائمة الجانبية) ── */
            if (e.key === 'ArrowLeft' && !isCurrentlyInGrid) {
                e.preventDefault();
                e.stopImmediatePropagation(); // قتل الحدث فوراً ومنع مكتبة التنقل من استقباله
                return; 
            }

            /* ── 🛡️ حارس العودة الذكي (تذكر آخر بطاقة) ── */
            if (e.key === 'ArrowRight' && !isCurrentlyInGrid) {
                if (lastFocusedCard && nav) {
                    var idx = nav.elements.indexOf(lastFocusedCard);
                    if (idx >= 0) {
                        e.preventDefault(); 
                        e.stopImmediatePropagation(); 
                        isCurrentlyInGrid = true;
                        collapseRail(); 
                        nav.focusIndex(idx, false); 
                    }
                }
            }
        }, true); // ضمان التنفيذ كأولوية قصوى قبل المكتبة
    }
    detectInputType();

    /* ──────────────────────────────────────────────────
       Service Worker
       ────────────────────────────────────────────────── */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function () { console.log('[ZiroTube] SW registered'); })
            .catch(function (err) { console.warn('[ZiroTube] SW failed:', err); });
    }

    /* ──────────────────────────────────────────────────
       Rail helpers
       ────────────────────────────────────────────────── */
    function expandRail() {
        if (leftRail) leftRail.classList.add('expanded');
    }

    function collapseRail() {
        if (leftRail) leftRail.classList.remove('expanded');
    }

    function isRailElement(el) {
        return !!(leftRail && el && leftRail.contains(el));
    }

    /* ──────────────────────────────────────────────────
       Active category button
       ────────────────────────────────────────────────── */
    function setActiveCategoryBtn(key) {
        var btns = document.querySelectorAll('.category-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active',
                btns[i].getAttribute('data-category') === key);
        }
    }

    /* ──────────────────────────────────────────────────
       Navigation — destroy / create
       ────────────────────────────────────────────────── */
    function destroyNav() {
        if (nav) {
            nav.destroy();
            nav = null;
        }
    }

    function initNav(focusFirstCard) {
        destroyNav();

        nav = new SpatialNavigation({
            focusableSelector: '[data-nav-focusable]',
            activeClass:       'nav-focused',
            container:         document,   
            autoFocusFirst:    false,      

            onSelect: function (element) {
                if (element.classList.contains('category-btn')) {
                    var cat = element.getAttribute('data-category');
                    if (cat && cat !== currentCategory) {
                        loadCategory(cat, true);
                    }
                } else {
                    goToVideo(element);
                }
            },

            onFocus: function (element) {
                if (isRailElement(element)) {
                    /* 🛡️ الحارس الذكي 1: عند الصعود أو النزول، امنع الانجراف للقائمة واحسب الخطوة التالية عمودياً */
                    if (isCurrentlyInGrid && (lastPressedKey === 'ArrowUp' || lastPressedKey === 'ArrowDown')) {
                        
                        var gridCards = Array.prototype.slice.call(document.querySelectorAll('.video-card[data-nav-focusable]'));
                        var currentCardIdx = gridCards.indexOf(lastFocusedCard);
                        
                        if (currentCardIdx >= 0) {
                            var columns = 1;
                            if (gridCards.length > 1) {
                                var firstTop = gridCards[0].offsetTop;
                                for (var i = 1; i < gridCards.length; i++) {
                                    if (gridCards[i].offsetTop === firstTop) {
                                        columns++;
                                    } else {
                                        break;
                                    }
                                }
                            }
                            
                            var targetCardIdx = currentCardIdx;
                            if (lastPressedKey === 'ArrowUp') {
                                targetCardIdx = currentCardIdx - columns;
                            } else if (lastPressedKey === 'ArrowDown') {
                                targetCardIdx = currentCardIdx + columns;
                            }
                            
                            var targetCard = gridCards[targetCardIdx] || lastFocusedCard;
                            var navIdx = nav.elements.indexOf(targetCard);
                            
                            if (navIdx >= 0) {
                                nav.focusIndex(navIdx, false);
                                return; // قطع الحدث فوراً
                            }
                        }
                    }

                    /* 🎯 الحارس الذكي 2: عند الدخول للقائمة الجانبية، اجعل التركيز يذهب دائماً للخانة النشطة (الشغالة) */
                    if (isCurrentlyInGrid) {
                        var activeBtn = document.querySelector('.category-btn.active');
                        if (activeBtn && element !== activeBtn) {
                            var activeNavIdx = nav.elements.indexOf(activeBtn);
                            if (activeNavIdx >= 0) {
                                nav.focusIndex(activeNavIdx, false); // إجبار المؤشر على القفز للزر النشط فوراً
                                return; // قطع الحدث هنا لإتمام القفزة بنجاح
                            }
                        }
                    }
                    
                    isCurrentlyInGrid = false;
                    expandRail();
                } else {
                    /* حركة شرعية وصحيحة داخل شبكة الأفلام */
                    isCurrentlyInGrid = true;
                    lastFocusedCard = element; 
                    collapseRail();
                    onCardFocus(element);
                }
            },

            onBack: function () { /* no-op on dashboard */ }
        });

        nav.init();
        window._nav = nav;

        if (!isTouchOrMouse && nav.elements && nav.elements.length > 0) {
            var target = null;

            if (focusFirstCard) {
                target = document.querySelector('.video-card[data-nav-focusable]');
            }

            if (!target) {
                target = document.querySelector('.category-btn.active') ||
                         document.querySelector('.category-btn');
            }

            if (target) {
                var idx = nav.elements.indexOf(target);
                nav.focusIndex(idx >= 0 ? idx : 0, false);
                
                if (isRailElement(target)) {
                    isCurrentlyInGrid = false;
                } else {
                    isCurrentlyInGrid = true;
                    lastFocusedCard = target;
                }
            } else {
                nav.focusIndex(0, false);
                isCurrentlyInGrid = false;
            }
        }

        setTimeout(function () { if (nav) nav.refresh(); }, 300);
        setTimeout(function () { if (nav) nav.refresh(); }, 800);
    }

    /* ──────────────────────────────────────────────────
       Category loading
       ────────────────────────────────────────────────── */
    function loadCategory(key, focusFirstCard) {
        currentCategory = key;
        loadingKey      = key;

        setActiveCategoryBtn(key);

        var activeBtn = document.querySelector('.category-btn.active');
        if (activeBtn && !isTouchOrMouse) {
            activeBtn.focus();
        }

        var children = videoGrid.childNodes;
        var toRemove = [];
        for (var i = 0; i < children.length; i++) {
            if (children[i] !== loadingIndicator) toRemove.push(children[i]);
        }
        for (var j = 0; j < toRemove.length; j++) {
            videoGrid.removeChild(toRemove[j]);
        }

        loadingIndicator.style.display = 'flex';
        emptyState.style.display       = 'none';
        allVideos     = [];
        renderedCount = 0;

        loadCatalog(key, function (err, videos) {
            if (loadingKey !== key) return;

            loadingIndicator.style.display = 'none';

            if (err || !videos || !videos.length) {
                emptyState.style.display = 'flex';
                if (videoCount) videoCount.textContent = '';
                initNav(false); 
                return;
            }

            emptyState.style.display = 'none';
            allVideos     = videos;
            renderedCount = 0;

            renderCards(0, PAGE_SIZE);
            initNav(focusFirstCard !== false);
        });
    }

    /* ──────────────────────────────────────────────────
       Card rendering
       ────────────────────────────────────────────────── */
    function createVideoCard(video, index) {
        var card = document.createElement('div');
        card.className = 'video-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-nav-focusable', 'true');
        card.setAttribute('data-video-id', video.id);
        card.setAttribute('aria-label',
            video.title + (video.duration ? ', ' + video.duration : ''));
        card.style.setProperty('--delay', Math.min(index, MAX_STAGGER) * 40);

        var thumb = document.createElement('div');
        thumb.className = 'card-thumbnail';

        var img = document.createElement('img');
        img.src      = video.poster || '';
        img.alt      = '';
        img.loading  = 'lazy';
        img.decoding = 'async';

        var fallback = document.createElement('div');
        fallback.className   = 'card-thumbnail-fallback';
        fallback.textContent = (video.title || '?').charAt(0).toUpperCase();
        fallback.style.display = 'none';

        img.onerror = function () {
            img.style.display = 'none';
            fallback.style.display = 'flex';
        };

        var playOverlay = document.createElement('div');
        playOverlay.className = 'card-play';
        playOverlay.setAttribute('aria-hidden', 'true');

        thumb.appendChild(img);
        thumb.appendChild(fallback);
        thumb.appendChild(playOverlay);

        if (video.duration) {
            var badge = document.createElement('span');
            badge.className   = 'card-duration-badge';
            badge.textContent = video.duration;
            thumb.appendChild(badge);
        }

        var body  = document.createElement('div');
        body.className = 'card-body';

        var title = document.createElement('h3');
        title.className   = 'card-title';
        title.textContent = video.title;

        body.appendChild(title);
        card.appendChild(thumb);
        card.appendChild(body);

        card.addEventListener('click', function () { goToVideo(card); });

        card.addEventListener('touchstart',
            function () { card.classList.add('touch-active'); },
            { passive: true });
        card.addEventListener('touchend',
            function () { card.classList.remove('touch-active'); },
            { passive: true });
        card.addEventListener('touchcancel',
            function () { card.classList.remove('touch-active'); },
            { passive: true });

        return card;
    }

    function goToVideo(element) {
        var id = element.getAttribute('data-video-id');
        if (id) window.location.href = 'play.html?id=' + encodeURIComponent(id);
    }

    function onCardFocus(element) {
        if (!element) return;
        
        requestAnimationFrame(function () {
            element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
        });
        
        var idx = nav ? nav.getCurrentIndex() : -1;
        if (idx >= 0 && renderedCount < allVideos.length && idx >= renderedCount - 3) {
            loadMoreCards();
        }
    }

    function renderCards(start, count) {
        var end      = Math.min(start + count, allVideos.length);
        var fragment = document.createDocumentFragment();
        for (var i = start; i < end; i++) {
            fragment.appendChild(createVideoCard(allVideos[i], i));
        }
        videoGrid.appendChild(fragment);
        renderedCount = end;

        if (videoCount) {
            videoCount.textContent = allVideos.length + ' videos';
        }
        if (nav) nav.refresh();
    }

    function loadMoreCards() {
        if (renderedCount >= allVideos.length) return;
        renderCards(renderedCount,
            Math.min(PAGE_SIZE, allVideos.length - renderedCount));
    }

    function initSidebarEvents() {
        var btns = document.querySelectorAll('.category-btn');
        for (var i = 0; i < btns.length; i++) {
            (function (btn) {
                btn.addEventListener('click', function () {
                    var cat = btn.getAttribute('data-category');
                    if (cat && cat !== currentCategory) {
                        loadCategory(cat, true);
                    }
                });
            })(btns[i]);
        }
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (nav) nav.refresh();
        }, 300);
    });

    function initDashboard() {
        initSidebarEvents();
        loadCategory('lives', false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }

})();