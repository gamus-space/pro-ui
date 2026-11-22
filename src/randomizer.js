'use strict';

import { loadGames, loadGamesTracks, loadGamesStagesTracks, loadTracks } from './db.js';
import { user } from './login.js';
import { player } from './player.js';
import { pushState } from './route.js';
import { browserOptions, DEFAULT_KINDS, libraryLoaded, libraryType, libraryTypeUpdater } from './script.js';
import { dialogOptions, initDialog, randomInt, showDialog, shuffleArray } from './utils.js';

$('#randomizerDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 480,
  position: { my: "left top", at: "left+20% top+5%", of: window },
});
initDialog($('#randomizerDialog'), { icon: 'ph:arrows-counter-clockwise' });

export function show() {
  showDialog($('#randomizerDialog'));
}

user.then(user => {
  if (user.demo)
    $('#randomizerDialog .shuffle').addClass('demo');
});

$('#randomizerDialog .repeat input').checkboxradio({
  icon: false,
});

$('#randomizerDialog .random-order input').checkboxradio({
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
  $('#randomizerDialog .kind .label')
    .text(kinds.length > 0 ? kinds.join(', ') : '(select kinds)')
    .attr('title', kinds.length > 0 ? kinds.join(', ') : null);
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

const ENTRIES = 4;
let repeat = false;
let games = undefined;
let gamesData = undefined;
let selected = undefined;
let activeEntry = 0;
let currentGames = undefined;

for (let i = 0; i < ENTRIES; i++) {
  $('#randomizerDialog .entries').append(
    $($('#randomizerEntry').prop('content').cloneNode(true))
  );
}
$('#randomizerDialog .entries .entry').eq(activeEntry).addClass('active');

loadTracks().then(response => {
  games = Object.entries(response).flatMap(([ platform, games ]) =>
    Object.entries(games).map(([game, index]) => ({ platform, game, index }))
  );
  updateShuffle();
});
loadGames().then(data => {
  gamesData = data;
  updateShuffle();
});
libraryTypeUpdater.addEventListener('value', () => {
  updateShuffle();
});
$('#randomizerDialog .repeat').change(() => {
  repeat = !repeat;
});
$('#randomizerDialog .shuffle').click(() => {
  updateShuffle();
});
$('#randomizerDialog .entry').click(e => {
  const index = $(e.currentTarget).index() - 1;
  if (index === activeEntry) {
    playSelected(index);
    updateShuffle();
  } else {
    $('#randomizerDialog .entries .entry').eq(activeEntry).removeClass('active');
    $('#randomizerDialog .entries .entry').eq(index).addClass('active');
    activeEntry = index;
  }
});

player.addEventListener('playlistEnded', () => {
  if (!repeat) return;
  playSelected(activeEntry);
  updateShuffle();
});

function updateShuffle() {
  if (!games || !gamesData || !libraryType.value) return;
  currentGames = games;
  selected = [];
  for (let i = 0; i < ENTRIES; i++) {
    updateShuffleEntry(i);
  }
}

function updateShuffleEntry(entry) {
  if (!currentGames || !Object.values(currentKinds).some(kind => kind)) return;
  const random = randomInt(currentGames.length);
  const { platform, game, index } = currentGames[random];
  currentGames.splice(random, 1);

  const [loader, field] = libraryType.value === 'soundtrack' || !index.stages ?
    [loadGamesTracks, 'index'] : [loadGamesStagesTracks, 'stages'];
  loadEntry(platform, game, index.index, index[field], loader).then(tracks => {
    const gameData = gamesData.find(g => g.platform === platform && g.game === game);
    const amount = $('#randomizerDialog .bar').slider('value');
    const filteredTracks = tracks.filter(({ kind }) => currentKinds[kind]);
    if (filteredTracks.length === 0) {
      updateShuffleEntry(entry);
      return;
    }
    const tracksAttempt = filteredTracks.filter(() => amount === 100 || Math.random() <= amount/100);
    const pickedTracks = tracksAttempt.length === 0 ? [filteredTracks[randomInt(filteredTracks.length)]] : tracksAttempt;
    const ordering = $('#randomizerDialog .random-order input').prop('checked') ? shuffleArray : a => a;
    const entries = ordering(pickedTracks.map(playerEntry));
    selected[entry] = { platform, game, tracks: pickedTracks, entries };
    const diceNumbers = ['one', 'two', 'three', 'four', 'five', 'six'];
    $('#randomizerDialog .entry').eq(entry).show()
      .find('.title').text(game.split(': ')[0]).end()
      .find('.subtitle').text(game.split(': ')[1] ?? ' ').end()
      .find('.artist').text(gameData?.artists?.join(', ') ?? '').end()
      .find('.thumbnail').attr('src', gameData.thumbnailsUrl ? `${gameData.thumbnailsUrl}/list.webp` : '').end()
      .find('.count .picked').text(pickedTracks.length).end()
      .find('.count .total').text(filteredTracks.length).end()
      .find('.dice1').attr('icon', `ph:dice-${diceNumbers[randomInt(diceNumbers.length)]}-thin`).end()
      .find('.dice2').attr('icon', `ph:dice-${diceNumbers[randomInt(diceNumbers.length)]}-thin`).end();
  });
}

function playSelected(entry) {
  if (!selected) return;
  const { platform, game, tracks, entries } = selected[entry];
  pushState({ platform, game }, [platform, game]);
  player.loop = false;
  player.shuffle = false;
  player.setPlaylist({ entries }, 0);
  player.load(0);
  libraryLoaded.then(() => {
    import('./library.js').then(({ setSelection }) => {
      setSelection(tracks);
    });
  });
}

function setLoading(loading) {
  $('#randomizerDialog .shuffle iconify-icon')
    .toggleClass('rotate', loading);
}

async function loadEntry(platform, game, index, secondaryIndex, loader) {
  setLoading(true);
  try {
    return await loader(platform, game, index, secondaryIndex);
  } finally {
    setLoading(false);
  }
}

function playerEntry({ platform, game, title, type, files, time, originalTime, replayGain, year, artist }) {
  const format = localStorage.getItem('format') ?? 'mp3';
  const file = files.find(({ url }) => url.endsWith(`.${format}`));
  return {
    platform, game, title, url: file.url, type,
    time, duration: originalTime ? time : undefined,
    replayGain,
    year, artist,
  };
}
