'use strict';

import { db, loadDb } from './db.js';
import { player } from './player.js';
import { playlistController } from './playlist.js';
import { dialogOptions, size, time } from './utils.js';

$('#libraryDialog').dialog({
  ...dialogOptions,
  width: 450,
  height: 400,
  position: { my: "right", at: "right-2% center", of: window },
  resize: (e, { size: { height } }) => {
    resizeTable(height);
  },
});
$('.ui-dialog-titlebar button').blur();

function resizeTable(height) {
  const body = $('#library_wrapper .dataTables_scrollBody');
  body.css('max-height', height - body.position().top - 64 + 5);
}

const KIND_MAPPING = {
  track: 'T',
  short: 'S',
  jingle: 'J',
  ambient: 'A',
  story: 'Y',
};

loadDb().then(data => {
  setTimeout(() => {
    resizeTable($('#libraryDialog').parent().height());
  });
  $('#library').DataTable({
    data: data.map(track => ({
      play: `
        <button class="listen ui-button ui-button-icon-only">
          <span class="ui-icon ui-icon-circle-triangle-e"></span>
        </button>
      `,
      game: track.game,
      title: track.title,
      track: track.tracknumber,
      timeSec: track.time,
      time: track.time ? time(track.time) : '',
      size: track.size ? size(track.size) : '',
      url: track.url,
      platform: track.platform,
      year: track.year,
      kind: KIND_MAPPING[track.kind] ?? '?',
    })),
    columns: [
      { name: "play", data: "play", title: "Play", orderable: false },
      { name: "game", data: "game", title: "Game" },
      { name: "track", data: "track", title: "#" },
      { name: "kind", data: "kind", title: "?" },
      { name: "title", data: "title", title: "Title" },
      { name: "platform", data: "platform", title: "Platform" },
      { name: "year", data: "year", title: "Year" },
      { name: "time", data: "time", title: "Time" },
      { name: "size", data: "size", title: "Size" },
    ],
    order: [1, 'asc'],
    paging: false,
    scrollX: true,
    scrollY: $('#libraryDialog').parent()[0].clientHeight - 132,
    scrollCollapse: true,
    dom: '<"operations">flrt<"info"><"status">p',
    initComplete: () => {
      updateInfo();
    },
  }).on('search.dt', () => {
    unselectAll();
    updateInfo();
  });

  $('#library tbody').on('focus', 'button', (event) => {
    event.stopPropagation();
  });
  $('#library tbody').on('click', 'button.listen', (event) => {
    event.stopPropagation();
    const data = $('#library').DataTable().row($(event.target).parents('tr')).data();
    player.load({ url: data.url, replayGain: db[data.url].replayGain?.album });
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
    <select class="columnSelector">
      <option value="game" data-checked="checked">Game</option>
      <option value="track" data-checked="checked"># track</option>
      <option value="kind" data-checked="checked">? kind</option>
      <option value="title" data-checked="checked">Title</option>
      <option value="platform" data-checked="checked">Platform</option>
      <option value="year" data-checked="checked">Year</option>
      <option value="time" data-checked="checked">Time</option>
      <option value="size" data-checked="checked">Size</option>
    </select>
    <select class="kindSelector">
      <option value="track" data-checked="checked">Track</option>
      <option value="short" data-checked="checked">Short</option>
      <option value="jingle" data-checked="checked">Jingle</option>
      <option value="ambient" data-checked="checked">Ambient</option>
      <option value="story" data-checked="checked">storY</option>
    </select>
  `));

  $.widget("custom.iconsselectmenu", $.ui.selectmenu, {
    _renderItem: function(ul, item) {
      var li = $("<li>"),
      wrapper = $("<div>", { text: item.label });
      if (item.disabled)
        li.addClass("ui-state-disabled");
      $("<span>", {
        style: item.element.attr("data-style"),
        'data-value': item.value,
        class: "ui-icon " + (!!item.element.attr("data-checked") ? "ui-icon-check" : "ui-icon-closethick"),
      }).appendTo(wrapper);
      return li.append(wrapper).appendTo(ul);
    }
  });
  $(".columnSelector").iconsselectmenu({
    icons: { button: "ui-icon-gear" },
    select: (event, { item }) => {
      selectColumn(item, !item.element.attr("data-checked"));
    },
  }).iconsselectmenu("menuWidget").addClass("ui-menu-icons");
  $(".kindSelector").iconsselectmenu({
    icons: { button: "ui-icon-wrench" },
    select: (event, { item }) => {
      selectKind(item, !item.element.attr("data-checked"));
    },
  }).iconsselectmenu("menuWidget").addClass("ui-menu-icons");
  function toggleIcon(item, selected) {
    item.element.attr("data-checked", selected ? 'checked' : null);
    const menuId = `${item.element.parent().attr('id')}-menu`;
    $(`ul[id=${menuId}] *[data-value=${item.value}]`)
      .toggleClass("ui-icon-check", selected)
      .toggleClass("ui-icon-closethick", !selected);
  }
  function selectColumn(item, selected) {
    toggleIcon(item, selected);
    $('#library').DataTable().column(`${item.value}:name`).visible(selected);
  }
  const selectedKinds = Object.fromEntries(Object.keys(KIND_MAPPING).map(kind => [kind, true]));
  function selectKind(item, selected) {
    toggleIcon(item, selected);
    selectedKinds[item.value] = selected;
    const regexp = Object.entries(selectedKinds).filter(([kind, selected]) => selected).map(([kind]) => KIND_MAPPING[kind] ?? '\\?').join('|');
    $('#library').DataTable().column('kind:name').search(regexp === '' ? '.^' : regexp, true).draw();
  }
  ['platform', 'year', 'size', 'kind'].forEach(column => {
    selectColumn({ value: column, element: $(`.columnSelector option[value=${column}]`) }, false);
  });

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
