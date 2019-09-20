import { BorderStyle } from '@/core/border'
import { FontStyle, HorizontalAlign, VerticalAlign } from '@/core/data/constants'

export namespace draw {

  export abstract class CanvasObject {
    clipPath?: CanvasObject
    objectCaching: boolean = true

    render (context: CanvasRenderingContext2D) {
      context.save()
      if (this.clipPath) {
        context.beginPath()
        this.clipPath.renderInternal(context)
        context.closePath()
        context.clip()
      }
      this.renderInternal(context)
      context.restore()
    }

    abstract renderInternal(context: CanvasRenderingContext2D): void
  }

  export class StaticCanvas {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    objects: Array<CanvasObject>
    height: number = 0
    width: number = 0

    constructor (canvas: HTMLCanvasElement) {
      this.canvas = canvas
      this.context = canvas.getContext('2d')!
      this._extractCanvasDimention(canvas)
      this.objects = []
    }

    _extractCanvasDimention (canvas: HTMLCanvasElement) {
      let height = this.canvas.getAttribute('height')
      if (height == null) {
        this.height = 0
      } else {
        if (height.endsWith('px')) {
          this.height = parseInt(height.substring(0, height.length - 2)) || 0
        } else {
          this.height = parseInt(height.substring(0, height.length)) || 0
        }
      }
      let width = this.canvas.getAttribute('width')
      if (width == null) {
        this.width = 0
      } else {
        if (width.endsWith('px')) {
          this.width = parseInt(width.substring(0, width.length - 2)) || 0
        } else {
          this.width = parseInt(width.substring(0, width.length)) || 0
        }
      }
    }

    setWidth (value: number | string) {
      let width: string
      if (typeof value === 'number') {
        this.width = value
        width = value + 'px'
      } else {
        if (value.endsWith('px')) {
          this.width = parseInt(value.substring(0, value.length - 2)) || 0
        }
        width = value
      }
      this.canvas.setAttribute('width', width)
    }

    setHeight (value: number | string) {
      let height: string
      if (typeof value === 'number') {
        this.height = value
        height = value + 'px'
      } else {
        if (value.endsWith('px')) {
          this.height = parseInt(value.substring(0, value.length - 2)) || 0
        }
        height = value
      }
      this.canvas.setAttribute('height', height)
    }

    add (object: CanvasObject) {
      this.objects.push(object)
    }

    clear () {
      this.objects = []
    }

    renderAll () {
      this.context.clearRect(0, 0, this.width, this.height)
      for (let object of this.objects) {
        object.render(this.context)
      }
    }
  }

  export class Line extends CanvasObject {
    x: number
    y: number
    x2: number
    y2: number
    borderStyle?: BorderStyle
    constructor (points: Array<number>, borderStyle?: BorderStyle) {
      super()
      this.x = points[0]
      this.y = points[1]
      this.x2 = points[2]
      this.y2 = points[3]
      this.borderStyle = borderStyle
    }

    renderInternal (context: CanvasRenderingContext2D) {
      let shouldStroke = false
      context.beginPath()
      if (this.borderStyle) {
        const { stroke, strokeWidth, strokeDashArray } = this.borderStyle
        if (strokeWidth) {
          shouldStroke = true
          context.lineWidth = strokeWidth
        }
        if (stroke) {
          shouldStroke = true
          context.strokeStyle = stroke
        }

        if (strokeDashArray) {
          // TODO support strokeDashArray like fabric.js does
        }
      }
      context.moveTo(this.x, this.y)
      context.lineTo(this.x2, this.y2)
      shouldStroke && context.stroke()
    }
  }

  export interface IRectOptions {
    left: number
    top: number
    width: number
    height: number
    fill?: string
    absolutePositioned?: boolean
  }

  export class Rect extends CanvasObject {
    options: IRectOptions
    constructor (options: IRectOptions) {
      super()
      this.options = options
    }

    renderInternal (context: CanvasRenderingContext2D) {
      const { left, top, width, height, fill } = this.options
      context.rect(left, top, width, height)
      if (fill) {
        context.fillStyle = fill
        context.fill()
      }
    }
  }

  export interface ITextboxOptions {
    left: number
    top: number
    width?: number
    height?: number
    fill?: string
    fontSize?: number
    fontStyle?: FontStyle
    fontWeight?: string | number
    fontFamily?: string
    textAlign?: HorizontalAlign
    underline?: boolean
    linethrough?: boolean
    overline?: boolean
    verticalAlign?: VerticalAlign
  }

  export class Textbox extends CanvasObject {
    options: ITextboxOptions
    text: string

    constructor (text: string, options: ITextboxOptions) {
      super()
      this.options = options
      this.text = text
    }

    renderInternal (context: CanvasRenderingContext2D) {
      // TODO implement underline, linethrough, overline
      // TODO implement auto wrap according to width, and implement real vertical align and horizontal align in a text box
      const {
        left,
        top,
        width,
        height,
        fill,
        fontSize,
        fontStyle,
        fontWeight,
        fontFamily,
        textAlign,
        underline,
        linethrough,
        overline,
        verticalAlign
      } = this.options
      if (fill) {
        context.fillStyle = fill
      }
      let font = ''
      if (fontStyle) {
        font = fontStyle
      }
      if (fontWeight) {
        if (font) {
          font += ' '
        }
        font = font + fontWeight
      }
      if (fontSize) {
        if (font) {
          font += ' '
        }
        font += fontSize + 'px'
      }
      if (fontFamily) {
        if (font) {
          font += ' '
        }
        font += fontFamily
      }
      font && (context.font = font)
      context.textAlign = 'left'
      context.textBaseline = 'top'
      context.fillText(this.text, left, top)
    }
  }
}
