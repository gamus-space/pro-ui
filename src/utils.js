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
  const min = Math.floor(t/60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function readFlacMeta(header, fieldName) {
  const array = new Uint8Array(header);
  const field = `${fieldName}=`.split('').map(c => c.charCodeAt(0));
  let i = 0
  for (; i <= array.length - field.length; i++) {
    let j = 0;
    for (; j < field.length; j++)
      if (array[i+j] !== field[j]) break;
    if (j === field.length) break;
  }
  if (i >= array.length - field.length) return undefined;
  const length = new DataView(array.slice(i-4, i).buffer).getUint32(0, true);
  const value = String.fromCharCode(...array.slice(i+field.length, i+length));
  return value;
}

export function flacGainValue(gainStr) {
  const str = /^([+-]?\d+(\.\d+)?)( db)?/i.exec(gainStr)?.[1];
  return str && Number(str);
}
