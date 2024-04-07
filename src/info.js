'use strict';

import { loadInfo } from './db.js';
import { pushUrl, subscribeState } from './route.js';
import { dialogOptions, fetchAny, initDialog, showDialog } from './utils.js';

import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js';

$.widget("custom.dialogwithoutfocus", $.ui.dialog, {
  _focusTabbable: () => {},
});

$('#infoDialog').dialogwithoutfocus({
  ...dialogOptions,
  width: 500,
  height: 400,
  position: { my: "center", at: "center+15% center+15%", of: window },
});
initDialog($('#infoDialog'), { icon: 'ph:book' });

export function show() {
  showDialog($('#infoDialog'), 'dialogwithoutfocus');
}

let infoIndex = undefined;
let currentState = undefined;
setLoading(true);
loadInfo().then(res => {
  infoIndex = res;
  setLoading(false);
  updateState(currentState);
});

function setView(view) {
  $('#infoDialog .views')
    .find('> *').css('display', 'none').end()
    .find(`.${view}`).css('display', '').end();
}

subscribeState(updateState);
function updateState(state) {
  currentState = state;
  if (!state.game) {
    setView('empty');
    return;
  }
  if (!infoIndex) return;
  const gameIndex = infoIndex[state.platform]?.[state.game];
  if (!gameIndex) {
    setView('missing');
    return;
  }

  setLoading(true);
  fetchAny(gameIndex).then(response => response.text()).then(content => {
    setView('content');
    $('#infoDialog .content')
      .html(marked.parse(content))
      .find('a').filter((i, element) => !element.attributes.href.value.startsWith('/')).attr('target', '_blank').end().end()
      .find('a').filter((i, element) => element.attributes.href.value.startsWith('/')).on('click', event => {
        event.preventDefault();
        pushUrl(event.target.attributes.href.value);
      }).end();
    $('#infoDialog')[0].scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }).finally(() => {
    setLoading(false);
  });
}

function setLoading(loading) {
  $('#infoDialog .loader')
    .toggleClass('on', loading)
    .toggleClass('off', !loading);
}
