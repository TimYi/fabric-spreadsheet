import { Component, Prop } from 'vue-property-decorator'
import SheetState from './SheetState'
import { CreateElement } from 'vue'
import { Rect } from './data/data'

interface BorderCondition {
  leftCovered: boolean;
  topCovered: boolean;
  rightCovered: boolean;
  bottomCovered: boolean;
}

export interface CoverObject {
  row?: number;
  col?: number;
  rowspan?: number;
  colspan?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  render(
    h: CreateElement,
    rect: Rect,
    borderCondition: BorderCondition
  ): JSX.Element;
}

interface InternalCoverObject {
  rect: Rect;
  borderCondition: BorderCondition;
  render(
    h: CreateElement,
    rect: Rect,
    borderCondition: BorderCondition
  ): JSX.Element;
}

@Component
export default class CoverObjects extends SheetState {
  @Prop({
    type: Array,
    default: Array
  })
  readonly coverObjects?: Array<CoverObject>;

  get internalCoverObjects (): Array<InternalCoverObject> {
    const { showedRows, showedColumns, coverObjects, canvasWidth, canvasHeight } = this
    if (
      showedRows == null ||
      showedColumns == null ||
      coverObjects === undefined
    ) {
      return []
    }
    const result: Array<InternalCoverObject> = []
    for (let o of coverObjects) {
      const { row, col, rowspan, colspan, x, y, width, height, render } = o
      if (
        row !== undefined &&
        col !== undefined &&
        rowspan !== undefined &&
        colspan !== undefined
      ) {
        const endRow = row + rowspan - 1
        const endCol = col + colspan - 1
        // TODO add high performance search algorithm
        const spanedShowedRows = showedRows.filter(
          r => r.row >= row && r.row <= endRow
        )
        const spanedShowedCols = showedColumns.filter(
          c => c.col >= col && c.col <= endCol
        )
        if (spanedShowedRows.length === 0 || spanedShowedCols.length === 0) {
          continue
        }
        const topRow = spanedShowedRows[0]
        const bottomRow = spanedShowedRows[spanedShowedRows.length - 1]
        const leftColumn = spanedShowedCols[0]
        const rightColumn = spanedShowedCols[spanedShowedCols.length - 1]
        const showedX = leftColumn.xIndex
        const showedWidth = rightColumn.xIndex + rightColumn.width - showedX
        const showedY = topRow.yIndex
        const showedHeight = bottomRow.yIndex + bottomRow.height - showedY
        let leftCovered, topCovered, rightCovered, bottomCovered
        if (leftColumn.col !== col) {
          leftCovered = true
        } else {
          leftCovered = leftColumn.leftCovered
        }
        if (topRow.row !== row) {
          topCovered = true
        } else {
          topCovered = topRow.topCovered
        }
        if (rightColumn.col !== endCol) {
          rightCovered = true
        } else {
          rightCovered = rightColumn.rightCovered
        }
        if (bottomRow.row !== endRow) {
          bottomCovered = true
        } else {
          bottomCovered = bottomRow.bottomCovered
        }
        result.push({
          rect: { x: showedX, y: showedY, width: showedWidth, height: showedHeight },
          borderCondition: {
            leftCovered,
            topCovered,
            rightCovered,
            bottomCovered
          },
          render
        })
      } else if (
        x !== undefined &&
        y !== undefined &&
        width !== undefined &&
        height !== undefined
      ) {
        result.push({
          rect: { x, y, width, height },
          borderCondition: {
            leftCovered: x > canvasWidth,
            topCovered: y > canvasHeight,
            rightCovered: x > canvasWidth,
            bottomCovered: y > canvasHeight
          },
          render
        })
      }
    }
    return result
  }
}
