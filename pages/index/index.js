const app = getApp()
const beevalley = require("../../utils/beevalley.js");
const moment = require('../../utils/moment.min.js');
const base64 = require('../../utils/base64.min.js');

Page({

  data: {
  },

  jwtDecode: function (token) {
    let str = token.split('.')[1];
    return JSON.parse(base64.decode(str));
  },

  isJwtExpired: function (jwtToken) {
    let decoded = this.jwtDecode(jwtToken);
    let exp = moment.unix(decoded.exp);
    return moment().isAfter(exp);
  },

  onLoad: function () {
    wx.showLoading({
      title: "登录中",
      mask: true,
    })
    console.log("index");
    let that = this;
    let apitoken = wx.getStorageSync('apitoken');
    console.log(apitoken)
    if (!apitoken || this.isJwtExpired(apitoken)) {
      wx.login({
        success: function (res) {
          if (res.code) {
            beevalley.login(res.code, function (res) {
              if (res.statusCode === 200) {
                let token = res.data;
                that.handleSuccessLogin(token);
              } else if (res.statusCode === 403) {
                wx.getUserInfo({
                  withCredentials: true,
                  success: that.bindGetUserInfo,
                  fail: function () {
                    that.setData({ requiredAuth: true });
                    wx.hideLoading();
                  }
                });
              }
            });
          }
        }
      });
    } else {
      this.getNicknameAndAvatar();
      this.setData({ requiredAuth: false });
      wx.hideLoading();
    }
  },

  getNicknameAndAvatar() {
    let that = this;
    wx.getUserInfo({
      success: function (e) {
        // console.log(e);
        that.setData({ nickname: e.userInfo.nickName, avatarUrl: e.userInfo.avatarUrl });
      }
    });
  },

  bindGetUserInfoButton(e) {
    this.bindGetUserInfo(e.detail);
  },

  bindGetUserInfo(e) {

    // console.log(e.detail.userInfo)
    let that = this;
    wx.login({
      success: function (res) {
        if (res.code) {
          // console.log(res.code);
          beevalley.login(res.code, function (res) {
            if (res.statusCode === 200) {
              let token = res.data;
              that.handleSuccessLogin(token);
            } else if (res.statusCode === 403) {
              that.setData({ requiredAuth: true });
            }
          }, e.encryptedData, e.iv);
        }
      }
    });

  },

  handleSuccessLogin(token) {
    let that = this;
    wx.setStorage({
      key: 'apitoken', data: token, success: function () {
        that.getNicknameAndAvatar();
        that.setData({ requiredAuth: false });
        wx.hideLoading();
      }
    });
  },

  intoChoose: function () {
    wx.navigateTo({
      url: "../task_list/index"
    })
  },

  intoList: function () {
    wx.navigateTo({
      url: '../table/index'
    })
  },

  intoAuditChoose: function () {
    wx.navigateTo({
      url: '../review_list/index'
    })
  }

})