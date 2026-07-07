'use strict';
var CATALOG_URLS = {
    lives: 'https://gist.githubusercontent.com/ziroo-cf/5ba3e14fe665aa61f0ece9d945c6f98c/raw/zirotube_lives.json',
    kids_films: 'https://gist.githubusercontent.com/ziroo-cf/4da23f447ca0055bcac82c70afdf7dc1/raw/zirotube_kids_films.json',
    kids_series: 'https://gist.githubusercontent.com/ziroo-cf/4da23f447ca0055bcac82c70afdf7dc1/raw/zirotube_kids_series.json',
    films: 'https://gist.githubusercontent.com/ziroo-cf/4da23f447ca0055bcac82c70afdf7dc1/raw/zirotube_films.json'
};

function loadCatalog(categoryKey, callback) {
    var url = CATALOG_URLS[categoryKey];
    if (!url) {
        callback('Unknown category: ' + categoryKey, null);
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 10000;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    callback(null, JSON.parse(xhr.responseText));
                } catch (e) {
                    callback('Invalid JSON', null);
                }
            } else {
                callback('HTTP error ' + xhr.status, null);
            }
        }
    };
    xhr.onerror = function () {
        callback('Network error', null);
    };
    xhr.ontimeout = function () {
        callback('Timeout', null);
    };
    xhr.send();
}