<script lang="tsx">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { CreateElement } from 'vue'
import vuescroll from 'vuescroll'
import { draw as fabric } from '@/canvas'
import {
  Data,
  SimpleCellContent,
  DEFAULT_CELL_PROPERTY,
  Rect
} from './data/data'
import StateImpl from './data/state'
import {
  RowRenderInfo,
  ColumnRenderInfo,
  CellRenderInfo
} from './data/StateProxy'
import getBorder, { defaultBorderColor, BorderStyle } from './border'
import SheetState from './SheetState'
import Selection from './Selection'
import CoverObjects from './CoverObjects'
import { ZINDEX } from './constants'
fabric.CanvasObject.prototype.objectCaching = false

@Component({
  components: {
    'vue-scroll': vuescroll
  }
})
export default class Sheet extends Mixins(SheetState, Selection, CoverObjects) {
  @Prop({
    type: Object,
    default: () => {
      return {
        bar: {
          background: '#CCCCCC'
        },
        rail: {
          opacity: 0,
          /** Rail's size(Height/Width) , default -> 6px */
          size: '6px'
        }
      }
    }
  })
  readonly scrollOps?: object;

  inited: boolean = false;
  canvas: fabric.StaticCanvas | null = null;
  ticking = false;

  init ({
    data,
    scrollX = 15,
    scrollY = 15,
    canvasWidth,
    canvasHeight,
    rowHeaderWidth,
    columnHeaderHeight
  }: {
    data: Data;
    scrollX?: number;
    scrollY?: number;
    canvasWidth: number;
    canvasHeight: number;
    rowHeaderWidth: number;
    columnHeaderHeight: number;
  }) {
    const state = new StateImpl({
      data,
      scrollX,
      scrollY,
      canvasWidth,
      canvasHeight,
      rowHeaderWidth,
      columnHeaderHeight
    })
    this.state = state
    this.inited = true
    this.$nextTick(() => {
      const canvas = new fabric.StaticCanvas(this.$refs
        .canvas as HTMLCanvasElement)
      this.canvas = canvas
      this.renderCanvas()
    })
  }

  // TODO Design a uniform change state method, to change editor internal state like scroll and canvasWidth.

  setData (data: Data) {
    if (this.state == null) {
      return
    }
    this.state.data = data
    this.renderCanvas()
  }

  getData (): Data | null {
    if (this.state) {
      return this.state.data
    }
    return null
  }

  scrollTo (...args: any[]) {
    const scroll: any = this.$refs.scroll
    scroll.scrollTo(...args)
  }

  handleScroll (vertical: any, horizontal: any) {
    const scrollTop = vertical.scrollTop
    const scrollLeft = horizontal.scrollLeft
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        const state = this.state!
        state.scrollY = scrollTop
        state.scrollX = scrollLeft
        this.renderCanvas()
        this.ticking = false
      })
      this.ticking = true
    }
  }

  renderCanvas () {
    const stateProxy = this.stateProxy!
    const canvas = this.canvas!
    const state = this.state!
    const { canvasHeight, canvasWidth } = this
    const renderInfo = stateProxy.getRenderInfo()
    const { rows, columns, cells, rowHeaders, columnHeaders } = renderInfo
    canvas.clear()
    canvas.setHeight(canvasHeight)
    canvas.setWidth(canvasWidth)
    this.renderBorders({ canvas, rows, columns, canvasHeight, canvasWidth })
    this.renderCells({ canvas, cells, rowHeaders, columnHeaders })
    this.renderCellBorders({ canvas, cells, rowHeaders, columnHeaders })
    let time = new Date().getTime()
    canvas.renderAll()
    console.log(new Date().getTime() - time)
    this.showedRows = rows
    this.showedColumns = columns
  }

  renderCells ({
    canvas,
    cells,
    rowHeaders,
    columnHeaders
  }: {
    canvas: fabric.StaticCanvas;
    cells: Array<CellRenderInfo>;
    rowHeaders: Array<CellRenderInfo>;
    columnHeaders: Array<CellRenderInfo>;
  }) {
    for (let cell of cells) {
      this.renderCell({ canvas, cell })
    }
    for (let cell of rowHeaders) {
      this.renderCell({ canvas, cell })
    }
    for (let cell of columnHeaders) {
      this.renderCell({ canvas, cell })
    }
  }

  /**
   *
   * render cell
   * then rerender cell border, whitch maybe covered by cell content
   */
  renderCell ({
    canvas,
    cell
  }: {
    canvas: fabric.StaticCanvas;
    cell: CellRenderInfo;
  }) {
    const content = cell.content
    if (content != null) {
      if (content instanceof fabric.CanvasObject) {
        const { showedRect } = cell
        const clipPath = new fabric.Rect({
          left: showedRect.x,
          top: showedRect.y,
          width: showedRect.width,
          height: showedRect.height,
          absolutePositioned: true
        })
        content.clipPath = clipPath
        canvas.add(content)
      } else {
        this.renderSimpleCell({ canvas, cell, content })
      }
    }
  }

  renderSimpleCell ({
    canvas,
    cell,
    content
  }: {
    canvas: fabric.StaticCanvas;
    cell: CellRenderInfo;
    content: SimpleCellContent;
  }) {
    // TODO implement vertical align
    const { showedRect, actualRect } = cell
    const {
      padding = 0,
      color,
      backgroundColor,
      fontSize,
      fontWeight,
      fontFamily,
      horizontalAlign,
      verticalAlign,
      underline,
      linethrough,
      overline,
      fontStyle,
      text
    } = { ...DEFAULT_CELL_PROPERTY, ...content }
    const clipPath = new fabric.Rect({
      left: showedRect.x,
      top: showedRect.y,
      width: showedRect.width,
      height: showedRect.height,
      absolutePositioned: true
    })
    const backGround = new fabric.Rect({
      left: actualRect.x,
      top: actualRect.y,
      width: actualRect.width,
      height: actualRect.height,
      fill: backgroundColor
    })
    backGround.clipPath = clipPath
    canvas.add(backGround)

    const textContent = new fabric.Textbox(text, {
      left: actualRect.x + padding,
      top: actualRect.y + padding,
      width: actualRect.width - padding,
      height: actualRect.height - padding,
      fill: color,
      fontSize,
      fontStyle,
      fontWeight,
      fontFamily,
      textAlign: horizontalAlign,
      underline,
      linethrough,
      overline
    })
    textContent.clipPath = clipPath
    canvas.add(textContent)
  }

  renderCellBorders ({
    canvas,
    cells,
    rowHeaders,
    columnHeaders
  }: {
    canvas: fabric.StaticCanvas;
    cells: Array<CellRenderInfo>;
    rowHeaders: Array<CellRenderInfo>;
    columnHeaders: Array<CellRenderInfo>;
  }) {
    const defaultBorder = getBorder({ color: defaultBorderColor })
    for (let cell of cells) {
      this.renderCellBorder({ canvas, cell, defaultBorder })
    }
    for (let cell of rowHeaders) {
      this.renderCellBorder({ canvas, cell, defaultBorder })
    }
    for (let cell of columnHeaders) {
      this.renderCellBorder({ canvas, cell, defaultBorder })
    }
  }

  /**
   * reRender normal border which may be covered by cell content
   * then render custom border
   */
  renderCellBorder ({
    canvas,
    cell,
    defaultBorder
  }: {
    canvas: fabric.StaticCanvas;
    cell: CellRenderInfo;
    defaultBorder: BorderStyle;
  }) {
    // TODO ytm support custom border
    // for normal border, left and top border are always exists.
    // right and bottom border may not exists
    const { showedRect, actualRect, content } = cell
    if (content != null) {
      // if content is rendered, normal border need to be reRender
      {
        const line = new fabric.Line(
          [
            showedRect.x,
            showedRect.y,
            showedRect.x + showedRect.width,
            showedRect.y
          ],
          defaultBorder
        )
        canvas.add(line)
      }
      {
        const line = new fabric.Line(
          [
            showedRect.x,
            showedRect.y,
            showedRect.x,
            showedRect.y + showedRect.height
          ],
          defaultBorder
        )
        canvas.add(line)
      }
      if (
        actualRect.y + actualRect.height ===
        showedRect.y + showedRect.height
      ) {
        const line = new fabric.Line(
          [
            showedRect.x,
            showedRect.y + showedRect.height,
            showedRect.x + showedRect.width,
            showedRect.y + showedRect.height
          ],
          defaultBorder
        )
        canvas.add(line)
      }
      if (actualRect.x + actualRect.width === showedRect.x + showedRect.width) {
        const line = new fabric.Line(
          [
            showedRect.x + showedRect.width,
            showedRect.y,
            showedRect.x + showedRect.width,
            showedRect.y + showedRect.height
          ],
          defaultBorder
        )
        canvas.add(line)
      }
    }
  }

  renderBorders ({
    canvas,
    rows,
    columns,
    canvasHeight,
    canvasWidth
  }: {
    canvas: fabric.StaticCanvas;
    rows: Array<RowRenderInfo>;
    columns: Array<ColumnRenderInfo>;
    canvasHeight: number;
    canvasWidth: number;
  }) {
    // TODO make defaultBorderColor customizeable
    const defaultBorder = getBorder({ color: defaultBorderColor })
    {
      const line = new fabric.Line([0, 0, canvasWidth, 0], defaultBorder)
      canvas.add(line)
    }
    {
      const line = new fabric.Line([0, 0, 0, canvasHeight], defaultBorder)
      canvas.add(line)
    }
    for (let row of rows) {
      if (!row.topCovered) {
        const line = new fabric.Line(
          [0, row.yIndex, canvasWidth, row.yIndex],
          defaultBorder
        )
        canvas.add(line)
      }
      if (!row.bottomCovered) {
        const line = new fabric.Line(
          [0, row.yIndex + row.height, canvasWidth, row.yIndex + row.height],
          defaultBorder
        )
        canvas.add(line)
      }
    }
    for (let column of columns) {
      if (!column.leftCovered) {
        const line = new fabric.Line(
          [column.xIndex, 0, column.xIndex, canvasHeight],
          defaultBorder
        )
        canvas.add(line)
      }
      if (!column.rightCovered) {
        const line = new fabric.Line(
          [
            column.xIndex + column.width,
            0,
            column.xIndex + column.width,
            canvasHeight
          ],
          defaultBorder
        )
        canvas.add(line)
      }
    }
  }

  render (h: CreateElement) {
    if (!this.inited) {
      return <div></div>
    }

    const {
      mouseenter,
      mousemove,
      mouseout,
      mousedown,
      mouseup,
      click,
      dblclick,
      contextmenu,
      handleScroll
    } = this

    const inputEvents = {
      on: {
        mouseenter,
        mousemove,
        mouseout,
        mousedown,
        mouseup,
        click,
        dblclick,
        contextmenu
      }
    }

    const scrollEvents = {
      on: {
        'handle-scroll': handleScroll
      }
    }
    return (
      <div>
        <div class="fabric-spreadsheet-container">
          <div
            style={{
              display: 'block',
              height: this.canvasHeight + 15 + 'px',
              width: this.canvasWidth + 15 + 'px'
            }}
          ></div>
          <div class="fabric-spreadsheet-canvas" style={{ zIndex: ZINDEX.CANVAS_LAYER }}>
            <canvas ref="canvas"></canvas>
          </div>
          <div class="fabric-spreadsheet-overlayer" style={{ zIndex: ZINDEX.UNDER_COVER_LAYER }}>
            {this.internalCoverObjects.map(o => o.render(h, o.rect, o.borderCondition))}
          </div>
          <div
            class="fabric-spreadsheet-overlayer"
            style={{
              height: this.canvasHeight + 'px',
              width: this.canvasWidth + 'px',
              zIndex: ZINDEX.COVER_LAYER
            }}
            {...inputEvents}
          >
            <vue-scroll ref="scroll" ops={this.scrollOps} {...scrollEvents}>
              <div
                style={{
                  height: this.totalHeight + 'px',
                  width: this.totalWidth + 'px'
                }}
              ></div>
            </vue-scroll>
          </div>
        </div>
      </div>
    )
  }
}
</script>

<style lang="scss">
.fabric-spreadsheet-container {
  position: relative;
  overflow: hidden;
}
.fabric-spreadsheet-canvas {
  position: absolute;
  left: 0;
  top: 0;
}
.fabric-spreadsheet-overlayer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
