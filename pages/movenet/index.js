// pages/moveneta/index.js
var poseDetection = require('@tensorflow-models/pose-detection');
import { detectPoseInRealTime, drawPoses } from '../../models/movenet/movenet';

const CANVAS_ID = 'image';
const MOVENET_URL = 'https://s01.dongyin.net/test/movenet/model.json';

Page({
  movenetModel: undefined,
  canvas: undefined,
  poses: undefined,
  ctx: undefined,

  /**
   * 页面的初始数据
   */
  data: {
    devicePosition: 'front',
    result: ''
  },

  handleSwitchCamera() {
    let devicePosition = this.data.devicePosition === 'front' ? 'back' : 'front';
    console.log(devicePosition);
    this.setData({devicePosition});
  },

  movenet() {
    if (this.movenetModel == null) {
      this.setData({result: '加载模型中...'});
      poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        modelUrl: MOVENET_URL,
      }).then((model) => {
        this.movenetModel = model;
        this.setData({result: '模型加载完成'});
      })
    }
  },

  executeMovenet(frame) {
    if (this.movenetModel) {
      const start = Date.now();
      detectPoseInRealTime(frame, this.movenetModel, false)
        .then((poses) => {
          this.poses = poses;
          console.log("poses:", poses);
          drawPoses(this);
          const result = `${Date.now() - start}ms`;
          this.setData({ result });
        })
        .catch((err) => {
          console.log(err, err.stack);
        })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    console.log('create canvas context for #image...');
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
      console.log('ctx', this.ctx);
    }, 500);

    this.movenet();
    const context = wx.createCameraContext(this);
    let count = 0;
    const listener = (context).onCameraFrame((frame) => {
      count++;
      if (count === 3) {
        this.executeMovenet(frame);
        count = 0;
      }
    });
    listener.start();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (this.movenetModel) {
      this.movenetModel.dispose();
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})