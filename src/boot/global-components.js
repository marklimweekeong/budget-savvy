import Vue from 'vue'
import BaseCard from '../components/slots/BaseCard.vue'
import BasePage from '../components/slots/BasePage.vue'
import BaseTabs from "../components/slots/BaseTabs.vue"
import MainPage from '../components/slots/MainPage.vue'
import draggable from "vuedraggable";


Vue.component("draggable", draggable);
Vue.component('BaseCard', BaseCard)
Vue.component('BasePage', BasePage)
Vue.component('BaseTabs', BaseTabs)
Vue.component('MainPage', MainPage)