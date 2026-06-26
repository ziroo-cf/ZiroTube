'use strict';
(function () {
    var videoGrid  = document.getElementById('videoGrid');
    var emptyState = document.getElementById('emptyState');
    var videoCount = document.getElementById('videoCount');
    var dashboard  = document.getElementById('dashboard');
    var loadingIndicator = document.getElementById('loadingIndicator');
    var MAX_STAGGER = 14;
    var PAGE_SIZE = 20;
    var allVideos = [];
    var renderedCount = 0;
    var nav = null;

    // [تحسين الماوس/اللمس] كشف إن كان المستخدم يستخدم فأرة أو لمس
    var isTouchOrMouse = false;
    function detectInputType() {
        // عند تحريك الفأرة أو اللمس نعتبر أن الجهاز ليس تلفازاً
        document.addEventListener('mousemove', function onMove() {
            isTouchOrMouse = true;
            document.removeEventListener('mousemove', onMove);
        }, { passive: true });
        document.addEventListener('touchstart', function onTouch() {
            isTouchOrMouse = true;
            document.removeEventListener('touchstart', onTouch);
        }, { passive: true });
    }
    detectInputType();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(reg) {
                console.log('Service Worker registered');
            })
            .catch(function(err) {
                console.warn('SW registration failed:', err);
            });
    }

    function createVideoCard(video, index) {
        var card = document.createElement('div');
        card.className = 'video-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-nav-focusable', 'true');
        card.setAttribute('data-video-id', video.id);
        card.setAttribute('aria-label', video.title + (video.duration ? ', ' + video.duration : ''));
        var delay = Math.min(index, MAX_STAGGER) * 40;
        card.style.setProperty('--delay', delay);

        var thumb = document.createElement('div');
        thumb.className = 'card-thumbnail';

        var img = document.createElement('img');
        img.src = video.poster || '';
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';

        var fallback = document.createElement('div');
        fallback.className = 'card-thumbnail-fallback';
        fallback.textContent = video.title.charAt(0).toUpperCase();
        fallback.style.display = 'none';

        img.onerror = function () {
            img.style.display = 'none';
            fallback.style.display = 'flex';
        };

        var playOverlay = document.createElement('div');
        playOverlay.className = 'card-play';
        playOverlay.setAttribute('aria-hidden', 'true');

        var badge = document.createElement('span');
        badge.className = 'card-duration-badge';
        if (video.duration) badge.textContent = video.duration;

        thumb.appendChild(img);
        thumb.appendChild(fallback);
        thumb.appendChild(playOverlay);
        if (video.duration) thumb.appendChild(badge);

        var body = document.createElement('div');
        body.className = 'card-body';

        var title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = video.title;

        body.appendChild(title);
        card.appendChild(thumb);
        card.appendChild(body);

        card.addEventListener('click', function () {
            goToVideo(card);
        });

        card.addEventListener('touchstart', function () {
            card.classList.add('touch-active');
        }, { passive: true });

        card.addEventListener('touchend', function () {
            card.classList.remove('touch-active');
        }, { passive: true });

        card.addEventListener('touchcancel', function () {
            card.classList.remove('touch-active');
        }, { passive: true });

        return card;
    }

    function goToVideo(element) {
        var id = element.getAttribute('data-video-id');
        if (id) window.location.href = 'play.html?id=' + encodeURIComponent(id);
    }

    function onCardFocus(element) {
        if (!element) return;
        requestAnimationFrame(function() {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
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
        if (nav) {
            nav.refresh();
        }
    }

    function loadMoreCards() {
        if (renderedCount >= allVideos.length) return;
        var nextStart = renderedCount;
        var toLoad = Math.min(PAGE_SIZE, allVideos.length - nextStart);
        renderCards(nextStart, toLoad);
    }

    function initDashboard() {
        loadingIndicator.style.display = 'flex';
        emptyState.style.display = 'none';

        loadCatalog(function (err, videos) {
            loadingIndicator.style.display = 'none';

            if (err || !videos) {
                emptyState.style.display = 'flex';
                return;
            }

            emptyState.style.display = 'none';
            allVideos = videos;
            renderedCount = 0;

            renderCards(0, PAGE_SIZE);

            // [تحسين الماوس/اللمس] لا نفعّل التركيز التلقائي إذا كان المستخدم يستخدم فأرة/لمس
            var autoFocus = !isTouchOrMouse;
            nav = new SpatialNavigation({
                focusableSelector: '[data-nav-focusable]',
                activeClass: 'nav-focused',
                container: dashboard,
                autoFocusFirst: autoFocus,
                onSelect: goToVideo,
                onFocus: onCardFocus,
                onBack: function () { }
            });
            nav.init();
            window._nav = nav;

            setTimeout(function () { nav.refresh(); }, 300);
            setTimeout(function () { nav.refresh(); }, 800);
            var resizeTimer;
            window.addEventListener('resize', function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () { nav.refresh(); }, 300);
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
    else initDashboard();
})();