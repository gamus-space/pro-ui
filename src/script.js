'use strict';

import { loadDb } from './db.js';
import { Player } from './player.js';

let db = {};
loadDb().then(data => {
  db = Object.fromEntries(data.map(track => [track.href, track]));
  $('#library').DataTable({
    data: data.map(track => ({
      play: `
        <button class="listen ui-button ui-button-icon-only">
          <span class="ui-icon ui-icon-circle-triangle-e"></span>
        </button>
      `,
      game: track.game,
      title: track.title,
      href: track.href,
    })),
    columns: [
      { name: "play", data: "play", title: "Play", orderable: false },
      { name: "game", data: "game", title: "Game" },
      { name: "title", data: "title", title: "Title" },
    ],
    order: [1, 'asc'],
    paging: false,
    scrollY: $('#libraryDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">flrti<"status">p',
    createdRow: (row, data) => {
      $('td', row).eq(0).find('button').click(event => {
        event.stopPropagation();
        play(data.href, null);
      });
    },
    language: {
      infoFiltered: '(_MAX_ total)',
    },
  }).on('search.dt', () => {
    libraryUnselectAll();
  });
  $('#libraryDialog .operations').append($(`
    <button class="selectAll ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-bullet"></span>
    </button>
    <button class="unselectAll ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-radio-off"></span>
    </button>
    <button class="addToPlaylist ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-circle-plus"></span>
    </button>
  `));
  const libraryUpdateSelection = () => {
    $('#libraryDialog .addToPlaylist').button({ disabled: $('#library').DataTable().$('tr.selected').length === 0 });
    const selected = $('#library').DataTable().rows('.selected')[0].length;
    $('#libraryDialog .status').text(selected === 0 ? '' : `${selected} selected`);
  };
  libraryUpdateSelection();
  const libraryUnselectAll = () => {
    $('#library').DataTable().$('tr').removeClass('selected');
    libraryUpdateSelection();
  };
  $('#library tbody').on('click', 'tr', function () {
    $(this).toggleClass('selected');
    libraryUpdateSelection();
  });
  $('#libraryDialog .selectAll').click(() => {
    $($('#library').DataTable().rows({ search: 'applied' }).nodes()).addClass('selected');
    libraryUpdateSelection();
  });
  $('#libraryDialog .unselectAll').click(() => {
    libraryUnselectAll();
  });
  $('#libraryDialog .addToPlaylist').click(() => {
    const data = $('#library').DataTable().rows('.selected').data().toArray();
    data.forEach(row => {
      playlistController.add(row.href);
    });
    libraryUnselectAll();
  });
});

setTimeout(() => {
  $('#playlist').DataTable({
    columns: [
      { name: "play", data: "play", title: "Play", orderable: false },
      { name: "no", data: "no", title: "No", orderable: false },
      { name: "href", data: "href", title: "href", orderable: false },
    ],
    order: [1, 'asc'],
    paging: false,
    scrollY: $('#playlistDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">flrti<"status">p',
    createdRow: (row, data) => {
      $('td', row).eq(0).find('button').click(event => {
        event.stopPropagation();
        play(data.href, $('#playlist').DataTable().row(row).index());
      });
    },
    language: {
      infoFiltered: '(_MAX_ total)',
    },
  }).on('search.dt', () => {
    playlistUnselectAll();
  });
  $('#playlistDialog .operations').append($(`
    <button class="selectAll ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-bullet"></span>
    </button>
    <button class="unselectAll ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-radio-off"></span>
    </button>
    <button class="remove ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-circle-close"></span>
    </button>
    <button class="moveUp ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-circle-triangle-n"></span>
    </button>
    <button class="moveDown ui-button ui-button-icon-only">
      <span class="ui-icon ui-icon-circle-triangle-s"></span>
    </button>
  `));
  const playlistUpdateSelection = () => {
    const disabled = $('#playlist').DataTable().$('tr.selected').length === 0;
    const firstSelected = $('#playlist').DataTable().$('tr').filter(':first.selected').length > 0;
    const lastSelected = $('#playlist').DataTable().$('tr').filter(':last.selected').length > 0;
    $('#playlistDialog .remove').button({ disabled });
    $('#playlistDialog .moveUp').button({ disabled: disabled || firstSelected });
    $('#playlistDialog .moveDown').button({ disabled: disabled || lastSelected });
    const selected = $('#playlist').DataTable().rows('.selected')[0].length;
    $('#playlistDialog .status').text(selected === 0 ? '' : `${selected} selected`);
  };
  playlistUpdateSelection();
  const playlistUnselectAll = () => {
    $('#playlist').DataTable().$('tr').removeClass('selected');
    playlistUpdateSelection();
  };
  $('#playlist tbody').on('click', 'tr', function () {
    $(this).toggleClass('selected');
    playlistUpdateSelection();
  });
  $('#playlistDialog .selectAll').click(() => {
    $($('#playlist').DataTable().rows({ search: 'applied' }).nodes()).addClass('selected');
    playlistUpdateSelection();
  });
  $('#playlistDialog .unselectAll').click(() => {
    playlistUnselectAll();
  });
  $('#playlistDialog .remove').click(() => {
    playlistController.remove();
    playlistUnselectAll();
  });
  $('#playlistDialog .moveUp').click(() => {
    playlistController.moveUp();
    playlistUpdateSelection();
  });
  $('#playlistDialog .moveDown').click(() => {
    playlistController.moveDown();
    playlistUpdateSelection();
  });
  playlistController = new PlaylistController($('#playlist').DataTable());
});

class PlaylistController {
  constructor(table) {
    this.playlist = [];
    this.table = table;
    this.play = `
      <button class="listen ui-button ui-button-icon-only">
        <span class="ui-icon ui-icon-circle-triangle-e"></span>
      </button>
    `;
  }
  updatePlaylist() {
    player.playlist = this.playlist.slice();
    updateEntry();
    $('.entry .total').text(this.playlist.length);
  }
  add(href) {
    this.playlist.push(href);
    this.table.row.add({ play: this.play, no: this.playlist.length, href }).draw(false);
    this.updatePlaylist();
  }
  remove() {
    const indexes = new Set(this.table.rows('.selected').data().toArray().map(row => row.no-1));
    if (indexes.has(player.entry)) player.entry = null;
    if (player.entry != null) player.entry -= [...indexes].filter(i => i < player.entry).length;
    this.playlist = this.playlist.filter((href, i) => !indexes.has(i));
    this.table.rows('.selected').remove().draw(false);
    this.renumber();
    this.updatePlaylist();
  }
  renumber() {
    this.table.cells(null, 'no:name').every(function(i) {
      this.data(i+1);
    });
  }
  moveRow(from, to) {
    if (player.entry === from) player.entry = to;
    else if (player.entry === to) player.entry = from;
    const entry1 = this.playlist[from];
    const entry2 = this.playlist[to];
    this.playlist[from] = entry2;
    this.playlist[to] = entry1;
    const href1 = this.table.cell(from, 'href:name').data();
    const href2 = this.table.cell(to, 'href:name').data();
    this.table.cell(from, 'href:name').data(href2);
    this.table.cell(to, 'href:name').data(href1);
    $(this.table.row(from).node()).removeClass('selected');
    $(this.table.row(to).node()).addClass('selected');
  }
  moveUp() {
    this.table.rows('.selected').indexes().toArray().forEach(i => {
      this.moveRow(i, i-1);
    });
    this.renumber();
    this.updatePlaylist();
  }
  moveDown() {
    this.table.rows('.selected').indexes().toArray().reverse().forEach(i => {
      this.moveRow(i, i+1);
    });
    this.renumber();
    this.updatePlaylist();
  }
}
let playlistController;

class Controls {
  constructor() {
    this._canplay = false;
    this._paused = true;
    this._loop = false;
    this._duration = 0;
    this._position = 0;
    this.seeking = false;
    Object.seal(this);
  }
  get canplay() {
    return this._canplay;
  }
  set canplay(v) {
    this._canplay = v;
    $('.play').button('option', 'disabled', !this._canplay);
  }
  get paused() {
    return this._paused;
  }
  set paused(v) {
    this._paused = v;
    $('.play .ui-icon').toggleClass('ui-icon-play', this._paused);
    $('.play .ui-icon').toggleClass('ui-icon-pause', !this._paused);
  }
  get loop() {
    return this._loop;
  }
  set loop(v) {
    this._loop = v;
  }
  get duration() {
    return this._duration;
  }
  set duration(v) {
    this._duration = v;
    $('.duration').text(this.time(v));
    $('.controls .seek').slider('option', 'max', this._duration);
  }
  get position() {
    return this._position;
  }
  set position(v) {
    this._position = v;
    $('.position').text(this.time(v));
    if (!this.seeking)
      $('.controls .seek').slider('value', this._position);
  }

  time(t) {
    t = Math.floor(t)
    const sec = t % 60;
    const min = Math.floor(t/60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}

const player = new Player();
const controls = new Controls();
player.on('canplay', () => {
  controls.canplay = true;
  controls.duration = player.duration;
});
player.on('play', () => {
  controls.paused = false;
});
player.on('pause', () => {
  controls.paused = true;
});
player.on('ended', () => {
});
player.on('timeupdate', (e) => {
  controls.position = player.currentTime;
});
player.on('entry', ({ href }) => {
  const track = db[href];
  $('.title').text(`${track.game} - ${track.title}`);
  updateEntry();
});
function updateEntry() {
  $('.entry').toggle(player.entry != null);
  $('.entry .pos').text(player.entry+1);
}

function play(href, entry) {
  player.entry = entry;
  player.load(href, true);
  console.log('play', href, entry);
}

$('#playlistDialog').dialog({
  width: 400,
  height: 400,
  position: { my: "left", at: "left+5% center", of: window },
  beforeClose: function (e) {
    e.preventDefault();
    const c = $(this).dialog("option", "classes.ui-dialog");
    $(this).dialog("option", "classes.ui-dialog", c === 'hidden' ? '' : 'hidden');
  },
  resize: (e, { size: { height } }) => {
    $('#playlist_wrapper .dataTables_scrollBody').css('max-height', height - 132 + 5);
  },
});
$('#playerDialog').dialog({
  width: 'auto',
  position: { my: "center", at: "center", of: window },
  beforeClose: function (e) {
    e.preventDefault();
    const c = $(this).dialog("option", "classes.ui-dialog");
    $(this).dialog("option", "classes.ui-dialog", c === 'hidden' ? '' : 'hidden');
  },
});
$('#libraryDialog').dialog({
  width: 400,
  height: 400,
  position: { my: "right", at: "right-5% center", of: window },
  beforeClose: function (e) {
    e.preventDefault();
    const c = $(this).dialog("option", "classes.ui-dialog");
    $(this).dialog("option", "classes.ui-dialog", c === 'hidden' ? '' : 'hidden');
  },
  resize: (e, { size: { height } }) => {
    $('#library_wrapper .dataTables_scrollBody').css('max-height', height - 132 + 5);
  },
});
$('.ui-dialog-titlebar button').blur();

$('input[type=checkbox]').checkboxradio({
  icon: false,
});
$('.play').button({ disabled: true });
$('.controls .seek').slider({
  value: 0,
  min: 0,
  max: 0,
  step: 1,
  orientation: "horizontal",
  range: "min",
  animate: "fast",
});
$('.controls .volume').slider({
  value: 1,
  min: 0,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  range: "min",
  animate: "fast",
});
$('.controls .stereo').slider({
  value: 1,
  min: -1,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  animate: "fast",
});

$('.volume-min').click(() => {
  $('.controls .volume').slider('value', 0);
});
$('.volume-max').click(() => {
  $('.controls .volume').slider('value', 1);
});
$('.stereo-rev').click(() => {
  $('.controls .stereo').slider('value', -1);
});
$('.mono').click(() => {
  $('.controls .stereo').slider('value', 0);
});
$('.stereo-full').click(() => {
  $('.controls .stereo').slider('value', 1);
});

$('.play').click(() => {
  if (controls.paused) player.play();
  else player.pause();
});
$('.loop').change(() => {
  controls.loop = !controls.loop;
  player.loop = controls.loop;
});
$('.controls .volume').on('slide', (e, { value }) => {
  player.volume = value;
});
$('.controls .stereo').on('slide', (e, { value }) => {
  player.stereo = value;
});
$('.controls .seek').on('slidestart', () => {
  controls.seeking = true;
});
$('.controls .seek').on('slidestop', () => {
  controls.seeking = false;
});
$('.controls .seek').on('slidechange', (e, { value }) => {
  if (!e.originalEvent) return;
  player.currentTime = value;
});
