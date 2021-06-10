<template>
	<MainPageOverlay>
		<div class="q-ma-xl">
			<div class="row q-col-gutter-xl q-mb-xl">
				<div class="col">
					<CardButton icon="query_stats" label="View account activity" />
				</div>
				<div class="col">
					<CardButton icon="swap_horiz" label="Transfer between accounts" />
				</div>
			</div>
			<div class="row q-col-gutter-xl q-mb-xl">
				<div class="col">
					<CardButton icon="manage_accounts" label="Manage accounts" />
				</div>
				<div class="col">
					<CardButton icon="person_add" label="Add account" @on-click="$router.push('/acts/add')" />
				</div>
			</div>
		</div>
	</MainPageOverlay>
</template>

<script>
import MainPageOverlay from '../components/slots/MainPage.vue';
import CardButton from '../components/slots/CardButton.vue';

export default {
	components: {
		MainPageOverlay,
		CardButton,
	},
	methods: {
    },
};
</script>

<style scoped>
.act-card {
	padding: 20px !important;
	height: 25vh;
	text-align: center;
	/* margin-left: 30px; */
	/* margin-top: 30px; */
	display: flex;
	justify-content: center;
	align-items: center;
}

.account-page {
	height: 100%;
	margin-top: auto;
	margin-bottom: auto;
}
</style>
