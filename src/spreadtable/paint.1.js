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
            const { canvasWidth, canvasHeight, ratio } = this
            // column  纵线
            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = '#cecece'
            ctx.textAlign = 'center'
            for (const { x } of displayColumns) {
                ctx.moveTo(utils.pxFix(x * ratio), config.height.columns * ratio)
                ctx.lineTo(utils.pxFix(x * ratio), canvasHeight * ratio)
            }
            // row 横线
            for (const { y } of displayRows) {
                ctx.moveTo(config.width.serial * ratio, utils.pxFix(y * ratio))
                ctx.lineTo(canvasWidth * ratio, utils.pxFix(y * ratio))
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

            ctx.fillStyle = '#f5f5f5'
            ctx.fillRect(...this.points.columns)
            ctx.fillRect(...this.points.serial)

            ctx.fillStyle = '#e0e0e0'
            if (focusRow) {
                ctx.fillRect(0, focusRow.y * ratio, config.width.serial * ratio, focusRow.height * ratio)
            }
            if (focusColumn) {
                ctx.fillRect(focusColumn.x * ratio, 0, focusColumn.width * ratio, config.height.columns * ratio)
            }
            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = '#cecece'
            ctx.fillStyle = '#333333'
            for (const { x, title, width } of displayColumns) {
                ctx.moveTo(utils.pxFix(x * ratio), 0)
                ctx.lineTo(utils.pxFix(x * ratio), config.height.columns * ratio)
                this.paintText(ctx, (x + utils.half(width)) * ratio, 15 * ratio, [title])
            }
            // row 横线
            for (const { y, row } of displayRows) {
                ctx.moveTo(0, utils.pxFix(y * ratio))
                ctx.lineTo(config.width.serial * ratio, utils.pxFix(y * ratio))
                this.paintText(ctx, utils.half(config.width.serial) * ratio, (y + 14) * ratio, [row + 1])
            }
            ctx.stroke()

            ctx.beginPath()
            ctx.strokeStyle = '#bdbbbc'
            ctx.moveTo(config.width.serial * ratio, utils.pxFix(config.height.columns * ratio))
            ctx.lineTo(canvasWidth * ratio, utils.pxFix(config.height.columns * ratio))
            ctx.moveTo(utils.pxFix(config.width.serial * ratio), config.height.columns * ratio)
            ctx.lineTo(utils.pxFix(config.width.serial * ratio), canvasHeight * ratio)
            ctx.stroke()

            this.paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCell)

            ctx.fillStyle = '#fbfbfb'
            ctx.fillRect(0, 0, config.width.serial * ratio, config.height.columns * ratio)

            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = '#cecece'
            ctx.moveTo(utils.pxFix(config.width.serial * ratio), 0)
            ctx.lineTo(utils.pxFix(config.width.serial * ratio), utils.pxFix(config.height.columns * ratio))
            ctx.lineTo(0, utils.pxFix(config.height.columns * ratio))
            ctx.stroke()

            if (focusRow && focusColumn && focusRow.y <= config.height.columns && focusColumn.x <= config.width.serial) {
                ctx.fillStyle = '#237245'
                ctx.fillRect((config.width.serial - 1) * ratio, (config.height.columns - 1) * ratio, 2 * ratio, 2 * ratio)
            }

            ctx.beginPath()
            ctx.moveTo((config.width.serial - 3.5) * ratio, 7 * ratio)
            ctx.lineTo((config.width.serial - 3.5) * ratio, (config.height.columns - 3.5) * ratio)
            ctx.lineTo(15 * ratio, (config.height.columns - 3.5) * ratio)
            ctx.closePath()
            ctx.strokeStyle = '#dfdfdf'
            ctx.fillStyle = '#dfdfdf'
            ctx.fill()
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
            const { canvasWidth, canvasHeight, ratio } = this
            if (cell.x + cell.width > config.width.serial && cell.y + cell.height > config.height.columns && cell.x < canvasWidth && cell.y < canvasHeight) {
                ctx.beginPath()
                ctx.lineWidth = 2
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(cell.x * ratio, cell.y * ratio, (cell.width + 1) * ratio, (cell.height + 1) * ratio)
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.strokeRect((utils.pxFix(cell.x + cell.width) - 2) * ratio, (utils.pxFix(cell.y + cell.height) - 2) * ratio, 6 * ratio, 6 * ratio)
                ctx.fillStyle = '#237245'
                ctx.fillRect(((cell.x + cell.width) - 1) * ratio, ((cell.y + cell.height) - 1) * ratio, 5 * ratio, 5 * ratio)
                ctx.stroke()
            }
        },
        paintFocusAndSelect(ctx, cell, area) {
            const { canvasWidth, canvasHeight, ratio } = this
            if (area.x + area.width > config.width.serial && area.y + area.height > config.height.columns && area.x < canvasWidth && area.y < canvasHeight) {
                let width = area.width
                let height = area.height
                if (width === Infinity) {
                    width = this.bodyWidth
                }
                if (height === Infinity) {
                    height = this.bodyHeight
                }
                ctx.beginPath()
                ctx.lineWidth = 2
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(area.x * ratio, area.y * ratio, (width + 1) * ratio, (height + 1) * ratio)
                ctx.fillStyle = 'rgba(0,0,0,0.1)'
                ctx.fillRect((area.x + 2) * ratio, (area.y + 2) * ratio, (width - 3) * ratio, (height - 3) * ratio)
                ctx.fillStyle = '#fff'
                // focus cell
                if (cell) {
                    ctx.fillRect((cell.x + 1) * ratio, (cell.y + 1) * ratio, (cell.width - 1) * ratio, (cell.height - 1) * ratio)
                }
                // 右下角小点
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.strokeRect((utils.pxFix(area.x + width) - 2) * ratio, (utils.pxFix(area.y + height) - 2) * ratio, 6 * ratio, 6 * ratio)
                ctx.fillStyle = '#237245'
                ctx.fillRect(((area.x + width) - 1) * ratio, ((area.y + height) - 1) * ratio, 5 * ratio, 5 * ratio)
                ctx.stroke()
            }
        },
        paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCell) {
            if (focusRow || focusColumn) {
                ctx.beginPath()
                ctx.lineWidth = 2
                ctx.strokeStyle = '#237245'
                const ratio = this.ratio
                if (focusRow) {
                    const height = (focusRow.height === Infinity) ? this.bodyHeight : focusRow.height
                    if (this.selectArea) {
                        if (this.selectArea.x <= config.width.serial && this.selectArea.x + this.selectArea.width >= config.width.serial) {
                            ctx.moveTo(config.width.serial * ratio, focusRow.y - 1)
                            ctx.lineTo(config.width.serial * ratio, focusRow.y + height + 2)
                        } else {
                            ctx.moveTo(config.width.serial * ratio, focusRow.y)
                            ctx.lineTo(config.width.serial * ratio, focusRow.y + height)
                        }
                    } else if (focusCell) {
                        if (focusCell.x <= config.width.serial) {
                            ctx.moveTo(config.width.serial * ratio, focusRow.y - 1)
                            ctx.lineTo(config.width.serial * ratio, focusRow.y + height + 2)
                        } else {
                            ctx.moveTo(config.width.serial * ratio, focusRow.y * ratio)
                            ctx.lineTo(config.width.serial * ratio, (focusRow.y + height) * ratio)
                        }
                    } else {
                        ctx.moveTo(config.width.serial * ratio, focusRow.y * ratio)
                        ctx.lineTo(config.width.serial * ratio, (focusRow.y + height) * ratio)
                    }
                }
                if (focusColumn) {
                    const width = (focusColumn.width === Infinity) ? this.bodyWidth : focusColumn.width
                    if (this.selectArea) {
                        if (this.selectArea.y <= config.height.columns && this.selectArea.y + this.selectArea.height >= config.height.columns) {
                            ctx.moveTo(focusColumn.x - 1, config.height.columns)
                            ctx.lineTo(focusColumn.x + width + 2, config.height.columns)
                        } else {
                            ctx.moveTo(focusColumn.x, config.height.columns)
                            ctx.lineTo(focusColumn.x + width, config.height.columns)
                        }
                    } else if (focusCell) {
                        if (focusCell.y <= config.height.columns) {
                            ctx.moveTo(focusColumn.x - 1, config.height.columns)
                            ctx.lineTo(focusColumn.x + width + 2, config.height.columns)
                        } else {
                            ctx.moveTo(focusColumn.x, config.height.columns)
                            ctx.lineTo(focusColumn.x + width, config.height.columns)
                        }
                    } else {
                        ctx.moveTo(focusColumn.x, config.height.columns)
                        ctx.lineTo(focusColumn.x + width, config.height.columns)
                    }
                }
                ctx.stroke()
            }
        },
        paintData(ctx, displayCells) {
            ctx.beginPath()
            ctx.font = 'normal 12px PingFang SC'
            const ratio = this.ratio
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
                                ctx.fillRect((item.x + 2) * ratio, (item.y + 1) * ratio, (ctx.measureText(item.paintText).width) * ratio, (item.height - 1) * ratio)
                            }
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, (item.x + 2) * ratio, (item.y + 13) * ratio, [item.paintText], maxWidth * ratio)
                        } else {
                            ctx.textAlign = 'right'
                            this.paintText(ctx, (item.x + item.width + 2) * ratio, (item.y + 13) * ratio, [item.paintText])
                        }
                    }
                    index += 1
                }
            }
            ctx.stroke()
        },
    },
}
