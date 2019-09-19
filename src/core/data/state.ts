import { Data } from './data'

export interface SheetState {
  data: Data
  scrollX: number
  scrollY: number
  canvasWidth: number
  canvasHeight: number,
  rowHeaderWidth: number,
  columnHeaderHeight: number
}

export default class SheetStateImpl implements SheetState {
  data: Data
  scrollX: number
  scrollY: number
  canvasWidth: number
  canvasHeight: number
  rowHeaderWidth: number
  columnHeaderHeight: number
  constructor ({
    data,
    scrollX,
    scrollY,
    canvasWidth,
    canvasHeight,
    rowHeaderWidth = 32,
    columnHeaderHeight = 32
  }: {
    data: Data,
    scrollX: number | null,
    scrollY: number | null,
    canvasWidth: number,
    canvasHeight: number,
    rowHeaderWidth?: number,
    columnHeaderHeight?: number
  }) {
    this.data = data
    this.scrollX = scrollX || 0
    this.scrollY = scrollY || 0
    this.canvasHeight = canvasHeight
    this.canvasWidth = canvasWidth
    this.rowHeaderWidth = rowHeaderWidth
    this.columnHeaderHeight = columnHeaderHeight
  }
}
