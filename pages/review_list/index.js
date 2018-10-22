const app = getApp()
let beevalley = require("../../utils/beevalley.js");

Page({

  data: {
    authenticated: false
  },

  onLoad: function () {
    console.log("审核面板");

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
    beevalley.listAuthorizedReviewsType(this.data.apitoken, function (res) {
      console.log(res)
      if (res.statusCode === 200) {
        that.setData({ taskTypes: res.data });
      } else {
        that.setData({ taskTypes: [] });
      }      
      wx.stopPullDownRefresh();
    });
  },

  navToTask: function (e) {
    let taskType = e.currentTarget.dataset.tasktype;
    wx.navigateTo({
      url: "../" + taskType + "_review/index"
    })
  }

})