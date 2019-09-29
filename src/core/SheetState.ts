import { Vue, Component } from 'vue-property-decorator'
import StateImpl from './data/state'
import StateProxy, { RowRenderInfo, ColumnRenderInfo } from './data/StateProxy'

@Component
export default class SheetState extends Vue {
  state: StateImpl | null = null;
  showedRows: Array<RowRenderInfo> | null = null;
  showedColumns: Array<ColumnRenderInfo> | null = null;

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
}
