<template>
<span>
    <q-tabs dense :breakpoint="5000" class="text-grey text-h6" style="width:100% !important;" active-color="primary" indicator-color="primary" indicator>
        <slot v-if="!deviceIsPhone" name="tabs">
            <!-- Tabs here -->
        </slot>
        <q-tab v-else />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="$route.params.type" animated class="no-shadow bg-none">
        <slot>
            <!-- Tab panels here -->
        </slot>
    </q-tab-panels>
    <q-page-sticky v-if="deviceIsPhone" expand position="top">
        <q-tabs dense :breakpoint="5000" class="text-grey text-h6 bg-light" style="width:100% !important;" active-color="primary" indicator-color="primary" indicator>
            <slot name="tabs">
                <!-- Tabs here -->
            </slot>
        </q-tabs>
        <q-separator />
    </q-page-sticky>
</span>
</template>

<script>
import {
    mapGetters
} from 'vuex';

export default {
    computed: {
        ...mapGetters([
            'deviceIsPhone',
        ])
    },
};
</script>

<style>

</style>
