'use strict';

import { db } from './db.js';
import { player } from './player.js';
import { dialogOptions, time, trackTitle } from './utils.js';

class Controls {
  constructor() {
    this._canplay = false;
    this._paused = true;
    this._loop = false;
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
    $('.play').button('option', 'disabled', !this._canplay);
  }
  get paused() {
    return this._paused;
  }
  set paused(v) {
    this._paused = v;
    $('.play .ui-icon').toggleClass('ui-icon-play', this._paused);
    $('.play .ui-icon').toggleClass('ui-icon-pause', !this._paused);
  }
  get loop() {
    return this._loop;
  }
  set loop(v) {
    this._loop = v;
  }
  get duration() {
    return this._duration;
  }
  set duration(v) {
    this._duration = v;
    $('.duration').text(time(v));
    $('.controls .seek').slider('option', 'max', this._duration);
  }
  get position() {
    return this._position;
  }
  set position(v) {
    this._position = v;
    $('.position').text(time(v));
    if (!this.seeking)
      $('.controls .seek').slider('value', this._position);
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
  $('.title').text(trackTitle(track));
  updateEntry();
});
player.addEventListener('playlist', ({ detail: { playlist } }) => {
  $('.entry .total').text(playlist.length);
  updateEntry();
});
function updateEntry() {
  $('.entry').toggle(player.entry != null);
  $('.entry .pos').text(player.entry+1);
  $('.previous').button('option', 'disabled', player.entry == null || player.entry == 0);
  $('.next').button('option', 'disabled', player.entry == null || player.entry >= player.playlist.length-1);
}

$('#playerDialog').dialog({
  ...dialogOptions,
  width: 'auto',
  position: { my: "center", at: "center-5%", of: window },
});
$('.ui-dialog-titlebar button').blur();

player.volume = localStorage.getItem('volume') == null ? 1 : parseFloat(localStorage.getItem('volume'));
player.stereo = localStorage.getItem('stereo') == null ? 1 : parseFloat(localStorage.getItem('stereo'));;
player.loop = localStorage.getItem('loop') === 'true';
controls.loop = player.loop;

$('.loop input').prop('checked', player.loop);
$('input[type=checkbox]').checkboxradio({
  icon: false,
});
$('.play').button({ disabled: true });
$('.previous').button({ disabled: true });
$('.next').button({ disabled: true });
$('.controls .seek').slider({
  value: 0,
  min: 0,
  max: 0,
  step: 0.1,
  orientation: "horizontal",
  range: "min",
  animate: false,
});
$('.controls .volume').slider({
  value: player.volume,
  min: 0,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  range: "min",
  animate: false,
});
$('.controls .stereo').slider({
  value: player.stereo,
  min: -1,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  animate: false,
});

$('.volume-min').click(() => {
  $('.controls .volume').slider('value', 0);
  $('.controls .volume').trigger('slide', { value: 0 });
});
$('.volume-max').click(() => {
  $('.controls .volume').slider('value', 1);
  $('.controls .volume').trigger('slide', { value: 1 });
});
$('.stereo-rev').click(() => {
  $('.controls .stereo').slider('value', -1);
  $('.controls .stereo').trigger('slide', { value: -1 });
});
$('.mono').click(() => {
  $('.controls .stereo').slider('value', 0);
  $('.controls .stereo').trigger('slide', { value: 0 });
});
$('.stereo-full').click(() => {
  $('.controls .stereo').slider('value', 1);
  $('.controls .stereo').trigger('slide', { value: 1 });
});

$('.play').click(() => {
  if (controls.paused) player.play();
  else player.pause();
});
$('.loop').change(() => {
  controls.loop = !controls.loop;
  player.loop = controls.loop;
  localStorage.setItem('loop', controls.loop);
});
const fixSlider = (event) => {
  const handleSize = 0.8;
  const handle = $(event.target).find('.ui-slider-handle');
  const pos = parseInt(handle[0].style['left']);
  handle.css('margin-left', `-${handleSize*(pos+10)/100}em`);
}
fixSlider({ target: $('.controls .volume') });
$('.controls .volume').on('slidechange', fixSlider);
$('.controls .volume').on('slide', fixSlider);
$('.controls .volume').on('slide', (e, { value }) => {
  player.volume = value;
  localStorage.setItem('volume', value);
});
fixSlider({ target: $('.controls .stereo') });
$('.controls .stereo').on('slidechange', fixSlider);
$('.controls .stereo').on('slide', fixSlider);
$('.controls .stereo').on('slide', (e, { value }) => {
  player.stereo = value;
  localStorage.setItem('stereo', value);
});
fixSlider({ target: $('.controls .seek') });
$('.controls .seek').on('slidechange', fixSlider);
$('.controls .seek').on('slide', fixSlider);
$('.controls .seek').on('slidestart', () => {
  controls.seeking = true;
});
$('.controls .seek').on('slidestop', () => {
  controls.seeking = false;
});
$('.controls .seek').on('slidechange', (e, { value }) => {
  if (!e.originalEvent) return;
  player.currentTime = value;
});

$('.previous').click(() => {
  if (player.entry == null) return;
  player.load(player.entry-1);
});
$('.next').click(() => {
  if (player.entry == null) return;
  player.load(player.entry+1);
});
