'use strict';

import { player } from './player.js';
import { dialogOptions, initDialog, showDialog } from './utils.js';

$('#visualizerDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 400,
  position: { my: "center", at: "center", of: window },
});
initDialog($('#visualizerDialog'), { icon: 'ph:equalizer' });

export function show() {
  showDialog($('#visualizerDialog'));
}

const analyser = player.analyser;
analyser.fftSize = 64;

const waveData = new Float32Array(analyser.frequencyBinCount);
const waveContext = $('#visualizerDialog canvas.wave')[0].getContext('2d');
waveContext.lineWidth = 2;
waveContext.strokeStyle = '#eee';
const freqData = new Uint8Array(analyser.frequencyBinCount);
const freqContext = $('#visualizerDialog canvas.freq')[0].getContext('2d');

function drawWave() {
  const context = waveContext;
  const data = waveData;
  const width = waveContext.canvas.width;
  const height = waveContext.canvas.height;
  analyser.getFloatTimeDomainData(data);
  context.clearRect(0, 0, width, height);
  context.beginPath();
  let x = 0;
  for (let i = 0; i < data.length; i++) {
    context[i === 0 ? 'moveTo' : 'lineTo'](x, (-data[i]+1) * height / 2);
    x += width / data.length;
  }
  context.stroke();
}
function drawFreq() {
  const context = freqContext;
  const data = freqData;
  const width = freqContext.canvas.width;
  const height = freqContext.canvas.height;
  analyser.getByteFrequencyData(data);
  context.clearRect(0, 0, width, height);
  let x = 0;
  for (let i = 0; i < data.length; i++) {
    context.fillStyle = `#eeeeee${((data[i] >> 1)+128).toString(16)}`;
    context.fillRect(x, height, width / data.length / 2, -data[i] / 255 * height);
    x += width / data.length;
  }
}
function draw() {
  drawWave();
  drawFreq();
  requestAnimationFrame(draw);
}
draw();
