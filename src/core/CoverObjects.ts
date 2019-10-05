import { Component, Prop } from 'vue-property-decorator'
import SheetState from './SheetState'
import { CreateElement } from 'vue'
import { Rect } from './data/data'
import { RowRenderInfo, ColumnRenderInfo } from './data/StateProxy'
import { ZINDEX } from './constants'

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
  zindex: ZINDEX;
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

  get editor (): InternalCoverObject | null {
    const { showedRows, showedColumns, coverObjects, canvasWidth, canvasHeight } = this
    if (
      showedRows == null ||
      showedColumns == null ||
      coverObjects === undefined
    ) {
      return null
    }
    const editorObj = coverObjects.find(o => o.zindex === ZINDEX.ABOVE_COVER_LAYER)
    if (editorObj != null) {
      const result = this.convertToInternalCoverObject(editorObj, canvasWidth, canvasHeight, showedRows, showedColumns)
      return result
    }
    return null
  }

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
      if (o.zindex !== ZINDEX.UNDER_COVER_LAYER) {
        continue
      }
      const coverObject = this.convertToInternalCoverObject(o, canvasWidth, canvasHeight, showedRows, showedColumns)
      if (coverObject != null) {
        result.push(coverObject)
      }
    }
    return result
  }

  convertToInternalCoverObject (coverObject: CoverObject,
    canvasWidth: number, canvasHeight: number,
    showedRows: Array<RowRenderInfo>, showedColumns: Array<ColumnRenderInfo>): InternalCoverObject | null {
    const { row, col, rowspan, colspan, x, y, width, height, render } = coverObject
    if (
      row !== undefined &&
      col !== undefined &&
      rowspan !== undefined &&
      colspan !== undefined
    ) {
      // TODO 解决typescript允许多余属性问题
      const coverObject = this.calculateCoverObject({ row, col, rowspan, colspan, render }, showedRows, showedColumns)
      if (coverObject != null) {
        return coverObject
      }
    } else if (
      x !== undefined &&
      y !== undefined &&
      width !== undefined &&
      height !== undefined
    ) {
      return {
        rect: { x, y, width, height },
        borderCondition: {
          leftCovered: x > canvasWidth,
          topCovered: y > canvasHeight,
          rightCovered: x > canvasWidth,
          bottomCovered: y > canvasHeight
        },
        render
      }
    }
    return null
  }

  calculateCoverObject ({ row, col, rowspan, colspan, render }: {
    row: number, col: number, rowspan: number, colspan: number, render(
      h: CreateElement,
      rect: Rect,
      borderCondition: BorderCondition
    ): JSX.Element,
  },
  showedRows: Array<RowRenderInfo>, showedColumns: Array<ColumnRenderInfo>): InternalCoverObject | null {
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
      return null
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
    return {
      rect: { x: showedX, y: showedY, width: showedWidth, height: showedHeight },
      borderCondition: {
        leftCovered,
        topCovered,
        rightCovered,
        bottomCovered
      },
      render
    }
  }
}
