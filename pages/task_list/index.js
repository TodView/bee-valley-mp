const app = getApp()
let beevalley = require("../../utils/beevalley.js");

Page({

  data: {
    authenticated: false
  },

  onLoad: function () {
    console.log("任务面板");

    // TODO load task list dynamically

    let that = this;
    let apitoken = wx.getStorageSync('apitoken');
    if (!apitoken) {
      wx.login({
        success: function (res) {
          if (res.code) {
            console.log(res.code);
            beevalley.login(res.code, function (res) {
              if (res.statusCode === 200) {
                let token = res.data;
                wx.setStorage({
                  key: 'apitoken', data: token, success: function () {
                    that.setData({ authenticated: true });
                  }
                });
              }
            });
          }
        }
      });
    } else {
      this.setData({ authenticated: true });
    }

  },

  onShow: function () {
    this.fetchTaskTypes();
  },

  onPullDownRefresh: function () {
    this.fetchTaskTypes();
  },

  fetchTaskTypes: function () {
    let apitoken = wx.getStorageSync('apitoken');
    if (apitoken) {
      let that = this;
      beevalley.listAuthorizedWorkType(apitoken, function (res) {
        that.setData({ taskTypes: res.data });
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  navToRectTask: function (e) {
    let taskType = e.currentTarget.dataset.tasktype;
    wx.navigateTo({
      url: "../" + taskType + "_task/index"
    })
  }

})