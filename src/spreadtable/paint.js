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
            this.canvas.clearRect(0, 0, this.canvasWidth * this.ratio, this.canvasHeight * this.ratio)
        },
        doDraw({ displayRows, displayColumns, displayCells }) {
            const ctx = this.canvas

            this.paintOuter(ctx, displayRows, displayColumns, displayCells)
        },
        paintOuter(ctx, displayRows, displayColumns, displayCells) {
            const { canvasWidth, canvasHeight, ratio } = this
            ctx.beginPath()
            ctx.lineWidth = 1 * ratio
            ctx.strokeStyle = '#cecece'
            ctx.textAlign = 'center'
            // column  纵线
            for (const { realX: x, width } of displayColumns) {
                ctx.moveTo(utils.pxFix((x + width) * ratio), config.height.columns * ratio)
                ctx.lineTo(utils.pxFix((x + width) * ratio), canvasHeight * ratio)
            }
            // row 横线
            for (const { realY: y, height } of displayRows) {
                ctx.moveTo(config.width.serial * ratio, utils.pxFix((y + height) * ratio))
                ctx.lineTo(canvasWidth * ratio, utils.pxFix((y + height) * ratio))
            }
            ctx.stroke()

            const focusCell = this.getDisplayCell(this.focusCell)
            const { focusRow: _focusRow, focusColumn: _focusColumn } = this.getFocusRowAndColumn(this.focusCell)
            const focusRow = _focusRow
            const focusColumn = _focusColumn

            this.paintData(ctx, displayCells)

            if (this.isFocusCopyDown && this.focusCopy) {
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(this.focusCopy.x * ratio, this.focusCopy.y * ratio, this.focusCopy.width * ratio, this.focusCopy.height * ratio)
            }

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
            ctx.lineWidth = 1 * ratio
            ctx.textAlign = 'center'
            ctx.strokeStyle = '#cecece'
            ctx.fillStyle = '#333333'
            for (const { realX: x, title, width } of displayColumns) {
                ctx.moveTo(utils.pxFix((x + width) * ratio), 0)
                ctx.lineTo(utils.pxFix((x + width) * ratio), config.height.columns * ratio)
                if (width > 10) {
                    this.paintText(ctx, (x + utils.half(width)) * ratio, 13 * ratio, [title])
                } else if (width > 0) {
                    this.paintText(ctx, (x + utils.half(width)) * ratio, 13 * ratio, ['..'])
                }
            }
            // row 横线
            for (const { realY: y, row, height } of displayRows) {
                ctx.moveTo(0, utils.pxFix((y + height) * ratio))
                ctx.lineTo(config.width.serial * ratio, utils.pxFix((y + height) * ratio))
                this.paintText(ctx, utils.half(config.width.serial) * ratio, (y + 11) * ratio, [row + 1])
            }
            ctx.stroke()

            if (this.isHoverRowDivideDown) {
                ctx.beginPath()
                ctx.strokeStyle = '#000'
                ctx.moveTo(0, this.hoverRowDivide.y * ratio)
                ctx.lineTo(this.canvasWidth * ratio, this.hoverRowDivide.y * ratio)
                ctx.moveTo(0, this.hoverRowDivide.row.realY * ratio)
                ctx.lineTo(this.canvasWidth * ratio, this.hoverRowDivide.row.realY * ratio)
                ctx.stroke()
            }
            if (this.isHoverColumnDivideDown) {
                ctx.beginPath()
                ctx.strokeStyle = '#000'
                ctx.moveTo(this.hoverColumnDivide.x * ratio, 0)
                ctx.lineTo(this.hoverColumnDivide.x * ratio, this.canvasHeight * ratio)
                ctx.moveTo(this.hoverColumnDivide.column.realX * ratio, 0)
                ctx.lineTo(this.hoverColumnDivide.column.realX * ratio, this.canvasHeight * ratio)
                ctx.stroke()
            }

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
            ctx.lineWidth = 1 * ratio
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
            ctx.lineTo(12 * ratio, (config.height.columns - 3.5) * ratio)
            ctx.closePath()
            ctx.strokeStyle = '#dfdfdf'
            ctx.fillStyle = '#dfdfdf'
            if (this.selectArea && this.selectArea.width === Infinity && this.selectArea.height === Infinity) {
                ctx.fillStyle = '#237245'
                ctx.strokeStyle = '#237245'
            }
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
            if (cell.realX + cell.width > config.width.serial && cell.realY + cell.height > config.height.columns && cell.realX < canvasWidth && cell.realY < canvasHeight) {
                ctx.beginPath()
                ctx.lineWidth = 2 * ratio
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(cell.realX * ratio, cell.realY * ratio, (cell.width + 1) * ratio, (cell.height + 1) * ratio)

                // 右下角小点
                ctx.fillStyle = '#ffffff'
                ctx.lineWidth = 1 * ratio
                ctx.fillRect(utils.pxFix(((cell.realX + cell.width) - 4) * ratio), utils.pxFix(((cell.realY + cell.height) - 4) * ratio), 7 * ratio, 7 * ratio)
                ctx.fillStyle = '#237245'
                ctx.fillRect(((cell.realX + cell.width) - 3) * ratio, ((cell.realY + cell.height) - 3) * ratio, 6 * ratio, 6 * ratio)
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
                ctx.lineWidth = 2 * ratio
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(area.x * ratio, area.y * ratio, (width + 1) * ratio, (height + 1) * ratio)

                if (cell) {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)'
                    let areaHeight = (cell.height - 1) * ratio
                    if (area.rowCount === 1) {
                        areaHeight = (cell.height - 3) * ratio
                    }
                    if (area.type === 0) {
                        if (area.cellCount !== 1) {
                            ctx.fillRect((area.x + cell.width + 1) * ratio, (area.y + 2) * ratio, (width - cell.width - 2) * ratio, areaHeight)
                        }
                        if (area.rowCount !== 1) {
                            ctx.fillRect((area.x + 2) * ratio, (area.y + cell.height + 1) * ratio, (width - 3) * ratio, (height - cell.height - 2) * ratio)
                        }
                    } else if (area.type === 1) {
                        if (area.cellCount !== 1) {
                            ctx.fillRect((area.x + cell.width + 1) * ratio, (cell.realY + 1) * ratio, (width - cell.width - 2) * ratio, areaHeight - 1)
                        }
                        if (area.rowCount !== 1) {
                            ctx.fillRect((area.x + 2) * ratio, (area.y + 2) * ratio, (width - 3) * ratio, (height - cell.height - 1) * ratio)
                        }
                    } else if (area.type === 2) {
                        if (area.cellCount !== 1) {
                            ctx.fillRect((area.x + 2) * ratio, (cell.realY + 1) * ratio, (width - cell.width - 2) * ratio, areaHeight - 1)
                        }
                        if (area.rowCount !== 1) {
                            ctx.fillRect((area.x + 2) * ratio, (area.y + 2) * ratio, (width - 3) * ratio, (height - cell.height - 1) * ratio)
                        }
                    } else if (area.type === 3) {
                        if (area.cellCount !== 1) {
                            ctx.fillRect((area.x + 2) * ratio, (area.y + 2) * ratio, (width - cell.width - 2) * ratio, areaHeight)
                        }
                        if (area.rowCount !== 1) {
                            ctx.fillRect((area.x + 2) * ratio, (area.y + cell.height + 1) * ratio, (width - 3) * ratio, (height - cell.height - 2) * ratio)
                        }
                    }
                } else {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)'
                    ctx.fillRect((area.x + 2) * ratio, (area.y + 2) * ratio, (width - 3) * ratio, (height - 3) * ratio)
                }
                // 右下角小点
                ctx.fillStyle = '#ffffff'
                ctx.lineWidth = 1 * ratio
                ctx.fillRect(utils.pxFix(((area.x + width) - 4) * ratio), utils.pxFix(((area.y + height) - 4) * ratio), 7 * ratio, 7 * ratio)
                ctx.fillStyle = '#237245'
                ctx.fillRect(((area.x + width) - 3) * ratio, ((area.y + height) - 3) * ratio, 6 * ratio, 6 * ratio)
                ctx.stroke()
            }
        },
        paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCell) {
            if (focusRow || focusColumn) {
                ctx.beginPath()
                const ratio = this.ratio
                ctx.lineWidth = 2 * ratio
                ctx.strokeStyle = '#237245'
                if (focusRow) {
                    const height = (focusRow.height === Infinity) ? this.bodyHeight : focusRow.height
                    if (this.selectArea) {
                        if (this.selectArea.x <= config.width.serial && this.selectArea.x + this.selectArea.width >= config.width.serial) {
                            ctx.moveTo(config.width.serial * ratio, (focusRow.y - 1) * ratio)
                            ctx.lineTo(config.width.serial * ratio, (focusRow.y + height + 2) * ratio)
                        } else {
                            ctx.moveTo(config.width.serial * ratio, focusRow.y * ratio)
                            ctx.lineTo(config.width.serial * ratio, (focusRow.y + height) * ratio)
                        }
                    } else if (focusCell) {
                        if (focusCell.realX <= config.width.serial) {
                            ctx.moveTo(config.width.serial * ratio, (focusRow.y - 1) * ratio)
                            ctx.lineTo(config.width.serial * ratio, (focusRow.y + height + 2) * ratio)
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
                            ctx.moveTo((focusColumn.x - 1) * ratio, config.height.columns * ratio)
                            ctx.lineTo((focusColumn.x + width + 2) * ratio, config.height.columns * ratio)
                        } else {
                            ctx.moveTo(focusColumn.x * ratio, config.height.columns * ratio)
                            ctx.lineTo((focusColumn.x + width) * ratio, config.height.columns * ratio)
                        }
                    } else if (focusCell) {
                        if (focusCell.y <= config.height.columns) {
                            ctx.moveTo((focusColumn.x - 1) * ratio, config.height.columns * ratio)
                            ctx.lineTo((focusColumn.x + width + 2) * ratio, config.height.columns * ratio)
                        } else {
                            ctx.moveTo(focusColumn.x * ratio, config.height.columns * ratio)
                            ctx.lineTo((focusColumn.x + width) * ratio, config.height.columns * ratio)
                        }
                    } else {
                        ctx.moveTo(focusColumn.x * ratio, config.height.columns * ratio)
                        ctx.lineTo((focusColumn.x + width) * ratio, config.height.columns * ratio)
                    }
                }
                ctx.stroke()
            }
        },
        paintData(ctx, displayCells) {
            ctx.beginPath()
            const ratio = this.ratio
            ctx.font = `normal ${12 * ratio}px PingFang SC`
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
                                ctx.fillRect((item.realX + 2) * ratio, (item.realY + 1) * ratio, ctx.measureText(item.paintText).width, (item.height - 1) * ratio)
                            }
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, (item.realX + 2) * ratio, (item.realY + 11) * ratio, [item.paintText], maxWidth * ratio)
                        } else {
                            ctx.textAlign = 'right'
                            this.paintText(ctx, (item.realX + item.width + 2) * ratio, (item.realY + 11) * ratio, [item.paintText])
                        }
                    }
                    index += 1
                }
            }
            ctx.stroke()
        },
    },
}
