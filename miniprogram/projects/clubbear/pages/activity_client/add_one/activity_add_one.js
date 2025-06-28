const pageHelper = require('../../../../../helper/page_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');
const ProjectSetting = require('../../../public/project_setting.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		cateId: '',
		method: '',

		cateList: ProjectSetting.ACTIVITY_CATE,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		ProjectBiz.initPage(this);
	},

	bindSubmitTap: function (e) {
		if (this.data.cateId === '') return pageHelper.showModal('请选择活动类型~');
		if (this.data.method === '') return pageHelper.showModal('请选择活动方式~');
		wx.navigateTo({
		  url: '../add_two/activity_add_two',
		});
	},

	bindCateTap: function (e) {
		let cateId = pageHelper.dataset(e, 'cate');
		this.setData({ cateId });
	},

	bindMethodTap: function (e) {
		let method = pageHelper.dataset(e, 'method');
		this.setData({ method });
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


})