<template>
    <q-item :to="link.link" v-ripple clickable>
        <q-item-section avatar>
            <q-icon :name="link.icon" />
        </q-item-section>
        <q-item-section>
            <q-item-label style="font-size:16px;">{{ link.title }}</q-item-label>
        </q-item-section>
    </q-item>
</template>

<script>
export default {
    props: {
        link: Object,
    }
}
</script>

<style></style>
