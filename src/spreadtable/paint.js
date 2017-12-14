import config from './config'
import utils from './utils'

export default {
    methods: {
        painted() {
            const items = this.getDisplayItems()
            this.clearPainted()
            this.doDraw(items)
        },
        clearPainted() {
            this.canvas.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
        },
        doDraw({ displayRows, displayColumns, displayCells }) {
            const ctx = this.canvas

            this.paintOuter(ctx, displayRows, displayColumns, displayCells)
        },
        paintOuter(ctx, displayRows, displayColumns, displayCells) {
            const { canvasWidth, canvasHeight } = this
            // column  纵线
            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = '#cecece'
            ctx.textAlign = 'center'
            for (const { x } of displayColumns) {
                ctx.moveTo(utils.pxFix(x), config.height.columns)
                ctx.lineTo(utils.pxFix(x), canvasHeight)
            }
            // row 横线
            for (const { y } of displayRows) {
                ctx.moveTo(config.width.serial, utils.pxFix(y))
                ctx.lineTo(canvasWidth, utils.pxFix(y))
            }
            ctx.stroke()

            const focusCell = this.getDisplayCell(this.focusCell)
            const { focusRow: _focusRow, focusColumn: _focusColumn } = this.getFocusRowAndColumn(this.focusCell)
            const focusRow = _focusRow
            const focusColumn = _focusColumn

            this.paintData(ctx, displayCells)

            ctx.textAlign = 'center'
            if (this.selectArea) {
                this.paintFocusAndSelect(ctx, focusCell, this.selectArea)
            } else if (focusCell) {
                this.paintFocus(ctx, focusCell)
            }

            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(...this.points.columns)
            ctx.fillRect(...this.points.serial)

            ctx.fillStyle = '#e0e0e0'
            if (focusRow) {
                ctx.fillRect(0, focusRow.y, config.width.serial, focusRow.height)
            }
            if (focusColumn) {
                ctx.fillRect(focusColumn.x, 0, focusColumn.width, config.height.columns)
            }

            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = '#cecece'
            ctx.fillStyle = '#333333'
            for (const { x, title, width } of displayColumns) {
                ctx.moveTo(utils.pxFix(x), 0)
                ctx.lineTo(utils.pxFix(x), config.height.columns)
                this.paintText(ctx, x + utils.half(width), 15, [title])
            }
            // row 横线
            for (const { y, row } of displayRows) {
                ctx.moveTo(0, utils.pxFix(y))
                ctx.lineTo(config.width.serial, utils.pxFix(y))
                this.paintText(ctx, utils.half(config.width.serial), y + 14, [row + 1])
            }
            ctx.stroke()

            ctx.beginPath()
            ctx.strokeStyle = '#bdbbbc'
            ctx.moveTo(config.width.serial, utils.pxFix(config.height.columns))
            ctx.lineTo(canvasWidth, utils.pxFix(config.height.columns))
            ctx.moveTo(utils.pxFix(config.width.serial), config.height.columns)
            ctx.lineTo(utils.pxFix(config.width.serial), canvasHeight)
            ctx.stroke()

            this.paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCell)

            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(0, 0, config.width.serial, config.height.columns)

            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = '#cecece'
            ctx.moveTo(utils.pxFix(config.width.serial), 0)
            ctx.lineTo(utils.pxFix(config.width.serial), utils.pxFix(config.height.columns))
            ctx.lineTo(0, utils.pxFix(config.height.columns))
            ctx.stroke()
        },
        paintText(ctx, x, y, row, maxWidth) {
            if (row.length > 1) {
                for (let b = 0; b < row.length; b += 1) {
                    ctx.fillText(row[b], x, y + (b * 15))
                }
            } else if (maxWidth) {
                const texts = utils.getTextLine(ctx, row[0], maxWidth)
                if (texts) {
                    ctx.fillText(texts[0], x, y, maxWidth)
                }
            } else {
                ctx.fillText(row[0], x, y)
            }
        },
        paintFocus(ctx, cell) {
            const { canvasWidth, canvasHeight } = this
            if (cell.x + cell.width > config.width.serial && cell.y + cell.height > config.height.columns && cell.x < canvasWidth && cell.y < canvasHeight) {
                ctx.beginPath()
                ctx.lineWidth = 2
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(cell.x, cell.y, cell.width + 1, cell.height + 1)
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.strokeRect(utils.pxFix(cell.x + cell.width) - 2, utils.pxFix(cell.y + cell.height) - 2, 6, 6)
                ctx.fillStyle = '#237245'
                ctx.fillRect((cell.x + cell.width) - 1, (cell.y + cell.height) - 1, 5, 5)
                ctx.stroke()
            }
        },
        paintFocusAndSelect(ctx, cell, area) {
            const { canvasWidth, canvasHeight } = this
            if (area.x + area.width > config.width.serial && area.y + area.height > config.height.columns && area.x < canvasWidth && area.y < canvasHeight) {
                ctx.beginPath()
                ctx.lineWidth = 2
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(area.x, area.y, area.width + 1, area.height + 1)
                ctx.fillStyle = 'rgba(0,0,0,0.1)'
                ctx.fillRect(area.x + 2, area.y + 2, area.width - 3, area.height - 3)
                ctx.fillStyle = '#fff'
                if (cell) {
                    ctx.fillRect(cell.x + 1, cell.y + 1, cell.width - 1, cell.height - 1)
                }
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.strokeRect(utils.pxFix(area.x + area.width) - 2, utils.pxFix(area.y + area.height) - 2, 6, 6)
                ctx.fillStyle = '#237245'
                ctx.fillRect((area.x + area.width) - 1, (area.y + area.height) - 1, 5, 5)
                ctx.stroke()
            }
        },
        paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCell) {
            if (focusRow || focusColumn) {
                ctx.beginPath()
                ctx.lineWidth = 2
                ctx.strokeStyle = '#237245'
                if (focusRow) {
                    if (focusCell) {
                        if (focusCell.x <= config.width.serial) {
                            ctx.moveTo(config.width.serial, focusRow.y - 1)
                            ctx.lineTo(config.width.serial, focusRow.y + focusRow.height + 2)
                        } else {
                            ctx.moveTo(config.width.serial, focusRow.y)
                            ctx.lineTo(config.width.serial, focusRow.y + focusRow.height)
                        }
                    } else {
                        ctx.moveTo(config.width.serial, focusRow.y)
                        ctx.lineTo(config.width.serial, focusRow.y + focusRow.height)
                    }
                }
                if (focusColumn) {
                    if (focusCell) {
                        if (focusCell.y <= config.height.columns) {
                            ctx.moveTo(focusColumn.x - 1, config.height.columns)
                            ctx.lineTo(focusColumn.x + focusColumn.width + 2, config.height.columns)
                        } else {
                            ctx.moveTo(focusColumn.x, config.height.columns)
                            ctx.lineTo(focusColumn.x + focusColumn.width, config.height.columns)
                        }
                    } else {
                        ctx.moveTo(focusColumn.x, config.height.columns)
                        ctx.lineTo(focusColumn.x + focusColumn.width, config.height.columns)
                    }
                }
                ctx.stroke()
            }
        },
        paintData(ctx, displayCells) {
            ctx.beginPath()
            ctx.font = 'normal 12px PingFang SC'
            for (const rows of displayCells) {
                let index = 0
                for (const item of rows) {
                    if (item.paintText) {
                        if (item.type === 'text') {
                            ctx.textAlign = 'left'
                            let maxWidth = null
                            if (index < rows.length - 1 && (rows[index + 1].content || rows[index + 1].content === 0)) {
                                maxWidth = item.width
                            }
                            ctx.fillStyle = '#fff'
                            if (!maxWidth) {
                                ctx.fillRect(item.x + 2, item.y + 1, ctx.measureText(item.paintText).width, item.height - 1)
                            }
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, item.x + 2, item.y + 13, [item.paintText], maxWidth)
                        } else {
                            ctx.textAlign = 'right'
                            this.paintText(ctx, item.x + item.width + 2, item.y + 13, [item.paintText])
                        }
                    }
                    index += 1
                }
            }
            ctx.stroke()
        },
    },
}
