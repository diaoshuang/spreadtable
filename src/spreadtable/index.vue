<template>
    <div ref="spreadtable" class="spreadtable" :style="containerStyle" @click="hideMenu" @paste="doPaste">
        <div class="navbar">
            <span v-for="item in navList" class="nav-item" :class="{'cur-nav':item===tool}" @click="changeTool(item)">{{item}}</span>
        </div>
        <div class="tool" v-if="tool==='开始'">
            复制-粘贴
        </div>
        <div class="tool" v-else-if="tool==='插入'">
            <button @click="addImg">插入图片</button>
        </div>
        <div class="fx">
            <div class="fx-focus">{{focusPosition}}</div>
            <div class="fx-content-label">确定</div>
            <div class="fx-content">
                <div class="fx-content-input">
                    fx | <input type="text">
                </div>
            </div>
        </div>
        <div class="spreadtable-main">
            <div class="input-content" :style="inputStyles" ref="input" contenteditable="true" @input="setValueTemp" @keydown.tab.prevent @keydown.enter.prevent @keydown.esc.prevent></div>
            <div class="input-content" ref="inputSelect" contenteditable="true" @keydown.prevent></div>
            <canvas v-if="hasSize" ref="canvas" class="canvas-spreadtable" :width="canvasWidth*ratio" :height="canvasHeight*ratio" :style="`width:${canvasWidth}px;height:${canvasHeight}px;`"></canvas>
            <canvas v-if="hasSize" ref="canvas-plugin" class="canvas-plugin" :width="canvasWidth*ratio" :height="canvasHeight*ratio" :style="`width:${canvasWidth}px;height:${canvasHeight}px;`"></canvas>
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
        <div class="sheet">sheet</div>
        <div v-if="showMenu" class="right-menu" :style="{ top:menuPosition.top,left:menuPosition.left }">
            <div class="right-menu" :style="menuPosition">
                <ul>
                    <li v-if="cornerClick" @click="setWidthHeight">设置宽度和高度</li>
                    <li v-if="topClick" @click="setWidth">设置宽度</li>
                    <li v-if="leftClick" @click="setHeight">设置高度</li>
                    <li>自定义菜单</li>
                    <li>自定义菜单</li>
                    <li>自定义菜单</li>
                    <li>自定义菜单</li>
                    <li>自定义菜单</li>
                </ul>
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
import operation from './operation'
import utils from './utils'

export default {
    props: ['dataSource', 'dataColumns', 'options'],
    mixins: [init, display, paint, events, scroll, operation],
    data() {
        return {
            navList: ['开始', '插入', '布局', '视图', '数据'],
            tool: '开始',
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
            cornerClick: false,
            topClick: false,
            leftClick: false,
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
            return this.getFocusCell(this.focusCell)
        },
        focusPosition() {
            return this.words[this.focusCell[1]] + (this.focusCell[0] + 1)
        },
    },
    watch: {
        focusCell() {
            this.hideInput()
            this.$refs.input.innerHTML = ''
            this.focusInput()
            if (!this.selectArea) {
                this.$refs.inputSelect.innerHTML = this.getCell(this.focusCell).text
            }
        },
        selectArea(value) {
            this.hideInput()
            this.$refs.input.innerHTML = ''
            this.focusInput()
            if (value) {
                const selectCells = this.getCellsBySelect(this.selectArea)
                let copyText = '<table>'
                for (const row of selectCells) {
                    let temp = '<tr>'
                    for (const cell of row) {
                        temp += `<td>${cell.text}</td>`
                    }
                    temp += '</tr>'
                    copyText += temp
                }
                copyText += '</table>'
                this.$refs.inputSelect.innerHTML = copyText
            }
        },
    },
    created() {
        this.data = this.initData(this.dataSource)
        this.$on('updateItem', (data) => {
            this.saveItem(data, true)
        })
        this.$on('updateItems', (data) => {
            this.saveItems(data, true)
        })
    },
    mounted() {
        this.init()
    },
    destroyed() {
        this.removeEvents()
    },
    methods: {
        changeTool(item) {
            this.tool = item
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
            let rowIndex = 0
            let cellIndex = 0
            for (const row of this.display.rows) {
                if (y >= row.realY && y <= row.realY + row.height) {
                    rowIndex = row.row
                }
            }
            for (const column of this.display.columns) {
                if (x >= column.realX && x <= column.realX + column.width) {
                    cellIndex = column.cell
                }
            }
            return this.getFocusCell([rowIndex, cellIndex])
        },
        getRowAt(y) {
            for (const row of this.display.rows) {
                if (y > row.realY && y < row.realY + row.height) {
                    return row
                }
            }
            return null
        },
        getFocusCell(focusCell) {
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
                if (y > (row.realY + row.height) - 3 && y < (row.realY + row.height) + 3) {
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
        setValueTemp(e) {
            this.valueTemp = e.target.innerText
            const focusCellItem = this.getFocusCell(this.focusCell)
            const { width, height, row, cell } = focusCellItem
            let { x, y } = focusCellItem
            if (x < config.width.serial) {
                this.offset.x += config.width.serial - x
                x = config.width.serial
            }
            if (y < config.height.columns) {
                this.offset.y += config.height.columns - y
                y = config.height.columns
            }

            if (!this.isPaste) {
                // 正常键盘录入
                this.showInput(x, y, width, height)
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
                const lastCell = this.getFocusCell([startRowIndex, lastCellIndex])
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
            if (this.numberReg.test(value) || !isNaN(value)) {
                this.allCells[anchor[0]][anchor[1]].type = 'number'
            } else {
                this.allCells[anchor[0]][anchor[1]].type = 'text'
            }
            this.allCells[anchor[0]][anchor[1]].text = value
            this.allCells[anchor[0]][anchor[1]].paintText = [value]
        },
        setCursor(type) {
            if (this.$refs['canvas-plugin'].style.cursor !== type) {
                this.$refs['canvas-plugin'].style.cursor = type
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
            this.imageObjs.sort((a, b) => b.sort - a.sort)

            this.imageObjs.push({
                id: Date.now(),
                url: 'http://www.baidu.com/img/bd_logo1.png',
                x: 100,
                y: 100,
                offset: [...this.offset],
                hover: false,
                sort: this.imageObjs.length > 0 ? this.imageObjs[this.imageObjs.length - 1].sort + 1 : 0,
            })
            this.imageObjs.sort((a, b) => b.sort - a.sort)
            let index = this.imageObjs.length - 1
            for (const item of this.imageObjs) {
                item.sort = index
                index -= 1
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

        },
        setHeight() {

        },
        setWidthHeight() {

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
      position: absolute;
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
      line-height: 19px;
    }
  }
  .right-menu {
    position: fixed;
    width: 130px;
    border: 1px solid #ccc;
    background-color: #fff;
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
    box-sizing:border-box;
    height: 36px;
    padding-top:5px;
    font-size:14px;
    color:#fff;
    background:#539671;
    background: linear-gradient(#539671, #276f47);
    cursor:default;
    .nav-item{
        display:inline-block;
        line-height:26px;
        padding:0 15px 5px;
        margin:0 5px;
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
        &:hover{
            background-color:#469469;
        }
    }
    .cur-nav{
        background-color:#f6f6f6;
        color:#32624c;
        &:hover{
            background-color:#f6f6f6;
        }
    }
  }
  .tool{
      padding:5px 10px;
      background-color:#f6f6f6;
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
    }
    .fx-content {
      display: inline-block;
      position: absolute;
      left: 150px;
      right: 20px;
      height: 28px;
      line-height: 28px;
    }
  }
  .sheet {
    height: 30px;
    position: absolute;
    bottom: 0;
    width: 100%;
  }
}
</style>
