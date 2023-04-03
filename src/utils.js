'use strict';

export function trackTitle({ game, title }) {
  return `${game} - ${title}`;
}

export const dialogOptions = element => ({
  closeText: 'Minimize',
  resizable: !element.hasClass('fixed'),
  beforeClose: function (e) {
    e.preventDefault();
    const open = $(this).dialog("option", "classes.ui-dialog") === 'hidden';
    $(this).dialog("option", "classes.ui-dialog", open ? '' : 'hidden');
    $(this).dialog("option", "resizable", open && !$(this).hasClass('fixed'));
    $(this).parent().find('.ui-dialog-titlebar-close').attr('title', open ? 'Minimize' : 'Restore');
  },
});

export function time(t) {
  t = Math.floor(t)
  const sec = t % 60;
  const minHr = Math.floor(t/60);
  const min = minHr % 60;
  const hr = Math.floor(minHr / 60);
  return `${hr === 0 ? '' : hr + ':'}${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function size(bytes) {
  if (bytes == null) return bytes;
  const kb = Math.round(bytes / 1024 * 10) / 10;
  const mb = Math.round(kb / 1024 * 10) / 10;
  return kb < 500 ? `${kb} kB` : `${mb} MB`;
}
