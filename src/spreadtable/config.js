export default {
    default: {
        width: 800,
        height: 600,
    },
    point: {
        center: [0, 0],
    },
    width: {
        serial: 35,
        scroll: 20,
        right: 40,
    },
    height: {
        row: 25,
        nav: 60,
        toolbar: 35,
        fx: 35,
        columns: 30,
        bottom: 40,
    },
    getHeaderHeight() {
        const { nav, fx, toolbar } = this.height
        return nav + fx + toolbar
    },
}
