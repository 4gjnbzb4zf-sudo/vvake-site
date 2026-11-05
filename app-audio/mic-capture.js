/*
 * VVake on the web: the microphone's capture worklet for live coach calls (src/lib/webapp/live/liveCallBrowser.ts,
 * build 77). Runs on the browser's audio thread and hands the page fixed frames of mono float samples (20 ms by
 * default: `processorOptions.frame` samples), so the voice detector reacts in about 20 ms instead of the old 85 ms.
 * Served from the site itself ('self' in script-src): no blob: URL, no inline code. Outputs silence.
 */
class VvakeMicCapture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const n = options && options.processorOptions && options.processorOptions.frame;
    this.n = Number.isFinite(n) && n >= 128 && n <= 8192 ? Math.round(n) : 960;
    this.buf = new Float32Array(this.n);
    this.at = 0;
    this.port.onmessage = (e) => {
      if (e.data === "stop") this.done = true;
    };
  }

  process(inputs) {
    if (this.done) return false;
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    let i = 0;
    while (i < ch.length) {
      const k = Math.min(ch.length - i, this.n - this.at);
      this.buf.set(ch.subarray(i, i + k), this.at);
      this.at += k;
      i += k;
      if (this.at === this.n) {
        this.port.postMessage(this.buf, [this.buf.buffer]);
        this.buf = new Float32Array(this.n);
        this.at = 0;
      }
    }
    return true;
  }
}

registerProcessor("vvake-mic-capture", VvakeMicCapture);
