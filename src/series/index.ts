import { Candlestick } from './candlestick';
import { Line } from './line';
import { Area } from './area';
import { Bar } from './bar';
import { Baseline } from './baseline';
import { HollowCandle } from './hollow-candle';
import { Histogram } from './histogram';
import { StepLine } from './step-line';
import { ColoredLine } from './colored-line';
import { ColoredMountain } from './colored-mountain';
import { HLCArea } from './hlc-area';
import { HighLow } from './high-low';
import { Column } from './column';
import { VolumeCandle } from './volume-candle';
import { BaselineDeltaMountain } from './baseline-delta-mountain';
import { Renko } from './renko';
import { Kagi } from './kagi';
import { LineBreak } from './line-break';
import { PointFigure } from './point-figure';
import type { SeriesRegistration } from '../core/registry';

export {
  Candlestick,
  Line,
  Area,
  Bar,
  Baseline,
  HollowCandle,
  Histogram,
  StepLine,
  ColoredLine,
  ColoredMountain,
  HLCArea,
  HighLow,
  Column,
  VolumeCandle,
  BaselineDeltaMountain,
  Renko,
  Kagi,
  LineBreak,
  PointFigure,
};

export const allSeries: SeriesRegistration[] = [
  Candlestick,
  Line,
  Area,
  Bar,
  Baseline,
  HollowCandle,
  Histogram,
  StepLine,
  ColoredLine,
  ColoredMountain,
  HLCArea,
  HighLow,
  Column,
  VolumeCandle,
  BaselineDeltaMountain,
  Renko,
  Kagi,
  LineBreak,
  PointFigure,
];
