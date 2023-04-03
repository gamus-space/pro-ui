'use strict';

import { loadDb } from './db.js';
import { readFlacMeta, flacGainValue } from './utils.js'

let replayGain = 0;
let stereoSeparation = 1;

let db = [];
loadDb().then(data => {
  db = data;
  db.forEach(track => {
    $('#library').append($('<li>').append(
      $('<a>', { href: '#', text: track.title, 'data-href': track.href } )
    ));
  });
});
$('#library').on('click', event => {
  if (event.target.nodeName !== 'A') return;
  event.preventDefault();
  play(event.target.attributes['data-href'].value);
});

const htmlPlayer = $('#htmlPlayer');
console.log(htmlPlayer[0]);
htmlPlayer.on('canplay', () => {
  console.log('canplay');
});
htmlPlayer.on('play', () => {
  console.log('play');
});
htmlPlayer.on('ended', () => {
  console.log('ended');
});

const audioContext = new AudioContext();
const audioInput = audioContext.createMediaElementSource(htmlPlayer[0]);
const replayGainNode = audioContext.createGain();
audioInput.connect(replayGainNode);
const splitter = audioContext.createChannelSplitter(2);
replayGainNode.connect(splitter);
const gainL1 = audioContext.createGain();
const gainL2 = audioContext.createGain();
const gainR1 = audioContext.createGain();
const gainR2 = audioContext.createGain();
splitter.connect(gainL1, 0);
splitter.connect(gainL2, 0);
splitter.connect(gainR1, 1);
splitter.connect(gainR2, 1);
const merger = audioContext.createChannelMerger(2);
gainL1.connect(merger, 0, 0);
gainR1.connect(merger, 0, 0);
gainL2.connect(merger, 0, 1);
gainR2.connect(merger, 0, 1);
merger.connect(audioContext.destination);
updateNodes();
function updateNodes() {
  replayGainNode.gain.value = Math.pow(10, replayGain/20);
  gainL1.gain.value = (1+stereoSeparation)/2;
  gainL2.gain.value = (1-stereoSeparation)/2;
  gainR1.gain.value = (1-stereoSeparation)/2;
  gainR2.gain.value = (1+stereoSeparation)/2;
}

let loading = false;
function play(href) {
  if (loading) return;
  loading = true;
  console.log('play', href);
  const track = db.find(track => track.href === href);
  $('#title').text(track.title);
  const url = `media/${href}`;
  fetch(url, { headers: { Range: 'bytes=0-1279' } }).then(response => response.arrayBuffer()).then(header => {
    replayGain = flacGainValue(readFlacMeta(header, "replaygain_album_gain"));
    console.log({ replayGain });
    updateNodes();
    htmlPlayer[0].src = url;
    htmlPlayer[0].play();
  }).finally(() => {
    loading = false;
  });
}

$('#playerDialog').dialog({
  width: 'auto',
  position: { my: "left", at: "left+10% center", of: window },
  beforeClose: function (e, ui) {
    e.preventDefault();
    const c = $(this).dialog("option", "classes.ui-dialog");
    $(this).dialog("option", "classes.ui-dialog", c === 'hidden' ? '' : 'hidden');
  },
});
$('#libraryDialog').dialog({
  width: 400,
  height: 200,
  position: { my: "right", at: "right-10% center", of: window },
  beforeClose: function (e, ui) {
    e.preventDefault();
    const c = $(this).dialog("option", "classes.ui-dialog");
    $(this).dialog("option", "classes.ui-dialog", c === 'hidden' ? '' : 'hidden');
  },
});
$('.ui-dialog-titlebar button').blur();
