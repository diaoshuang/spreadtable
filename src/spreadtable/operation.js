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
                    // type 0:含有字符串；1:都是数字，但没有规律；2:都是数字，有规律；3:公式有规律,4:公式无规律,5:字符串有规律
                    for (const key in copyRule) {
                        if (key) {
                            let textCount = 0
                            let numberCount = 0
                            let expressionCount = 0
                            const texts = []
                            const numbers = []
                            const expressions = []
                            for (const cell of copyRule[key].items) {
                                if (cell.cellCoord) {
                                    expressionCount += 1
                                    expressions.push(cell.cellCoord)
                                } else if (cell.type === 'text') {
                                    const temp = parseInt(cell.text.match(/[0-9]+/ig), 10)
                                    if (!isNaN(temp)) {
                                        texts.push(temp)
                                    }
                                    textCount += 1
                                } else if (cell.type === 'number') {
                                    numberCount += 1
                                    numbers.push(cell.text)
                                }
                            }
                            if (textCount > 0 || numberCount === 1) {
                                if (texts.length > 0 && textCount === texts.length) {
                                    const step = texts[texts.length - 1] - texts[texts.length - 2]
                                    for (let i = texts.length - 2; i > 0; i -= 1) {
                                        if (texts[i] - texts[i - 1] !== step) {
                                            copyRule[key].type = 0
                                        }
                                    }
                                    if (copyRule[key].type !== 0) {
                                        copyRule[key].type = 5
                                        copyRule[key].step = step
                                    }
                                } else {
                                    copyRule[key].type = 0
                                }
                            } else if (numberCount > 0 && numberCount === copyRule[key].items.length) {
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
                            } else if (expressionCount > 0) {
                                // for (const coord of expressions) {
                                //     if (coord instanceof Array) {
                                //         for (const range of coord) {
                                //             if (!range.row.isAbsolute) {
                                //                 text = text.replace(range.label, range.column.label + (range.row.index + index + 1))
                                //             }
                                //         }
                                //     } else if (!coord.row.isAbsolute) {
                                //         text = text.replace(coord.label, coord.column.label + (coord.row.index + index + 1))
                                //     }
                                // }
                                copyRule[key].type = 3
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
                                value = rule.items[i % rule.items.length].text
                            } else if (rule.type === 2) {
                                value = stepNum[index] + rule.step
                                stepNum[index] = value
                            } else if (rule.type === 3) {
                                value = rule.items[i % rule.items.length].text
                            } else if (rule.type === 5) {
                                const temp = parseInt(stepNum[index].match(/[0-9]+/ig), 10)
                                value = rule.items[i % rule.items.length].text.replace(/[0-9]+/ig, temp + rule.step)
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
                    let index = 0
                    for (const cell of beforeCells) {
                        const temp = []
                        for (const item of cell) {
                            temp.push(item)
                        }
                        if (!copyRule[index]) {
                            copyRule[index] = {}
                        }
                        copyRule[index].items = temp
                        index += 1
                    }
                    // type 0:含有字符串；1:都是数字，但没有规律；2:都是数字，有规律；3:公式
                    for (const key in copyRule) {
                        if (key) {
                            let textCount = 0
                            let numberCount = 0
                            let expressionCount = 0
                            const texts = []
                            const numbers = []
                            const expressions = []
                            for (const cell of copyRule[key].items) {
                                if (cell.cellCoord) {
                                    expressionCount += 1
                                    expressions.push(cell.cellCoord)
                                } else if (cell.type === 'text') {
                                    const temp = parseInt(cell.text.match(/[0-9]+/ig), 10)
                                    if (!isNaN(temp)) {
                                        texts.push(temp)
                                    }
                                    textCount += 1
                                } else if (cell.type === 'number') {
                                    numberCount += 1
                                    numbers.push(cell.text)
                                }
                            }
                            if (textCount > 0 || numberCount === 1) {
                                if (texts.length > 0 && textCount === texts.length) {
                                    const step = texts[texts.length - 1] - texts[texts.length - 2]
                                    for (let i = texts.length - 2; i > 0; i -= 1) {
                                        if (texts[i] - texts[i - 1] !== step) {
                                            copyRule[key].type = 0
                                        }
                                    }
                                    if (copyRule[key].type !== 0) {
                                        copyRule[key].type = 5
                                        copyRule[key].step = step
                                    }
                                } else {
                                    copyRule[key].type = 0
                                }
                            } else if (numberCount > 0 && numberCount === copyRule[key].items.length) {
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
                            } else if (expressionCount > 0) {
                                copyRule[key].type = 3
                            }
                        }
                    }
                    const stepNum = []
                    for (let i = 0; i < beforeCells.length; i += 1) {
                        stepNum.push(beforeCells[i][beforeCells[i].length - 1].text)
                    }
                    for (let i = 0; i < cells.length; i += 1) {
                        const temp = []
                        const rule = copyRule[i]
                        for (let j = beforeCells[i].length; j < cells[i].length; j += 1) {
                            const item = cells[i][j]
                            let value = ''
                            if (rule.type === 0 || rule.type === 1) {
                                value = rule.items[j % rule.items.length].text
                            } else if (rule.type === 2) {
                                value = stepNum[i] + rule.step
                                stepNum[i] = value
                            } else if (rule.type === 5) {
                                const temp = parseInt(stepNum[index].match(/[0-9]+/ig), 10)
                                value = rule.items[i % rule.items.length].text.replace(/[0-9]+/ig, temp + rule.step)
                                stepNum[index] = value
                            } else if (rule.type === 3) {
                                value = rule.items[i % rule.items.length].text
                            }
                            temp.push({
                                anchor: [item.row, item.cell],
                                value,
                            })
                        }
                        copyData.push(temp)
                    }
                }
                this.$emit('updateItems', copyData)
            }
        },
    },
}
