'use strict';

export const dialogOptions = {
  closeText: 'Minimize',
  beforeClose: function (e) {
    e.preventDefault();
    const open = $(this).dialog("option", "classes.ui-dialog") === 'hidden';
    $(this).dialog("option", "classes.ui-dialog", open ? '' : 'hidden');
    $(this).dialog("option", "resizable", open);
    $(this).parent().find('.ui-dialog-titlebar-close').attr('title', open ? 'Minimize' : 'Restore');
  },
};

export function time(t) {
  t = Math.floor(t)
  const sec = t % 60;
  const minHr = Math.floor(t/60);
  const min = minHr % 60;
  const hr = Math.floor(minHr / 60);
  return `${hr === 0 ? '' : hr + ':'}${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
