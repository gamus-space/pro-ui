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

const tracksLoader = baseUrl.then(({ musicUrl }) => fetchJson(`${musicUrl}/index.json`).then(
  data => Object.fromEntries(Object.entries(data).map(([ platform, games ]) => [
    platform,
    Object.fromEntries(Object.entries(games).map(([game, { index, stages }]) => [game, {
      index: `${musicUrl}/${index}`,
      stages: stages ? `${musicUrl}/${stages}` : undefined,
    }])),
  ]))
));

export function loadTracks() {
  return tracksLoader;
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
  });
}

const preprocessTracks = baseUrl => tracks => {
  return tracks.map(track => ({
    ...track,
    files: track.files.map(file => ({ ...file, url: new URL(file.url, baseUrl).href })),
  }));
};

const stagesTracksCache = {};

export async function loadGamesStagesTracks(platform, game, index, stages) {
  const cacheKey = `${platform}\t${game}`;
  if (stagesTracksCache[cacheKey]) {
    return Promise.resolve(stagesTracksCache[cacheKey]);
  }
  const tracks = await loadGamesTracks(platform, game, index);
  return fetchJson(stages).then(preprocessStagesTracks(tracks)).then(tracks => {
    stagesTracksCache[cacheKey] = tracks;
    return stagesTracksCache[cacheKey];
  });
}

const preprocessStagesTracks = tracks => ({ derivative: { tracks: stagesTracks } }) => {
  return stagesTracks.map(({ original, overrides }) => {
    const originalTrack = tracks.find(({ title }) => title === original.title);
    if (!originalTrack) {
      console.error('original track not found', original);
    }
    return {
      ...originalTrack,
      ...overrides,
    };
  });
};

const screenshotsCache = {};

export function loadGamesScreenshots(platform, game, index) {
  const cacheKey = `${platform}\t${game}`;
  if (screenshotsCache[cacheKey]) {
    return Promise.resolve(screenshotsCache[cacheKey]);
  }
  return fetchJson(index).then(preprocessScreenshots(index)).then(gallery => {
    gallery.forEach(entry => {
      screenshotsCache[`${entry.platform}\t${entry.game}`] = entry;
    });
    return screenshotsCache[cacheKey];
  });
}

const preprocessScreenshots = baseUrl => data => data.map(game => {
  const library = Object.fromEntries(game.library.map(entry => [entry.url, { ...entry, url: new URL(entry.url, baseUrl).href }]));
  const lookup = url => {
    if (!library[url]) console.error(`invalid gallery url: ${url}`);
    return library[url];
  };
  return {
    ...game,
    library: game.library.map(entry => ({ ...entry, url: library[entry.url].url, relativeUrl: entry.url })),
    screenshots: game.screenshots.map(lookup),
    demoScreenshots: game.demoScreenshots.map(lookup),
    tracks: game.tracks?.map(track => ({ ...track, screenshots: track.screenshots?.map(lookup) })),
  };
});
