'use strict';

const FADEOUT_DURATION = 3;

class Player extends EventTarget {
  // audioContext
  // audio
  // loading
  // playlist
  // track
  // entry
  // loop
  // stream
  // lastUrl
  // duration
  // iteration
  // isSeeking
  // looped
  // fadeGainL
  // fadeGainR
  // replayGainMode

  constructor() {
    super();
    this._playlist = { entries: [] };
    this._track = null;
    this._entry = null;
    this._loop = false;
    this.loading = false;
    this.stream = true;
    this._lastUrl = undefined;
    this._duration = undefined;
    this.iteration = undefined;
    this.isSeeking = undefined;
    this.looped = undefined;
    this.fadeGainL = undefined;
    this.fadeGainR = undefined;
    this._replayGainMode = undefined;
    this.initialize(new Audio());

    const ended = () => {
      this.isSeeking = true;
      if (this.entry == null) return;
      if (this.entry < this.playlist.entries.length-1) {
        this.load(this.entry+1);
      } else {
        if (this.loop)
          this.load(0);
        else
          this.dispatchEvent(new CustomEvent('playlistEnded'));
      }
    };

    ['play', 'pause'].forEach(method => {
      this[method] = () => { this.audio[method](); };
    });
    ['canplay', 'play', 'pause', 'ended', 'timeupdate'].forEach(event => {
      this.audio.addEventListener(event, e => { this.dispatchEvent(new CustomEvent(e.type)); });
    });
    this.audio.addEventListener('canplay', () => {
      if (this.looped) {
        this.looped = false;
        return;
      }
      this._updateLoop(this._duration > this.audio.duration);
    });
    this.audio.addEventListener('timeupdate', () => {
      if (this._duration && !this._trackLooped()) {
        const fadeRatio = Math.min((this._duration - this.iteration * this.audio.duration - this.audio.currentTime) / FADEOUT_DURATION, 1);
        this.fadeGainL.gain.value = fadeRatio || 1;
        this.fadeGainR.gain.value = fadeRatio || 1;
      } else {
        this.fadeGainL.gain.value =  1;
        this.fadeGainR.gain.value =  1;
      }
      if (this.loading || !this._duration || this._trackLooped() ||
        !(this.iteration * this.audio.duration + this.audio.currentTime > this._duration)
      ) return;
      this.audio.pause();
      this.audio.currentTime = 0;
      this.iteration = 0;
      ended();
    });
    this.audio.addEventListener('seeking', () => {
      if (this.isSeeking) {
        this.isSeeking = false;
        return;
      }
      this.looped = true;
      if (!this._duration) return;
      const middle = this._duration - (this.iteration+1) * this.audio.duration > this.audio.duration;
      this._updateLoop(middle);
      this.iteration = this._trackLooped() && !middle ? 0 : this.iteration + 1;
    });
    this.audio.addEventListener('ended', () => {
      ended();
    });

    Object.seal(this);
  }

  _trackLooped() {
    return this._loop && this._entry == null;
  }
  _updateLoop(middle) {
    this.audio.loop = this._duration && (middle ?? true) || this._trackLooped();
  }
  _updateReplayGain() {
    if (!this._track || this.replayGainMode === undefined) return;
    this.replayGain = this.replayGainMode <= 1 ?
      this._track.replayGain.album * this.replayGainMode :
      this._track.replayGain.album * (2-this.replayGainMode) +
      this._track.replayGain.track * (this.replayGainMode-1);
  }

  get entry() {
    return this._entry;
  }
  get track() {
    return this._track;
  }
  get playlist() {
    return this._playlist;
  }
  setPlaylist(playlist, entry) {
    this._playlist = playlist;
    if (entry !== undefined) {
      this._entry = entry;
      this.loop = this.loop;
    }
    this.dispatchEvent(new CustomEvent('playlist', { detail: { playlist: this._playlist, entry: this._entry } }));
  }
  get loop() {
    return this._loop;
  }
  set loop(v) {
    this._loop = v;
    this._updateLoop(true);
    this.dispatchEvent(new CustomEvent('update', { detail: { loop: this._loop } }));
  }
  get duration() {
    return this._duration ?? (this.audio.duration || 0);
  }
  get currentTime() {
    return (this.iteration * this.audio.duration + this.audio.currentTime) || 0;
  }
  set currentTime(v) {
    this.iteration = Math.floor(v / this.audio.duration);
    this.audio.currentTime = v - this.iteration * this.audio.duration;
    this.isSeeking = true;
  }
  get replayGainMode() {
    return this._replayGainMode;
  }
  set replayGainMode(v) {
    this._replayGainMode = v;
    this._updateReplayGain();
    this.dispatchEvent(new CustomEvent('update', { detail: { replayGainMode: this._replayGainMode } }));
  }

  initialize(audio) {
    this.audio = audio;
    audio.crossOrigin = 'use-credentials';
    this.audioContext = new AudioContext();

    const audioInput = this.audioContext.createMediaElementSource(this.audio);
    const analyser = this.audioContext.createAnalyser();
    Object.defineProperty(this, 'analyser', {
      get() { return analyser; }
    });
    audioInput.connect(analyser);
    const volumeNode = this.audioContext.createGain();
    analyser.connect(volumeNode);
    const replayGainNode = this.audioContext.createGain();
    volumeNode.connect(replayGainNode);
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
    const fadeSplitter = this.audioContext.createChannelSplitter(2);
    merger.connect(fadeSplitter);
    this.fadeGainL = this.audioContext.createGain();
    this.fadeGainR = this.audioContext.createGain();
    fadeSplitter.connect(this.fadeGainL, 0);
    fadeSplitter.connect(this.fadeGainR, 1);
    const fadeMerger = this.audioContext.createChannelMerger(2);
    this.fadeGainL.connect(fadeMerger, 0, 0);
    this.fadeGainR.connect(fadeMerger, 0, 1);
    fadeMerger.connect(this.audioContext.destination);

    let replayGain = 0;
    Object.defineProperty(this, 'replayGain', {
      get() { return replayGain; },
      set(v) {
        replayGain = v ?? 0;
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
        this.dispatchEvent(new CustomEvent('update', { detail: { stereo } }));
      },
    });
    this.stereo = stereo;

    Object.defineProperty(this, 'volume', {
      get () { return volumeNode.gain.value; },
      set (v) {
        volumeNode.gain.value = v;
        this.dispatchEvent(new CustomEvent('update', { detail: { volume: v } }));
      },
    });
  }

  load(data_or_entry, play = true) {
    if (this.loading) return;
    this.loading = true;

    const data = typeof data_or_entry === 'number' ? this._playlist.entries[data_or_entry] : data_or_entry;
    this._track = data;
    this._entry = typeof data_or_entry === 'number' ? data_or_entry : null;
    this._duration = data.duration;
    this.iteration = 0;
    this.isSeeking = false;
    this.looped = false;
    this.dispatchEvent(new CustomEvent('entry', { detail: { entry: this.entry, ...data } }));

    this.audioContext.resume().then(() => {
      if (this.stream)
        return data.url;
      return fetch(data.url).then(response => response.arrayBuffer()).then(buffer => {
        if (this._lastUrl)
          URL.revokeObjectURL(this._lastUrl);
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        this._lastUrl = url;
        return url;
      });
    }).then(url => {
      this.audio.src = url;
      this._updateReplayGain();
      if (play) this.audio.play();
    }).finally(() => {
      this.loading = false;
    });
  }
}

export const player = new Player();

function setString(data, pos, value, n) {
  const a = new Uint8Array(data.buffer);
  a.set([...value].map((_, i) => value.charCodeAt(i)), pos);
  a.fill(0, pos+value.length, pos+n);
}

export function downloadWav(url, name) {
  const format = url.match(/\.(.+)$/)[1];
  const decoders = {
    flac: buffer => {
      const data = new DataView(buffer);
      if (data.getUint32(0) !== 0x664c6143) throw new Error('invalid signature');
      if (data.getUint8(5) !== 0) throw new Error('invalid header type');
      const sampleRate = (data.getUint8(18) << 12) | (data.getUint8(19) << 4) | (data.getUint8(20) >> 4);
      const channels = ((data.getUint8(20) >> 1) & 0x7) + 1;
      const bps = (((data.getUint8(20) & 0x1) << 4) | (data.getUint8(21) >> 4)) + 1;
      const audioContext = new AudioContext({ sampleRate });
      return audioContext.decodeAudioData(buffer).then(audioBuffer => ({ audioBuffer, channels, bps }));
    },
    mp3: buffer => {
      const data = new DataView(buffer);
      if (data.getUint32(0) >> 8 !== 0x494433) throw new Error('invalid signature');
      if (data.getUint16(3) !== 0x300) throw new Error('invalid version');
      const size = (data.getUint8(6) << 21) | (data.getUint8(7) << 14) | (data.getUint8(8) << 7) | data.getUint8(9);
      let pos = 10 + size;
      if ((data.getUint16(pos) | 0x18) !== 0xfffb) throw new Error('invalid header');
      const version = (data.getUint16(pos) & 0x18) >> 3;
      pos += 2;
      const sampleRateMapping = { 0: 44100, 1: 48000, 2: 32000 };
      const sampleRate = sampleRateMapping[(data.getUint8(pos) >> 2) & 0x3];
      pos += 1;
      if (!sampleRate) throw new Error('unknown sample rate');
      const channelsMapping = { 0: 2, 1: 2, 2: 2, 3: 1 };
      const channels = channelsMapping[data.getUint8(pos) >> 6];
      pos += 1;
      const bps = 16;
      const audioContext = new AudioContext({ sampleRate });
      return audioContext.decodeAudioData(buffer).then(audioBuffer => ({ audioBuffer, channels, bps }));
    },
  };
  return fetch(url, { credentials: "include" }).then(response => response.arrayBuffer()).then(decoders[format]).then(({ audioBuffer, channels, bps }) => {
    if (channels !== audioBuffer.numberOfChannels)
      throw new Error('number of channels mismatch');
    if (bps !== 8 && bps !== 16)
      throw new Error('unsupported bits per sample');
    const data = new DataView(new ArrayBuffer(44+audioBuffer.length*audioBuffer.numberOfChannels*bps/8));
    let pos = 0;
    setString(data, pos, 'RIFF', 4); pos += 4;
    data.setUint32(pos, data.byteLength-8, true); pos += 4;
    setString(data, pos, 'WAVE', 4); pos += 4;
    setString(data, pos, 'fmt ', 4); pos += 4;
    data.setUint32(pos, 16, true); pos += 4;
    data.setUint16(pos, 1, true); pos += 2;
    data.setUint16(pos, audioBuffer.numberOfChannels, true); pos += 2;
    data.setUint32(pos, audioBuffer.sampleRate, true); pos += 4;
    data.setUint32(pos, audioBuffer.sampleRate*audioBuffer.numberOfChannels*bps/8, true); pos += 4;
    data.setUint16(pos, audioBuffer.numberOfChannels*bps/8, true); pos += 2;
    data.setUint16(pos, bps, true); pos += 2;
    setString(data, pos, 'data', 4); pos += 4;
    data.setUint32(pos, audioBuffer.length*audioBuffer.numberOfChannels*bps/8, true); pos += 4;
    for (let i = 0; i < audioBuffer.length; i++)
      for (let j = 0; j < audioBuffer.numberOfChannels; j++)
        switch (bps) {
        case 8:
          data.setUint8(pos, (audioBuffer.getChannelData(j)[i]+1)/2 * 255, true); pos += 1;
          break;
        case 16:
          data.setInt16(pos, (audioBuffer.getChannelData(j)[i]+1)/2 * 65535 - 32768, true); pos += 2;
          break;
        }
    return data.buffer;
  }).then(download(name, 'wav'));
}

export function downloadOriginal(url, name) {
  const format = url.match(/\.(.+)$/)[1];
  return fetch(url, { credentials: "include" }).then(response => response.arrayBuffer()).then(download(name, format));
}

function download(name, type) {
  const fullName = `${name.replaceAll(/: ?/g, ' - ')}.${type}`;
  return buffer => {
    const file = new File([buffer], fullName, { type: `audio/${type}` });
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = fullName;
    a.click();
    URL.revokeObjectURL(url);
  };
}
