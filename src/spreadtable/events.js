import config from './config'
import utils from './utils'

export default {
    data() {
        return {
            isDown: false,
            isHoverRowDivideDown: false,
            isHoverColumnDivideDown: false,
            isHoverGrid: false,
            isHoverRow: false,
            isHoverColumn: false,
            isHoverFocusCopy: false,
            isFocusCopyDown: false,

            hoverRowDivide: null,
            hoverColumnDivide: null,
            focusCopy: null,
        }
    },
    created() {
        this.isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    },
    methods: {
        initEvents() {
            this.$refs.canvas.addEventListener(this.isFirefox ? 'DOMMouseScroll' : 'mousewheel', this.handleWheel)
            this.$refs.canvas.addEventListener('contextmenu', this.handleContextMenu, false)
            window.addEventListener('mousedown', this.handleMousedown, false)
            window.addEventListener('mousemove', this.handleMousemove, true)
            window.addEventListener('mouseup', this.handleMouseup, false)
            window.addEventListener('resize', this.handleResize, false)
        },
        removeEvents() {
            window.removeEventListener('mousedown', this.handleMousedown, false)
            window.removeEventListener('mousemove', this.handleMousemove, true)
            window.removeEventListener('mouseup', this.handleMouseup, false)
            window.removeEventListener('resize', this.handleResize, false)
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
            if (e.target.classList.contains('canvas-spreadtable')) {
                const eX = e.offsetX
                const eY = e.offsetY
                if (this.hoverRowDivide) {
                    this.isHoverRowDivideDown = true
                    this.painted()
                } else if (this.hoverColumnDivide) {
                    this.isHoverColumnDivideDown = true
                    this.painted()
                } else if (utils.isInRegion([eX, eY], [config.width.serial, config.height.columns], [this.canvasWidth, this.canvasHeight])) {
                    if (this.isHoverFocusCopy) {
                        this.isFocusCopyDown = true
                    } else {
                        this.isDown = true
                        const cell = this.getCellAt(eX, eY)
                        if (cell) {
                            this.focusCell = [cell.row, cell.cell]
                            this.selectArea = null
                            this.painted()
                            this.$emit('focus', cell.rowData)
                        }
                    }
                } else if (utils.isInRegion([eX, eY], [0, 0], [config.width.serial - 2, config.height.columns - 2])) {
                    this.focusCell = [0, 0]
                    this.offset = [0, 0]
                    this.selectArea = { type: 0, x: config.width.serial, y: config.height.columns, width: Infinity, height: Infinity, cell: 0, row: 0, offset: [...this.offset] }
                    this.selectArea.rowCount = Infinity
                    this.selectArea.cellCount = Infinity
                    this.painted()
                    this.$emit('focus', this.allRows[0].rowData)
                } else if (utils.isInRegion([eX, eY], [0, config.height.columns], [config.width.serial, this.canvasHeight])) {
                    const row = this.getRowAt(eY)
                    if (row) {
                        this.focusCell = [row.row, 0]
                        this.offset[0] = 0
                        this.selectArea = { type: 0, x: config.width.serial, y: row.realY, width: Infinity, height: row.height, cell: 0, row: row.row, offset: [...this.offset] }
                        this.selectArea.rowCount = 1
                        this.selectArea.cellCount = Infinity
                        this.painted()
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
                        this.painted()
                        this.$emit('focus', this.allRows[0].rowData)
                    }
                }
            }
        },
        handleMousemove(e) {
            const eX = e.offsetX
            const eY = e.offsetY
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
                console.log(e)
                const { realX: x, realY: y, width, height, row, cell: cellIndex } = this.getDisplayCell(this.focusCell)
                if (eX >= x && eX <= x + width && eY >= y && eY <= y + height) {
                    this.selectArea = null
                    this.painted()
                } else {
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
                        this.painted()
                    }
                }
            } else if (this.isHoverRowDivideDown) {
                if (eY > this.hoverRowDivide.minY) {
                    this.hoverRowDivide.y = eY
                } else {
                    this.hoverRowDivide.y = this.hoverRowDivide.minY
                }
                this.painted()
            } else if (this.isHoverColumnDivideDown) {
                if (eX > this.hoverColumnDivide.minX) {
                    this.hoverColumnDivide.x = eX
                } else {
                    this.hoverColumnDivide.x = this.hoverColumnDivide.minX
                }
                this.painted()
            } else if (this.isFocusCopyDown) {
                const focusCell = this.getDisplayCell(this.focusCell)
                const startPoint = [focusCell.x + focusCell.width, focusCell.y + focusCell.height]
                if ((eX >= focusCell.x && eX <= focusCell.x + focusCell.width) || this.isInVerticalQuadrant(focusCell, eX, eY)) {
                    if (eY - startPoint[1] > 0) {
                        const { height, rows } = this.getCellsHeight(focusCell, eY)
                        this.focusCopy = { x: focusCell.x, y: focusCell.y, width: focusCell.width, height, rows }
                    } else if (eY - focusCell.y < 0) {
                        const { height, rows } = this.getCellsHeight(focusCell, eY)
                        this.focusCopy = { x: focusCell.x, y: (focusCell.y + focusCell.height) - height, width: focusCell.width, height, rows }
                    } else {
                        this.focusCopy = null
                    }
                } else if ((eY >= focusCell.y && eY < focusCell.y + focusCell.height) || !this.isInVerticalQuadrant(focusCell, eX, eY)) {
                    if (eX - startPoint[0] > 0) {
                        const { width, columns } = this.getCellsWidth(focusCell, eX)
                        this.focusCopy = { x: focusCell.x, y: focusCell.y, width, columns, height: focusCell.height }
                    } else if (eX - focusCell.x < 0) {
                        const { width, columns } = this.getCellsWidth(focusCell, eX)
                        this.focusCopy = { x: (focusCell.x + focusCell.width) - width, y: focusCell.y, width, columns, height: focusCell.height }
                    } else {
                        this.focusCopy = null
                    }
                }
                this.painted()
            } else if (e.target.classList.contains('canvas-spreadtable')) {
                if (utils.isInRegion([eX, eY], [config.width.serial, config.height.columns], [this.canvasWidth, this.canvasHeight])) {
                    this.isHoverGrid = true
                    this.setCursor('cell')
                    if (this.focusCell) {
                        const focusCell = this.getDisplayCell(this.focusCell)
                        if (focusCell) {
                            const focusPointX = focusCell.x + focusCell.width
                            const focusPointY = focusCell.y + focusCell.height
                            if (utils.isInRegion([eX, eY], [focusPointX - 3, focusPointY - 3], [focusPointX + 4, focusPointY + 4])) {
                                this.isHoverFocusCopy = true
                                this.setCursor('crosshair')
                            }
                        }
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
                                this.hoverColumnDivide = { x: column.realX + column.width, column, minX: column.realX + 2 }
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
            } else {

            }
        },
        handleMouseup(e) {
            const eX = e.offsetX
            const eY = e.offsetY
            this.isDown = false
            this.isFocusCopyDown = false
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
                this.painted()

                if (eX > 0 && eX < config.width.serial) {
                    const row = this.isInRowDivide(eY)
                    if (row) {
                        this.hoverRowDivide = { y: row.realY + row.height, row, minY: row.realY + config.height.row }
                    }
                }
            }
            if (this.isHoverColumnDivideDown) {
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
                this.painted()
                if (eY > 0 && eY < config.height.columns) {
                    const column = this.isInColumnDivide(eX)
                    if (column) {
                        this.hoverColumnDivide = { x: column.realX + column.width, column, minX: column.realX + 2 }
                    }
                }
            }
        },
        handleResize() {
            this.init()
        },
        handleContextMenu(e) {
            e.preventDefault()
            console.log(e)
            return false
        },
    },
}
