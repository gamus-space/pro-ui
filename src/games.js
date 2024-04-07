'use strict';

import { loadGames } from './db.js';
import { pushState, subscribeState } from './route.js';
import { dialogOptions, initDialog, showDialog } from './utils.js';

$('#gamesDialog').dialog({
  ...dialogOptions,
  width: 460,
  height: 400,
  position: { my: "left", at: "left+8% center", of: window },
  resize: (e, { size: { height } }) => {
    resizeTable(height);
  },
});
initDialog($('#gamesDialog'), { icon: 'ph:game-controller' });

export function show() {
  showDialog($('#gamesDialog'));
}

function resizeTable(height) {
  const body = $('#games_wrapper .dataTables_scrollBody');
  body.css('max-height', height - body.position().top - 70);
}

loadGames().then(data => {
  setTimeout(() => {
    resizeTable($('#gamesDialog').parent().height());
  });
  $('#games').DataTable({
    data: data.map(game => ({
      platform: game.platform,
      game: game.game,
      year: game.year,
      artists: game.artists.join(', '),
    })),
    columns: [
      { name: "platform", data: "platform", title: "Platform" },
      { name: "game", data: "game", title: "Game" },
      { name: "year", data: "year", title: "Year" },
      { name: "artists", data: "artists", title: "Artist" },
    ],
    order: [1, 'asc'],
    paging: false,
    scrollX: true,
    scrollY: $('#gamesDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">frt<"info"><"status">p',
    initComplete: () => {
      updateInfo();
    },
  }).on('search.dt', () => {
    updateInfo();
  });

  function rowsStats(selector, zero) {
    const rows = $('#games').DataTable().rows(selector);
    return `${rows[0].length}`;
  }
  function updateInfo() {
    $('#gamesDialog .info').text(`Showing ${rowsStats({ search: 'applied' }, true)} games`);
  };

  $('#games tbody').on('click', 'tr', function () {
    const data = $('#games').DataTable().rows(this).data().toArray()[0];
    pushState({ platform: data.platform, game: data.game }, [data.platform, data.game]);
  });

  subscribeState(updateState);
  function updateState(state) {
    $('#games').DataTable().rows().nodes().to$().removeClass('selected');
    const row = $('#games').DataTable().rows((row, data) => data.platform === state.platform && data.game === state.game).nodes().to$();
    row.addClass('selected');
  }

});