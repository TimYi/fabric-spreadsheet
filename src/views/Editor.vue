<script lang="tsx">
import { Vue, Component } from 'vue-property-decorator'
import { CreateElement } from 'vue'
import Sheet from '@/core/Sheet.vue'
import { Point, Row, Cell, CellRect } from '@/core/data/data'
import { CoverObject } from '../core/CoverObjects'
@Component({
  components: { Sheet }
})
export default class Editor extends Vue {
  coverObjects: Array<CoverObject>;

  constructor () {
    super()
    const self = this
    this.coverObjects = this.initCoverObjects()
  }

  initCoverObjects () {
    const coverObjects: Array<CoverObject> = [
      {
        row: 3,
        col: 3,
        rowspan: 2,
        colspan: 2,
        render: (h, rect, borderConditions) => {
          const style: any = {
            position: 'absolute',
            boxSizing: 'border-box',
            left: rect.x + 'px',
            top: rect.y + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
          }
          if (!borderConditions.leftCovered) {
            style.borderLeft = 'blue solid 2px'
          }
          if (!borderConditions.rightCovered) {
            style.borderRight = 'blue solid 2px'
          }
          if (!borderConditions.topCovered) {
            style.borderTop = 'blue solid 2px'
          }
          if (!borderConditions.bottomCovered) {
            style.borderBottom = 'blue solid 2px'
          }
          return <div style={style}></div>
        }
      }
    ]
    return coverObjects
  }

  mounted () {
    const sheet: Sheet = this.$refs.sheet as Sheet
    sheet.init({
      canvasHeight: 800,
      canvasWidth: 1000,
      scrollX: 0,
      scrollY: 0,
      rowHeaderWidth: 90,
      columnHeaderHeight: 32,
      data: {
        getRowCount () {
          return 100
        },
        getColumnCount () {
          return 100
        },
        getRow (ri): Row {
          return {
            height: null,
            getCell (ci): Cell {
              return {
                getContent (cellRect: CellRect) {
                  return {
                    text: 'text'
                  }
                },
                getContentHeight () {
                  return null
                }
              }
            }
          }
        },
        getColumn () {
          return null
        },
        getDefaultRow () {
          return {
            height: 32
          }
        },
        getDefaultColumn () {
          return {
            width: 90
          }
        },
        freezons: [1, 1],
        getDefaultCell () {
          return {
            padding: 5
          }
        },
        getMergeCell (point: Point) {
          if (
            point.row >= 3 &&
            point.row < 6 &&
            point.col >= 3 &&
            point.col < 6
          ) {
            return {
              row: 3,
              col: 3,
              rowspan: 3,
              colspan: 3
            }
          }
          return null
        }
      }
    })
  }
}
</script>

<template>
  <div>
    <sheet ref="sheet" :cover-objects="coverObjects"></sheet>
  </div>
</template>
