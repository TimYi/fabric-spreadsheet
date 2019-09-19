import fabric from 'fabric'
import { HorizontalAlign, VerticalAlign, FontStyle } from './constants'

export interface Point {
  row: number
  col: number
}

export interface Range {
  row: number
  col: number
  rowspan: number
  colspan: number
}

/**
 * rectangle area described by position on canvas
 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * rectangle area described by index in grid
 */
export interface CellRect {
  // row number
  row: number
  // column number
  col: number
  showedRect: Rect
  actualRect: Rect
}

export interface CellProperty {
  padding?: number
  color?: string
  backgroundColor?: string
  fontSize?: number
  fontWeight?: number | string
  fontFamily?: string
  horizontalAlign?: HorizontalAlign
  verticalAlign?: VerticalAlign
  underline?: boolean
  linethrough?: boolean
  overline?: boolean
  shadow?: string
  fontStyle?: FontStyle
}

const DEFAULT_CELL_PROPERTY: CellProperty = {
  padding: 5,
  color: 'black',
  backgroundColor: 'white',
  fontSize: 14,
  fontWeight: 'normal',
  fontFamily: 'Arial',
  horizontalAlign: HorizontalAlign.MIDDLE,
  verticalAlign: VerticalAlign.LEFT,
  underline: false,
  linethrough: false,
  overline: false,
  fontStyle: FontStyle.ITALIC
}

export { DEFAULT_CELL_PROPERTY }

export interface SimpleCellContent extends CellProperty {
  text: string
}

export type CellContent = fabric.fabric.Object | SimpleCellContent

export interface Cell extends CellProperty {
  /**
   * This content will be rendered in the cell.
   * Don't border about the borders, borders will be rendered by the framework.
   */
  getContent: (rect: CellRect) => CellContent | null
  /**
   * Provide content height for auto height calculating.
   * If null is returned, that means this data model don't support auto height.
   */
  getContentHeight: () => number | null
}

export interface RowProperty {
  height: number | null
}

export interface Row extends RowProperty {
  getCell: (ci: number) => Cell | null
}

export interface ColumnProperty {
  width: number | null
}

export interface Column extends ColumnProperty {

}

export interface Data {
  getRowCount: () => number
  getColumnCount: () => number
  getRow: (ri: number) => Row | null
  getColumn: (ci: number) => Column | null
  getDefaultRow: () => RowProperty
  getDefaultColumn: () => ColumnProperty
  getDefaultCell: () => CellProperty
  freezons: [number, number] // [x, y]
  /**
   * Get the merge cell this point is inside, no matter if this point is the left-top point of this merge cell.
   */
  getMergeCell: (point: Point) => Range | null
}
