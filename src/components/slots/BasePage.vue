<template>
<q-page :class="pageMarginClass">
    <slot></slot>
</q-page>
</template>

<script>
import {
    mapGetters
} from 'vuex'
export default {
    computed: {
        ...mapGetters(['deviceIsPhone']),
        pageMarginClass() {
            return this.deviceIsPhone ? 'q-pa' : 'q-pa-lg'
        }
    }
}
</script>

<style>

</style>
