class VPip {
  constructor (
    {
      el,
      imgEl,
      imgList = [],
      radio = 1,
      index = 0,
      scale = 0.985,
      scaleSlow = 0.995,
      w = window.innerWidth,
      h = window.innerHeight,
      otherResource,
    },
  ) {
    //init data
    this.imgList = imgList;
    this.otherResource = otherResource
    this.radio = radio;
    this.index = index;
    this.scale = scale;
    this.scaleSlow = scaleSlow;
    this.w = w > h ? 725 : w;
    this.h = w > h ? 1206 : h;
    this.mode = 'sequence'

    //timer
    this.timer = null
    //container
    this.domList = null;
    this.containerImage = null;
    this.innerImage = null;
    //el
    this.imgEl = imgEl;
    //canvas
    this.canvas = $(el)[0];
    this.ctx = this.canvas.getContext('2d');
  }

  async init () {
    try {
      await this.preloadResource()
      this.initDom()
      this._draw();
      $('.start').on('touchstart', this.handleTouchStart.bind(this));
      $('.start').on('touchend', this.handleTouchEnd.bind(this))
    } catch (e) {
      console.log(e)
    }
  }

  initDom () {
    $('.loading').fadeOut();
    $('.title_bg').css('background-image', 'url(http://static.ws.126.net/f2e/ent/ent_painting2016/images/title_bg.gif?1572515819128)')
    $('.title').css('background-image', 'url(http://static.ws.126.net/f2e/ent/ent_painting2016/images/title.gif?1572515819127)')
    this.domList = $(this.imgEl).children().sort((a, b) => a.name - b.name)
  }

  preloadResource () {
    const promiseList = [...this.imgList, ...this.otherResource].map((item, index) => {
      return new Promise((resolve, reject) => {
        const image = new Image()
        image.src = item.link
        image.i = index;
        image.name = String(index);
        image.className = 'item';
        image.onload = () => {
          const { imgEl } = this
          $(imgEl)[0].append(image);
          resolve();
        }
        image.onerror = () => reject('资源加载失败' + item.link);
      })
    })
    return Promise.all(promiseList);
  }

  drawScenes () {
    const imgOver = this.imgList[this.index + 1];
    const imgMini = this.imgList[this.index];
    this.containerImage = this.domList[this.index + 1];
    this.innerImage = this.domList[this.index];
    if (!imgOver && this.mode === 'sequence') {
      console.log(imgOver, this.mode)
      this.handleEndEvent('正放结束');
      $('.start').hide()
      $('.operating').fadeIn()
      this.mode = 'reverse'
      this.index = this.imgList.length - 2
      cancelAnimationFrame(this.timer);
      return
    }
    if (!imgMini && this.mode === 'reverse') {
      console.log(imgMini, this.mode)
      this.handleEndEvent('倒放结束' + this.index);
      $('.cover').fadeIn()
      this.mode = 'sequence'
      this.index = 0
      this.radio = 1
      cancelAnimationFrame(this.timer);
      return
    }

    this._drawImgOverSize(
      this.containerImage,
      imgOver.imgW,
      imgOver.imgH,
      imgOver.areaW,
      imgOver.areaH,
      imgOver.areaL,
      imgOver.areaT,
      this.radio,
    )
    this._drawImgMinSize(
      this.innerImage,
      imgMini.imgW,
      imgMini.imgH,
      imgOver.imgW,
      imgOver.imgH,
      imgOver.areaW,
      imgOver.areaH,
      imgOver.areaL,
      imgOver.areaT,
      this.radio,
    )

    let { radio, scaleSlow, scale } = this

    let { limitMax, limitMin, areaW, imgW } = imgOver
    if (this.mode === 'sequence') {
      this.radio = limitMax && limitMax > radio && limitMin < radio ? radio * scaleSlow : radio * scale;
      if (this.radio <= areaW / imgW) {
        this.index++;
        this.radio = 1;
      }
    } else {
      this.radio = limitMax && limitMax > radio && limitMin < radio ? radio / scaleSlow : radio / scale;
      if (this.radio >= 1) {
        let { areaW, imgW } = imgMini
        this.radio = areaW / imgW;
        this.index -= 1
      }
    }
  }

  _draw () {
    this.drawScenes()
  }

  _drawImgOverSize (i, iw, ih, aw, ah, al, at, r) {
    this.ctx.drawImage(
      i,
      al - (aw / r - aw) * (al / (iw - aw)),
      at - (ah / r - ah) * (at / (ih - ah)),
      aw / r,
      ah / r,
      0,
      0,
      this.w,
      this.h,
    );
  }

  _drawImgMinSize (i, ciw, cih, iw, ih, aw, ah, al, at, r) {
    this.ctx.drawImage(
      i,
      0,
      0,
      ciw,
      cih,
      this.w * (1 - r) * (al / (iw - aw)),
      // ((ah / r - ah) * (at / (ih - ah)) * r * 1206) / ah,
      this.h * (1 - r) * (at / (ih - ah)),
      this.w * r,
      this.h * r,
    );
  }

  handleTouchStart (e) {
    e.stopPropagation();
    $('.cover').hide();
    $('.operating').hide()
    const render = () => {
      this.timer = requestAnimationFrame(render);
      this._draw();
    };
    cancelAnimationFrame(this.timer);
    this.timer = requestAnimationFrame(render);
  }

  handleTouchEnd (e) {
    e.stopPropagation();
    cancelAnimationFrame(this.timer);
  }

  handleEndEvent (text) {
    this.showToast(text)
  }

  showToast (text) {
    $('.toast').text(text)
    $('.toast').fadeIn('fast', function () {
      setTimeout(() => {
        $(this).fadeOut('slow')
      }, 1000)
    })
  }
}

