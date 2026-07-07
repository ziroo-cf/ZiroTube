'use strict';
(function () {
    var leftRail = document.getElementById('leftRail');
    var videoGrid = document.getElementById('videoGrid');
    var emptyState = document.getElementById('emptyState');
    var videoCount = document.getElementById('videoCount');
    var loadingIndicator = document.getElementById('loadingIndicator');
    var MAX_STAGGER = 14;
    var PAGE_SIZE = 20;
    var allVideos = [];
    var renderedCount = 0;
    var nav = null;
    var currentCategory = '';
    var loadingKey = null;
    var isTouchOrMouse = false;
    var lastPressedKey = '';
    var lastFocusedCard = null;
    var isCurrentlyInGrid = false;

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
            if (e.key === 'ArrowLeft' && !isCurrentlyInGrid) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
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
        }, true);
    }
    detectInputType();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function () {}).catch(function () {});
    }

    function expandRail() {
        if (leftRail) leftRail.classList.add('expanded');
    }

    function collapseRail() {
        if (leftRail) leftRail.classList.remove('expanded');
    }

    function isRailElement(el) {
        return !!(leftRail && el && leftRail.contains(el));
    }

    function setActiveCategoryBtn(key) {
        var btns = document.querySelectorAll('.category-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active', btns[i].getAttribute('data-category') === key);
        }
    }

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
            activeClass: 'nav-focused',
            container: document,
            autoFocusFirst: false,
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
                                return;
                            }
                        }
                    }
                    if (isCurrentlyInGrid) {
                        var activeBtn = document.querySelector('.category-btn.active');
                        if (activeBtn && element !== activeBtn) {
                            var activeNavIdx = nav.elements.indexOf(activeBtn);
                            if (activeNavIdx >= 0) {
                                nav.focusIndex(activeNavIdx, false);
                                return;
                            }
                        }
                    }
                    isCurrentlyInGrid = false;
                    expandRail();
                } else {
                    isCurrentlyInGrid = true;
                    lastFocusedCard = element;
                    collapseRail();
                    onCardFocus(element);
                }
            },
            onBack: function () {}
        });
        nav.init();
        window._nav = nav;
        if (!isTouchOrMouse && nav.elements && nav.elements.length > 0) {
            var target = null;
            if (focusFirstCard) {
                target = document.querySelector('.video-card[data-nav-focusable]');
            }
            if (!target) {
                target = document.querySelector('.category-btn.active') || document.querySelector('.category-btn');
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
        setTimeout(function () {
            if (nav) nav.refresh();
        }, 300);
    }

    function loadCategory(key, focusFirstCard) {
        currentCategory = key;
        loadingKey = key;
        setActiveCategoryBtn(key);
        var activeBtn = document.querySelector('.category-btn.active');
        if (activeBtn && !isTouchOrMouse) {
            activeBtn.focus();
        }
        videoGrid.replaceChildren(loadingIndicator);
        loadingIndicator.style.display = 'flex';
        emptyState.style.display = 'none';
        allVideos = [];
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
            allVideos = videos;
            renderedCount = 0;
            renderCards(0, PAGE_SIZE);
            initNav(focusFirstCard !== false);
        });
    }

    function createVideoCard(video, index) {
        var card = document.createElement('div');
        card.className = 'video-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-nav-focusable', 'true');
        card.setAttribute('data-video-id', video.id);
        card.setAttribute('data-category', currentCategory);
        card.setAttribute('aria-label', video.title + (video.duration ? ', ' + video.duration : ''));
        card.style.setProperty('--delay', Math.min(index, MAX_STAGGER) * 40);
        var thumb = document.createElement('div');
        thumb.className = 'card-thumbnail';
        var img = document.createElement('img');
        img.src = video.poster || '';
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        var fallback = document.createElement('div');
        fallback.className = 'card-thumbnail-fallback';
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
            badge.className = 'card-duration-badge';
            badge.textContent = video.duration;
            thumb.appendChild(badge);
        }
        var body = document.createElement('div');
        body.className = 'card-body';
        var title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = video.title;
        body.appendChild(title);
        card.appendChild(thumb);
        card.appendChild(body);
        return card;
    }

    function goToVideo(element) {
        var id = element.getAttribute('data-video-id');
        var cat = element.getAttribute('data-category') || currentCategory;
        if (id) {
            window.location.href = 'play.html?id=' + encodeURIComponent(id) + '&cat=' + encodeURIComponent(cat);
        }
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
        var end = Math.min(start + count, allVideos.length);
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
        renderCards(renderedCount, Math.min(PAGE_SIZE, allVideos.length - renderedCount));
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

    videoGrid.addEventListener('click', function (e) {
        var card = e.target.closest('.video-card');
        if (card) goToVideo(card);
    });

    function getQueryParam(name) {
        var s = window.location.search;
        if (!s) return null;
        if (s.charAt(0) === '?') s = s.substring(1);
        var pairs = s.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (decodeURIComponent(pair[0]) === name) return decodeURIComponent(pair[1] || '');
        }
        return null;
    }

    function initDashboard() {
        initSidebarEvents();
        var cat = getQueryParam('cat');
        if (cat && CATALOG_URLS[cat]) {
            loadCategory(cat, false);
        } else {
            loadCategory('lives', false);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();