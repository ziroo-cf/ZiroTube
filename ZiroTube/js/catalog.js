'use strict';
var CATALOG_URL = 'https://gist.githubusercontent.com/ziroo-cf/4da23f447ca0055bcac82c70afdf7dc1/raw/zirotube_kids_films.json';

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
    xhr.onerror = function () { callback('Network error', null); };
    xhr.ontimeout = function () { callback('Timeout', null); };
    xhr.send();
}