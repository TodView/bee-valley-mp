Component({
    properties:{
        data: {
            type: Object,
            value: []
        },
    },
    data: {
        value: null,
        isShow: false
    },
    methods: {
        getFocus(){

            this.setData({
                isShow: true
            })
            if(!this.data.userData){
                this.setData({
                    userData: this.data.data.dataArray

                })
            }
            
        },

        select(e){
            let dependency = this.data.data.dependency ? this.data.data.dependency : false;
            this.data.data.dataArray.forEach((v, index) => {
                if( v.value === e.target.dataset.select.value ){
                    this.triggerEvent('changeData', { 
                        id: e.target.dataset.select.id,
                        index: index,
                        dependency: dependency,
                        attr: this.data.data.attr
                    });
                    this.setData({
                        value: e.target.dataset.select.value,
                        isShow: false
                    })
                }
            })
        },

        bindInput(e){
            this.setData({
                userData: this.data.data.dataArray.filter(v => v.value.indexOf(e.detail.value) !== -1)
            })
        }
    }
})