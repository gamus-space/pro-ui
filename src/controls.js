'use strict';

import { db } from './db.js';
import { player } from './player.js';
import { dialogOptions, time } from './utils.js';

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

    $('#playerDialog .seek').slider({
      value: 0,
      min: 0,
      max: 0,
      step: 0.1,
      orientation: "horizontal",
      range: "min",
      animate: false,
    });
    $('#playerDialog .volume').slider({
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      orientation: "vertical",
      range: "min",
      animate: false,
    });
    this.volume = player.volume;
    $('#playerDialog .stereo').slider({
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      orientation: "vertical",
      animate: false,
    });
    this.stereo = player.stereo;
    const fixSlider = (handleSize, ref) => (event) => {
      const handle = $(event.target).find('.ui-slider-handle');
      const pos = parseInt(handle[0].style[ref]);
      handle.css(`margin-${ref}`, `-${handleSize*(pos+5)/100}rem`);
    };
    const initSlider = (fix, slider) => {
      fix({ target: slider });
      slider.on('slidechange', fix);
      slider.on('slide', fix);
    };
    initSlider(fixSlider(1.5, 'left'), $('#playerDialog .seek'));
    initSlider(fixSlider(0.8, 'bottom'), $('#playerDialog .volume'));
    initSlider(fixSlider(0.8, 'bottom'), $('#playerDialog .stereo'));
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

player.volume = localStorage.getItem('volume') == null ? 1 : parseFloat(localStorage.getItem('volume'));
player.stereo = localStorage.getItem('stereo') == null ? 1 : parseFloat(localStorage.getItem('stereo'));;
player.loop = localStorage.getItem('loop') === 'true';

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
});
player.addEventListener('entry', ({ detail: { url } }) => {
  const track = db[url];
  $('#playerDialog .info').toggle(true)
    .find('.game').text(track.game).end()
    .find('.track').text(track.title).end()
    .find('.platform').text(track.platform).end()
    .find('.year').text(track.year).end();
  updateEntry();
});
player.addEventListener('playlist', ({ detail: { playlist } }) => {
  $('#playerDialog .entry .total').text(playlist.length);
  updateEntry();
});
function updateEntry() {
  $('#playerDialog .entry').toggle(player.entry != null);
  $('#playerDialog .entry .pos').text(player.entry+1);
  $('#playerDialog .nav').toggle(player.entry != null);
  $('#playerDialog .nav .previous').button('option', 'disabled', player.entry == null || player.entry == 0);
  $('#playerDialog .nav .next').button('option', 'disabled', player.entry == null || player.entry >= player.playlist.length-1);
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
  player.load(player.entry-1);
});
$('#playerDialog .next').click(() => {
  if (player.entry == null) return;
  player.load(player.entry+1);
});
$('#playerDialog .loop').change(() => {
  controls.loop = !controls.loop;
  player.loop = controls.loop;
  localStorage.setItem('loop', controls.loop);
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
  player.volume = value;
  localStorage.setItem('volume', value);
});
$('#playerDialog .stereo').on('slide', (e, { value }) => {
  player.stereo = value;
  localStorage.setItem('stereo', value);
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

$('#playerDialog').dialog({
  ...dialogOptions($('#playerDialog')),
  width: 550,
  height: 'auto',
  position: { my: "center", at: "center+15%", of: window },
});
$('.ui-dialog-titlebar button').blur();
