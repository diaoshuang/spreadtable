export default {
    methods: {
        copyDeepOption(cells, beforeCells, copyType) {
            if (copyType === 0) {
                const copyData = []
                if (cells.length < beforeCells.length) {
                    for (let i = cells.length; i < beforeCells.length; i += 1) {
                        const temp = []
                        for (const item of beforeCells[i]) {
                            temp.push({
                                anchor: [item.row, item.cell],
                                value: '',
                            })
                        }
                        copyData.push(temp)
                    }
                } else {
                    const copyRule = {}
                    for (const cell of beforeCells) {
                        let index = 0
                        for (const item of cell) {
                            if (!copyRule[index]) {
                                copyRule[index] = {
                                    items: [],
                                }
                            }
                            copyRule[index].items.push(item)
                            index += 1
                        }
                    }
                    // type 0:含有字符串；1:都是数字，但没有规律；2:都是数字，有规律；3:公式
                    for (const key in copyRule) {
                        if (key) {
                            let textCount = 0
                            let numberCount = 0
                            const numbers = []
                            for (const cell of copyRule[key].items) {
                                if (cell.type === 'text') {
                                    textCount += 1
                                } else if (cell.type === 'number') {
                                    numberCount += 1
                                    numbers.push(cell.text)
                                }
                            }
                            if (textCount > 0 || numberCount === 1) {
                                copyRule[key].type = 0
                            } else if (numberCount === copyRule[key].items.length) {
                                const step = numbers[numbers.length - 1] - numbers[numbers.length - 2]
                                for (let i = numbers.length - 2; i > 0; i -= 1) {
                                    if (numbers[i] - numbers[i - 1] !== step) {
                                        copyRule[key].type = 1
                                    }
                                }
                                if (copyRule[key].type !== 1) {
                                    copyRule[key].type = 2
                                    copyRule[key].step = step
                                }
                            }
                        }
                    }
                    const stepNum = []
                    for (let i = 0; i < beforeCells[0].length; i += 1) {
                        stepNum.push(beforeCells[beforeCells.length - 1][i].text)
                    }
                    for (let i = beforeCells.length; i < cells.length; i += 1) {
                        const temp = []
                        let index = 0
                        for (const item of cells[i]) {
                            const rule = copyRule[index]
                            let value = ''
                            if (rule.type === 0 || rule.type === 1) {
                                value = copyRule[index].items[i % copyRule[index].items.length].text
                            } else if (rule.type === 2) {
                                value = stepNum[index] + rule.step
                                stepNum[index] = value
                            }
                            temp.push({
                                anchor: [item.row, item.cell],
                                value,
                            })
                            index += 1
                        }
                        copyData.push(temp)
                    }
                }
                this.$emit('updateItems', copyData)
            } else {

            }
        },
    },
}
