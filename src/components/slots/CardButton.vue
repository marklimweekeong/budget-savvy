<template>
	<q-card class="card-button" v-ripple @click="onClick">
		<div class="q-pa-sm">
			<q-icon :name="icon" size="45px"></q-icon>
			<div class="card-button-font">{{label}}</div>
		</div>
	</q-card>
</template>

<script>
export default {
	props: {
		label: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: '',
		},
	},
    methods: {
        onClick() {
            this.$emit('on-click')
        }
    }
};
</script>

<style scoped>
.card-button {
	padding: 20px !important;
	height: 25vh;
	text-align: center;
	display: flex;
	justify-content: center;
    border: 1px solid rgba(0,0,0,0.25);
	align-items: center;
}

.card-button-font {
	font-size: 16px;
	font-weight: 500;
	margin-top: 6px;
}
</style>
