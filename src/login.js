'use strict';

import { setBaseUrl } from './db.js';

var baseUrl;

$('#login').toggle(true);

$('#login input').on('input', e => {
  $('#login button').button('option', 'disabled', e.target.form.email.value === '' || e.target.form.password.value === '');
});
$('#login').on('submit', e => {
  e.preventDefault();
  $('#login button').button('option', 'disabled', true);
  baseUrl = 'm2';
  login(e.target.email.value, e.target.password.value).then(() => {
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
$('#login button').button({ disabled: false });

function fire(url, username, password) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true, username, password);
    xhr.addEventListener('loadend', () => (xhr.status === 401 ? reject : resolve)());
    xhr.send();
  });
}
export function login(username, password) {
  return fire(`${baseUrl}/login`, username, password);
}
export function logout() {
  return fire(`${baseUrl}/logout`, '_', '_');
}
