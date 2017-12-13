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
            return { displayColumns, displayRows, displayCells }
        },
        getDisplayColumns() {
            const { offset: [x], allColumns, canvasWidth } = this
            let startX = config.width.serial + x
            const temp = []
            for (const column of allColumns) {
                if (!column.hidden) {
                    const width = column.width
                    if (startX + width >= config.width.serial && startX < canvasWidth) {
                        const columnClone = { ...column, x: startX, width }
                        temp.push(columnClone)
                    }
                    startX += width
                }
            }
            this.display.columns = [...temp]
            return temp
        },
        getDisplayRows() {
            const { offset, allRows, canvasHeight } = this
            const temp = []
            let startY = config.height.columns + offset[1]
            for (const row of allRows) {
                if (startY + row.height >= config.height.columns && startY < canvasHeight) {
                    const rowClone = { ...row, y: startY }
                    temp.push(rowClone)
                } else if (startY >= canvasHeight) {
                    break
                }
                startY += row.height
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
                    const cellClone = { ...cell, x: column.x, row: row.row, y: row.y, width: column.width, height: row.height }
                    cellTemp.push(cellClone)
                }
                temp.push(cellTemp)
            }
            this.display.cells = [...temp]
            return temp
        },
    },
}
