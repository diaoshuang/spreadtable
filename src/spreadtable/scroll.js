import config from './config'

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
            const horizontalRatio = canvasWidth / (bodyWidth + config.width.right + config.width.serial)
            if (horizontalRatio >= 1) {
                this.horizontalBar.size = 0
            } else {
                this.horizontalBar.size = canvasWidth * horizontalRatio
            }
            this.horizontalBar.k = horizontalRatio

            let verticalRatio = canvasHeight / (bodyHeight + config.height.bottom + config.height.columns)
            if (verticalRatio > 1) {
                this.verticalBar.size = 0
            } else {
                this.verticalBar.size = canvasHeight * verticalRatio
                if (this.verticalBar.size < 20) {
                    this.verticalBar.size = 20
                    verticalRatio = (canvasHeight - 20) / ((bodyHeight + config.height.bottom + config.height.columns) - canvasHeight)
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
