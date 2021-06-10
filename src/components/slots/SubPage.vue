<template>
<div>
    <!-- Add fade animation for loading -->
    <div v-if="loading">
        <div class="absolute-center" style="background-color:white; opacity: 0.3; width:100vw; height:100vh; z-index: 10000" />
        <div class="absolute-center" style="height: 6em; width: 6em; background-color: white; opacity:0.3; border-radius: 50%; z-index:10001" />
        <q-spinner-gears class="absolute-center" color="primary" size="4em" style="z-index:10002" />
    </div>
    <q-layout view="hHh lpR fFf">
        <div>
            <q-header class="header">
                <div class="row q-pt-xs q-pl-xs">
                    <q-btn flat round icon="close" size="20px" padding="none" @click="$router.push(backRoute)" />
                </div>
                <div class="row q-pb-md" style="margin-left:11px">
                    <span v-if="title" class="header-font">{{ title }}</span>
                    <span v-else>
                        <slot name="header"></slot>
                    </span>
                </div>
                <!-- Body -->
            </q-header>
            <q-page-container class="text-semidark page">
                <slot> </slot>
            </q-page-container>
        </div>
    </q-layout>
</div>
</template>

<script>
export default {
    components: {
        // Header,
    },
    props: {
        loading: Boolean,
        backRoute: {
            type: String,
            default: '/',
        },
        title: String,
    },
    data() {
        return {};
    },
    computed: {
        routeName() {
            return this.$router.currentRoute.name;
        },
    },
    methods: {},
    watch: {},
    mounted() {},
};
</script>

<style scoped>
.header {
    background-color: var(--q-color-primary);
    width: 100%;
}

.page {
    padding-top: 10vh;
}
</style>
