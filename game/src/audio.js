// Every sound in Lanternkeep, synthesized with WebAudio — no audio files. The context
// is created lazily on the first user gesture (browsers forbid sound before one) and
// every effect is a short oscillator sweep, so nothing allocates per frame and the
// mute toggle silences the master gain in one place.

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context !== null) {
      if (context.state === 'suspended') context.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  /** One oscillator sweep: type, start/end frequency, seconds, peak volume. */
  function tone(type, fromHz, toHz, seconds, volume) {
    if (!ensure() || muted || context === null || master === null) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  /** A few notes in a row, each `step` seconds after the last. */
  function arpeggio(notes, type, step, seconds, volume) {
    if (!ensure() || muted || context === null || master === null) return;
    const now = context.currentTime;
    for (let index = 0; index < notes.length; index += 1) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(notes[index], now + index * step);
      gain.gain.setValueAtTime(0.0001, now + index * step);
      gain.gain.exponentialRampToValueAtTime(volume, now + index * step + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * step + seconds);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + index * step);
      osc.stop(now + index * step + seconds + 0.02);
    }
  }

  return {
    ensure,
    get muted() {
      return muted;
    },
    setMuted(value) {
      muted = value;
      if (master !== null) master.gain.value = muted ? 0 : 0.5;
    },
    /** A shard picked up: a bright rising blip. */
    pickup() {
      tone('sine', 880, 1320, 0.07, 0.16);
    },
    /** A wisp banished: a soft pop that falls away. */
    banish() {
      tone('triangle', 340, 70, 0.13, 0.22);
    },
    /** A bolt fired: a short quiet zap. */
    shoot() {
      tone('square', 520, 170, 0.08, 0.07);
    },
    /** The keeper is hurt: a low thud. */
    hurt() {
      tone('sawtooth', 170, 55, 0.22, 0.25);
    },
    /** A click on a menu: a tiny tick. */
    click() {
      tone('sine', 660, 660, 0.05, 0.12);
    },
    /** Level up: a rising four-note chime. */
    levelUp() {
      arpeggio([523, 659, 784, 1046], 'sine', 0.07, 0.22, 0.18);
    },
    /** Dawn breaks: a warm major arpeggio. */
    win() {
      arpeggio([523, 659, 784, 1046, 1318], 'triangle', 0.11, 0.4, 0.16);
    },
    /** The light goes out: three notes falling. */
    lose() {
      arpeggio([392, 330, 262], 'triangle', 0.16, 0.4, 0.16);
    },
  };
}
