import config from './config'

export default {
    data() {
        return {
            display: {
                columns: [],
                rows: [],
                cells: [],
            },
        }
    },
    methods: {
        getDisplayItems() {
            const displayColumns = this.getDisplayColumns()
            const displayRows = this.getDisplayRows()
            const displayCells = this.getDisplayCells(displayRows, displayColumns)
            if (this.selectArea) {
                const [x, y] = this.selectArea.offset
                this.selectArea.x -= x - this.offset[0]
                this.selectArea.y -= y - this.offset[1]
                this.selectArea.offset = [...this.offset]
            }
            if (this.imageObjs.length > 0) {
                for (const item of this.imageObjs) {
                    const [x, y] = item.offset
                    item.x -= x - this.offset[0]
                    item.y -= y - this.offset[1]
                    if (item.x < config.width.serial + 1) {
                        item.x = config.width.serial + 1
                    }
                    if (item.y < config.height.columns + 1) {
                        item.y = config.height.columns + 1
                    }
                    item.offset = [...this.offset]
                }
            }
            return { displayColumns, displayRows, displayCells }
        },
        getDisplayColumns() {
            const { offset: [x], allColumns, canvasWidth } = this
            const temp = []
            for (const column of allColumns) {
                const realX = column.x + x
                if (realX + column.width >= config.width.serial && realX < canvasWidth) {
                    temp.push({ ...column, realX })
                } else if (realX >= canvasWidth) {
                    break
                }
            }
            // this.display.columns = [...temp]
            return temp
        },
        getDisplayRows() {
            const { offset, allRows, canvasHeight } = this
            const temp = []
            for (const row of allRows) {
                const realY = row.y + offset[1]
                if (realY + row.height >= config.height.columns && realY < canvasHeight) {
                    temp.push({ ...row, realY })
                } else if (realY >= canvasHeight) {
                    break
                }
            }
            this.display.rows = [...temp]
            return temp
        },
        getDisplayCells(displayRows, displayColumns) {
            const { allCells } = this
            const temp = []
            for (const row of displayRows) {
                const cellTemp = []
                for (const column of displayColumns) {
                    const cell = allCells[row.row][column.cell]
                    const cellClone = { ...cell, realX: column.realX, realY: row.realY, height: row.height, width: column.width }
                    cellTemp.push(cellClone)
                }
                temp.push(cellTemp)
            }
            this.display.cells = [...temp]
            return temp
        },
    },
}
