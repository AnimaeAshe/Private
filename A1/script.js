// 待机之静 - 互动即破坏
// 概念：完美的水波纹状态是“本真”，用户互动是“扰动”

let waves = []; // 存储所有波纹
let distortion = 0; // 扭曲程度 0-1
let noiseLevel = 0; // 背景噪声程度
let lastActiveTime = 0; // 上次用户互动时间
let idleTimeout = 3000; // 3秒无操作后开始恢复

// 音频相关
let ambientSound;
let noiseSound;
let audioReady = false;

function preload() {
  // 尝试加载音频，如果没有音频文件，程序会继续运行（视觉模式）
  // 你可以把两个mp3文件放在audio文件夹里
  try {
    ambientSound = loadSound(
      "audio/ambient.mp3",
      () => console.log("环境音加载成功"),
      () => console.log("环境音加载失败，将使用纯视觉模式"),
    );
    noiseSound = loadSound(
      "audio/noise.mp3",
      () => console.log("噪音加载成功"),
      () => console.log("噪音加载失败，将使用纯视觉模式"),
    );
  } catch (e) {
    console.log("音频不可用，运行视觉模式");
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 初始化波纹 - 持续产生完美的波纹
  setInterval(() => {
    if (distortion < 0.3) {
      // 只在相对宁静时产生新波纹
      waves.push(new Wave());
    }

    // 限制波纹数量
    if (waves.length > 20) {
      waves.splice(0, 5);
    }
  }, 800); // 每0.8秒一个新波纹

  // 音频设置
  if (ambientSound && noiseSound) {
    ambientSound.setVolume(0.5);
    ambientSound.loop();

    noiseSound.setVolume(0);
    noiseSound.loop();
    audioReady = true;
  }

  lastActiveTime = millis();
}

function draw() {
  // 背景 - 深色，带轻微的不完美纹理
  background(0, 10, 20); // 深蓝黑

  // 检测是否处于互动状态
  let now = millis();
  let timeSinceLastActive = now - lastActiveTime;

  // 扭曲程度：最近有互动就高，无互动就逐渐降低
  if (timeSinceLastActive < 500) {
    // 刚互动完，扭曲最大化
    distortion = min(1, distortion + 0.05);
  } else {
    // 逐渐恢复平静
    distortion = max(0, distortion - 0.005);
  }

  // 噪声程度跟随扭曲
  noiseLevel = distortion;

  // 更新音频
  if (audioReady) {
    // 扭曲程度控制环境音的音量和播放速度
    if (ambientSound) {
      ambientSound.rate(1 - distortion * 0.3); // 扭曲时变慢
    }

    // 噪声音量随扭曲程度增加
    if (noiseSound) {
      noiseSound.setVolume(noiseLevel * 0.3);
    }
  }

  // 绘制背景噪点（扭曲程度越高，噪点越明显）
  drawBackgroundNoise(noiseLevel);

  // 更新并绘制所有波纹
  for (let i = waves.length - 1; i >= 0; i--) {
    waves[i].update();
    waves[i].display();

    // 移除完全消失的波纹
    if (waves[i].alpha <= 0) {
      waves.splice(i, 1);
    }
  }

  // 显示当前状态（调试时可关闭）
  // 显示扭曲程度（可选，正式版可以注释掉）
  // fill(255, 100);
  // noStroke();
  // text(`宁静度: ${Math.round((1-distortion)*100)}%`, 20, 30);
}

// 背景噪声绘制
function drawBackgroundNoise(level) {
  loadPixels();
  // 只在噪声明显时计算，优化性能
  if (level > 0.01) {
    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        let noise = random(level * 30);
        let index = (x + y * width) * 4;
        pixels[index] = pixels[index] + noise; // R
        pixels[index + 1] = pixels[index + 1] + noise; // G
        pixels[index + 2] = pixels[index + 2] + noise; // B
      }
    }
  }
  updatePixels();
}

// 用户互动检测
function mouseMoved() {
  lastActiveTime = millis();
  // 鼠标移动产生一个小扭曲波纹（破坏）
  if (random() < 0.3) {
    // 概率产生，避免太多
    waves.push(new Wave(mouseX, mouseY, true));
  }
}

function mousePressed() {
  lastActiveTime = millis();
  // 点击产生多个扭曲波纹
  for (let i = 0; i < 3; i++) {
    waves.push(
      new Wave(mouseX + random(-20, 20), mouseY + random(-20, 20), true),
    );
  }
}

function keyPressed() {
  lastActiveTime = millis();
  // 按键产生大的扭曲波纹
  waves.push(
    new Wave(
      width / 2 + random(-50, 50),
      height / 2 + random(-50, 50),
      true,
      2.0,
    ),
  );
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 波纹类
class Wave {
  constructor(x, y, isDisturbed = false, sizeMultiplier = 1.0) {
    // 如果没有提供坐标，随机在画面边缘或中心产生
    if (x === undefined || y === undefined) {
      // 80%概率从中心附近产生，20%从边缘
      if (random() < 0.8) {
        this.x = width / 2 + random(-50, 50);
        this.y = height / 2 + random(-50, 50);
      } else {
        this.x = random(width);
        this.y = random(height);
      }
    } else {
      this.x = x;
      this.y = y;
    }

    this.radius = 5;
    this.maxRadius = random(100, 200) * sizeMultiplier;
    this.speed = random(1, 2);
    this.alpha = 100;
    this.isDisturbed = isDisturbed; // 是否为扰动产生的波纹
    this.distortionAmount = isDisturbed ? random(0.3, 0.8) : 0;

    // 颜色：平静时偏蓝，扰动时偏红/紫
    if (isDisturbed) {
      this.r = 200 + random(55);
      this.g = 100 + random(50);
      this.b = 150 + random(105);
    } else {
      this.r = 50 + random(50);
      this.g = 100 + random(100);
      this.b = 200 + random(55);
    }
  }

  update() {
    this.radius += this.speed;
    // 波纹越远越淡
    this.alpha = map(this.radius, 0, this.maxRadius, 100, 0);

    // 受整体扭曲程度影响
    if (!this.isDisturbed && distortion > 0.2) {
      // 平静的波纹也会被整体扭曲影响
      this.alpha *= 1 - distortion * 0.5;
    }
  }

  display() {
    noFill();
    strokeWeight(1.5);

    // 线条透明度受整体扭曲影响
    let currentAlpha = this.alpha * (1 - noiseLevel * 0.3);

    if (this.isDisturbed || distortion > 0.3) {
      // 扭曲的波纹：不完美的形状
      stroke(this.r, this.g, this.b, currentAlpha);

      // 绘制不完美的圆 - 用点来模拟扭曲
      let points = 16;
      let noiseFactor = this.isDisturbed ? 15 : 10 * distortion;

      beginShape();
      for (let i = 0; i < points; i++) {
        let angle = map(i, 0, points, 0, TWO_PI);
        // 半径随角度变化，产生扭曲
        let rOffset = noise(i * 0.5, frameCount * 0.02) * noiseFactor;
        let r = this.radius + rOffset;
        let x = this.x + cos(angle) * r;
        let y = this.y + sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
    } else {
      // 完美的波纹：正圆
      stroke(this.r, this.g, this.b, currentAlpha);
      ellipse(this.x, this.y, this.radius * 2);
    }

    // 偶尔绘制第二个同心圆（丰富层次）
    if (this.radius > 30 && random() < 0.3) {
      stroke(this.r, this.g, this.b, currentAlpha * 0.3);
      ellipse(this.x, this.y, this.radius * 1.5);
    }

    // 在 Wave 类里增加 z 轴属性
    class Wave {
      constructor(x, y, isDisturbed = false) {
        // ... 原有代码保留 ...

        // 新增：z 轴深度 (0-1, 0=最远, 1=最近)
        this.z = random(0.3, 1.0); // 让波纹有远近层次

        // 根据深度调整属性
        this.baseSpeed = this.speed * (0.5 + this.z * 0.8); // 近的快，远的慢
        this.baseAlpha = 100 * this.z; // 近的实，远的淡
        this.baseRadius = this.maxRadius * (0.7 + this.z * 0.5); // 近的大，远的小

        // 透视效果：远处的略微向上偏移（模拟地平线）
        this.perspectiveY = this.y * (1 - (1 - this.z) * 0.3);
      }

      display() {
        // 用透视后的坐标
        let displayY = this.y; // 原代码先用 this.y

        // 如果启用透视，可以加：
        // let displayY = this.y - (1 - this.z) * height * 0.1;

        // 绘制时用 this.z 控制大小和透明度
        // ... 其余代码
      }
    }
  }
}
