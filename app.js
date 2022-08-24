// app.js
const fetchWechat = require('fetch-wechat');
var tf = require('@tensorflow/tfjs-core');
var webgl = require('@tensorflow/tfjs-backend-webgl');
const plugin = requirePlugin('tfjsPlugin');
var cpu = require('@tensorflow/tfjs-backend-cpu');
const ENABLE_DEBUG = true;

App({
  onLaunch: function() {
    this.getDeviceInfo();
    plugin.configPlugin({
      fetchFunc: fetchWechat.fetchFunc(),
      tf,
      webgl,
      cpu,
      canvas: wx.createOffscreenCanvas()
    }, ENABLE_DEBUG);
  },
  getDeviceInfo() {
    try {
      const res = wx.getSystemInfoSync();
      console.log("res", res);
      this.globalData.appWidth = typeof res.screenWidth === 'number' ? res.screenWidth : 320;
      this.globalData.appHeight = typeof res.screenHeight === 'number' ? res.screenHeight : 500;
      this.globalData.benchmarkLevel = typeof res.benchmarkLevel === 'number' ? res.benchmarkLevel : -1;
      wx.reportAnalytics('get_device_info', {
        device_info: JSON.stringify(res)
      });

      const deviceInfo = wx.getDeviceInfo()
      console.log(deviceInfo.system)
      console.log(deviceInfo.platform)

    } catch (e) {
      console.log(e);
    }
  },
  globalData: {
    appWidth: 320,
    appHeight: 500,
    benchmarkLevel: -1
  }
})
