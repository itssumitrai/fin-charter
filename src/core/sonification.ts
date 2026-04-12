/**
 * Sonification — map price data to audio tones for accessibility.
 */
export interface SonificationOptions {
  /** Duration of full playback in milliseconds. Default: 3000. */
  duration?: number;
  /** Minimum frequency in Hz. Default: 200. */
  minFreq?: number;
  /** Maximum frequency in Hz. Default: 800. */
  maxFreq?: number;
  /** Waveform type. Default: 'sine'. */
  waveform?: OscillatorType;
}

export class ChartSonifier {
  private _audioCtx: AudioContext | null = null;
  private _oscillator: OscillatorNode | null = null;
  private _gainNode: GainNode | null = null;
  private _playing = false;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;

  get playing(): boolean { return this._playing; }

  /**
   * Play the price data as audio tones.
   * Higher prices map to higher frequencies.
   */
  play(closePrices: Float64Array | number[], length: number, options?: SonificationOptions): void {
    this.stop();

    const { duration = 3000, minFreq = 200, maxFreq = 800, waveform = 'sine' } = options ?? {};

    if (length === 0) return;

    this._audioCtx = new AudioContext();
    this._oscillator = this._audioCtx.createOscillator();
    this._gainNode = this._audioCtx.createGain();

    this._oscillator.type = waveform;
    this._oscillator.connect(this._gainNode);
    this._gainNode.connect(this._audioCtx.destination);
    this._gainNode.gain.setValueAtTime(0.15, this._audioCtx.currentTime);

    // Find price range
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < length; i++) {
      const v = closePrices[i];
      if (!isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;

    // Schedule frequency changes
    const stepDuration = duration / length;
    const now = this._audioCtx.currentTime;

    for (let i = 0; i < length; i++) {
      const v = closePrices[i];
      if (isNaN(v)) continue;
      const ratio = (v - min) / range;
      const freq = minFreq + ratio * (maxFreq - minFreq);
      this._oscillator.frequency.setValueAtTime(freq, now + (i * stepDuration) / 1000);
    }

    // Fade out at end
    this._gainNode.gain.setValueAtTime(0.15, now + duration / 1000 - 0.1);
    this._gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

    this._oscillator.start(now);
    this._oscillator.stop(now + duration / 1000);
    this._playing = true;

    this._timeoutId = setTimeout(() => {
      this._playing = false;
      this._cleanup();
    }, duration + 100);
  }

  stop(): void {
    if (this._timeoutId) { clearTimeout(this._timeoutId); this._timeoutId = null; }
    this._playing = false;
    this._cleanup();
  }

  private _cleanup(): void {
    try { this._oscillator?.stop(); } catch {}
    this._oscillator?.disconnect();
    this._gainNode?.disconnect();
    this._audioCtx?.close().catch(() => {});
    this._oscillator = null;
    this._gainNode = null;
    this._audioCtx = null;
  }
}
