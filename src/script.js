'use strict';

import { logout, user } from './login.js';
import { player } from './player.js';
import './utils.js';

$.fn.DataTable.ext.pager.numbers_length = 5;

import('./controls.js');
import('./games.js').then(({ show }) => {
  show();
  import('./randomizer.js').then(({ show }) => show());
});
export let libraryLoaded = new Promise(resolve => {
  import('./info.js').then(({ show }) => {
    show();
    import('./library.js').then(({ show }) => show());
    resolve();
  });
});

$('#launcher .randomizer').click(() => {
  import('./randomizer.js').then(({ show }) => show());
});
$('#launcher .games').click(() => {
  import('./games.js').then(({ show }) => show());
});
$('#launcher .info').click(() => {
  import('./info.js').then(({ show }) => show());
});
$('#launcher .library').click(() => {
  import('./library.js').then(({ show }) => show());
});
$('#launcher .player').click(() => {
  import('./controls.js').then(({ show }) => show());
});
export let playlistLoaded = new Promise(resolve => {
  $('#launcher .playlist').click(() => {
    import('./playlist.js').then(({ show }) => show());
    resolve();
  });
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
$('#user .about').click(() => {
  import('./about.js').then(({ show }) => show());
});
$('#user .logout').click(() => {
  logout().finally(() => {
    location.reload();
  });
});

export const DEFAULT_KINDS = Object.freeze({
  track: true,
  short: true,
  jingle: true,
  ambient: true,
  story: true,
});
class BrowserOptions extends EventTarget {
  constructor() {
    super();
    this._kinds = {
      ...DEFAULT_KINDS,
      ...JSON.parse(localStorage.getItem('kinds') ?? '{}'),
    };
  }
  get kinds() {
    return { ...this._kinds };
  }
  set kinds(kinds) {
    this._kinds = kinds;
    localStorage.setItem('kinds', JSON.stringify(kinds));
    this.dispatchEvent(new CustomEvent('kinds'));
  }
}
export const browserOptions = new BrowserOptions();

export function setPlayerOptions({ volume, stereo, loop, replayGainMode }) {
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
  if (replayGainMode != null) {
    player.replayGainMode = replayGainMode;
    localStorage.setItem('replayGainMode', replayGainMode);
  }
}

player.volume = localStorage.getItem('volume') == null ? 1 : parseFloat(localStorage.getItem('volume'));
player.stereo = localStorage.getItem('stereo') == null ? 1 : parseFloat(localStorage.getItem('stereo'));
player.replayGainMode = localStorage.getItem('replayGainMode') == null ? 2 : parseFloat(localStorage.getItem('replayGainMode'));
player.loop = localStorage.getItem('loop') === 'true';
$('body').css('background-image', localStorage.getItem('backgroundImageUrl') == null ? '' : `url(${localStorage.getItem('backgroundImageUrl')})`);
$('body').css('background-size', localStorage.getItem('backgroundSize'));

function setVolume(volume) {
  $('#user .volume .slider').css('background-size', `${volume*100}%`);
  $('#user .volume iconify-icon').attr('icon', volume === 0 ? 'ph:speaker-x' :
    volume === 1 ? 'ph:speaker-high': 'ph:speaker-low');
}
setVolume(player.volume);
player.addEventListener('update', ({ detail: updates }) => {
  if (updates.volume != null) setVolume(updates.volume);
});
function updateVolume(event) {
  let volume = 1 - event.originalEvent.offsetY / event.currentTarget.clientHeight;
  if (volume < 0.05) volume = 0;
  if (volume > 0.95) volume = 1;
  setVolume(volume);
  setPlayerOptions({ volume });
}
let volumeSlide = false;
$('#user .volume').on('mousedown', event => {
  volumeSlide = true;
  $('body').one('mouseup', () => {
    volumeSlide = undefined;
  });
  updateVolume(event);
});
$('#user .volume').on('mousemove', event => {
  if (!volumeSlide) return;
  updateVolume(event);
});

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
