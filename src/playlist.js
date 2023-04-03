'use strict';

import { player } from './player.js';

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
$('.ui-dialog-titlebar button').blur();

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
        player.entry = $('#playlist').DataTable().row(row).index();
        player.load(data.href, true);
      });
    },
    language: {
      infoFiltered: '(_MAX_ total)',
    },
  }).on('search.dt', () => {
    unselectAll();
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
  const updateSelection = () => {
    const disabled = $('#playlist').DataTable().$('tr.selected').length === 0;
    const firstSelected = $('#playlist').DataTable().$('tr').filter(':first.selected').length > 0;
    const lastSelected = $('#playlist').DataTable().$('tr').filter(':last.selected').length > 0;
    $('#playlistDialog .remove').button({ disabled });
    $('#playlistDialog .moveUp').button({ disabled: disabled || firstSelected });
    $('#playlistDialog .moveDown').button({ disabled: disabled || lastSelected });
    const selected = $('#playlist').DataTable().rows('.selected')[0].length;
    $('#playlistDialog .status').text(selected === 0 ? '' : `${selected} selected`);
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
  playlistController.init($('#playlist').DataTable());
});

class PlaylistController {
  constructor() {
    this.playlist = [];
    this.play = `
      <button class="listen ui-button ui-button-icon-only">
        <span class="ui-icon ui-icon-circle-triangle-e"></span>
      </button>
    `;
  }
  init(table) {
    this.table = table;
  }
  updatePlaylist() {
    player.playlist = this.playlist.slice();
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
export const playlistController = new PlaylistController();
