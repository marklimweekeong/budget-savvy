<template>
<SubPageOverlay :loading="loading" title="Add Account" backRoute="/acts">
    <div class="q-mx-lg q-my-md text-semidark">
        <q-input v-model="nameField" ref="name" label="Account Name" style="width:100%" label-color="grey-10" :rules="ActNameRules" />
        <q-select v-model="currencyField" :options="currencyOptions" behavior="menu" ref="currency" label="Currency" style="width:100%" label-color="grey-10" />
    </div>
    <q-footer class="bg-white q-pa-md">
        <q-btn class="full-width" color="primary" size="16px" no-caps unelevated label="Add account" @click="addAct"></q-btn>
    </q-footer>
</SubPageOverlay>
</template>

<script>
import SubPageOverlay from '../components/slots/SubPage.vue';

export default {
    components: {
        SubPageOverlay,
    },
    data() {
        return {
            loading: true,
            nameField: '',
            currencyField: '',
            currencyOptions: [],
            dbActNames: [],
        };
    },
    methods: {
        async setCurrencyOptions() {
            let user = await this.$store.getters.db.getUserInfo();
            this.currencyOptions.push(user.currency);
            for (let currency of require('../data/currencies.js')) {
                if (currency.label !== user.currency.label) {
                    this.currencyOptions.push(currency);
                }
            }
            this.currencyField = this.currencyOptions[0];
        },
        async getActNames() {
            this.dbActNames = await this.$store.getters.db.getAllActNames().then((actNames) => {
                return actNames.map((actName) => {
                    return actName.toLowerCase();
                });
            });
        },
        async addAct() {
            this.$refs.name.validate();
            if (!this.$refs.name.hasError) {
                this.loading = true;
                let promise = await this.$store.getters.db.userAddAct({
                    label: this.nameField,
                    currency: this.currencyField,
                });
                this.loading = false;
                if (promise === 1) {
                    this.$router.push('/acts');
                    //TODO success message, pass argument to acts
                } else {
                    //TODO error message
                }
            }
        },
    },
    computed: {
        ActNameRules() {
            return [
                (val) => !!val || 'Account name cannot be blank',
                (val) => !this.dbActNames.includes(val.toLowerCase()) || 'You already have an account with this name',
            ];
        },
    },
    async beforeMount() {
        await Promise.all([this.setCurrencyOptions(), this.getActNames()]);
        this.loading = false;
    },
};
</script>

<style scoped></style>
