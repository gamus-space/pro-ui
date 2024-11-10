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

export function loadTracks() {
  return baseUrl.then(({ musicUrl }) => fetchJson(`${musicUrl}/index.json`).then(
    data => Object.fromEntries(Object.entries(data).map(([ platform, games ]) => [
      platform,
      Object.fromEntries(Object.entries(games).map(([game, index]) => [game, `${musicUrl}/${index}`])),
    ]))
  ));
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
    data => Object.fromEntries(Object.entries(data).map(([ platform, games ]) => [
      platform,
      Object.fromEntries(Object.entries(games).map(([game, index]) => [game, `${screenshotsUrl}/${index}`])),
    ]))
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

const tracksCache = {};

export function loadGamesTracks(platform, game, index) {
  const cacheKey = `${platform}\t${game}`;
  if (tracksCache[cacheKey]) {
    return Promise.resolve(tracksCache[cacheKey]);
  }
  return fetchJson(index).then(preprocessTracks(index)).then(tracks => {
    tracksCache[cacheKey] = tracks;
    return tracksCache[cacheKey];
  }).finally(() => {
  });
}

const preprocessTracks = baseUrl => tracks => {
  return tracks.map(track => ({
    ...track,
    files: track.files.map(file => ({ ...file, url: new URL(file.url, baseUrl).href })),
  }));
};
