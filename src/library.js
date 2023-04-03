'use strict';

import { loadDb } from './db.js';
import { player } from './player.js';
import { playlistController } from './playlist.js';
import { dialogOptions, time } from './utils.js';

$('#libraryDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 400,
  position: { my: "right", at: "right-5% center", of: window },
  resize: (e, { size: { height } }) => {
    $('#library_wrapper .dataTables_scrollBody').css('max-height', height - 132 + 5);
  },
});
$('.ui-dialog-titlebar button').blur();

loadDb().then(data => {
  $('#library').DataTable({
    data: data.map(track => ({
      play: `
        <button class="listen ui-button ui-button-icon-only">
          <span class="ui-icon ui-icon-circle-triangle-e"></span>
        </button>
      `,
      game: track.game,
      title: track.title,
      timeSec: track.time,
      time: track.time ? time(track.time) : '',
      url: track.url,
    })),
    columns: [
      { name: "play", data: "play", title: "Play", orderable: false },
      { name: "game", data: "game", title: "Game" },
      { name: "title", data: "title", title: "Title" },
      { name: "time", data: "time", title: "Time" },
    ],
    order: [1, 'asc'],
    paging: false,
    scrollY: $('#libraryDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">flrt<"info"><"status">p',
    createdRow: (row, data) => {
      $('td', row).eq(0).find('button').click(event => {
        event.stopPropagation();
        player.load(data.url);
      });
    },
    initComplete: () => {
      updateInfo();
    },
  }).on('search.dt', () => {
    unselectAll();
    updateInfo();
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

  function rowsStats(selector, zero) {
    const rows = $('#library').DataTable().rows(selector);
    const total = time(rows.data().toArray().map(data => data.timeSec).reduce((total, time) => total+(time??0), 0));
    return !zero && rows[0].length === 0 ? null : `${rows[0].length} [${total}]`;
  }
  function updateInfo() {
    $('#libraryDialog .info').text(`Showing ${rowsStats({ search: 'applied' }, true)} tracks`);
  };
  const updateSelection = () => {
    $('#libraryDialog .addToPlaylist').button({ disabled: $('#library').DataTable().$('tr.selected').length === 0 });
    const stats = rowsStats('.selected', false);
    $('#libraryDialog .status').text(stats == null ? '' : `Selected: ${stats}`);
  };
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
    data.forEach(row => {
      playlistController.add(row);
    });
    unselectAll();
  });

  player.addEventListener('entry', ({ detail: { url } }) => {
    $('#library').DataTable().rows().nodes().to$().find('button.ui-state-active').removeClass('ui-state-active');
    $('#library').DataTable().rows((row, data) => data.url === url).nodes().to$().find('button.listen').addClass('ui-state-active');
  });
});
