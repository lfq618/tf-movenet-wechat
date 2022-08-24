// pages/movenet/index.js
var tf = require('@tensorflow/tfjs-core');
var poseDetection = require('@tensorflow-models/pose-detection');
const { appWidth, appHeight, benchmarkLevel } = getApp().globalData;
const color = 'aqua';

console.log("appWidth", appWidth)

console.log("appHeight", appHeight)

Page({
  ctx: null,
  // 神经网络
  moveNet: undefined,
  // ready
  ready: false,

  modelUrl: "https://s01.dongyin.net/test/movenet/model.json",

  /**
   * 页面的初始数据
   */
  data: {
    devicePosition: 'front',
    predicting: false,
    result: ''
  },

  handleSwitchCamera() {
    let devicePosition = this.data.devicePosition === 'front' ? 'back' : 'front';
    this.setData({devicePosition});
  },

  onCameraError(err) {
    console.log('onCameraError>>', err);
  },

  load() {
    return new Promise((resolve, reject) => {
      console.log("aaaaaaaaaaa")
      console.log('modelUrl', this.modelUrl)
      // detectorConfig = {
      //   modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      //   modelUrl: this.modelUrl,
      // };
      poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        modelUrl: this.modelUrl,
      })
        .then(model => {
          this.moveNet = model
          this.ready = true
          console.log("moveNet")
          console.log(this.moveNet)
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  isReady() {
    return this.ready
  },

  initClassifier() {
    wx.showLoading({
      title: '模型加载中...',
    });

    this.ready = false
    this.load().then(() => {
      wx.hideLoading();
      console.log("模型加载成功")
    }).catch(err => {
      console.log('模型加载报错:', err);
      // Toast.loading({
      //   message: '网络链接异常',
      //   forbidClick: true,
      //   loadingType: 'spinner',
      // })
    })
  },

  executeClassify(frame) {
    if (this.isReady()) {
      this.setData({
        predicting: true
      }, () => {
        const start = Date.now();
        this.detectSinglePose(frame).then(pose => {
        this.drawSinglePose(pose[0]);
          const result = `${Date.now() - start}ms`;
          this.setData({ result });
        }).catch((err) => {
          console.log(err, err.stack);
        });
      });
    }
  },

  padAndResizeTo(input, [targetH, targetW]) {
    const [height, width] = [input.height, input.width];
    const targetAspect = targetW / targetH;
    const aspect = width / height;
    let [padT, padB, padL, padR] = [0, 0, 0, 0];
     if (aspect > targetAspect) {
      // pads the width
      padT = 0;
      padB = 0;
      padL = Math.round(0.5 * (targetAspect * height - width));
      padR = Math.round(0.5 * (targetAspect * height - width));
    } else {
      // pads the height
       padT = Math.round(0.5 * ((1.0 / targetAspect) * width - height));
      padB = Math.round(0.5 * ((1.0 / targetAspect) * width - height));
      padL = 0;
      padR = 0;
    }
      
    const resized = tf.tidy(() => {
      let imageTensor = tf.browser.fromPixels(input);
      imageTensor = tf.pad3d(imageTensor, [[padT, padB], [padL, padR], [0, 0]]);
      let result = tf.image.resizeBilinear(imageTensor, [targetH, targetW]);
      imageTensor.dispose();
      return result;
    });
      
     return resized;
  },

  detectSinglePose(frame) {
    return new Promise((resolve, reject) => {
      const imgData = {
        data: new Uint8Array(frame.data),
        width: Number(frame.width),
        height: Number(frame.height)
      }

      const video = this.padAndResizeTo(imgData, [appHeight, appWidth]);
      
      

      this.moveNet.estimatePoses(video, {maxPoses: 1, flipHorizontal: false}).then(pose => {
        video.dispose()
        resolve(pose)
      }).catch(err => {
        reject(err)
      })
    })
  },

  drawSinglePose(pose) {
    if (!pose) {
      console.log("no pose")
      return
    }

    const minPoseConfidence = 0.1
    const minPartConfidence = 0.1

    if (pose.score > minPoseConfidence) {
      console.log("draw.....")
      this.drawKeypoints(pose.keypoints, minPartConfidence)
      this.drawSkeleton(pose.keypoints, minPartConfidence)
    }

    this.ctx.draw()
    return pose
  },

  dispose() {
    this.moveNet.dispose()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    const context = wx.createCameraContext(this);
    this.ctx = wx.createCanvasContext('pose', this);
    this.initClassifier();
    
    let count = 0;
    const listener = context.onCameraFrame(frame => {
      count++;
      if (count === 2) { // 控制帧数
        if (this.isReady()) {
          this.executeClassify(frame);
        }
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
    if (this.isReady()) {
      this.moveNet.dispose();
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

  },

  getFrameSliceOptions(frameWidth, frameHeight, displayWidth, displayHeight) {
    let result = {
      start: [0, 0, 0],
      size: [-1, -1, 3]
    }
  
    const ratio = displayHeight / displayWidth
  
    if (ratio > frameHeight / frameWidth) {
      result.start = [0, Math.ceil((frameWidth - Math.ceil(frameHeight / ratio)) / 2), 0]
      result.size = [-1, Math.ceil(frameHeight / ratio), 3]
    } else {
      result.start = [Math.ceil((frameHeight - Math.floor(ratio * frameWidth)) / 2), 0, 0]
      result.size = [Math.ceil(ratio * frameWidth), -1, 3]
    }
  
    return result
  },
  
  drawPoint(y, x, r, color) {
    // console.log("drawPoint", y, x, r, color)
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    // this.ctx.lineWidth = 2;
    // this.ctx.strokeStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.stroke();
  },
  
  drawKeypoints(keypoints, minConfidence, scale = 1) {
    // const keypointId = poseDetection.util.getKeypointIndexBySide(poseDetection.SupportedModels.MoveNet);
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
      if (keypoint.score < minConfidence) {
        continue;
      }
  
      const { y, x } = keypoint;
      this.drawPoint(y * scale, x * scale, 3, color)
    }
  },
  
  drawSkeleton(keypoints, minConfidence, scale = 1) {
    poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet).forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // console.log("kp1 - kp2", kp1, kp2);
  
      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      // const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;
  
      if (score1 >= minConfidence && score2 >= minConfidence) {
        this.ctx.beginPath();
        this.ctx.moveTo(kp1.x, kp1.y);
        this.ctx.lineTo(kp2.x, kp2.y);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
      }
    })
  }
})