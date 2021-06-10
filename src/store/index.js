import { Database } from "../database.js";
import Vue from "vue";
import Vuex from "vuex";

// import example from './module-example'

Vue.use(Vuex);

export default function() {
    const Store = new Vuex.Store({
        modules: {
        },
        state() {
            return {
                lastMainPageLink: "/",
                deviceIsPhone: null,
                db: null,
            };
        },
        mutations: {
            lastMainPageLink(state, link) {
                state.lastMainPageLink = link;
            },
            deviceIsPhone(state, bool) {
                state.deviceIsPhone = bool
            },
            async newDb(state) {
                state.db = new Database();
                //Perhaps ptu below in index and not here
                if (!(await state.db.user.count())) {
                    //Go to setup page and do setup
                    console.log('new user')
                    state.db.initialSetup("SGD","$",)
                } else {
                    //Go to home page
                    console.log('existing user')
                }
            },
        },
        actions: {
            lastMainPageLinkAction(context, link) {
                context.commit("lastMainPageLink", link);
            },
            deviceIsPhoneAction(context, bool) {
                context.commit('deviceIsPhone', bool)
            },
            newDb(context) {
                context.commit("newDb");
            },
            async postTest(context, transaction) {
                await context.getters.db.addTransaction(transaction).then(id => {
                    transaction.id = id;
                });
            },
            async getTest(context) {
                const userInfo = await context.getters.db.getTransactionsTest();
                console.log(userInfo)
                return userInfo
            },
            async putTest(context, transaction) {
                await context.getters.db.updateTransaction(transaction)
            },
            async newCurrencyUpdateTransations(context, payload) {
                //Payload contains exchangeRate Number and accounts Array
                await context.getters.db.newCurrencyUpdateTransations(payload.exchangeRate, payload.accounts)
            }
        },
        getters: {
            lastMainPageLink(state) {
                return state.lastMainPageLink;
            },
            deviceIsPhone(state) {
                return state.deviceIsPhone
            },
            db(state) {
                return state.db;
            },
        }
    });

    return Store;
}
