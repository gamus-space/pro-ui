'use strict';

import { loadDb } from './db.js';
import { readFlacMeta, flacGainValue } from './utils.js'

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
const gainNode = audioContext.createGain();
audioInput.connect(gainNode).connect(audioContext.destination);

let loading = false;
function play(href) {
  if (loading) return;
  loading = true;
  console.log('play', href);
  const track = db.find(track => track.href === href);
  $('#title').text(track.title);
  const url = `media/${href}`;
  fetch(url, { headers: { Range: 'bytes=0-1279' } }).then(response => response.arrayBuffer()).then(header => {
    const replayGain = flacGainValue(readFlacMeta(header, "replaygain_album_gain"));
    console.log({ replayGain });
    gainNode.gain.value = Math.pow(10, replayGain/20);
    htmlPlayer[0].src = url;
    htmlPlayer[0].play();
  }).finally(() => {
    loading = false;
  });
}
