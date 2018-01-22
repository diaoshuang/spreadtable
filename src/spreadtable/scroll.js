export default {
    data() {
        return {
            horizontalBar: {
                x: 0,
                size: 0,
                move: false,
                cursorX: 0,
                k: 1,
            },
            verticalBar: {
                y: 0,
                size: 0,
                move: false,
                cursorY: 0,
                k: 1,
            },
        }
    },
    created() {
        this.$on('scroll', () => {
            this.horizontalBar.x = -parseInt(this.offset[0] * this.horizontalBar.k, 10)
            this.verticalBar.y = -parseInt(this.offset[1] * this.verticalBar.k, 10)
        })
    },
    methods: {
        scroll(e, type) {
            if (type && this.verticalBar.size) {
                if (e.offsetY < this.verticalBar.y) {
                    let k = 15
                    if (this.verticalBar.y - e.offsetY < 15) {
                        k = this.verticalBar.y - e.offsetY
                    }
                    this.verticalBar.y -= k
                    this.offset[1] = -this.verticalBar.y / this.verticalBar.k
                    requestAnimationFrame(this.painted)
                } else if (e.offsetY > this.verticalBar.y + this.verticalBar.size) {
                    let k = 15
                    if (e.offsetY - this.verticalBar.y - this.verticalBar.size < 15) {
                        k = e.offsetY - this.verticalBar.y - this.verticalBar.size
                    }
                    this.verticalBar.y += k
                    this.offset[1] = -this.verticalBar.y / this.verticalBar.k
                    requestAnimationFrame(this.painted)
                }
            }
            if (type === 0 && this.horizontalBar.size) {
                if (e.offsetX < this.horizontalBar.x) {
                    let k = 15
                    if (this.horizontalBar.x - e.offsetX < 15) {
                        k = this.horizontalBar.x - e.offsetX
                    }
                    this.horizontalBar.x -= k
                    this.offset[0] = -this.horizontalBar.x / this.horizontalBar.k
                    requestAnimationFrame(this.painted)
                } else if (e.offsetX > this.horizontalBar.x + this.horizontalBar.size) {
                    let k = 15
                    if (e.offsetX - this.horizontalBar.x - this.horizontalBar.size < 15) {
                        k = e.offsetX - this.horizontalBar.x - this.horizontalBar.size
                    }
                    this.horizontalBar.x += k
                    this.horizontalBar.x += 15
                    this.offset[0] = -this.horizontalBar.x / this.horizontalBar.k
                    requestAnimationFrame(this.painted)
                }
            }
        },
        dragMove(e, type) {
            if (type) {
                this.verticalBar.move = true
                this.verticalBar.cursorY = e.screenY
            } else {
                this.horizontalBar.move = true
                this.horizontalBar.cursorX = e.screenX
            }
        },
        resetScrollBar(canvasWidth, canvasHeight, bodyWidth, bodyHeight) {
            const horizontalRatio = canvasWidth / bodyWidth
            if (horizontalRatio >= 1) {
                this.horizontalBar.size = 0
            } else {
                this.horizontalBar.size = canvasWidth - ((bodyWidth - canvasWidth) * horizontalRatio)
            }
            this.horizontalBar.k = horizontalRatio

            let verticalRatio = canvasHeight / bodyHeight
            if (verticalRatio > 1) {
                this.verticalBar.size = 0
            } else {
                this.verticalBar.size = canvasHeight - ((bodyHeight - canvasHeight) * verticalRatio)
                if (this.verticalBar.size < 30) {
                    this.verticalBar.size = 30
                    verticalRatio = (canvasHeight - 30) / (bodyHeight - canvasHeight)
                }
            }
            this.verticalBar.k = verticalRatio

            if (canvasWidth - this.horizontalBar.size < -this.offset[0] * this.horizontalBar.k) {
                this.offset[0] = canvasWidth - this.bodyWidth
            }
            if (this.verticalBar.k > 1) {
                this.offset[1] = 0
            } else if (canvasHeight - this.verticalBar.size < -this.offset[1] * this.verticalBar.k) {
                this.offset[1] = canvasHeight - this.bodyHeight
            }
            this.horizontalBar.x = -this.offset[0] * this.horizontalBar.k
            this.verticalBar.y = -this.offset[1] * this.verticalBar.k
        },
    },
}
