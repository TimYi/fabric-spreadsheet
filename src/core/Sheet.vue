<script lang="ts">
import { fabric } from 'fabric'
import { Vue, Component } from 'vue-property-decorator'
import { Data, SimpleCellContent, DEFAULT_CELL_PROPERTY } from './data/data'
import StateImpl from './data/state'
import StateProxy, {
  RowRenderInfo,
  ColumnRenderInfo,
  CellRenderInfo
} from './data/StateProxy'
import getBorder, { defaultBorderColor, BorderStyle } from './border'

fabric.Object.prototype.objectCaching = false

@Component
export default class Sheet extends Vue {
  inited: boolean = false;
  state: StateImpl | null = null;
  canvas: fabric.StaticCanvas | null = null;
  ticking = false;

  get stateProxy (): StateProxy | null {
    if (this.state) {
      return new StateProxy(this.state)
    }
    return null
  }

  get canvasWidth (): number {
    if (this.stateProxy) {
      return this.stateProxy.getCanvasWidth()
    }
    return 0
  }

  get canvasHeight (): number {
    if (this.stateProxy) {
      return this.stateProxy.getCanvasHeight()
    }
    return 0
  }

  get totalWidth (): number {
    if (this.stateProxy) {
      return this.stateProxy.getTotalWidth()
    }
    return 0
  }

  get totalHeight (): number {
    if (this.stateProxy) {
      return this.stateProxy.getTotalHeight()
    }
    return 0
  }

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
      canvas.renderOnAddRemove = false
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

  onScroll (e: any) {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        const state = this.state!
        const {
          scrollTop,
          scrollLeft
        }: { scrollTop: number; scrollLeft: number } = e.target
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
      if (content instanceof fabric.Object) {
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
      if (actualRect.y + actualRect.height === showedRect.y + showedRect.height) {
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
}
</script>

<template>
  <div>
    <div class="fabric-spreadsheet-container" v-if="inited">
      <canvas ref="canvas"></canvas>
      <div
        @scroll.passive="onScroll"
        class="fabric-spreadsheet-overlayer"
        :style="{height: (canvasHeight) + 'px', width: (canvasWidth) + 'px'}"
      >
        <div :style="{height: (totalHeight) + 'px', width: (totalWidth) + 'px'}"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.fabric-spreadsheet-container {
  display: inline-block;
  position: relative;
  padding-bottom: 15px;
  padding-right: 15px;
}
.fabric-spreadsheet-overlayer {
  position: absolute;
  top: 0;
  left: 0;
  overflow-x: auto;
  overflow-y: auto;
}
</style>
