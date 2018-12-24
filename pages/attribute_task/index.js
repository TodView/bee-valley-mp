const beevalley = require("../../utils/beevalley.js");
Page({
  data: {
    modelHidden: false,
    currentWork: {}
  },

  showModel() {
    this.setData({
      modelHidden: true
    })

  },

  getfoucus(e) {
    let {
      attributes
    } = this.data.currentWork;

    attributes.forEach((v) => {
      if (v.displayName === e.detail.name) {
        v.show = true;
      } else {
        v.show = false;
      }
    })

    this.setData({
      "currentWork.attributes": attributes
    })
  },

  changeData(e) {
    let dependency = e.detail.dependency;
    let index = e.currentTarget.dataset.index;
    let selectIndex = e.detail.index;
    let value = e.detail.value;
    let id = e.detail.id;
    let attr = e.detail.attr;
    let {
      attributes
    } = this.data.currentWork;

    attributes[index].indexArray = selectIndex;
    attributes[index].value = value;
    attributes[index].show = false;
    this.setData({
      "currentWork.attributes": attributes
    })
    if (!dependency) {
      //let id = item.dataArray[selectIndex].id;
      let attrs = attributes.find((v) => v.dependency === attr).attr;

      beevalley.getAttribute(this.apitoken, this.data.currentWork.category, attrs, id, (res) => {
        if (beevalley.handleError(res)) {
          attributes.forEach((v, index) => {
            if (v.dependency === attr) {
              attributes[index].dataArray = res.data;
              attributes[index].indexArray = 0;
              attributes[index].value = '';
              this.setData({
                "currentWork.attributes": attributes
              })
            }
          })
        }

      })
    }
    //console.log(e)
  },

  submitWork() {
    let {
      currentWork
    } = this.data;

    if (this.data.displayTimer === "超时") {
      // this.showLoading();
      wx.showModal({
        title: '当前任务超时',
        mask: true,
        showCancel: false,
        confirmText: "知道了",
        success: function () {
          wx.navigateBack({
            delta: 1
          })
        }
      })
    } else {

      let result = [];
      currentWork.attributes.forEach((item) => {
        if (item.value) {
          result.push({
            attr: item.attr,
            value: item.dataArray[item.indexArray].value
          })
        }
      })
      if (result.length === currentWork.attributes.length) {
        beevalley.submitWork(this.apitoken, currentWork.id, result, (res) => {
          if (beevalley.handleError(res)) {
            this.setData({
              modelHidden: false,
              clear: true
            })
            wx.showToast({
              title: '提交成功',
              mask: true
            })
            this.nextWork();
          }
        })
      } else {
        wx.showModal({
          title: '请添写对应的属性',
          mask: true,
          showCancel: false,
          confirmText: "知道了"
        })
      }
    }


  },

  cancelWork() {
    if (this.data.currentWork) {
      wx.showLoading({
        title: "加载中",
        mask: true,
      })
      let deletedWorkId = this.data.currentWork.id;
      beevalley.cancelWork(this.apitoken, [deletedWorkId], (res) => {
        if (beevalley.handleError(res)) {
          this.nextWork();
        }
      })
    }
  },

  clickIcon() {
    if (this.data.currentWork) {
      var info = ''

      this.data.currentWork.details.forEach(item => {
        info += `• ${item}\r\n`
      })

      wx.showModal({
        title: '提示',
        content: info,
        showCancel: false,
        confirmText: "知道了"
      })
    }
  },

  imageLoad() {
    this.clearTimer();
    this.timer = beevalley.startTimer((data) => {
      this.setData(data);
    }, this.data.currentWork.expiredAt);
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  getSelect(work) {
    if (this.index === work.attributes.length) {
      this.setData({
        currentWork: work
      })
    } else {
      if (work.attributes[this.index].dependency) {
        this.index++;
        this.getSelect(work);
      } else {
        beevalley.getAttribute(this.apitoken, work.category, work.attributes[this.index].attr, false, (res) => {
          if (beevalley.handleError(res)) {
            work.attributes[this.index].dataArray = res.data;
            work.attributes[this.index].indexArray = 0;
            work.value = '';
            this.index++;
            this.getSelect(work);
          }
        })
      }
      // let id = work.attributes[this.index].dependency ? work.attributes.find((v) => v.attr === work.attributes[this.index].dependency).dataArray[0].id : false;

    }
  },

  fetchWorks() {
    beevalley.fetchWorks(this.apitoken, "attribute", 3, this.packageId, (res) => {
      if (beevalley.handleError(res)) {
        if (res.data.length === 0) {
          wx.hideLoading();
          wx.showModal({
            title: '抱歉',
            content: '暂时没有任务了',
            mask: true,
            showCancel: false,
            confirmText: "知道了",
            success: function () {
              wx.navigateBack({
                delta: 1
              })
            }
          })

        } else {
          this.work = res.data;
          this.nextWork();
        }
      }
    })
  },

  downloadWorkFile(work) {
    beevalley.downloadWorkFile(this.apitoken, work.id, null, (res4) => {
      if (beevalley.handleError(res4)) {
        work.src = res4.tempFilePath

        this.getSelect(work);
      }
      wx.hideLoading();
    })
  },

  nextWork() {
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    this.index = 0;

    if (this.work.length === 0) {
      this.fetchWorks();
    } else {
      let currentWork = this.work.pop();
      let work = {};
      work.id = currentWork.id;
      work.price = currentWork.price;
      work.details = currentWork.details;
      work.expiredAt = currentWork.expiredAt;
      work.attributes = currentWork.meta.attributes;
      work.category = currentWork.meta.category;
      work.description = currentWork.description;
      this.downloadWorkFile(work)
    }


  },

  onLoad(options) {
    this.packageId = options.packageId;
    this.index = 0;
    this.work = [];
    this.apitoken = wx.getStorageSync('apitoken');
    this.nextWork();

  },

  onUnload: function () {
    if (this.data.currentWork.id) {
      beevalley.cancelWork(this.apitoken, [this.data.currentWork.id], function (res) { })
    }
  },

  hideModel() {
    this.setData({
      modelHidden: false
    })
  }
})