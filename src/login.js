'use strict';

import { setBaseUrl } from './db.js';

$('#login').toggle(true);

$('#login input').on('input', e => {
  $('#login button').button('option', 'disabled', e.target.form.email.value === '' || e.target.form.password.value === '');
});
$('#login').on('submit', e => {
  e.preventDefault();
  if (e.target.email.value !== 'beta' || e.target.password.value !== 'beta') {
    $('#login').effect('shake', {}, 500);
    return;
  }
  $('#login').hide('fade', {}, 500);
  $('#loginOverlay').hide('fade', {}, 1500);
  setBaseUrl('media');
});
$('input[autofocus]').focus();
$('#login button').button({ disabled: false });
