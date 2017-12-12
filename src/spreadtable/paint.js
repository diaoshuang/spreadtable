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
            this.canvas.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
        },
        doDraw({ displayRows, displayColumns }) {
            const ctx = this.canvas

            this.paintOuter(ctx, displayRows, displayColumns)

            this.paintHeader(ctx, displayColumns)
        },
        paintOuter(ctx, displayRows, displayColumns) {
            const { canvasWidth, canvasHeight } = this
            // column  纵线
            ctx.beginPath()
            ctx.strokeStyle = '#cecece'
            for (const { x } of displayColumns) {
                ctx.moveTo(utils.pxFix(x), config.height.columns)
                ctx.lineTo(utils.pxFix(x), canvasHeight)
            }
            // row 横线
            for (const { y } of displayRows) {
                ctx.moveTo(config.width.serial, utils.pxFix(y))
                ctx.lineTo(canvasWidth, utils.pxFix(y))
            }
            ctx.stroke()

            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(...this.points.columns)
            ctx.fillRect(...this.points.serial)

            ctx.beginPath()
            ctx.fillStyle = '#333333'
            for (const { x, title, width } of displayColumns) {
                ctx.moveTo(utils.pxFix(x), 0)
                ctx.lineTo(utils.pxFix(x), config.height.columns)
                this.paintText(ctx, x + utils.half(width), 15, [title])
            }
            // row 横线
            for (const { y, height, row } of displayRows) {
                ctx.moveTo(0, utils.pxFix(y))
                ctx.lineTo(config.width.serial, utils.pxFix(y))
                this.paintText(ctx, utils.half(config.width.serial), y + 14, [row + 1])
            }
            ctx.stroke()

            ctx.beginPath()
            ctx.strokeStyle = '#bdbbbc'
            ctx.moveTo(0, utils.pxFix(config.height.columns))
            ctx.lineTo(canvasWidth, utils.pxFix(config.height.columns))
            ctx.moveTo(utils.pxFix(config.width.serial), 0)
            ctx.lineTo(utils.pxFix(config.width.serial), canvasHeight)
            ctx.stroke()

            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(0, 0, config.width.serial, config.height.columns)
        },
        paintText(ctx, x, y, row) {
            for (let b = 0; b < row.length; b += 1) {
                ctx.fillText(row[b], x, y + (b * 15))
            }
        },
        paintHeader(ctx) {

        },
    },
}
