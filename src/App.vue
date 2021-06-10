<template>
<div id="q-app">
    <router-view />
</div>
</template>

<script>
import {
    mapActions
} from "vuex";

export default {
    name: "App",
    methods: {
        ...mapActions(["deviceIsPhoneAction", "newDb"]),
    },
    created() {
        this.deviceIsPhoneAction(this.$q.platform.is.mobile);
        this.newDb();
    },
};
</script>

<style scoped>
div {
    overflow-x: hidden;
}
</style>
