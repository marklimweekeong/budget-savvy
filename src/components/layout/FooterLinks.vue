<template>
<q-toolbar>
    <q-tabs dense indicator-color="white" class="text-dark" style="width: 100% !important">
        <q-route-tab v-for="(link, index) in links" :key="index" exact no-caps :to="link.link" :icon="link.icon" :label="link.title" class="footer-class" :style="linkStyle" active-class="text-primary" />
    </q-tabs>
</q-toolbar>
</template>

<script>
export default {
    props: {
        links: {type: Array, default: null},
    },
    computed: {
        linkStyle() {
            return `width:${100 / this.links.length}% !important;`;
        },
    },
};
</script>

<style scoped></style>
