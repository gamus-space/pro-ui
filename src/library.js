'use strict';

import { loadDb } from './db.js';
import { player } from './player.js';
import { playlistController } from './playlist.js';

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
        player.load(data.href);
      });
    },
    language: {
      infoFiltered: '(_MAX_ total)',
    },
  }).on('search.dt', () => {
    unselectAll();
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

  const updateSelection = () => {
    $('#libraryDialog .addToPlaylist').button({ disabled: $('#library').DataTable().$('tr.selected').length === 0 });
    const selected = $('#library').DataTable().rows('.selected')[0].length;
    $('#libraryDialog .status').text(selected === 0 ? '' : `${selected} selected`);
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

  player.addEventListener('entry', ({ detail: { href } }) => {
    $('#library').DataTable().rows().nodes().to$().find('button.ui-state-active').removeClass('ui-state-active');
    $('#library').DataTable().rows((row, data) => data.href === href).nodes().to$().find('button.listen').addClass('ui-state-active');
  });
});
