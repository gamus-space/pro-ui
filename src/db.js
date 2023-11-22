'use strict';

export var setBaseUrl;

const baseUrl = new Promise((resolve, reject) => {
  setBaseUrl = url => resolve({
    musicUrl: `${url}/music`,
    screenshotsUrl: `${url}/screenshots`,
  });
});

export var db;

export function loadDb() {
  return baseUrl.then(({ musicUrl }) => fetch(`${musicUrl}/index.json`, { credentials: 'include' }).then(response => response.json()).then(
    data => data.map(entry => ({ ...entry, files: entry.files.map(file => ({ ...file, url: `${musicUrl}/${file.url}` })) }))
  )).then(data => {
    db = Object.fromEntries(data.flatMap(track => track.files.map(file => [file.url, track])));
    loadedHandlers.forEach(handler => handler());
    loadedHandlers = undefined;
    return data;
  }).catch(() => {
    alert('error loading library!');
  });
}

export function loadScreenshots() {
  return baseUrl.then(({ screenshotsUrl }) => fetch(`${screenshotsUrl}/index.json`, { credentials: 'include' }).then(response => response.json()).then(
    data => data.map(game => ({
      ...game,
      index: `${screenshotsUrl}/${game.index}`,
    }))
  ));
}

var loadedHandlers = [];
export function dbLoaded(handler) {
  if (db) {
    handler();
    return;
  }
  loadedHandlers.push(handler);
}
