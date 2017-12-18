import config from './config'
import utils from './utils'

export default {
    methods: {
        initData(dataSource) {
            const data = []
            const allRows = []
            const allCells = []
            const allColumns = []
            this.bodyWidth = 0
            this.bodyHeight = 0
            if (dataSource && dataSource.length > 0) {
                console.log(dataSource)
            } else {
                let startY = config.height.columns
                for (let i = 0; i < 200; i += 1) {
                    const temp = []
                    const cellTemp = []
                    let startX = config.width.serial
                    for (let j = 0; j < this.words.length; j += 1) {
                        temp.push('')
                        cellTemp.push({
                            cell: j,
                            row: i,
                            text: '',
                            font: '',
                            paintText: '',
                            type: 'text',
                            style: '',
                            x: startX,
                            y: startY,
                            width: 80,
                            height: config.height.row,
                        })
                        if (i === 0) {
                            this.bodyWidth += 80
                            allColumns.push({
                                width: 80,
                                title: this.words[j],
                                cell: j,
                                hidden: false,
                                height: 30,
                                x: startX,
                            })
                        }
                        startX += 80
                    }
                    allRows.push({
                        row: i,
                        height: config.height.row,
                        style: '',
                        rowData: temp,
                        y: startY,
                    })
                    startY += config.height.row
                    this.bodyHeight += config.height.row
                    allCells.push(cellTemp)
                    data.push(temp)
                }
            }
            this.allColumns = allColumns
            this.allRows = allRows
            this.allCells = allCells
            return data
        },
        initSize() {
            const ratio = this.ratio
            const containerWidth = this.$refs.spreadtable.offsetWidth
            const containerHeight = this.$refs.spreadtable.offsetHeight
            this.canvasWidth = containerWidth - config.width.scroll
            this.canvasHeight = containerHeight - config.getHeaderHeight() - config.width.scroll
            this.points.columns = [
                0,
                0,
                this.canvasWidth * ratio,
                config.height.columns * ratio,
            ]
            this.points.serial = [
                0,
                0,
                config.width.serial * ratio,
                this.canvasHeight * ratio,
            ]
        },
        initCanvas() {
            const canvas = this.$refs.canvas
            let ctx = ''
            if (this.canvas) {
                ctx = this.canvas
            } else {
                ctx = canvas.getContext('2d')
                this.canvas = ctx
            }
            const backingStore = ctx.backingStorePixelRatio ||
                ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1

            this.ratio = (window.devicePixelRatio || 1) / backingStore
            ctx.lineWidth = 1
            ctx.font = `normal ${12 * this.ratio}px PingFang SC`
            ctx.textBaseline = 'middle'
            ctx.save()
        },
    },
}
