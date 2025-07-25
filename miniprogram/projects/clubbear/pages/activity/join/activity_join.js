const cloudHelper = require('../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../helper/page_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,

		check1: false,
		check2: false,

		forms: [],
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		ProjectBiz.initPage(this);
		if (!pageHelper.getOptions(this, options)) return;

		if (!await PassportBiz.loginMustBackWin(this)) return;

		this._loadDetail();

	},

	_loadDetail: async function () {
		let id = this.data.id;
		if (!id) return;


		let params = {
			activityId: id
		};
		let opt = {
			title: 'bar'
		};
		let activity = await cloudHelper.callCloudData('activity/detail_for_join', params, opt);
		if (!activity) {
			this.setData({
				isLoad: null
			})
			return;
		}


		this.setData({
			isLoad: true,
			activity,
		});

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

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

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: async function () {
		this.setData({
			isLoad: false
		}, async () => {
			await this._loadDetail();
		})
		wx.stopPullDownRefresh();
	},



	url: function (e) {
		pageHelper.url(e, this);
	},

	onPageScroll: function (e) {
		// 回页首按钮
		pageHelper.showTopBtn(e, this);

	},

	bindCheckTap: function (e) {
		let check = pageHelper.dataset(e, 'check');
		this.setData({
			[check]: !this.data[check]
		});
	},

	bindSubmitTap: async function (e) {

		if (!this.data.check1
			|| !this.data.check2)
			return pageHelper.showModal('请确认阅读并勾选~');

		this.selectComponent("#form-show").checkForms();
	},

	bindSubmitCmpt: async function (e) {
		let forms = e.detail;

		try {
			let opts = {
				title: '提交中'
			}
			let params = {
				activityId: this.data.id,
				forms
			}
			await cloudHelper.callCloudSumbit('activity/join', params, opts).then(res => {
				let content = (res.data.check == 0) ? '报名成功！' : '报名完成，请耐心等待系统审核';

				let activityJoinId = res.data.activityJoinId;
				let parent = pageHelper.getPrevPage(2);
				if (parent) parent._loadDetail();

				if (res.data.check == 0) {
					wx.redirectTo({
						url: '../join_qr/activity_join_qr',
					});
				}
				else {
					wx.showModal({
						title: '温馨提示',
						showCancel: false,
						content,
						success() {
							let ck = () => {
								wx.navigateBack();
							}
							ck();
						}
					})
				}

			})
		} catch (err) {
			console.log(err);
		};
	}

})