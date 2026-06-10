'use strict';
(function () {
    var CATALOG_URL  = 'https://gist.githubusercontent.com/ziroo-cf/6de94825d21c9401f27ffeb4677feb9e/raw/videos_V2.json';
    var IFRAME_BASE  = 'https://hyperwatching.com/iframe/';

    var playerFrame    = document.getElementById('playerFrame');
    var videoTitle     = document.getElementById('videoTitle');
    var backButton     = document.getElementById('backButton');
    var videoError     = document.getElementById('videoError');
    var errorBackButton = document.getElementById('errorBackButton');
    var playbackHeader = document.getElementById('playbackHeader');
    var uiTimer;

    // ==================== UI FADE ====================
    function showUI() {
        if (!playbackHeader) return;
        playbackHeader.style.opacity = '1';
        document.body.style.cursor = 'default';
        clearTimeout(uiTimer);
        uiTimer = setTimeout(function () {
            playbackHeader.style.opacity = '0';
            document.body.style.cursor = 'none';
        }, 4000);
    }

    function lockUI() {
        if (playbackHeader) playbackHeader.style.opacity = '1';
        clearTimeout(uiTimer);
    }

    // ==================== UTILS ====================
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

    function findVideoById(videos, id) {
        var strId = String(id);
        for (var i = 0; i < videos.length; i++) {
            if (String(videos[i].id) === strId) return videos[i];
        }
        return null;
    }

    /**
     * Build the iframe URL from a video object.
     * - If videoUrl is a full URL → use as-is
     * - If videoUrl is an ID string → prepend IFRAME_BASE
     * - Fallback: use video.id as the hyperwatching ID
     */
    function buildIframeUrl(video) {
        var src = video.videoUrl || '';
        if (src.indexOf('http') === 0) return src;   // already a full URL
        if (src.length > 0) return IFRAME_BASE + src; // videoUrl is just the ID
        return IFRAME_BASE + video.id;                 // fallback to numeric/string id
    }

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

    // ==================== LOAD VIDEO ====================
    function loadVideo(video) {
        var iframeUrl = buildIframeUrl(video);
        videoTitle.textContent = video.title;
        playerFrame.src = iframeUrl;
        playerFrame.style.display = 'block';
        videoError.style.display  = 'none';
        showUI();
    }

    function showError() {
        playerFrame.src = 'about:blank';
        playerFrame.style.display = 'none';
        videoError.style.display  = 'flex';
        videoTitle.textContent    = 'Playback Error';
        lockUI();
    }

    function goBack() { window.location.href = 'index.html'; }

    function focusBack() {
        if (backButton) {
            backButton.focus();
            backButton.classList.add('nav-focused');
        }
    }

    // ==================== KEY HANDLER ====================
    document.addEventListener('keydown', function (e) {
        var k = e.keyCode || e.which;

        // Back keys
        if (k === 8 || k === 27 || k === 10009 || k === 461 || k === 4) {
            e.preventDefault();
            e.stopPropagation();
            goBack();
            return false;
        }

        // Enter on back button
        if (k === 13) {
            if (document.activeElement === backButton ||
                document.activeElement === errorBackButton) {
                e.preventDefault();
                e.stopPropagation();
                goBack();
                return false;
            }
        }

        // D-Pad Up → show header and focus back
        if (k === 38) {
            showUI();
            if (document.activeElement !== backButton) {
                focusBack();
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }

        // Any key → reset UI timer
        showUI();
    }, false);

    // Mouse activity
    document.addEventListener('mousemove', showUI);

    // ==================== INIT ====================
    function initPlaybackPage() {
        var videoId = getQueryParam('id');

        if (errorBackButton) {
            errorBackButton.addEventListener('click', function (e) { e.preventDefault(); goBack(); });
            errorBackButton.addEventListener('focus', function () { errorBackButton.classList.add('nav-focused'); });
            errorBackButton.addEventListener('blur',  function () { errorBackButton.classList.remove('nav-focused'); });
        }

        // iframe load error detection
        playerFrame.addEventListener('error', function () { showError(); });

        loadCatalog(function (err, videos) {
            if (err || !videos) { showError(); return; }
            var video = videoId ? findVideoById(videos, videoId) : null;
            if (video) loadVideo(video);
            else showError();
            setTimeout(focusBack, 300);
        });
    }

    if (backButton) {
        backButton.addEventListener('click',  goBack);
        backButton.addEventListener('focus',  function () { backButton.classList.add('nav-focused'); showUI(); });
        backButton.addEventListener('blur',   function () { backButton.classList.remove('nav-focused'); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPlaybackPage);
    else initPlaybackPage();
})();