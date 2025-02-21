'use strict';

import { setBaseUrl } from './db.js';
import { fetchJson, time } from './utils.js';

const dev = location.hostname === '127.0.0.1';
const apiUrl = dev ? 'https://localhost:8000/media-priv' : 'https://d1e7jf8j2bpzti.cloudfront.net';
const assetsUrl = dev ? '/dist/assets' : '/assets';
const sources = {
  demo: { auth: false },
  standard: { auth: true },
  hifi: { auth: true },
};
const features = {
  demo: ['samples of ~15 sec', 'MP3 bitrate 160kbps', 'sample screenshots'],
  standard: ['MP3 bitrate 160kbps', 'all screenshots'],
  hifi: ['FLAC - CD perfect', 'all screenshots'],
};
var source;

var setUser;
export const user = new Promise((resolve, reject) => {
  setUser = resolve;
});
const ANONYMOUS = { username: 'preview', mp3: true, flac: false, demo: true };

function loginUser(user) {
  $('#login').hide('fade', {}, 500);
  $('#stats').hide('drop', { direction: 'left' }, 500);
  $('#features').hide('drop', { direction: 'right' }, 500);
  $('#loginOverlay').hide('fade', {}, 1500);
  setUser(user);
  setBaseUrl(apiUrl);
  $('body').toggleClass('standard', !user.flac);
  $('body').toggleClass('hifi', user.flac);
}

fetch(`${apiUrl}/api/user`, { credentials: 'include' }).then(response =>
  response.status !== 401 ? response.json() : undefined
).then(user => {
  if (user) loginUser(user);
  else {
    $('#login').toggle(true);
    fetchJson(`${apiUrl}/stats.json`).then(stats => {
      const formatter = new Intl.NumberFormat();
      $('#stats .stat.games').text(formatter.format(stats.games.games));
      $('#stats .stat.tracks').text(formatter.format(stats.music.tracks));
      $('#stats .stat.duration').text(time(stats.music.seconds));
      $('#stats .stat.screenshots').text(formatter.format(stats.screenshots.screenshots));
      $('#stats .stat.articles').text(formatter.format(stats.text.articles));
      $('#stats').show('drop', { direction: 'left' }, 1000);
      $('#features').show('drop', { direction: 'right' }, 1000);
    });
    fetchJson(`${assetsUrl}/compilations/index.json`).then(compilations => {
      const IMAGE_WIDTH = 160;
      const GAP = 20;
      new Array(Math.ceil(2 * screen.width / (IMAGE_WIDTH + GAP) / compilations.index.length) + 1).fill().forEach(() => {
        compilations.index.forEach(({ url }) => {
          const absoluteUrl = `${apiUrl}/thumbs/compilations/${url}`;
          $('#strip').append($('<img>', { src: absoluteUrl }));
        });
      })
      $('#strip').css('--img-count', compilations.index.length);
    });
  }
});

$('#login form input').on('input', e => {
  if (!sources[source]?.auth) return;
  $('#login button.login').button('option', 'disabled', e.target.form.email.value === '' || e.target.form.password.value === '');
});
$('#login').on('submit', e => {
  e.preventDefault();
  $('#login button.login').button('option', 'disabled', true);
  (sources[source].auth ? login(e.target.email.value, e.target.password.value) : Promise.resolve(ANONYMOUS)).then(user => {
    loginUser(user);
  }).catch(() => {
    $('#login').effect('shake', {}, 500);
  }).finally(() => {
    $('#login button.login').button('option', 'disabled', false);
  });
});
$('input[autofocus]').focus();
$('#login button.login').button({ disabled: true });
$('#login button.signup').click(() => {
  window.open('https://www.patreon.com/krzykos');
});

function fire(url, body = undefined) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  }).then(response => {
    if (!response.ok)
      throw new Error('unauthorized');
    return response.json();
  });
}
function login(username, password) {
  return fire(`${apiUrl}/api/login`, { username, password });
}
export function logout() {
  return fire(`${apiUrl}/api/logout`);
}

$('#login input[type=checkbox]').checkboxradio({
  icon: false,
});
$('#login input[type=checkbox]').click(e => {
  $('#login input[type=checkbox]').prop('checked', false).checkboxradio('refresh');
  source = e.target.name;
  $(`#login input[type=checkbox][name='${source}']`).prop('checked', true).checkboxradio('refresh');
  $('#login .auth')[sources[source].auth ? 'show' : 'hide']('fold', {}, 1000);
  $('#login button.login').text(sources[source].auth ? 'Login' : 'Enter');
  $('#login button.login').button('option', 'disabled', !source);
  $('#login h1')
    .toggleClass('fade', !$('#login h1').hasClass('selected'))
    .hide('fade', {}, 500, () => {
      $('#login h1')
        .text(source)
        .addClass('selected')
        .removeClass('fade')
        .show('fade', {}, 1000);
    });
  $('#login .features').hide('fade', {}, 750, () => {
    $('#login .features').empty()
      .append(features[source].map(feature => $("<li>", { text: feature })))
      .show('fade', {}, 1500);
  });
  $('body').toggleClass('demo', source === 'demo');
  $('body').toggleClass('standard', source === 'standard');
  $('body').toggleClass('hifi', source === 'hifi');
});
