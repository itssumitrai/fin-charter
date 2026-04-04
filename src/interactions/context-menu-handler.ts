import type { EventHandler } from './event-router';
import type { ContextMenuItem } from '../ui/context-menu';
import { createContextMenu } from '../ui/context-menu';
import { BaseDrawing } from '../drawings/base';

export interface ContextMenuCallbacks {
  getDrawings(): { drawing: BaseDrawing; id: string }[];
  getIndicatorAtPane(paneId: string): { id: string; label: string } | null;
  getPaneAtY(y: number): string | null;
  mainPaneId: string;
  editDrawing(id: string): void;
  removeDrawing(id: string): void;
  duplicateDrawing(id: string): void;
  bringDrawingToFront(id: string): void;
  sendDrawingToBack(id: string): void;
  openIndicatorSettings(id: string): void;
  toggleIndicatorVisibility(id: string): void;
  removeIndicator(id: string): void;
  fitContent(): void;
  scrollToRealTime(): void;
  theme: { bg: string; text: string; border: string };
  localToScreen(x: number, y: number): { x: number; y: number };
}

export class ContextMenuHandler implements EventHandler {
  private _callbacks: ContextMenuCallbacks;

  constructor(callbacks: ContextMenuCallbacks) {
    this._callbacks = callbacks;
  }

  onContextMenu(x: number, y: number): boolean {
    const cb = this._callbacks;
    const screenPos = cb.localToScreen(x, y);

    // 1. Check drawings
    for (const { drawing, id } of cb.getDrawings()) {
      const hit = drawing._hitTestDrawing(x, y);
      if (hit) { this._showDrawingMenu(id, screenPos); return true; }
    }

    // 2. Check indicator panes
    const paneId = cb.getPaneAtY(y);
    if (paneId && paneId !== cb.mainPaneId) {
      const indicator = cb.getIndicatorAtPane(paneId);
      if (indicator) { this._showIndicatorMenu(indicator.id, screenPos); return true; }
    }

    // 3. Empty chart area
    this._showChartMenu(screenPos);
    return true;
  }

  private _showDrawingMenu(id: string, pos: { x: number; y: number }): void {
    const cb = this._callbacks;
    createContextMenu([
      { label: 'Edit', action: () => cb.editDrawing(id) },
      { label: 'Duplicate', action: () => cb.duplicateDrawing(id) },
      { label: 'Remove', action: () => cb.removeDrawing(id) },
      { label: 'Bring to Front', action: () => cb.bringDrawingToFront(id), separator: true },
      { label: 'Send to Back', action: () => cb.sendDrawingToBack(id) },
    ], pos, cb.theme);
  }

  private _showIndicatorMenu(id: string, pos: { x: number; y: number }): void {
    const cb = this._callbacks;
    createContextMenu([
      { label: 'Settings', action: () => cb.openIndicatorSettings(id) },
      { label: 'Hide', action: () => cb.toggleIndicatorVisibility(id) },
      { label: 'Remove', action: () => cb.removeIndicator(id) },
    ], pos, cb.theme);
  }

  private _showChartMenu(pos: { x: number; y: number }): void {
    const cb = this._callbacks;
    createContextMenu([
      { label: 'Reset Zoom', action: () => cb.fitContent() },
      { label: 'Scroll to Latest', action: () => cb.scrollToRealTime() },
    ], pos, cb.theme);
  }
}
