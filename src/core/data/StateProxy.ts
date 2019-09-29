import fabric from 'fabric'
import { getExcelColumnName } from '@/util/spreadsheetUtils'
import { SheetState } from './state'
import { Data, CellRect, Rect, CellContent, DEFAULT_CELL_PROPERTY } from './data'

/**
 * row or column render info
 */
export interface RowRenderInfo {
  // row number
  row: number
  // showed start y index
  yIndex: number
  // real start y index
  realStartIndex: number
  // showed height
  height: number
  // real height
  realHeight: number
  // top side is scrolled over
  topCovered: boolean
  // bottom end is not scrolled to
  bottomCovered: boolean
}

export interface ColumnRenderInfo {
  // column number
  col: number
  xIndex: number
  realStartIndex: number,
  width: number
  realWidth: number
  // left side is scrolled over
  leftCovered: boolean
  // right end is not scrolled to
  rightCovered: boolean
}

/**
 * when drawing a cell, top and left border should always be rerendered.
 * right and bottom border should be rerendered if they are not covered.
 */
export interface CellRenderInfo extends CellRect {
  content: CellContent | null
  rowspan: number
  colspan: number
}

export interface RenderInfo {
  rows: Array<RowRenderInfo>
  columns: Array<ColumnRenderInfo>
  cells: Array<CellRenderInfo>
  rowHeaders: Array<CellRenderInfo>
  columnHeaders: Array<CellRenderInfo>
}

export default class StateProxy {
  state: SheetState
  constructor (state: SheetState) {
    this.state = state
  }

  setData (data: Data) {
    this.state.data = data
  }

  getContentWidth () : number {
    const { data } = this.state
    if (data == null) {
      return 0
    }
    let totalWidth = 0
    let columnCount = data.getColumnCount()
    let defaultColumn = data.getDefaultColumn()
    let defaultWidth = defaultColumn.width!
    for (let i = 0; i < columnCount; i++) {
      const column = data.getColumn(i)
      let width
      if (column != null) {
        if (column.width != null) {
          width = column.width
        } else {
          width = defaultWidth
        }
      } else {
        width = defaultWidth
      }
      totalWidth += width
    }
    return totalWidth
  }

  getContentHeight () : number {
    const { data } = this.state
    if (data == null) {
      return 0
    }
    let totalHeight = 0
    let rowCount = data.getRowCount()
    let defaultRow = data.getDefaultRow()
    let defaultHeight = defaultRow.height!
    for (let i = 0; i < rowCount; i++) {
      const row = data.getRow(i)
      let height
      if (row != null) {
        if (row.height != null) {
          height = row.height
        } else {
          height = defaultHeight
        }
      } else {
        height = defaultHeight
      }
      totalHeight += height
    }
    return totalHeight
  }

  getTotalWidth () : number {
    const { rowHeaderWidth } = this.state
    return this.getContentWidth() + rowHeaderWidth
  }

  getTotalHeight () : number {
    const { columnHeaderHeight } = this.state
    return this.getContentHeight() + columnHeaderHeight
  }

  getCanvasWidth (): number {
    const { canvasWidth, data, rowHeaderWidth } = this.state
    if (data == null) {
      return 0
    }
    let totalWidth = rowHeaderWidth
    let columnCount = data.getColumnCount()
    let defaultColumn = data.getDefaultColumn()
    let defaultWidth = defaultColumn.width!
    for (let i = 0; i < columnCount; i++) {
      const column = data.getColumn(i)
      let width
      if (column != null) {
        if (column.width != null) {
          width = column.width
        } else {
          width = defaultWidth
        }
      } else {
        width = defaultWidth
      }
      totalWidth += width
      if (totalWidth >= canvasWidth) {
        return canvasWidth
      }
    }
    return totalWidth
  }

  getCanvasHeight (): number {
    const { canvasHeight, data, columnHeaderHeight } = this.state
    if (data == null) {
      return 0
    }
    let totalHeight = columnHeaderHeight
    let rowCount = data.getRowCount()
    let defaultRow = data.getDefaultRow()
    let defaultHeight = defaultRow.height!
    for (let i = 0; i < rowCount; i++) {
      const row = data.getRow(i)
      let height
      if (row != null) {
        if (row.height != null) {
          height = row.height
        } else {
          height = defaultHeight
        }
      } else {
        height = defaultHeight
      }
      totalHeight += height
      if (totalHeight >= canvasHeight) {
        return canvasHeight
      }
    }
    return totalHeight
  }

  getRenderInfo (): RenderInfo {
    const rows = this.getRowsRender()
    const columns = this.getColumnsRender()
    const cells = this.getCellsRender(rows, columns)
    const rowHeaders = this.getRowHeadersRender(rows, columns)
    const columnHeaders = this.getColumnHeadersRender(rows, columns)
    return {
      rows,
      columns,
      cells,
      rowHeaders,
      columnHeaders
    }
  }

  getRowsRender (): Array<RowRenderInfo> {
    let result: Array<RowRenderInfo> = []
    let { scrollY, canvasHeight, columnHeaderHeight, data } = this.state
    const defaultRow = data.getDefaultRow()
    const rowCount = data.getRowCount()
    const frozenRows = data.freezons[1]
    let showedHeight = columnHeaderHeight
    let i = 0
    for (; i < frozenRows; i++) {
      const row = data.getRow(i)
      let height: number
      if (row === null) {
        height = defaultRow.height!
      } else {
        height = row.height || defaultRow.height!
      }
      if (height === 0) {
        continue
      }
      let bottomCovered = false
      const realHeight = height
      if (showedHeight + height > canvasHeight) {
        height = canvasHeight - showedHeight
        bottomCovered = true
      }
      result.push({
        row: i,
        yIndex: showedHeight,
        realStartIndex: showedHeight,
        height,
        realHeight,
        topCovered: false,
        bottomCovered: bottomCovered
      })
      showedHeight += height
    }
    let passedScrollHeight = 0
    for (; i < rowCount; i++) {
      if (showedHeight >= canvasHeight) {
        break
      }
      const row = data.getRow(i)
      let height: number
      if (row === null) {
        height = defaultRow.height!
      } else {
        height = row.height || defaultRow.height!
      }
      if (height === 0) {
        continue
      }
      const realHeight = height
      let yIndex = showedHeight
      let realStartIndex = yIndex
      let topCovered = false
      let bottomCovered = false
      if (passedScrollHeight < scrollY) {
        if (passedScrollHeight + height <= scrollY) {
          passedScrollHeight += height
          continue
        } else {
          const diff = (scrollY - passedScrollHeight)
          height = realHeight - diff
          realStartIndex = yIndex - diff
          topCovered = true
          passedScrollHeight = scrollY
        }
      }
      if (showedHeight + height > canvasHeight) {
        height = canvasHeight - showedHeight
        bottomCovered = true
      }
      result.push({
        row: i,
        yIndex,
        realStartIndex,
        height,
        realHeight,
        topCovered,
        bottomCovered
      })
      showedHeight += height
    }
    return result
  }

  getColumnsRender (): Array<ColumnRenderInfo> {
    let result: Array<ColumnRenderInfo> = []
    const { scrollX, canvasWidth, rowHeaderWidth, data } = this.state
    const defaultColumn = data.getDefaultColumn()
    const columnCount = data.getColumnCount()
    const frozenColumns = data.freezons[0]
    let showedWidth = rowHeaderWidth
    let i = 0
    for (; i < frozenColumns; i++) {
      const column = data.getColumn(i)
      let width: number
      if (column === null) {
        width = defaultColumn.width!
      } else {
        width = column.width || defaultColumn.width!
      }
      if (width === 0) {
        continue
      }
      let rightCovered = false
      const realWidth = width
      if (showedWidth + width > canvasWidth) {
        width = canvasWidth - showedWidth
        rightCovered = true
      }
      result.push({
        col: i,
        xIndex: showedWidth,
        realStartIndex: showedWidth,
        width: width,
        realWidth,
        leftCovered: false,
        rightCovered
      })
      showedWidth += width
    }
    let passedScrollWidth = 0
    for (; i < columnCount; i++) {
      if (showedWidth >= canvasWidth) {
        break
      }
      const column = data.getColumn(i)
      let width: number
      if (column === null) {
        width = defaultColumn.width!
      } else {
        width = column.width || defaultColumn.width!
      }
      if (width === 0) {
        continue
      }
      const realWidth = width
      let xIndex = showedWidth
      let realStartIndex = xIndex
      let leftCovered = false
      let rightCovered = false
      if (passedScrollWidth < scrollX) {
        if (passedScrollWidth + width <= scrollX) {
          passedScrollWidth += width
          continue
        } else {
          const diff = (scrollX - passedScrollWidth)
          width = realWidth - diff
          realStartIndex = xIndex - diff
          leftCovered = true
          passedScrollWidth = scrollX
        }
      }

      if (showedWidth + width > canvasWidth) {
        width = canvasWidth - showedWidth
        rightCovered = true
      }
      result.push({
        col: i,
        xIndex,
        realStartIndex,
        width,
        realWidth,
        leftCovered,
        rightCovered
      })
      showedWidth += width
    }
    return result
  }

  getCellsRender (rows: Array<RowRenderInfo>, columns: Array<ColumnRenderInfo>): Array<CellRenderInfo> {
    let result: Array<CellRenderInfo> = []
    const data = this.state.data
    const defaultRow = data.getDefaultRow()
    const defaultColumn = data.getDefaultColumn()
    let mergedCells: Set<String> = new Set()
    for (let row of rows) {
      for (let column of columns) {
        const ri = row.row
        const ci = column.col
        if (mergedCells.has(ri + '-' + ci)) {
          continue
        }
        const mergeCell = data.getMergeCell({ row: ri, col: ci })
        if (mergeCell != null) {
          for (let i = 0; i < mergeCell.rowspan; i++) {
            for (let j = 0; j < mergeCell.colspan; j++) {
              const mergedCellStr = (mergeCell.row + i) + '-' + (mergeCell.col + j)
              mergedCells.add(mergedCellStr)
            }
          }
          // find all rows and columns inside render range
          // accumulate the showed height and width as the showed width and height of the merge cell
          // The real left-top point of the merge cell, should be the left-top showed cell minus it's hidden part, minus the hidden cells left or top to it.
          // The real width and height of the merge cell, should be the sum of all the origin height of rows and the origin width of columns covered by this merge cell.
          const showedRows = rows.filter(r => r.row >= mergeCell.row && r.row < mergeCell.row + mergeCell.rowspan)
          const showedColumns = columns.filter(c => c.col >= mergeCell.col && c.col < mergeCell.col + mergeCell.colspan)
          let showedHeight = 0
          showedRows.forEach(r => { showedHeight += r.height })
          let showedWidth = 0
          showedColumns.forEach(c => { showedWidth += c.width })
          const showedRect: Rect = {
            x: column.xIndex,
            y: row.yIndex,
            width: showedWidth,
            height: showedHeight
          }

          let realX = column.realStartIndex
          let realY = row.realStartIndex
          let realWidth = 0
          let realHeight = 0
          for (let i = 0; i < mergeCell.rowspan; i++) {
            const ri = i + mergeCell.row
            const row2 = data.getRow(ri)
            let height: number
            if (row2 === null) {
              height = defaultRow.height!
            } else {
              height = row2.height || defaultRow.height!
            }
            if (height === 0) {
              continue
            }
            if (ri < row.row) {
              realY -= height
            }
            realHeight += height
          }
          for (let i = 0; i < mergeCell.colspan; i++) {
            const ci = i + mergeCell.col
            const column2 = data.getColumn(ci)
            let width: number
            if (column2 === null) {
              width = defaultColumn.width!
            } else {
              width = column2.width || defaultColumn.width!
            }
            if (width === 0) {
              continue
            }
            if (ci < column.col) {
              realX -= width
            }
            realWidth += width
          }
          const actualRect: Rect = {
            x: realX,
            y: realY,
            width: realWidth,
            height: realHeight
          }
          const cellRect: CellRect = {
            row: mergeCell.row,
            col: mergeCell.col,
            showedRect,
            actualRect
          }
          let content = null
          const mergeCellRow = data.getRow(mergeCell.row)
          if (mergeCellRow != null) {
            let cell = mergeCellRow.getCell(column.col)
            if (cell != null) {
              content = cell.getContent(cellRect)
            }
          }
          const mergeCellRender = {
            ...cellRect,
            rowspan: mergeCell.rowspan,
            colspan: mergeCell.colspan,
            content
          }
          result.push(mergeCellRender)

          continue
        }
        const row2 = data.getRow(ri)
        if (row2 == null) {
          continue
        }
        const cell = row2.getCell(ci)
        if (cell == null) {
          continue
        }
        const cellRect: CellRect = {
          row: ri,
          col: ci,
          showedRect: {
            x: column.xIndex,
            y: row.yIndex,
            width: column.width,
            height: row.height
          },
          actualRect: {
            x: column.realStartIndex,
            y: row.realStartIndex,
            width: column.realWidth,
            height: row.realHeight
          }
        }
        const content = cell.getContent(cellRect)
        if (content == null) {
          continue
        }
        const cellInfo: CellRenderInfo = {
          ...cellRect,
          content,
          rowspan: 1,
          colspan: 1
        }
        result.push(cellInfo)
      }
    }
    return result
  }

  getRowHeadersRender (rows: Array<RowRenderInfo>, columns: Array<ColumnRenderInfo>): Array<CellRenderInfo> {
    let result = [] as Array<CellRenderInfo>
    const { rowHeaderWidth } = this.state
    for (let r of rows) {
      const { row, yIndex, realStartIndex, height, realHeight } = r
      let rowName = '' + (row + 1)
      let rowHeader: CellRenderInfo = {
        row,
        col: -1,
        content: {
          ...DEFAULT_CELL_PROPERTY,
          text: rowName
        },
        rowspan: 1,
        colspan: 1,
        showedRect: {
          x: 0, y: yIndex, width: rowHeaderWidth, height
        },
        actualRect: {
          x: 0, y: realStartIndex, width: rowHeaderWidth, height: realHeight
        }
      }
      result.push(rowHeader)
    }
    return result
  }

  getColumnHeadersRender (rows: Array<RowRenderInfo>, columns: Array<ColumnRenderInfo>): Array<CellRenderInfo> {
    let result = [] as Array<CellRenderInfo>
    const { columnHeaderHeight } = this.state
    for (let column of columns) {
      const { col, xIndex, realStartIndex, width, realWidth } = column
      let columnName = getExcelColumnName(col + 1)
      let columnHeader: CellRenderInfo = {
        row: -1,
        col,
        content: {
          ...DEFAULT_CELL_PROPERTY,
          text: columnName
        },
        rowspan: 1,
        colspan: 1,
        showedRect: {
          x: xIndex, y: 0, width, height: columnHeaderHeight
        },
        actualRect: {
          x: realStartIndex, y: 0, width: realWidth, height: columnHeaderHeight
        }
      }
      result.push(columnHeader)
    }
    return result
  }
}
