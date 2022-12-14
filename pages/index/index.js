// index.js
Page({
  // 页面初始数据
  data: {
    modelsList: [
      {
        url: "/pages/movenet/index",
        logo: "/static/img/posenet.png",
        title: "姿势估计-movenet",
        desc: "实时人体姿势"
      },
      {
        url: "/pages/posenet/index",
        logo: "/static/img/posenet.png",
        title: "姿势估计-posenet",
        desc: "实时人体姿势"
      }
    ],
  },

  handleClickItem(e) {
    let { url } = e.currentTarget.dataset;
    wx.navigateTo({
      url
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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

  
  
})
