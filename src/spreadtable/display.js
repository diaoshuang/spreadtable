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
                        const columnClone = Object.assign({}, column, { x: startX, width })
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
                    const rowClone = Object.assign({}, row, { y: startY })
                    temp.push(rowClone)
                } else if (startY >= canvasHeight) {
                    break
                }
                startY += row.height
            }
            this.display.rows = [...temp]
            return temp
        },
        getDisplayCells() {
            const temp = []
            return temp
        },
    },
}
