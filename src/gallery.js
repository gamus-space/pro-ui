'use strict';

import { loadScreenshots } from './db.js';
import { user } from './login.js';
import { player } from './player.js';
import { subscribeState } from './route.js';
import { dialogOptions, fetchJson, initDialog, showDialog } from './utils.js';

$('#galleryDialog').dialog({
  ...dialogOptions,
  width: 640,
  height: 480+40,
  position: { my: "center", at: "center", of: window },
  open: () => {
    showTrack();
  },
});
initDialog($('#galleryDialog'), { icon: 'ph:monitor-play' });

export function show() {
  showDialog($('#galleryDialog'));
}

let demo = false;
user.then(user => {
  demo = !!user.demo;
  $('#galleryDialog .demo').toggle(demo);
});

let galleryIndex = undefined;
let galleryCache = {};
let currentState;
loadScreenshots().then(res => {
  galleryIndex = res;
  if (currentState) {
    loadScreenshotGroups().then(() => {
      showTrack();
    });
  }
});

subscribeState(updateState);
function updateState(state) {
  currentState = state;
  if (galleryIndex) {
    loadScreenshotGroups();
  }
}

let screenshotGroups;
function loadScreenshotGroups() {
  $('#galleryDialog .groupSelector').empty();
  $('#galleryDialog .groupSelector').selectmenu('refresh');
  const { platform, game } = currentState;
  const index = galleryIndex[platform]?.[game];
  if (!index) {
    $('#galleryDialog .groupSelector').selectmenu('disable');
    $('#galleryDialog .groupSelector').append($('<option>', { text: '(select a game)' }));
    $('#galleryDialog .groupSelector').selectmenu('refresh');
    setGallery(undefined, game);
    return;
  }
  return loadEntry(platform, game, index).then(gallery => {
    screenshotGroups = Map.groupBy(gallery.library, screenshot => screenshot.group ?? screenshot.relativeUrl.match(/^(.+)(-\d+)\.\w+$/)?.[1] ?? screenshot.relativeUrl);
    screenshotGroups.keys().forEach(key => {
      if ((!demo || key === 'demo') && (demo || key !== 'demo')) {
        $('#galleryDialog .groupSelector').append($('<option>', { value: key, text: screenshotGroups.get(key)[0].groupTitle ?? screenshotGroups.get(key)[0].title }));
      }
    });
    $('#galleryDialog .groupSelector').selectmenu('refresh');
    $('#galleryDialog .groupSelector').selectmenu('enable');
    $('.ui-selectmenu-menu.screenshot-list ul').scrollTop(0);
    updateScreenshotGroup();
  });
}

function updateScreenshotGroup() {
  if (music || !screenshotGroups) return;
  const value = $('#galleryDialog .groupSelector').val();
  setGallery(screenshotGroups.get(value), currentState.game);
}

function setLoading(loading) {
  $('#galleryDialog .loader')
    .toggleClass('on', loading)
    .toggleClass('off', !loading);
}

player.addEventListener('entry', () => {
  if (music) showTrack();
});

function showTrack() {
  if (!player.track || !galleryIndex || !$('#galleryDialog').dialog('isOpen')) return;

  const { platform, game, title } = player.track;
  const index = galleryIndex[platform]?.[game];
  if (!index) {
    setGallery(undefined, game);
    return;
  }
  function showGallery(gameGallery) {
    const trackGallery = gameGallery?.tracks?.find(track => track.title === title);
    setGallery(demo ? gameGallery?.demoScreenshots : trackGallery?.screenshots ?? gameGallery?.screenshots, game);
  }

  loadEntry(platform, game, index).then(gallery => {
    showGallery(gallery);
  }).catch(e => {
    setGallery(undefined, game);
    throw e;
  });
}

function loadEntry(platform, game, index) {
  const cacheKey = `${platform}\t${game}`;
  if (galleryCache[cacheKey]) {
    return Promise.resolve(galleryCache[cacheKey]);
  }
  setLoading(true);
  return fetchJson(index).then(preprocessGallery(index)).then(gallery => {
    gallery.forEach(entry => {
      galleryCache[`${entry.platform}\t${entry.game}`] = entry;
    });
    return galleryCache[cacheKey];
  }).finally(() => {
    setLoading(false);
  });
}

const INTERVAL_SEC = 10;
let galleryStatus = {
  list: null,
  index: 0,
};
let galleryInterval;
function setGallery(gallery, game) {
  if (galleryStatus.list != null &&
    (gallery?.length ?? 0) === galleryStatus.list.length &&
    galleryStatus.list.every((item, i) => item === gallery[i]) &&
    (galleryStatus.list.length > 0 || galleryStatus.game === game)) return;

  galleryStatus = { list: gallery ?? [], index: 0, game };
  if (galleryInterval)
    clearInterval(galleryInterval);
  updateGallery();
  galleryInterval = galleryStatus.list.length > 1 ? setInterval(updateGallery, INTERVAL_SEC * 1000) : undefined;
}
function updateGallery() {
  const previous = $('#galleryDialog .active');
  $('#galleryDialog .image.passive')
    .removeClass('passive').addClass('active')
    .toggle(galleryStatus.list.length > 0)
    .css('background-image', galleryStatus.list[galleryStatus.index]?.url && `url("${galleryStatus.list[galleryStatus.index]?.url}")`);
  $('#galleryDialog .data.passive')
    .removeClass('passive').addClass('active')
    .find('.game').text(galleryStatus.game ?? null).end()
    .find('.title').text(galleryStatus.list[galleryStatus.index]?.title ?? '').end();
  previous.removeClass('active').addClass('passive');
  galleryStatus.index = (galleryStatus.index + 1) % galleryStatus.list.length;
}

let music;
$('#galleryDialog .controls .mode').on('click', () => { setMusic(!music); });
function setMusic(mus) {
  music = mus;
  $('#galleryDialog .controls .mode').attr('title', music ? 'Sync with music' : 'Browse')
    .find('iconify-icon').attr('icon', music ? 'ph:music-notes' : 'ph:folder');
  $('#galleryDialog .groupSelector').selectmenu('widget').toggle(!music);
  if (music) {
    if (player.track) showTrack();
    else setGallery(undefined, currentState?.game);
  }
  else updateScreenshotGroup();
}

$('#galleryDialog .groupSelector').selectmenu({
  disabled: true,
  classes: {
    'ui-selectmenu-button': 'text',
    'ui-selectmenu-menu': 'screenshot-list scrollable',
  },
  change: () => {
    updateScreenshotGroup();
  },
  close: () => {
    $('.ui-selectmenu-menu.screenshot-list').css({ visibility: 'hidden', display: 'block' });
  },
  open: () => {
    $('.ui-selectmenu-menu.screenshot-list').css({ visibility: 'visible' });
  },
});
$('#galleryDialog .groupSelector').selectmenu('widget').toggle(false);
setMusic(true);

$('#galleryDialog .data').draggable({
  drag: event => {
    $(event.target)
      .css('left', $(event.target).css('left'))
      .css('top', $(event.target).css('top'))
      .css('right', 'initial')
      .css('bottom', 'initial');
  },
});
$('#galleryDialog .controls').draggable();

const preprocessGallery = baseUrl => data => data.map(game => {
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
