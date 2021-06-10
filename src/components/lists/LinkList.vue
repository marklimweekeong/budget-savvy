<template>
<q-list padding class="text-semidark">
    <ListItem v-for="(link, index) in links" :key="index" :link="link" />
</q-list>
</template>

<script>
import ListItem from './LinkListItem.vue'
export default {
    components: {
        ListItem
    },
    props: {
        links: Array
    }
}
</script>

<style>

</style>
