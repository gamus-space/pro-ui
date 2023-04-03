'use strict';

import { db } from './db.js';
import { player } from './player.js';

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
    $('.duration').text(this.time(v));
    $('.controls .seek').slider('option', 'max', this._duration);
  }
  get position() {
    return this._position;
  }
  set position(v) {
    this._position = v;
    $('.position').text(this.time(v));
    if (!this.seeking)
      $('.controls .seek').slider('value', this._position);
  }

  time(t) {
    t = Math.floor(t)
    const sec = t % 60;
    const min = Math.floor(t/60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}

const controls = new Controls();
player.on('canplay', () => {
  controls.canplay = true;
  controls.duration = player.duration;
});
player.on('play', () => {
  controls.paused = false;
});
player.on('pause', () => {
  controls.paused = true;
});
player.on('ended', () => {
});
player.on('timeupdate', (e) => {
  controls.position = player.currentTime;
});
player.on('entry', ({ href }) => {
  const track = db[href];
  $('.title').text(`${track.game} - ${track.title}`);
  updateEntry();
});
player.on('playlist', ({ playlist }) => {
  $('.entry .total').text(playlist.length);
  updateEntry();
});
function updateEntry() {
  $('.entry').toggle(player.entry != null);
  $('.entry .pos').text(player.entry+1);
}

$('#playerDialog').dialog({
  width: 'auto',
  position: { my: "center", at: "center", of: window },
  beforeClose: function (e) {
    e.preventDefault();
    const c = $(this).dialog("option", "classes.ui-dialog");
    $(this).dialog("option", "classes.ui-dialog", c === 'hidden' ? '' : 'hidden');
  },
});
$('.ui-dialog-titlebar button').blur();

$('input[type=checkbox]').checkboxradio({
  icon: false,
});
$('.play').button({ disabled: true });
$('.controls .seek').slider({
  value: 0,
  min: 0,
  max: 0,
  step: 1,
  orientation: "horizontal",
  range: "min",
  animate: "fast",
});
$('.controls .volume').slider({
  value: 1,
  min: 0,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  range: "min",
  animate: "fast",
});
$('.controls .stereo').slider({
  value: 1,
  min: -1,
  max: 1,
  step: 0.01,
  orientation: "horizontal",
  animate: "fast",
});

$('.volume-min').click(() => {
  $('.controls .volume').slider('value', 0);
});
$('.volume-max').click(() => {
  $('.controls .volume').slider('value', 1);
});
$('.stereo-rev').click(() => {
  $('.controls .stereo').slider('value', -1);
});
$('.mono').click(() => {
  $('.controls .stereo').slider('value', 0);
});
$('.stereo-full').click(() => {
  $('.controls .stereo').slider('value', 1);
});

$('.play').click(() => {
  if (controls.paused) player.play();
  else player.pause();
});
$('.loop').change(() => {
  controls.loop = !controls.loop;
  player.loop = controls.loop;
});
$('.controls .volume').on('slide', (e, { value }) => {
  player.volume = value;
});
$('.controls .stereo').on('slide', (e, { value }) => {
  player.stereo = value;
});
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
