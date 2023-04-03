'use strict';

import { readFlacMeta, flacGainValue } from './utils.js'

class Player {
  // audioContext
  // audio
  // loading
  // handlers
  // playlist
  // entry

  constructor() {
    this._playlist = [];
    this.entry = null;
    this.loading = false;
    this.handlers = {};
    this.initialize(new Audio());

    ['play', 'pause'].forEach(method => {
      this[method] = () => { this.audio[method](); };
    });
    ['canplay', 'play', 'pause', 'ended', 'timeupdate'].forEach(event => {
      this.audio.addEventListener(event, () => { this.handlers[event]?.(); });
    });
    ['loop', 'volume', 'duration', 'currentTime'].forEach(field => {
      Object.defineProperty(this, field, {
        get() { return this.audio[field]; },
        set(v) { this.audio[field] = v; },
      });
    });
    this.audio.addEventListener('ended', () => {
      if (this.entry != null && this.entry < this.playlist.length-1)
        this.load(this.playlist[++this.entry], true);
    });

    Object.seal(this);
  }

  get playlist() {
    return this._playlist;
  }
  set playlist(v) {
    this._playlist = v;
    this.handlers.playlist?.({ playlist: this._playlist });
  }

  initialize(audio) {
    this.audio = audio;
    this.audioContext = new AudioContext();

    const audioInput = this.audioContext.createMediaElementSource(this.audio);
    const replayGainNode = this.audioContext.createGain();
    audioInput.connect(replayGainNode);
    const splitter = this.audioContext.createChannelSplitter(2);
    replayGainNode.connect(splitter);
    const gainL1 = this.audioContext.createGain();
    const gainL2 = this.audioContext.createGain();
    const gainR1 = this.audioContext.createGain();
    const gainR2 = this.audioContext.createGain();
    splitter.connect(gainL1, 0);
    splitter.connect(gainL2, 0);
    splitter.connect(gainR1, 1);
    splitter.connect(gainR2, 1);
    const merger = this.audioContext.createChannelMerger(2);
    gainL1.connect(merger, 0, 0);
    gainR1.connect(merger, 0, 0);
    gainL2.connect(merger, 0, 1);
    gainR2.connect(merger, 0, 1);
    merger.connect(this.audioContext.destination);

    let replayGain = 0;
    Object.defineProperty(this, 'replayGain', {
      get() { return replayGain; },
      set(v) {
        replayGain = v;
        replayGainNode.gain.value = Math.pow(10, replayGain/20);
      },
    });

    let stereo = 1;
    Object.defineProperty(this, 'stereo', {
      get() { return stereo; },
      set(v) {
        stereo = v;
        gainL1.gain.value = (1+stereo)/2;
        gainL2.gain.value = (1-stereo)/2;
        gainR1.gain.value = (1-stereo)/2;
        gainR2.gain.value = (1+stereo)/2;
      },
    });
    this.stereo = stereo;
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  load(href, play) {
    this.handlers.entry?.({ entry: this.entry, href });
    if (this.loading) return;
    this.loading = true;
    const url = `media/${href}`;
    fetch(url, { headers: { Range: 'bytes=0-1279' } }).then(response => response.arrayBuffer()).then(header => {
      this.replayGain = flacGainValue(readFlacMeta(header, "replaygain_album_gain"));
      console.log({ replayGain: this.replayGain });
      this.audio.src = url;
      if (play)
        this.audio.play();
    }).finally(() => {
      this.loading = false;
    });
  }
}

export const player = new Player();
