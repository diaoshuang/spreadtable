const utils = {
    half(value) {
        let temp = value
        if (!isNaN(value)) {
            temp = parseFloat(value)
            return temp / 2
        }
        return temp
    },
    pxFix(value) {
        return value + 0.5
    },
    mapPoint(x, y, fix) {
        if (fix) {
            return [utils.pxFix(x) * this.ratio, utils.pxFix(y) * this.ratio]
        }
        return [x * this.ratio, y * this.ratio]
    },
    mapSize(width, height) {
        return [width * this.ratio, height * this.ratio]
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
        return point[0] > startPoint[0] && point[0] < endPoint[0]
            && point[1] > startPoint[1] && point[1] < endPoint[1]
    },
    keepLastIndex(obj) {
        if (window.getSelection) { // ie11 10 9 ff safari
            obj.focus() // 解决ff不获取焦点无法定位问题
            const range = window.getSelection()// 创建range
            range.selectAllChildren(obj)// range 选择obj下所有子内容
            range.collapseToEnd()// 光标移至最后
        } else if (document.selection) { // ie10 9 8 7 6 5
            const range = document.selection.createRange()// 创建选择对象
            // var range = document.body.createTextRange();
            range.moveToElementText(obj)// range定位到obj
            range.collapse(false)// 光标移至最后
            range.select()
        }
    },
    selectText(obj) {
        if (document.selection) {
            const range = document.body.createTextRange()
            range.moveToElementText(obj)
            range.select()
        } else if (window.getSelection) {
            const range = document.createRange()
            range.selectNodeContents(obj)
            window.getSelection().removeAllRanges()
            window.getSelection().addRange(range)
        }
    },
    lineEquation(pointA, pointB, x) {
        return (((pointB[1] - pointA[1]) / (pointB[0] - pointA[0])) * (x - pointA[0])) + pointA[1]
    },
    toScientificNumber(value) {
        if (!isNaN(value)) {
            const temp = `${value}`
            if (temp.indexOf('e') !== -1) {
                return `${parseFloat(temp.split('e')[0]).toFixed(5)}E${temp.split('e')[1]}`
            } else if (temp.indexOf('.') !== -1 && temp.length >= 12) {
                return parseFloat(temp.substr(0, 11))
            } else if (temp.length >= 12) {
                const e = 10 ** (temp.length - 1)
                return `${(value / e).toFixed(5)}E+${temp.length - 1}`
            }
        }
        return value
    },
}

export default utils
