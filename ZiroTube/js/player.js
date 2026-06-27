'use strict';
(function () {
    var CLOUDFLARE_WORKER_URL = 'https://cors-proxy.ziroo.workers.dev//?url=';
    var videoElement = document.getElementById('videoPlayer');
    var videoError = document.getElementById('videoError');
    var errorBackButton = document.getElementById('errorBackButton');
    var player = null;
    var repeatTimers = {
        seek: null,
        seekInterval: null,
        volume: null,
        volumeInterval: null
    };
    var currentCategory = '';

    function setPlayerTime(seconds) {
        if (!player) return;
        var duration = player.duration();
        if (!duration || isNaN(duration)) return;
        var clamped = Math.max(0, Math.min(duration, seconds));
        player.currentTime(clamped);
        player.trigger('timeupdate');
    }

    function setPlayerVolume(value) {
        if (!player) return;
        var clamped = Math.max(0, Math.min(1, value));
        player.volume(clamped);
        player.trigger('volumechange');
    }

    function startRepeat(action, step, delay, interval) {
        stopRepeat(action);
        var timer = setTimeout(function () {
            if (action === 'seek') {
                var current = player ? player.currentTime() : 0;
                setPlayerTime(current + step);
            } else if (action === 'volume') {
                var currentVol = player ? player.volume() : 0.5;
                setPlayerVolume(currentVol + step);
            }
            var intervalId = setInterval(function () {
                if (action === 'seek') {
                    var current = player ? player.currentTime() : 0;
                    setPlayerTime(current + step);
                } else if (action === 'volume') {
                    var currentVol = player ? player.volume() : 0.5;
                    setPlayerVolume(currentVol + step);
                }
            }, interval);
            if (action === 'seek') repeatTimers.seekInterval = intervalId;
            else if (action === 'volume') repeatTimers.volumeInterval = intervalId;
        }, delay);
        if (action === 'seek') repeatTimers.seek = timer;
        else if (action === 'volume') repeatTimers.volume = timer;
    }

    function stopRepeat(action) {
        if (action === 'seek') {
            if (repeatTimers.seek) {
                clearTimeout(repeatTimers.seek);
                repeatTimers.seek = null;
            }
            if (repeatTimers.seekInterval) {
                clearInterval(repeatTimers.seekInterval);
                repeatTimers.seekInterval = null;
            }
        } else if (action === 'volume') {
            if (repeatTimers.volume) {
                clearTimeout(repeatTimers.volume);
                repeatTimers.volume = null;
            }
            if (repeatTimers.volumeInterval) {
                clearInterval(repeatTimers.volumeInterval);
                repeatTimers.volumeInterval = null;
            }
        }
    }

    function stopAllRepeats() {
        stopRepeat('seek');
        stopRepeat('volume');
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
                currentTimeDisplay: true,
                timeDivider: true,
                durationDisplay: true,
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
        player.ready(function () {
            player.src({
                src: url,
                type: isHlsUrl(url) ? 'application/x-mpegURL' : 'video/mp4'
            });
            videoElement.focus();
            var errorHandler = function () {
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
        if (player) {
            player.dispose();
            player = null;
        }
        videoElement.style.display = 'none';
        videoError.style.display = 'flex';
        if (errorBackButton) errorBackButton.focus();
    }

    function goBack() {
        if (player) {
            player.dispose();
            player = null;
        }
        stopAllRepeats();
        window.removeEventListener('beforeunload', cleanupOnUnload);
        var cat = currentCategory || 'lives';
        window.location.href = 'index.html?cat=' + encodeURIComponent(cat);
    }

    function cleanupOnUnload() {
        if (player) {
            player.dispose();
            player = null;
        }
        stopAllRepeats();
    }
    window.addEventListener('beforeunload', cleanupOnUnload);

    function initPlaybackPage() {
        var videoId = getQueryParam('id');
        var cat = getQueryParam('cat');
        if (cat) currentCategory = cat;
        else currentCategory = 'lives';

        loadCatalog(currentCategory, function (err, videos) {
            if (err || !videos) {
                showVideoError();
                return;
            }
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
                if (k === 8 || k === 27 || k === 10009 || k === 461 || k === 4) {
                    handled = true;
                    goBack();
                }
                if (k === 13) {
                    if (document.activeElement === errorBackButton) {
                        handled = true;
                        goBack();
                    } else {
                        if (player) {
                            if (player.paused()) player.play();
                            else player.pause();
                        }
                        handled = true;
                    }
                }
                if (k === 37 || k === 39) {
                    var step = (k === 37) ? -10 : 10;
                    if (player) {
                        var current = player.currentTime();
                        setPlayerTime(current + step);
                    }
                    startRepeat('seek', step, 350, 120);
                    handled = true;
                }
                if (k === 38 || k === 40) {
                    var volStep = (k === 38) ? 0.1 : -0.1;
                    if (player) {
                        var currentVol = player.volume();
                        setPlayerVolume(currentVol + volStep);
                    }
                    startRepeat('volume', volStep, 350, 120);
                    handled = true;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            document.addEventListener('keyup', function (e) {
                var k = e.keyCode || e.which;
                if (k === 37 || k === 39) {
                    stopRepeat('seek');
                }
                if (k === 38 || k === 40) {
                    stopRepeat('volume');
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