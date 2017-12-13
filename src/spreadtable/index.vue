<template>
    <div ref="spreadtable" class="spreadtable" :style="containerStyle">
        <div class="toolbar">12312312</div>
        <div class="spreadtable-main">
            <div class="input-content" :style="inputStyles" ref="input" contenteditable="true" @input="setValueTemp" @blur="handleInputBlur" @keydown.tab.prevent @keydown.enter.prevent @keydown.esc.prevent></div>
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
            inputStyles: {},
            valueTemp: '',
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
    watch: {
        focusCell() {
            this.hideInput()
            this.$refs.input.innerHTML = ''
            this.focusInput()
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
                let height = this.display.rows[x - firstRowIndex].height
                let y = this.display.rows[x - firstRowIndex].y
                if (this.selectArea) {
                    if (this.selectArea.type === 1 || this.selectArea.type === 2) {
                        y -= this.selectArea.height - height
                    }
                    height = this.selectArea.height
                }
                focusRow = { y, height }
            }
            if (y >= firstCellIndex && y <= lastCellIndex) {
                let width = this.display.columns[y - firstCellIndex].width
                let x = this.display.columns[y - firstCellIndex].x
                if (this.selectArea) {
                    if (this.selectArea.type === 2 || this.selectArea.type === 3) {
                        x -= this.selectArea.width - width
                    }
                    width = this.selectArea.width
                }
                focusColumn = { x, width }
            }
            return { focusRow, focusColumn }
        },
        handleInputBlur() {

        },
        setValueTemp(e) {
            this.valueTemp = e.target.innerText
            const focusCell = this.getDisplayCell(this.focusCell)
            let { x, y } = focusCell
            if (x < config.width.serial) {
                this.offset.x += config.width.serial - x
                x = config.width.serial
            }
            if (y < config.height.columns) {
                this.offset.y += config.height.columns - y
                y = config.height.columns
            }
            this.showInput(x, y, focusCell.width, focusCell.height)
        },
        showInput(x, y, width, height) {
            this.isEditing = true
            let maxWidth = this.canvasWidth - x - 2
            if (this.canvasWidth - x - 2 < width - 3) {
                this.offset[0] -= width
                this.painted()
                maxWidth += width
            }

            this.inputStyles = {
                position: 'absolute',
                top: `${y + 3}px`,
                left: `${x + 3}px`,
                minWidth: `${width - 3}px`,
                maxWidth: `${maxWidth}px`,
                minHeight: `${height - 3}px`,
            }
        },
        hideInput() {
            this.isEditing = false
            this.inputStyles = {
                top: '-10000px',
                left: '-10000px',
            }
        },
        focusInput() {
            setTimeout(() => {
                this.$refs.input.focus()
            }, 0)
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
  .spreadtable-main {
    position: relative;
    canvas {
      border: 1px solid #bdbbbc;
      user-select: none;
    }
    .input-content {
      top: -10000px;
      left: -10000px;
      outline: none;
      color: #666;
      border-radius: 0px;
      font-size: 12px;
      position: fixed;
      background-color: #fff;
      z-index: 10;
      line-height: 22px;
    }
  }
}
</style>
