export default {
    default: {
        width: 800,
        height: 600,
    },
    point: {
        center: [0, 0],
    },
    width: {
        serial: 30,
        scroll: 20,
        right: 40,
        cell: 75,
    },
    height: {
        row: 20,
        nav: 60,
        toolbar: 35,
        fx: 35,
        columns: 25,
        bottom: 40,
    },
    getHeaderHeight() {
        const { nav, fx, toolbar } = this.height
        return nav + fx + toolbar
    },
}
