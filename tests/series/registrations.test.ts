import { describe, it, expect } from 'vitest';
import { Area } from '@/series/area';
import { Bar } from '@/series/bar';
import { BaselineDeltaMountain } from '@/series/baseline-delta-mountain';
import { Baseline } from '@/series/baseline';
import { Candlestick } from '@/series/candlestick';
import { ColoredLine } from '@/series/colored-line';
import { ColoredMountain } from '@/series/colored-mountain';
import { Column } from '@/series/column';
import { HighLow } from '@/series/high-low';
import { Histogram } from '@/series/histogram';
import { HLCArea } from '@/series/hlc-area';
import { HollowCandle } from '@/series/hollow-candle';
import { Kagi } from '@/series/kagi';
import { LineBreak } from '@/series/line-break';
import { Line } from '@/series/line';
import { PointFigure } from '@/series/point-figure';
import { Renko } from '@/series/renko';
import { StepLine } from '@/series/step-line';
import { VolumeCandle } from '@/series/volume-candle';

describe('Series Registrations', () => {
  const allSeries = [
    { name: 'Area', reg: Area, type: 'area' },
    { name: 'Bar', reg: Bar, type: 'bar' },
    { name: 'BaselineDeltaMountain', reg: BaselineDeltaMountain, type: 'baseline-delta-mountain' },
    { name: 'Baseline', reg: Baseline, type: 'baseline' },
    { name: 'Candlestick', reg: Candlestick, type: 'candlestick' },
    { name: 'ColoredLine', reg: ColoredLine, type: 'colored-line' },
    { name: 'ColoredMountain', reg: ColoredMountain, type: 'colored-mountain' },
    { name: 'Column', reg: Column, type: 'column' },
    { name: 'HighLow', reg: HighLow, type: 'high-low' },
    { name: 'Histogram', reg: Histogram, type: 'histogram' },
    { name: 'HLCArea', reg: HLCArea, type: 'hlc-area' },
    { name: 'HollowCandle', reg: HollowCandle, type: 'hollow-candle' },
    { name: 'Kagi', reg: Kagi, type: 'kagi' },
    { name: 'LineBreak', reg: LineBreak, type: 'line-break' },
    { name: 'Line', reg: Line, type: 'line' },
    { name: 'PointFigure', reg: PointFigure, type: 'point-figure' },
    { name: 'Renko', reg: Renko, type: 'renko' },
    { name: 'StepLine', reg: StepLine, type: 'step-line' },
    { name: 'VolumeCandle', reg: VolumeCandle, type: 'volume-candle' },
  ];

  for (const { name, reg, type } of allSeries) {
    describe(name, () => {
      it(`has type "${type}"`, () => {
        expect(reg.type).toBe(type);
      });

      it('createRenderer returns valid renderer with draw and applyOptions methods', () => {
        const r = reg.createRenderer({});
        expect(typeof r.draw).toBe('function');
        expect(typeof r.applyOptions).toBe('function');
      });

      it('createRenderer with options calls applyOptions without throwing', () => {
        expect(() => {
          const r = reg.createRenderer({ color: '#ff0000' });
          r.applyOptions({ color: '#00ff00' });
        }).not.toThrow();
      });
    });
  }

  it('Candlestick has heikin-ashi alias', () => {
    expect(Candlestick.aliases).toContain('heikin-ashi');
  });
});
