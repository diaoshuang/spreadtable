export default {
    half(value) {
        if (!isNaN(value)) {
            value = parseFloat(value)
            return value / 2
        }
        return value
    },
    pxFix(value) {
        return value + 0.5
    },
    getTextLine(ctx, text, width) {
        if (!text && text !== 0) {
            return null
        }
        const chr = `${text}`.split('')
        let temp = ''
        const row = []
        for (let a = 0; a < chr.length; a += 1) {
            if (ctx.measureText(temp).width >= width - 8) {
                row.push(temp)
                temp = ''
            }
            temp += chr[a]
        }
        row.push(temp)
        return row
    },
    isInRegion(point, startPoint, endPoint) {
        return point[0] > startPoint[0] && point[0] < endPoint[0] && point[1] > startPoint[1] && point[1] < endPoint[1]
    },
}
