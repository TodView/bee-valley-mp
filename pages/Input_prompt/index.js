Component({
  properties: {
    data: {
      type: Object,
      value: {}
    },
  },
  data: {
    userData: []
  },

  detached() {
    this.setData({
      value: ''
    })
  },


  methods: {
    getFocus(e) {
      this.setData({
        userData: this.data.data.dataArray
      })
      this.triggerEvent('onFocus', { name: e.target.dataset.name })

    },

    select(e) {
      let dependency = this.data.data.dependency ? this.data.data.dependency : false;
      this.data.data.dataArray.forEach((v, index) => {
        if (v.value === e.target.dataset.select.value) {
          this.triggerEvent('changeData', {
            id: e.target.dataset.select.id,
            index: index,
            dependency: dependency,
            attr: this.data.data.attr,
            value: e.target.dataset.select.value
          });
        }
      })
    },

    bindInput(e) {
      // console.log(e.detail.value)
      this.setData({
        userData: this.data.data.dataArray.filter(v => v.value.indexOf(e.detail.value) !== -1)
      })
    }
  }
})