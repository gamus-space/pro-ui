'use strict';

export var setBaseUrl;

const baseUrl = new Promise((resolve, reject) => {
  setBaseUrl = resolve;
});

export var db;

export function loadDb() {
  return baseUrl.then(url => fetch(`${url}/index.json`).then(response => response.json()).then(
    data => data.map(entry => ({ ...entry, url: `${url}/${entry.url}` }))
  )).then(data => {
    db = Object.fromEntries(data.map(track => [track.url, track]));
    loadedHandlers.forEach(handler => handler());
    loadedHandlers = undefined;
    return data;
  }).catch(() => {
    alert('error loading library!');
  });
}

var loadedHandlers = [];
export function dbLoaded(handler) {
  if (db) {
    handler();
    return;
  }
  loadedHandlers.push(handler);
}
