<template>
<q-layout view="hHh lpR fFf" class="bg-light text-dark">
    <q-header bordered class="shadow-1 bg-light text-dark">
        <q-toolbar>
            <q-item-section avatar>
                <q-btn flat dense round :icon="iconName" aria-label="Menu" style="font-size: 13px;" @click="exitPage" />
            </q-item-section>
            <q-item-section>
                <q-item-label :class="titleClass" style="font-size: 16px">{{title}}</q-item-label>
            </q-item-section>
        </q-toolbar>
    </q-header>
    <q-page-container>
        <div style="padding:15px !important">
            <slot></slot>
        </div>
    </q-page-container>
</q-layout>
</template>

<script>
import {
    mapGetters
} from "vuex";

export default {
    props: {
        title: String,
        specificExitPath: {type: String, default: ''},
        centerTitle: {Type:Boolean, default:false},
        iconName: {type:String, default: 'close'},
    },
    computed: {
        ...mapGetters(["lastMainPageLink"]),
        titleClass() {
            if(this.centerTitle) {
                return 'absolute-center'
            }
            return ''
        }
    },
    methods: {
        exitPage() {
            //const path = this.specificExitPath ? this.specificExitPath : this.lastMainPageLink
            //this.$router.push(path)
            this.$router.go(-1)
        },
    }
};
</script>

<style></style>
