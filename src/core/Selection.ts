import { Component } from 'vue-property-decorator'
import binarySearch from '@/util/binarySearch'
import SheetState from './SheetState'

export interface CellPoint {
  x: number
  y: number
  cellX: number
  cellY: number
  row: number
  col: number
}

@Component
export default class Selection extends SheetState {
  getCellPoint (x: number, y: number): CellPoint | null {
    const { showedRows, showedColumns } = this
    if (showedRows == null || showedRows.length === 0 || showedColumns == null || showedColumns.length === 0) {
      return {
        x, y, row: -1, col: -1, cellX: -1, cellY: -1
      }
    }

    let rightColumn = showedColumns[showedColumns.length - 1]
    if (x > rightColumn.xIndex + rightColumn.width) {
      return null
    }
    let bottomRow = showedRows[showedRows.length - 1]
    if (y > bottomRow.yIndex + bottomRow.height) {
      return null
    }

    const showedRow = binarySearch(showedRows, y, (r, v) => {
      if (r.yIndex >= v) {
        return 1
      } else if (r.yIndex + r.height < v) {
        return -1
      } else {
        return 0
      }
    })

    const showedCol = binarySearch(showedColumns, x, (c, v) => {
      if (c.xIndex >= v) {
        return 1
      } else if (c.xIndex + c.width < v) {
        return -1
      } else {
        return 0
      }
    })
    let row: number, col: number, cellX: number, cellY: number
    if (showedRow == null) {
      row = -1
    } else {
      row = showedRow.row
    }
    if (showedCol == null) {
      col = -1
    } else {
      col = showedCol.col
    }
    if (showedRow && showedCol) {
      cellX = x - showedCol.realStartIndex
      cellY = y - showedRow.realStartIndex
    } else {
      cellX = -1
      cellY = -1
    }

    return { x, y, row, col, cellX, cellY }
  }

  mouseenter (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('mouseenter', e, point)
  }

  mousemove (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('mousemove', e, point)
  }

  mouseout (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('mouseout', e, point)
  }

  mousedown (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('mousedown', e, point)
  }

  mouseup (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('mouseup', e, point)
  }

  click (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('click', e, point)
  }

  dblclick (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('dblclick', e, point)
  }

  contextmenu (e: MouseEvent) {
    const point = this.getCellPoint(e.offsetX, e.offsetY)
    this.$emit('contextmenu', e, point)
  }
}
