'use strict';

const data = [
  { href: 'Battle Arena Toshinden/Track 1.flac', game: 'Battle Arena Toshinden', title: 'Track 1' },
  { href: 'Battle Arena Toshinden/Track 2.flac', game: 'Battle Arena Toshinden', title: 'Track 2' },
  { href: 'Battle Arena Toshinden/Track 3.flac', game: 'Battle Arena Toshinden', title: 'Track 3' },
  { href: 'Battle Arena Toshinden/Track 4.flac', game: 'Battle Arena Toshinden', title: 'Track 4' },
  { href: 'Battle Arena Toshinden/Track 5.flac', game: 'Battle Arena Toshinden', title: 'Track 5' },
  { href: 'Battle Arena Toshinden/Track 6.flac', game: 'Battle Arena Toshinden', title: 'Track 6' },
  { href: 'Battle Arena Toshinden/Track 7.flac', game: 'Battle Arena Toshinden', title: 'Track 7' },
  { href: 'Battle Arena Toshinden/Track 8.flac', game: 'Battle Arena Toshinden', title: 'Track 8' },
  { href: 'Battle Arena Toshinden/Track 9.flac', game: 'Battle Arena Toshinden', title: 'Track 9' },
  { href: 'Battle Arena Toshinden/Track 10.flac', game: 'Battle Arena Toshinden', title: 'Track 10' },
  { href: 'Battle Arena Toshinden/Track 11.flac', game: 'Battle Arena Toshinden', title: 'Track 11' },
  { href: 'Battle Arena Toshinden/Track 12.flac', game: 'Battle Arena Toshinden', title: 'Track 12' },
  { href: 'Battle Arena Toshinden/Track 13.flac', game: 'Battle Arena Toshinden', title: 'Track 13' },
  { href: 'Battle Arena Toshinden/Track 14.flac', game: 'Battle Arena Toshinden', title: 'Track 14' },
  { href: 'Battle Arena Toshinden/Track 15.flac', game: 'Battle Arena Toshinden', title: 'Track 15' },
  { href: 'Ignition/Track 1.flac', game: 'Ignition', title: 'Track 1' },
  { href: 'Ignition/Track 2.flac', game: 'Ignition', title: 'Track 2' },
  { href: 'Ignition/Track 3.flac', game: 'Ignition', title: 'Track 3' },
  { href: 'Ignition/Track 4.flac', game: 'Ignition', title: 'Track 4' },
  { href: 'Ignition/Track 5.flac', game: 'Ignition', title: 'Track 5' },
  { href: 'Ignition/Track 6.flac', game: 'Ignition', title: 'Track 6' },
  { href: 'Ignition/Track 7.flac', game: 'Ignition', title: 'Track 7' },
  { href: 'Rayman/Track 1.flac', game: 'Rayman', title: 'Track 1' },
  { href: 'Rayman/Track 2.flac', game: 'Rayman', title: 'Track 2' },
  { href: 'Rayman/Track 3.flac', game: 'Rayman', title: 'Track 3' },
  { href: 'Rayman/Track 4.flac', game: 'Rayman', title: 'Track 4' },
  { href: 'Rayman/Track 5.flac', game: 'Rayman', title: 'Track 5' },
  { href: 'Rayman/Track 6.flac', game: 'Rayman', title: 'Track 6' },
  { href: 'Rayman/Track 7.flac', game: 'Rayman', title: 'Track 7' },
  { href: 'Rayman/Track 8.flac', game: 'Rayman', title: 'Track 8' },
  { href: 'Rayman/Track 9.flac', game: 'Rayman', title: 'Track 9' },
  { href: 'Rayman/Track 10.flac', game: 'Rayman', title: 'Track 10' },
  { href: 'Rayman/Track 11.flac', game: 'Rayman', title: 'Track 11' },
  { href: 'Rayman/Track 12.flac', game: 'Rayman', title: 'Track 12' },
  { href: 'Rayman/Track 13.flac', game: 'Rayman', title: 'Track 13' },
  { href: 'Rayman/Track 14.flac', game: 'Rayman', title: 'Track 14' },
  { href: 'Rayman/Track 15.flac', game: 'Rayman', title: 'Track 15' },
  { href: 'Rayman/Track 16.flac', game: 'Rayman', title: 'Track 16' },
  { href: 'Rayman/Track 17.flac', game: 'Rayman', title: 'Track 17' },
  { href: 'Rayman/Track 18.flac', game: 'Rayman', title: 'Track 18' },
  { href: 'Rayman/Track 19.flac', game: 'Rayman', title: 'Track 19' },
  { href: 'Rayman/Track 20.flac', game: 'Rayman', title: 'Track 20' },
  { href: 'Rayman/Track 21.flac', game: 'Rayman', title: 'Track 21' },
  { href: 'Rayman/Track 22.flac', game: 'Rayman', title: 'Track 22' },
  { href: 'Rayman/Track 23.flac', game: 'Rayman', title: 'Track 23' },
  { href: 'Rayman/Track 24.flac', game: 'Rayman', title: 'Track 24' },
  { href: 'Tomb Raider/Track 1.flac', game: 'Tomb Raider', title: 'Track 1' },
  { href: 'Tomb Raider/Track 2.flac', game: 'Tomb Raider', title: 'Track 2' },
  { href: 'Tomb Raider/Track 3.flac', game: 'Tomb Raider', title: 'Track 3' },
  { href: 'Tomb Raider/Track 4.flac', game: 'Tomb Raider', title: 'Track 4' },
  { href: 'Tomb Raider/Track 5.flac', game: 'Tomb Raider', title: 'Track 5' },
  { href: 'Tomb Raider/Track 6.flac', game: 'Tomb Raider', title: 'Track 6' },
  { href: 'Tomb Raider/Track 7.flac', game: 'Tomb Raider', title: 'Track 7' },
  { href: 'Tomb Raider/Track 8.flac', game: 'Tomb Raider', title: 'Track 8' },
  { href: 'Tomb Raider/Track 9.flac', game: 'Tomb Raider', title: 'Track 9' },
  { href: 'Tomb Raider - Unfinished Business/Track 1.flac', game: 'Tomb Raider: Unfinished Business', title: 'Track 1' },
  { href: 'Tomb Raider - Unfinished Business/Track 2.flac', game: 'Tomb Raider: Unfinished Business', title: 'Track 2' },
  { href: 'Tomb Raider - Unfinished Business/Track 3.flac', game: 'Tomb Raider: Unfinished Business', title: 'Track 3' },
];

export var db;

export function loadDb() {
  db = Object.fromEntries(data.map(track => [track.href, track]));
  return Promise.resolve(data);
}
