const beevalley = require("../../utils/beevalley.js");
Page({
    data: {
        modelHidden: false,
        currentWork: {},
    },

    showModel() {
        this.setData({
            modelHidden: true
        })
    },

    changeData(e) {
        let dependency = e.detail.dependency;
        let index = e.currentTarget.dataset.index;
        let selectIndex = e.detail.index;
        let id = e.detail.id;
        let attr = e.detail.attr;
        let {
            attributes
        } = this.data.currentWork;

        attributes[index].indexArray = selectIndex;
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

    fetchWorks(){
        beevalley.fetchWorks(this.apitoken, "attribute", 3, this.packageId, (res) => {
            if (beevalley.handleError(res)) {
                if(res.data.length === 0){
                    wx.showToast({
                        title: '当前没有任务',
                        mask: true
                    })
                    wx.navigateBack({
                        delta: 1
                    })

                }else{
                    this.work = res.data;
                    this.nextWork();
                } 
            }
        })
    },

    downloadWorkFile(work){
        beevalley.downloadWorkFile(this.apitoken, work.id, null, (res4) => {
            if (beevalley.handleError(res4)) {
                work.src = res4.tempFilePath

                this.setData({
                    currentWork: work
                });
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

        if(this.work.length === 0){
            this.fetchWorks();
        }else{
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