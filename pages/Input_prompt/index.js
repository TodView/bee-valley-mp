Component({
    properties:{
        data: {
            type: Object,
            value: {}
        },
    },
    data: {
        isShow: false,
        userData: []
    },
    attached() {
        //console.log(this.data.isHidden)
    
        //console.log('attached')
        // this.setData({
        //     userData: this.data.data.dataArray
        // })

        //console.log(this.data.userData, this.data.data)

    },
    
    detached(){
        this.setData({
            value: '' 
        })
    },
    

    methods: {
        getFocus(){
                this.setData({
                    userData: this.data.data.dataArray
                })
            
            this.setData({
                isShow: true
            })


            //console.log(this.data.data)
            
        },

        select(e){
            let dependency = this.data.data.dependency ? this.data.data.dependency : false;
            this.data.data.dataArray.forEach((v, index) => {
                if( v.value === e.target.dataset.select.value ){
                    this.triggerEvent('changeData', { 
                        id: e.target.dataset.select.id,
                        index: index,
                        dependency: dependency,
                        attr: this.data.data.attr,
                        value: e.target.dataset.select.value
                    });
                    this.setData({
                        // value: e.target.dataset.select.value,
                        isShow: false
                    })
                }
            })
        },

        bindInput(e){
            // console.log(e.detail.value)
            this.setData({
                userData: this.data.data.dataArray.filter(v => v.value.indexOf(e.detail.value) !== -1)
            })
        }
    }
})