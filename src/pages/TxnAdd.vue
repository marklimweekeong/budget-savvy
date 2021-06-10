<template>
<SubPageOverlay :loading="loading" title="" backRoute="/">
    <template v-slot:header>
        <div class="row header-font">
            <span style="margin-right:8px; padding-bottom:1px;">Add</span>
            <div style="border-bottom: 1px solid white; width:150px">
                {{ types[isExpense].name }}
                <q-icon name="swap_vert" style="float:right; margin-top:9px;" class="cursor-pointer" @click="changeType" />
            </div>
        </div>
    </template>
    <div class="q-mx-lg q-my-md text-semidark">
        <div class="text-grey-10">Date</div>
        <div style="width:100; border-bottom: 1px solid rgba(0,0,0,0.24); font-size:18px" class="text-grey-10 q-mb-md q-pb-xs cursor-pointer">
            {{dateField}}
            <q-popup-proxy v-model="showDateSelector" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="dateRaw" mask="DD-MM-YYYY">
                    <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                </q-date>
            </q-popup-proxy>
        </div>
        <q-input :prefix="currencyUnit" v-model.number="amountField" type="number" ref="amount" label="Amount" style="width:100%; padding: 0px" label-color="grey-10" @blur="roundAmount" :rules="amountRules" />
        <q-input v-model="nameField" ref="name" label="Description" style="width:100%" label-color="grey-10" />
        <q-select v-model="catField" :options="isExpense ? expenseCats : earningCats" behavior="menu" ref="cat" label="Category" style="width:100%" label-color="grey-10" />
        <q-select v-model="actField" :options="acts" behavior="menu" ref="act" label="Account" style="width:100%" label-color="grey-10" />
        <div class="row items-center q-my-lg">
            <span style="font-size:18px; font-weight:400" class="text-grey-10">Smear Transaction across month</span>
            <div style="position: absolute; right: 15px;">
                <q-checkbox v-model="isSmear" />
            </div>
        </div>

        <span style="color:red"> TODO SELECT FAVOURITE TRANSACTION</span>
    </div>
    <q-footer class="bg-white q-pa-md">
        <div class="row">
            <div class="col q-mr-md">
                <q-btn class="full-width" color="primary" size="16px" no-caps unelevated label='Add' @click="addSingleTxn"></q-btn>
            </div>
            <div class="col">
                <q-btn class="full-width" color="primary" size="16px" no-caps unelevated label='Add and add another' @click="addMultiTxn"></q-btn>
            </div>
        </div>
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
            showDateSelector: false,
            loading: true,
            dateField: '',
            dateRaw: '',
            months: ['Jan', "Feb", "Mar", 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            nameField: '',
            amountField: '',
            amountRulesEnabled: true,
            catField: '',
            expenseCats: [],
            earningCats: [],
            actField: '',
            acts: [],
            currencyUnit: '',
            isExpense: 1, //selected index for types
            types: [{
                    name: 'Earning',
                    bool: false,
                },
                {
                    name: 'Expense',
                    bool: true,
                },
            ],
            isSmear: false,
        };
    },
    methods: {
        changeType() {
            this.isExpense = 1 - this.isExpense;
            this.catField = this.isExpense ? this.expenseCats[0] : this.earningCats[0];
        },
        roundAmount() {
            this.amountField = Math.round((this.amountField + 0.00001) * 100) / 100;
        },
        async getCatsAndActs() {
            [this.expenseCats, this.earningCats, this.acts] = await Promise.all([
                this.$store.getters.db.getExpUserCats(),
                this.$store.getters.db.getEarUserCats(),
                this.$store.getters.db.getAllUnlockedActs(),
            ]);
            this.catField = this.expenseCats[0];
            this.actField = this.acts[0];
        },
        async setCurrency() {
            let user = await this.$store.getters.db.getUserInfo();
            this.currencyUnit = user.currency.unit;
        },
        async addTxn() {
            this.roundAmount()
            this.$refs.amount.validate();
            if (!this.$refs.amount.hasError) {
                this.loading = true;
                let promise = await this.$store.getters.db.addTxn({
                    name: this.nameField,
                    amount: this.amountField,
                    isExpense: this.isExpense ? true : false,
                    isSmear: this.isSmear,
                    year: this.dateRaw.substring(6, 10),
                    month: this.dateRaw.substring(3, 5),
                    day: this.dateRaw.substring(0, 2),
                    ActID: this.actField.id,
                    CatID: this.catField.id
                });
                this.loading = false;
                return promise
            } else {
                return 2
            }
        },
        async addSingleTxn() {
            let promise = await this.addTxn()
            if (promise === 1) {
                this.$router.push('/');
                //TODO success message
            } else if (promise !=2) {
                //TODO error message
            }
        },
        async addMultiTxn() {
            let promise = await this.addTxn()
            if (promise === 1) {
                this.amountRulesEnabled = false
                this.amountField = 0
                this.nameField = ''
                this.$refs.amount.resetValidation()
                setTimeout(()=>{this.amountRulesEnabled = true},0.001)
                //TODO success message
            } else if (promise !=2) {
                //TODO error message
            }
        }
    },
    computed: {
        amountRules() {
            return this.amountRulesEnabled? [
                (val) => !!val || 'Amount must be a positive number',
                (val) => val > 0 || 'Amount must be a positive number',
            ] : [(val) => val != 'value' || 'error'];
        },
    },
    watch: {
        dateRaw(newVal, oldVal) {
            if (newVal === null) {
                this.dateRaw = oldVal
            } else {
                this.dateField = `${this.dateRaw.substring(0,2)} ${this.months[this.dateRaw.substring(3,5)-1]} ${this.dateRaw.substring(6,10)}`
                this.showDateSelector = false
            }
        },
    },
    async beforeMount() {
        await Promise.all([this.setCurrency(), this.getCatsAndActs()]);
        const now = new Date()
        this.dateRaw = `${('0'+now.getDate()).slice(-2)}-${('0'+(now.getMonth()+1)).slice(-2)}-${now.getFullYear()}`
        this.loading = false;
    },
};
</script>

<style scoped></style>
