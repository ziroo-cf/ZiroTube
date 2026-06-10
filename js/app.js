'use strict';
(function () {
    var CATALOG_URL = 'https://gist.githubusercontent.com/ziroo-cf/6de94825d21c9401f27ffeb4677feb9e/raw/videos_V2.json';

    var videoGrid  = document.getElementById('videoGrid');
    var emptyState = document.getElementById('emptyState');
    var videoCount = document.getElementById('videoCount');
    var dashboard  = document.getElementById('dashboard');

    // Max stagger delay index — caps so 30th card doesn't wait 1.2s
    var MAX_STAGGER = 14;

    // ==================== LOAD CATALOG ====================
    function loadCatalog(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', CATALOG_URL, true);
        xhr.timeout = 10000;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try { callback(null, JSON.parse(xhr.responseText)); }
                    catch (e) { callback('Invalid JSON', null); }
                } else { callback('HTTP error ' + xhr.status, null); }
            }
        };
        xhr.onerror   = function () { callback('Network error', null); };
        xhr.ontimeout = function () { callback('Timeout', null); };
        xhr.send();
    }

    // ==================== BUILD CARD ====================
    function createVideoCard(video, index) {
        var card = document.createElement('div');
        card.className = 'video-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-nav-focusable', 'true');
        card.setAttribute('data-video-id', video.id);
        card.setAttribute('aria-label', video.title + (video.duration ? ', ' + video.duration : ''));

        // Staggered entrance: delay each card a little
        var delay = Math.min(index, MAX_STAGGER) * 40;
        card.style.setProperty('--delay', delay);

        // --- Thumbnail ---
        var thumb = document.createElement('div');
        thumb.className = 'card-thumbnail';

        var img = document.createElement('img');
        img.src = video.thumbnailUrl;
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

        // Play button overlay (pure CSS, this div is the anchor)
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

        // --- Body ---
        var body = document.createElement('div');
        body.className = 'card-body';

        var title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = video.title;

        body.appendChild(title);
        card.appendChild(thumb);
        card.appendChild(body);

        // --- Click / Touch ---
        card.addEventListener('click', function () {
            goToVideo(card);
        });

        // Touch active state for visual feedback
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

    // ==================== NAVIGATION ====================
    function goToVideo(element) {
        var id = element.getAttribute('data-video-id');
        if (id) window.location.href = 'play.html?id=' + encodeURIComponent(id);
    }

    function onCardFocus(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ==================== RENDER ====================
    function renderCards(videos) {
        while (videoGrid.firstChild) videoGrid.removeChild(videoGrid.firstChild);

        if (!videos || !videos.length) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        if (videoCount) {
            videoCount.textContent = videos.length + ' videos';
        }

        for (var i = 0; i < videos.length; i++) {
            videoGrid.appendChild(createVideoCard(videos[i], i));
        }
    }

    // ==================== INIT ====================
    function initDashboard() {
        loadCatalog(function (err, videos) {
            if (err || !videos) {
                while (videoGrid.firstChild) videoGrid.removeChild(videoGrid.firstChild);
                emptyState.style.display = 'flex';
                return;
            }

            renderCards(videos);

            var nav = new SpatialNavigation({
                focusableSelector: '[data-nav-focusable]',
                activeClass: 'nav-focused',
                container: dashboard,
                autoFocusFirst: true,
                onSelect: goToVideo,
                onFocus: onCardFocus,
                onBack: function () { /* no-op on dashboard */ }
            });

            nav.init();
            window._nav = nav;

            // Refresh after images paint (layout may shift)
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