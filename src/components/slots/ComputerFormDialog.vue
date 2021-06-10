<template>
<q-card style="width: 350px; height: 600px">
    <q-toolbar>
        <q-item-section avatar>
            <q-btn flat dense round :icon="leftIconName" aria-label="Menu" style="font-size: 13px;" @click="closeDialog" />
        </q-item-section>
        <q-item-section>
            <q-item-label class="absolute-center" style="font-size: 16px">{{title}}</q-item-label>
        </q-item-section>
        <q-item-section v-if="hasRightIcon" avatar>
            <q-btn flat dense round :icon="rightIconName" aria-label="Menu" style="font-size: 13px;" @click="submitForm" />
        </q-item-section>
    </q-toolbar>
    <q-separator />
    <q-card-section>
    <slot></slot>
    </q-card-section>
</q-card>
</template>

<script>
export default {
    emits: ['close-dialog'],
    props: {
        title: String,
        leftIconName: {type: String, default: 'close'},
        hasRightIcon: {type: Boolean, default: false},
        rightIconName: {type: String, default: 'done'},
    },
    methods: {
        closeDialog() {
            this.$emit('close-dialog')
        },
        submitForm() {
            this.$emit('submit-form')
        }
    },
}
</script>

<style>

</style>
