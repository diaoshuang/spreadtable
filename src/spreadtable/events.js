import config from './config'
import utils from './utils'

export default {
    data() {
        return {
            isFxEditing: false, // 是否处于公式编辑
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
                const focusCellItem = this.getFocusCell(this.focusCell)
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
                            focus.obj = { type: 0, copyType: 1, x, y, width: (cellItem.realX - x) + cellItem.width, height }
                        } else if (eX - x < 0) {
                            focus.obj = { type: 2, copyType: 1, x: cellItem.realX, y, width: (x - cellItem.realX) + width, height }
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
                            focus.obj = { type: 0, x, y, width, height: (cellItem.realY - y) + cellItem.height, row: rowIndex, cell: cellIndex }
                        } else if (eY - y < 0) {
                            focus.obj = { type: 1, x, y: cellItem.realY, width, height: (y - cellItem.realY) + height, row: rowIndex, cell: cellIndex }
                        } else {
                            focus.obj = null
                        }
                        if (focus.obj) {
                            focus.obj.rowCount = Math.abs(cellItem.row - rowIndex) + 1
                            focus.obj.cellCount = 1
                        }
                    } else if ((eY >= y && eY < y + height) || !this.isInVerticalQuadrant(focusCellItem, eX, eY)) {
                        if (eX - startPoint[0] > 0) {
                            focus.obj = { type: 0, x, y, width: (cellItem.realX - x) + cellItem.width, height, row: rowIndex, cell: cellIndex }
                        } else if (eX - x < 0) {
                            focus.obj = { type: 2, x: cellItem.realX, y, width: (x - cellItem.realX) + width, height, row: rowIndex, cell: cellIndex }
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
                this.doSelectArea(eX, eY)
            } else if (rowMove.down) {

            } else if (cellMove.down) {

            } else if (row.down) {
                const rowItem = this.getRowAt(eY)
                if (rowItem) {
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
                const column = this.getColumnAt(eX)
                if (column) {
                    if (cell.obj.cell <= column.cell) {
                        this.selectArea.x = cell.obj.realX
                        this.selectArea.width = (column.realX - cell.obj.realX) + column.width
                        this.selectArea.cell = cell.obj.cell
                    } else {
                        this.selectArea.x = column.realX
                        this.selectArea.width = (cell.obj.realX - column.realX) + cell.obj.width
                        this.selectArea.cell = column.cell
                    }
                    this.selectArea.cellCount = Math.abs(cell.obj.cell - column.cell)
                    this.$emit('focus', this.allRows[0].rowData)
                }
            } else if (e.target.classList.contains('canvas-plugin')) {
                this.mouseoverSet(eX, eY)
            }
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
                    this.setCursor('pointer')
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
        },
        setCursor(type) {
            if (this.$refs['canvas-plugin'].style.cursor !== type) {
                this.$refs['canvas-plugin'].style.cursor = type
            }
        },
        handleMouseup(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            const { image, rowDivide, cellDivide, focus } = this.mouse
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
            this.mouseoverSet(eX, eY)
            this.clearDown()
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
