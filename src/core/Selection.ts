import { Component } from 'vue-property-decorator'
import binarySearch from '@/util/binarySearch'
import SheetState from './SheetState'

export interface CellPoint {
  x: number
  y: number
  row: number
  col: number
}

@Component
export default class Selection extends SheetState {
  getCellPoint (x: number, y: number): CellPoint | null {
    const { showedRows, showedColumns } = this
    if (showedRows == null || showedRows.length === 0 || showedColumns == null || showedColumns.length === 0) {
      return {
        x, y, row: -1, col: -1
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
    let row: number, col: number
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

    return { x, y, row, col }
  }

  mouseenter (e: MouseEvent) {
    this.$emit('mouseenter', e)
  }

  mousemove (e: MouseEvent) {
    this.$emit('mousemove', e)
  }

  mouseout (e: MouseEvent) {
    this.$emit('mouseout', e)
  }

  mousedown (e: MouseEvent) {
    this.$emit('mousedown', e)
  }

  mouseup (e: MouseEvent) {
    this.$emit('mouseup', e)
  }

  click (e: MouseEvent) {
    this.$emit('click', e)
  }

  dblclick (e: MouseEvent) {
    this.$emit('dblclick', e)
  }

  contextmenu (e: MouseEvent) {
    this.$emit('contextmenu', e)
  }
}
