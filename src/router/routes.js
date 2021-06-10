const routes = [
	{ path: '/', redirect: '/acts' },
	{ name: 'summary', path: '/summary', component: () => import('pages/Index.vue') },
	{ name: 'Add Transaction', path: '/txns/add', component: () => import('pages/TxnAdd.vue') },
	{ name: 'Accounts', path: '/acts', component: () => import('pages/Accounts.vue') },
    { name: 'Add Account', path: '/acts/add', component: () => import('pages/ActAdd.vue') },
	{ name: 'budget', path: '/budget', component: () => import('pages/Index.vue') },
	{
		path: '*',
		component: () => import('pages/Error404.vue'),
	},
];

export default routes;
