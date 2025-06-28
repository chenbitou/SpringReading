const pageHelper = require('../../../../../helper/page_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		check1: false,
		check2: false,
		check3: false,
		check4: false,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		ProjectBiz.initPage(this);
		let parent = pageHelper.getPrevPage(2);
		if (!parent) return;
		this.setData({
			cateId: parent.data.cateId,
			method: parent.data.method
		});
	},

	bindCheckTap: function (e) {
		let check = pageHelper.dataset(e, 'check');
		this.setData({
			[check]: !this.data[check]
		});
	},

	bindSubmitTap: function (e) {
		if (!this.data.check1
			|| !this.data.check2
			|| !this.data.check3
			|| !this.data.check4)
			return pageHelper.showModal('请确认阅读并勾选~');

		wx.navigateTo({
			url: '../add/activity_add',
		});
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})