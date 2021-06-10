<template>
<q-toolbar>
    <q-toolbar-title>
        <q-avatar>
            <img src="https://cdn.quasar.dev/logo/svg/quasar-logo.svg" />
        </q-avatar>
        <span class="vertical-middle" style="padding-left:10px; font-weight:500;">{{title}}</span>
    </q-toolbar-title>
    <q-btn v-if="$store.getters.deviceIsPhone" flat class="text-semidark" round icon="account_circle" style="font-size:1.25rem" padding="none" @click="openMenu" />
</q-toolbar>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    props: {
        title: {type: String, default: "Budget Savvy"}
    },
    methods: {
        openMenu() {
            this.$router.push('/menu')
        }
    },
    computed: {
        ...mapGetters(['deviceIsPhone'])
    }
};
</script>

<style></style>
