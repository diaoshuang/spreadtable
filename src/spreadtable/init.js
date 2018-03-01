import Vue from 'vue'
import VueWorker from 'vue-worker'
import config from './config'

Vue.use(VueWorker)

export default {
    data() {
        return {
            loading: false,
        }
    },
    methods: {
        initData(dataSource) {
            this.loading = true
            return this.$worker.run((dataSource, config, words) => {
                const data = []
                const allRows = []
                const allCells = []
                const allColumns = []
                let bodyWidth = 0
                let bodyHeight = 0
                if (dataSource && dataSource.length > 0) {
                    console.log(dataSource)
                } else {
                    let startY = config.height.columns
                    for (let i = 0; i < 1000; i += 1) {
                        const temp = []
                        const cellTemp = []
                        let startX = config.width.serial
                        for (let j = 0; j < words.length; j += 1) {
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
                                width: config.width.cell,
                                height: config.height.row,
                            })
                            if (i === 0) {
                                bodyWidth += config.width.cell
                                allColumns.push({
                                    width: config.width.cell,
                                    title: words[j],
                                    cell: j,
                                    hidden: false,
                                    height: config.height.columns,
                                    x: startX,
                                })
                            }
                            startX += config.width.cell
                        }
                        allRows.push({
                            row: i,
                            height: config.height.row,
                            style: '',
                            rowData: temp,
                            y: startY,
                        })
                        startY += config.height.row
                        bodyHeight += config.height.row
                        allCells.push(cellTemp)
                        data.push(temp)
                    }
                }
                return {
                    data,
                    allRows,
                    allCells,
                    allColumns,
                    bodyWidth,
                    bodyHeight,
                }
            }, [dataSource, config, this.words])
                .then((result) => {
                    const { bodyWidth, bodyHeight, allRows, allColumns, allCells, data } = result
                    this.bodyWidth = bodyWidth
                    this.bodyHeight = bodyHeight
                    this.allRows = Object.freeze(allRows)
                    this.allColumns = Object.freeze(allColumns)
                    this.allCells = Object.freeze(allCells)
                    this.data = Object.freeze(data)
                    return result
                })
                .catch((e) => {
                    console.error(e) //eslint-disable-line
                })
        },
        initSize() {
            const ratio = this.ratio
            const containerWidth = this.$refs.spreadtable.offsetWidth
            const containerHeight = this.$refs.spreadtable.offsetHeight
            this.canvasWidth = containerWidth - config.width.scroll
            const { nav, fx, toolbar, sheet } = config.height
            const leftHeight = nav + fx + toolbar + sheet + 20
            this.canvasHeight = containerHeight - leftHeight - config.width.scroll
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
            this.resetScrollBar(this.canvasWidth, this.canvasHeight, this.bodyWidth, this.bodyHeight)
        },
        initCanvas() {
            const canvas = this.$refs.canvas
            const canvasPlugin = this.$refs['canvas-plugin']
            if (typeof canvas.getBoundingClientRect !== 'undefined') {
                const bounding = canvas.getBoundingClientRect()
                this.canvasX = bounding.left
                this.canvasY = bounding.top
            }
            let ctx = ''
            let pluginCtx = ''
            if (this.canvas) {
                ctx = this.canvas
            } else {
                ctx = canvas.getContext('2d')
                this.canvas = ctx
            }
            if (this.canvasPlugin) {
                pluginCtx = this.canvasPlugin
            } else {
                pluginCtx = canvasPlugin.getContext('2d')
                this.canvasPlugin = pluginCtx
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
