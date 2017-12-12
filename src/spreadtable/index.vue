<template>
    <div ref="spreadtable" class="spreadtable" :style="containerStyle">
        <div class="toolbar">12312312</div>
        <canvas v-if="hasSize" ref="canvas" :width="canvasWidth" :height="canvasHeight" :style="`width:${canvasWidth}px;height:${canvasHeight}px;`"></canvas>
    </div>
</template>

<script>
import config from './config'
import display from './display'
import init from './init'
import paint from './paint'
import events from './events'

export default {
    props: ['dataSource', 'dataColumns', 'options'],
    mixins: [init, display, paint, events],
    data() {
        return {
            data: [],
            allColumns: [],
            allRows: [],
            allCells: [],
            points: {
                columns: null,
                serial: null,
            },
            ratio: 1,
            canvasWidth: 0,
            canvasHeight: 0,
            bodyWidth: 0,
            offset: [0, 0],
            words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            canvas: null,
            isEditing: false,
        }
    },
    computed: {
        containerStyle() {
            if (this.options.fullscreen) {
                return {
                    top: 0,
                    bottom: 0,
                    width: '100%',
                    position: 'fixed',
                }
            }
            return {
                width: this.options.width ? this.options.width : config.default.width,
                height: this.options.height ? this.options.height : config.default.height,
            }
        },
        hasSize() {
            return this.canvasWidth > 0 && this.canvasHeight > 0
        },
    },
    created() {
        this.init(this.dataSource)
    },
    mounted() {
        this.initSize()
        if (this.hasSize) {
            this.$nextTick(function () { //eslint-disable-line
                this.initCanvas()
                this.painted()
                this.initEvents()
            })
        }
    },
    methods: {
        init() {
            this.data = this.initData(this.dataSource)
        },
    },
}
</script>

<style lang="scss">
.spreadtable {
  display: inline-block;
  overflow: hidden;
  margin: 0;
  padding: 0;
  canvas{
      border: 1px solid #bdbbbc;
  }
}
</style>
