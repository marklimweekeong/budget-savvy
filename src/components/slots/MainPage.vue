<template>
	<q-layout view="hhh lpR fFf" :class="backgroundColorClass">
		<div class="header">
			<div class="header-bg"></div>
			<q-toolbar>
				<div class="vertical-middle header-font">{{ routeName }}</div>
			</q-toolbar>
		</div>
		<!-- Drawer(PC only), potentially add overlay to q-drawer -->
		<q-drawer v-if="!deviceIsPhone" v-model="leftDrawerOpen" behavior="desktop" bordered content-class="bg-grey-1" :width="240" class="bg-light">
			<q-scroll-area class="fit">
				<LinkList :links="mainLinks"> </LinkList>
				<q-separator />
				<SettingsMenu> </SettingsMenu>
                TODO - Site is currently not designed for PC
			</q-scroll-area>
		</q-drawer>
		<!-- Body -->
		<q-page-container class="text-semidark page">
			<slot > </slot>
		</q-page-container>
		<!-- Footer(Mobile only) -->
		<q-footer v-if="deviceIsPhone" bordered class="bg-light text-dark">
			<FooterLinks :links="mainLinks"></FooterLinks>
		</q-footer>
	</q-layout>
</template>

<script>
import { mapGetters } from 'vuex';

const mainLinksData = [
	{
		title: 'Summary',
		icon: 'bar_chart',
		link: '/summary',
	},
	{
		title: 'Add Transaction',
		icon: 'local_atm',
		link: '/txns/add',
	},
	{
		title: 'Accounts',
		icon: 'account_balance',
		link: '/acts',
	},
	{
		title: 'Budget',
		icon: 'account_balance_wallet',
		link: '/budget',
	},
];

export default {
	components: {
		// Header,
		FooterLinks: () => import('../layout/FooterLinks.vue'),
		LinkList: () => import('../lists/LinkList.vue'),
		SettingsMenu: () => import('../layout/SettingsMenu.vue'),
	},
	data() {
		return {
			leftDrawerOpen: true,
			mainLinks: mainLinksData,
			title: 'Budget Savvy',
			titles: [
				{ routeName: 'categories', titleName: 'Categories' },
				{ routeName: 'dashboard', titleName: 'Dashboard' },
				{ routeName: 'transactions', titleName: 'Budget Savvy' },
				{ routeName: 'accounts', titleName: 'Budget Savvy' },
				{ routeName: 'budget', titleName: 'Budget Savvy' },
			],
		};
	},
	computed: {
		...mapGetters(['deviceIsPhone']),
		backgroundColorClass() {
			return this.deviceIsPhone ? 'bg-light' : 'bg-default';
		},
		routeName() {
			return this.$router.currentRoute.name;
		},
	},
	methods: {
		updateTitle(routeName) {
			const newTitle = this.titles.find((title) => title.routeName === this.$route.name);
			this.title = newTitle ? newTitle.titleName : 'Budget Savvy';
		},
	},
	watch: {
		$route(route) {
			this.updateTitle(route.name);
		},
	},
	mounted() {
		this.updateTitle(this.$router.currentRoute.name);
	},
};
</script>

<style scoped>
.header-bg {
	width: 106%;
	height: 100%;
	left: -3%;
	position: absolute;
	background-color: var(--primary-medium);
	border-bottom-left-radius: 50% 20%;
	border-bottom-right-radius: 50% 20%;
}

.header {
	width: 100%;
	height: 30vh;
	background-color: white;
	position: absolute;
	left: 50%;
	transform: translate(-50%, 0);
}

.page {
	padding-top: 10vh;
}
</style>
