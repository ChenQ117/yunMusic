// pages/video/video.js
import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [],//导航标签数据
    navId: '',//导航标识
    videoList: [],//视频列表
    videoId: '',//视频id标识
    videoUpdateTime: [],//记录video播放的时长
    isTriggered: false,//下拉刷新状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo){ //若用户未登录
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
    } else {
      //获取导航数据
      this.getVideoGroupListData();
    }

  },

  //获取导航数据
  async getVideoGroupListData(){
    let videoGroupListData = await request('/video/group/list');
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0,14),
      navId: videoGroupListData.data[0].id
    })

    //获取视频列表
    this.getVideoList(this.data.navId);
  },

  //获取视频列表数据
  async getVideoList(navId){
    let videoListData = await request('/video/group',{id: navId});
    let index=0;
    let videoList = videoListData.datas.map(item=>{
      item.id=index++;
      return item
    })
    this.setData({
      videoList,
      isTriggered:false//更改下拉刷新状态
    })
    wx.hideLoading();
  },

  //点击切换导航的回调
  changeNav(event){
    let navId = event.currentTarget.id;//通过id向event传参的时候如果传的是number会自动转换成string
    // let navId = event.currentTarget.dataset.id;
    this.setData({
      // navId: navId*1
      //右移零位会将非number数据强制转换成number
      navId: navId>>>0,
      videoList: []
    })

    //显示正在加载
    wx.showLoading({
      title: '正在加载'
    })

    //获取当前导航对应的视频数据
    this.getVideoList(this.data.navId)
  },

  //点击播放/继续播放的回调
  handlePlay(event){
    /*
      问题： 多个视频同时播放的问题
    * 需求：
    *   1. 在点击播放的事件中需要找到上一个播放的视频
    *   2. 在播放新的视频之前关闭上一个正在播放的视频
    * 关键：
    *   1. 如何找到上一个视频的实例对象
    *   2. 如何确认点击播放的视频和正在播放的视频不是同一个视频
    * 单例模式：
    *   1. 需要创建多个对象的场景下，通过一个变量接收，始终保持只有一个对象，
    *   2. 节省内存空间
    * */

    let vid = event.currentTarget.id;
    //关闭上一个播放的视频
    // this.vid !== vid && this.videoContext && this.videoContext.stop();

    // this.vid=vid;
    //更新data中videoId的状态数据
    this.setData({
      videoId: vid
    })

    //创建控制video标签的实例对象
    this.videoContext = wx.createVideoContext(vid);

    //判断当前的视频之前是否播放过，是否有播放记录，如果有，跳转至之前播放的位置
    let {videoUpdateTime} = this.data;
    let videoItem = videoUpdateTime.find(item=>item.vid===vid);
    if (videoItem){
      this.videoContext.seek(videoItem.currentTime);
    }
    this.videoContext.play();

  },

  //监听视频播放进度的回调
  handleTimeUpdate(event){
    console.log('8767')
    let videoTimeObj = {vid: event.currentTarget.id,currentTime: event.detail.currentTime};
    let {videoUpdateTime} = this.data;

    /*
    * 思路： 判断记录播放时长的videoUpdateTime数组中是否有当前视频的播放记录
    *   1. 如果有，在原有的播放记录中修改播放时间为当前的播放时间
    *   2. 如果没有，需要在数组中添加当前视频的播放对象
    *
    * */
    let videoItem = videoUpdateTime.find(item => item.vid === videoTimeObj.vid);
    if (videoItem){//之前有
      videoItem.currentTime = event.detail.currentTime;
    }else {//之前没有
      videoUpdateTime.push(videoTimeObj);
    }
    //更新videoUpdateTime的状态
    this.setData({
      videoUpdateTime
    })
  },

  //视频播放结束的回调
  handleEnded(event){
    let {videoUpdateTime} = this.data;
    videoUpdateTime.splice(videoUpdateTime.findIndex(item=>item.vid===event.currentTarget.id),1);
    this.setData({
      videoUpdateTime
    })
  },

  //自定义下拉刷新的回调 :scroll-view
  handleFresh(){
    this.setData({
      isTriggered:true
    })
    this.getVideoList(this.data.navId);
  },

  //自定义上拉触底的回调 :scroll-view
  handleLower(){
    console.log('上拉触底的回调');
    //数据分项： 1.后端分页  2.前端分页
    console.log('发送请求||在前端截取最新的数据 追加到视频列表的后方');
    console.log('网易云音乐暂时没有提供分页的api');

    //模拟数据
    let newVideoList =  [
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {}
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_58ABB263CA7E0AB40E88CC11354B3430",
          "coverUrl": "https://p1.music.126.net/ZYR5b6X4BgSFJw_yPqqsaQ==/109951164649022925.jpg",
          "height": 360,
          "width": 640,
          "title": "Alan Walker-Darkside（建议佩戴耳机观看）",
          "description": null,
          "commentCount": 34,
          "shareCount": 125,
          "resolutions": [
            {
              "resolution": 480,
              "size": 48625571
            },
            {
              "resolution": 240,
              "size": 32236089
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 650000,
            "authStatus": 1,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/NmuPtwcKPV968MD1BtVf8w==/109951164588907091.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 653200,
            "birthday": 829065600000,
            "userId": 1447720038,
            "userType": 4,
            "nickname": "DjaGirKeliQ",
            "signature": "BEST UYGHUR MUSIC DjaGirKeliQ MeDyà",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164588907090,
            "backgroundImgId": 109951164007785630,
            "backgroundUrl": "http://p1.music.126.net/sHo9eecY61OwkaIBfNRw0g==/109951164007785630.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951164588907091",
            "backgroundImgIdStr": "109951164007785630",
            "avatarImgId_str": "109951164588907091"
          },
          "urlInfo": {
            "id": "58ABB263CA7E0AB40E88CC11354B3430",
            "url": "http://vodkgeyttp9.vod.126.net/cloudmusic/HBCgeOtE_2886953592_hd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=aZQlgMzaExDYsCKfeYZsBWBFcEXhoGxp&sign=1940bf0c07de77de22d9fcd8b6e5ce5b&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 48625571,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 480
          },
          "videoGroup": [
            {
              "id": -33937,
              "name": "#Alan Walker 36首电音【震撼全场】#",
              "alg": "groupTagRank"
            },
            {
              "id": 15249,
              "name": "Alan Walker",
              "alg": "groupTagRank"
            },
            {
              "id": 9136,
              "name": "艾兰·沃克",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": "groupTagRank"
            },
            {
              "id": 58100,
              "name": "现场",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Darkside",
              "id": 1296410418,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 1045123,
                  "name": "Alan Walker",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 12143031,
                  "name": "Au/Ra",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 12073571,
                  "name": "Tomine Harket",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 8,
              "v": 16,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 72006345,
                "name": "Darkside",
                "picUrl": "http://p4.music.126.net/DzkYIKQ_bp-5f88qNvWBkQ==/109951163661799170.jpg",
                "tns": [],
                "pic_str": "109951163661799170",
                "pic": 109951163661799170
              },
              "dt": 211931,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 8477301,
                "vd": -28100
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5086398,
                "vd": -25600
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3390946,
                "vd": -24200
              },
              "a": null,
              "cd": "01",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7001,
              "mv": 10738268,
              "publishTime": 1532620800000,
              "privilege": {
                "id": 1296410418,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 320000,
                "fl": 128000,
                "toast": false,
                "flag": 260,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "58ABB263CA7E0AB40E88CC11354B3430",
          "durationms": 223538,
          "playTime": 187486,
          "praisedCount": 1014,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_2E0B9347B0CFFD2CCF0BF0BE9EA461A8",
          "coverUrl": "https://p1.music.126.net/PaTb352_OXXifLZF2WRkKA==/109951164264013667.jpg",
          "height": 720,
          "width": 1280,
          "title": "Alper Egri - Me Too",
          "description": "Alper Egri - Me Too",
          "commentCount": 21,
          "shareCount": 168,
          "resolutions": [
            {
              "resolution": 240,
              "size": 12175584
            },
            {
              "resolution": 480,
              "size": 20024742
            },
            {
              "resolution": 720,
              "size": 31944089
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 1000000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/6OO3cUXXGZrKi19Q7d4EPQ==/109951165670626882.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 1001900,
            "birthday": 930585600000,
            "userId": 1724585681,
            "userType": 205,
            "nickname": "Radio-Edit",
            "signature": "SKY ~",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951165670626880,
            "backgroundImgId": 109951164443394270,
            "backgroundUrl": "http://p1.music.126.net/z7OnVyO3cBZpJE8uUjH87A==/109951164443394268.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "音乐视频达人"
            },
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951165670626882",
            "backgroundImgIdStr": "109951164443394268",
            "avatarImgId_str": "109951165670626882"
          },
          "urlInfo": {
            "id": "2E0B9347B0CFFD2CCF0BF0BE9EA461A8",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/i9GJ4o46_2532565550_shd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=JfTovsZqBHZwxcPsnEcUvfmzhuRohRlZ&sign=c81c8fc94130ff560ca2f6e3b1223d0b&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 31944089,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 14176,
              "name": "体育",
              "alg": "groupTagRank"
            },
            {
              "id": 25137,
              "name": "音乐资讯",
              "alg": "groupTagRank"
            },
            {
              "id": 2103,
              "name": "游戏",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Me Too",
              "id": 1375449393,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 31190440,
                  "name": "Alper Eğri",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 35,
              "st": 0,
              "rt": "",
              "fee": 8,
              "v": 5,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 80146240,
                "name": "Me Too",
                "picUrl": "http://p3.music.126.net/ZdzyhybN9rrTfg9tUpuBDg==/109951164188116344.jpg",
                "tns": [],
                "pic_str": "109951164188116344",
                "pic": 109951164188116350
              },
              "dt": 182543,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 7303880,
                "vd": -69955
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 4382346,
                "vd": -67421
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 2921578,
                "vd": -65884
              },
              "a": null,
              "cd": "01",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 743010,
              "mv": 0,
              "publishTime": 1560182400000,
              "privilege": {
                "id": 1375449393,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 999000,
                "fl": 128000,
                "toast": false,
                "flag": 261,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "2E0B9347B0CFFD2CCF0BF0BE9EA461A8",
          "durationms": 182000,
          "playTime": 150007,
          "praisedCount": 511,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_636936BBB6B5CFF6E91453C99664756B",
          "coverUrl": "https://p1.music.126.net/xp0EhMCVxurQ8lnCykJFqg==/109951164931178095.jpg",
          "height": 1080,
          "width": 1920,
          "title": "专业团队，带好耳机！前方高能让你嗨到爆的《抬棺神曲》",
          "description": "超高清4k画质。\n“专业团队”，带好耳机！前方高能！让你嗨到爆的《抬棺神曲》感受电影工业的威力\n",
          "commentCount": 86,
          "shareCount": 97,
          "resolutions": [
            {
              "resolution": 240,
              "size": 47123845
            },
            {
              "resolution": 480,
              "size": 82071676
            },
            {
              "resolution": 720,
              "size": 121007272
            },
            {
              "resolution": 1080,
              "size": 220467189
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 370000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/zaCXVkBENc9kp-EpFJRwwA==/109951164453953719.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 370100,
            "birthday": 723744000000,
            "userId": 136920183,
            "userType": 204,
            "nickname": "木子的影像声色",
            "signature": "世间好物不坚牢，彩云易散琉璃脆。",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164453953710,
            "backgroundImgId": 109951163755109000,
            "backgroundUrl": "http://p1.music.126.net/_WyasStVi6NFTXVxiwHI0A==/109951163755109000.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "超燃联盟视频达人"
            },
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951164453953719",
            "backgroundImgIdStr": "109951163755109000",
            "avatarImgId_str": "109951164453953719"
          },
          "urlInfo": {
            "id": "636936BBB6B5CFF6E91453C99664756B",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/TqzVkTPF_2978400754_uhd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=MPdVNXxtGJAYUHCNtwHbWtUtgiLHzbNC&sign=c641c361904248be0a0acb18a7c2482d&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 220467189,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 1080
          },
          "videoGroup": [
            {
              "id": -28191,
              "name": "#触手mds剑仙(李白专用曲）#",
              "alg": "groupTagRank"
            },
            {
              "id": 15215,
              "name": "科幻",
              "alg": "groupTagRank"
            },
            {
              "id": 13172,
              "name": "欧美",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 76106,
              "name": "饭制混剪",
              "alg": "groupTagRank"
            },
            {
              "id": 24127,
              "name": "电影",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 15241,
              "name": "饭制",
              "alg": "groupTagRank"
            },
            {
              "id": 3107,
              "name": "混剪",
              "alg": "groupTagRank"
            },
            {
              "id": 1105,
              "name": "最佳饭制",
              "alg": "groupTagRank"
            },
            {
              "id": 3100,
              "name": "影视",
              "alg": "groupTagRank"
            },
            {
              "id": 58101,
              "name": "听BGM",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Astronomia 2014 (Radio Edit)",
              "id": 29922416,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 747030,
                  "name": "Vicetone",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 990184,
                  "name": "Tony Igy",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 0,
              "v": 32,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 3087044,
                "name": "Astronomia 2014",
                "picUrl": "http://p4.music.126.net/pAWCDHft6mpBUYYL0O6XgA==/2538772350704104.jpg",
                "tns": [],
                "pic": 2538772350704104
              },
              "dt": 198000,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 7927803,
                "vd": -40400
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 4756746,
                "vd": -38000
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3171218,
                "vd": -37200
              },
              "a": null,
              "cd": "1",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 2,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 0,
              "mv": 0,
              "publishTime": 1404921600007,
              "privilege": {
                "id": 29922416,
                "fee": 0,
                "payed": 0,
                "st": 0,
                "pl": 320000,
                "dl": 320000,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 320000,
                "fl": 320000,
                "toast": false,
                "flag": 256,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "636936BBB6B5CFF6E91453C99664756B",
          "durationms": 196480,
          "playTime": 164641,
          "praisedCount": 663,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_99CA8AEA9C188FC6D306E4851D4B6F83",
          "coverUrl": "https://p1.music.126.net/xqiX3dYqPUlWYQvswbAobw==/109951165131484445.jpg",
          "height": 1080,
          "width": 1920,
          "title": "求你们别再“左右抖胸跳舞”了！能尊重点原曲吗？",
          "description": "求你们别再“左右抖胸跳舞”了！能尊重点原曲吗？\n风正在吹过来\n攀娘举牌热曲\n",
          "commentCount": 327,
          "shareCount": 238,
          "resolutions": [
            {
              "resolution": 240,
              "size": 25950881
            },
            {
              "resolution": 480,
              "size": 43575967
            },
            {
              "resolution": 720,
              "size": 63511556
            },
            {
              "resolution": 1080,
              "size": 118099580
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 220000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/Ni4qH-x7_kzo57R5KXBL2g==/109951164380182392.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 220300,
            "birthday": -2209017600000,
            "userId": 1729016175,
            "userType": 204,
            "nickname": "音乐-音小六",
            "signature": "用最短是时间，让你快速了解当下热门BGM，这是我的宗旨",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164380182400,
            "backgroundImgId": 109951162868126480,
            "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "视频达人"
            },
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951164380182392",
            "backgroundImgIdStr": "109951162868126486",
            "avatarImgId_str": "109951164380182392"
          },
          "urlInfo": {
            "id": "99CA8AEA9C188FC6D306E4851D4B6F83",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/KFPmLQFO_3055187383_uhd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=OzMAhcWkQfZlkyxaEGRMopxPUwmXHHzr&sign=c314be86073c606b5c9f75f39efabfcb&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 118099580,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 1080
          },
          "videoGroup": [
            {
              "id": -8003,
              "name": "#点赞榜#",
              "alg": "groupTagRank"
            },
            {
              "id": 92105,
              "name": "BLACKPINK",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 14212,
              "name": "欧美音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 1101,
              "name": "舞蹈",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "风正在吹过来（DJ版）",
              "id": 1444691544,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 34616284,
                  "name": "琰琰",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 25,
              "st": 0,
              "rt": "",
              "fee": 8,
              "v": 13,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 88770704,
                "name": "关于我爱过你",
                "picUrl": "http://p3.music.126.net/ojyRNJjGGN5SdWCpkvO6rw==/109951164950936730.jpg",
                "tns": [],
                "pic_str": "109951164950936730",
                "pic": 109951164950936740
              },
              "dt": 212638,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 8508648,
                "vd": -32052
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5105206,
                "vd": -29520
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3403485,
                "vd": -27892
              },
              "a": null,
              "cd": "01",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 0,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 0,
              "mv": 0,
              "publishTime": 0,
              "privilege": {
                "id": 1444691544,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 999000,
                "fl": 128000,
                "toast": false,
                "flag": 66,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "99CA8AEA9C188FC6D306E4851D4B6F83",
          "durationms": 259690,
          "playTime": 2125602,
          "praisedCount": 8140,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_9708617896F812460A3387B72E97AD7E",
          "coverUrl": "https://p1.music.126.net/cK-cX99hDzVIl42xOQ3pmA==/109951163132196020.jpg",
          "height": 720,
          "width": 1280,
          "title": "年代悠久的劲舞团神曲 高耀太《火花》太经典了",
          "description": "年代悠久的劲舞团神曲 高耀太《火花》太经典了",
          "commentCount": 376,
          "shareCount": 450,
          "resolutions": [
            {
              "resolution": 240,
              "size": 21936019
            },
            {
              "resolution": 480,
              "size": 31373537
            },
            {
              "resolution": 720,
              "size": 50053464
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 110000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/5WuEwQsJpxqmJekOWEto-g==/109951165328068724.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 110101,
            "birthday": 1483200000000,
            "userId": 473551421,
            "userType": 204,
            "nickname": "这音乐牛掰",
            "signature": "为人低调的音乐博主，投稿请私信",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951165328068720,
            "backgroundImgId": 109951163462909980,
            "backgroundUrl": "http://p1.music.126.net/z4p1vQpYXhjk8x0ZSQM_jQ==/109951163462909982.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "音乐视频达人"
            },
            "djStatus": 0,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951165328068724",
            "backgroundImgIdStr": "109951163462909982",
            "avatarImgId_str": "109951165328068724"
          },
          "urlInfo": {
            "id": "9708617896F812460A3387B72E97AD7E",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/8zHGzQbz_154048590_shd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=vwVTdetgoRUpMGuKOrSVNEGlaTcTzsRI&sign=4e0ffd0503c21ff1c2a658b85a88cc92&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 50053464,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": -12480,
              "name": "#★【欧美】超爽节奏控★#",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 13139,
              "name": "韩语",
              "alg": "groupTagRank"
            },
            {
              "id": 13164,
              "name": "快乐",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": "groupTagRank"
            },
            {
              "id": 58100,
              "name": "现场",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "9708617896F812460A3387B72E97AD7E",
          "durationms": 187221,
          "playTime": 339873,
          "praisedCount": 1773,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_35CF853805ABF2DA2E13EEBF54C9C497",
          "coverUrl": "https://p1.music.126.net/obm8TqbWN5B7HmA6hUKuTw==/109951164789420596.jpg",
          "height": 1080,
          "width": 1920,
          "title": "Gabidulin - Lay Lay",
          "description": "",
          "commentCount": 9,
          "shareCount": 113,
          "resolutions": [
            {
              "resolution": 240,
              "size": 23731623
            },
            {
              "resolution": 480,
              "size": 37331853
            },
            {
              "resolution": 720,
              "size": 50798989
            },
            {
              "resolution": 1080,
              "size": 83904878
            }
          ],
          "creator": {
            "defaultAvatar": true,
            "province": 1000000,
            "authStatus": 1,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/VnZiScyynLG7atLIZ2YPkw==/18686200114669622.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 1010000,
            "birthday": -1577899923737,
            "userId": 73891628,
            "userType": 4,
            "nickname": "欧洲音厨",
            "signature": "",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 18686200114669624,
            "backgroundImgId": 109951163197496160,
            "backgroundUrl": "http://p1.music.126.net/DgaQQC-MpbGJDehJwwnScQ==/109951163197496155.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "18686200114669622",
            "backgroundImgIdStr": "109951163197496155",
            "avatarImgId_str": "18686200114669622"
          },
          "urlInfo": {
            "id": "35CF853805ABF2DA2E13EEBF54C9C497",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/VEZQ01eC_2929255943_uhd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=MfAqhmshsynrmFXDZuzTlutpcMglZcZA&sign=e39b6cf2f9e523c2c0e5bbd8f9f01191&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 83904878,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 1080
          },
          "videoGroup": [
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 1000,
              "name": "MV",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 14212,
              "name": "欧美音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Lay Lay",
              "id": 1424680055,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 34384628,
                  "name": "Gabidulin",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 25,
              "st": 0,
              "rt": "",
              "fee": 8,
              "v": 4,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 85864628,
                "name": "Lay Lay",
                "picUrl": "http://p4.music.126.net/NEw5_lAYt1eOKtggB-g6mA==/109951164724458801.jpg",
                "tns": [],
                "pic_str": "109951164724458801",
                "pic": 109951164724458800
              },
              "dt": 147931,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 5919391,
                "vd": -3974
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 3551652,
                "vd": -1369
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 2367782,
                "vd": 255
              },
              "a": null,
              "cd": "01",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 743010,
              "mv": 0,
              "publishTime": 1582041600000,
              "privilege": {
                "id": 1424680055,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 999000,
                "fl": 128000,
                "toast": false,
                "flag": 261,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "35CF853805ABF2DA2E13EEBF54C9C497",
          "durationms": 184855,
          "playTime": 84519,
          "praisedCount": 327,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_EF6FA6BF4DAA06F6092EC58D1BBFEE54",
          "coverUrl": "https://p1.music.126.net/SnP8PGMgz96z4byAO9jU8Q==/109951163572747184.jpg",
          "height": 720,
          "width": 1280,
          "title": "OMFG《Hello》还能这么玩？这是爱因斯坦搭建的设备吧！",
          "description": "OMFG《Hello》还能这么玩？这是爱因斯坦搭建的设备吧！",
          "commentCount": 2315,
          "shareCount": 5856,
          "resolutions": [
            {
              "resolution": 240,
              "size": 26178107
            },
            {
              "resolution": 480,
              "size": 37372216
            },
            {
              "resolution": 720,
              "size": 59503293
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 1000000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/eFO91z0r8UH8vyvgVvouLA==/109951164396527565.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 1004400,
            "birthday": 960566400000,
            "userId": 18607052,
            "userType": 204,
            "nickname": "YouTube",
            "signature": "音乐视频自媒体",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164396527570,
            "backgroundImgId": 109951165605777540,
            "backgroundUrl": "http://p1.music.126.net/3Ffj3IPcvEcSey7Jb9qxEQ==/109951165605777544.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "泛生活视频达人",
              "2": "生活图文达人"
            },
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951164396527565",
            "backgroundImgIdStr": "109951165605777544",
            "avatarImgId_str": "109951164396527565"
          },
          "urlInfo": {
            "id": "EF6FA6BF4DAA06F6092EC58D1BBFEE54",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/CdWF0MqU_73612670_shd.mp4?ts=1612163141&rid=A06E83BED79BBA00AB2CCA5DBFBA699B&rl=3&rs=mbixjzIqsLeXMaMLEckpgZesAzpFKjEO&sign=b50c9f85472f0c08d44aaf6623afdc61&ext=Q8AcFUxvSWnbVwyHe2TqEOjFO%2BDg%2FYKjnnQeZEqMgYykZl0j3%2FrRAI2e7KqhbEch9wmMUT9FlFYFL3fNl7bujfDyaUVAXuaBGbT9QZJVMiteB6kKL0G%2BXwk0xhJ0DrBrncb3FSlnNvVpu10hxsIriFZW1PimELC9bCbBfxj%2BsALsEU3a%2FnDR1CfPZtnzEIAHoK87DX%2B0Bi6AjYLZdJPMtvCW8kPIr6GLaNzJeeeUtMgEBRVWMn8pNyKJFE3980uU",
            "size": 59503293,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": -30818,
              "name": "#『修仙』 玩游戏/晨跑'必备BGM/轻音乐#",
              "alg": "groupTagRank"
            },
            {
              "id": 15229,
              "name": "英语",
              "alg": "groupTagRank"
            },
            {
              "id": 15149,
              "name": "创意音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 13164,
              "name": "快乐",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Hello",
              "id": 33211676,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 381949,
                  "name": "OMFG",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 8,
              "v": 55,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 3190201,
                "name": "Hello",
                "picUrl": "http://p3.music.126.net/sylTociq8lh0QP7BuXRLGQ==/109951164852190706.jpg",
                "tns": [],
                "pic_str": "109951164852190706",
                "pic": 109951164852190700
              },
              "dt": 226307,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 9055129,
                "vd": -72865
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5433095,
                "vd": -70531
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3622078,
                "vd": -69149
              },
              "a": null,
              "cd": "1",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 0,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 1416729,
              "mv": 5309845,
              "publishTime": 1416672000000,
              "privilege": {
                "id": 33211676,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 999000,
                "fl": 128000,
                "toast": false,
                "flag": 4,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "EF6FA6BF4DAA06F6092EC58D1BBFEE54",
          "durationms": 224095,
          "playTime": 1988626,
          "praisedCount": 19775,
          "praised": false,
          "subscribed": false
        }}];
    let videoList = this.data.videoList;
    //将视频最新的数据更新到原有视频列表数据中
    videoList.push(...newVideoList);
    this.setData({
      videoList
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
    console.log('页面的下拉刷新')
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('页面的上拉触底')
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})