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
                for (let i = 0; i < 200; i += 1) {
                    const temp = []
                    const cellTemp = []
                    for (let j = 0; j < this.words.length; j += 1) {
                        temp.push('')
                        cellTemp.push({
                            cell: j,
                            text: '',
                            font: '',
                            paintText: '',
                            type: 'text',
                            style: '',
                        })
                        if (i === 0) {
                            this.bodyWidth += 80
                            allColumns.push({
                                width: 80,
                                title: this.words[j],
                                cell: j,
                                hidden: false,
                                height: 30,
                            })
                        }
                    }
                    allRows.push({
                        row: i,
                        height: config.height.row,
                        style: '',
                        rowData: temp,
                    })
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
            const containerWidth = this.$refs.spreadtable.offsetWidth
            const containerHeight = this.$refs.spreadtable.offsetHeight
            this.canvasWidth = containerWidth - config.width.scroll
            this.canvasHeight = containerHeight - config.getHeaderHeight() - config.width.scroll
            this.points.columns = [
                0,
                0,
                this.canvasWidth,
                config.height.columns,
            ]
            this.points.serial = [
                0,
                0,
                config.width.serial,
                this.canvasHeight,
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
            ctx.textAlign = 'center'
            ctx.lineWidth = 1
            ctx.font = 'normal 12px PingFang SC'
            ctx.textBaseline = 'middle'
            ctx.save()
        },
    },
}
