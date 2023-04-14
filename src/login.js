'use strict';

import { setBaseUrl } from './db.js';

const dev = location.hostname === '127.0.0.1';
const sources = dev ? {
  browse: { url: 'media-pub', auth: false },
  lossy: { url: 'media-priv', auth: true },
  lossless: { url: 'https://localhost:8000/media-priv', auth: true },
} : {
  browse: { url: 'https://d3nf4l9p8rzvje.cloudfront.net', auth: false },
  lossy: { url: 'https://d3nf4l9p8rzvje.cloudfront.net', auth: true },
  lossless: { url: 'https://d3nf4l9p8rzvje.cloudfront.net', auth: true },
};
var source;
var baseUrl;

$('#login').toggle(true);

$('#login form input').on('input', e => {
  if (!sources[source]?.auth) return;
  $('#login button').button('option', 'disabled', e.target.form.email.value === '' || e.target.form.password.value === '');
});
$('#login').on('submit', e => {
  e.preventDefault();
  $('#login button').button('option', 'disabled', true);
  baseUrl = sources[source].url;
  (sources[source].auth ? login(e.target.email.value, e.target.password.value) : Promise.resolve()).then(() => {
    $('#login').hide('fade', {}, 500);
    $('#loginOverlay').hide('fade', {}, 1500);
    setBaseUrl(baseUrl);
  }).catch(() => {
    $('#login').effect('shake', {}, 500);
    baseUrl = undefined;
  }).finally(() => {
    $('#login button').button('option', 'disabled', false);
  });
});
$('input[autofocus]').focus();
$('#login button').button({ disabled: true });

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
  $('#login button[type=submit]').text(sources[source].auth ? 'Login' : 'Enter');
  $('#login button').button('option', 'disabled', !source);
  $('#login h1').text(source).addClass('selected');
});
