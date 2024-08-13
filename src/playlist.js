'use strict';

import { user } from './login.js';
import { player } from './player.js';
import { initialPlaylist, setPlaylist } from './script.js';
import { dialogOptions, initDialog, showDialog, time, trackTitle } from './utils.js';

$('#playlistDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 400,
  position: { my: "left", at: "left+10% center", of: window },
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
      playlistController.updatePlaylist();
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

  player.addEventListener('entry', ({ detail: { entry } }) => {
    $('#playlist').DataTable().rows().nodes().to$().find('button.ui-state-active').removeClass('ui-state-active')
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

  playlistController.init($('#playlist').DataTable());
});

class PlaylistController {
  constructor() {
    this._skipUpdate = false;
    this._skipScroll = true;
    this.playlist = [];
    this.play = `
      <button class="listen ui-button ui-button-icon-only" title="Play">
        <iconify-icon icon="${ICON_PLAY}"></iconify-icon>
        <span class="demo">DEMO</span
      </button>
    `;
    this.entry = undefined;
    player.addEventListener('playlist', ({ detail: { playlist: { name, entries } } }) => {
      if (!name) return;
      if (this._skipUpdate) {
        this._skipUpdate = false;
        return;
      }
      if (!this.playlist.every((url, i) => url === entries[i].url)) {
        this.table.clear();
        this.playlist = [];
      }
      this.addPlaylist(entries.slice(this.playlist.length));
      if (!this._skipScroll) {
        this.table.row(':last').node()?.scrollIntoView();
      }
      this._skipScroll = false;
      const button = this.table.rows((row, data) => data.no-1 === player.entry).nodes().to$().find('button.listen').addClass('ui-state-active');
      if (isPlaying)
        button
          .attr('title', 'Pause')
          .find('iconify-icon').attr('icon', ICON_PAUSE);
    });
  }
  init(table) {
    this.table = table;
    const entries = player.playlist.name === 'default' ? player.playlist.entries : initialPlaylist.entries;
    this.addPlaylist(entries);
  }
  addPlaylist(playlist) {
    if (!this.table) return;
    this.entry = undefined;
    playlist.forEach(track => {
      this.playlist.push(track);
      this.table.row.add({
        play: this.play,
        no: this.playlist.length,
        title: trackTitle(track),
        time: track.time ? time(track.time) : '',
        timeSec: track.time,
        url: track.url,
      });
    });
    this.table.draw(false);
  }
  updatePlaylist() {
    this._skipUpdate = true;
    setPlaylist({ name: 'default', entries: this.playlist }, this.entry);
  }
  remove() {
    this.entry = player.entry;
    const indexes = new Set(this.table.rows('.selected').data().toArray().map(row => row.no-1));
    if (indexes.has(player.entry)) this.entry = null;
    if (this.entry != null) this.entry -= [...indexes].filter(i => i < player.entry).length;
    this.playlist = this.playlist.filter((_, i) => !indexes.has(i));
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
      .attr('title', 'Play')
      .find('iconify-icon').attr('icon', ICON_PLAY);
    this.table.cell(to, 'play:name').nodes().to$().find('button').toggleClass('ui-state-active', active1)
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
    this.updatePlaylist();
  }
  moveDown() {
    this.entry = player.entry;
    this.table.rows('.selected').indexes().toArray().reverse().forEach(i => {
      this.moveRow(i, i+1);
    });
    this.renumber();
    this.updatePlaylist();
  }
}
export const playlistController = new PlaylistController();
