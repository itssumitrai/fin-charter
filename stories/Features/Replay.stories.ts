import type { Meta, StoryObj } from '@storybook/html';
import { createChart, ReplayManager } from '@itssumitrai/fin-charter';
import type { ReplayEvent, ReplaySpeed } from '@itssumitrai/fin-charter';
import { barsToColumnStore } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Replay',
  parameters: {
    docs: {
      description: {
        component:
          'Bar-by-bar historical replay. The ReplayManager progressively reveals bars to simulate ' +
          'live data streaming. Supports play, pause, step forward/backward, and speed control (1x–10x).',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function makeBtn(text: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText =
    'padding: 5px 11px; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; ' +
    'border-radius: 4px; cursor: pointer; font-size: 13px;';
  btn.addEventListener('click', onClick);
  return btn;
}

function makeSpeedBtn(label: string, speed: ReplaySpeed, replay: ReplayManager, group: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText =
    'padding: 3px 8px; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; ' +
    'cursor: pointer; font-size: 11px;';
  btn.addEventListener('click', () => {
    replay.setSpeed(speed);
    group.querySelectorAll('button').forEach(b => {
      (b as HTMLButtonElement).style.background = '#2a2e39';
      (b as HTMLButtonElement).style.borderColor = '#434651';
    });
    btn.style.background = '#2962ff';
    btn.style.borderColor = '#2962ff';
  });
  return btn;
}

export const BarReplay: Story = {
  name: 'Bar Replay',
  parameters: {
    docs: {
      source: {
        code: `import { createChart, ReplayManager } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addSeries({ type: 'candlestick' });

// Load initial bars (first 50)
series.setData(data.slice(0, 50));

// Set up replay from bar 50 onward
const replay = new ReplayManager();
const store = barsToColumnStore(data);
replay.onEvent((event) => {
  if (event.type === 'bar') series.update(event.bar);
});
replay.start(store, 49, { speed: 2 });`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    // ── Toolbar ──────────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display: flex; align-items: center; gap: 8px; padding: 8px 12px; ' +
      'background: #1e2235; border-radius: 4px; flex-wrap: wrap;';

    const status = document.createElement('span');
    status.style.cssText = 'color: #d1d4dc; font-size: 13px; font-family: monospace; min-width: 180px;';
    status.textContent = 'Ready — click Play to start';

    // ── Chart ────────────────────────────────────────────────
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });

    // Load first 50 bars as initial visible data
    const startIdx = 50;
    series.setData(AAPL_DAILY.slice(0, startIdx));

    // ── Replay manager ───────────────────────────────────────
    const replay = new ReplayManager();
    const store = barsToColumnStore(AAPL_DAILY);

    replay.onEvent((event: ReplayEvent) => {
      if (event.type === 'bar') {
        series.update(event.bar);
        status.textContent = `Playing — bar ${event.barIndex + 1} / ${AAPL_DAILY.length}`;
      } else if (event.type === 'pause') {
        status.textContent = `Paused at bar ${event.barIndex + 1} / ${AAPL_DAILY.length}`;
      } else if (event.type === 'resume') {
        status.textContent = `Resumed at bar ${event.barIndex + 1}`;
      } else if (event.type === 'end') {
        status.textContent = `Replay complete — ${AAPL_DAILY.length} bars`;
        playBtn.textContent = 'Restart';
      }
    });

    // ── Controls ─────────────────────────────────────────────
    const playBtn = makeBtn('Play', () => {
      if (replay.active && !replay.playing) {
        replay.resume();
      } else if (!replay.active || playBtn.textContent === 'Restart') {
        series.setData(AAPL_DAILY.slice(0, startIdx));
        replay.start(store, startIdx - 1, { speed: replay.speed || 1 });
        playBtn.textContent = 'Play';
        status.textContent = `Playing — bar ${startIdx} / ${AAPL_DAILY.length}`;
      }
    });

    const pauseBtn = makeBtn('Pause', () => {
      if (replay.playing) replay.pause();
    });

    const stopBtn = makeBtn('Stop', () => {
      replay.stop();
      series.setData(AAPL_DAILY.slice(0, startIdx));
      playBtn.textContent = 'Play';
      status.textContent = 'Stopped — click Play to restart';
    });

    const stepFwd = makeBtn('Step ▸', () => {
      if (!replay.active) {
        // Start paused
        series.setData(AAPL_DAILY.slice(0, startIdx));
        replay.start(store, startIdx - 1);
        replay.pause();
      }
      replay.stepForward();
    });

    const stepBack = makeBtn('◂ Step', () => {
      if (replay.active) replay.stepBackward();
    });

    // Speed selector
    const speedGroup = document.createElement('div');
    speedGroup.style.cssText = 'display: flex; border: 1px solid #434651; border-radius: 4px; overflow: hidden;';

    const speeds: Array<{ label: string; value: ReplaySpeed }> = [
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '5x', value: 5 },
      { label: '10x', value: 10 },
    ];

    speeds.forEach((s, i) => {
      const btn = makeSpeedBtn(s.label, s.value, replay, speedGroup);
      if (i === 0) { btn.style.background = '#2962ff'; btn.style.borderColor = '#2962ff'; }
      if (i < speeds.length - 1) btn.style.borderRight = '1px solid #434651';
      speedGroup.appendChild(btn);
    });

    toolbar.appendChild(playBtn);
    toolbar.appendChild(pauseBtn);
    toolbar.appendChild(stopBtn);
    toolbar.appendChild(stepBack);
    toolbar.appendChild(stepFwd);
    toolbar.appendChild(speedGroup);
    toolbar.appendChild(status);

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);

    return withDocs(wrapper, {
      description:
        'The <strong>ReplayManager</strong> steps through historical data bar-by-bar, simulating a live data feed. ' +
        'Use <code>replay.start(store, fromIndex)</code> to begin, then control with <code>pause()</code>, ' +
        '<code>resume()</code>, <code>stepForward()</code>, <code>stepBackward()</code>, and <code>setSpeed()</code>. ' +
        'Speed tiers: <strong>1x</strong> (500ms/bar), <strong>2x</strong> (250ms), <strong>5x</strong> (100ms), <strong>10x</strong> (50ms).',
      code: `import { createChart, ReplayManager } from '@itssumitrai/fin-charter';
import { barsToColumnStore } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data.slice(0, 50));

const replay = new ReplayManager();
const store = barsToColumnStore(data);

replay.onEvent((event) => {
  if (event.type === 'bar') {
    series.update(event.bar);
  }
  if (event.type === 'end') {
    console.log('Replay complete');
  }
});

// Start from bar 50, speed 2x
replay.start(store, 49, { speed: 2 });

// Controls
replay.pause();
replay.resume();
replay.stepForward();
replay.stepBackward();
replay.setSpeed(5);
replay.stop();`,
    });
  },
};
