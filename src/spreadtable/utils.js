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
}
