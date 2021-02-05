// pages/search/search.js
import request from "../../utils/request";
import PubSub from "pubsub-js"
let isSend = false//函数节流使用
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '', // placeholder的内容
    hotList: [], // 热搜榜数据
    searchContent: '', // 用户输入的表单项数据
    searchList: [], // 关键字模糊匹配的数据
    historyList: [],//搜索历史记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取页面加载所需要的数据
    this.getInfo();
    //获取本地历史记录
    this.getSearchHistory();
  },

  //页面初始化的数据
  async getInfo(){
    let placeholderContentData = await request('/search/default');
    let hotListData = await request('/search/hot/detail');
    this.setData({
      placeholderContent: placeholderContentData.data.showKeyword,
      hotList: hotListData.data
    })
  },

  //搜索框内容改变时的回调
  handleInputChange(event){
    // 更新searchContent的状态数据
    this.setData({
      searchContent: event.detail.value.trim()
    })

    if (isSend){
      return
    }
    this.getSearchList();
    isSend = true;
    //函数节流
    setTimeout(()=>{
      isSend = false
    },300)
  },


  //搜索框输入结束按回车
  handleSearch(){
    //将搜索的关键字添加到搜索历史记录中
    this.setSearchHistory();

    this.toSongDetail();
  },

  //获取搜索数据的功能函数
  async getSearchList(){

    //如果搜索内容为空则将搜索数据置空，且不用发请求
    if (!this.data.searchContent){
      this.setData({
        searchList: []
      })
      return
    }
    let {searchContent,historyList} = this.data;
    let searchListData = await request('/search',{keywords: searchContent,limit:10});
    this.setData({
      searchList: searchListData.result.songs,
      // historyList
    })
  },

  //将搜索的关键字添加到搜索历史记录中
  setSearchHistory(){
    let {searchContent,historyList} = this.data;
    if (historyList.indexOf(searchContent) !== -1){
      historyList.splice(historyList.indexOf(searchContent),1);
    }
    historyList.unshift(searchContent);

    // this.setData({
    //   searchList: searchListData.result.songs,
    //   // historyList
    // })
    //存储本地历史记录
    this.saveSearchHistory(historyList);
    // wx.setStorageSync('searchHistory',historyList)
  },

  //获取本地历史记录的功能函数
  getSearchHistory(){
    let historyList = wx.getStorageSync('searchHistory');
    if (historyList){
      this.setData({
        historyList
      })
    }
  },
  //存储本地历史记录
  saveSearchHistory(historyList){
    if (historyList.length>10){//如果历史记录大于10，则只保留前10个历史记录
      historyList.splice(10,historyList.length-10);
    }
    this.setData({
      historyList
    })
    wx.setStorageSync('searchHistory',historyList)
  },
  //清空搜索框的内容
  handleClear(event){
    this.setData({
      searchContent: '',
      searchList: []
    })
  },

  //清空搜索历史
  handleDelete(){
    wx.showModal({
      title: '提示',
      content: '是否确定删除？',
      success: (res)=>{
        if (res.confirm){
          // 清空data中historyList
          this.setData({
            historyList: []
          });
          // 移除本地的历史记录缓存
          wx.removeStorageSync('searchHistory');
          // this.saveSearchHistory([]);
          // wx.setStorageSync('searchHistory',[])
        }
      }
    })

  },

  //跳转到songDetail页面
  toSongDetail(){
    //当点击搜索结果时更新搜索历史记录
    this.setSearchHistory();

    let musicId = this.data.searchList[0].id;
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?musicId='+ musicId +'&from=search',
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