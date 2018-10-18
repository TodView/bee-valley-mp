const app = getApp()
let beevalley = require("../../utils/beevalley.js");

Page({

  data: {
    authenticated: false
  },

  onLoad: function () {
    console.log("任务面板");

    let that = this;
    let apitoken = wx.getStorageSync('apitoken');
    this.setData({ apitoken: apitoken });
    this.fetchTaskTypes();

  },

  onShow: function () {
    // this.fetchTaskTypes();
  },

  onPullDownRefresh: function () {
    this.fetchTaskTypes();
  },

  fetchTaskTypes: function () {
    let that = this;
    beevalley.listAuthorizedWorkType(this.data.apitoken, function (res) {
      console.log(res)//等待后端改数据类型
      that.setData({ taskTypes: res.data });
      wx.stopPullDownRefresh();
    });
  },

  navToTask: function (e) {
    let taskType = e.currentTarget.dataset.tasktype;
    wx.navigateTo({
      url: "../" + taskType + "_task/index"
    })
  }

})