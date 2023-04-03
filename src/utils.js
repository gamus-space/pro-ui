'use strict';

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
