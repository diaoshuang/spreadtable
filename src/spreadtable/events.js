import config from './config'
import utils from './utils'

export default {
    data() {
        return {
            isDown: false, // 是否表格上左键按下
            isHoverRowDivideDown: false, // 是否行分界线
            isHoverColumnDivideDown: false, // 是否列分界线
            isHoverGrid: false, // 是否表格上
            isHoverRow: false, // 是否处于行
            isHoverColumn: false, // 是否处于列头
            isHoverFocusCopy: false, // 是否处于右下角小点
            isColumnDraggingDown: false,
            isRowDraggingDown: false,
            isFocusCopyDown: false, // 右下角小点是否点击
            isImgMoveDown: false,
            isFxEditing: false, // 是否处于公式编辑

            rowSelect: false,
            columnSelect: false,

            hoverImage: null,
            hoverRowDivide: null, // 悬浮行
            hoverColumnDivide: null, // 悬浮列
            focusCopy: null,

            imgFocus: false,
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
            },
        }
    },
    created() {
        this.isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    },
    methods: {
        initEvents() {
            this.$refs['canvas-plugin'].addEventListener(this.isFirefox ? 'DOMMouseScroll' : 'mousewheel', this.handleWheel)
            this.$refs['canvas-plugin'].addEventListener('contextmenu', this.handleContextMenu, false)
            this.$refs['canvas-plugin'].addEventListener('dblclick', this.handleDoubleClick, false)
            this.$refs['canvas-plugin'].addEventListener('mousedown', this.handleMousedown, false)
            document.addEventListener('mousemove', this.handleMousemove, true)
            document.addEventListener('mouseup', this.handleMouseup, false)
            window.addEventListener('resize', this.handleResize, false)
            document.addEventListener('keydown', this.handleKeydown, false)
        },
        removeEvents() {
            // window.removeEventListener('mousedown', this.handleMousedown, false)
            document.removeEventListener('mousemove', this.handleMousemove, true)
            document.removeEventListener('mouseup', this.handleMouseup, false)
            window.removeEventListener('resize', this.handleResize, false)
            document.removeEventListener('keydown', this.handleKeydown, false)
        },
        handleWheel(e) {
            if (!this.isEditing) {
                const { deltaX, deltaY } = e
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    const lastScrollX = this.offset[0]
                    const maxWidth = this.canvasWidth
                    if (this.offset[0] - deltaX > 0) {
                        this.offset[0] = 0
                    } else if (((this.bodyWidth + config.width.right + config.width.serial) - maxWidth) + this.offset[0] < deltaX) {
                        if (maxWidth - this.bodyWidth < 0) {
                            this.offset[0] = maxWidth - (this.bodyWidth + config.width.right + config.width.serial)
                        } else {
                            e.preventDefault()
                            e.returnValue = false
                        }
                    } else {
                        e.preventDefault()
                        e.returnValue = false
                        this.offset[0] -= deltaX
                    }
                    if (lastScrollX !== this.offset[0]) {
                        requestAnimationFrame(this.painted)
                        this.$emit('scroll')
                    }
                } else {
                    const lastScrollY = this.offset[1]
                    const maxHeight = this.canvasHeight
                    if (lastScrollY - deltaY > 0) {
                        this.offset[1] = 0
                    } else if (((this.bodyHeight + config.height.bottom + config.height.columns) - maxHeight) + lastScrollY < deltaY) {
                        if (maxHeight - this.bodyHeight < 0) {
                            this.offset[1] = maxHeight - (this.bodyHeight + config.height.bottom + config.height.columns)
                        } else {
                            e.preventDefault()
                            e.returnValue = false
                        }
                    } else {
                        e.preventDefault()
                        e.returnValue = false
                        this.offset[1] -= deltaY
                    }
                    if (lastScrollY !== this.offset[1]) {
                        requestAnimationFrame(this.painted)
                        this.$emit('scroll')
                    }
                }
            }
        },
        handleMousedown(e) {
            this.save()
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const { image, rowDivide, cellDivide, table, focus, rowMove, cellMove, row, cell, all } = this.mouse
            if (image.hover) {
                image.down = true
                for (const item of this.imageObjs) {
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
                        requestAnimationFrame(this.painted)
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
                    row.obj = { ...rowItem }
                    this.focusCell = [rowItem.row, 0]
                    this.offset[0] = 0
                    this.selectArea = { type: 0, x: config.width.serial, y: rowItem.realY, width: Infinity, height: rowItem.height, cell: 0, row: rowItem.row, offset: [...this.offset] }
                    this.selectArea.rowCount = 1
                    this.selectArea.cellCount = Infinity
                    this.$emit('focus', this.allRows[rowItem.row].rowData)
                }
            } else if (cell.hover) {
                cell.down = true
                const column = this.getColumnAt(eX)
                if (column) {
                    cell.obj = { ...column }
                    this.focusCell = [0, column.cell]
                    this.offset[1] = 0
                    this.selectArea = { type: 0, x: column.realX, y: config.height.columns, width: column.width, height: Infinity, cell: column.cell, row: 0, offset: [...this.offset] }
                    this.selectArea.rowCount = Infinity
                    this.selectArea.cellCount = 1
                    this.$emit('focus', this.allRows[0].rowData)
                }
            } else if (all.hover) {
                this.focusCell = [0, 0]
                this.offset = [0, 0]
                this.selectArea = { type: 0, x: config.width.serial, y: config.height.columns, width: Infinity, height: Infinity, cell: 0, row: 0, offset: [...this.offset] }
                this.selectArea.rowCount = Infinity
                this.selectArea.cellCount = Infinity
                this.$emit('focus', this.allRows[0].rowData)
            }
            if (!image.hover) {
                for (const item of this.imageObjs) {
                    item.focus = false
                }
            }
            requestAnimationFrame(this.painted)
        },

        handleMousemove(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const { image, rowDivide, cellDivide, focus, table, rowMove, cellMove, row, cell, all } = this.mouse
            if (image.down) {
                image.obj.img.x += e.movementX
                image.obj.img.y += e.movementY
                requestAnimationFrame(this.paintedImage)
                return
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

            } else if (table.down) {
                this.doSelectArea(eX, eY)
            } else if (rowMove.down) {

            } else if (cellMove.down) {

            } else if (row.down) {
                const rowItem = this.getRowAt(eY)
                if (rowItem) {
                    if (row.obj.row <= row.row) {
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
                    requestAnimationFrame(this.painted)
                    this.$emit('focus', this.allRows[rowItem.row].rowData)
                }
            } else if (cell.down) {
                const column = this.getColumnAt(eX)
                if (column) {
                    if (this.columnSelect.cell <= column.cell) {
                        this.selectArea.x = this.columnSelect.realX
                        this.selectArea.width = (column.realX - this.columnSelect.realX) + column.width
                        this.selectArea.cell = this.columnSelect.cell
                    } else {
                        this.selectArea.x = column.realX
                        this.selectArea.width = (this.columnSelect.realX - column.realX) + this.columnSelect.width
                        this.selectArea.cell = column.cell
                    }
                    this.selectArea.cellCount = Math.abs(this.columnSelect.cell - column.cell)
                    requestAnimationFrame(this.painted)
                    this.$emit('focus', this.allRows[0].rowData)
                }
            } else if (e.target.classList.contains('canvas-plugin')) {
                this.mouseoverSet(eX, eY)
            }
            requestAnimationFrame(this.painted)
        },
        handleMousemove1(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            this.isHoverFocusCopy = false
            this.isHoverColumn = false
            this.isHoverRow = false
            this.isHoverGrid = false
            if (!this.isHoverRowDivideDown) {
                this.hoverRowDivide = null
            }
            if (!this.isHoverColumnDivideDown) {
                this.hoverColumnDivide = null
            }

            let hoverImage = false
            if (this.imageObjs.length > 0) {
                this.imageObjs.forEach((item) => { item.hover = false })
                for (const item of this.imageObjs) {
                    if (item.point && utils.isInRegion([eX, eY], [item.point[0][0] - 5, item.point[0][1] - 5], [item.point[2][0] + 5, item.point[2][1] + 5])) {
                        this.setCursor('move')
                        item.hover = true
                        hoverImage = true
                    }
                }
            }

            if (this.isDown) {
                this.doSelectArea(eX, eY)
            } else if (this.isHoverRowDivideDown) {
                if (eY > this.hoverRowDivide.minY) {
                    this.hoverRowDivide.y = eY
                } else {
                    this.hoverRowDivide.y = this.hoverRowDivide.minY
                }
                requestAnimationFrame(this.painted)
            } else if (this.isHoverColumnDivideDown) {
                if (eX > this.hoverColumnDivide.minX) {
                    this.hoverColumnDivide.x = eX
                } else {
                    this.hoverColumnDivide.x = this.hoverColumnDivide.minX
                }
                requestAnimationFrame(this.painted)
            } else if (this.isColumnDraggingDown) {
                // TODO 列拖拽换位置
            } else if (this.isRowDraggingDown) {
                // TODO 行拖拽
            } else if (this.rowSelect) {
                const row = this.getRowAt(eY)
                if (row) {
                    if (this.rowSelect.row <= row.row) {
                        this.selectArea.type = 0
                        this.selectArea.y = this.rowSelect.realY
                        this.selectArea.height = (row.realY - this.rowSelect.realY) + row.height
                        this.selectArea.row = this.rowSelect.row
                    } else {
                        this.selectArea.type = 1
                        this.selectArea.y = row.realY
                        this.selectArea.height = (this.rowSelect.realY - row.realY) + this.rowSelect.height
                        this.selectArea.row = row.row
                    }
                    this.selectArea.rowCount = Math.abs(this.rowSelect.row - row.row)
                    requestAnimationFrame(this.painted)
                    this.$emit('focus', this.allRows[row.row].rowData)
                }
            } else if (this.columnSelect) {
                const column = this.getColumnAt(eX)
                if (column) {
                    if (this.columnSelect.cell <= column.cell) {
                        this.selectArea.x = this.columnSelect.realX
                        this.selectArea.width = (column.realX - this.columnSelect.realX) + column.width
                        this.selectArea.cell = this.columnSelect.cell
                    } else {
                        this.selectArea.x = column.realX
                        this.selectArea.width = (this.columnSelect.realX - column.realX) + this.columnSelect.width
                        this.selectArea.cell = column.cell
                    }
                    this.selectArea.cellCount = Math.abs(this.columnSelect.cell - column.cell)
                    requestAnimationFrame(this.painted)
                    this.$emit('focus', this.allRows[0].rowData)
                }
            } else if (this.isFocusCopyDown) {
                const focusCellItem = this.getFocusCell(this.focusCell)
                if (this.selectArea) {
                    const { x, y, width, height, row, cell: cellIndex } = this.selectArea
                    const startPoint = [x + width, y + height]
                    const cell = this.getCellAt(eX, eY)
                    if ((eX >= x && eX <= x + width) || this.isInVerticalQuadrant(this.selectArea, eX, eY)) {
                        if (eY - startPoint[1] > 0) {
                            this.focusCopy = { type: 0, copyType: 0, x, y, width, height: (cell.realY - y) + cell.height, row, cell: cellIndex }
                        } else if (eY - y < 0) {
                            this.focusCopy = { type: 1, copyType: 0, x, y: cell.realY, width, height: (y - cell.realY) + height, row, cell: cellIndex }
                        } else if (utils.lineEquation([x, y], [startPoint[0], startPoint[1]], eX) > eY) {
                            this.focusCopy = { type: 0, copyType: 0, x, y, width, height: (cell.realY - y) + cell.height, row, cell: cellIndex }
                        } else {
                            this.focusCopy = { type: 0, copyType: 1, x, y, width: (cell.realX - x) + cell.width, height }
                        }
                        if (this.focusCopy) {
                            this.focusCopy.rowCount = Math.abs(cell.row - row) + 1
                            this.focusCopy.cellCount = this.selectArea.cellCount
                        }
                    } else if ((eY >= y && eY < y + height) || !this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eX - startPoint[0] > 0) {
                            this.focusCopy = { type: 0, copyType: 1, x, y, width: (cell.realX - x) + cell.width, height }
                        } else if (eX - x < 0) {
                            this.focusCopy = { type: 2, copyType: 1, x: cell.realX, y, width: (x - cell.realX) + width, height }
                        }
                        if (this.focusCopy) {
                            this.focusCopy.rowCount = this.selectArea.rowCount
                            this.focusCopy.cellCount = Math.abs(cell.cell - cellIndex) + 1
                        }
                    }
                } else {
                    const { realX: x, realY: y, width, height, row, cell: cellIndex } = focusCellItem
                    const startPoint = [x + width, y + height]
                    const cell = this.getCellAt(eX, eY)
                    if ((eX >= x && eX <= x + width) || this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eY - startPoint[1] > 0) {
                            this.focusCopy = { type: 0, x, y, width, height: (cell.realY - y) + cell.height, row, cell: cellIndex }
                        } else if (eY - y < 0) {
                            this.focusCopy = { type: 1, x, y: cell.realY, width, height: (y - cell.realY) + height, row, cell: cellIndex }
                        } else {
                            this.focusCopy = null
                        }
                        if (this.focusCopy) {
                            this.focusCopy.rowCount = Math.abs(cell.row - row) + 1
                            this.focusCopy.cellCount = 1
                        }
                    } else if ((eY >= y && eY < y + height) || !this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eX - startPoint[0] > 0) {
                            this.focusCopy = { type: 0, x, y, width: (cell.realX - x) + cell.width, height, row, cell: cellIndex }
                        } else if (eX - x < 0) {
                            this.focusCopy = { type: 2, x: cell.realX, y, width: (x - cell.realX) + width, height, row, cell: cellIndex }
                        } else {
                            this.focusCopy = null
                        }
                        if (this.focusCopy) {
                            this.focusCopy.rowCount = 1
                            this.focusCopy.cellCount = Math.abs(cell.cell - cellIndex) + 1
                        }
                    }
                }
                requestAnimationFrame(this.painted)
            } else if (this.isImgMoveDown) {
                this.hoverImage.img.x += e.movementX
                this.hoverImage.img.y += e.movementY
                requestAnimationFrame(this.paintedImage)
            } else if (!hoverImage && e.target.classList.contains('canvas-plugin')) {
                if (utils.isInRegion([eX, eY], [config.width.serial, config.height.columns], [this.canvasWidth, this.canvasHeight])) {
                    this.isHoverGrid = true
                    this.setCursor('cell')
                    const focusCellItem = this.getFocusCell(this.focusCell)
                    const focusPointX = focusCellItem.realX + focusCellItem.width
                    const focusPointY = focusCellItem.realY + focusCellItem.height
                    if (this.selectArea) {
                        const selectPointX = this.selectArea.x + this.selectArea.width
                        const selectPointY = this.selectArea.y + this.selectArea.height
                        if (utils.isInRegion([eX, eY], [selectPointX + -3, selectPointY - 3], [selectPointX + 4, selectPointY + 4])) {
                            this.isHoverFocusCopy = true
                            this.setCursor('crosshair')
                        }
                    } else if (utils.isInRegion([eX, eY], [focusPointX - 3, focusPointY - 3], [focusPointX + 4, focusPointY + 4])) {
                        this.isHoverFocusCopy = true
                        this.setCursor('crosshair')
                    }
                } else if (utils.isInRegion([eX, eY], [0, config.height.columns], [config.width.serial, this.canvasHeight])) {
                    this.isHoverRow = true
                    this.setCursor('e-resize')
                    if (!this.isHoverRowDivideDown) {
                        const row = this.isInRowDivide(eY)
                        if (row) {
                            this.setCursor('row-resize')
                            if (!this.hoverRowDivide) {
                                this.hoverRowDivide = { y: row.realY + row.height, row, minY: row.realY }
                            }
                        } else {
                            if (this.hoverRowDivide) {
                                this.hoverRowDivide = null
                            }
                            if (this.selectArea && this.selectArea.cellCount === Infinity && eY > this.selectArea.y && eY < this.selectArea.y + this.selectArea.height) {
                                this.setCursor('-webkit-grab')
                            }
                        }
                    } else {
                        this.hoverRowDivide = null
                    }
                } else if (utils.isInRegion([eX, eY], [config.width.serial, 0], [this.canvasWidth, config.height.columns])) {
                    this.isHoverColumn = true
                    this.setCursor('s-resize')
                    if (!this.isHoverColumnDivideDown) {
                        const column = this.isInColumnDivide(eX)
                        if (column) {
                            this.setCursor('col-resize')
                            if (!this.hoverColumnDivide) {
                                this.hoverColumnDivide = { x: column.realX + column.width, column, minX: column.realX }
                            }
                        } else {
                            if (this.hoverColumnDivide) {
                                this.hoverColumnDivide = null
                            }
                            if (this.selectArea && this.selectArea.rowCount === Infinity && eX > this.selectArea.x && eX < this.selectArea.x + this.selectArea.width) {
                                this.setCursor('-webkit-grab')
                            }
                        }
                    } else {
                        this.hoverColumnDivide = null
                    }
                } else if (utils.isInRegion([eX, eY], [0, 0], [config.width.serial - 2, config.height.columns - 2])) {
                    this.setCursor('se-resize')
                }
            }
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
                    if (this.selectArea) {
                        pointX = this.selectArea.x + this.selectArea.width
                        pointY = this.selectArea.y + this.selectArea.height
                    } else {
                        const focusCellItem = this.getFocusCell(this.focusCell)
                        pointX = focusCellItem.realX + focusCellItem.width
                        pointY = focusCellItem.realY + focusCellItem.height
                    }
                    if (utils.isInRegion([eX, eY], [pointX - 3, pointY - 3], [pointX + 4, pointY + 4])) {
                        this.setCursor('crosshair')
                        this.mouse.focus.hover = true
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
                } else if (this.selectArea && this.selectArea.cellCount === Infinity && eY > this.selectArea.y && eY < this.selectArea.y + this.selectArea.height) {
                    this.setCursor('-webkit-grab')
                    this.mouse.rowMove.hover = true
                } else {
                    this.setCursor('e-resize')
                    this.mouse.row.hover = true
                }
            } else if (utils.isInRegion([eX, eY], [config.width.serial, 0], [this.canvasWidth, config.height.columns])) {
                const column = this.isInColumnDivide(eX)
                if (column) {
                    this.setCursor('col-resize')
                    this.mouse.cellDivide.hover = true
                    this.mouse.cellDivide.obj = { x: column.realX + column.width, column, minX: column.realX }
                } else if (this.selectArea && this.selectArea.rowCount === Infinity && eX > this.selectArea.x && eX < this.selectArea.x + this.selectArea.width) {
                    this.setCursor('-webkit-grab')
                    this.mouse.cellMove.hover = true
                } else {
                    this.setCursor('s-resize')
                    this.mouse.cell.hover = true
                }
            } else if (utils.isInRegion([eX, eY], [0, 0], [config.width.serial - 2, config.height.columns - 2])) {
                this.setCursor('se-resize')
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
        },
        setCursor(type) {
            if (this.$refs['canvas-plugin'].style.cursor !== type) {
                this.$refs['canvas-plugin'].style.cursor = type
            }
        },
        handleMouseup(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const { image, rowDivide, cellDivide } = this.mouse
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
                    // TODO selectArea宽度重置，3种情况
                }
                this.bodyWidth += differenceValue
                cellDivide.down = false
                cellDivide.obj = null
                requestAnimationFrame(this.painted)
            }
            this.mouseoverSet(eX, eY)
            this.clearDown()
        },
        handleMouseup1(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            this.isDown = false
            this.isFocusCopyDown = false
            this.rowSelect = null
            this.columnSelect = null
            if (this.isImgMoveDown) {
                this.isImgMoveDown = false
                requestAnimationFrame(this.painted)
            }
            if (this.selectArea) {
                if (this.selectArea.rowCount === Infinity && eX > this.selectArea.x && eX < this.selectArea.x + this.selectArea.width) {
                    this.setCursor('-webkit-grab')
                } else if (this.selectArea.cellCount === Infinity && eY > this.selectArea.y && eY < this.selectArea.y + this.selectArea.height) {
                    this.setCursor('-webkit-grab')
                }
            }

            this.isColumnDraggingDown = false
            this.isRowDraggingDown = false
            this.horizontalBar.move = false
            this.verticalBar.move = false
            if (this.focusCopy) {
                const copyData = []
                if (this.selectArea) {
                    // todo selectarea copy
                    const beforeSelectCells = this.getCellsBySelect(this.selectArea)
                    this.selectArea = { ...this.focusCopy, offset: [...this.offset] }
                    this.focusCopy = null
                    const selectCells = this.getCellsBySelect(this.selectArea)
                    this.copyDeepOption(selectCells, beforeSelectCells, this.selectArea.copyType)
                } else {
                    this.selectArea = { ...this.focusCopy, offset: [...this.offset] }
                    this.focusCopy = null
                    const selectCells = this.getCellsBySelect(this.selectArea)
                    const focusCellItem = this.getFocusCell(this.focusCell)
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
                this.$emit('updateItems', copyData)
                requestAnimationFrame(this.painted)
            }
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

            if (eX < config.width.serial && eY > config.height.columns) {
                const row = this.getRowAt(eY)
                if (row) {
                    this.setRowheight = row.height
                    this.contextRow = { ...row }
                    this.leftClick = true
                }
            } else if (eX > config.width.serial && eY < config.height.columns) {
                const column = this.getColumnAt(eX)
                if (column) {
                    this.setCellWidth = column.width
                    this.contextCell = { ...column }
                    this.topClick = true
                }
            } else if (eX < config.width.serial && eY < config.height.columns) {
                this.cornerClick = true
            }
            this.showMenu = true
        },
        handleDoubleClick(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            if (eX > config.width.serial && eX < this.canvasWidth && eY > config.height.columns && eY < this.canvasHeight) {
                const focusCellItem = this.getFocusCell(this.focusCell)
                let { realX: x, realY: y } = focusCellItem
                const { paintText, width, height } = focusCellItem
                if (x < config.width.serial) {
                    this.offset.x += config.width.serial - x
                    x = config.width.serial
                }
                if (y < config.height.columns) {
                    this.offset.y += config.height.columns - y
                    y = config.height.columns
                }
                this.$refs.input.innerHTML = paintText
                utils.keepLastIndex(this.$refs.input)
                this.showInput(x, y, width, height)
            }
        },
        handleKeydown(e) {
            if (!this.isEditing && !this.isFxEditing) {
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
                if (!this.fxFocus) {
                    this.save()
                    this.moveFocus('down')
                }
            } else if (e.keyCode === 27) { // esc
                this.hideInput()
                this.$refs.input.innerHTML = ''
            } else if (e.keyCode === 9) { // tab
                if (!this.fxFocus) {
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
            const { row, cell, rowData } = this.getFocusCell(this.focusCell)
            this.hideInput()
            if (type === 'up') {
                if (row !== 0) {
                    this.focusCell = [x - 1, y]
                    const focusCellItem = this.getFocusCell(this.focusCell)
                    if (focusCellItem.realY < config.height.columns) {
                        this.offset[1] += config.height.columns - focusCellItem.realY
                    }
                }
            } else if (type === 'down') {
                if (row !== this.allRows.length - 1) {
                    this.focusCell = [x + 1, y]
                    const focusCellItem = this.getFocusCell(this.focusCell)
                    if (focusCellItem.realY + focusCellItem.height > this.canvasHeight) {
                        this.offset[1] -= (focusCellItem.realY + focusCellItem.height + 5) - this.canvasHeight
                    }
                }
            } else if (type === 'left') {
                if (cell !== 0) {
                    this.focusCell = [x, y - 1]
                    const focusCellItem = this.getFocusCell(this.focusCell)
                    if (focusCellItem.realX < config.width.serial) {
                        this.offset[0] += config.width.serial - focusCellItem.realX
                    }
                }
            } else if (type === 'right') {
                if (cell !== this.allColumns.length - 1) {
                    this.focusCell = [x, y + 1]
                    const focusCellItem = this.getFocusCell(this.focusCell)
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
