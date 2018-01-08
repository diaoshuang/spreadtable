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
            isFocusCopyDown: false, // 右下角小点是否点击
            isFxEditing: false, // 是否处于公式编辑

            hoverImage: null,
            hoverRowDivide: null, // 悬浮行
            hoverColumnDivide: null, // 悬浮列
            focusCopy: null,
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
            if (e.region) {
                this.isImgMoveDown = true
                this.hoverImage = {
                    x: eX,
                    y: eY,
                    originX: eX,
                    originY: eY,
                    img: this.imageObjs.find(item => `${item.id}` === e.region),
                }
                return
            }
            if (e.target.classList.contains('canvas-spreadtable') || e.target.classList.contains('canvas-plugin')) {
                if (this.hoverRowDivide) {
                    this.isHoverRowDivideDown = true
                    requestAnimationFrame(this.painted)
                } else if (this.hoverColumnDivide) {
                    this.isHoverColumnDivideDown = true
                    requestAnimationFrame(this.painted)
                } else if (utils.isInRegion([eX, eY], [config.width.serial, config.height.columns], [this.canvasWidth, this.canvasHeight])) {
                    if (this.isHoverFocusCopy) {
                        this.isFocusCopyDown = true
                    } else {
                        this.isDown = true
                        if (e.shiftKey) {
                            this.doSelectArea(eX, eY)
                        } else {
                            const cell = this.getCellAt(eX, eY)
                            if (cell) {
                                this.focusCell = [cell.row, cell.cell]
                                this.selectArea = null
                                requestAnimationFrame(this.painted)
                                this.$emit('focus', cell.rowData)
                            }
                        }
                    }
                } else if (utils.isInRegion([eX, eY], [0, 0], [config.width.serial - 2, config.height.columns - 2])) {
                    this.focusCell = [0, 0]
                    this.offset = [0, 0]
                    this.selectArea = { type: 0, x: config.width.serial, y: config.height.columns, width: Infinity, height: Infinity, cell: 0, row: 0, offset: [...this.offset] }
                    this.selectArea.rowCount = Infinity
                    this.selectArea.cellCount = Infinity
                    requestAnimationFrame(this.painted)
                    this.$emit('focus', this.allRows[0].rowData)
                } else if (utils.isInRegion([eX, eY], [0, config.height.columns], [config.width.serial, this.canvasHeight])) {
                    const row = this.getRowAt(eY)
                    if (row) {
                        this.focusCell = [row.row, 0]
                        this.offset[0] = 0
                        this.selectArea = { type: 0, x: config.width.serial, y: row.realY, width: Infinity, height: row.height, cell: 0, row: row.row, offset: [...this.offset] }
                        this.selectArea.rowCount = 1
                        this.selectArea.cellCount = Infinity
                        requestAnimationFrame(this.painted)
                        this.$emit('focus', this.allRows[row.row].rowData)
                    }
                } else if (utils.isInRegion([eX, eY], [config.width.serial, 0], [this.canvasWidth, config.height.columns])) {
                    const column = this.getColumnAt(eX)
                    if (column) {
                        this.focusCell = [0, column.cell]
                        this.offset[1] = 0
                        this.selectArea = { type: 0, x: column.realX, y: config.height.columns, width: column.width, height: Infinity, cell: column.cell, row: 0, offset: [...this.offset] }
                        this.selectArea.rowCount = Infinity
                        this.selectArea.cellCount = 1
                        requestAnimationFrame(this.painted)
                        this.$emit('focus', this.allRows[0].rowData)
                    }
                }
            }
        },
        doSelectArea(eX, eY) {
            const { width, height, row, cell: cellIndex, realX: x, realY: y } = this.getFocusCell(this.focusCell)
            if (eX >= x && eX <= x + width && eY >= y && eY <= y + height) {
                this.selectArea = null
                requestAnimationFrame(this.painted)
            } else {
                if (eX < config.width.serial) {
                    eX = config.width.serial
                }
                if (eY < config.height.columns) {
                    eY = config.height.columns
                }
                if (eX > this.canvasWidth) {
                    eX = this.canvasWidth
                }
                if (eY > this.canvasHeight) {
                    eY = this.canvasHeight
                }
                const cell = this.getCellAt(eX, eY)
                if (cell) {
                    if (cell.realX >= x && cell.realY >= y) {
                        this.selectArea = { type: 0, x, y, width: (cell.realX - x) + cell.width, height: (cell.realY - y) + cell.height, cell: cellIndex, row, offset: [...this.offset] }
                    } else if (cell.realX >= x && cell.realY <= y) {
                        this.selectArea = { type: 1, x, y: cell.realY, width: (cell.realX - x) + cell.width, height: (y - cell.realY) + height, row: cell.row, cell: cellIndex, offset: [...this.offset] }
                    } else if (cell.realX <= x && cell.realY <= y) {
                        this.selectArea = { type: 2, x: cell.realX, y: cell.realY, width: (x - cell.realX) + width, height: (y - cell.realY) + height, row: cell.row, cell: cell.cell, offset: [...this.offset] }
                    } else if (cell.realX <= x && cell.realY >= y) {
                        this.selectArea = { type: 3, x: cell.realX, y, width: (x - cell.realX) + width, height: (cell.realY - y) + cell.height, row, cell: cell.cell, offset: [...this.offset] }
                    }
                    this.selectArea.rowCount = Math.abs(cell.row - row) + 1
                    this.selectArea.cellCount = Math.abs(cell.cell - cellIndex) + 1
                    requestAnimationFrame(this.painted)
                }
            }
        },
        handleMousemove(e) {
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
            } else if (this.imageObjs.length > 0 && e.region) {
                this.imageObjs.forEach((item) => { item.hover = false })
                const image = this.imageObjs.find(item => `${item.id}` === e.region)
                if (image) {
                    image.hover = true
                }
                this.setCursor('move')
            } else if (e.target.classList.contains('canvas-spreadtable') || e.target.classList.contains('canvas-plugin')) {
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
                                this.hoverRowDivide = { y: row.realY + row.height, row, minY: row.realY + config.height.row }
                            }
                        } else if (this.hoverRowDivide) {
                            this.hoverRowDivide = null
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
                        } else if (this.hoverColumnDivide) {
                            this.hoverColumnDivide = null
                        }
                    } else {
                        this.hoverColumnDivide = null
                    }
                } else if (utils.isInRegion([eX, eY], [0, 0], [config.width.serial - 2, config.height.columns - 2])) {
                    this.setCursor('se-resize')
                }
            }
        },
        handleMouseup(e) {
            const eX = e.clientX - this.canvasX
            const eY = e.clientY - this.canvasY
            this.isDown = false
            this.isFocusCopyDown = false
            this.isImgMoveDown = false
            this.horizontalBar.move = false
            this.verticalBar.move = false
            if (this.isHoverRowDivideDown) {
                const differenceValue = this.hoverRowDivide.y - (this.hoverRowDivide.row.realY + this.hoverRowDivide.row.height)
                this.allRows[this.hoverRowDivide.row.row].height += differenceValue

                for (let i = this.hoverRowDivide.row.row + 1; i < this.allRows.length; i += 1) {
                    this.allRows[i].y += differenceValue
                }
                if (this.selectArea) {
                    // TODO selectArea高度重置，3种情况
                    this.selectArea = null
                }
                this.bodyHeight += differenceValue
                this.isHoverRowDivideDown = false
                this.hoverRowDivide = null
                requestAnimationFrame(this.painted)

                if (eX > 0 && eX < config.width.serial) {
                    const row = this.isInRowDivide(eY)
                    if (row) {
                        this.hoverRowDivide = { y: row.realY + row.height, row, minY: row.realY + config.height.row }
                    }
                }
            } else if (this.isHoverColumnDivideDown) {
                const differenceValue = this.hoverColumnDivide.x - (this.hoverColumnDivide.column.realX + this.hoverColumnDivide.column.width)
                this.allColumns[this.hoverColumnDivide.column.cell].width += differenceValue

                for (let i = this.hoverColumnDivide.column.cell + 1; i < this.allColumns.length; i += 1) {
                    this.allColumns[i].x += differenceValue
                }
                if (this.selectArea) {
                    this.selectArea = null
                    // TODO selectArea宽度重置，3种情况
                }
                this.bodyWidth += differenceValue
                this.isHoverColumnDivideDown = false
                this.hoverColumnDivide = null
                requestAnimationFrame(this.painted)
                if (eY > 0 && eY < config.height.columns) {
                    const column = this.isInColumnDivide(eX)
                    if (column) {
                        this.hoverColumnDivide = { x: column.realX + column.width, column, minX: column.realX }
                    }
                }
            } else if (this.focusCopy) {
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
            requestAnimationFrame(this.painted)
        },
        handleContextMenu(e) {
            e.preventDefault()
            const menuObj = document.getElementsByClassName('right-menu')
            const canvas = document.getElementsByClassName('spreadtable-main')
            const objX = document.documentElement.clientWidth
            const objY = document.documentElement.clientHeight
            console.log(e.offsetX, e.offsetY, menuObj, objX, objY, canvas)
            this.showMenu = true
            this.topClick = false
            this.leftClick = false
            this.menuPosition = {
                left: `${e.clientX}px`,
                top: `${e.clientY}px`,
            }
            if (e.offsetX + menuObj[0].offsetWidth > this.canvasWidth) {
                this.menuPosition.left = `${this.canvasWidth - menuObj[0].offsetWidth}px`
            }
            if (e.offsetY + menuObj[0].offsetHeight > this.canvasHeight) {
                this.menuPosition.top = `${this.canvasHeight - menuObj[0].offsetHeight}px`
            }

            if (e.offsetX < config.width.serial && e.offsetY > config.height.columns) {
                this.leftClick = true
            } else if (e.offsetX > config.width.serial && e.offsetY < config.height.columns) {
                this.topClick = true
            } else if (e.offsetX < config.width.serial && e.offsetY < config.height.columns) {
                this.cornerClick = true
            }
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
