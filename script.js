'use strict';

// replay gain: 10^(replaygain_album_gain/20)

const db = [
  { href: 'Battle Arena Toshinden/Track 1.flac', title: 'Battle Arena Toshinden - Track 1' },
  { href: 'Battle Arena Toshinden/Track 2.flac', title: 'Battle Arena Toshinden - Track 2' },
  { href: 'Battle Arena Toshinden/Track 3.flac', title: 'Battle Arena Toshinden - Track 3' },
  { href: 'Battle Arena Toshinden/Track 4.flac', title: 'Battle Arena Toshinden - Track 4' },
  { href: 'Battle Arena Toshinden/Track 5.flac', title: 'Battle Arena Toshinden - Track 5' },
  { href: 'Battle Arena Toshinden/Track 6.flac', title: 'Battle Arena Toshinden - Track 6' },
  { href: 'Battle Arena Toshinden/Track 7.flac', title: 'Battle Arena Toshinden - Track 7' },
  { href: 'Battle Arena Toshinden/Track 8.flac', title: 'Battle Arena Toshinden - Track 8' },
  { href: 'Battle Arena Toshinden/Track 9.flac', title: 'Battle Arena Toshinden - Track 9' },
  { href: 'Battle Arena Toshinden/Track 10.flac', title: 'Battle Arena Toshinden - Track 10' },
  { href: 'Battle Arena Toshinden/Track 11.flac', title: 'Battle Arena Toshinden - Track 11' },
  { href: 'Battle Arena Toshinden/Track 12.flac', title: 'Battle Arena Toshinden - Track 12' },
  { href: 'Battle Arena Toshinden/Track 13.flac', title: 'Battle Arena Toshinden - Track 13' },
  { href: 'Battle Arena Toshinden/Track 14.flac', title: 'Battle Arena Toshinden - Track 14' },
  { href: 'Battle Arena Toshinden/Track 15.flac', title: 'Battle Arena Toshinden - Track 15' },
  { href: 'Ignition/Track 1.flac', title: 'Ignition - Track 1' },
  { href: 'Ignition/Track 2.flac', title: 'Ignition - Track 2' },
  { href: 'Ignition/Track 3.flac', title: 'Ignition - Track 3' },
  { href: 'Ignition/Track 4.flac', title: 'Ignition - Track 4' },
  { href: 'Ignition/Track 5.flac', title: 'Ignition - Track 5' },
  { href: 'Ignition/Track 6.flac', title: 'Ignition - Track 6' },
  { href: 'Ignition/Track 7.flac', title: 'Ignition - Track 7' },
  { href: 'Rayman/Track 1.flac', title: 'Rayman - Track 1' },
  { href: 'Rayman/Track 2.flac', title: 'Rayman - Track 2' },
  { href: 'Rayman/Track 3.flac', title: 'Rayman - Track 3' },
  { href: 'Rayman/Track 4.flac', title: 'Rayman - Track 4' },
  { href: 'Rayman/Track 5.flac', title: 'Rayman - Track 5' },
  { href: 'Rayman/Track 6.flac', title: 'Rayman - Track 6' },
  { href: 'Rayman/Track 7.flac', title: 'Rayman - Track 7' },
  { href: 'Rayman/Track 8.flac', title: 'Rayman - Track 8' },
  { href: 'Rayman/Track 9.flac', title: 'Rayman - Track 9' },
  { href: 'Rayman/Track 10.flac', title: 'Rayman - Track 10' },
  { href: 'Rayman/Track 11.flac', title: 'Rayman - Track 11' },
  { href: 'Rayman/Track 12.flac', title: 'Rayman - Track 12' },
  { href: 'Rayman/Track 13.flac', title: 'Rayman - Track 13' },
  { href: 'Rayman/Track 14.flac', title: 'Rayman - Track 14' },
  { href: 'Rayman/Track 15.flac', title: 'Rayman - Track 15' },
  { href: 'Rayman/Track 16.flac', title: 'Rayman - Track 16' },
  { href: 'Rayman/Track 17.flac', title: 'Rayman - Track 17' },
  { href: 'Rayman/Track 18.flac', title: 'Rayman - Track 18' },
  { href: 'Rayman/Track 19.flac', title: 'Rayman - Track 19' },
  { href: 'Rayman/Track 20.flac', title: 'Rayman - Track 20' },
  { href: 'Rayman/Track 21.flac', title: 'Rayman - Track 21' },
  { href: 'Rayman/Track 22.flac', title: 'Rayman - Track 22' },
  { href: 'Rayman/Track 23.flac', title: 'Rayman - Track 23' },
  { href: 'Rayman/Track 24.flac', title: 'Rayman - Track 24' },
  { href: 'Tomb Raider/Track 1.flac', title: 'Tomb Raider - Track 1' },
  { href: 'Tomb Raider/Track 2.flac', title: 'Tomb Raider - Track 2' },
  { href: 'Tomb Raider/Track 3.flac', title: 'Tomb Raider - Track 3' },
  { href: 'Tomb Raider/Track 4.flac', title: 'Tomb Raider - Track 4' },
  { href: 'Tomb Raider/Track 5.flac', title: 'Tomb Raider - Track 5' },
  { href: 'Tomb Raider/Track 6.flac', title: 'Tomb Raider - Track 6' },
  { href: 'Tomb Raider/Track 7.flac', title: 'Tomb Raider - Track 7' },
  { href: 'Tomb Raider/Track 8.flac', title: 'Tomb Raider - Track 8' },
  { href: 'Tomb Raider/Track 9.flac', title: 'Tomb Raider - Track 9' },
  { href: 'Tomb Raider - Unfinished Business/Track 1.flac', title: 'Tomb Raider: Unfinished Business - Track 1' },
  { href: 'Tomb Raider - Unfinished Business/Track 2.flac', title: 'Tomb Raider: Unfinished Business - Track 2' },
  { href: 'Tomb Raider - Unfinished Business/Track 3.flac', title: 'Tomb Raider: Unfinished Business - Track 3' },
];
db.forEach(track => {
  $('#library').append($('<li>').append(
    $('<a>', { href: '#', text: track.title, 'data-href': track.href } )
  ));
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

function play(href) {
  console.log('play', href);
  const track = db.find(track => track.href === href);
  $('#title').text(track.title);
  htmlPlayer[0].src = `media/${href}`;
  htmlPlayer[0].play();
}
