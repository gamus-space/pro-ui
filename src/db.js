'use strict';

import { fetchJson } from './utils.js';

export var setBaseUrl;

const baseUrl = new Promise((resolve, reject) => {
  setBaseUrl = url => resolve({
    baseUrl: url,
    musicUrl: `${url}/music`,
    screenshotsUrl: `${url}/screenshots`,
    textUrl: `${url}/text`,
  });
});

export var tracksDb;

export function loadTracks() {
  return baseUrl.then(({ musicUrl }) => fetchJson(`${musicUrl}/index.json`).then(
    data => data.map(entry => ({ ...entry, files: entry.files.map(file => ({ ...file, url: `${musicUrl}/${file.url}` })) }))
  )).then(data => {
    tracksDb = Object.fromEntries(data.flatMap(track => track.files.map(file => [file.url, track])));
    return data;
  }).catch(() => {
    alert('error loading library!');
  });
}

export function loadGames() {
  return baseUrl.then(({ baseUrl }) => fetchJson(`${baseUrl}/index.json`).then(
    data => data.map(game => ({
      ...game,
      thumbnailsUrl: game.thumbnailsUrl && `${baseUrl}/${game.thumbnailsUrl}`,
    }))
  ));
}

export function loadScreenshots() {
  return baseUrl.then(({ screenshotsUrl }) => fetchJson(`${screenshotsUrl}/index.json`).then(
    data => data.map(game => ({
      ...game,
      index: `${screenshotsUrl}/${game.index}`,
    }))
  ));
}

export function loadInfo() {
  return baseUrl.then(({ textUrl }) => fetchJson(`${textUrl}/index.json`).then(
    data => Object.fromEntries(Object.entries(data).map(([ platform, games ]) => [
      platform,
      Object.fromEntries(Object.entries(games).map(([game, index]) => [game, `${textUrl}/${index}`])),
    ]))
  ));
}
