let beevalley = require("../../utils/beevalley.js");
const priceRatio = getApp().globalData.priceRatio

Page({
  data: {
  },

  groupBy: function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  },

  getTypeDisplay: function (taskType) {
    if (taskType === 'rect') {
      return '方框';
    } else if (taskType === 'collect') {
        return '采集';
    } else {
      return '未知';
    }
  },

  setWorkHistoryData: function (responData) {

    // TODO Show only rect type task for now
    let records = [],
      displayTypes = ['rect', 'collect'],
      // count = 1,
      groups = this.groupBy(responData, 'pack'),
      sortedKeys = Object.keys(groups).sort();

    for (var idx in sortedKeys) {
      if (groups.hasOwnProperty(sortedKeys[idx])) {
        for (var i in displayTypes) {
          let taskType = displayTypes[i],
            group = groups[sortedKeys[idx]].filter(r => r.type === taskType),
            approved = group.filter(r => r.reviewResult === true),
            rejected = group.filter(r => r.reviewResult === false);

          if (group.length > 0) {
            records.push({
              title: group[0].packageName + '(' + this.getTypeDisplay(taskType) + ')',
              total: group.length,
              approved: approved.length,
              rejected: rejected.length,
              reward: approved.reduce((sum, record) => sum + record.price * priceRatio, 0).toFixed(2)
            })
            // count++;
          }
        }

      }
    }

    this.setData({
      records: records
    })

    wx.hideLoading();
  },

  onLoad: function () {

    wx.showLoading({
      title: "加载中",
      mask: true,
    })

    var nowTime = new Date().getTime();
    var token = wx.getStorageSync('apitoken');
    var that = this;

    beevalley.getWorkHistory(token, nowTime, 10000, (res) => {
      that.setWorkHistoryData(res.data);
    })

  }

})