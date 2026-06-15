'use strict';

import { user } from './login.js';
import { player } from './player.js';
import { dialogOptions, initDialog, scrollToChild, showDialog, time, trackTitle } from './utils.js';

$('#playlistDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 400,
  position: { my: "left top", at: "left+15% top+10%", of: window },
  resize: (e, { size: { height } }) => {
    resizeTable(height);
  },
});
initDialog($('#playlistDialog'), { icon: 'ph:playlist' });

export function show() {
  showDialog($('#playlistDialog'));
}

function resizeTable(height) {
  const body = $('#playlist_wrapper .dataTables_scrollBody');
  body.css('max-height', height - body.position().top - 70);
}

const ICON_PLAY = 'ph:play-fill';
const ICON_PAUSE = 'ph:pause-fill';

let isPlaying = false;

const KINDS = ['track', 'short', 'jingle', 'ambient', 'story'];
const KINDS_SYMBOLS = { T: 'track', S: 'short', J: 'jingle', A: 'ambient', Y: 'story' };
const durationPrefs = JSON.parse(localStorage.getItem('playlistDurations') ?? '{}');
const saveDurationPrefs = () => {
  localStorage.setItem('playlistDurations', JSON.stringify(durationPrefs));
};
KINDS.forEach(kind => {
  durationPrefs[kind] ??= {};
  durationPrefs[kind].method ??= 'original';
  durationPrefs[kind].duration ??= 60;
});

const trackDuration = track => {
  let duration;
  const prefs = durationPrefs[KINDS_SYMBOLS[track.kind]];
  switch (prefs.method) {
  case 'exact':
    duration = prefs.duration;
    break;
  case 'gte':
    duration = Math.max(prefs.duration, track.time);
    break;
  case 'lte':
    duration = Math.min(prefs.duration, track.time);
    break;
  }
  return { ...track, duration };
};

setTimeout(() => {
  setTimeout(() => {
    resizeTable($('#playlistDialog').parent().height());
  });
  $('#playlist').DataTable({
    columns: [
      { name: "play", data: "play", title: "Play", orderable: false, width: "10%" },
      { name: "no", data: "no", title: "No", orderable: false, width: "10%" },
      { name: "title", data: "title", title: "Title", orderable: false },
      { name: "time", data: "time", title: "Time", orderable: false, width: "10%" },
      { name: "timeSec", data: "timeSec", title: "Time Sec", visible: false },
      { name: "url", data: "url", title: "URL", visible: false },
    ],
    order: [1, 'asc'],
    paging: false,
    scrollX: true,
    scrollY: $('#playlistDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">frt<"info"><"status">p',
    initComplete: () => {
      updateInfo();
    },
    language: {
      emptyTable: "Playlist empty",
    },
  }).on('search.dt', () => {
    unselectAll();
    updateInfo();
  });

  $('#playlist tbody').on('focus', 'button', (event) => {
    event.stopPropagation();
  });
  $('#playlist tbody').on('click', 'button.listen', (event) => {
    event.stopPropagation();
    const loaded = $(event.currentTarget).hasClass('ui-state-active');
    if (!loaded) {
      const data = $('#playlist').DataTable().row($(event.target).parents('tr')).data();
      playlistController.updatePlaylist(true);
      player.load(data.no-1);
    } else if (isPlaying) player.pause();
    else player.play();
  });

  $('#playlistDialog .operations').append($(`
    <button class="selectAll ui-button ui-button-icon-only" title="Select all">
      <iconify-icon icon="ph:check-square"></iconify-icon>
    </button>
    <button class="unselectAll ui-button ui-button-icon-only" title="Clear selection">
      <iconify-icon icon="ph:square"></iconify-icon>
    </button>
    <button class="remove ui-button ui-button-icon-only" title="Remove selected">
      <iconify-icon icon="ph:x-bold"></iconify-icon>
    </button>
    <button class="moveUp ui-button ui-button-icon-only" title="Move selected up">
      <iconify-icon icon="ph:caret-up-fill"></iconify-icon>
    </button>
    <button class="moveDown ui-button ui-button-icon-only" title="Move selected down">
      <iconify-icon icon="ph:caret-down-fill"></iconify-icon>
    </button>
    <button class="durations ui-button ui-button-icon-only" title="Track durations...">
      <iconify-icon icon="ph:timer"></iconify-icon>
    </button>
  `));

  user.then(user => {
    if (user.demo) $('#playlist').addClass('demo');
  });

  function rowsStats(selector, zero) {
    const rows = $('#playlist').DataTable().rows(selector);
    const total = time(rows.data().toArray().map(data => data.timeSec).reduce((total, time) => total+(time??0), 0));
    return !zero && rows[0].length === 0 ? null : `${rows[0].length} [${total}]`;
  }
  function updateInfo() {
    $('#playlistDialog .info').text(`Showing ${rowsStats({ search: 'applied' }, true)} tracks`);
  };
  const updateSelection = () => {
    const disabled = $('#playlist').DataTable().$('tr.selected').length === 0;
    const firstSelected = $('#playlist').DataTable().$('tr').filter(':first.selected').length > 0;
    const lastSelected = $('#playlist').DataTable().$('tr').filter(':last.selected').length > 0;
    $('#playlistDialog .remove').button({ disabled });
    $('#playlistDialog .moveUp').button({ disabled: disabled || firstSelected });
    $('#playlistDialog .moveDown').button({ disabled: disabled || lastSelected });
    const stats = rowsStats('.selected', false);
    $('#playlistDialog .status').text(stats == null ? '' : `Selected: ${stats}`);
  };
  updateSelection();
  const unselectAll = () => {
    $('#playlist').DataTable().$('tr').removeClass('selected');
    updateSelection();
  };
  $('#playlist tbody').on('click', 'tr', function () {
    $(this).toggleClass('selected');
    updateSelection();
  });
  $('#playlistDialog .selectAll').click(() => {
    $($('#playlist').DataTable().rows({ search: 'applied' }).nodes()).addClass('selected');
    updateSelection();
  });
  $('#playlistDialog .unselectAll').click(() => {
    unselectAll();
  });
  $('#playlistDialog .remove').click(() => {
    playlistController.remove();
    unselectAll();
  });
  $('#playlistDialog .moveUp').click(() => {
    playlistController.moveUp();
    updateSelection();
  });
  $('#playlistDialog .moveDown').click(() => {
    playlistController.moveDown();
    updateSelection();
  });
  $('#playlistDialog .durations').click(() => {
    showDialog($('#playlistDurationsDialog'));
  });

  $('#playlistDurationsDialog').dialog({
    ...dialogOptions,
    width: 400,
    height: 400,
  });
  initDialog($('#playlistDurationsDialog'), { icon: 'ph:timer' });
  $.widget('ui.timespinner', $.ui.spinner, {
    _format: value => {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      const paddedSeconds = seconds < 10 ? '0' + seconds : seconds;
      return `${minutes}:${paddedSeconds}`;
    },
    _parse: value => {
      if (typeof value === 'number') return value;
      const parts = value.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (!isNaN(minutes) && !isNaN(seconds)) {
          return minutes * 60 + seconds;
        }
      }
    },
  });

  KINDS.forEach(kind => {
    $('#playlistDurationsDialog .container').append(
      $($('#playlistDurationsRow').prop('content').cloneNode(true))
        .find('.kind').text(kind).end()
        .find('.method').val(durationPrefs[kind].method).end()
    );
    $('#playlistDurationsDialog .container').children().last()
      .find('.method').selectmenu({
        change: (event, { item: { value } }) => {
          durationPrefs[kind].method = value;
          saveDurationPrefs();
          $(event.target).closest('.row')
            .find('.ui-spinner').css('visibility', value === 'original' ? 'hidden' : '');
        },
      }).end()
      .find('.duration').timespinner({
        step: 1,
        min: 0,
        stop: event => {
          const value = $(event.target).timespinner('value');
          durationPrefs[kind].duration = value;
          saveDurationPrefs();
        },
      })
      .end();
    $('#playlistDurationsDialog .container').children().last()
      .find('.duration').timespinner('value', durationPrefs[kind].duration).end()
      .find('.ui-spinner').css('visibility', durationPrefs[kind].method === 'original' ? 'hidden' : '').end();
  });
  $('#playlistDurationsDialog .apply').on('click', () => {
    playlistController.updateDurations();
  });

  player.addEventListener('entry', ({ detail: { entry } }) => {
    $('#playlist').DataTable().rows().nodes().to$().find('button.ui-state-active').removeClass('ui-state-active')
      .css('background-size', 0)
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
    if (player.playlist.name !== 'default') return;
    $('#playlist').DataTable().rows((row, data) => data.no-1 === entry).nodes().to$().find('button.listen').addClass('ui-state-active');
  });
  player.addEventListener('play', () => {
    isPlaying = true;
    $('#playlist').DataTable().rows().nodes().to$().find('button.ui-state-active')
      .attr('title', 'Pause')
      .find('iconify-icon').attr('icon', ICON_PAUSE);
  });
  player.addEventListener('pause', () => {
    isPlaying = false;
    $('#playlist').DataTable().rows().nodes().to$().find('button.ui-state-active')
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
  });
  player.addEventListener('timeupdate', () => {
    $('#playlist').DataTable().rows().nodes().to$().find('button.ui-state-active')
      .css('background-size', `${player.currentTime / player.duration * 100}%`);
  });

  playlistController.init($('#playlist').DataTable());
});

class PlaylistController {
  constructor() {
    this.playlist = [];
    this.play = `
      <button class="listen ui-button ui-button-icon-only progressive" title="Play">
        <iconify-icon icon="${ICON_PLAY}"></iconify-icon>
        <span class="demo">DEMO</span
      </button>
    `;
    this.entry = undefined;
  }
  init(table) {
    this.table = table;
    const playlist = JSON.parse(localStorage.getItem('playlist') ?? '[]');
    const initialPlaylist = Array.isArray(playlist) ? { name: 'default', entries: playlist } : playlist;
    this.addPlaylist(initialPlaylist.entries, false);
  }
  addPlaylist(playlist, interactive) {
    if (!this.table) return;
    this.entry = undefined;
    playlist.forEach(originalTrack => {
      const track = interactive ? trackDuration(originalTrack) : originalTrack;
      const timeSec = track.duration ?? track.time;
      this.playlist.push(track);
      this.table.row.add({
        play: this.play,
        no: this.playlist.length,
        title: trackTitle(track),
        time: timeSec ? time(timeSec) : '',
        timeSec,
        url: track.url,
      });
    });
    this.table.draw(false);
    this.updatePlaylist(false);
    if (interactive)
      scrollToChild($('#playlist').parent().get(0), this.table?.row(':last').node());
  }
  updatePlaylist(forcePlayerUpdate) {
    if (forcePlayerUpdate || player.playlist.name === 'default')
      player.setPlaylist({ name: 'default', entries: this.playlist }, this.entry);
    localStorage.setItem('playlist', JSON.stringify(this.playlist));
  }
  remove() {
    this.entry = player.entry;
    const indexes = new Set(this.table.rows('.selected').data().toArray().map(row => row.no-1));
    if (indexes.has(player.entry)) this.entry = null;
    if (this.entry != null) this.entry -= [...indexes].filter(i => i < player.entry).length;
    this.playlist = this.playlist.filter((_, i) => !indexes.has(i));
    this.table.rows('.selected').remove().draw(false);
    this.renumber();
    this.updatePlaylist(false);
  }
  renumber() {
    this.table.cells(null, 'no:name').every(function(i) {
      this.data(i+1);
    });
  }
  moveRow(from, to) {
    if (this.entry === from) this.entry = to;
    else if (this.entry === to) this.entry = from;
    const entry1 = this.playlist[from];
    const entry2 = this.playlist[to];
    this.playlist[from] = entry2;
    this.playlist[to] = entry1;
    ['title', 'time', 'timeSec', 'url'].forEach(field => {
      const v1 = this.table.cell(from, `${field}:name`).data();
      const v2 = this.table.cell(to, `${field}:name`).data();
      this.table.cell(from, `${field}:name`).data(v2);
      this.table.cell(to, `${field}:name`).data(v1);
    });
    const active1 = this.table.cell(from, 'play:name').nodes().to$().find('button.ui-state-active').length > 0;
    const active2 = this.table.cell(to, 'play:name').nodes().to$().find('button.ui-state-active').length > 0;
    this.table.cell(from, 'play:name').nodes().to$().find('button').toggleClass('ui-state-active', active2)
      .css('background-size', 0)
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
    this.table.cell(to, 'play:name').nodes().to$().find('button').toggleClass('ui-state-active', active1)
      .css('background-size', 0)
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
    if (isPlaying)
      this.table.rows().nodes().to$().find('button.ui-state-active')
        .attr('title', 'Pause')
        .find('iconify-icon').attr('icon', ICON_PAUSE);
    $(this.table.row(from).node()).removeClass('selected');
    $(this.table.row(to).node()).addClass('selected');
  }
  moveUp() {
    this.entry = player.entry;
    this.table.rows('.selected').indexes().toArray().forEach(i => {
      this.moveRow(i, i-1);
    });
    this.renumber();
    this.updatePlaylist(false);
  }
  moveDown() {
    this.entry = player.entry;
    this.table.rows('.selected').indexes().toArray().reverse().forEach(i => {
      this.moveRow(i, i+1);
    });
    this.renumber();
    this.updatePlaylist(false);
  }
  updateDurations() {
    this.playlist.forEach((oldTrack, i) => {
      const track = trackDuration(oldTrack);
      this.playlist[i] = track;
      const timeSec = track.duration ?? track.time;
      this.table.cell(i, 'timeSec:name').data(timeSec);
      this.table.cell(i, 'time:name').data(timeSec ? time(timeSec) : '');
    });
    this.updatePlaylist(false);
  }
}
export const playlistController = new PlaylistController();
