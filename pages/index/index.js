import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [],//轮播图数据
    recommendList: [],//推荐歌单数据
    topList: [],//排行榜数组
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取轮播图数据
    this.getBannerList();
    //推荐歌单数据
    this.getRecommendList();
    //获取排行榜数据
    this.getTopList();
  },

  //获取轮播图数据
  async getBannerList(){
    let bannerListData = await request('/banner',{type: 2});
    this.setData({
      bannerList: bannerListData.banners
    })
  },

  //获取推荐歌单数据
  async getRecommendList(){
    let recommendListData = await request('/personalized',{limit: 10});
    this.setData({
      recommendList: recommendListData.result
    })
  },

  //获取排行榜数据
  async getTopList(){
    /**
     * 需求分析：
     *    1. 需要根据idx的值获取对应的数据
     *    2. idx的取值范围是0-20，我们需要0-4
     *    3. 需要发5次请求
     */
    let index = 0;
    let resultArr = [];
    while (index<5){
      let topListData = await request('/top/list',{idx: index++});
      //splice(会修改原数组， 可以对指定的数组进行增删改) slice(不会修改原数组)
      let topListItem = {name: topListData.playlist.name,tracks: topListData.playlist.tracks.slice(0,3)};
      resultArr.push(topListItem);

      //不需要等待五次请求全部结束才更新，用户体验较好，但是渲染次数会多一些
      this.setData({
        topList: resultArr
      })
    }
  },

  //跳转至每日推荐页面
  handleRecommend(){
    wx.reLaunch({
      url: '/pages/recommendSong/recommendSong'
    })
  },

  //跳转至搜索界面
  toSearch(){
    wx.navigateTo({
      url: '/pages/search/search'
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