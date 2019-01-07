//index.js
//获取应用实例
let wxDraw = require("../../utils/wxdraw.min.js").wxDraw;
let Shape = require("../../utils/wxdraw.min.js").Shape;
let beevalley = require("../../utils/beevalley.js");

Page({

  data: {
    currentWork: null,
    works: [],
    imgHeight: 0,
    imgWidth: 0,
    rectPosition: {},
    rectInitialized: false,
    showboxInfo: {},
    ratio: 1
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

  isValidRect: function (anchorX, anchorY, xOffset, yOffset, rectPosition, ratio) {
    var relativeAnchorX = (anchorX - xOffset) / ratio;
    var relativeAnchorY = (anchorY - yOffset) / ratio;
    return relativeAnchorX > rectPosition.xMin && relativeAnchorX < rectPosition.xMax && relativeAnchorY > rectPosition.yMin && relativeAnchorY < rectPosition.yMax
  },

  submitWork: function (e) {
    if (this.data.rectInitialized && this.data.currentWork) {
      let that = this;
      let item = this.data.currentWork;
      let { ratio } = this.data;
      // var relativeAnchorX = (item.anchorX - item.xOffset) / ratio;
      // var relativeAnchorY = (item.anchorY - item.yOffset) / ratio;
      if (!item.anchorX || this.isValidRect(item.anchorX, item.anchorY, item.xOffset, item.yOffset, this.data.rectPosition, ratio)) {
        this.showLoading();
        // adjust for stroke width
        beevalley.submitWork(
          this.apitoken,
          item.id, [
            [{
              x: item.xOffset + Math.floor(this.data.rectPosition.xMin * ratio),
              y: item.yOffset + Math.floor(this.data.rectPosition.yMin * ratio)
            },
            {
              x: item.xOffset + Math.floor(this.data.rectPosition.xMax * ratio),
              y: item.yOffset + Math.floor(this.data.rectPosition.yMax * ratio)
            }]
          ],
          function (res) {
            if (beevalley.handleError(res)) {
              that.nextWork();
            }
          });
      }
    }
  },

  cancelWork: function (e) {
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

  showLoading: function () {
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    this.clearTimer();
  },

  clearTimer: function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
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
    data['ratio'] = 1;

    let currentWorks = this.data.works;

    if (currentWorks.length > 0) {
      let candidate = currentWorks.pop();

      if (currentWorks.length > 0) {
        this.downloadWorkFile(currentWorks[currentWorks.length - 1]);
      }

      if (candidate.previousWork) {
        let { ratio } = this.data;
        data['rectPosition'] = {
          xMin: (candidate.previousWork.result[0][0].x - candidate.xOffset) / ratio,
          yMin: (candidate.previousWork.result[0][0].y - candidate.yOffset) / ratio,
          xMax: (candidate.previousWork.result[0][1].x - candidate.xOffset) / ratio,
          yMax: (candidate.previousWork.result[0][1].y - candidate.yOffset) / ratio
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

    work['xOffset'] = 0;
    work['yOffset'] = 0;

    let anchorX = 0;
    let anchorY = 0;

    if (work.prerequisites) {
      anchorX = Math.floor(work.prerequisites[0].result[work.meta.index].x);
      anchorY = Math.floor(work.prerequisites[0].result[work.meta.index].y);
    }

    let { ratio } = this.data;
    let options = beevalley.calculateWorkarea(work.meta.imageWidth, work.meta.imageHeight, anchorX, anchorY, Math.round(this.data.imageAreaWidth * ratio), Math.round(this.data.imageAreaHeight * ratio));
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

    beevalley.fetchWorks(this.apitoken, 'rect', 3, this.packageId, function (res) {
      if (beevalley.handleError(res)) {
        let works = res.data;
        that.setData({
          works: works.map(w => that.preprocessWork(w))
        });
        if (works.length > 0) {
          that.downloadWorkFile(works[works.length - 1]);
          that.nextWork();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '暂时没有任务',
          })
        }
      }
    });

  },

  downloadWorkFile: function (work) {
    let that = this;

    beevalley.downloadWorkFile(this.apitoken, work.id, work.downloadOptions, function (res) {
      if (beevalley.handleError(res)) {
        // let imageSrc = 'data:image/jpeg;base64,' + wx.arrayBufferToBase64(res.data);

        if (that.data.currentWork && that.data.currentWork.id === work.id) {
          that.setData({
            'currentWork.src': res.tempFilePath
          });
        } else {
          let foundIndex = that.data.works.findIndex(w => w.id === work.id);
          if (foundIndex >= 0) {
            let imageData = {};
            imageData['works[' + foundIndex + '].src'] = res.tempFilePath;
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

    this.createAnchor(e.currentTarget.dataset.imgid);
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

  createAnchor: function (id) {
    if (this.data.currentWork.prerequisites && this.data.currentWork.id === id && !this.circle) {
      let { ratio } = this.data;
      var circle = new Shape('circle', {
        x: (this.data.currentWork.anchorX - this.data.currentWork.xOffset) / ratio,
        y: (this.data.currentWork.anchorY - this.data.currentWork.yOffset) / ratio,
        r: 5,
        fillStyle: "#E6324B"
      });
      this.wxCanvas.add(circle);
      this.circle = circle;
    }
  },

  startBoxInfoRefresher: function () {
    let that = this;
    clearInterval(this.boxRefresher);
    this.boxRefresher = setInterval(function () {
      beevalley.renderInfoBox(function (data) {
        that.setData(data);
      }, that.data.rectPosition, that.data.imageAreaHeight);
    }, 250);
  },

  stopBoxInfoRefresher: function () {
    clearInterval(this.boxRefresher);
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

  initializeRectPosition: function (x, y) {
    if (x > this.data.rectPosition.xMin) {
      this.data.rectPosition.xMax = x;
    } else {
      this.data.rectPosition.xMax = this.data.rectPosition.xMin;
      this.data.rectPosition.xMin = x;
    }
    if (y > this.data.rectPosition.yMin) {
      this.data.rectPosition.yMax = y;
    } else {
      this.data.rectPosition.yMax = this.data.rectPosition.yMin;
      this.data.rectPosition.yMin = y;
    }
  },

  adjustRectPosition: function (x, y) {
    if (this.touchStartPosition) {
      let deltaXmin = Math.abs(x - this.data.rectPosition.xMin);
      let deltaXmax = Math.abs(x - this.data.rectPosition.xMax);
      let deltaYmin = Math.abs(y - this.data.rectPosition.yMin);
      let deltaYmax = Math.abs(y - this.data.rectPosition.yMax);
      if (this.data.rectPosition.yMin < y && this.data.rectPosition.yMax > y) {
        if (deltaXmax < deltaXmin) {
          this.data.rectPosition.xMax += (x - this.touchStartPosition.x);
        } else {
          this.data.rectPosition.xMin += (x - this.touchStartPosition.x);
        }
      }
      if (this.data.rectPosition.xMin < x && this.data.rectPosition.xMax > x) {
        if (deltaYmax < deltaYmin) {
          this.data.rectPosition.yMax += (y - this.touchStartPosition.y);
        } else {
          this.data.rectPosition.yMin += (y - this.touchStartPosition.y);
        }
      }
      this.touchStartPosition.x = x;
      this.touchStartPosition.y = y;
    }
  },

  bindtouchstart: function (e) {
    this.wxCanvas.touchstartDetect(e);
    if (e.touches[0].x < 0 || e.touches[0].y < 0 || e.touches[0].x > this.data.imgWidth || e.touches[0].y > this.data.imgHeight) {
      return;
    }
    if (!this.data.rectInitialized) {
      this.data.rectPosition.xMin = Math.floor(e.touches[0].x);
      this.data.rectPosition.yMin = Math.floor(e.touches[0].y);
    }
    this.startBoxInfoRefresher();
    this.touchStartPosition = { x: Math.floor(e.touches[0].x), y: Math.floor(e.touches[0].y) };
  },

  bindtouchmove: function (e) {
    this.wxCanvas.touchmoveDetect(e);

    if (e.touches[0].x < 0 || e.touches[0].y < 0 || e.touches[0].x > this.data.imgWidth || e.touches[0].y > this.data.imgHeight) {
      return;
    }

    if (!this.data.rectInitialized) {
      this.initializeRectPosition(Math.floor(e.touches[0].x), Math.floor(e.touches[0].y));
    } else {
      this.adjustRectPosition(Math.floor(e.touches[0].x), Math.floor(e.touches[0].y));
    }
    beevalley.renderRect(this.rect, this.data.rectPosition);
  },

  bindtouchend: function (e) {
    this.wxCanvas.touchendDetect();
    if (!this.data.rectInitialized) {
      if (this.data.rectPosition.xMin < this.data.rectPosition.xMax && this.data.rectPosition.yMin < this.data.rectPosition.yMax) {
        this.setData({
          rectInitialized: true
        });
      }
    }
    this.stopBoxInfoRefresher();
    this.touchStartPosition = null;
  },

  bindtap: function (e) {
    this.wxCanvas.tapDetect(e);
  },

  bindlongpress: function (e) {
    this.wxCanvas.longpressDetect(e);
  },

  onLoad: function (options) {
    this.showLoading()
    this.apitoken = wx.getStorageSync('apitoken');
    let context = wx.createCanvasContext('rectTask');
    this.wxCanvas = new wxDraw(context, 0, 0, 400, 500);
    let that = this;
    var query = wx.createSelectorQuery();
    query.select('.imglab').boundingClientRect()
    query.exec(function (res) {
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
  //       success: function () {
  //         wx.navigateBack({
  //           delta: 1
  //         })
  //       }
  //     })
  //   }
  // },

  lessRatio: function () {
    let { currentWork, ratio } = this.data;
    if (ratio <= 1) {
      wx.showToast({
        title: '不能继续缩小'
      })
    } else {
      ratio -= 0.5;
      this.setData({
        ratio: ratio
      }, () => {
        this.preprocessWork(currentWork)
        this.downloadWorkFile(currentWork)

        this.updateCircle();

        if (currentWork.previousWork) {
          let rectData = {
            xMin: (currentWork.previousWork.result[0][0].x - currentWork.xOffset) / ratio,
            yMin: (currentWork.previousWork.result[0][0].y - currentWork.yOffset) / ratio,
            xMax: (currentWork.previousWork.result[0][1].x - currentWork.xOffset) / ratio,
            yMax: (currentWork.previousWork.result[0][1].y - currentWork.yOffset) / ratio
          };
          this.data.rectInitialized = true;

          this.data.rectPosition = rectData;
        }

        beevalley.renderRect(this.rect, this.data.rectPosition);
      })
    }
  },

  addRatio: function () {
    let { currentWork, ratio, imageAreaWidth, imageAreaHeight } = this.data;
    let newRatio = ratio + 0.5;
    if (imageAreaWidth * newRatio > currentWork.meta.imageWidth || imageAreaHeight * newRatio > currentWork.meta.imageHeight) {
      wx.showToast({
        title: '不能继续放大'
      })
    } else {
      ratio = newRatio;
      this.setData({
        ratio: ratio
      }, () => {

        this.preprocessWork(currentWork)
        this.downloadWorkFile(currentWork)

        this.updateCircle();

        if (currentWork.previousWork) {
          let rectData = {
            xMin: (currentWork.previousWork.result[0][0].x - currentWork.xOffset) / ratio,
            yMin: (currentWork.previousWork.result[0][0].y - currentWork.yOffset) / ratio,
            xMax: (currentWork.previousWork.result[0][1].x - currentWork.xOffset) / ratio,
            yMax: (currentWork.previousWork.result[0][1].y - currentWork.yOffset) / ratio
          };
          this.data.rectInitialized = true;

          this.data.rectPosition = rectData;
        }

        beevalley.renderRect(this.rect, this.data.rectPosition);
      })
    }
  },

  updateCircle: function () {
    let { ratio, currentWork } = this.data;
    if (currentWork.anchorX) {
      this.circle.updateOption({
        x: (currentWork.anchorX - currentWork.xOffset) / ratio,
        y: (currentWork.anchorY - currentWork.yOffset) / ratio,
      })
    }
  }
})