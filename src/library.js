'use strict';

import { loadGamesTracks, loadTracks } from './db.js';
import { user } from './login.js';
import { player, downloadOriginal, downloadWav } from './player.js';
import { subscribeState } from './route.js';
import { browserOptions, DEFAULT_KINDS, playlistLoaded } from './script.js';
import { dialogOptions, initDialog, showDialog, size, time, trackTitle } from './utils.js';

$('#libraryDialog').dialog({
  ...dialogOptions,
  width: 480,
  height: 360,
  position: { my: "right top", at: "right-8% top+5%", of: window },
  resize: (e, { size: { height } }) => {
    resizeTable(height);
  },
});
initDialog($('#libraryDialog'), { icon: 'ph:folder-open' });

export function show() {
  showDialog($('#libraryDialog'));
}

function resizeTable(height) {
  const body = $('#library_wrapper .dataTables_scrollBody');
  body.css('max-height', height - body.position().top - 70);
}

const KIND_MAPPING = {
  track: 'T',
  short: 'S',
  jingle: 'J',
  ambient: 'A',
  story: 'Y',
};

const ICON_PLAY = 'ph:play-fill';
const ICON_PAUSE = 'ph:pause-fill';

let isPlaying = false;
let tracksIndex;

loadTracks().then(data => {
  tracksIndex = data;
  setTimeout(() => {
    resizeTable($('#libraryDialog').parent().height());
  });
  $('#library').DataTable({
    columns: [
      { name: "play", data: "play", title: "Play", orderable: false },
      { name: "game", data: "game", title: "Game", orderData: [2, 3] },
      { name: "gameTitle", data: "gameTitle", visible: false },
      { name: "gameSubtitle", data: "gameSubtitle", visible: false },
      { name: "track", data: "track", title: "tr #" },
      { name: "ordinal", data: "ordinal", title: "#" },
      { name: "kind", data: "kind", title: "?" },
      { name: "title", data: "title", title: "Title" },
      { name: "subtitle", data: "subtitle", title: "Subt." },
      { name: "artist", data: "artist", title: "Artist" },
      { name: "platform", data: "platform", title: "Platform" },
      { name: "year", data: "year", title: "Year" },
      { name: "time", data: "time", title: "Time" },
      { name: "size", data: "size", title: "Size" },
      { name: "originalSize", data: "originalSize", title: "Orig Size" },
    ],
    order: [1, 'asc'],
    paging: false,
    pageLength: 100,
    pagingType: 'full_numbers',
    language: {
      emptyTable: 'Select a game',
      paginate: {
        previous: '<span class="ui-icon ui-icon-arrow-1-w"></span>',
        next: '<span class="ui-icon ui-icon-arrow-1-e"></span>',
        first: '<span class="ui-icon ui-icon-arrowstop-1-w"></span>',
        last: '<span class="ui-icon ui-icon-arrowstop-1-e"></span>',
      },
    },
    scrollX: true,
    scrollY: $('#libraryDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">frt<"info"><"status">p',
    initComplete: () => {
      updateInfo();
    },
  }).on('search.dt', () => {
    unselectAll();
    updateInfo();
  }).on('page', () => {
    $('#library').DataTable().rows(':visible').nodes()[0].scrollIntoView();
  });

  $('#library tbody').on('focus', 'button', (event) => {
    event.stopPropagation();
  });
  $('#library tbody').on('click', 'button.listen', (event) => {
    event.stopPropagation();
    const loaded = $(event.currentTarget).hasClass('ui-state-active');
    if (!loaded) {
      const rows = $('#library').DataTable().rows(':visible');
      const entry = rows.nodes().indexOf($('#library').DataTable().row($(event.target).parents('tr')).node());
      player.setPlaylist({ entries: rows.data().toArray().map(playerEntry) }, entry);
      player.load(entry);
    } else if (isPlaying) player.pause();
    else player.play();
  });

  $('#libraryDialog .operations').append($(`
    <button class="selectAll ui-button ui-button-icon-only" title="Select all">
      <iconify-icon icon="ph:check-square"></iconify-icon>
    </button>
    <button class="unselectAll ui-button ui-button-icon-only" title="Clear selection">
      <iconify-icon icon="ph:square"></iconify-icon>
    </button>
    <button class="addToPlaylist ui-button ui-button-icon-only" title="Add to playlist">
      <iconify-icon icon="ph:playlist"></iconify-icon>
    </button>
    <select class="columnSelector" title="Select columns">
      <optgroup label="Columns">
        <option value="game" data-checked="checked">Game</option>
        <option value="track" data-checked="checked"># track</option>
        <option value="ordinal" data-checked="checked"># sequence</option>
        <option value="kind" data-checked="checked">? kind</option>
        <option value="title" data-checked="checked">Title</option>
        <option value="subtitle" data-checked="checked">Subtitle</option>
        <option value="artist" data-checked="checked">Artist</option>
        <option value="platform" data-checked="checked">Platform</option>
        <option value="year" data-checked="checked">Year</option>
        <option value="time" data-checked="checked">Time</option>
        <option value="size" data-checked="checked">Size</option>
        <option value="originalSize" data-checked="checked">Orig Size</option>
      </optgroup>
      <optgroup label="Selection">
        <option data-role="selectAll" data-icon="ph:check-square">Select all</option>
        <option data-role="unselectAll" data-icon="ph:square">Unselect all</option>
        <option data-role="invertSelection" data-icon="ph:swap">Invert</option>
        <option data-role="reset" data-icon="ph:question-mark">Set defaults</option>
      </optgroup>
    </select>
    <select class="kindSelector" title="Filter kinds">
      <optgroup label="Kinds">
        <option value="track" data-checked="checked">Track</option>
        <option value="short" data-checked="checked">Short</option>
        <option value="jingle" data-checked="checked">Jingle</option>
        <option value="ambient" data-checked="checked">Ambient</option>
        <option value="story" data-checked="checked">storY</option>
      </optgroup>
      <optgroup label="Selection">
        <option data-role="selectAll" data-icon="ph:check-square">Select all</option>
        <option data-role="unselectAll" data-icon="ph:square">Unselect all</option>
        <option data-role="invertSelection" data-icon="ph:swap">Invert</option>
        <option data-role="reset" data-icon="ph:question-mark">Set defaults</option>
      </optgroup>
    </select>
    <select class="formatSelector" title="Format">
      <option value="flac">FLAC</option>
      <option value="mp3">MP3</option>
    </select>
    <select class="downloadSelector" title="Download">
      <option data-role="downloadOriginal" data-icon="ph:download-simple">Download</option>
      <option data-role="downloadWav" data-icon="ph:download-simple">Download as WAV</option>
    </select>
  `));

  $(".columnSelector").iconsselectmenu({
    icons: { button: "ph:text-columns" },
    select: (event, { item }) => {
      if (!event.currentTarget) return;
      selectColumn(item, !item.element.attr("data-checked"));
      $(".columnSelector").iconsselectmenu('preventClose');
    },
    classes: {
      "ui-selectmenu-menu": "groups",
      "ui-selectmenu-button": "icon",
    },
  }).iconsselectmenu("menuWidget").addClass("ui-menu-icons");
  $("#libraryDialog .kindSelector").iconsselectmenu({
    icons: { button: "ph:funnel" },
    select: (event, { item }) => {
      if (!event.currentTarget) return;
      selectKind(item, !item.element.attr("data-checked"), true);
      $("#libraryDialog .kindSelector").iconsselectmenu('preventClose');
    },
    classes: {
      "ui-selectmenu-menu": "groups",
      "ui-selectmenu-button": "icon",
    },
  }).iconsselectmenu("menuWidget").addClass("ui-menu-icons");
  $(".downloadSelector").iconsselectmenu({
    icons: { button: "ph:download-simple" },
    select: (event, { item }) => {
      download(item, item.element.attr("data-role"));
    },
    classes: {
      "ui-selectmenu-button": "icon",
    },
  });
  $(".formatSelector").selectmenu({
    change: (event, { item }) => {
      setFormat(item.value);
    },
    classes: {
      "ui-selectmenu-button": "text",
    },
  });
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

  let format;
  function setFormat(format) {
    $('#library').DataTable().rows().every(function() {
      const file = this.data().files.find(file => file.url.endsWith(`.${format}`));
      this.data({ ...this.data(), url: file?.url, size: file?.size ? size(file.size) : '' });
    });
    $('.formatSelector').val(format).selectmenu('refresh');
    localStorage.setItem('format', format);
  }
  user.then(user => {
    $('.formatSelector')
      .find(`option[value='flac']`).prop('disabled', !user.flac).end()
      .find(`option[value='mp3']`).prop('disabled', !user.mp3).end()
      .selectmenu('refresh');
    format = localStorage.getItem('format') || (user.mp3 ? 'mp3' : 'flac');
    if (user.demo) $('#library').addClass('demo');
  });

  async function download(item, type) {
    const downloader = {
      'downloadOriginal': downloadOriginal,
      'downloadWav': downloadWav,
    }[type];
    const data = $('#library').DataTable().rows('.selected').data().toArray();
    for (let track of data) {
      await downloader?.(track.url, trackTitle(track));
      $('#library').DataTable().rows((row, data) => data.url === track.url).nodes().to$().removeClass('selected');
      updateSelection();
    }
  }

  const DEFAULT_COLUMNS = {
    game: true,
    track: false,
    ordinal: true,
    kind: false,
    title: true,
    subtitle: false,
    artist: false,
    platform: false,
    year: false,
    time: true,
    size: false,
    originalSize: false,
  };
  const currentColumns = {
    ...DEFAULT_COLUMNS,
    ...JSON.parse(localStorage.getItem('columns') ?? '{}'),
  };
  function selectColumn(item, selected) {
    if (selectMultiple(item, selectColumn, DEFAULT_COLUMNS)) return;
    toggleIcon(item, selected);
    $('#library').DataTable().column(`${item.value}:name`).visible(selected);
    currentColumns[item.value] = selected;
    localStorage.setItem('columns', JSON.stringify(currentColumns));
  }

  function selectKind(item, selected, update) {
    if (selectMultiple(item, selectKind, DEFAULT_KINDS)) return;
    toggleIcon(item, selected);
    currentKinds[item.value] = selected;
    const regexp = Object.entries(currentKinds).filter(([kind, selected]) => selected).map(([kind]) => KIND_MAPPING[kind] ?? '\\?').join('|');
    $('#library').DataTable().column('kind:name').search(regexp === '' ? '.^' : regexp, true).draw();
    if (update)
      browserOptions.kinds = currentKinds;
  }

  function rowsStats(selector, zero) {
    const rows = $('#library').DataTable().rows(selector);
    const total = time(rows.data().toArray().map(data => data.timeSec).reduce((total, time) => total+(time??0), 0));
    return !zero && rows[0].length === 0 ? null : `${rows[0].length} [${total}]`;
  }
  function updateInfo() {
    $('#libraryDialog .info').text(`Showing ${rowsStats({ search: 'applied' }, true)} tracks`);
  };
  const updateAddToPlaylist = () => {
    const emptySelection = $('#library').DataTable().$('tr.selected').length === 0;
    $('#libraryDialog .addToPlaylist').button({ disabled: emptySelection || !hasPlaylist });
  };
  let hasPlaylist = false;
  playlistLoaded.then(() => {
    hasPlaylist = true;
    updateAddToPlaylist();
  });
  const updateSelection = () => {
    updateAddToPlaylist();
    const emptySelection = $('#library').DataTable().$('tr.selected').length === 0;
    $('#libraryDialog .downloadSelector').iconsselectmenu('option', 'disabled', emptySelection);
    const stats = rowsStats('.selected', false);
    $('#libraryDialog .status').text(stats == null ? '' : `Selected: ${stats}`);
  };
  updateSelectionGlobal = updateSelection;
  updateSelection();
  const unselectAll = () => {
    $('#library').DataTable().$('tr').removeClass('selected');
    updateSelection();
  };
  $('#library tbody').on('click', 'tr', function () {
    $(this).toggleClass('selected');
    updateSelection();
  });
  $('#libraryDialog .selectAll').click(() => {
    $($('#library').DataTable().rows({ search: 'applied' }).nodes()).addClass('selected');
    updateSelection();
  });
  $('#libraryDialog .unselectAll').click(() => {
    unselectAll();
  });
  $('#libraryDialog .addToPlaylist').click(() => {
    const data = $('#library').DataTable().rows('.selected').data().toArray();
    import('./playlist.js').then(({ playlistController }) => {
      playlistController.addPlaylist(data.map(playerEntry), true);
    });
    unselectAll();
  });
  function playerEntry({ url, platform, game, title, timeSec, originalTimeSec, year, artist }) {
    return {
      url, platform, game, title,
      time: timeSec, duration: originalTimeSec ? timeSec : undefined,
      replayGain: currentTracksDb.find(
        entry => entry.platform === platform && entry.game === game && entry.title === title
      )?.replayGain,
      year, artist,
    };
  }

  Object.entries(currentColumns).forEach(([column, selected]) => {
    selectColumn({ value: column, element: $(`.columnSelector option[value='${column}']`) }, selected);
  });
  let currentKinds;
  function updateKinds() {
    currentKinds = browserOptions.kinds;
    Object.entries(currentKinds).forEach(([kind, selected]) => {
      selectKind({ value: kind, element: $(`#libraryDialog .kindSelector option[value='${kind}']`) }, selected, false);
    });
  }
  browserOptions.addEventListener('kinds', updateKinds);
  updateKinds();

  player.addEventListener('entry', ({ detail: { url } }) => {
    $('#library').DataTable().rows().nodes().to$().find('button.ui-state-active').removeClass('ui-state-active')
      .css('background-size', 0)
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
    $('#library').DataTable().rows((row, data) => data.url === url).nodes().to$().find('button.listen').addClass('ui-state-active');
  });
  player.addEventListener('play', () => {
    isPlaying = true;
    $('#library').DataTable().rows().nodes().to$().find('button.ui-state-active')
      .attr('title', 'Pause')
      .find('iconify-icon').attr('icon', ICON_PAUSE);
  });
  player.addEventListener('pause', () => {
    isPlaying = false;
    $('#library').DataTable().rows().nodes().to$().find('button.ui-state-active')
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
  });
  player.addEventListener('timeupdate', () => {
    $('#library').DataTable().rows().nodes().to$().find('button.ui-state-active')
      .css('background-size', `${player.currentTime / player.duration * 100}%`);
  });

  subscribeState(updateState);
  let currentTracksDb;
  function updateState(state) {
    if (!state.game || !tracksIndex[state.platform]?.[state.game]) {
      $('#library').DataTable().rows().remove().draw();
      return;
    }
    loadEntry(state.platform, state.game, tracksIndex[state.platform][state.game]).then(tracks => {
      currentTracksDb = tracks;
      $('#library').DataTable().rows().remove().draw();
      $('#library').DataTable().rows.add(tracks.map(track => ({
        play: `
          <button class="listen ui-button ui-button-icon-only progressive" title="Play">
            <iconify-icon icon="${ICON_PLAY}"></iconify-icon>
            <span class="demo">DEMO</span
          </button>
        `,
        game: track.game,
        gameTitle: track.game.split(': ')[0],
        gameSubtitle: track.game.split(': ')[1] ?? '',
        title: track.title,
        subtitle: track.subtitle ?? '',
        artist: track.artist,
        track: track.tracknumber,
        timeSec: track.time,
        time: track.time ? time(track.time) : '',
        originalTimeSec: track.originalTime,
        originalSize: size(track.originalSize),
        files: track.files,
        size: '',
        url: '',
        platform: track.platform,
        year: track.year,
        ordinal: track.ordinal,
        kind: KIND_MAPPING[track.kind] ?? '?',
      }))).draw();
      if (player.track)
        setTimeout(() => {
          const button = $('#library').DataTable().rows((row, data) => data.url === player.track.url).nodes().to$().find('button.listen').addClass('ui-state-active');
          if (isPlaying)
            button
              .attr('title', 'Pause')
              .find('iconify-icon').attr('icon', ICON_PAUSE);
        });
      setFormat(format);
    });
  }
});

function setLoading(loading) {
  $('#libraryDialog .loader')
    .toggleClass('on', loading)
    .toggleClass('off', !loading);
}

async function loadEntry(platform, game, index) {
  setLoading(true);
  try {
    return await loadGamesTracks(platform, game, index);
  } finally {
    setLoading(false);
  }
}

let updateSelectionGlobal = () => {};

export function setSelection(tracks) {
  $('#library').DataTable().rows().toArray().forEach(rows => {
    rows.forEach(row => {
      const selected = !!tracks.find(({ title }) => title === $('#library').DataTable().row(row).data().title);
      $('#library').DataTable().row(row).nodes().to$().toggleClass('selected', selected);
    });
  });
  updateSelectionGlobal();
}
