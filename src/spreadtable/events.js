import config from './config'

export default {
    data() {
        return {
            isDown: false,
        }
    },
    created() {
        this.isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    },
    methods: {
        initEvents() {
            this.$refs.canvas.addEventListener(this.isFirefox ? 'DOMMouseScroll' : 'mousewheel', this.handleWheel)
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
                    } else if (((this.bodyWidth + config.width.serial) - maxWidth) + this.offset[0] < deltaX) {
                        if (maxWidth - this.bodyWidth < 0) {
                            this.offset[0] = maxWidth - (this.bodyWidth + config.width.serial)
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
                    } else if (((this.bodyHeight + config.height.columns) - maxHeight) + lastScrollY < deltaY) {
                        if (maxHeight - this.bodyHeight < 0) {
                            this.offset[1] = maxHeight - (this.bodyHeight + config.height.columns)
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
            if (e.target.classList.contains('canvas-spreadtable')) {
                this.isDown = true
                const eX = e.offsetX
                const eY = e.offsetY
                if (eX > config.width.serial && eX < this.canvasWidth && eY > config.height.columns && eY < this.canvasHeight) {
                    const cell = this.getCellAt(eX, eY)
                    if (cell) {
                        this.focusCell = [cell.row, cell.cell]
                        this.selectArea = null
                        this.painted()
                        this.$emit('focus', cell.rowData)
                    }
                }
            }
        },
        handleMousemove(e) {
            if (this.isDown && e.target.classList.contains('canvas-spreadtable')) {
                const eX = e.offsetX
                const eY = e.offsetY
                const { x, y, width, height, row, cell } = this.getDisplayCell(this.focusCell)
                if (eX >= x && eX <= x + width && eY >= y && eY <= y + height) {
                    this.selectArea = null
                } else {
                    const cell = this.getCellAt(eX, eY)
                    if (cell) {
                        if (cell.x >= x && cell.y >= y) {
                            this.selectArea = { x, y, width: (cell.x - x) + cell.width, height: (cell.y - y) + cell.height, cell, row, offset: { ...this.offset } }
                        } else if (cell.x >= x && cell.y <= y) {
                            this.selectArea = { x, y: cell.y, width: (cell.x - x) + cell.width, height: (y - cell.y) + height, row: cell.row, cell, offset: { ...this.offset } }
                        } else if (cell.x <= x && cell.y <= y) {
                            this.selectArea = { x: cell.x, y: cell.y, width: (x - cell.x) + width, height: (y - cell.y) + height, row: cell.row, cell: cell.cell, offset: { ...this.offset } }
                        } else if (cell.x <= x && cell.y >= y) {
                            this.selectArea = { x: cell.x, y, width: (x - cell.x) + width, height: (cell.y - y) + cell.height, row, cell: cell.cell, offset: { ...this.offset } }
                        }
                        this.selectArea.rowCount = Math.abs(cell.row - row) + 1
                        this.painted()
                    }
                }
            }
        },
        handleMouseup() {
            this.isDown = false
            this.horizontalBar.move = false
            this.verticalBar.move = false
        },
        handleResize() {
            this.init()
        },
    },
}
