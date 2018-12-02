const app = getApp()
let beevalley = require("../../utils/beevalley.js");

Page({

  data: {
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
    
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    
    let that = this;
    beevalley.listAuthorizedReviewsType(this.data.apitoken, function (res) {
      if (res.statusCode === 200) {
        that.setData({ taskTypes: res.data });
      } else {
        that.setData({ taskTypes: [] });
      }      
      wx.stopPullDownRefresh();
      wx.hideLoading();
    });
  },

  navToTask: function (e) {
    this.taskType = e.currentTarget.dataset.tasktype;
    this.packageId = e.currentTarget.dataset.packageid;

    // Display only rect type for QTS
    if (this.taskType === 'rect') {
      wx.navigateTo({
        url: "../" + this.taskType + "_review/index?packageId=" + this.packageId
      })
    }

  }

})