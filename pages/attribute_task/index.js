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

    bindPickerChange(e) {
        let item = e.currentTarget.dataset.item;
        let index = e.currentTarget.dataset.index;
        let selectIndex = e.detail.value;
        let {
            attributes
        } = this.data.currentWork;

        attributes[index].indexArray = selectIndex;
        this.setData({
            "currentWork.attributes": attributes
        })
        if (!item.dependency) {
            let id = item.dataArray[selectIndex].id;
            let attr = attributes.find((v) => v.dependency === item.attr).attr;
            beevalley.getAttribute(this.apitoken, this.data.currentWork.category, attr, id, (res) => {
                if (beevalley.handleError(res)) {
                    attributes.forEach((v, index) => {
                        if (v.dependency === item.attr) {
                            attributes[index].dataArray = res.data;
                            attributes[index].indexArray = 0;
                            this.setData({
                                "currentWork.attributes": attributes
                            })
                        }
                    })
                }

            })
        }
    },

    submitWork() {
        let {
            currentWork
        } = this.data;
        if (this.data.displayTimer === "超时") {
            this.showLoading();
            wx.navigateBack({
                delta: 1
            })
        } else {
            let result = [];
            currentWork.attributes.forEach((item) => {
                result.push({
                    attr: item.attr,
                    value: item.dataArray[item.indexArray].value
                })
            })
            beevalley.submitWork(this.apitoken, currentWork.id, result, (res) => {
                if (beevalley.handleError(res)) {
                    this.setData({
                        modelHidden: false
                    })
                    wx.showToast({
                        title: '提交成功',
                        mask: true
                    })
                    this.nextWork();
                }
            })
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
            let id = work.attributes[this.index].dependency ? work.attributes.find((v) => v.attr === work.attributes[this.index].dependency).dataArray[0].id : false;

            beevalley.getAttribute(this.apitoken, work.category, work.attributes[this.index].attr, id, (res) => {
                if (beevalley.handleError(res)) {
                    work.attributes[this.index].dataArray = res.data;
                    work.attributes[this.index].indexArray = 0;
                    this.index++;
                    this.getSelect(work);
                }
            })
        }
    },

    nextWork() {
        wx.showLoading({
            title: "加载中",
            mask: true,
        })
        this.index = 0;
        this.setData({
            currentWork: {}
        })
        beevalley.fetchWorks(this.apitoken, "attribute", 1, this.packageId, (res) => {
            if (beevalley.handleError(res)) {
                let work = {};
                work.id = res.data[0].id;
                work.price = res.data[0].price;
                work.details = res.data[0].details;
                work.expiredAt = res.data[0].expiredAt;
                work.attributes = res.data[0].meta.attributes;
                work.category = res.data[0].meta.category;

                beevalley.downloadWorkFile(this.apitoken, work.id, {}, (res4) => {
                    if (beevalley.handleError(res4)) {
                        work.src = 'data:image/jpeg;base64,' + wx.arrayBufferToBase64(res4.data)

                        this.setData({
                            currentWork: work
                        });
                        this.getSelect(work);
                    }
                    wx.hideLoading();
                })
            }
        })
    },

    onLoad(options) {
        this.packageId = options.packageId;
        this.index = 0;
        this.apitoken = wx.getStorageSync('apitoken');
        this.nextWork();

    },

    hideModel() {
        this.setData({
            modelHidden: false
        })
    }
})