'use strict';

import './controls_mini.js';
import './controls.js';
import './library.js';
import './playlist.js';
import { db, dbLoaded } from './db.js';
import { player } from './player.js';

$('#miniPlayerDialog').dialog('moveToTop');
$('#playerDialog').dialog('moveToTop');

$('#desktop .background').click(() => {
  import('./background.js');
});

export function setPlaylist(urls, entry) {
  player.setPlaylist(urls.map(url => ({ url, replayGain: db[url].replayGain?.album })), entry);
  localStorage.setItem('playlist', JSON.stringify(urls));
}

export function setPlayerOptions({ volume, stereo, loop }) {
  if (loop != null) {
    player.loop = loop;
    localStorage.setItem('loop', loop);
  }
  if (volume != null) {
    player.volume = volume;
    localStorage.setItem('volume', volume);
  }
  if (stereo != null) {
    player.stereo = stereo;
    localStorage.setItem('stereo', stereo);
  }
}

player.volume = localStorage.getItem('volume') == null ? 1 : parseFloat(localStorage.getItem('volume'));
player.stereo = localStorage.getItem('stereo') == null ? 1 : parseFloat(localStorage.getItem('stereo'));;
player.loop = localStorage.getItem('loop') === 'true';
dbLoaded(() => {
  setPlaylist(JSON.parse(localStorage.getItem('playlist') ?? '[]'), undefined);
});
