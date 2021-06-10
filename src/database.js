//Tx(s) = transaction(s), Rt(s) = repeat transaction(s), Ac(s) = account(s), Ft = favourite transaction
//Cats = categories, Bugs = budgets
//Note: this.transaction() is a Dexie function to open a transaction to access the db, and is not related to expense/earning transactions made be users

import Dexie from 'dexie';

export class Database extends Dexie {
	constructor() {
		super('database');
		this.version(28).stores({
			transactions: '++id, ActId, RtId, [ActId+year+month], [year+month+ActId]', //id, name(S), amount(N), isExpense(B), isSmear(B), isRepeat(B), month(N), year(N), day(N), ActId, CatId, RtId (if applicable),
			favouriteTransactions: '++id, ActId, [name+amount+CatId+ActId]', //id, name(S), amount(N), isExpense(B), CatId, ActId
			repeatTransactions: '++id, [endYear+endMonth], [startYear+startMonth]', //id, name(S), amount(N), isExpense(B), isMonthly(B), startMonth(N), startYear(N), endMonth(N), endYear(N), TxIds(A), ActId, TxIds
			category: '++id, label, [isUserCategory+isExpense+toShow]', //id, label(S), isExpense(B), toShow(B), isUserCategory(B)
			month: '[year+month]', //month(N), year(N). Note, if it exists, it means admin has been done for it
			user: '++id', //id, currency(S), currencyLabel(S), defaultBudget (Object of item and dist arrays), lastLogin (FOR MONTH CHECKING, object of year,month)
			account: '++id, isLocked, currency, label', //id, label(S), currency(S), currencyLabel(s), monthlySavings(Array of objects with year(N), month(N), amount(N), budgetId()), isLocked(B)
			budget: '[year+month]', //month(N), year(N), items(A of objects with name(S) and amount(N)), distribution(A of objects with isTransfer(B), percentage(N), name(S), ActId)
			accountMonths: '[ActId+year+month], [year+month+ActId], ActId',
		});
		this.Txs = this.table('transactions');
		this.Fts = this.table('favouriteTransactions');
		this.Rts = this.table('repeatTransactions');
		this.Cats = this.table('category');
		this.month = this.table('month');
		this.user = this.table('user');
		this.Acts = this.table('account');
		this.Buds = this.table('budget');
		this.ActMons = this.table('accountMonths');
	}

	//HelperFunctions
	getCurrentDayMonthYear() {
		const now = new Date();
		return {
			year: now.getFullYear(),
			month: now.getMonth() + 1,
			day: now.getDate(),
		};
	}

	getPreviousMonthYear() {
		let prev = new Date();
		prev.setDate(0);
		return {
			year: prev.getFullYear(),
			month: prev.getMonth() + 1,
		};
	}

	convertTM(year, month) {
		//Returns time in months (TM) from 0AD
		return year * 12 + month;
	}

	/////////////////////////////////////////
	/////////////////////////////////////////
	//Transactions
	/////////////////////////////////////////
	/////////////////////////////////////////

	async getSingleAccountTransactions(ActId, year, month) {
		return await this.Txs.where({
			month: month,
			year: year,
			ActId: ActId,
		})
			.toArray()
			.catch((err) => err);
	}

	async getMultipleAccountsTransactions(accounts, year, month) {
		let filterArray = [];
		for (let account of accounts) {
			filterArray.push([year, month, account]);
		}
		return await this.Txs.where('[year+month+ActId]')
			.anyOf(filterArray)
			.toArray()
			.catch((err) => err);
	}

	async getSingleAccountTransactionsAll(ActId) {
		return await this.Txs.where({ ActId: ActId })
			.toArray()
			.catch((err) => err);
	}

	async getMultipleAccountsTransactionsAll(accounts) {
		return await this.Txs.where('ActId')
			.anyOf(accounts)
			.toArray()
			.catch((err) => err);
	}

	async addTxn(transaction) {
		return await this.Txs.add(transaction)
			.then(() => 1)
			.catch((err) => err);
            //TODO ADD TO ACCOUNTMONTH
	}

	async deleteTransaction(transactionId) {
		return await this.Txs.delete(transactionId)
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateTransaction(transaction) {
		return await this.Txs.put(transaction)
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateTransationsForNewCurrency(exchangeRate, ActIds) {
		return await this.Txs.where('ActId')
			.anyOf(ActIds)
			.modify((transaction) => (transaction.amount *= exchangeRate))
			.then(() => 'success')
			.catch((err) => err);
	}

	//////////////////////////////////////////
	//////////////////////////////////////////
	//favouriteTransactions
	//////////////////////////////////////////
	//////////////////////////////////////////

	async addFavouriteTransaction(Ft) {
		return await this.transaction('rw', this.Fts, async () => {
			if (!(await this.Fts.where({ name: Ft.name, amount: Ft.amount, CatId: Ft.CatId, ActId: Ft.ActId }).primaryKeys()).length) {
				Ft.isSmear = false;
				this.Fts.add(Ft);
			} else {
				return Promise.reject('Repeat Ft');
			}
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async getFavouriteTransactions(ActId) {
		return await this.Fts.where({ ActId: ActId })
			.toArray()
			.catch((err) => err);
	}

	async deleteFt(Ft) {
		return await this.Fts.delete(Ft.id)
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateFt(Ft) {
		return await this.Fts.update(Ft.id, {
			name: Ft.name,
			amount: Ft.amount,
			isExpense: Ft.isExpense,
			ActId: Ft.ActId,
			CatId: Ft.CatId,
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	//////////////////////////////////////////
	//////////////////////////////////////////
	//RepeatTransactions
	//////////////////////////////////////////
	//////////////////////////////////////////

	async addTxsFromRt(Rt) {
		//IMPORTANT!! Needs to be nested in a transaction, otherwise data may become corrupted
		//Adds Txs from start to now/end (whichever is sooner) for a Rt and returns Rt with updated Rt.Txids
		let monthYears = this.RtToMonthYears(Rt);
		//Checks if there is a need to add Txs, if no, set empty array for TxIds
		if (monthYears.length == 0) {
			Rt.TxIds = [];
		} else {
			//If yes, create an array of Txs to add based on the Rt, then adds the Txs and gets back the TxIds, then updates Rt for the TxIds.
			let Txs = this.RtToTxsConversion(Rt, monthYears);
			Rt.TxIds = await this.Txs.bulkAdd(Txs, { allKeys: true });
		}
		return Rt;
	}

	async addRt(Rt) {
		//Adds Rt and gets back Rt.id. Then adds Txs with Rt.id and gets back TxIds. Then updates Rt with TxIds.
		return await this.transaction('rw', this.Txs, this.Rts, async () => {
			Rt.id = await this.Rts.add(Rt);
			Rt = await this.addTxsFromRt(Rt);
			this.Rts.where({ id: Rt.id }).modify((dbRt) => (dbRt.TxIds = Rt.TxIds));
		})
			.then(() => 'success') //TODO, NEEDS TO RETURN LIST OF UDPATED RTS TO UPDATE THE APP
			.catch((err) => err);
	}

	//TO BE DELETED, NOT USED
	async addTxForRtNewMonth(Rt, now) {
		//Get current date and create new Tx from the Rt
		//IMPORTANT: Assumes that this function cannot be run twice because it will only be called in a transaction in which the months table is updated as well
		//TODO: after ensuring that this function is only called in a transaction in which the months table is updated as well, remove the promise reject below.
		const [Txs] = this.RtToTxsConversion(Rt, [{ year: now.year, month: now.month }]);
		//Adds regular transaction then updates repeat transaction for the added regular transaction, also checks if Rt exists, so it doesn't add Txs if Rt doesn't exist
		return await this.transaction('rw', this.Txs, this.Rts, async () => {
			if ((await this.Rts.where({ id: Rt.id }).primaryKeys()).length) {
				const TxId = await this.Txs.add(Txs);
				this.Rts.where({ id: Rt.id }).modify((dbRt) => dbRt.TxIds.push(TxId));
			} else {
				return Promise.reject('RT not found');
			}
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateRt(newRt, oldRt) {
		//Only allow for updated amount, isMonthly, start/end month/year, name and account ID
		return await this.transaction('rw', this.Txs, this.Rts, async () => {
			const amount = this.RtCalculateMonthlyAmount(newRt.amount, newRt.isMonthly);
			//Checks for updated period
			if (
				newRt.startMonth === oldRt.startMonth &&
				newRt.endMonth === oldRt.endMonth &&
				newRt.startYear === oldRt.startYear &&
				newRt.endYear === oldRt.endYear
			) {
				//If period is not updated, check for updated amount/isMonthly/Account/isExpense and whether there are associated Txs
				if (
					(newRt.amount != oldRt.amount ||
						newRt.isMonthly != oldRt.isMonthly ||
						newRt.ActId != oldRt.ActId ||
						newRt.isExpense != oldRt.isExpense) &&
					newRt.TxIds.length
				) {
					//If amount/isMonthly is not updated or there are no associated Txs, skip to update Rt.
					//Otherwise, update relevant Txs for amount, ActId and isExpense
					this.Txs.where({ RtId: newRt.id }).modify((Tx) => {
						Tx.amount = amount;
						Tx.ActId = newRt.ActId;
						Tx.isExpense = newRt.isExpense;
					});
				}
			} else {
				//If period/account is updated, delete all Txs associated with RT, then add new ones.
				if (newRt.TxIds.length) this.Txs.bulkDelete(newRt.TxIds);
				newRt = await this.addTxsFromRt(newRt);
			}
			//UpdateRt (using Put to replace entire Rt)
			this.Rts.put(newRt);
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async deleteRt(Rt) {
		//Deletes Rt and all associated Txs
		return await this.transaction('rw', this.Txs, this.Rts, async () => {
			this.Txs.bulkDelete(Rt.TxIds);
			this.Rts.delete(Rt.id);
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async stopRT(Rt) {
		//Stops a RT from creating transactions going forward by setting endMonth = currentMonth
		//Ensure that only active RTs can be stopped, and ensure that if a RT ends this month, it is no longer active.
		let now = this.getCurrentDayMonthYear();
		return await this.Rts.update(Rt.id, {
			endYear: now.year,
			endMonth: now.month,
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async getActiveRts() {
		//returns an array of active Rts
		const now = this.getCurrentDayMonthYear();
		return await this.transaction('r', this.Rts, async () => {
			const keys = await Promise.all([
				this.Rts.where('[endYear+endMonth]')
					.above([now.year, now.month])
					.primaryKeys(),
				this.Rts.where('[startYear+startMonth]')
					.belowOrEqual([now.year, now.month])
					.primaryKeys(),
			]);
			const intersection = keys[0].filter((key) => keys[1].indexOf(key) !== -1);
			return await this.Rts.where('id')
				.anyOf(intersection)
				.toArray();
		}).catch((err) => err);
	}

	async getSegmentedRts() {
		//Returns an object of 3 arrays {activeRts, completedRts, futureRts}
		return await this.transaction('r', this.Rts, async () => {
			const now = this.getCurrentDayMonthYear();
			return {
				activeRts: await this.getActiveRts(),
				completedRts: await this.Rts.where('[endYear+endMonth]')
					.belowOrEqual([now.year, now.month])
					.toArray(),
				futureRts: await this.Rts.where('[startYear+startMonth]')
					.above([now.year, now.month])
					.toArray(),
			};
		}).catch((err) => err);
	}

	RtCalculateMonthlyAmount(amount, isMonthly) {
		return isMonthly ? amount : Math.round((amount / 12 + Number.EPSILON) * 100) / 100;
	}

	RtToTxsConversion(Rt, monthYears) {
		//Ensure that monthYears is not empty
		Rt.amount = this.RtCalculateMonthlyAmount(Rt.amount, Rt.isMonthly);
		Rt.RtId = Rt.id;
		let { id, endYear, endMonth, startYear, startMonth, isMonthly, TxIds, ...Tx } = Rt;
		(Tx.day = 1), (Tx.isRepeat = true), (Tx.isSmear = true);
		let Txs = [];
		for (let monthYear of monthYears) {
			Tx.month = monthYear.month;
			Tx.year = monthYear.year;
			Txs.push(Object.assign({}, Tx));
		}
		return Txs;
	}

	RtToMonthYears(Rt) {
		//TM = Time in Months
		//returns an array of objects: {month: 12, year: 2020}
		// const now = this.getCurrentDayMonthYear();
		// const nowTM = this.convertTM(now.year, now.month);
		const startTM = this.convertTM(Rt.startYear, Rt.startMonth);
		// if (startTM > nowTM) return [];
		// const endTM = Math.min(nowTM, this.convertTM(Rt.endYear, Rt.endMonth));
		const endTM = this.convertTM(Rt.endYear, Rt.endMonth);
		let monthYears = [];
		for (let i = startTM; i <= endTM; i++) {
			let month = i % 12,
				year = Math.floor(i / 12);
			monthYears.push(month === 0 ? { year: year - 1, month: 12 } : { year: year, month: month });
		}
		return monthYears;
	}

	//category
	//id, name(S), isExpense(B), toShow(B), isUserCategory(B)
	//IMPORTANT: POSSIBLY CHANGE REPEAT TO A LIST OF INVALID NAMES, SO I CAN ACCESS THEM EASILY

	async checkRepeatCatName(Cat) {
		//IMPORTANT: Needs to be a nested transaction, doesn't catch errors.
		return await this.transaction('rw', this.Cats, async () => {
			if (Cat.name.toLowerCase() == 'repeat' || Cat.name.toLowerCase() == 'transfer') {
				return Promise.reject('Invalid category name');
			} else if (
				(
					await this.Cats.where('name')
						.equalsIgnoreCase(Cat.name)
						.keys()
				).length
			) {
				return Promise.reject('Repeat category');
			}
		});
	}

	async addCat(Cat) {
		return await this.transaction('rw', this.Cats, async () => {
			await this.checkRepeatCatName(Cat);
			Cat.isUserCategory = 1;
			Cat.toShow = 1;
			this.Cats.add(Cat);
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async deactivateCat(Cat) {
		return await this.Cats.update(Cat.id, {
			toShow: 0,
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async activateCat(Cat) {
		return await this.Cats.update(Cat.id, {
			toShow: 1,
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateCat(Cat) {
		//IMPORTANT Only allowed to update name
		//IMPORTANT Only allow submission if name has changed
		return await this.transaction('rw', this.Cats, async () => {
			await this.checkRepeatCatName(Cat);
			this.Cats.update(Cat.id, {
				name: Cat.name,
			});
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	setDefaultCats() {
		//IMPORTANT Only for use in another transaction
		this.Cats.bulkPut([
			{ id: 0, label: 'Repeat', isExpense: 1, toShow: 0, isUserCategory: 0 },
			{ id: 1, label: 'Repeat', isExpense: 0, toShow: 0, isUserCategory: 0 },
			{ id: 2, label: 'Transfer', isExpense: 1, toShow: 0, isUserCategory: 0 },
			{ id: 3, label: 'Transfer', isExpense: 0, toShow: 0, isUserCategory: 0 },
			{ id: 4, label: 'Food', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 5, label: 'Transport', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 6, label: 'Personal', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 7, label: 'Clothing', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 8, label: 'Entertainment', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 9, label: 'Bills', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 10, label: 'Health', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 11, label: 'Household', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 12, label: 'Gift', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 13, label: 'Holiday', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 14, label: 'Pets', isExpense: 1, toShow: 1, isUserCategory: 1 },
			{ id: 15, label: 'Gift', isExpense: 0, toShow: 1, isUserCategory: 1 },
			{ id: 16, label: 'Salary', isExpense: 0, toShow: 1, isUserCategory: 1 },
			{ id: 17, label: 'Reimbursement', isExpense: 0, toShow: 1, isUserCategory: 1 },
			{ id: 18, label: 'Grant', isExpense: 0, toShow: 1, isUserCategory: 1 },
			{ id: 19, label: 'Loan', isExpense: 0, toShow: 1, isUserCategory: 1 },
			{ id: 20, label: 'Misc', isExpense: 0, toShow: 1, isUserCategory: 1 },
		]);
	}

	async getExpUserCats() {
		return await this.Cats.where({ isUserCategory: 1, isExpense: 1, toShow: 1 })
			.toArray()
			.catch((err) => err);
	}

	async getEarUserCats() {
		return await this.Cats.where({ isUserCategory: 1, isExpense: 0, toShow: 1 })
			.toArray()
			.catch((err) => err);
	}

	async getAllUserCats() {
		return await this.Cats.where({ isUserCategory: 1 })
			.toArray()
			.catch((err) => err);
	}

	async getAllCats() {
		return await this.Cats.toArray().catch((err) => err);
	}

	async getCatName(CatId) {
		return await this.Cats.where({ id: CatId })
			.first()
			.then((Cat) => Cat.name)
			.catch((err) => err);
	}

	//months
	//TO BE DELETED, NOT NEEDED
	//Get months, then check against current month, if needed add month and run month admin in a transaction (split functions)
	newMonthAdmin(now) {
		this.transaction('rw', this.month, this.Rts, this.Txs, async () => {
			let activeRts = await this.getActiveRts();
			for (let Rt of activeRts) {
				this.addTxForRtNewMonth(Rt, now);
			}
			this.addBudFromDbudNewMonth(now);
			this.month.add({ year: now.year, month: now.month }); //POTENTIALLY DELETE
			this.user.update(0, {
				lastUpdate: { year: now.year, month: now.month },
			});
			//TODO: ACCOUNT/BUDGET NEW MONTH ADMIN
			//ADD NEW MONTH FOR EACH ACCOUNT
			//CARRY FORWARD OLD BUDGETS TO NEW MONTH (COPY AND ADD BUDGETS) AND UPDATE ACCOUNTS
		});
	}

	async newMonthCheck() {
		//TODO MOVE THIS TO MAIN APP
		const now = this.getCurrentDayMonthYear();
		const check = await this.month.where({ year: now.year, month: now.month }).primaryKeys();
		if (!check.length) {
			//TODO At this point, check lastUpdate instead of month AND DETERMINE HOW MANY MONTHS YOU NEED TO Update for.
			//TODO: AFTER MOVING TO MAIN APP, ADD LOADSCREEN HERE AND INFORM USER WHAT IS GOING ON
			this.newMonthAdmin(now);
			//AWAIT THE ABOVE THEN MAKE THE NEW MONTH ADMIN FUNCTION AND ASYNC FUNCTION AND AWAIT/RETURN THE TRANSACTION
			//UPDATE USER.LAST LOGIN
			//AFTER COMPLETE, REMOVE LOADSCREEN
		}
	}

	//user

	async initialSetup(currencyLabel, currencyUnit) {
		const now = this.getCurrentDayMonthYear();
		this.transaction('rw', this.user, this.Acts, this.ActMons, this.Cats, async () => {
			// this.month.put({ year: now.year, month: now.month });
			this.setDefaultCats();
			this.user.put({ id: 0, currency: { label: currencyLabel, unit: currencyUnit } });
			this.createDefaultAccounts();
			//TODO: CREATE 1ST MONTH BUDGET FROM DBUD
			//TODO: CREATE DEFAULT ACCOUNTS HERE
		});
	}

	async getUserInfo() {
		return await this.user.get(0);
	}

	//Also updates all Txs/Rtx/Ftx in an Ac
	async updateUserCurrency(newCurrency, exchangeRate, ActIds) {
		//exchange rate - oldCurrency * exchangeRate = newCurrency. E.g. SGD * 0.75 = USD

		////////////////// REMOVE FROM FUNCTION
		//TODO MOVE ALL CURRENCY INFO TO ANOTHER SHEET AND DO IT UP PROPERLY
		////////////////// REMOVE FROM FUNCTION

		//TODO MAKE THE REST OF THIS FUNCTION INTO A TRANSACTION
		this.user.update(0, {
			currency: newCurrency.currency,
			currencyLabel: newCurrency.currencyLabel,
		});

		//TODO, WITHIN APP NEED TO GET LIST OF Accounts with currency = old currency, then get user to select the accounts they want to convert to new exchange rate and input ActIds array
		this.updateTransationsForNewCurrency(exchangeRate, ActIds);
	}

	//account
	//id, name(S), currency(S), currencyLabel(s), isLocked(B), isDefault(B)
	//Indexes: id, isDefault
	//Other optional fields for acct currency changes prevCurrencyActId, closingAmount, startingAmount(for currency changes, default = 0)
	//Only 1 account has isDefault = 1.
	//So, when showing accounts, it will chain in this order.
	//Amount in account
	//List of Transactions
	//Below only if Act curency changes
	//NOTE FOR USER: oldCurrency(prevCurrencyActId) closingAmount(prevCurrencyActId) converted to newCurrency startingAmount
	//List of transactions from previous currency account
	//Repeat if necessary

	//For isOutdated, user cannot unlock

	//accountMonths
	//Indexes: (ActId+year+month), ActId
	//ActId, year, month, budget

	createDefaultAccounts(currencyLabel, currencyUnit) {
		this.transaction('rw', this.Acts, this.ActMons, async () => {
			let defActs = [
				{
					id: 0,
					label: 'Current Account',
					currency: { label: currencyLabel, unit: currencyUnit },
					isDefault: 1,
					isLocked: 0,
					startingAmount: 0,
				},
				{
					id: 1,
					label: 'Savings Account',
					currency: { label: currencyLabel, unit: currencyUnit },
					isDefault: 0,
					isLocked: 0,
					startingAmount: 0,
				},
			];
			this.Acts.bulkPut(defActs);
			let ActMon;
			let ActMons = [];
			for (let Act of defActs) {
				ActMon = { ActId: Act.id, Bud: 0, expenditure: 0 };
				for (let year = 2018; year < 2026; year++) {
					ActMon.year = year;
					for (let month = 1; month < 13; month++) {
						ActMon.month = month;
						ActMons.push(Object.assign({}, ActMon));
					}
				}
			}
			this.ActMons.bulkAdd(ActMons);
		});
	}

	async userAddAct(Act) {
		Act.isDefault = 0;
		Act.isLocked = 0;
		Act.startingAmount = 0;
		return await this.transaction('rw', this.Acts, this.ActMons, async () => {
			let ActId = await this.Acts.add(Act);
			let ActMon = { ActId: ActId, Bud: 0, expenditure: 0 };
			let ActMons = [];
			for (let year = 2018; year < 2026; year++) {
				ActMon.year = year;
				for (let month = 1; month < 13; month++) {
					ActMon.month = month;
					ActMons.push(Object.assign({}, ActMon));
				}
			}
			this.ActMons.bulkAdd(ActMons);
		})
			.then(() => 1)
			.catch((err) => err);
	}

	async lockActWithFunds(ActToLock, remainingFunds, ActToTrans = null, exchangeRate = 1) {
		//Locked acts cannot be unlocked
		//transAct = account for funds to be transferred into if any, if different currency, need to set exchangeRate
		//Open transaction
		//use actTranfser to transfer remainingFunds to other account
		// this.Acts.update(lockAct.id, { isLocked: 1 })
	}

	async lockActWithoutFunds(ActToLock) {
		//Ensure that actTolock has no funds within the app
		await this.Acts.update(ActToLock.id, { isLocked: 1 })
			.then(() => 1)
			.catch((err) => err);
	}

	actTransfer(actFrom, actTo, amount, exchangeRate = 1) {
		//TODO create 2 transactions, 1 from and 1 to. use exchange rate as well, default = 1. For transaction name, set as "Transfer from X act name or to X act name"
	}

	async unlockAct(Act) {
		//Cannot unlock if isOutdated = 1
		return await this.Acts.update(Act.id, { isLocked: 0 })
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateAllActCurrency(oldCurrency, newCurrency, newCurrencyLabel, exchangeRate) {
		//Get all unlocked accounts with oldCurrency, and set closingAmount = get all transactions and budgets then sum it up
		//Make copies for all oldAccounts for name and isDefault and set prevCurrencyActId = id
		//Set copy's currency and currency label to the new currency
		//Set copy's starting amount = closingamount * exchange rate
		//Remove copy's closing amount
		//open transaction
		//Put all old accts and add all new accts
		//Create now account months for all new accts
	}

	async updateActCurrency(oldCurrency, Act, exchangeRate) {
		//calculate closing amount for old currency
		//Update old account for isDefault = 0, change name and set closing account
		//Modify Act for Act.prevCurrencyId = Act.id, remove Act.id, set starting acct from exchangeRate and closingamount
		//ADd new Act
	}

	async renameAct(Act) {
		//Can rename all accounts
		return await this.Acts.update(Act.id, { label: Act.label })
			.then(() => 'success')
			.catch((err) => err);
	}

	async getActsFromCurrency(currency) {
		//Note, isDefault = 1 will be the first item in the array
		//Check if sorting is correct or whether need to add .reverse() before sortBy
		return await this.Acts.where({ isLocked: 0, currency: currency })
			.sortBy('isDefault')
			.catch((err) => err);
	}

	async getActFromid(ActId) {
		return await this.Acts.get(ActId).catch((err) => err);
	}

	async getAllUnlockedActs() {
		return await this.Acts.where({ isLocked: 0 }).toArray().catch((err) => err);
	}

	async getAllLockedActs() {
		return await this.Acts.where({ isLocked: 1 }).toArray().catch((err) => err);
	}

	async getAllActNames() {
		return await this.Acts.orderBy('label').keys();
	}

	async getActsUniqueCurrencies() {
		//TODO: ENSURE THAT THIS WORKS
		return await this.Acts.orderBy('currency')
			.filter((Act) => {
				return Act.isLocked === 0;
			})
			.uniqueKeys()
			.catch((err) => err);
	}

	//AccountMonths (ActMon)
	//Indexes: (ActId+year+month), ActId
	//ActId, year, month, budget, expenditure

	async getActBal(ActId) {
		return await this.transaction('r', this.ActMons, async () => {
            let ActMons = await this.ActMons.where({ActId: ActId}).toArray()
            let balance = 0
            for (let ActMon of ActMons) {
                balance += ActMon.Bud - ActMon.expenditure
            }
            return balance
        })
	}

	//TODO THROUGH THIS SHEET, whenever there's a transaction which involves an account, update ActMons.expenditure
	//SAME FOR Budgets

	//budget AND DEFAULT BUDGET
	//Indexes: year+month
	//Other data:
	//items --> Array of objects with name and amount
	//dist --> Array of objects with ActId and percentage
	//TODO WHEN LOOKING AT MONTHLY SUMMARY, GIVE USER WARNING IF NO BUDGET IN THAT MONTH.

	async addBud(Bud) {
		return await this.Buds.add(Bud)
			.then(() => 'success')
			.catch((err) => err);
	}

	runBudFuncOverPeriod(startYear, startMonth, endYear, endMonth, func) {
		const startTM = this.convertTM(startYear, startMonth);
		const endTM = this.convertTM(endYear, endMonth);
		return this.transaction('rw', this.Buds, () => {
			let monthYears = [];
			for (let i = startTM; i <= endTM; i++) {
				let month = i % 12,
					year = Math.floor(i / 12);
				monthYears.push(month === 0 ? { year: year - 1, month: 12 } : { year: year, month: month });
			}
			func(monthYears);
		});
	}

	async copyBud(Bud, startYear, startMonth, endYear, endMonth) {
		const func = (table, BudPara, monthYears) => {
			let BudParas = [];
			for (let monthYear of monthYears) {
				BudPara.year = monthYear.year;
				BudPara.month = monthYear.month;
				BudParas.push(Object.assign({}, BudPara));
			}
			table.bulkPut(BudParas);
			//TODO UPDATE ACCOUNTS
		};
		return await this.runBudFuncOverPeriod(startYear, startMonth, endYear, endMonth, func.bind(this, this.Buds, Bud))
			.then(() => 'success')
			.catch((err) => err);
	}

	updateBudCurency(startYear, startMonth, endYear, endMonth, exchangeRate) {
		//Not for users, this is when users update currency, must be used within another transaction
		const func = (table, exchangeRatePara, monthYears) => {
			table
				.where('[year+month]')
				.between([monthYears[0].year, monthYears[0].month], [monthYears[monthYears.length - 1].year, monthYears[monthYears.length - 1].month])
				.modify((dbBud) => {
					dbBud.items = dbBud.items.map((item) => {
						item.amount *= exchangeRatePara;
						return item;
					});
				});
			//TODO UPDATE ACCOUNTS
		};
		this.runBudFuncOverPeriod(startYear, startMonth, endYear, endMonth, func.bind(this, this.Buds, exchangeRate));
	}

	async updateBud(Bud) {
		//IMPORTANT Users can only update item and dist, CANNOT CHANGE MONTH AND YEAR
		return await this.transaction('rw', this.Buds, async () => {
			this.Buds.update([Bud.year, Bud.month], { items: Bud.items, dist: Bud.dist });
			//TODO UPDATE ACCOUNTs
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	//TO DELETE
	async addBudFromDbudNewMonth(now) {
		//IMPORTANT, ONLY TO BE USED WITHIN TRANSACTION
		const [check, [user]] = await Promise.all([this.Buds.where({ year: now.year, month: now.month }).primaryKeys(), this.user.toArray()]);
		if (!check.length) {
			let Bud = Object.assign({}, user.defaultBudget);
			Bud.year = now.year;
			Bud.month = now.month;
			this.Buds.add(Bud);
			//TODO UPDATE ACCOUNTS
		}
	}

	async deleteBud(Bud) {
		return await this.transaction('rw', this.Buds, async () => {
			this.Buds.delete([Bud.year, Bud.month]);
			//TODO UPDATE ACCOUNTs
		})
			.then(() => 'success')
			.catch((err) => err);
	}

	async updateDbud(Bud) {
		let Dbud = { items: Bud.items, dist: Bud.dist };
		return await this.user
			.update(0, { defaultBudget: Dbud })
			.then(() => 'success')
			.catch((err) => err);
	}
	
}
