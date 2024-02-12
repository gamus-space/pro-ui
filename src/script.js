'use strict';

import { logout, user } from './login.js';
import { player } from './player.js';

$.fn.DataTable.ext.pager.numbers_length = 5;

import('./library.js').then(({ show }) => show());
import('./controls.js');

$('#launcher .library').click(() => {
  import('./library.js').then(({ show }) => show());
});
$('#launcher .player').click(() => {
  import('./controls.js').then(({ show }) => show());
});
$('#launcher .playlist').click(() => {
  import('./playlist.js').then(({ show }) => show());
});
$('#launcher .gallery').click(() => {
  import('./gallery.js').then(({ show }) => show());
});
$('#launcher .visualizer').click(() => {
  import('./visualizer.js').then(({ show }) => show());
});

$('#user .background').click(() => {
  import('./background.js').then(({ show }) => show());
});
$('#user .logout').click(() => {
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

user.then(user => {
  player.stream = !user.demo;
});

let wakelock;
if (navigator.wakeLock) {
  $('#user .lock').show();
  $('#user .lock input').checkboxradio({
    icon: false,
  });
}
$('#user .lock').change(event => {
  const value = $(event.target).prop('checked');
  if (value) {
    navigator.wakeLock.request().then(lock => {
      wakelock = lock;
    });
  } else {
    wakelock.release();
  }
});
