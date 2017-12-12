<template>
    <div>
        <spreadtable :options="option"></spreadtable>
    </div>
</template>

<script>
import Spreadtable from '../spreadtable'

export default {
    components: {
        Spreadtable,
    },
    data() {
        return {
            option: {
                fullscreen: true,
            },
        }
    },
}
</script>
