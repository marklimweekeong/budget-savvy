<template>
    <span style="display: block; min-width: 260px">
        <LinkList :links="links" />
        <q-separator />
        <q-list padding class="text-semidark">
        </q-list>
    </span>
</template>

<script>
import LinkList from "../lists/LinkList.vue";
export default {
    components: {
        LinkList,
    },
    data() {
        return {
            links: [{
                    title: "Edit Categories",
                    icon: "category",
                    link: "/categories",
                },
                {
                    title: "Transfer Data",
                    icon: "cloud_upload",
                    link: "/accounts",
                },
                {
                    title: "Feedback",
                    icon: "feedback",
                    link: "/feedback",
                },
            ],
        };
    },
}
</script>

<style>

</style>