// pages/poseneta/index.js
var posenet = require('@tensorflow-models/posenet');
import { detectPoseInRealTime, drawPoses } from '../../models/posenet/posenet';

const CANVAS_ID = 'image';
const POSENET_URL = 'https://s01.dongyin.net/test/posenet/model-stride16.json';

Page({
  posenetModel: undefined,
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

  posenet() {
    if (this.posenetModel == null) {
      this.setData({result: '加载模型中...'});
      posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: 193,
        multiplier: 0.5,
        modelUrl: POSENET_URL
      }).then((model) => {
        this.posenetModel = model;
        this.setData({result: '模型已加载'});
      });
    }
  },

  executePosenet(frame) {
    if (this.posenetModel) {
      const start = Date.now();
      detectPoseInRealTime(frame, this.posenetModel, false)
        .then((poses) => {
          this.poses = poses;
          drawPoses(this);
          const result = `${Date.now() - start}ms`;
          this.setData({ result });
        })
        .catch((err) => {
          console.log(err, err.stack);
        });
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

    this.posenet();
    const context = wx.createCameraContext(this);
    let count = 0;
    const listener = (context).onCameraFrame((frame) => {
      count++;
      if (count === 3) {
        this.executePosenet(frame);
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
    if (this.posenetModel) {
      this.posenetModel.dispose();
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