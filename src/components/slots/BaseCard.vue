<template>
<q-card v-if="!deviceIsPhone" flat bordered class="my-card">
    <div style="padding:6px 15px 0px 15px">
    <slot name="header">
        <div class="card-title" style="font-size: 18px">
            {{ title }}
        </div>
    </slot>
    <slot> </slot>
    </div>
</q-card>
<span v-else>
    <slot name="header">
    </slot>
    <slot> </slot>
</span>
</template>

<script>
import {
    mapGetters
} from "vuex";
export default {
    props: {
        title: {
            type: String,
            default: ""
        }
    },
    computed: {
        ...mapGetters(["deviceIsPhone"])
    }
};
</script>

<style></style>
