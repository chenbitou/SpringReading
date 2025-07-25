/**
 * Notes: 活动模块业务逻辑
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2025-06-23 07:48:00 
 */

const BaseProjectService = require('./base_project_service.js');
const util = require('../../../framework/utils/util.js');

const dataUtil = require('../../../framework/utils/data_util.js');
const timeUtil = require('../../../framework/utils/time_util.js');
const ActivityModel = require('../model/activity_model.js');
const UserModel = require('../model/user_model.js');
const ActivityJoinModel = require('../model/activity_join_model.js');

class ActivityService extends BaseProjectService {

	// 获取当前活动状态
	getJoinStatusDesc(activity) {
		let timestamp = this._timestamp;

		if (activity.ACTIVITY_STATUS == 0)
			return '活动停止';
		else if (activity.ACTIVITY_STATUS == 8)
			return '审核未过，待修改';
		else if (activity.ACTIVITY_STATUS == 9)
			return '待审核';
		else if (activity.ACTIVITY_END <= timestamp)
			return '活动结束';
		else if (activity.ACTIVITY_STOP <= timestamp)
			return '报名结束';
		else if (activity.ACTIVITY_MAX_CNT > 0
			&& activity.ACTIVITY_JOIN_CNT >= activity.ACTIVITY_MAX_CNT)
			return '报名已满';
		else
			return '报名中';
	}

	/** 浏览信息 */
	async viewActivity(userId, id) {

		let fields = '*';

		let where = {
			_id: id,
			ACTIVITY_STATUS: ActivityModel.STATUS.COMM
		}
		let activity = await ActivityModel.getOne(where, fields);
		if (!activity) return null;

		ActivityModel.inc(id, 'ACTIVITY_VIEW_CNT', 1);

		// 判断是否有报名
		let whereJoin = {
			ACTIVITY_JOIN_USER_ID: userId,
			ACTIVITY_JOIN_ACTIVITY_ID: id,
			ACTIVITY_JOIN_STATUS: ['in', [ActivityJoinModel.STATUS.WAIT, ActivityJoinModel.STATUS.SUCC]]
		}
		let activityJoin = await ActivityJoinModel.getOne(whereJoin);
		if (activityJoin) {
			activity.myActivityJoinId = activityJoin._id;
			activity.myActivityJoinTag = (activityJoin.ACTIVITY_JOIN_STATUS == ActivityJoinModel.STATUS.WAIT) ? '待审核' : '已报名';
		}

		else {
			activity.myActivityJoinId = '';
			activity.myActivityJoinTag = '';
		}

		// 报名名单
		activity.ACTIVITY_USER_LIST = await this.getActivityJoinList(id);

		// 作者信息
		if (activity.ACTIVTY_TYPE = 1) {
			activity.author = await UserModel.getOne({ USER_MINI_OPENID: activity.ACTIVITY_USER_ID });
		}

		return activity;
	}

	/** 取得分页列表 */
	async getActivityList({
		method = 0,
		cateId, //分类查询条件
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序 
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ACTIVITY_ORDER': 'asc',
			'ACTIVITY_START': 'asc',
			'ACTIVITY_ADD_TIME': 'desc'
		};
		let fields = 'ACTIVITY_METHOD,ACTIVITY_ADDRESS,ACTIVITY_STOP,ACTIVITY_JOIN_CNT,ACTIVITY_OBJ,ACTIVITY_VIEW_CNT,ACTIVITY_TITLE,ACTIVITY_MAX_CNT,ACTIVITY_START_DAY,ACTIVITY_START,ACTIVITY_END,ACTIVITY_ORDER,ACTIVITY_STATUS,ACTIVITY_CATE_NAME,ACTIVITY_OBJ';

		let where = {};

		where = {
			ACTIVITY_METHOD: method,
		};
		if (cateId && cateId !== '0') where.ACTIVITY_CATE_ID = cateId;

		where.ACTIVITY_STATUS = ActivityModel.STATUS.COMM; // 状态  


		let type = '';
		if (util.isDefined(search) && search) {
			where['ACTIVITY_TITLE'] = ['like', search];

		} else if (sortType && util.isDefined(sortVal)) {

			// 搜索菜单
			switch (sortType) {
				case 'hot': {
					orderBy = {
						'ACTIVITY_JOIN_CNT': 'desc',
						'ACTIVITY_ORDER': 'asc',
						'ACTIVITY_START': 'desc',
						'ACTIVITY_ADD_TIME': 'desc'
					};
					break;
				}
				case 'cateId': {
					if (sortVal) where.ACTIVITY_CATE_ID = String(sortVal);
					break;
				}
				case 'sort': {
					// 排序
					orderBy = this.fmtOrderBySort(sortVal, 'ACTIVITY_ADD_TIME');
					break;
				}
				case 'run': { // 进行中
					let time = timeUtil.time('Y-M-D');
					where.ACTIVITY_START_DAY = ['>=', time];
					if (method == 0) where['ACTIVITY_OBJ.city'] = sortVal;
					type = 'run';
					break;
				}
				case 'his': {
					let time = timeUtil.time('Y-M-D');
					where.ACTIVITY_END_DAY = ['<', time];
					if (method == 0) where['ACTIVITY_OBJ.city'] = sortVal;
					type = 'his';
					orderBy = {
						'ACTIVITY_ORDER': 'asc',
						'ACTIVITY_START': 'desc',
						'ACTIVITY_ADD_TIME': 'desc'
					};
					break;
				}

			}
		}

		let ret = await ActivityModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
		if (type) ret.type = type;
		return ret;
	}


	/** 取得某一个报名分页列表 */
	async getActivityJoinList(activityId) {
		let page = 1;
		let size = 200;
		let isTotal = true;
		let oldTotal = 0;
		let orderBy = {
			'ACTIVITY_JOIN_ADD_TIME': 'desc'
		};
		let fields = 'user.USER_PIC,user.USER_NAME';

		let where = {
			ACTIVITY_JOIN_ACTIVITY_ID: activityId,
			ACTIVITY_JOIN_STATUS: ActivityModel.STATUS.COMM
		};

		let joinParams = {
			from: UserModel.CL,
			localField: 'ACTIVITY_JOIN_USER_ID',
			foreignField: 'USER_MINI_OPENID',
			as: 'user',
		};

		let result = await ActivityJoinModel.getListJoin(joinParams, where, fields, orderBy, page, size, isTotal, oldTotal);

		return result.list;
	}

	/** 取得我的报名分页列表 */
	async getMyActivityJoinList(userId, {
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序 
		page,
		size,
		isTotal = true,
		oldTotal
	}) {
		orderBy = orderBy || {
			'ACTIVITY_JOIN_ADD_TIME': 'desc'
		};
		let fields = 'ACTIVITY_JOIN_IS_CHECKIN,ACTIVITY_JOIN_REASON,ACTIVITY_JOIN_ACTIVITY_ID,ACTIVITY_JOIN_STATUS,ACTIVITY_JOIN_ADD_TIME,activity.ACTIVITY_END,activity.ACTIVITY_START,activity.ACTIVITY_TITLE';

		let where = {
			ACTIVITY_JOIN_USER_ID: userId
		};

		if (util.isDefined(search) && search) {
			where['activity.ACTIVITY_TITLE'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType) {
			// 搜索菜单
			switch (sortType) {
				case 'timedesc': { //按时间倒序
					orderBy = {
						'activity.ACTIVITY_START': 'desc',
						'ACTIVITY_JOIN_ADD_TIME': 'desc'
					};
					break;
				}
				case 'timeasc': { //按时间正序
					orderBy = {
						'activity.ACTIVITY_START': 'asc',
						'ACTIVITY_JOIN_ADD_TIME': 'asc'
					};
					break;
				}
				case 'succ': {
					where.ACTIVITY_JOIN_STATUS = ActivityJoinModel.STATUS.SUCC;
					break;
				}
				case 'wait': {
					where.ACTIVITY_JOIN_STATUS = ActivityJoinModel.STATUS.WAIT;
					break;
				}
				case 'cancel': {
					where.ACTIVITY_JOIN_STATUS = ActivityJoinModel.STATUS.ADMIN_CANCEL;
					break;
				}
			}
		}

		let joinParams = {
			from: ActivityModel.CL,
			localField: 'ACTIVITY_JOIN_ACTIVITY_ID',
			foreignField: '_id',
			as: 'activity',
		};

		let result = await ActivityJoinModel.getListJoin(joinParams, where, fields, orderBy, page, size, isTotal, oldTotal);

		return result;
	}

	/** 取得我的报名详情 */
	async getMyActivityJoinDetail(userId, activityJoinId) {

		let fields = '*';

		let where = {
			_id: activityJoinId,
			ACTIVITY_JOIN_USER_ID: userId
		};
		let activityJoin = await ActivityJoinModel.getOne(where, fields);
		if (activityJoin) {
			activityJoin.activity = await ActivityModel.getOne(activityJoin.ACTIVITY_JOIN_ACTIVITY_ID, 'ACTIVITY_TITLE,ACTIVITY_START,ACTIVITY_END');
		}
		return activityJoin;
	}

	//################## 报名 
	// 报名 
	async activityJoin(userId, activityId, forms) {



	}


	async statActivityJoin(id) {
		// 报名数
		let where = {
			ACTIVITY_JOIN_ACTIVITY_ID: id,
			ACTIVITY_JOIN_STATUS: ['in', [ActivityJoinModel.STATUS.WAIT, ActivityJoinModel.STATUS.SUCC]]
		}
		let cnt = await ActivityJoinModel.count(where);


		// 用户列表
		where = {
			ACTIVITY_JOIN_ACTIVITY_ID: id,
			ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.SUCC
		}
		let joinParams = {
			from: UserModel.CL,
			localField: 'ACTIVITY_JOIN_USER_ID',
			foreignField: 'USER_MINI_OPENID',
			as: 'user',
		};
		let orderBy = {
			ACTIVITY_JOIN_ADD_TIME: 'desc'
		}
		let list = await ActivityJoinModel.getListJoin(joinParams, where, 'ACTIVITY_JOIN_ADD_TIME,user.USER_MINI_OPENID,user.USER_NAME,user.USER_PIC', orderBy, 1, 6, false, 0);
		list = list.list;

		for (let k = 0; k < list.length; k++) {
			list[k] = list[k].user;
		}

		await ActivityModel.edit(id, { ACTIVITY_JOIN_CNT: cnt, ACTIVITY_USER_LIST: list });
	}

	/**  报名前获取关键信息 */
	async detailForActivityJoin(userId, activityId) {
		let fields = 'ACTIVITY_OBJ,ACTIVITY_JOIN_FORMS, ACTIVITY_TITLE';

		let where = {
			_id: activityId,
			ACTIVITY_STATUS: ActivityModel.STATUS.COMM
		}
		let activity = await ActivityModel.getOne(where, fields);
		if (!activity)
			this.AppError('该活动不存在');


		// 取出本人最近一次的填写表单

		let whereMy = {
			ACTIVITY_JOIN_USER_ID: userId,
		}
		let orderByMy = {
			ACTIVITY_JOIN_ADD_TIME: 'desc'
		}
		let joinMy = await ActivityJoinModel.getOne(whereMy, 'ACTIVITY_JOIN_FORMS', orderByMy);


		let myForms = joinMy ? joinMy.ACTIVITY_JOIN_FORMS : [];

		let user = await UserModel.getOne({ USER_MINI_OPENID: userId, USER_STATUS: UserModel.STATUS.COMM });
		if (!user) this.AppError('用户异常');

		// 取得我的报名信息
		myForms = [
			{ mark: 'name', type: 'text', title: '姓名', val: user.USER_NAME },
			{ mark: 'phone', type: 'mobile', title: '微信号', val: user.USER_MOBILE },
		]


		activity.myForms = myForms;

		return activity;
	}

	/** 取消我的报名 只有成功和待审核可以取消 取消即为删除记录 */
	async cancelMyActivityJoin(userId, activityJoinId) {
		let where = {
			ACTIVITY_JOIN_USER_ID: userId,
			_id: activityJoinId,
			ACTIVITY_JOIN_STATUS: ['in', [ActivityJoinModel.STATUS.WAIT, ActivityJoinModel.STATUS.SUCC]]
		};
		let activityJoin = await ActivityJoinModel.getOne(where);

		if (!activityJoin) {
			this.AppError('未找到可取消的报名记录');
		}

		if (activityJoin.ACTIVITY_JOIN_IS_CHECKIN == 1)
			this.AppError('该活动已经签到，无法取消');

		let activity = await ActivityModel.getOne(activityJoin.ACTIVITY_JOIN_ACTIVITY_ID);
		if (!activity)
			this.AppError('该活动不存在');

		if (activity.ACTIVITY_END <= this._timestamp)
			this.AppError('该活动已经结束，无法取消');

		if (activity.ACTIVITY_CANCEL_SET == 0)
			this.AppError('该活动不能取消');

		if (activity.ACTIVITY_CANCEL_SET == 2 && activity.ACTIVITY_STOP < this._timestamp)
			this.AppError('该活动已经截止报名，不能取消');

		await ActivityJoinModel.del(where);

		// 统计
		await this.statActivityJoin(activityJoin.ACTIVITY_JOIN_ACTIVITY_ID);
	}


	/** 用户自助签到 */
	async myJoinSelf(userId, activityId) {
		let activity = await ActivityModel.getOne(activityId);
		if (!activity)
			this.AppError('活动不存在或者已经关闭');

		let day = timeUtil.timestamp2Time(activity.ACTIVITY_START, 'Y-M-D');

		let today = timeUtil.time('Y-M-D');
		if (day != today)
			this.AppError('仅在活动当天可以签到，当前签到码的日期是' + day);

		let whereSucc = {
			ACTIVITY_JOIN_USER_ID: userId,
			ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.SUCC
		}
		let cntSucc = await ActivityJoinModel.count(whereSucc);

		let whereCheckin = {
			ACTIVITY_JOIN_USER_ID: userId,
			ACTIVITY_JOIN_IS_CHECKIN: 1,
			ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.SUCC
		}
		let cntCheckin = await ActivityJoinModel.count(whereCheckin);

		let ret = '';
		if (cntSucc == 0) {
			ret = '您没有本次活动报名成功的记录，请在「个人中心 - 我的活动报名」查看详情~';
		} else if (cntSucc == cntCheckin) {
			// 同一活动多次报名的情况
			ret = '您已签到，无须重复签到，请在「个人中心 - 我的活动报名」查看详情~';
		} else {
			let where = {
				ACTIVITY_JOIN_USER_ID: userId,
				ACTIVITY_JOIN_IS_CHECKIN: 0,
				ACTIVITY_JOIN_STATUS: ActivityJoinModel.STATUS.SUCC
			}
			let data = {
				ACTIVITY_JOIN_IS_CHECKIN: 1,
				ACTIVITY_JOIN_CHECKIN_TIME: this._timestamp,
			}
			await ActivityJoinModel.edit(where, data);
			ret = '签到成功，请在「个人中心 - 我的活动报名」查看详情~'
		}
		return {
			ret
		};
	}

	/** 按天获取报名项目 */
	async getActivityListByDay(day) {
		let start = timeUtil.time2Timestamp(day);
		let end = start + 86400 * 1000 - 1;
		let where = {
			ACTIVITY_STATUS: ActivityModel.STATUS.COMM,
			ACTIVITY_START: ['between', start, end],
		};

		let orderBy = {
			'ACTIVITY_ORDER': 'asc',
			'ACTIVITY_ADD_TIME': 'desc'
		};

		let fields = 'ACTIVITY_TITLE,ACTIVITY_START,ACTIVITY_OBJ.cover';

		let list = await ActivityModel.getAll(where, fields, orderBy);

		let retList = [];

		for (let k = 0; k < list.length; k++) {

			let node = {};
			node.timeDesc = timeUtil.timestamp2Time(list[k].ACTIVITY_START, 'h:m');
			node.title = list[k].ACTIVITY_TITLE;
			node.pic = list[k].ACTIVITY_OBJ.cover[0];
			node._id = list[k]._id;
			retList.push(node);

		}
		return retList;
	}

	/**
	 * 获取从某天开始可报名的日期
	 * @param {*} fromDay  日期 Y-M-D
	 */
	async getActivityHasDaysFromDay(fromDay) {
		let where = {
			ACTIVITY_START: ['>=', timeUtil.time2Timestamp(fromDay)],
		};

		let fields = 'ACTIVITY_START';
		let list = await ActivityModel.getAllBig(where, fields);

		let retList = [];
		for (let k = 0; k < list.length; k++) {
			let day = timeUtil.timestamp2Time(list[k].ACTIVITY_START, 'Y-M-D');
			if (!retList.includes(day)) retList.push(day);
		}
		return retList;
	}


}

module.exports = ActivityService;