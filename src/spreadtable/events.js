import config from './config'
import utils from './utils'

function noop() { }

export default {
    data() {
        return {
            mouse: {
                image: {
                    down: false,
                    hover: false,
                    obj: null,
                },
                table: {
                    down: false,
                    hover: false,
                },
                focus: {
                    down: false,
                    hover: false,
                },
                row: {
                    down: false,
                    hover: false,
                },
                cell: {
                    down: false,
                    hover: false,
                },
                rowDivide: {
                    down: false,
                    hover: false,
                },
                cellDivide: {
                    down: false,
                    hover: false,
                },
                rowMove: {
                    down: false,
                    hover: false,
                },
                cellMove: {
                    down: false,
                    hover: false,
                },
                all: {
                    hover: false,
                },
                text: {
                    hover: false,
                },
                expression: {
                    down: false,
                },
            },
            autoScrollInterval: 0,
            isAutoScroll: false,
            mouseOutValue: 0,
        }
    },
    created() {
        this.isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    },
    methods: {
        initEvents() {
            this.$refs['canvas-plugin'].addEventListener(this.isFirefox ? 'DOMMouseScroll' : 'mousewheel', this.handleWheel)
            this.$refs['canvas-plugin'].addEventListener('dblclick', this.handleDoubleClick, false)
            this.$refs['canvas-plugin'].addEventListener('mousedown', this.handleMousedown, false)
            document.addEventListener('mousemove', this.handleMousemove, true)
            document.addEventListener('mousedown', this.handleClick, true)
            document.addEventListener('mouseup', this.handleMouseup, false)
            window.addEventListener('resize', this.handleResize, false)
            document.addEventListener('keydown', this.handleKeydown, false)
            document.addEventListener('contextmenu', this.handleContextMenu, false)
        },
        removeEvents() {
            // window.removeEventListener('mousedown', this.handleMousedown, false)
            document.removeEventListener('mousedown', this.handleClick, true)
            document.removeEventListener('mousemove', this.handleMousemove, true)
            document.removeEventListener('mouseup', this.handleMouseup, false)
            window.removeEventListener('resize', this.handleResize, false)
            document.removeEventListener('keydown', this.handleKeydown, false)
            document.removeEventListener('contextmenu', this.handleContextMenu, false)
        },
        handleWheel(e) {
            e.preventDefault()
            e.returnValue = false
            if (!this.isEditing) {
                const { deltaX, deltaY } = e
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.scrollX(deltaX)
                } else {
                    this.scrollY(deltaY)
                }
            }
        },
        handleClick(e) {
            this.save()
            this.hideInput()
            if (this.expressionSelect) {
                if (this.fxFocus) {
                    this.focusFxInput()
                } else {
                    this.focusInput()
                }
                const eX = e.clientX - this.canvasX
                const eY = e.clientY - this.canvasY
                if (this.mouse.table.hover) {
                    this.mouse.expression.down = true
                    if (e.shiftKey) {
                        this.doSelectArea(eX, eY)
                    } else {
                        const cellItem = this.getCellAt(eX, eY)
                        if (cellItem) {
                            if (this.expressionSelectDone) {
                                this.expressionItems[this.expressionItems.length - 1] = [cellItem.row, cellItem.cell]
                            } else {
                                this.expressionSelectDone = true
                                this.expressionItems.push([cellItem.row, cellItem.cell])
                            }
                            if (this.isFirstFxfocus) {
                                this.isFirstFxfocus = false
                                if (!this.operatorReg.test(`${this.fxValue}`.substr(this.fxValue.length - 1))) {
                                    this.oldFxValue += '+'
                                    this.fxValue = `${this.oldFxValue}+${this.words[cellItem.cell]}${cellItem.row + 1}`
                                }
                            } else {
                                this.fxValue = `${this.oldFxValue}${this.words[cellItem.cell]}${cellItem.row + 1}`
                            }

                            requestAnimationFrame(this.painted)
                        }
                    }
                }
            }
        },
        handleMousedown(e) {
            if (this.expressionSelect) {
                return
            }
            if (this.fxFocus) {
                this.fxEnter = true
                this.$emit('updateItem', {
                    anchor: [...this.focusCell],
                    value: this.fxValue,
                })
                this.fxFocus = false
            }
            this.save()
            this.focusInput()
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            for (const item of this.imageObjs) {
                item.focus = false
            }
            const { image, rowDivide, cellDivide, table, focus, rowMove, cellMove, row, cell, all, text } = this.mouse
            if (!text.hover) {
                this.hideInput()
            }
            if (image.hover) {
                image.down = true
                for (let i = this.imageObjs.length - 1; i >= 0; i -= 1) {
                    const item = this.imageObjs[i]
                    if (item.point && utils.isInRegion([eX, eY], [item.point[0][0], item.point[0][1]], [item.point[2][0], item.point[2][1]])) {
                        image.obj = {
                            x: eX,
                            y: eY,
                            originX: eX,
                            originY: eY,
                            img: item,
                        }
                        item.focus = true
                        requestAnimationFrame(this.paintedImage)
                        return
                    }
                }
            } else if (rowDivide.hover) {
                rowDivide.down = true
            } else if (cellDivide.hover) {
                cellDivide.down = true
            } else if (focus.hover) {
                focus.down = true
            } else if (table.hover) {
                table.down = true
                if (e.shiftKey) {
                    this.doSelectArea(eX, eY)
                } else {
                    const cellItem = this.getCellAt(eX, eY)
                    if (cellItem) {
                        this.focusCell = [cellItem.row, cellItem.cell]
                        this.selectArea = null
                        this.$emit('focus', cellItem.rowData)
                    }
                }
            } else if (rowMove.hover) {
                rowMove.down = true
            } else if (cellMove.hover) {
                cellMove.down = true
            } else if (row.hover) {
                row.down = true
                const rowItem = this.getRowAt(eY)
                if (rowItem) {
                    if (e.shiftKey) {
                        if (this.selectArea && this.selectArea.width === Infinity && this.selectArea.row !== rowItem.row) {
                            row.obj = { ...rowItem }
                            this.offset[0] = 0
                            const focusCellItem = this.getPositionCell(this.focusCell)
                            this.focusCell = [focusCellItem.row, 0]
                            this.selectArea.cellCount = Infinity
                            this.selectArea.rowCount = Math.abs(focusCellItem.row - rowItem.row)
                            if (focusCellItem.row > rowItem.row) {
                                this.selectArea = { type: 1, x: config.width.serial, y: rowItem.realY, width: Infinity, height: (focusCellItem.realY - rowItem.realY) + focusCellItem.height, cell: 0, row: focusCellItem.row, offset: [...this.offset] }
                            } else {
                                this.selectArea = { type: 0, x: config.width.serial, y: focusCellItem.realY, width: Infinity, height: (rowItem.realY - focusCellItem.realY) + rowItem.height, cell: 0, row: focusCellItem.row, offset: [...this.offset] }
                            }
                            this.$emit('focus', this.allRows[rowItem.row].rowData)
                        }
                    } else {
                        row.obj = { ...rowItem }
                        this.focusCell = [rowItem.row, 0]
                        this.offset[0] = 0
                        this.selectArea = { type: 0, x: config.width.serial, y: rowItem.realY, width: Infinity, height: rowItem.height, cell: 0, row: rowItem.row, offset: [...this.offset] }
                        this.selectArea.rowCount = 1
                        this.selectArea.cellCount = Infinity
                        this.$emit('focus', this.allRows[rowItem.row].rowData)
                    }
                    this.$emit('scroll')
                }
            } else if (cell.hover) {
                cell.down = true
                const column = this.getColumnAt(eX)
                if (column) {
                    if (e.shiftKey) {
                        if (this.selectArea && this.selectArea.height === Infinity && this.selectArea.cell !== column.cell) {
                            row.obj = { ...column }
                            this.offset[1] = 0
                            const focusCellItem = this.getPositionCell(this.focusCell)
                            this.focusCell = [0, focusCellItem.cell]
                            this.selectArea.cellCount = Math.abs(focusCellItem.cell - column.cell)
                            this.selectArea.rowCount = Infinity
                            if (focusCellItem.cell > column.cell) {
                                this.selectArea = { type: 4, x: column.realX, y: config.height.columns, width: (focusCellItem.realX - column.realX) + focusCellItem.width, height: Infinity, cell: focusCellItem.cell, row: 0, offset: [...this.offset] }
                            } else {
                                this.selectArea = { type: 0, x: focusCellItem.realX, y: config.height.columns, width: (column.realX - focusCellItem.realX) + column.width, height: Infinity, cell: focusCellItem.cell, row: 0, offset: [...this.offset] }
                            }
                            this.$emit('focus', this.allRows[0].rowData)
                        }
                    } else {
                        cell.obj = { ...column }
                        this.focusCell = [0, column.cell]
                        this.offset[1] = 0
                        this.selectArea = { type: 0, x: column.realX, y: config.height.columns, width: column.width, height: Infinity, cell: column.cell, row: 0, offset: [...this.offset] }
                        this.selectArea.rowCount = Infinity
                        this.selectArea.cellCount = 1
                        this.$emit('focus', this.allRows[0].rowData)
                    }
                    this.$emit('scroll')
                }
            } else if (all.hover) {
                this.focusCell = [0, 0]
                this.offset = [0, 0]
                this.selectArea = { type: 0, x: config.width.serial, y: config.height.columns, width: Infinity, height: Infinity, cell: 0, row: 0, offset: [...this.offset] }
                this.selectArea.rowCount = Infinity
                this.selectArea.cellCount = Infinity
                this.$emit('focus', this.allRows[0].rowData)
            }
            requestAnimationFrame(this.painted)
        },

        handleMousemove(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const { image, rowDivide, cellDivide, focus, table, rowMove, cellMove, row, cell } = this.mouse
            if (!rowDivide.down) {
                rowDivide.obj = null
            }
            if (!cellDivide.down) {
                cellDivide.obj = null
            }
            if (image.down) {
                image.obj.img.x += e.movementX
                image.obj.img.y += e.movementY
            } else if (rowDivide.down) {
                if (eY > rowDivide.obj.minY) {
                    rowDivide.obj.y = eY
                } else {
                    rowDivide.obj.y = rowDivide.obj.minY
                }
            } else if (cellDivide.down) {
                if (eX > cellDivide.obj.minX) {
                    cellDivide.obj.x = eX
                } else {
                    cellDivide.obj.x = cellDivide.obj.minX
                }
            } else if (focus.down) {
                const focusCellItem = this.getPositionCell(this.focusCell)
                if (this.selectArea) {
                    const { x, y, width, height, row: rowIndex, cell: cellIndex } = this.selectArea
                    const startPoint = [x + width, y + height]
                    const cellItem = this.getCellAt(eX, eY)
                    if ((eX >= x && eX <= x + width) || this.isInVerticalQuadrant(this.selectArea, eX, eY)) {
                        if (eY - startPoint[1] > 0) {
                            focus.obj = { type: 0, copyType: 0, x, y, width, height: (cellItem.realY - y) + cellItem.height, row: rowIndex, cell: cellIndex }
                        } else if (eY - y < 0) {
                            focus.obj = { type: 1, copyType: 0, x, y: cellItem.realY, width, height: (y - cellItem.realY) + height, row: rowIndex, cell: cellIndex }
                        } else if (utils.lineEquation([x, y], [startPoint[0], startPoint[1]], eX) > eY) {
                            focus.obj = { type: 0, copyType: 0, x, y, width, height: (cellItem.realY - y) + cellItem.height, row: rowIndex, cell: cellIndex }
                        } else {
                            focus.obj = { type: 0, copyType: 1, x, y, width: (cellItem.realX - x) + cellItem.width, height }
                        }
                        if (focus.obj) {
                            focus.obj.rowCount = Math.abs(cellItem.row - rowIndex) + 1
                            focus.obj.cellCount = this.selectArea.cellCount
                        }
                    } else if ((eY >= y && eY < y + height) || !this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eX - startPoint[0] > 0) {
                            focus.obj = { type: 0, copyType: 1, x, y, width: (cellItem.realX - x) + cellItem.width, height, row: rowIndex, cell: cellIndex }
                        } else if (eX - x < 0) {
                            focus.obj = { type: 2, copyType: 1, x: cellItem.realX, y, width: (x - cellItem.realX) + width, height, row: rowIndex, cell: cellIndex }
                        }
                        if (focus.obj) {
                            focus.obj.rowCount = this.selectArea.rowCount
                            focus.obj.cellCount = Math.abs(cellItem.cell - cellIndex) + 1
                        }
                    }
                } else {
                    const { realX: x, realY: y, width, height, row: rowIndex, cell: cellIndex } = focusCellItem
                    const startPoint = [x + width, y + height]
                    const cellItem = this.getCellAt(eX, eY)
                    if ((eX >= x && eX <= x + width) || this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eY - startPoint[1] > 0) {
                            focus.obj = { type: 0, copyType: 0, x, y, width, height: (cellItem.realY - y) + cellItem.height, row: rowIndex, cell: cellIndex }
                        } else if (eY - y < 0) {
                            focus.obj = { type: 1, copyType: 0, x, y: cellItem.realY, width, height: (y - cellItem.realY) + height, row: rowIndex, cell: cellIndex }
                        } else {
                            focus.obj = null
                        }
                        if (focus.obj) {
                            focus.obj.rowCount = Math.abs(cellItem.row - rowIndex) + 1
                            focus.obj.cellCount = 1
                        }
                    } else if ((eY >= y && eY < y + height) || !this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eX - startPoint[0] > 0) {
                            focus.obj = { type: 0, copyType: 1, x, y, width: (cellItem.realX - x) + cellItem.width, height, row: rowIndex, cell: cellIndex }
                        } else if (eX - x < 0) {
                            focus.obj = { type: 2, copyType: 1, x: cellItem.realX, y, width: (x - cellItem.realX) + width, height, row: rowIndex, cell: cellIndex }
                        } else {
                            focus.obj = null
                        }
                        if (focus.obj) {
                            focus.obj.rowCount = 1
                            focus.obj.cellCount = Math.abs(cellItem.cell - cellIndex) + 1
                        }
                    }
                }
            } else if (table.down) {
                this.autoScroll(eX, eY, () => { this.doSelectArea(eX, eY + 10) })
                this.doSelectArea(eX, eY)
            } else if (rowMove.down) {
                // TODO
            } else if (cellMove.down) {
                // TODO
            } else if (row.down) {
                this.autoScroll(eX, eY)
                const rowItem = this.getRowAt(eY)
                if (rowItem) {
                    this.selectArea = { ...this.selectArea }
                    if (row.obj.row <= rowItem.row) {
                        this.selectArea.type = 0
                        this.selectArea.y = row.obj.realY
                        this.selectArea.height = (rowItem.realY - row.obj.realY) + rowItem.height
                        this.selectArea.row = row.obj.row
                    } else {
                        this.selectArea.type = 1
                        this.selectArea.y = rowItem.realY
                        this.selectArea.height = (row.obj.realY - rowItem.realY) + row.obj.height
                        this.selectArea.row = rowItem.row
                    }
                    this.selectArea.rowCount = Math.abs(row.obj.row - rowItem.row)
                    this.$emit('focus', this.allRows[rowItem.row].rowData)
                }
            } else if (cell.down) {
                this.autoScroll(eX, eY)
                const column = this.getColumnAt(eX)
                if (column) {
                    const temp = { ...this.selectArea }
                    if (cell.obj.cell <= column.cell) {
                        temp.x = cell.obj.realX
                        temp.width = (column.realX - cell.obj.realX) + column.width
                        temp.cell = cell.obj.cell
                    } else {
                        temp.x = column.realX
                        temp.width = (cell.obj.realX - column.realX) + cell.obj.width
                        temp.cell = column.cell
                    }
                    temp.cellCount = Math.abs(cell.obj.cell - column.cell)

                    if (!utils.compareObj(this.selectArea, temp)) {
                        this.selectArea = temp
                        this.$emit('focus', this.allRows[0].rowData)
                    }
                }
            } else if (this.verticalBar.move) {
                this.scrollY((e.screenY - this.verticalBar.cursorY) / this.verticalBar.k)
                return
            } else if (this.horizontalBar.move) {
                this.scrollX((e.screenX - this.horizontalBar.cursorX) / this.horizontalBar.k)
                return
            } else if (e.target.classList.contains('canvas-plugin')) {
                this.mouseoverSet(eX, eY)
            }
            requestAnimationFrame(this.painted)
        },
        autoScroll(eX, eY, callback = noop) {
            if (eX < this.canvasWidth && eX > config.width.serial && eY < this.canvasHeight && eY > config.height.columns) {
                clearInterval(this.autoScrollInterval)
            } else if (eY > this.canvasHeight && eX > config.width.serial && eX < this.canvasWidth) {
                let baseScrollValue = eY - this.canvasHeight
                if (baseScrollValue > 200) {
                    baseScrollValue = 200
                }
                if (this.mouseOutValue !== baseScrollValue) {
                    this.mouseOutValue = baseScrollValue
                    clearInterval(this.autoScrollInterval)
                    this.autoScrollInterval = setInterval(() => {
                        this.scrollY(10)
                        callback()
                    }, utils.lineEquation([0, 100], [100, 10], this.mouseOutValue))
                }
            } else if (eY < config.height.columns && eX > config.width.serial && eX < this.canvasWidth) {
                let baseScrollValue = config.height.columns - eY
                if (baseScrollValue > 200) {
                    baseScrollValue = 200
                }
                if (this.mouseOutValue !== baseScrollValue) {
                    this.mouseOutValue = baseScrollValue
                    clearInterval(this.autoScrollInterval)
                    this.autoScrollInterval = setInterval(() => {
                        this.scrollY(-10)
                        callback()
                    }, utils.lineEquation([0, 100], [100, 10], this.mouseOutValue))
                }
            } else if (eX > this.canvasWidth && eY > config.height.columns && eY < this.canvasHeight) {
                let baseScrollValue = eX - this.canvasWidth
                if (baseScrollValue > 200) {
                    baseScrollValue = 200
                }
                if (this.mouseOutValue !== baseScrollValue) {
                    this.mouseOutValue = baseScrollValue
                    clearInterval(this.autoScrollInterval)
                    this.autoScrollInterval = setInterval(() => {
                        this.scrollX(10)
                        callback()
                    }, utils.lineEquation([0, 30], [100, 10], this.mouseOutValue))
                }
            } else if (eX < config.width.serial && eY > config.height.columns && eY < this.canvasHeight) {
                let baseScrollValue = config.width.serial - eX
                if (baseScrollValue > 200) {
                    baseScrollValue = 200
                }
                if (this.mouseOutValue !== baseScrollValue) {
                    this.mouseOutValue = baseScrollValue
                    clearInterval(this.autoScrollInterval)
                    this.autoScrollInterval = setInterval(() => {
                        this.scrollX(-10)
                        callback()
                    }, utils.lineEquation([0, 30], [100, 10], this.mouseOutValue))
                }
            }
        },
        scrollY(value) {
            value *= this.verticalBar.k
            const height = this.canvasHeight - this.verticalBar.size
            const moveHeight = this.verticalBar.y + value
            if (moveHeight > 0 && moveHeight < height) {
                this.verticalBar.y += value
            } else if (moveHeight <= 0) {
                this.verticalBar.y = 0
            } else {
                this.verticalBar.y = height
            }
            this.verticalBar.cursorY += value
            this.offset[1] = -this.verticalBar.y / this.verticalBar.k
            requestAnimationFrame(this.painted)
        },
        scrollX(value) {
            value *= this.horizontalBar.k
            const width = this.canvasWidth - this.horizontalBar.size
            const moveWidth = this.horizontalBar.x + value
            if (moveWidth > 0 && moveWidth < width) {
                this.horizontalBar.x += value
            } else if (moveWidth <= 0) {
                this.horizontalBar.x = 0
            } else {
                this.horizontalBar.x = width
            }
            this.horizontalBar.cursorX += value
            this.offset[0] = -this.horizontalBar.x / this.horizontalBar.k
            requestAnimationFrame(this.painted)
        },
        mouseoverSet(eX, eY) {
            this.clearHover()
            if (utils.isInRegion([eX, eY], [config.width.serial, config.height.columns], [this.canvasWidth, this.canvasHeight])) {
                let hoverImage = false
                if (this.imageObjs.length > 0) {
                    this.imageObjs.forEach((item) => { item.hover = false })
                    for (const item of this.imageObjs) {
                        if (item.point && utils.isInRegion([eX, eY], [item.point[0][0] - 5, item.point[0][1] - 5], [item.point[2][0] + 5, item.point[2][1] + 5])) {
                            this.setCursor('move')
                            this.mouse.image.hover = true
                            hoverImage = true
                            break
                        }
                    }
                }
                if (!hoverImage) {
                    let pointX = 0
                    let pointY = 0
                    const focusCellItem = this.getPositionCell(this.focusCell)
                    if (this.selectArea) {
                        pointX = this.selectArea.x + this.selectArea.width
                        pointY = this.selectArea.y + this.selectArea.height
                    } else {
                        pointX = focusCellItem.realX + focusCellItem.width
                        pointY = focusCellItem.realY + focusCellItem.height
                    }
                    if (utils.isInRegion([eX, eY], [pointX - 3, pointY - 3], [pointX + 4, pointY + 4])) {
                        this.setCursor('crosshair')
                        this.mouse.focus.hover = true
                    } else if (this.isEditing && utils.isInRegion([eX, eY], [focusCellItem.realX, focusCellItem.realY], [focusCellItem.realX + this.$refs.input.offsetWidth, focusCellItem.realY + this.$refs.input.offsetHeight])) {
                        this.setCursor('text')
                        this.mouse.text.hover = true
                    } else {
                        this.setCursor('cell')
                        this.mouse.table.hover = true
                    }
                }
            } else if (utils.isInRegion([eX, eY], [0, config.height.columns], [config.width.serial, this.canvasHeight])) {
                const row = this.isInRowDivide(eY)
                if (row) {
                    this.setCursor('row-resize')
                    this.mouse.rowDivide.hover = true
                    this.mouse.rowDivide.obj = { y: row.realY + row.height, row, minY: row.realY }
                } else if (this.selectArea && this.selectArea.cellCount === Infinity && this.selectArea.rowCount !== Infinity && eY > this.selectArea.y && eY < this.selectArea.y + this.selectArea.height) {
                    this.setCursor('-webkit-grab')
                    this.mouse.rowMove.hover = true
                } else {
                    this.setCursor('pointer')
                    this.mouse.row.hover = true
                }
            } else if (utils.isInRegion([eX, eY], [config.width.serial, 0], [this.canvasWidth, config.height.columns])) {
                const column = this.isInColumnDivide(eX)
                if (column) {
                    this.setCursor('col-resize')
                    this.mouse.cellDivide.hover = true
                    this.mouse.cellDivide.obj = { x: column.realX + column.width, column, minX: column.realX }
                } else if (this.selectArea && this.selectArea.rowCount === Infinity && this.selectArea.cellCount !== Infinity && eX > this.selectArea.x && eX < this.selectArea.x + this.selectArea.width) {
                    this.setCursor('-webkit-grab')
                    this.mouse.cellMove.hover = true
                } else {
                    this.setCursor('pointer')
                    this.mouse.cell.hover = true
                }
            } else if (utils.isInRegion([eX, eY], [0, 0], [config.width.serial - 2, config.height.columns - 2])) {
                this.setCursor('pointer')
                this.mouse.all.hover = true
            }
        },
        clearHover() {
            for (const key in this.mouse) {
                if (this.mouse[key].hover) {
                    this.mouse[key].hover = false
                }
            }
        },
        clearDown() {
            for (const key in this.mouse) {
                if (this.mouse[key].down) {
                    this.mouse[key].down = false
                }
            }
            this.horizontalBar.move = false
            this.verticalBar.move = false
        },
        setCursor(type) {
            if (this.$refs['canvas-plugin'].style.cursor !== type) {
                this.$refs['canvas-plugin'].style.cursor = type
            }
        },
        handleMouseup(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const { image, rowDivide, cellDivide, focus, text } = this.mouse
            if (image.down) {
                image.down = false
                image.obj = null
                requestAnimationFrame(this.paintedImage)
                return
            } else if (rowDivide.down) {
                const differenceValue = rowDivide.obj.y - (rowDivide.obj.row.realY + rowDivide.obj.row.height)
                this.allRows[rowDivide.obj.row.row].height += differenceValue
                for (let i = rowDivide.obj.row.row + 1; i < this.allRows.length; i += 1) {
                    this.allRows[i].y += differenceValue
                }
                if (this.selectArea) {
                    this.selectArea = null
                }
                this.bodyHeight += differenceValue
                rowDivide.down = false
                rowDivide.obj = null
                requestAnimationFrame(this.painted)
            } else if (cellDivide.down) {
                const differenceValue = cellDivide.obj.x - (cellDivide.obj.column.realX + cellDivide.obj.column.width)
                this.allColumns[cellDivide.obj.column.cell].width += differenceValue

                for (let i = cellDivide.obj.column.cell + 1; i < this.allColumns.length; i += 1) {
                    this.allColumns[i].x += differenceValue
                }
                if (this.selectArea) {
                    this.selectArea = null
                }
                this.bodyWidth += differenceValue
                cellDivide.down = false
                cellDivide.obj = null
                requestAnimationFrame(this.painted)
            } else if (focus.down) {
                const copyData = []
                if (this.selectArea) {
                    const beforeSelectCells = this.getCellsBySelect(this.selectArea)
                    this.selectArea = { ...focus.obj, offset: [...this.offset] }
                    focus.obj = null
                    const selectCells = this.getCellsBySelect(this.selectArea)
                    this.copyDeepOption(selectCells, beforeSelectCells, this.selectArea.copyType)
                } else {
                    this.selectArea = { ...focus.obj, offset: [...this.offset] }
                    focus.obj = null
                    const selectCells = this.getCellsBySelect(this.selectArea)
                    const focusCellItem = this.getPositionCell(this.focusCell)
                    if (focusCellItem.cellCoord) {
                        if (this.selectArea.copyType === 0) {
                            let index = 0
                            for (const row of selectCells) {
                                const temp = []
                                for (const item of row) {
                                    let text = focusCellItem.text
                                    for (const coord of focusCellItem.cellCoord) {
                                        if (coord instanceof Array) {
                                            for (const range of coord) {
                                                if (!range.row.isAbsolute) {
                                                    text = text.replace(range.label, range.column.label + (range.row.index + index + 1))
                                                }
                                            }
                                        } else if (!coord.row.isAbsolute) {
                                            text = text.replace(coord.label, coord.column.label + (coord.row.index + index + 1))
                                        }
                                    }
                                    temp.push({
                                        anchor: [item.row, item.cell],
                                        value: text,
                                    })
                                }
                                copyData.push(temp)
                                index += 1
                            }
                        } else {
                            for (const row of selectCells) {
                                const temp = []
                                let index = 0
                                for (const item of row) {
                                    let text = focusCellItem.text
                                    for (const coord of focusCellItem.cellCoord) {
                                        if (coord instanceof Array) {
                                            for (const range of coord) {
                                                if (!range.column.isAbsolute) {
                                                    text = text.replace(range.label, this.words[range.column.index + index].toLowerCase() + range.row.label)
                                                }
                                            }
                                        } else if (!coord.column.isAbsolute) {
                                            text = text.replace(coord.label, this.words[coord.column.index + index].toLowerCase() + coord.row.label)
                                        }
                                    }
                                    temp.push({
                                        anchor: [item.row, item.cell],
                                        value: text.toUpperCase(),
                                    })
                                    index += 1
                                }
                                copyData.push(temp)
                            }
                        }
                    } else {
                        for (const row of selectCells) {
                            const temp = []
                            for (const item of row) {
                                temp.push({
                                    anchor: [item.row, item.cell],
                                    value: focusCellItem.text,
                                })
                            }
                            copyData.push(temp)
                        }
                    }
                }
                this.$emit('updateItems', copyData)
                requestAnimationFrame(this.painted)
            }
            if (!text.hover) {
                this.save()
                this.copyDataFill()
            }
            this.mouseoverSet(eX, eY)
            this.clearDown()
            clearInterval(this.autoScrollInterval)
        },
        handleResize() {
            this.initSize()
            if (this.hasSize) {
                this.$nextTick(function () { //eslint-disable-line
                    requestAnimationFrame(this.painted)
                })
            }
        },
        handleContextMenu(e) {
            e.preventDefault()
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const menuObj = document.getElementsByClassName('right-menu')
            this.topClick = false
            this.leftClick = false
            this.menuPosition = {
                left: `${e.clientX}px`,
                top: `${e.clientY}px`,
            }
            if (eX + menuObj[0].offsetWidth > this.canvasWidth) {
                this.menuPosition.left = `${this.canvasWidth - menuObj[0].offsetWidth}px`
            }
            if (eY + menuObj[0].offsetHeight > this.canvasHeight) {
                this.menuPosition.top = `${this.canvasHeight - menuObj[0].offsetHeight}px`
            }

            if (this.mouse.rowMove.hover || this.mouse.row.hover) {
                const row = this.getRowAt(eY)
                if (row) {
                    this.setRowheight = row.height
                    this.contextRow = { ...row }
                    this.leftClick = true
                }
            } else if (this.mouse.cellMove.hover || this.mouse.cell.hover) {
                const column = this.getColumnAt(eX)
                if (column) {
                    this.setCellWidth = column.width
                    this.contextCell = { ...column }
                    this.topClick = true
                }
            } else if (this.mouse.all.hover) {
                this.cornerClick = true
            }
            this.showMenu = true
        },
        handleDoubleClick(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            if (!this.isEditing && eX > config.width.serial && eX < this.canvasWidth && eY > config.height.columns && eY < this.canvasHeight) {
                const focusCellItem = this.getPositionCell(this.focusCell)
                let { realX: x, realY: y } = focusCellItem
                const { text, width, height } = focusCellItem
                if (x < config.width.serial) {
                    this.offset.x += config.width.serial - x
                    x = config.width.serial
                }
                if (y < config.height.columns) {
                    this.offset.y += config.height.columns - y
                    y = config.height.columns
                }
                this.$refs.input.innerHTML = text
                utils.keepLastIndex(this.$refs.input)
                this.showInput(x, y, width, height)
            }
        },
        handleKeydown(e) {
            if (!this.isEditing && !this.fxFocus) {
                if (e.keyCode === 38) { // 上
                    e.preventDefault()
                    this.moveFocus('up')
                } else if (e.keyCode === 40) { // 下
                    e.preventDefault()
                    this.moveFocus('down')
                } else if (e.keyCode === 37) { // 左
                    e.preventDefault()
                    this.moveFocus('left')
                } else if (e.keyCode === 39) { // 右
                    e.preventDefault()
                    this.moveFocus('right')
                } else if (e.keyCode === 8 || e.keyCode === 46) { // del/delete
                    const index = this.imageObjs.findIndex(item => item.focus)
                    this.imageObjs.splice(index, 1)
                    requestAnimationFrame(this.paintedImage)
                    if (index === -1) {
                        if (this.selectArea) {
                            const selectCells = this.getCellsBySelect(this.selectArea)
                            const deleteData = []
                            for (const row of selectCells) {
                                const temp = []
                                for (const item of row) {
                                    temp.push({
                                        anchor: [item.row, item.cell],
                                        value: '',
                                    })
                                }
                                deleteData.push(temp)
                            }
                            this.$emit('updateItems', deleteData)
                        } else {
                            this.$emit('updateItem', {
                                anchor: [...this.focusCell],
                                value: '',
                            })
                        }
                    }
                } else if (/macintosh|mac os x/i.test(navigator.userAgent)) {
                    if (e.keyCode === 90 && e.metaKey) {
                        e.preventDefault()
                        this.$emit('history_back')
                    } else if (e.keyCode === 89 && e.metaKey) {
                        e.preventDefault()
                        this.$emit('history_forward')
                    } else if (e.keyCode === 67 && e.metaKey) {
                        e.preventDefault()
                        utils.selectText(this.$refs.inputSelect)
                        document.execCommand('Copy')
                    }
                } else if (e.keyCode === 90 && e.ctrlKey) {
                    e.preventDefault()
                    this.$emit('history_back')
                } else if (e.keyCode === 89 && e.ctrlKey) {
                    e.preventDefault()
                    this.$emit('history_forward')
                } else if (e.keyCode === 67 && e.ctrlKey) {
                    e.preventDefault()
                    utils.selectText(this.$refs.inputSelect)
                    document.execCommand('Copy')
                }
            }
            if (e.keyCode === 13) { // enter
                if (this.rowHeightDialog) {
                    this.setHeight()
                } else if (this.cellWidthDialog) {
                    this.setWidth()
                } else {
                    if (this.fxFocus) {
                        this.fxEnter = true
                        this.expressionItems = []
                        this.expressionSelect = false
                        this.expressionSelectDone = false
                        this.$emit('updateItem', {
                            anchor: [...this.focusCell],
                            value: this.fxValue,
                        })
                    }
                    this.save()
                    this.moveFocus('down')
                    this.focusInput()
                }
            } else if (e.keyCode === 27) { // esc
                if (this.rowHeightDialog) {
                    this.rowHeightDialog = false
                } else if (this.cellWidthDialog) {
                    this.cellWidthDialog = false
                } else if (this.fxFocus) {
                    this.fxValue = ''
                    this.focusInput()
                    this.$refs.fxInput.blur()
                } else {
                    this.hideInput()
                    this.$refs.input.innerHTML = ''
                }
            } else if (e.keyCode === 9) { // tab
                if (!this.fxFocus && !this.rowHeightDialog && !this.cellWidthDialog) {
                    this.save()
                    this.moveFocus('right')
                }
            }
        },
        moveFocus(type) {
            if (this.selectArea) {
                this.selectArea = null
            }
            const [x, y] = this.focusCell
            const { row, cell, rowData } = this.getPositionCell(this.focusCell)
            this.hideInput()
            if (type === 'up') {
                if (row !== 0) {
                    this.focusCell = [x - 1, y]
                    const focusCellItem = this.getPositionCell(this.focusCell)
                    if (focusCellItem.realY < config.height.columns) {
                        this.offset[1] += config.height.columns - focusCellItem.realY
                    }
                }
            } else if (type === 'down') {
                if (row !== this.allRows.length - 1) {
                    this.focusCell = [x + 1, y]
                    const focusCellItem = this.getPositionCell(this.focusCell)
                    if (focusCellItem.realY + focusCellItem.height > this.canvasHeight) {
                        this.offset[1] -= (focusCellItem.realY + focusCellItem.height + 5) - this.canvasHeight
                    }
                }
            } else if (type === 'left') {
                if (cell !== 0) {
                    this.focusCell = [x, y - 1]
                    const focusCellItem = this.getPositionCell(this.focusCell)
                    if (focusCellItem.realX < config.width.serial) {
                        this.offset[0] += config.width.serial - focusCellItem.realX
                    }
                }
            } else if (type === 'right') {
                if (cell !== this.allColumns.length - 1) {
                    this.focusCell = [x, y + 1]
                    const focusCellItem = this.getPositionCell(this.focusCell)
                    if (focusCellItem.realX + focusCellItem.width > this.canvasWidth) {
                        this.offset[0] -= (focusCellItem.realX + focusCellItem.width + 5) - this.canvasWidth
                    }
                }
            }
            requestAnimationFrame(this.painted)
            this.$emit('focus', rowData)
            this.$emit('scroll')
        },
    },
}
