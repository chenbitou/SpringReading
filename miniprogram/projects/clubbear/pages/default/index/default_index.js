const pageHelper = require('../../../../../helper/page_helper.js');
const timeHelper = require('../../../../../helper/time_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');
const ProjectSetting = require('../../../public/project_setting.js');
const cacheHelper = require('../../../../../helper/cache_helper.js');

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		cur: 'run',
		cateId: '',
		cateList: ProjectSetting.ACTIVITY_CATE,
		isLoad: false
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		ProjectBiz.initPage(this);

		let city = cacheHelper.get('CACHE_CITY', '北京市');
		this.setData({
			city,
			_params: {
				sortType: this.data.cur,
				sortVal: city,
			},
		}, () => {
			this.setData({ isLoad: true });
		});
	},

	bindCityTap: function (e) {
		wx.reLaunch({
			url: 'default_index',
		});
	},

	bindCateTap: function (e) {
		let cateId = pageHelper.dataset(e, 'cate');
		let city = cacheHelper.get('CACHE_CITY', '北京市');
		this.setData({
			city,
			cateId,
			_params: {
				cateId,
				sortType: this.data.cur,
				sortVal: city,
			},
		}, () => {
			this.setData({ isLoad: true });
		});
	},
	bindCurTap: function (e) {
		let cur = pageHelper.dataset(e, 'cur');
		this.setData({ cur });

		if (cur == 'city') cur = 'run';

		let city = cacheHelper.get('CACHE_CITY', '北京市');
		this.setData({
			city,
			cateId: '',
			_params: {
				sortType: cur,
				sortVal: city,
			},
		}, () => {
			this.setData({ isLoad: true });
		});
	},

	bindCommListCmpt: function (e) {
		pageHelper.commListListener(this, e);

		if (this.data.dataList && this.data.dataList.type != 'run') return;


		let today = '';

		if (!this.data.dataList || !this.data.dataList.list) return;
		let list = this.data.dataList.list;

		for (let k = 0; k < list.length; k++) {
			if (today != list[k].ACTIVITY_START_DAY) {
				today = list[k].ACTIVITY_START_DAY;
				list[k].mark = today;
				list[k].mon = Number(today.split('-')[1]);

				let mark1 = timeHelper.timestamp2Time(list[k].ACTIVITY_START, '月D日');
				list[k].mark1 = mark1 + ' ' + timeHelper.week(today);
			}
		}

		this.setData({ 'dataList.list': list });
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: async function () {
	},

	onPullDownRefresh: async function () {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	url: async function (e) {
		pageHelper.url(e, this);
	},


	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},
})