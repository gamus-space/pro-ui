'use strict';

export function trackTitle({ game, title }) {
  return `${game} - ${title}`;
}

export const dialogOptions = {
  autoOpen: false,
  show: 500,
  hide: 500,
};

export function initDialog(element, { icon }) {
  element.parent().find('.ui-dialog-title')
    .prepend($('<iconify-icon>', { icon }));
}

export function showDialog(element) {
  if (element.dialog('isOpen')) {
    element.dialog('moveToTop');
  } else {
    element.dialog('open');
  }
  element.parent().find('.ui-dialog-titlebar button').blur();
}

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
