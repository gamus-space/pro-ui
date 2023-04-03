'use strict';

class Player extends EventTarget {
  // audioContext
  // audio
  // loading
  // playlist
  // entry
  // loop

  constructor() {
    super();
    this._playlist = [];
    this._entry = null;
    this._loop = false;
    this.loading = false;
    this.initialize(new Audio());

    ['play', 'pause'].forEach(method => {
      this[method] = () => { this.audio[method](); };
    });
    ['canplay', 'play', 'pause', 'ended', 'timeupdate'].forEach(event => {
      this.audio.addEventListener(event, e => { this.dispatchEvent(new CustomEvent(e.type)); });
    });
    ['volume', 'duration', 'currentTime'].forEach(field => {
      Object.defineProperty(this, field, {
        get() { return this.audio[field]; },
        set(v) { this.audio[field] = v; },
      });
    });
    this.audio.addEventListener('ended', () => {
      if (this.entry == null) return;
      if (this.entry < this.playlist.length-1)
        this.load(this.entry+1);
      if (this.entry === this.playlist.length-1 && this.loop)
        this.load(0);
    });

    Object.seal(this);
  }

  get entry() {
    return this._entry;
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
    this.audio.loop = this._entry == null ? v : false;
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
        replayGain = v ?? 0;
        console.log({ replayGain });
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

  load(data_or_entry, play = true) {
    if (this.loading) return;
    this.loading = true;

    const data = typeof data_or_entry === 'number' ? this._playlist[data_or_entry] : data_or_entry;
    this._entry = typeof data_or_entry === 'number' ? data_or_entry : null;
    this.loop = this.loop;
    this.dispatchEvent(new CustomEvent('entry', { detail: { entry: this.entry, ...data } }));

    this.replayGain = data.replayGain;
    this.audio.src = data.url;
    if (play) this.audio.play();
    this.loading = false;
  }
}

export const player = new Player();
