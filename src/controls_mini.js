'use strict';

import { db } from './db.js';
import { player } from './player.js';
import { dialogOptions, initDialog, time, trackTitle } from './utils.js';

class Controls {
  constructor() {
    this._canplay = false;
    this._paused = true;
    this._loop = false;
    this._volume = 0;
    this._stereo = 0;
    this._duration = 0;
    this._position = 0;
    this.seeking = false;
    Object.seal(this);
  }
  get canplay() {
    return this._canplay;
  }
  set canplay(v) {
    this._canplay = v;
    $('#miniPlayerDialog .play').button('option', 'disabled', !this._canplay);
  }
  get paused() {
    return this._paused;
  }
  set paused(v) {
    this._paused = v;
    $('#miniPlayerDialog .play .ui-icon').toggleClass('ui-icon-play', this._paused);
    $('#miniPlayerDialog .play .ui-icon').toggleClass('ui-icon-pause', !this._paused);
  }
  get loop() {
    return this._loop;
  }
  set loop(v) {
    this._loop = v;
    $('#miniPlayerDialog .loop input').prop('checked', this.loop).checkboxradio('refresh');
  }
  get volume() {
    return this._volume;
  }
  set volume(v) {
    this._volume = v;
    $('#miniPlayerDialog .volume').slider('value', this.volume);
  }
  get stereo() {
    return this._stereo;
  }
  set stereo(v) {
    this._stereo = v;
    $('#miniPlayerDialog .stereo').slider('value', this.stereo);
  }
  get duration() {
    return this._duration;
  }
  set duration(v) {
    this._duration = v;
    $('#miniPlayerDialog .duration').text(time(v));
    $('#miniPlayerDialog .controls .seek').slider('option', 'max', this._duration);
  }
  get position() {
    return this._position;
  }
  set position(v) {
    this._position = v;
    $('#miniPlayerDialog .position').text(time(v));
    if (!this.seeking)
      $('#miniPlayerDialog .controls .seek').slider('value', this._position);
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
player.addEventListener('ended', () => {
});
player.addEventListener('timeupdate', (e) => {
  controls.position = player.currentTime;
});
player.addEventListener('entry', ({ detail: { url } }) => {
  const track = db[url];
  $('#miniPlayerDialog .title').text(trackTitle(track));
  updateEntry();
});
player.addEventListener('playlist', ({ detail: { playlist } }) => {
  $('#miniPlayerDialog .entry .total').text(playlist.length);
  updateEntry();
});
function updateEntry() {
  $('#miniPlayerDialog .entry').toggle(player.entry != null);
  $('#miniPlayerDialog .entry .pos').text(player.entry+1);
  $('#miniPlayerDialog .previous').button('option', 'disabled', player.entry == null || player.entry == 0);
  $('#miniPlayerDialog .next').button('option', 'disabled', player.entry == null || player.entry >= player.playlist.length-1);
}

$('#miniPlayerDialog').dialog({
  ...dialogOptions($('#miniPlayerDialog')),
  width: 'auto',
  position: { my: "center", at: "center-15%", of: window },
});
initDialog($('#miniPlayerDialog'));

$('#miniPlayerDialog input[type=checkbox]').checkboxradio({
  icon: false,
});
$('#miniPlayerDialog .play').button({ disabled: true });
$('#miniPlayerDialog .previous').button({ disabled: true });
$('#miniPlayerDialog .next').button({ disabled: true });
const sliderSettings = {
  classes: { "ui-slider-range": "ui-state-active" },
  animate: false,
};
$('#miniPlayerDialog .controls .seek').slider({
  ...sliderSettings,
  value: 0,
  min: 0,
  max: 0,
  step: 0.1,
  orientation: "horizontal",
  range: "min",
});
$('#miniPlayerDialog .controls .volume').slider({
  ...sliderSettings,
  value: 0,
  min: 0,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  range: "min",
});
$('#miniPlayerDialog .controls .stereo').slider({
  ...sliderSettings,
  value: 0,
  min: -1,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
});

player.volume = localStorage.getItem('volume') == null ? 1 : parseFloat(localStorage.getItem('volume'));
player.stereo = localStorage.getItem('stereo') == null ? 1 : parseFloat(localStorage.getItem('stereo'));;
player.loop = localStorage.getItem('loop') === 'true';
controls.loop = player.loop;
controls.volume = player.volume;
controls.stereo = player.stereo;
player.addEventListener('update', ({ detail: updates }) => {
  if (updates.loop != null) controls.loop = updates.loop;
  if (updates.volume != null) controls.volume = updates.volume;
  if (updates.stereo != null) controls.stereo = updates.stereo;
});

$('#miniPlayerDialog .volume-min').click(() => {
  $('#miniPlayerDialog .controls .volume').slider('value', 0);
  $('#miniPlayerDialog .controls .volume').trigger('slide', { value: 0 });
});
$('#miniPlayerDialog .volume-max').click(() => {
  $('#miniPlayerDialog .controls .volume').slider('value', 1);
  $('#miniPlayerDialog .controls .volume').trigger('slide', { value: 1 });
});
$('#miniPlayerDialog .stereo-rev').click(() => {
  $('#miniPlayerDialog .controls .stereo').slider('value', -1);
  $('#miniPlayerDialog .controls .stereo').trigger('slide', { value: -1 });
});
$('#miniPlayerDialog .mono').click(() => {
  $('#miniPlayerDialog .controls .stereo').slider('value', 0);
  $('#miniPlayerDialog .controls .stereo').trigger('slide', { value: 0 });
});
$('#miniPlayerDialog .stereo-full').click(() => {
  $('#miniPlayerDialog .controls .stereo').slider('value', 1);
  $('#miniPlayerDialog .controls .stereo').trigger('slide', { value: 1 });
});

$('#miniPlayerDialog .play').click(() => {
  if (controls.paused) player.play();
  else player.pause();
});
$('#miniPlayerDialog .loop').change(() => {
  controls.loop = !controls.loop;
  player.loop = controls.loop;
  localStorage.setItem('loop', controls.loop);
});
const fixSlider = (event) => {
  const handleSize = 0.8;
  const handle = $(event.target).find('.ui-slider-handle');
  const pos = parseInt(handle[0].style['left']);
  handle.css('margin-left', `-${handleSize*(pos+1)/100}em`);
}
fixSlider({ target: $('#miniPlayerDialog .controls .volume') });
$('#miniPlayerDialog .controls .volume').on('slidechange', fixSlider);
$('#miniPlayerDialog .controls .volume').on('slide', fixSlider);
$('#miniPlayerDialog .controls .volume').on('slide', (e, { value }) => {
  player.volume = value;
  localStorage.setItem('volume', value);
});
fixSlider({ target: $('#miniPlayerDialog .controls .stereo') });
$('#miniPlayerDialog .controls .stereo').on('slidechange', fixSlider);
$('#miniPlayerDialog .controls .stereo').on('slide', fixSlider);
$('#miniPlayerDialog .controls .stereo').on('slide', (e, { value }) => {
  player.stereo = value;
  localStorage.setItem('stereo', value);
});
fixSlider({ target: $('#miniPlayerDialog .controls .seek') });
$('#miniPlayerDialog .controls .seek').on('slidechange', fixSlider);
$('#miniPlayerDialog .controls .seek').on('slide', fixSlider);
$('#miniPlayerDialog .controls .seek').on('slidestart', () => {
  controls.seeking = true;
});
$('#miniPlayerDialog .controls .seek').on('slidestop', () => {
  controls.seeking = false;
});
$('#miniPlayerDialog .controls .seek').on('slidechange', (e, { value }) => {
  if (!e.originalEvent) return;
  player.currentTime = value;
});

$('#miniPlayerDialog .previous').click(() => {
  if (player.entry == null) return;
  player.load(player.entry-1);
});
$('#miniPlayerDialog .next').click(() => {
  if (player.entry == null) return;
  player.load(player.entry+1);
});
