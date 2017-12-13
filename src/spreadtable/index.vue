<template>
    <div ref="spreadtable" class="spreadtable" :style="containerStyle">
        <div class="toolbar">12312312</div>
        <div>
            <canvas v-if="hasSize" ref="canvas" class="canvas-spreadtable" :width="canvasWidth" :height="canvasHeight" :style="`width:${canvasWidth}px;height:${canvasHeight}px;`"></canvas>
            <div class="horizontal-container" style="width:20px" @click="scroll($event,0)">
                <div class="scroll-bar-horizontal" ref="horizontal" @mousedown="dragMove($event,0)" :style="{width:horizontalBar.size+'px',left:horizontalBar.x+'px'}">
                    <div :style="horizontalBar.move?'background-color:#a1a1a1;':'background-color:#c1c1c1;'"></div>
                </div>
            </div>

            <div class="vertical-container" style="height:20px" @click="scroll($event,1)">
                <div class="scroll-bar-vertical" ref="horizontal" @mousedown="dragMove($event,1)" :style="{height:verticalBar.size+'px',top:verticalBar.y+'px'}">
                    <div :style="verticalBar.move?'background-color:#a1a1a1;':'background-color:#c1c1c1;'"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import config from './config'
import display from './display'
import init from './init'
import paint from './paint'
import events from './events'
import scroll from './scroll'

export default {
    props: ['dataSource', 'dataColumns', 'options'],
    mixins: [init, display, paint, events, scroll],
    data() {
        return {
            data: [],
            allColumns: [],
            allRows: [],
            allCells: [],
            points: {
                columns: null,
                serial: null,
            },
            ratio: 1,
            canvasWidth: 0,
            canvasHeight: 0,
            bodyWidth: 0,
            offset: [0, 0],
            words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            canvas: null,
            isEditing: false,
            focusCell: [0, 0],
            selectArea: null,
        }
    },
    computed: {
        containerStyle() {
            if (this.options.fullscreen) {
                return {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    position: 'fixed',
                }
            }
            return {
                width: this.options.width ? this.options.width : config.default.width,
                height: this.options.height ? this.options.height : config.default.height,
            }
        },
        hasSize() {
            return this.canvasWidth > 0 && this.canvasHeight > 0
        },
    },
    created() {
        this.data = this.initData(this.dataSource)
    },
    mounted() {
        this.init()
    },
    destroyed() {
        this.removeEvents()
    },
    methods: {
        init() {
            this.initSize()
            if (this.hasSize) {
                this.$nextTick(function () { //eslint-disable-line
                    this.initCanvas()
                    this.painted()
                    this.initEvents()
                })
            }
        },
        getCellAt(x, y) {
            for (const rows of this.display.cells) {
                for (const cell of rows) {
                    if (x >= cell.x && y >= cell.y && x <= cell.x + cell.width && y <= cell.y + cell.height) {
                        return cell
                    }
                }
            }
            return null
        },
        getDisplayCell([x, y]) {
            const firstRowIndex = this.display.rows[0].row
            const firstCellIndex = this.display.columns[0].cell
            const lastRowIndex = this.display.rows[this.display.rows.length - 1].row
            const lastCellIndex = this.display.columns[this.display.columns.length - 1].cell
            if (x >= firstRowIndex && x <= lastRowIndex && y >= firstCellIndex && y <= lastCellIndex) {
                return this.display.cells[x - firstRowIndex][y - firstCellIndex]
            }
            return null
        },
        getFocusRowAndColumn([x, y]) {
            const firstRowIndex = this.display.rows[0].row
            const firstCellIndex = this.display.columns[0].cell
            const lastRowIndex = this.display.rows[this.display.rows.length - 1].row
            const lastCellIndex = this.display.columns[this.display.columns.length - 1].cell
            let focusRow = null
            let focusColumn = null
            if (x >= firstRowIndex && x <= lastRowIndex) {
                focusRow = {
                    y: this.display.rows[x - firstRowIndex].y,
                    height: this.display.rows[x - firstRowIndex].height,
                }
            }
            if (y >= firstCellIndex && y <= lastCellIndex) {
                focusColumn = {
                    x: this.display.columns[y - firstCellIndex].x,
                    width: this.display.columns[y - firstCellIndex].width,
                }
            }
            return { focusRow, focusColumn }
        },
    },
}
</script>

<style lang="scss">
.spreadtable {
  display: inline-block;
  overflow: hidden;
  margin: 0;
  padding: 0;
  canvas {
    border: 1px solid #bdbbbc;
    user-select: none;
  }
}
</style>
