import PubSub from "pubsub-js";

import request from "../../utils/request";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '',//日
    month: '',//月
    recommendList: [],//每日推荐数据
    index: 0,//点击的音乐的下标
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo){//若用户未登录
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: ()=>{
          //跳转至登录页面
          wx.reLaunch({
            url: '/pages/login/login'
          })
          return;
        }
      })
    }

    //更新日期状态
    this.setData({
      day: new Date().getDay(),
      month: new Date().getMonth()+1
    })

    //获取每日推荐歌曲
    this.getRecommendList();

    //订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType',(msg,type)=>{
      let {recommendList,index} = this.data
      if (type === 'pre'){//上一首
        (index === 0) && (index = recommendList.length);
        index -= 1
      }else {//下一首
        (index === recommendList.length-1) && (index = -1);
        index += 1
      }
      this.setData({
        index
      })
      let musicId = recommendList[index].id;
      //将musicId发送给songDetail页面
      PubSub.publish('musicId',musicId);
    })

  },
  //获取每日推荐歌曲
  async getRecommendList(){
    let recommendListData = await request('/recommend/songs');
    this.setData({
      recommendList: recommendListData.recommend
    })
  },

  //处理列表点击事件
  toSongDetail(event){

    // console.log(event.currentTarget.dataset.song.id);

    // 路由跳转传参： query参数
    // 不能直接将song对象作为参数传递，长度过长，会被自动截取掉
    // url: '/pages/songDetail/songDetail?songPackage=' + JSON.stringify(songPackage)
    let {song,index} = event.currentTarget.dataset;
    this.setData({
      index
    })
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?musicId='+ song.id +'&from=recommendSong',
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})