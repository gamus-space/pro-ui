'use strict';

export const BASE_URL = 'media';

export var db;

export function loadDb() {
  return fetch(`${BASE_URL}/index.json`).then(response => response.json()).then(
    data => data.map(entry => ({ ...entry, url: `${BASE_URL}/${entry.url}` }))
  ).then(data => {
    db = Object.fromEntries(data.map(track => [track.url, track]));
    loadedHandlers.forEach(handler => handler());
    loadedHandlers = undefined;
    return data;
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
