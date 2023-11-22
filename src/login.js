'use strict';

import { setBaseUrl } from './db.js';

const dev = location.hostname === '127.0.0.1';
const sourceUrl = dev ? 'https://localhost:8000/media-priv' : 'https://d1e7jf8j2bpzti.cloudfront.net';
const sources = {
  demo: { url: sourceUrl, auth: false },
  standard: { url: sourceUrl, auth: true },
  hifi: { url: sourceUrl, auth: true },
};
const features = {
  demo: ['samples of ~15 sec', 'MP3 bitrate 160kbps', 'sample screenshots'],
  standard: ['MP3 bitrate 160kbps', 'all screenshots'],
  hifi: ['FLAC - CD perfect', 'all screenshots'],
};
var source;
var baseUrl;

var setUser;
export const user = new Promise((resolve, reject) => {
  setUser = resolve;
});
const ANONYMOUS = { username: 'preview', mp3: true, flac: false, demo: true };

$('#login').toggle(true);

$('#login form input').on('input', e => {
  if (!sources[source]?.auth) return;
  $('#login button.login').button('option', 'disabled', e.target.form.email.value === '' || e.target.form.password.value === '');
});
$('#login').on('submit', e => {
  e.preventDefault();
  $('#login button.login').button('option', 'disabled', true);
  baseUrl = sources[source].url;
  (sources[source].auth ? login(e.target.email.value, e.target.password.value) : Promise.resolve(ANONYMOUS)).then(body => {
    $('#login').hide('fade', {}, 500);
    $('#loginOverlay').hide('fade', {}, 1500);
    setUser(body);
    setBaseUrl(baseUrl);
  }).catch(() => {
    $('#login').effect('shake', {}, 500);
    baseUrl = undefined;
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
  return fire(`${baseUrl}/api/login`, { username, password });
}
export function logout() {
  return fire(`${baseUrl}/api/logout`);
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
});
