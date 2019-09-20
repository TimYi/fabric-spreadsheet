<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Sheet from '@/core/Sheet.vue'
import { Point, Row, Cell, CellRect } from '@/core/data/data'
@Component({
  components: { Sheet }
})
export default class Editor extends Vue {
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
          return 32
        },
        getColumnCount () {
          return 20
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
          return null
        }
      }
    })
  }
}
</script>

<template>
  <div>
    <sheet ref="sheet"></sheet>
  </div>
</template>
