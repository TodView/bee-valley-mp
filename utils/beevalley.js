// common.js
// const dayjs = require('./dayjs.min.js');
const moment = require('./moment.min.js');

const TODVIEW_API_BASE_URL = 'https://api.todview.com/v1/';

function fetchWorks(token, type, num, packageId, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'works/fetch',
    method: 'POST',
    data: {
      'type': type,
      'num': num,
      'packages': [packageId]
    },
    header: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function downloadWorkFiles(token, workId, fileId, callback) {
  wx.downloadFile({
    url: `${TODVIEW_API_BASE_URL}works/${workId}/files/${fileId}?format=jpeg&thumbnail=true`,
    // method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token
    },
    // responseType: 'arraybuffer',
    success: wrap(callback)
  });
}

function downloadWorkFile(token, workId, options, callback) {
  wx.downloadFile({
    url: options ?
      `${TODVIEW_API_BASE_URL}works/${workId}/file?format=${options.format}&x=${options.x}&y=${options.y}&width=${options.width}&height=${options.height}`
      :
      `${TODVIEW_API_BASE_URL}works/${workId}/file`,
    //method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token
    },
    //responseType: 'arraybuffer',
    success: wrap(callback)
  });
}

function submitWork(token, workId, result, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'works',
    method: 'POST',
    data: {
      'id': workId,
      'result': result,
      'source': 'qts'
    },
    header: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function cancelWork(token, workIds, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'works/' + workIds.join(',') + '/cancel',
    method: 'DELETE',
    header: {
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function cancelReview(token, reviewIds, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'reviews/' + reviewIds.join(',') + '/cancel',
    method: 'DELETE',
    header: {
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function login(code, callback, encryptedData, iv, externalId) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'login/weixin_mp/' + code + '?app=qts' + ((encryptedData && iv) ? '&encryptedData=' + encodeURIComponent(encryptedData) + '&iv=' + encodeURIComponent(iv) + (externalId ? '&externalId=' + externalId : '') : ''),
    method: 'POST',
    success: wrap(callback)
  });
}

function listAuthorizedWorkType(token, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'works/authorizations',
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function getWorkHistory(token, nowTime, limit, callback) {
  wx.request({
    url: `${TODVIEW_API_BASE_URL}works/history/type/all/before/${nowTime}/limit/${limit}`,
    header: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    method: 'GET',
    success: wrap(callback)
  })
}

function wrap(callback) {
  return (res) => {
    handleError(res);
    callback(res);
  }
}

function handleError(res) {
  if (res.statusCode === 401) {
    wx.removeStorageSync('apitoken');
    wx.showModal({
      title: '重新登录',
      content: '登录过期，需要重新登录',
      showCancel: false,
      confirmText: "知道了",
      success: function () {
        wx.reLaunch({
          url: "../index/index"
        });
      }
    })
  } else if (res.statusCode === 500) {
    wx.showModal({
      title: '错误',
      content: '系统错误，请稍后重试',
      showCancel: false,
      confirmText: "知道了",
      success: function () {
        wx.reLaunch({
          url: "../index/index"
        });
      }
    })
  }
}

//audit 

function fetchAuditWorks(token, type, num, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'reviews/fetch',
    method: 'POST',
    data: {
      'type': type,
      'num': num
    },
    header: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function downloadAuditWorkFile(token, workId, options, callback) {
  wx.request({
    url: options ? `${TODVIEW_API_BASE_URL}reviews/${workId}/file?format=${options.format}&x=${options.x}&y=${options.y}&width=${options.width}&height=${options.height}` : `${TODVIEW_API_BASE_URL}reviews/${workId}/file`,
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token
    },
    responseType: 'arraybuffer',
    success: wrap(callback)
  });
}

function submitReview(token, workId, result, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'reviews',
    method: 'POST',
    data: {
      'id': workId,
      'result': result
    },
    header: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function listAuthorizedReviewsType(token, callback) {
  wx.request({
    url: TODVIEW_API_BASE_URL + 'reviews/authorized_types',
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function formatCountDown(expiredTime) {
  let now = new Date().getTime();
  // console.log('now: %s expiredTime: %s', now, expiredTime);
  var displayCountDown;
  if (expiredTime > now) {
    let millisToGo = expiredTime - now;
    let secondsToGo = Math.floor(millisToGo / 1000);
    let seconds = secondsToGo % 60;
    let minutes = parseInt(secondsToGo / 60);
    displayCountDown = minutes + ':' + (seconds >= 10 ? seconds : '0' + seconds);
  } else {
    displayCountDown = '超时';
  }
  return displayCountDown;
}

//common

function calculateWorkarea(imageWidth, imageHeight, anchorX, anchorY, windowWidth, windowHeight) {
  var x;
  if (anchorX < windowWidth / 2) {
    x = 0;
  } else if (anchorX > imageWidth - windowWidth / 2) {
    x = imageWidth - windowWidth;
  } else {
    x = anchorX - windowWidth / 2
  }
  var y;
  if (anchorY < windowHeight / 2) {
    y = 0;
  } else if (anchorY > imageHeight - windowHeight / 2) {
    y = imageHeight - windowHeight;
  } else {
    y = anchorY - windowHeight / 2
  }
  return { x: Math.floor(x), y: Math.floor(y), width: windowWidth, height: windowHeight };
}

function renderInfoBox(setData, rectPosition, imageAreaHeight) { //随方框的大小改变显示的位置
  if (rectPosition) {
    var top = 0;
    if ((rectPosition.yMin - 5 - 33) < 0) {
      if ((rectPosition.yMax + 5 + 33) > imageAreaHeight) {
        top = rectPosition.yMin + 20
      } else {
        top = rectPosition.yMax + 5;
      }
    } else {
      top = rectPosition.yMin - 10 - 33;
    }
    let boxWidth = Math.round(rectPosition.xMax - rectPosition.xMin);
    let boxHeight = Math.round(rectPosition.yMax - rectPosition.yMin);

    setData({
      showboxInfo: {
        boxWidth: boxWidth,
        boxHeight: boxHeight,
        top: top,
        left: rectPosition.xMin,
        width: 65,
        height: 33
      }
    })
  }
}

function startTimer(setData, expiredAt) {
  // console.log('expiredAt: %s', expiredAt);
  let expiredTime = moment(expiredAt, moment.ISO_8601).valueOf();
  return setInterval(function () {
    setData({
      displayTimer: formatCountDown(expiredTime)
    })
  }, 1000);
}

function renderRect(rect, rectPosition) {
  // console.log(this.data.rectPosition)
  if (rectPosition) {
    rect.updateOption({
      x: (rectPosition.xMin + rectPosition.xMax) / 2,
      y: (rectPosition.yMin + rectPosition.yMax) / 2,
      w: rectPosition.xMax - rectPosition.xMin,
      h: rectPosition.yMax - rectPosition.yMin
    });
  }
}

function workFile(token, workId, files, callback) {
  wx.uploadFile({
    url: TODVIEW_API_BASE_URL + 'works/files',
    filePath: files,
    formData: {
      workId: workId
    },
    name: "file",
    header: {
      // 'content-type': 'x-www-form-urlencoded',
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

function getAttribute(token, category, attribute, prerequisiteId, callback) {
  wx.request({
    url: prerequisiteId ? TODVIEW_API_BASE_URL + `categories/${category}/attributes/${attribute}?prerequisite=${prerequisiteId}` : TODVIEW_API_BASE_URL + `categories/${category}/attributes/${attribute}`,
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token
    },
    success: wrap(callback)
  });
}

// function getCarModel(token, id, callback) {
//   wx.request({
//     url: TODVIEW_API_BASE_URL + `categories/car/attributes/model?prerequisite=${id}`,
//     method: 'GET',
//     header: {
//       'Authorization': 'Bearer ' + token
//     },
//     success: wrap(callback)
//   });
// }

function handleError(res) {
  if (res.statusCode === 403) {
    wx.hideLoading()
    if (typeof res.data === 'object' && res.data.error && res.data.error.code === '20') {
      wx.showModal({
        title: '任务配额已用完',
        content: '请稍后重试',
        showCancel: false,
        confirmText: "知道了",
        success: function () {
          wx.navigateBack({
            delta: 1
          })
        }
      })
      return false
    } else {
      wx.showModal({
        title: '任务超时',
        content: '请稍后重试',
        showCancel: false,
        confirmText: "知道了",
        success: function () {
          wx.navigateBack({
            delta: 1
          })
        }
      })
      return false
    }
  } else if (res.statusCode !== 200) {
    wx.hideLoading()
    wx.showModal({
      title: '系统错误',
      content: '请稍后重试',
      showCancel: false,
      confirmText: "知道了",
      success: function () {
        wx.navigateBack({
          delta: 1
        })
      }
    })
    return false
  }
  return true
}

module.exports.fetchWorks = fetchWorks
exports.downloadWorkFile = downloadWorkFile
exports.submitWork = submitWork
exports.cancelWork = cancelWork
exports.login = login
exports.listAuthorizedWorkType = listAuthorizedWorkType
exports.getWorkHistory = getWorkHistory
exports.fetchAuditWorks = fetchAuditWorks
exports.downloadAuditWorkFile = downloadAuditWorkFile
exports.submitReview = submitReview
exports.cancelReview = cancelReview
exports.listAuthorizedReviewsType = listAuthorizedReviewsType
exports.calculateWorkarea = calculateWorkarea
exports.renderInfoBox = renderInfoBox
exports.startTimer = startTimer
exports.renderRect = renderRect
exports.workFile = workFile
exports.downloadWorkFiles = downloadWorkFiles
exports.getAttribute = getAttribute
exports.handleError = handleError
