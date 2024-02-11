'use strict';

import { db } from './db.js';
import { user } from './login.js';
import { player } from './player.js';
import { setPlayerOptions } from './script.js';
import { dialogOptions, initDialog, showDialog, time } from './utils.js';

const SEEK_START_LIMIT = 2;

$('#playerDialog').dialog({
  ...dialogOptions,
  width: 580,
  height: 260,
  position: { my: "center", at: "center", of: window },
});
initDialog($('#playerDialog'), { icon: 'ph:play' });

export function show() {
  showDialog($('#playerDialog'));
}

class Controls {
  constructor() {
    this._loop = false;
    this._volume = 0;
    this._stereo = 0;
    this.init();
    this.canplay = false;
    this.paused = true;
    this.duration = 0;
    this.position = 0;
    this.seeking = false;
    Object.seal(this);
  }
  init() {
    const initButton = (button) => {
      button.button({ disabled: true });
    };
    initButton($('#playerDialog .play'));
    initButton($('#playerDialog .previous'));
    initButton($('#playerDialog .next'));

    $('#playerDialog .loop input').checkboxradio({
      icon: false,
    });
    this.loop = player.loop;

    const sliderSettings = {
      classes: { "ui-slider-range": "ui-state-active" },
      animate: false,
    };
    $('#playerDialog .seek').slider({
      ...sliderSettings,
      value: 0,
      min: 0,
      max: 0,
      step: 0.1,
      orientation: "horizontal",
      range: "min",
    });
    user.then(user => {
      if (user.demo)
        $('#playerDialog .seek').append($('<div class="label">DEMO</div>'));
    });
    $('#playerDialog .volume').slider({
      ...sliderSettings,
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      orientation: "vertical",
      range: "min",
    });
    this.volume = player.volume;
    $('#playerDialog .stereo').slider({
      ...sliderSettings,
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      orientation: "vertical",
    });
    this.stereo = player.stereo;
    const fixSlider = (handleSize, ref) => (event) => {
      const handle = $(event.target).find('.ui-slider-handle');
      const pos = parseInt(handle[0].style[ref]);
      handle.css(`margin-${ref}`, `-${handleSize*(pos)/100}rem`);
    };
    const initSlider = (fix, slider) => {
      fix({ target: slider });
      slider.on('slidechange', fix);
      slider.on('slide', fix);
    };
    initSlider(fixSlider(1.5, 'left'), $('#playerDialog .midiPlayer .seek'));
    initSlider(fixSlider(0.8, 'bottom'), $('#playerDialog .midiPlayer .volume'));
    initSlider(fixSlider(0.8, 'bottom'), $('#playerDialog .midiPlayer .stereo'));
    initSlider(fixSlider(0.8, 'left'), $('#playerDialog .miniPlayer .seek'));
    initSlider(fixSlider(0.5, 'bottom'), $('#playerDialog .miniPlayer .volume'));
    initSlider(fixSlider(0.5, 'bottom'), $('#playerDialog .miniPlayer .stereo'));
  }
  get canplay() {
    return this._canplay;
  }
  set canplay(v) {
    this._canplay = v;
    $('#playerDialog .play').button('option', 'disabled', !this._canplay);
  }
  get paused() {
    return this._paused;
  }
  set paused(v) {
    this._paused = v;
    $('#playerDialog .play .ui-icon').toggleClass('ui-icon-play', this._paused);
    $('#playerDialog .play .ui-icon').toggleClass('ui-icon-pause', !this._paused);
  }
  get duration() {
    return this._duration;
  }
  set duration(v) {
    this._duration = v;
    $('#playerDialog .duration').text(time(v));
    $('#playerDialog .seek').slider('option', 'max', this._duration);
  }
  get position() {
    return this._position;
  }
  set position(v) {
    this._position = v;
    $('#playerDialog .position').text(time(v));
    if (!this.seeking)
      $('#playerDialog .seek').slider('value', this._position);
  }
  get loop() {
    return this._loop;
  }
  set loop(v) {
    this._loop = v;
    $('#playerDialog .loop input').prop('checked', this.loop).checkboxradio('refresh');
  }
  get volume() {
    return this._volume;
  }
  set volume(v) {
    this._volume = v;
    $('#playerDialog .volume').slider('value', this.volume);
  }
  get stereo() {
    return this._stereo;
  }
  set stereo(v) {
    this._stereo = v;
    $('#playerDialog .stereo').slider('value', this.stereo);
  }
}

const controls = new Controls();
player.addEventListener('canplay', () => {
  controls.canplay = true;
  controls.duration = player.duration;
});
player.addEventListener('play', () => {
  controls.paused = false;
});
player.addEventListener('pause', () => {
  controls.paused = true;
});
player.addEventListener('timeupdate', (e) => {
  controls.position = player.currentTime;
  const previous = $('#playerDialog .previous .ui-icon');
  if (player.currentTime <= SEEK_START_LIMIT && previous.hasClass('ui-icon-seek-prev')) {
    previous.removeClass('ui-icon-seek-prev').addClass('ui-icon-seek-first');
  }
  if (player.currentTime > SEEK_START_LIMIT && previous.hasClass('ui-icon-seek-first')) {
    previous.removeClass('ui-icon-seek-first').addClass('ui-icon-seek-prev');
  }
  updatePreviousDisabled();
});
player.addEventListener('entry', ({ detail: track }) => {
  const dbTrack = db?.[track.url];
  $('#playerDialog .info').toggle(true)
    .find('.game').text(track.game).end()
    .find('.gameTitle').text(track.game.split(': ')[0]).end()
    .find('.gameSubtitle').text(track.game.split(': ')[1] ?? '').end()
    .find('.track').text(track.title).end()
    .find('.artist').toggle(!!dbTrack?.artist).end()
    .find('.by').text(dbTrack?.artist ?? '').end()
    .find('.misc').toggle(!!dbTrack).end()
    .find('.platform').text(dbTrack?.platform ?? '').end()
    .find('.year').text(dbTrack?.year ?? '').end();
  updateEntry();
});
player.addEventListener('playlist', ({ detail: { playlist } }) => {
  $('#playerDialog .entry .total').text(playlist.length);
  updateEntry();
});
$('#playerDialog .entry .total').text(player.playlist.length);
function updateEntry() {
  $('#playerDialog .entry').toggle(player.entry != null);
  $('#playerDialog .entry .pos').text(player.entry+1);
  $('#playerDialog .midiPlayer .nav').toggle(player.entry != null);
  $('#playerDialog .miniPlayer .next,.previous').toggle(player.entry != null);
  updatePreviousDisabled();
  $('#playerDialog .next').button('option', 'disabled', player.entry == null || player.entry >= player.playlist.length-1);
}
function updatePreviousDisabled() {
  $('#playerDialog .previous').button('option', 'disabled', player.currentTime <= SEEK_START_LIMIT && (player.entry == null || player.entry == 0));
}
player.addEventListener('update', ({ detail: updates }) => {
  if (updates.loop != null) controls.loop = updates.loop;
  if (updates.volume != null) controls.volume = updates.volume;
  if (updates.stereo != null) controls.stereo = updates.stereo;
});

$('#playerDialog .play').click(() => {
  if (controls.paused) player.play();
  else player.pause();
});
$('#playerDialog .previous').click(() => {
  if (player.entry == null) return;
  if (player.currentTime > SEEK_START_LIMIT) player.currentTime = 0;
  else player.load(player.entry-1);
});
$('#playerDialog .next').click(() => {
  if (player.entry == null) return;
  player.load(player.entry+1);
});
$('#playerDialog .loop').change(() => {
  controls.loop = !controls.loop;
  setPlayerOptions({ loop: controls.loop });
});

$('#playerDialog .seek').on('slidestart', () => {
  controls.seeking = true;
});
$('#playerDialog .seek').on('slidestop', () => {
  controls.seeking = false;
});
$('#playerDialog .seek').on('slidechange', (e, { value }) => {
  if (!e.originalEvent) return;
  player.currentTime = value;
});
$('#playerDialog .volume').on('slide', (e, { value }) => {
  setPlayerOptions({ volume: value });
});
$('#playerDialog .stereo').on('slide', (e, { value }) => {
  setPlayerOptions({ stereo: value });
});

const setValue = (slider, value) => {
  $(slider).slider('value', value);
  $(slider).trigger('slide', { value });
};
$('#playerDialog .volume-min').click(() => {
  setValue($('#playerDialog .volume'), 0);
});
$('#playerDialog .volume-max').click(() => {
  setValue($('#playerDialog .volume'), 1);
});
$('#playerDialog .stereo-rev').click(() => {
  setValue($('#playerDialog .stereo'), -1);
});
$('#playerDialog .mono').click(() => {
  setValue($('#playerDialog .stereo'), 0);
});
$('#playerDialog .stereo-full').click(() => {
  setValue($('#playerDialog .stereo'), 1);
});
