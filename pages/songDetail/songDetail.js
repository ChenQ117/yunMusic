// pages/songDetail/songDetail.js
import PubSub from "pubsub-js";
import request from "../../utils/request";
import moment from "moment"
//获取全局实例
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,//标记音乐是否播放
    songDetail: {},//音乐详情
    musicId: '',//音乐id
    musicLink: '',//音乐链接
    currentTime: '00:00',//当前播放进度
    durationTime: '00:00',//歌曲总时长
    currentWidth: 0,//播放进度条的宽度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //options 参数用于接收路由跳转query的参数
    let musicId = options.musicId;
    let from = options.from;//判断该musicId从什么页面传入

    //获取音乐详情
    this.getMusicDetail(musicId);
    this.setData({
      musicId
    })

    //判断当前页面是否在播放
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId){
      //修改当前页面音乐播放状态为true
      this.setData({
        isPlay: true
      })
    }
    //如果正在播的歌不是当前页面所显示的歌，则关闭当前正在播的歌并播放当前页面所显示的歌
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId !== musicId){
      this.musicControl(true,musicId,this.data.musicLink);
    }

    //创建音乐播放的实例
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    //监视音乐播放/暂停/停止
    this.backgroundAudioManager.onPlay(()=>{
      //修改音乐是否播放的状态
      this.changePlayState(true);
      //修改全局音乐播放的状态
      appInstance.globalData.musicId = musicId;
    })
    this.backgroundAudioManager.onPause(()=>{
      //修改音乐是否播放的状态
      this.changePlayState(false);

    })
    this.backgroundAudioManager.onStop(()=>{
      //修改音乐是否播放的状态
      this.changePlayState(false)
    })

    if (from === 'recommendSong'){//现在播放的是来自recommendSong页面的音乐
      //监听音乐播放自然结束
      this.backgroundAudioManager.onEnded(()=>{
        //订阅recommendSong的musicId数据
        PubSub.subscribe('musicId',(msg,musicId)=>{
          //关闭当前正在播放的音乐
          this.backgroundAudioManager.stop();
          //获取音乐的信息
          this.getMusicDetail(musicId);
          //自动播放当前的音乐
          this.musicControl(true,musicId)


          //取消订阅
          PubSub.unsubscribe('musicId');
        })
        //自动切换下一首歌,并播放
        PubSub.publish('switchType','next');
        //将实时进度条还原成0
        this.setData({
          currentTime: '00:00',
          currentWidth: 0
        })
      })
    } else{//现在播放的是来自search页面的音乐，此时重复播放该音乐
      //监听音乐播放自然结束
      this.backgroundAudioManager.onEnded(()=>{
        //关闭当前正在播放的音乐
        this.backgroundAudioManager.stop();
        //自动播放当前的音乐
        this.musicControl(true,musicId)
      })
    }


    //监听实时音乐播放进度
    this.backgroundAudioManager.onTimeUpdate(()=>{
      //格式化实时播放时间(需要先把s改成ms然后再改成钟：秒的形式)
      let currentTime = moment(this.backgroundAudioManager.currentTime*1000).format("mm:ss");
      let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration * 450;
      this.setData({
        currentTime,
        currentWidth
      })
    })


  },

  //修改播放状态的功能函数
  changePlayState(isPlay){
    //修改音乐是否播放的状态
    this.setData({
      isPlay
    })
    //修改全局音乐播放的状态
    appInstance.globalData.isMusicPlay = isPlay;
  },
  //获取音乐详情
  async getMusicDetail(musicId){
    let songDetailData = await request('/song/detail',{ids: musicId});
    let songDetail = songDetailData.songs[0];
    let durationTime = moment(songDetail.dt).format("mm:ss");
    this.setData({
      songDetail,
      durationTime
    });
    //设置播放页面的标题为歌曲名
    wx.setNavigationBarTitle({
      title: this.data.songDetail.name
    })
  },

  //点击播放/暂停的回调
  handleMusicPlay(){
    let isPlay = !this.data.isPlay;
    // this.setData({
    //   isPlay
    // });
    //控制音乐播放/暂停
    this.musicControl(isPlay,this.data.musicId,this.data.musicLink)
  },

  //控制音乐播放/暂停的功能函数
  async musicControl(isPlay,musicId,musicLink){
    if (isPlay){//音乐播放
      if (!musicLink){
        //获取音乐播放链接
        let musicLinkData = await request('/song/url',{id:musicId});
        musicLink = musicLinkData.data[0].url;
        this.setData({
          musicLink
        })
      }

      this.backgroundAudioManager.src = musicLink;
      this.backgroundAudioManager.title = this.data.songDetail.name;
    }else {//暂停音乐
      this.backgroundAudioManager.pause();
    }
  },


  //点击切歌的回调
  handleSwitch(event){
    //获取切歌的类型
    let type = event.currentTarget.id;

    //订阅recommendSong的musicId数据
    PubSub.subscribe('musicId',(msg,musicId)=>{
      console.log(musicId);
      //关闭当前正在播放的音乐
      this.backgroundAudioManager.stop();
      //获取音乐的信息
      this.getMusicDetail(musicId);
      //自动播放当前的音乐
      this.musicControl(true,musicId)


      console.log("musicId订阅中",musicId);
      //取消订阅
      PubSub.unsubscribe('musicId');
    })
    //发布消息数据给recommendSong页面
    PubSub.publish('switchType',type)
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