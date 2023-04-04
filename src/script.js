'use strict';

import { logout } from './login.js';
import { player } from './player.js';

import './login.js';
import './controls_mini.js';
import './controls.js';
import './library.js';
import './playlist.js';
$('#miniPlayerDialog').dialog('moveToTop');
$('#playerDialog').dialog('moveToTop');

$('#desktop .background').click(() => {
  import('./background.js');
});
$('#desktop .logout').click(() => {
  logout().finally(() => {
    location.reload();
  });
});

export function setPlaylist(playlist, entry) {
  player.setPlaylist(playlist, entry);
  localStorage.setItem('playlist', JSON.stringify(playlist));
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
setPlaylist(JSON.parse(localStorage.getItem('playlist') ?? '[]'), undefined);
