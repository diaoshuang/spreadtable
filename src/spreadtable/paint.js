import config from './config'
import utils from './utils'

let { mapPoint, mapSize } = utils

const FIX = true

export default {
    created() {
        mapPoint = mapPoint.bind(this)
        mapSize = mapSize.bind(this)
    },
    methods: {
        beforePainted() {
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
                    item.offset = [...this.offset]
                }
            }
        },
        painted() {
            this.beforePainted()
            this.clearPainted()
            this.doDraw()
        },
        paintedImage() {
            const { canvasPlugin, canvasWidth, canvasHeight, imageObjs } = this
            canvasPlugin.clearRect(
                ...mapPoint(config.width.serial + 1, config.height.columns + 1),
                ...mapSize(canvasWidth - config.width.serial - 1, canvasHeight - config.height.columns - 1),
            )
            if (imageObjs.length > 0) {
                this.paintImage(canvasPlugin, imageObjs)
            }
        },
        clearPainted() {
            const { canvasWidth, canvasHeight } = this
            this.canvas.clearRect(0, 0, ...mapSize(canvasWidth, canvasHeight))
            this.canvasPlugin.clearRect(0, 0, ...mapSize(canvasWidth, canvasHeight))
        },
        doDraw() {
            const { allRows, allCells, allColumns, canvas, canvasPlugin } = this
            this.paintMain(canvas, canvasPlugin, allColumns, allRows, allCells)
        },
        paintMain(ctx, pluginCtx, columns, rows, cells) {
            const { canvasWidth, canvasHeight, ratio, selectArea, offset: [oX, oY],
                focusCell, mouse, imageObjs } = this
            const focusCellItem = this.getPositionCell(focusCell)
            ctx.beginPath()
            ctx.lineWidth = 1 * ratio
            ctx.strokeStyle = '#cecece'
            // column  纵线
            const displayColumns = []
            for (const item of columns) {
                const { x, width } = item
                item.realX = x + oX
                if (item.realX + width >= config.width.serial && item.realX <= canvasWidth) {
                    if (width !== 0) {
                        ctx.moveTo(...mapPoint(item.realX + width, config.height.columns, FIX))
                        ctx.lineTo(...mapPoint(item.realX + width, canvasHeight, FIX))
                    }
                    displayColumns.push(item)
                } else if (displayColumns.length > 0) {
                    break
                }
            }
            // row 横线
            const displayRows = []
            for (const item of rows) {
                const { y, height } = item
                item.realY = y + oY
                if (item.realY + height >= config.height.columns && item.realY <= canvasHeight) {
                    ctx.moveTo(...mapPoint(config.width.serial, item.realY + height, FIX))
                    ctx.lineTo(...mapPoint(canvasWidth, item.realY + height, FIX))
                    displayRows.push(item)
                } else if (displayRows.length > 0) {
                    break
                }
            }
            ctx.stroke()

            this.display.columns = [...displayColumns]
            this.display.rows = [...displayRows]

            const cellsRowStart = displayRows[0].row
            const cellsRowEnd = displayRows[displayRows.length - 1].row
            const cellsColumnStart = displayColumns[0].cell
            const cellsColumnEnd = displayColumns[displayColumns.length - 1].cell
            // 绘制数据
            this.paintData(ctx, cells, cellsRowStart, cellsRowEnd, cellsColumnStart, cellsColumnEnd)

            if (mouse.focus.down && mouse.focus.obj) {
                ctx.strokeStyle = '#237245'
                ctx.fillStyle = 'rgba(36,114,69,0.05)'
                ctx.strokeRect(...mapPoint(mouse.focus.obj.x, mouse.focus.obj.y), ...mapSize(mouse.focus.obj.width, mouse.focus.obj.height))
                ctx.fillRect(...mapPoint(mouse.focus.obj.x, mouse.focus.obj.y), ...mapSize(mouse.focus.obj.width, mouse.focus.obj.height))
            }

            if (selectArea) {
                this.paintFocusAndSelect(ctx, focusCellItem, selectArea)
            } else if (focusCellItem) {
                this.paintFocus(ctx, focusCellItem)
            }

            if (imageObjs.length > 0) {
                this.paintImage(pluginCtx, imageObjs)
            }

            if (mouse.rowDivide.down) {
                ctx.beginPath()
                ctx.strokeStyle = '#333'
                ctx.moveTo(...mapPoint(0, this.mouse.rowDivide.obj.y))
                ctx.lineTo(...mapPoint(canvasWidth, this.mouse.rowDivide.obj.y))
                ctx.moveTo(...mapPoint(0, this.mouse.rowDivide.obj.row.realY))
                ctx.lineTo(...mapPoint(canvasWidth, this.mouse.rowDivide.obj.row.realY))
                ctx.stroke()
            }
            if (mouse.cellDivide.down) {
                ctx.beginPath()
                ctx.strokeStyle = '#333'
                ctx.moveTo(...mapPoint(this.mouse.cellDivide.obj.x, 0))
                ctx.lineTo(...mapPoint(this.mouse.cellDivide.obj.x, canvasHeight))
                ctx.moveTo(...mapPoint(this.mouse.cellDivide.obj.column.realX, 0))
                ctx.lineTo(...mapPoint(this.mouse.cellDivide.obj.column.realX, canvasHeight))
                ctx.stroke()
            }

            const { focusRow, focusColumn } = this.getFocusRowAndColumn(focusCellItem, selectArea)

            this.paintBorder(pluginCtx, focusRow, focusColumn, focusCellItem, displayColumns, displayRows)
        },
        paintBorder(ctx, focusRow, focusColumn, focusCellItem, displayColumns, displayRows) {
            const { ratio, canvasWidth, canvasHeight, selectArea } = this
            ctx.fillStyle = '#f5f5f5'
            ctx.fillRect(...this.points.columns)
            ctx.fillRect(...this.points.serial)

            ctx.fillStyle = '#e0e0e0'
            if (focusRow) {
                ctx.fillRect(...mapPoint(0, focusRow.y), ...mapSize(config.width.serial, focusRow.height))
            }
            if (focusColumn) {
                ctx.fillRect(...mapPoint(focusColumn.x, 0), ...mapSize(focusColumn.width, config.height.columns))
            }
            ctx.beginPath()
            ctx.lineWidth = 1 * ratio
            ctx.textAlign = 'center'
            ctx.strokeStyle = '#cecece'
            ctx.fillStyle = '#333333'
            ctx.font = `normal ${12 * this.ratio}px PingFang SC`
            ctx.textBaseline = 'middle'
            for (const { realX: x, title, width } of displayColumns) {
                if (width === 0) {
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.lineWidth = 2 * ratio
                    ctx.strokeStyle = '#237245'
                    ctx.moveTo(...mapPoint(x, 0))
                    ctx.lineTo(...mapPoint(x, config.height.columns))
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.strokeStyle = '#cecece'
                    ctx.lineWidth = 1 * ratio
                } else {
                    ctx.moveTo(...mapPoint(x + width, 0, FIX))
                    ctx.lineTo(...mapPoint(x + width, config.height.columns, FIX))
                    if (width > 10) {
                        this.paintText(ctx, ...mapPoint(x + utils.half(width), 12), [title])
                    } else if (width > 0) {
                        this.paintText(ctx, ...mapPoint(x + utils.half(width), 12), ['.'])
                    }
                }
            }
            // row 横线
            for (const { realY: y, row, height } of displayRows) {
                if (height === 0) {
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.lineWidth = 2 * ratio
                    ctx.strokeStyle = '#237245'
                    ctx.moveTo(...mapPoint(0, y))
                    ctx.lineTo(...mapPoint(config.width.serial, y))
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.strokeStyle = '#cecece'
                    ctx.lineWidth = 1 * ratio
                } else {
                    ctx.moveTo(...mapPoint(0, y + height, FIX))
                    ctx.lineTo(...mapPoint(config.width.serial, y + height))
                    if (height > 10) {
                        this.paintText(ctx, ...mapPoint(utils.half(config.width.serial), y + 11), [row + 1])
                    } else if (height > 0) {
                        this.paintText(ctx, ...mapPoint(utils.half(config.width.serial), y + 11), ['.'])
                    }
                }
            }
            ctx.stroke()

            ctx.beginPath()
            ctx.strokeStyle = '#bdbbbc'
            ctx.moveTo(...mapPoint(config.width.serial, config.height.columns, FIX))
            ctx.lineTo(...mapPoint(canvasWidth, config.height.columns, FIX))
            ctx.moveTo(...mapPoint(config.width.serial, config.height.columns, FIX))
            ctx.lineTo(...mapPoint(config.width.serial, canvasHeight, FIX))
            ctx.stroke()

            this.paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCellItem, selectArea)

            ctx.fillStyle = '#fbfbfb'
            ctx.fillRect(...mapPoint(0, 0), ...mapSize(config.width.serial, config.height.columns))

            ctx.beginPath()
            ctx.lineWidth = 1 * ratio
            ctx.strokeStyle = '#cecece'
            ctx.moveTo(...mapPoint(config.width.serial, 0, FIX))
            ctx.lineTo(...mapPoint(config.width.serial, config.height.columns, FIX))
            ctx.lineTo(...mapPoint(0, config.height.columns, FIX))
            ctx.stroke()

            if (focusRow.y + focusRow.height >= config.height.columns && focusColumn.x + focusColumn.width >= config.width.serial && focusRow.y <= config.height.columns && focusColumn.x <= config.width.serial) {
                ctx.fillStyle = '#237245'
                ctx.fillRect(...mapPoint(config.width.serial - 1, config.height.columns - 1), ...mapSize(2, 2))
            }

            ctx.beginPath()
            ctx.moveTo(...mapPoint(config.width.serial - 3.5, 7))
            ctx.lineTo(...mapPoint(config.width.serial - 3.5, config.height.columns - 3.5))
            ctx.lineTo(...mapPoint(12, config.height.columns - 3.5))
            ctx.closePath()
            ctx.strokeStyle = '#dfdfdf'
            ctx.fillStyle = '#dfdfdf'
            if (selectArea && selectArea.width === Infinity && selectArea.height === Infinity) {
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
                ctx.strokeRect(...mapPoint(cell.realX, cell.realY), ...mapSize(cell.width + 1, cell.height + 1))

                // 右下角小点
                ctx.fillStyle = '#ffffff'
                ctx.lineWidth = 1 * ratio
                ctx.fillRect(...mapPoint((cell.realX + cell.width) - 4, (cell.realY + cell.height) - 4), ...mapSize(7, 7))
                ctx.fillStyle = '#237245'
                ctx.fillRect(...mapPoint((cell.realX + cell.width) - 3, (cell.realY + cell.height) - 3), ...mapSize(6, 6))
                ctx.stroke()
            }
        },
        paintFocusAndSelect(ctx, cell, area) {
            const { canvasWidth, canvasHeight, ratio, bodyWidth, bodyHeight, allColumns, allCells } = this
            if (area.x + area.width > config.width.serial && area.y + area.height > config.height.columns && area.x < canvasWidth && area.y < canvasHeight) {
                let width = area.width
                let height = area.height
                if (width === Infinity) {
                    width = bodyWidth
                }
                if (height === Infinity) {
                    height = bodyHeight
                }
                ctx.beginPath()
                ctx.lineWidth = 2 * ratio
                ctx.strokeStyle = '#237245'
                ctx.strokeRect(...mapPoint(area.x, area.y), ...mapSize(width + 1, height + 1))
                ctx.fillStyle = 'rgba(0,0,0,0.1)'
                ctx.fillRect(...mapPoint(area.x + 2, area.y + 2), ...mapSize(width - 3, height - 3))
                ctx.fillStyle = '#fff'
                if (cell) {
                    ctx.fillRect(...mapPoint(cell.realX + 1, cell.realY + 1), ...mapSize(cell.width - 1, cell.height - 1))
                    if (cell.paintText) {
                        if (cell.type === 'text') {
                            ctx.textAlign = 'left'
                            let maxWidth = null
                            if (cell.cell < allColumns.length - 1 && (allCells[cell.row][cell.cell + 1].text || allCells[cell.row][cell.cell + 1].text === 0)) {
                                maxWidth = cell.width
                            }
                            ctx.fillStyle = '#fff'
                            if (!maxWidth) {
                                ctx.fillRect(...mapPoint(cell.realX + 2, cell.realY + 1), ...mapSize(ctx.measureText(cell.paintText).width / 2, cell.height - 1))
                            }
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, ...mapPoint(cell.realX + 3, cell.realY + 11), [cell.paintText], maxWidth * ratio)
                        } else {
                            ctx.textAlign = 'right'
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, ...mapPoint((cell.realX + cell.width) - 3, cell.realY + 11), [cell.paintText])
                        }
                    }
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
        paintFocusRowAndColumnLine(ctx, focusRow, focusColumn, focusCell, selectArea) {
            const { bodyHeight, bodyWidth } = this
            if (focusRow || focusColumn) {
                ctx.beginPath()
                const ratio = this.ratio
                ctx.lineWidth = 2 * ratio
                ctx.strokeStyle = '#237245'
                if (focusRow) {
                    const height = (focusRow.height === Infinity) ? bodyHeight : focusRow.height
                    if ((selectArea && selectArea.x <= config.width.serial && selectArea.x + selectArea.width > config.width.serial) || (focusCell.realX <= config.width.serial && focusCell.realX + focusCell.width > config.height.columns)) {
                        ctx.moveTo(...mapPoint(config.width.serial, focusRow.y - 1))
                        ctx.lineTo(...mapPoint(config.width.serial, focusRow.y + height + 2))
                    } else {
                        ctx.moveTo(...mapPoint(config.width.serial, focusRow.y))
                        ctx.lineTo(...mapPoint(config.width.serial, focusRow.y + height))
                    }
                }
                if (focusColumn) {
                    const width = (focusColumn.width === Infinity) ? bodyWidth : focusColumn.width
                    if ((selectArea && selectArea.y <= config.height.columns && selectArea.y + selectArea.height > config.height.columns) || (focusCell.realY <= config.height.columns && focusCell.realY + focusCell.height > config.height.columns)) {
                        ctx.moveTo(...mapPoint(focusColumn.x - 1, config.height.columns))
                        ctx.lineTo(...mapPoint(focusColumn.x + width + 2, config.height.columns))
                    } else {
                        ctx.moveTo(...mapPoint(focusColumn.x, config.height.columns))
                        ctx.lineTo(...mapPoint(focusColumn.x + width, config.height.columns))
                    }
                }
                ctx.stroke()
            }
        },
        paintData(ctx, cells, cellsRowStart, cellsRowEnd, cellsColumnStart, cellsColumnEnd) {
            ctx.beginPath()
            const { ratio, offset: [oX, oY] } = this
            ctx.font = `normal ${12 * ratio}px PingFang SC`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            for (let i = cellsRowStart; i < cellsRowEnd; i += 1) {
                for (let j = cellsColumnStart; j < cellsColumnEnd; j += 1) {
                    const item = cells[i][j]
                    if (item.paintText) {
                        const { height, y } = this.allRows[i]
                        const { width, x } = this.allColumns[j]
                        item.height = height
                        item.width = width
                        item.x = x
                        item.y = y
                        item.realX = item.x + oX
                        item.realY = item.y + oY
                        if (item.type === 'text') {
                            ctx.textAlign = 'left'
                            let maxWidth = null
                            if (j < cellsRowEnd - 1 && (cells[i][j + 1].text || cells[i][j + 1].text === 0)) {
                                maxWidth = item.width
                            }
                            ctx.fillStyle = '#fff'
                            if (!maxWidth) {
                                ctx.fillRect(...mapPoint(item.realX + 3, item.realY + 1), ...mapSize(ctx.measureText(item.paintText).width / ratio, item.height - 1))
                            }
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, ...mapPoint(item.realX + 3, item.realY + 11), [item.paintText], maxWidth * ratio)
                        } else {
                            ctx.textAlign = 'right'
                            ctx.fillStyle = '#333'
                            this.paintText(ctx, ...mapPoint((item.realX + item.width) - 3, item.realY + 11), [item.paintText])
                        }
                    }
                }
            }
            ctx.stroke()
        },
        paintImage(ctx, images) {
            for (const item of images) {
                const img = new Image()
                if (item.img) {
                    this.paintImageItem(ctx, item)
                } else {
                    img.onload = () => {
                        item.img = img
                        item.width = img.width
                        item.height = img.height
                        this.paintImageItem(ctx, item)
                    }
                    img.src = item.url
                }
            }
        },
        paintImageItem(ctx, item) {
            item.point = []
            item.point[0] = [item.x - 1, item.y - 1]
            item.point[1] = [item.x + (item.width) + 1, item.y - 1]
            item.point[2] = [item.x + (item.width) + 1, item.y + (item.height) + 1]
            item.point[3] = [item.x - 1, item.y + (item.height) + 1]

            ctx.drawImage(item.img, ...mapPoint(item.x, item.y), item.width * this.ratio, item.height * this.ratio)
            if (item.focus && !this.mouse.image.down) {
                this.paintImageBorder(ctx, item.point, item)
            }
        },
        paintImageBorder(ctx, point) {
            ctx.beginPath()
            ctx.strokeStyle = '#666'
            ctx.moveTo(...mapPoint(...point[0], FIX))
            ctx.lineTo(...mapPoint(...point[1], FIX))
            ctx.lineTo(...mapPoint(...point[2], FIX))
            ctx.lineTo(...mapPoint(...point[3], FIX))
            ctx.closePath()
            ctx.stroke()

            ctx.beginPath()
            ctx.fillStyle = '#666'
            ctx.fillRect(...mapPoint(point[0][0] - 5, point[0][1] - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint(point[1][0] - 5, point[1][1] - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint(point[2][0] - 5, point[2][1] - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint(point[3][0] - 5, point[3][1] - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint((((point[1][0] - point[0][0]) / 2) + point[0][0]) - 5, point[0][1] - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint((((point[1][0] - point[0][0]) / 2) + point[0][0]) - 5, point[2][1] - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint(point[0][0] - 5, (((point[3][1] - point[0][1]) / 2) + point[0][1]) - 5), ...mapSize(10, 10))
            ctx.fillRect(...mapPoint(point[1][0] - 5, (((point[3][1] - point[0][1]) / 2) + point[0][1]) - 5), ...mapSize(10, 10))
            ctx.fillStyle = '#fff'
            ctx.fillRect(...mapPoint(point[0][0] - 4, point[0][1] - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint(point[1][0] - 4, point[1][1] - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint(point[2][0] - 4, point[2][1] - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint(point[3][0] - 4, point[3][1] - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint((((point[1][0] - point[0][0]) / 2) + point[0][0]) - 4, point[0][1] - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint((((point[1][0] - point[0][0]) / 2) + point[0][0]) - 4, point[2][1] - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint(point[0][0] - 4, (((point[3][1] - point[0][1]) / 2) + point[0][1]) - 4), ...mapSize(8, 8))
            ctx.fillRect(...mapPoint(point[1][0] - 4, (((point[3][1] - point[0][1]) / 2) + point[0][1]) - 4), ...mapSize(8, 8))
            ctx.stroke()
        },
    },
}
