'use strict';
(function () {
    var CLOUDFLARE_WORKER_URL = 'https://cors-proxy.ziroo.workers.dev//?url=';
    var videoElement = document.getElementById('videoPlayer');
    var videoError = document.getElementById('videoError');
    var errorBackButton = document.getElementById('errorBackButton');
    var player = null;

    // ✅ Debounce helper
    function debounce(func, wait) {
        var timeout;
        return function() {
            var args = arguments;
            var context = this;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

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
        for (var i = 0; i < videos.length; i++) {
            if (videos[i].id === parseInt(id, 10)) return videos[i];
        }
        return null;
    }

    function isHlsUrl(url) {
        return url && url.indexOf('.m3u8') !== -1;
    }

    function loadVideo(video) {
        var originalUrl = video.video || ''; 
        var url = originalUrl;
        if (isHlsUrl(url) && url.indexOf('pegasus.5387692.xyz') !== -1) {
            url = CLOUDFLARE_WORKER_URL + encodeURIComponent(url);
        }

        if (video.banner) {
            videoElement.setAttribute('poster', video.banner);
        }

        var existingPlayer = videojs.getPlayer(videoElement);
        if (existingPlayer) {
            existingPlayer.dispose();
            player = null;
            videoElement = document.getElementById('videoPlayer');
        }

        player = videojs(videoElement, {
            fluid: true,
            html5: {
                vhs: {
                    overrideNative: true,
                    maxBufferLength: 15
                }
            },
            controlBar: {
                children: [
                    'playToggle',
                    'volumePanel',
                    'currentTimeDisplay',
                    'timeDivider',
                    'durationDisplay',
                    'progressControl',
                    'fullscreenToggle'
                ]
            },
            autoplay: false,
            preload: 'auto'
        });

        player.ready(function() {
            player.src({
                src: url,
                type: isHlsUrl(url) ? 'application/x-mpegURL' : 'video/mp4'
            });

            videoElement.focus();

            var errorHandler = function() {
                if (url !== originalUrl && player.src() !== originalUrl) {
                    player.src({
                        src: originalUrl,
                        type: isHlsUrl(originalUrl) ? 'application/x-mpegURL' : 'video/mp4'
                    });
                } else {
                    showVideoError();
                }
            };
            player.one('error', errorHandler);

            videoError.style.display = 'none';
        });
    }

    function showVideoError() {
        if (player) { player.dispose(); player = null; }
        videoElement.style.display = 'none';
        videoError.style.display = 'flex';
        if (errorBackButton) errorBackButton.focus();
    }

    function goBack() {
        // ✅ Dispose player and clean up
        if (player) {
            player.dispose();
            player = null;
        }
        // Remove all event listeners to avoid memory leaks
        window.removeEventListener('beforeunload', cleanupOnUnload);
        window.location.href = 'index.html';
    }

    // ✅ Cleanup function for page unload (e.g., browser back)
    function cleanupOnUnload() {
        if (player) {
            player.dispose();
            player = null;
        }
    }
    window.addEventListener('beforeunload', cleanupOnUnload);

    // ✅ Debounced versions of player actions
    var debouncedSeek = debounce(function(amount) {
        if (player) {
            var newTime = Math.max(0, Math.min(player.duration(), player.currentTime() + amount));
            player.currentTime(newTime);
        }
    }, 200); // 200ms debounce

    var debouncedVolume = debounce(function(step) {
        if (player) {
            var newVol = Math.max(0, Math.min(1, player.volume() + step));
            player.volume(newVol);
        }
    }, 100); // 100ms debounce

    var debouncedPlayToggle = debounce(function() {
        if (player) {
            if (player.paused()) {
                player.play();
            } else {
                player.pause();
            }
        }
    }, 300); // 300ms debounce to avoid accidental double-tap

    function initPlaybackPage() {
        var videoId = getQueryParam('id');

        loadCatalog(function (err, videos) {
            if (err || !videos) { showVideoError(); return; }
            var video = videoId ? findVideoById(videos, videoId) : null;
            if (video) loadVideo(video);
            else showVideoError();

            if (errorBackButton) {
                errorBackButton.addEventListener('click', function (e) {
                    e.preventDefault();
                    goBack();
                });
            }

            document.addEventListener('keydown', function (e) {
                var k = e.keyCode || e.which;
                var handled = false;

                // Back keys – immediate
                if (k === 8 || k === 27 || k === 10009 || k === 461 || k === 4) {
                    handled = true;
                    goBack();
                }

                // Enter – debounced
                if (k === 13) {
                    if (document.activeElement === errorBackButton) {
                        handled = true;
                        goBack();
                    } else {
                        debouncedPlayToggle();
                        handled = true;
                    }
                }

                // Left/Right – debounced seek
                if (k === 37 || k === 39) {
                    var seekAmount = (k === 37) ? -10 : 10;
                    debouncedSeek(seekAmount);
                    handled = true;
                }

                // Up/Down – debounced volume
                if (k === 38 || k === 40) {
                    var volStep = (k === 38) ? 0.1 : -0.1;
                    debouncedVolume(volStep);
                    handled = true;
                }

                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
    }

    if (errorBackButton) {
        errorBackButton.addEventListener('focus', function () {
            errorBackButton.classList.add('nav-focused');
        });
        errorBackButton.addEventListener('blur', function () {
            errorBackButton.classList.remove('nav-focused');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlaybackPage);
    } else {
        initPlaybackPage();
    }
})();