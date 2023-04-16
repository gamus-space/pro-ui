'use strict';

export var setBaseUrl;

const baseUrl = new Promise((resolve, reject) => {
  setBaseUrl = resolve;
});

export var db;

export function loadDb() {
  return baseUrl.then(url => fetch(`${url}/index.json`, { credentials: 'include' }).then(response => response.json()).then(
    data => data.map(entry => ({ ...entry, files: entry.files.map(file => ({ ...file, url: `${url}/${file.url}` })) }))
  )).then(data => {
    db = Object.fromEntries(data.flatMap(track => track.files.map(file => [file.url, track])));
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
