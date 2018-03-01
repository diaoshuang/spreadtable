<template>
    <div ref="spreadtable" class="spreadtable" :style="containerStyle" @click="hideMenu" @paste="doPaste">
        <div class="navbar">
            <span class="nav-item cur-nav">Spreadtable</span>
        </div>
        <div class="tool">
            <div class="tool-item">
                <div class="tool-btn">
                    打开
                </div>
            </div>
            <div class="tool-item">
                <div class="paste tool-btn">
                    <img src="../assets/paste.png"><br/>
                    <span>粘贴</span>
                </div>
                <div class="cut-copy">
                    <span class="tool-btn">
                        <img src="../assets/cut.png" alt="">
                        <span>剪切</span>
                    </span>
                    <br/>
                    <span class="tool-btn" style="margin-top:8px;">
                        <img src="../assets/copy.png" alt="">
                        <span>复制</span>
                    </span>
                </div>
            </div>
            <div v-if="true" class="tool-item">
                <select class="font-family-select" style="width:120px;"></select>
                <select class="font-size-select" style="width:60px;"></select><br/>
                <div class="font-style-btn">
                    <span class="tool-btn" style="font-weight:bold;">B</span>
                    <span class="tool-btn" style="font-style:italic; border-left:1px solid #ddd; border-right:1px solid #ddd;">I</span>
                    <span class="tool-btn" style="text-decoration:underline;">U</span>
                </div>
            </div>
            <div class="tool-item">
                <img src="../assets/img.png" width="50" @click="addImg">
            </div>
            <div v-if="true" class="tool-item">
                <span class="tool-btn" style="margin-top:8px;">
                    导出
                </span>
            </div>
        </div>
        <div class="fx">
            <div class="fx-focus">{{focusPosition}}</div>
            <!-- <div class="fx-content-label"><img src="../assets/close.png"></div>
            <div class="fx-content-label"><img src="../assets/check.png"></div> -->
            <div class="fx-content-label" @click="handleFxIconClick"><img src="../assets/function.png"></div>
            <div class="fx-content">
                <div class="fx-content-input">
                    <input ref="fxInput" type="text" v-model="fxValue" :style="'width:'+(canvasWidth-170)+'px;'" @focus="handleFxFocus" @keyup="handleFxKeyup" @blur="handleFxBlur" @input="handleFxInput">
                </div>
            </div>
        </div>
        <div v-if="!loading" class="spreadtable-main">
            <div class="spreadtable-main" :style="`height:${canvasHeight+20}px;`">
                <div class="input-content" :style="inputStyles" ref="input" contenteditable="true" @input="setValueTemp" @keydown.tab.prevent @keydown.enter.prevent @keydown.esc.prevent></div>
                <div class="input-content" ref="inputSelect" @keydown.prevent></div>
                <canvas v-if="hasSize" ref="canvas" class="canvas-spreadtable" :width="canvasWidth*ratio" :height="canvasHeight*ratio" :style="`width:${canvasWidth}px;height:${canvasHeight}px;`"></canvas>
                <canvas v-if="hasSize" ref="canvas-plugin" class="canvas-plugin" :width="canvasWidth*ratio" :height="canvasHeight*ratio" :style="`width:${canvasWidth}px;height:${canvasHeight}px;`"></canvas>
                <div class="horizontal-container" :style="`width:${canvasWidth}px;`" @click="scroll($event,0)">
                    <div class="scroll-bar-horizontal" ref="horizontal" @mousedown="dragMove($event,0)" :style="{width:horizontalBar.size+'px',left:horizontalBar.x+'px'}">
                        <div :style="horizontalBar.move?'background-color:#a1a1a1;':'background-color:#c1c1c1;'"></div>
                    </div>
                </div>
                <div class="vertical-container" :style="`height:${canvasHeight}px;`" @click="scroll($event,1)">
                    <div class="scroll-bar-vertical" ref="horizontal" @mousedown="dragMove($event,1)" :style="{height:verticalBar.size+'px',top:verticalBar.y+'px'}">
                        <div :style="verticalBar.move?'background-color:#a1a1a1;':'background-color:#c1c1c1;'"></div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <div class="loader">
                <div class="loader_overlay"></div>
                <div class="loader_cogs">
                    <div class="loader_cogs__top">
                        <div class="top_part"></div>
                        <div class="top_part"></div>
                        <div class="top_part"></div>
                        <div class="top_hole"></div>
                    </div>
                    <div class="loader_cogs__left">
                        <div class="left_part"></div>
                        <div class="left_part"></div>
                        <div class="left_part"></div>
                        <div class="left_hole"></div>
                    </div>
                    <div class="loader_cogs__bottom">
                        <div class="bottom_part"></div>
                        <div class="bottom_part"></div>
                        <div class="bottom_part"></div>
                        <div class="bottom_hole">
                            <!-- lol -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="sheet">

        </div>
        <div v-show="showMenu&&(cornerClick||topClick||leftClick)" class="right-menu" :style="{ top:menuPosition.top,left:menuPosition.left }">
            <div class="right-menu" :style="menuPosition">
                <ul>
                    <li v-if="cornerClick" @click="setWidthHeight">设置宽度和高度</li>
                    <li v-if="topClick" @click="cellWidthDialog=true">列宽</li>
                    <li v-if="leftClick" @click="rowHeightDialog=true">行高</li>
                </ul>
            </div>
        </div>
        <modal v-if="rowHeightDialog" @close="rowHeightDialog = false" @submit="setHeight">
            <div slot="header">
                行高
            </div>
            <div slot="body">
                <label class="input-label">行高</label>
                <input ref="setHeightInput" type="text" v-model="setRowheight" @keydown.tab.prevent @keydown.enter.prevent @keydown.esc.prevent>
            </div>
        </modal>
        <modal v-if="cellWidthDialog" @close="cellWidthDialog = false" @submit="setWidth">
            <div slot="header">
                列宽
            </div>
            <div slot="body">
                <label class="input-label">列宽</label>
                <input ref="setWidthInput" type="text" v-model="setCellWidth" @keydown.tab.prevent @keydown.enter.prevent @keydown.esc.prevent>
            </div>
        </modal>
    </div>
</template>

<script>
import config from './config'
import display from './display'
import init from './init'
import paint from './paint'
import events from './events'
import scroll from './scroll'
import operation from './operation'
import utils from './utils'
import Modal from './Modal'

const FormulaParser = require('hot-formula-parser').Parser //eslint-disable-line
const parser = new FormulaParser()

export default {
    props: ['dataSource', 'dataColumns', 'options'],
    mixins: [init, display, paint, events, scroll, operation],
    components: { Modal },
    data() {
        return {
            data: [],
            allColumns: [],
            allRows: [],
            allCells: [],
            imageObjs: [],
            points: {
                columns: null,
                serial: null,
            },
            ratio: window.devicePixelRatio,
            canvasWidth: 0,
            canvasHeight: 0,
            bodyWidth: 0,
            bodyHeight: 0,
            offset: [0, 0],
            words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            canvas: null,
            canvasPlugin: null,
            isEditing: false,
            focusCell: [0, 0],
            selectArea: null,
            inputStyles: {},
            valueTemp: '',
            showMenu: false,
            menuPosition: {
                top: '10000px',
                left: '10000px',
            },
            autoAddRow: true,
            numberReg: /^((-?[1-9][0-9]*\.[0-9][0-9]*)|(-?[0]\.[0-9][0-9]*)|(-?[1-9][0-9]*)|([0]{1}))$/,
            canvasX: 0,
            canvasY: 0,

            // 右键
            cornerClick: false,
            topClick: false,
            leftClick: false,
            rowHeightDialog: false,
            cellWidthDialog: false,
            contextRow: null,
            contextCell: null,
            setRowheight: 0,
            setCellWidth: 0,
            fxFocus: false,
            fxValue: '',
            fxEnter: false,

            parseCell: [0, 0],
            expressionCell: [],
            expressionSelect: false,
            expressionItems: [],
            oldFxValue: '',
            expressionSelectDone: false,
            operatorReg: /^[=:\+\-\*/]$/, //eslint-disable-line
            isFirstFxfocus: false,
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
        focusCellItem() {
            return this.getPositionCell(this.focusCell)
        },
        focusPosition() {
            return this.words[this.focusCell[1]] + (this.focusCell[0] + 1)
        },
    },
    watch: {
        focusCell(value) {
            if (!this.selectArea) {
                const text = document.createTextNode(this.getCell(value).text)
                this.$refs.inputSelect.innerHTML = ''
                this.$refs.inputSelect.appendChild(text)
            }
            this.fxValue = this.getCell(this.focusCell).text
        },
        rowHeightDialog(value) {
            if (value) {
                 this.$nextTick(function () { //eslint-disable-line
                     this.$refs.setHeightInput.select()
                 })
            }
        },
        cellWidthDialog(value) {
            if (value) {
                 this.$nextTick(function () { //eslint-disable-line
                     this.$refs.setWidthInput.select()
                 })
            }
        },
        fxValue(value) {
            if (`${value}`.indexOf('=') === 0 && (this.fxFocus || this.isEditing)) {
                this.isFirstFxfocus = false
                console.log(`${value}`.substr(value.length - 1))
                if (this.operatorReg.test(`${value}`.substr(value.length - 1))) {
                    this.oldFxValue = value
                    this.expressionSelectDone = false
                }
                this.expressionSelect = true
                console.log(this.oldFxValue)
            } else {
                this.expressionSelect = false
            }
        },
        fxFocus(value) {
            this.isFirstFxfocus = value
        },
    },
    created() {
        this.$on('updateItem', (data) => {
            this.saveItem(data, true)
        })
        this.$on('updateItems', (data) => {
            this.saveItems(data, true)
        })
        parser.on('callCellValue', (cellCoord, done) => {
            const focusCellItem = this.getCell(this.parseCell)
            if (focusCellItem && !focusCellItem.cellCoord) {
                focusCellItem.cellCoord = []
            }
            focusCellItem.cellCoord.push(cellCoord)
            if (this.expressionCell.findIndex(item => item === focusCellItem) === -1) {
                this.expressionCell.push(focusCellItem)
            }
            let value = this.data[cellCoord.row.index][cellCoord.column.index]
            if (value) {
                if ((`${value}`).indexOf('=') === 0) {
                    const result = parser.parse(value.replace('=', ''))
                    if (result.error) {
                        value = result.error
                    } else {
                        value = parseFloat(result.result.toFixed(2))
                    }
                }
                done(value)
            } else {
                done(0)
            }
        })
        parser.on('callRangeValue', (startCellCoord, endCellCoord, done) => {
            const focusCellItem = this.getCell(this.parseCell)
            if (focusCellItem && !focusCellItem.cellCoord) {
                focusCellItem.cellCoord = []
            }
            focusCellItem.cellCoord.push([startCellCoord, endCellCoord])
            if (this.expressionCell.findIndex(item => item === focusCellItem) === -1) {
                this.expressionCell.push(focusCellItem)
            }
            const fragment = []
            for (let row = startCellCoord.row.index; row <= endCellCoord.row.index; row += 1) {
                const rowData = this.data[row]
                const colFragment = []
                for (let col = startCellCoord.column.index; col <= endCellCoord.column.index; col += 1) {
                    let value = rowData[col]
                    if ((`${value}`).indexOf('=') === 0) {
                        const result = parser.parse(value.replace('=', ''))
                        if (result.error) {
                            value = result.error
                        } else {
                            value = parseFloat(result.result.toFixed(2))
                        }
                    }
                    colFragment.push(value)
                }
                fragment.push(colFragment)
            }
            if (fragment) {
                done(fragment)
            }
        })
    },
    mounted() {
        this.initData(this.dataSource).then(() => {
            this.loading = false
            this.$nextTick(function () { //eslint-disable-line
                this.init()
            })
        })
    },
    destroyed() {
        this.removeEvents()
    },
    methods: {
        copyDataFill() {
            // this.hideInput()
            if (this.selectArea) {
                this.$refs.inputSelect.innerHTML = ''
                const selectCells = this.getCellsBySelect(this.selectArea)

                let lastIndex = this.data.length - 1
                for (let i = this.data.length - 1; i >= 0; i -= 1) {
                    let flag = false
                    for (const item of this.data[i]) {
                        if (item) {
                            flag = true
                        }
                    }
                    if (flag) {
                        break
                    } else {
                        lastIndex -= 1
                    }
                }
                const table = document.createElement('table')
                for (let i = 0; i <= lastIndex; i += 1) {
                    const row = selectCells[i]
                    const tr = document.createElement('tr')
                    if (row) {
                        for (const cell of row) {
                            const td = document.createElement('td')
                            td.innerHTML = cell.text
                            tr.appendChild(td)
                        }
                        table.appendChild(tr)
                    }
                }
                this.$refs.inputSelect.innerHTML = ''
                this.$refs.inputSelect.appendChild(table)
            }
        },
        init() {
            this.initSize()
            if (this.hasSize) {
                this.$nextTick(function () { //eslint-disable-line
                    this.initCanvas()
                    requestAnimationFrame(this.painted)
                    this.initEvents()
                })
            }
        },
        getCellAt(x, y) {
            let rowIndex = -1
            let cellIndex = -1
            const [eX, eY] = this.offset
            for (const row of this.allRows) {
                if (y >= row.y + eY && y <= row.y + eY + row.height) {
                    rowIndex = row.row
                    break
                }
            }
            for (const column of this.allColumns) {
                if (x >= column.x + eX && x < column.x + eX + column.width) {
                    cellIndex = column.cell
                    break
                }
            }
            if (rowIndex === -1) {
                rowIndex = this.allRows.length - 1
            }
            if (cellIndex === -1) {
                cellIndex = this.allColumns.length - 1
            }
            return this.getPositionCell([rowIndex, cellIndex])
        },
        getRowAt(y) {
            for (const row of this.display.rows) {
                if (y > row.realY && y < row.realY + row.height) {
                    return row
                }
            }
            return null
        },
        getPositionCell(focusCell) {
            const cell = this.getCell(focusCell)
            const { height, y } = this.allRows[focusCell[0]]
            const { width, x } = this.allColumns[focusCell[1]]
            cell.height = height
            cell.width = width
            cell.x = x
            cell.y = y
            cell.realX = cell.x + this.offset[0]
            cell.realY = cell.y + this.offset[1]
            return cell
        },
        isInRowDivide(y) {
            for (const row of this.display.rows) {
                if (row.height <= 2) {
                    if (y > (row.realY + 5) - 2 && y < (row.realY + 5) + 2) {
                        return row
                    }
                } else if (y > (row.realY + row.height) - 3 && y < (row.realY + row.height) + 3) {
                    return row
                }
            }
            return null
        },
        isInColumnDivide(x) {
            for (const column of this.display.columns) {
                if (column.width <= 2) {
                    if (x > (column.realX + 5) - 2 && x < (column.realX + 5) + 2) {
                        return column
                    }
                } else if (x > (column.realX + column.width) - 3 && x < (column.realX + column.width) + 3) {
                    return column
                }
            }
            return null
        },
        getColumnAt(x) {
            for (const column of this.display.columns) {
                if (x > column.realX && x < column.realX + column.width) {
                    return column
                }
            }
            return null
        },
        getCellsHeight(focusCell, y) {
            let heightTemp = 0
            const rows = []
            if (focusCell.y > y) {
                for (let i = focusCell.row; i >= 0; i -= 1) {
                    heightTemp += this.display.rows[i].height
                    rows.push(this.display.rows[i])
                    if (heightTemp >= (focusCell.y - y) + focusCell.height) {
                        return { height: heightTemp, rows }
                    }
                }
            } else if (focusCell.y + focusCell.height < y) {
                for (let i = focusCell.row; i < this.display.rows.length; i += 1) {
                    heightTemp += this.display.rows[i].height
                    rows.push(this.display.rows[i])
                    if (heightTemp >= y - focusCell.y) {
                        return { height: heightTemp, rows }
                    }
                }
            }
            return null
        },
        getCellsWidth(focusCell, x) {
            let widthTemp = 0
            const columns = []
            if (focusCell.x > x) {
                for (let i = focusCell.cell; i >= 0; i -= 1) {
                    widthTemp += this.display.columns[i].width
                    columns.push(this.display.columns[i])
                    if (widthTemp >= (focusCell.x - x) + focusCell.width) {
                        return { width: widthTemp, columns }
                    }
                }
            } else if (focusCell.x + focusCell.width < x) {
                for (let i = focusCell.cell; i < this.display.columns.length; i += 1) {
                    widthTemp += this.display.columns[i].width
                    columns.push(this.display.columns[i])
                    if (widthTemp >= x - focusCell.x) {
                        return { width: widthTemp, columns }
                    }
                }
            }
            return null
        },
        isDisplayFocusCell(focusCell) {
            if (focusCell.realX + focusCell.width >= config.width.serial && focusCell.realX < this.canvasWidth
                && focusCell.realY + focusCell.height > config.height.columns && focusCell.realY < this.canvasHeight) {
                return true
            }
            return false
        },
        getCell([x, y]) {
            return this.allCells[x][y]
        },
        getFocusRowAndColumn(focusCell, selectArea) {
            let focusRow = null
            let focusColumn = null
            if (selectArea) {
                focusColumn = { x: selectArea.x, width: selectArea.width }
                focusRow = { y: selectArea.y, height: selectArea.height }
            } else {
                focusRow = { y: focusCell.realY, height: focusCell.height }
                focusColumn = { x: focusCell.realX, width: focusCell.width }
            }
            return { focusRow, focusColumn }
        },
        doSelectArea(eX, eY) {
            const { width, height, row, cell: cellIndex, realX: x, realY: y } = this.getPositionCell(this.focusCell)
            if (eX >= x && eX <= x + width && eY >= y && eY <= y + height) {
                if (this.selectArea !== null) {
                    this.selectArea = null
                }
            } else {
                if (eX < config.width.serial) {
                    eX = config.width.serial
                }
                if (eY < config.height.columns) {
                    eY = config.height.columns
                }
                if (eX > this.canvasWidth) {
                    eX = this.canvasWidth
                }
                if (eY > this.canvasHeight) {
                    eY = this.canvasHeight
                }
                const cell = this.getCellAt(eX, eY)
                if (cell) {
                    let temp = null
                    if (cell.realX >= x && cell.realY >= y) {
                        temp = { type: 0, x, y, width: (cell.realX - x) + cell.width, height: (cell.realY - y) + cell.height, cell: cellIndex, row, offset: [...this.offset] }
                    } else if (cell.realX >= x && cell.realY <= y) {
                        temp = { type: 1, x, y: cell.realY, width: (cell.realX - x) + cell.width, height: (y - cell.realY) + height, row: cell.row, cell: cellIndex, offset: [...this.offset] }
                    } else if (cell.realX <= x && cell.realY <= y) {
                        temp = { type: 2, x: cell.realX, y: cell.realY, width: (x - cell.realX) + width, height: (y - cell.realY) + height, row: cell.row, cell: cell.cell, offset: [...this.offset] }
                    } else if (cell.realX <= x && cell.realY >= y) {
                        temp = { type: 3, x: cell.realX, y, width: (x - cell.realX) + width, height: (cell.realY - y) + cell.height, row, cell: cell.cell, offset: [...this.offset] }
                    }
                    temp.rowCount = Math.abs(cell.row - row) + 1
                    temp.cellCount = Math.abs(cell.cell - cellIndex) + 1

                    if (!this.selectArea || !utils.compareObj(this.selectArea, temp)) {
                        this.selectArea = temp
                    }
                }
            }
        },
        setValueTemp(e) {
            this.valueTemp = e.target.innerText
            const focusCellItem = this.getPositionCell(this.focusCell)
            const { width, height, row, cell } = focusCellItem
            let { realX: x, realY: y } = focusCellItem
            if (x < config.width.serial) {
                this.offset[0] += config.width.serial - x
                x = config.width.serial

                requestAnimationFrame(this.painted)
            }
            if (y < config.height.columns) {
                this.offset[1] += config.height.columns - y
                y = config.height.columns
                requestAnimationFrame(this.painted)
            }

            if (!this.isPaste) {
                // 正常键盘录入
                if (!this.isEditing) {
                    this.showInput(x, y, width, height)
                }
                this.fxValue = this.valueTemp
            } else if (!this.isEditing) {
                this.isPaste = false
                const objE = document.createElement('div')
                objE.innerHTML = e.target.innerHTML
                const dom = objE.childNodes
                e.target.innerHTML = ''
                const pasteData = []
                let hasTable = false
                for (let i = 0; i < dom.length; i += 1) {
                    if (dom[i].tagName === 'TABLE') {
                        hasTable = true
                        const trs = dom[i].querySelectorAll('tr')
                        for (const tr of trs) {
                            const arrTmp = []
                            for (const td of tr.cells) {
                                let str = td.innerText
                                str = str.replace(/^\s+|\s+$/g, '')
                                arrTmp.push(str)
                                const colspan = td.getAttribute('colspan')
                                if (colspan) {
                                    for (let j = 1; j < colspan; j += 1) {
                                        arrTmp.push('')
                                    }
                                }
                            }
                            pasteData.push(arrTmp)
                        }
                    }
                }
                if (!hasTable) {
                    pasteData.push([this.valueTemp])
                }
                const modifyData = []
                let lastCellIndex = 0
                let startRowIndex = row
                for (const rowData of pasteData) {
                    if (startRowIndex < this.allRows.length) {
                        let startCellIndex = cell
                        const temp = []
                        for (let i = 0; i < rowData.length; i += 1) {
                            temp.push({
                                anchor: [startRowIndex, startCellIndex],
                                value: rowData[i],
                            })
                            startCellIndex += 1
                        }
                        if (startCellIndex - 1 > lastCellIndex) {
                            lastCellIndex = startCellIndex - 1
                        }
                        modifyData.push(temp)
                        startRowIndex += 1
                    }
                }

                startRowIndex -= 1
                const lastCell = this.getPositionCell([startRowIndex, lastCellIndex])
                if (startRowIndex - row > 1 || lastCellIndex - cell > 0) {
                    this.selectArea = { type: 0, x, y, width: (lastCell.realX - x) + lastCell.width, height: (lastCell.realY - y) + lastCell.height, cell, row, offset: [...this.offset] }
                    this.selectArea.RowCount = startRowIndex - row
                    this.selectArea.cellCount = lastCellIndex - cell
                }

                this.$emit('updateItems', modifyData)
            } else {
                // 编辑状态下
                this.isPaste = false
                e.target.innerHTML = e.target.innerText
            }
        },
        showInput(x, y, width, height) {
            this.isEditing = true
            let maxWidth = this.canvasWidth - x - 2
            if (this.canvasWidth - x - 2 < width - 3) {
                requestAnimationFrame(this.painted)
                maxWidth += width
            }

            this.inputStyles = {
                position: 'absolute',
                top: `${y + 2}px`,
                left: `${x + 4}px`,
                minWidth: `${width - 3}px`,
                maxWidth: `${maxWidth}px`,
                minHeight: `${height - 1}px`,
            }
        },
        hideInput() {
            this.isEditing = false
            this.$refs.input.innerHTML = ''
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
        focusFxInput() {
            setTimeout(() => {
                this.$refs.fxInput.focus()
            }, 0)
        },
        save() {
            if (this.isEditing) {
                if (this.$refs.input.innerText !== this.allCells[this.focusCell[0]][this.focusCell[1]].text) {
                    this.$emit('updateItem', {
                        anchor: [...this.focusCell],
                        value: this.$refs.input.innerText,
                    })
                }
            }
        },
        saveItem(data) {
            let value = data.value
            if (this.numberReg.test(value)) {
                value = utils.toScientificNumber(parseFloat(value))
            }
            this.data[data.anchor[0]][data.anchor[1]] = value
            this.setCellItemByKey(data.anchor, value)
            requestAnimationFrame(this.painted)
            this.$emit('updateValue', [{ anchor: data.anchor, value }])
        },
        saveItems(data) {
            const returnData = []
            if (data.length > this.data.length) {
                if (this.autoAddRow) {
                    // TODO
                } else {
                    data.splice(this.data.length, data.length - this.data.length)
                }
            }
            for (const row of data) {
                const temp = []
                for (const item of row) {
                    if (this.numberReg.test(item.value)) {
                        item.value = parseFloat(item.value)
                    }
                    this.data[item.anchor[0]][item.anchor[1]] = item.value
                    this.setCellItemByKey(item.anchor, item.value)
                    temp.push({ anchor: item.anchor, value: item.value })
                }
                returnData.push(temp)
            }
            requestAnimationFrame(this.painted)
            this.$emit('updateValue', returnData)
        },
        setCellItemByKey(anchor, value) {
            if (typeof value !== 'number') {
                if ((`${value}`).indexOf('=') === 0) {
                    this.allCells[anchor[0]][anchor[1]].text = (`${value}`).toUpperCase()
                } else {
                    this.allCells[anchor[0]][anchor[1]].text = value
                }
            } else {
                this.allCells[anchor[0]][anchor[1]].text = value
            }
            const cell = this.getCell(anchor)
            delete cell.cellCoord
            const index = this.expressionCell.findIndex(item => item === cell)
            if (index !== -1) {
                this.expressionCell.splice(index, 1)
            }
            if ((`${value}`).indexOf('=') === 0 && value.length > 1 && (!this.fxFocus || this.fxEnter)) {
                this.fxEnter = false
                this.parseCell = [...anchor]
                const result = parser.parse(value.replace('=', ''))
                if (result.error) {
                    value = result.error
                } else {
                    value = parseFloat(result.result.toFixed(4))
                }
            }
            if (this.numberReg.test(value) || !isNaN(value)) {
                this.allCells[anchor[0]][anchor[1]].type = 'number'
            } else {
                this.allCells[anchor[0]][anchor[1]].type = 'text'
            }
            this.allCells[anchor[0]][anchor[1]].paintText = [value]
            loop:for (const item of this.expressionCell) {
                for (const coord of item.cellCoord) {
                    if (coord instanceof Array) {
                        const startCoord = coord[0]
                        const endCoord = coord[1]
                        if (anchor[0] >= startCoord.row.index && anchor[0] <= endCoord.row.index && anchor[1] >= startCoord.column.index && anchor[1] <= endCoord.column.index) {
                            this.doParseExpression(item)
                            continue loop
                        }
                    } else if (anchor[0] === coord.row.index && anchor[1] === coord.column.index) {
                        this.doParseExpression(item)
                        continue loop
                    }
                }
            }
        },
        doParseExpression(item) {
            const result = parser.parse(item.text.replace('=', ''))
            if (result.error) {
                item.paintText = [result.error]
            } else {
                item.paintText = [parseFloat(result.result.toFixed(2))]
            }
        },
        isInVerticalQuadrant(focusCell, x, y) {
            const startPoint = [focusCell.x, focusCell.y]
            const endPoint = [focusCell.x + focusCell.width, focusCell.y + focusCell.height]
            if (x > endPoint[0] && y > endPoint[1]) {
                if (x - endPoint[0] > y - endPoint[1]) {
                    return false
                }
                return true
            } else if (x > endPoint[0] && y < startPoint[1]) {
                if (x - endPoint[0] > startPoint[1] - y) {
                    return false
                }
                return true
            } else if (x < startPoint[0] && y < startPoint[1]) {
                if (startPoint[0] - x > startPoint[1] - y) {
                    return false
                }
                return true
            } else if (x < startPoint[0] && y > endPoint[1]) {
                if (startPoint[0] - x > y - endPoint[1]) {
                    return false
                }
                return true
            }
            return false
        },
        getCellsBySelect({ row, cell, rowCount, cellCount }) {
            if (rowCount === Infinity) {
                rowCount = this.allCells.length
            }
            if (cellCount === Infinity) {
                cellCount = this.allColumns.length
            }
            const cells = []
            for (let i = row; i < row + rowCount; i += 1) {
                const rowItem = this.allCells[i]
                const temp = []
                for (let j = cell; j < cell + cellCount; j += 1) {
                    temp.push(rowItem[j])
                }
                cells.push(temp)
            }
            return cells
        },
        doPaste() {
            this.isPaste = true
        },
        addImg() {
            this.imageObjs.push({
                id: Date.now(),
                url: 'https://cn.vuejs.org/images/logo.png',
                x: 100,
                y: 100,
                offset: [...this.offset],
                hover: false,
                sort: this.imageObjs.length > 0 ? this.imageObjs[this.imageObjs.length - 1].sort + 1 : 0,
            })

            let index = 0
            for (const item of this.imageObjs) {
                item.sort = index
                index += 1
            }
            requestAnimationFrame(this.painted)
        },
        hideMenu() {
            this.menuPosition = {
                top: '10000px',
                left: '10000px',
            }
        },
        setWidth() {
            const differenceValue = this.setCellWidth - this.contextCell.width
            this.allColumns[this.contextCell.cell].width += differenceValue
            for (let i = this.contextCell.cell + 1; i < this.allColumns.length; i += 1) {
                this.allColumns[i].x += differenceValue
            }
            if (this.selectArea) {
                this.selectArea = null
            }
            this.bodyWidth += differenceValue
            requestAnimationFrame(this.painted)
            this.cellWidthDialog = false
        },
        setHeight() {
            const differenceValue = this.setRowheight - this.contextRow.height
            this.allRows[this.contextRow.row].height += differenceValue
            for (let i = this.contextRow.row + 1; i < this.allRows.length; i += 1) {
                this.allRows[i].y += differenceValue
            }
            if (this.selectArea) {
                this.selectArea = null
            }
            this.bodyHeight += differenceValue
            requestAnimationFrame(this.painted)
            this.rowHeightDialog = false
        },
        setWidthHeight() {

        },
        handleFxIconClick() {
            this.$refs.fxInput.focus()
            this.fxValue = '='
        },
        handleFxFocus() {
            this.fxFocus = true
            // if (`${this.fxValue}`.indexOf('=') === 0) {
            //     this.oldFxValue = this.fxValue
            //     this.expressionSelect = true
            // } else {
            //     this.expressionSelect = false
            // }
        },
        handleFxBlur() {
            // this.fxFocus = false
            // this.$emit('updateItem', {
            //     anchor: [...this.focusCell],
            //     value: this.fxValue,
            // })
        },
        handleFxKeyup() {
        },
        handleFxInput() {
            this.$emit('updateItem', {
                anchor: [...this.focusCell],
                value: this.fxValue,
            })
        },
    },
}
</script>

<style lang="scss">
* {
  font-family: "PingFang SC", "Lantinghei SC", "Microsoft YaHei", "HanHei SC",
    "Helvetica Neue", "Open Sans", Arial, "Hiragino Sans GB", "微软雅黑",
    "STHeiti", "WenQuanYi Micro Hei", SimSun, sans-serif;
}
.spreadtable {
  display: inline-block;
  overflow: hidden;
  margin: 0;
  padding: 0;
  .spreadtable-main {
    border-bottom: 1px solid#ddd;
    position: relative;
    canvas {
      border: 1px solid #bdbbbc;
      user-select: none;
      position: absolute;
    }
    .canvas-spreadtable {
      z-index: 90;
      background-color: #fff;
    }
    .canvas-plugin {
      z-index: 100;
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
      z-index: 95;
      line-height: 19px;
      cursor: text;
    }
  }
  .right-menu {
    position: fixed;
    width: 130px;
    border: 1px solid #ccc;
    background-color: #fff;
    z-index: 10000;
    box-shadow: 2px 2px 3px #ddd;
    ul {
      margin: 0;
      padding: 0;
      li {
        list-style: none;
        font-size: 12px;
        padding: 0 20px;
        line-height: 28px;
        cursor: default;
        &:hover {
          background-color: #ececec;
        }
      }
    }
  }
  .navbar {
    box-sizing: border-box;
    height: 36px;
    padding-top: 5px;
    background: #539671;
    background: linear-gradient(#4e8a69, #276f47);
    cursor: default;
    .nav-item {
      display: inline-block;
      line-height: 26px;
      padding: 0 15px 5px;
      margin: 0 5px;
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
      font-size: 14px;
      color: #fff;
      font-weight: bold;
      &:hover {
        background-color: #469469;
      }
    }
    .cur-nav {
      background-color: #f6f6f6;
      color: #32624c;
      &:hover {
        background-color: #f6f6f6;
      }
    }
  }
  .tool {
    padding: 5px 0;
    background-color: #f6f6f6;
    font-size: 0;
    height: 60px;
    line-height: 1;
    cursor: default;
    overflow: auto;
    .tool-item {
      float: left;
      height: 60px;
      padding: 0 10px;
      border-right: 1px solid #ddd;
      select {
        font-size: 12px;
        border: 1px solid #ddd;
        height: 26px;
        padding: 0 7px;
        outline: none;
      }
    }
    .tool-btn {
      display: inline-block;
      padding: 3px;
      text-align: center;
      font-size: 12px;
      cursor: pointer;
      &:hover {
        background-color: #dedede;
      }
    }
    .paste {
      float: left;
      margin-right: 5px;
      text-align: center;
      img {
        width: 36px;
        margin-bottom: 5px;
      }
    }
    .cut-copy {
      float: left;
      img {
        width: 20px;
        vertical-align: -5px;
        margin-right: 3px;
      }
    }
    .font-style-btn {
      margin-top: 10px;
      display: inline-block;
      border: 1px solid #ddd;
      border-radius: 3px;
      .tool-btn {
        width: 16px;
        font-size: 14px;
      }
    }
  }
  .fx {
    height: 28px;
    line-height: 28px;
    font-size: 14px;
    margin-bottom: 2px;
    border-bottom: 1px solid #ddd;
    border-top: 1px solid #ddd;
    .fx-focus {
      display: inline-block;
      width: 60px;
      padding-left: 15px;
      border-right: 1px solid #ddd;
    }
    .fx-content-label {
      display: inline-block;
      vertical-align: middle;
      height: 18px;
      margin: 0 3px;
      line-height: 27px;
      cursor: pointer;
      img {
        height: 16px;
      }
    }
    .fx-content {
      display: inline-block;
      position: absolute;
      right: 0;
      height: 28px;
      line-height: 28px;
      position: relative;
      &:after {
        content: " ";
        position: absolute;
        width: 1px;
        height: 22px;
        background-color: #ddd;
        top: 4px;
      }
      input {
        margin-left: 8px;
        border: none;
        outline: none;
      }
    }
  }
  .sheet {
    height: 30px;
    position: absolute;
    bottom: 0;
    width: 100%;
  }
}
.input-label {
  font-size: 13px;
  margin-right: 20px;
}
.horizontal-container {
  position: absolute;
  height: 18px;
  left: 0;
  bottom: 0;
  background: #eee;
  user-select: none;
  .scroll-bar-horizontal {
    position: absolute;
    bottom: 2px;
    height: 14px;
    padding: 0 2px;
    > div {
      width: 100%;
      height: 14px;
    }
  }
}
.vertical-container {
  user-select: none;
  position: absolute;
  width: 18px;
  top: 0;
  right: 0;
  background: #eee;
  .scroll-bar-vertical {
    position: absolute;
    right: 2px;
    width: 14px;
    padding: 2px 0;
    > div {
      width: 14px;
      height: 100%;
    }
  }
}
$pink: #237245;
$blue: #999999;
$yellow: #deb480;
@mixin center {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
@mixin hole {
  border-radius: 100%;
  background: white;
  position: absolute;
}
.loader {
  height: 100%;
  position: relative;
  margin: 250px auto;
  width: 400px;
  &_overlay {
    width: 150px;
    height: 150px;
    background: transparent;
    box-shadow: 0px 0px 0px 1000px rgba(255, 255, 255, 0.67),
      0px 0px 19px 0px rgba(0, 0, 0, 0.16) inset;
    border-radius: 100%;
    z-index: -1;
    @include center;
  }
  &_cogs {
    z-index: -2;
    width: 100px;
    height: 100px;
    top: -120px !important;
    @include center;
    &__top {
      position: relative;
      width: 100px;
      height: 100px;
      transform-origin: 50px 50px;
      animation: rotate 10s infinite linear;
      @for $i from 1 through 3 {
        div:nth-of-type(#{$i}) {
          transform: rotate($i * 30deg);
        }
      }
      div.top_part {
        width: 100px;
        border-radius: 10px;
        position: absolute;
        height: 100px;
        background: $pink;
      }
      div.top_hole {
        width: 50px;
        height: 50px;
        @include hole;
        @include center;
      }
    }
    &__left {
      position: relative;
      width: 80px;
      transform: rotate(16deg);
      top: 28px;
      transform-origin: 40px 40px;
      animation: rotate_left 10s 0.1s infinite reverse linear;
      left: -24px;
      height: 80px;
      @for $i from 1 through 3 {
        div:nth-of-type(#{$i}) {
          transform: rotate($i * 30deg);
        }
      }
      div.left_part {
        width: 80px;
        border-radius: 6px;
        position: absolute;
        height: 80px;
        background: $blue;
      }
      div.left_hole {
        width: 40px;
        height: 40px;
        @include hole;
        @include center;
      }
    }
    &__bottom {
      position: relative;
      width: 60px;
      transform: rotate(4deg);
      top: -65px;
      transform-origin: 30px 30px;
      animation: rotate_right 10s 0.1s infinite linear;
      left: 79px;
      height: 60px;
      @for $i from 1 through 3 {
        div:nth-of-type(#{$i}) {
          transform: rotate($i * 30deg);
        }
      }
      div.bottom_part {
        width: 60px;
        border-radius: 5px;
        position: absolute;
        height: 60px;
        background: $yellow;
      }
      div.bottom_hole {
        width: 30px;
        height: 30px;
        @include hole;
        @include center;
      }
    }
  }
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes rotate_left {
  from {
    transform: rotate(16deg);
  }
  to {
    transform: rotate(376deg);
  }
}
@keyframes rotate_right {
  from {
    transform: rotate(4deg);
  }
  to {
    transform: rotate(364deg);
  }
}
</style>
