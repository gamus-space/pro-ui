'use strict';

import { loadGamesTracks, loadTracks } from './db.js';
import { user } from './login.js';
import { player } from './player.js';
import { pushState } from './route.js';
import { browserOptions, DEFAULT_KINDS } from './script.js';
import { dialogOptions, initDialog, randomInt, showDialog } from './utils.js';

$('#randomizerDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 150,
  position: { my: "left top", at: "left+10% top+5%", of: window },
});
initDialog($('#randomizerDialog'), { icon: 'ph:arrows-counter-clockwise' });

export function show() {
  showDialog($('#randomizerDialog'));
}

user.then(user => {
  if (user.demo)
    $('#randomizerDialog .shuffle').addClass('demo');
});

$('#randomizerDialog .shuffle input').checkboxradio({
  icon: false,
});

$("#randomizerDialog .kindSelector").iconsselectmenu({
  icons: { button: "ph:funnel" },
  select: (event, { item }) => {
    if (!event.currentTarget) return;
    selectKind(item, !item.element.attr("data-checked"), true);
    $("#randomizerDialog .kindSelector").iconsselectmenu('preventClose');
  },
  classes: {
    "ui-selectmenu-menu": "groups",
    "ui-selectmenu-button": "icon",
  },
}).iconsselectmenu("menuWidget").addClass("ui-menu-icons");

const sliderSettings = {
  classes: { "ui-slider-range": "ui-state-active" },
  animate: false,
};
$('#randomizerDialog .amount .bar').slider({
  ...sliderSettings,
  value: 100,
  min: 0,
  max: 100,
  step: 1,
  orientation: "horizontal",
  range: "min",
});
const fixSlider = (handleSize, ref) => (event) => {
  const handle = $(event.target).find('.ui-slider-handle');
  const pos = parseInt(handle[0].style[ref]);
  handle.css(`margin-${ref}`, `-${handleSize*(pos)/100}rem`);
};
const initSlider = (fix, slider) => {
  fix({ target: slider });
  slider.on('slidechange', fix);
  slider.on('slide', fix);
};
initSlider(fixSlider(0.8, 'left'), $('#randomizerDialog .amount .bar'));
$('#randomizerDialog .amount .min').click(() => {
  $('#randomizerDialog .amount .bar').slider('value', 0);
});
$('#randomizerDialog .amount .max').click(() => {
  $('#randomizerDialog .amount .bar').slider('value', 100);
});

function selectKind(item, selected, update) {
  if (selectMultiple(item, selectKind, DEFAULT_KINDS)) return;
  toggleIcon(item, selected);
  currentKinds[item.value] = selected;
  const kinds = Object.keys(DEFAULT_KINDS).filter(kind => currentKinds[kind]);
  $('#randomizerDialog .kind .label').text(kinds.length > 0 ? kinds.join(', ') : '(select kinds)');
  if (update)
    browserOptions.kinds = currentKinds;
}

let currentKinds;
function updateKinds() {
  currentKinds = browserOptions.kinds;
  Object.entries(currentKinds).forEach(([kind, selected]) => {
    selectKind({ value: kind, element: $(`#randomizerDialog .kindSelector option[value='${kind}']`) }, selected, false);
  });
}
browserOptions.addEventListener('kinds', updateKinds);
updateKinds();

function toggleIcon(item, selected) {
  item.element.attr("data-checked", selected ? 'checked' : null);
  const menuId = `${item.element.parents('select').attr('id')}-menu`;
  $(`ul[id=${menuId}] *[data-value=${item.value}]`).attr('icon', selected ? 'ph:check' : 'ph:dot');
}
function selectMultiple(item, select, defaults) {
  const handlers = {
    selectAll: () => true,
    unselectAll: () => false,
    invertSelection: option => !$(option).attr("data-checked"),
    reset: option => defaults[option.value],
  }
  if (item.element.attr('data-role')) {
    item.element.parents('optgroup').prev().children().toArray().forEach(option => {
      select({ value: option.value, element: $(option) }, handlers[item.element.attr('data-role')](option), true);
    });
    return true;
  }
  return false;
}

let shuffle = false;
let games = undefined;

loadTracks().then(response => {
  games = Object.entries(response).flatMap(([ platform, games ]) =>
    Object.entries(games).map(([game, index]) => ({ platform, game, index }))
  );
  updateShuffle();
});
$('#randomizerDialog .shuffle').change(() => {
  shuffle = !shuffle;
  updateShuffle();
});

player.addEventListener('playlistEnded', () => {
  updateShuffle();
});

function updateShuffle() {
  if (!games || !shuffle || !Object.values(currentKinds).some(kind => kind)) return;
  const { platform, game, index } = games[randomInt(games.length)];
  loadEntry(platform, game, index).then(tracks => {
    pushState({ platform, game }, [platform, game]);
    const amount = $('#randomizerDialog .bar').slider('value');
    const filteredTracks = tracks.filter(({ kind }) => currentKinds[kind]);
    if (filteredTracks.length === 0) {
      updateShuffle();
      return;
    }
    const tracksAttempt = filteredTracks.filter(() => amount === 100 || Math.random() <= amount/100);
    const pickedTracks = tracksAttempt.length === 0 ? [filteredTracks[randomInt(filteredTracks.length)]] : tracksAttempt;
    player.loop = false;
    player.setPlaylist({ entries: pickedTracks.map(playerEntry) }, 0);
    player.load(0);
  });
}

function setLoading(loading) {
  $('#randomizerDialog .shuffle iconify-icon')
    .toggleClass('rotate', loading);
}

async function loadEntry(platform, game, index) {
  setLoading(true);
  try {
    return await loadGamesTracks(platform, game, index);
  } finally {
    setLoading(false);
  }
}

function playerEntry({ platform, game, title, files, time, originalTime, replayGain, year, artist }) {
  const format = localStorage.getItem('format') ?? 'mp3';
  const file = files.find(({ url }) => url.endsWith(`.${format}`));
  return {
    platform, game, title, url: file.url,
    time, duration: originalTime ? time : undefined,
    replayGain,
    year, artist,
  };
}
