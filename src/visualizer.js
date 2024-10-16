'use strict';

import { player } from './player.js';
import { dialogOptions, initDialog, showDialog } from './utils.js';

$('#visualizerDialog').dialog({
  ...dialogOptions,
  width: 400,
  height: 300,
  position: { my: "center", at: "center", of: window },
});
initDialog($('#visualizerDialog'), { icon: 'ph:equalizer' });

export function show() {
  showDialog($('#visualizerDialog'));
}

const analyser = player.analyser;
analyser.fftSize = 1024;

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
  const bars = 20;
  const context = freqContext;
  const linData = freqData;
  analyser.getByteFrequencyData(linData);
  const maxFreq = analyser.context.sampleRate / 2;
  const minFreq = 20;
  const exp = Math.exp(Math.log(maxFreq/minFreq) / bars);
  const linStep = maxFreq / linData.length;
  const logData = new Array(bars).fill(0);
  let logFreq = 0;
  let linFreq = 0;
  let linPtr = 0;
  for (let i = 0; i < logData.length; i++) {
      logFreq = i === 0 ? minFreq : logFreq * exp;
      while (linFreq < logFreq) {
        linPtr++;
        linFreq += linStep;
      }
      const s = (linFreq - logFreq) / linStep;
      logData[i] = s * linData[linPtr-1] + (1-s) * linData[linPtr];
  }
  const data = logData;
  const width = freqContext.canvas.width;
  const height = freqContext.canvas.height;
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
  if ($('#visualizerDialog').dialog('isOpen'))
    requestAnimationFrame(draw);
}
$('#visualizerDialog').on('dialogopen', draw);
