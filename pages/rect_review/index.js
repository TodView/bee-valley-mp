let beevalley = require("../../utils/beevalley.js");
let wxDraw = require("../../utils/wxdraw.min.js").wxDraw;
let Shape = require("../../utils/wxdraw.min.js").Shape;

Page({
  data: {
    currentWork: null,
    works: [],
    imgHeight: 0,
    imgWidth: 0,
    rectPosition: {},
    rectInitialized: false,
    showboxInfo: {}
  },

  clickIcon(e) {

    if (this.data.currentWork) {
      var info = ''

      this.data.currentWork.work.details.forEach(item => {
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

  showLoading: function () {
    wx.showLoading({
      title: "加载中",
      mask: true,
    });
    this.clearTimer();
  },

  clearTimer: function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  submitWork: function () {
    if (this.data.currentWork) {
      this.showLoading();
      let that = this;
      beevalley.submitReview(this.apitoken, this.data.currentWork.id, true, function (res) {
        if (beevalley.handleError(res)) {
          that.nextWork();
        }
      })
    }
  },

  rejectWork: function () {
    if (this.data.currentWork) {
      this.showLoading();
      let that = this;
      beevalley.submitReview(this.apitoken, this.data.currentWork.id, false, function (res) {
        if (beevalley.handleError(res)) {
          that.nextWork();
        }
      })
    }
  },

  cancelReview: function () {
    if (this.data.currentWork) {
      this.showLoading();
      let that = this;
      let deletedWorkId = this.data.currentWork.id;
      beevalley.cancelWork(that.apitoken, [deletedWorkId], function (res) {
        // TODO handle error
        that.nextWork();
      })
    }
  },

  nextWork: function () {

    if (this.rect) {
      this.rect.destroy();
      this.rect = null;
    }
    if (this.circle) {
      this.circle.destroy();
      this.circle = null;
    }
    let data = {};
    data['rectInitialized'] = false;
    data['rectPosition'] = {};
    data['showboxInfo'] = {};
    data['currentWork'] = null;

    let currentWorks = this.data.works;

    if (currentWorks.length > 0) {
      let candidate = currentWorks.pop();

      if (currentWorks.length > 0) {
        this.downloadWorkFile(currentWorks[currentWorks.length - 1]);
      }

      if (candidate.work) {
        data['rectPosition'] = {
          xMin: candidate.work.result[0][0].x - candidate.xOffset,
          yMin: candidate.work.result[0][0].y - candidate.yOffset,
          xMax: candidate.work.result[0][1].x - candidate.xOffset,
          yMax: candidate.work.result[0][1].y - candidate.yOffset
        };
        data['rectInitialized'] = true;
      }
      data['currentWork'] = candidate;
    } else {
      this.fetchWorks();
    }
    this.setData(data);

  },

  preprocessWork: function (work) {
    // console.log(work); 取方框的中心点作为剪切的依据
    let anchorX = Math.floor((work.work.result[0][1].x + work.work.result[0][0].x) / 2);
    let anchorY = Math.floor((work.work.result[0][1].y + work.work.result[0][0].y) / 2);

    let options = beevalley.calculateWorkarea(work.meta.imageWidth, work.meta.imageHeight, anchorX, anchorY, this.data.imageAreaWidth, this.data.imageAreaHeight);
    options['format'] = 'jpeg';

    work['xOffset'] = options.x;
    work['yOffset'] = options.y;
    work['anchorX'] = anchorX;
    work['anchorY'] = anchorY;
    work['downloadOptions'] = options;

    return work;
  },

  fetchWorks: function () {
    let that = this;

    beevalley.fetchAuditWorks(this.apitoken, 'rect', 3, this.packageId, function (res) {
      if (beevalley.handleError(res)) {
        let works = res.data;
        that.setData({
          works: works.map(w => that.preprocessWork(w))
        });
        if (works.length > 0) {
          // works.reverse().forEach(w => that.downloadWorkFile(w));
          that.downloadWorkFile(works[works.length - 1]);
          that.nextWork();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '暂时没有任务'
          })
        }
      }
    });

  },

  downloadWorkFile: function (work) {
    let that = this;
    // console.log(work.downloadOptions)
    beevalley.downloadAuditWorkFile(this.apitoken, work.id, work.downloadOptions, function (res) {
      if (beevalley.handleError(res)) {
        let imageSrc = 'data:image/jpeg;base64,' + wx.arrayBufferToBase64(res.data);

        if (that.data.currentWork && that.data.currentWork.id === work.id) {
          that.setData({
            'currentWork.src': imageSrc
          });
        } else {
          let foundIndex = that.data.works.findIndex(w => w.id === work.id);
          if (foundIndex >= 0) {
            let imageData = {};
            imageData['works[' + foundIndex + '].src'] = imageSrc;
            that.setData(imageData);
          }
        }
      }
    })

  },

  imageLoad: function (e) {
    let that = this;
    this.setData({
      imgHeight: e.detail.height,
      imgWidth: e.detail.width,
      imgRatio: 1
    });

    this.createAnchor();
    this.createRect();
    beevalley.renderRect(this.rect, this.data.rectPosition);
    beevalley.renderInfoBox(function (data) {
      that.setData(data);
    }, this.data.rectPosition, this.data.imageAreaHeight);

    this.clearTimer();
    this.timer = beevalley.startTimer(function (data) {
      that.setData(data);
    }, this.data.currentWork.expiredAt);
    wx.hideLoading();

  },

  createRect: function () {
    if (!this.rect) {
      var rect = new Shape('rect', {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        lineWidth: 2,
        lineCap: 'round',
        strokeStyle: "#339933",
      }, 'stroke', false);
      this.wxCanvas.add(rect);
      this.rect = rect;
    }
  },

  createAnchor: function () {
    if (!this.circle) {
      var circle = new Shape('circle', {
        x: (this.data.rectPosition.xMin + this.data.rectPosition.xMax) / 2,
        y: (this.data.rectPosition.yMin + this.data.rectPosition.yMax) / 2,
        r: 5,
        fillStyle: "#E6324B"
      });
      this.wxCanvas.add(circle);
      this.circle = circle;
    }

  },

  onLoad: function (options) {
    this.showLoading();
    this.apitoken = wx.getStorageSync('apitoken');
    let context = wx.createCanvasContext('rectAudit');
    this.wxCanvas = new wxDraw(context, 0, 0, 400, 500);

    let that = this;
    var query = wx.createSelectorQuery();
    query.select('.rectAudit').boundingClientRect()
    query.exec(function (res) {
      // console.log(res[0].width)
      // console.log(res);
      that.setData({
        imageAreaWidth: Math.floor(res[0].width),
        imageAreaHeight: Math.floor(res[0].height)
      });
      that.nextWork();
    })
    this.packageId = options.packageId;
  },

  onUnload: function () {
    this.clearTimer();
    this.wxCanvas.clear();
    var worksToCancel = this.data.works.map(w => w.id);
    if (this.data.currentWork) {
      worksToCancel.push(this.data.currentWork.id);
    }
    if (worksToCancel.length > 0) {
      beevalley.cancelWork(this.apitoken, worksToCancel, function (res) { })
    }
  },

  // handleError: function (res) {
  //   if (res.statusCode === 403) {
  //     // TODO handle error
  //     wx.showModal({
  //       title: '任务超时',
  //       content: '请稍后重试',
  //       showCancel: false,
  //       confirmText: "知道了",
  //       success: function() {
  //         wx.navigateBack({
  //           delta: 1
  //         })
  //       }
  //     })
  //   }
  // }

})