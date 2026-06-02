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
      waves.push(new Wave());
    }

    if (waves.length > 20) {
      waves.splice(0, 5);
    }
  }, 800);

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
  background(0, 10, 20); // 深蓝黑

  let now = millis();
  let timeSinceLastActive = now - lastActiveTime;

  if (timeSinceLastActive < 500) {
    distortion = min(1, distortion + 0.05);
  } else {
    distortion = max(0, distortion - 0.005);
  }

  noiseLevel = distortion;

  if (audioReady) {
    if (ambientSound) {
      ambientSound.rate(1 - distortion * 0.3);
    }
    if (noiseSound) {
      noiseSound.setVolume(noiseLevel * 0.3);
    }
  }

  drawBackgroundNoise(noiseLevel);

  for (let i = waves.length - 1; i >= 0; i--) {
    waves[i].update();
    waves[i].display();

    if (waves[i].alpha <= 0) {
      waves.splice(i, 1);
    }
  }
}

function drawBackgroundNoise(level) {
  loadPixels();
  if (level > 0.01) {
    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        let noiseVal = random(level * 30);
        let index = (x + y * width) * 4;
        pixels[index] = pixels[index] + noiseVal;
        pixels[index + 1] = pixels[index + 1] + noiseVal;
        pixels[index + 2] = pixels[index + 2] + noiseVal;
      }
    }
  }
  updatePixels();
}

function mouseMoved() {
  lastActiveTime = millis();
  if (random() < 0.3) {
    waves.push(new Wave(mouseX, mouseY, true));
  }
}

function mousePressed() {
  lastActiveTime = millis();
  for (let i = 0; i < 3; i++) {
    waves.push(
      new Wave(mouseX + random(-20, 20), mouseY + random(-20, 20), true),
    );
  }
}

function keyPressed() {
  lastActiveTime = millis();
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

// ==========================================
// 正确融合后的 Wave 类
// ==========================================
class Wave {
  constructor(x, y, isDisturbed = false, sizeMultiplier = 1.0) {
    if (x === undefined || y === undefined) {
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

    // 引入 Z 轴深度 (0.3 = 远处, 1.0 = 近处)
    this.z = random(0.3, 1.0);

    this.radius = 5;
    // 根据深度调整最大半径
    this.maxRadius = random(100, 200) * sizeMultiplier * (0.7 + this.z * 0.5);
    // 根据深度调整速度 (近快远慢)
    this.speed = random(1, 2) * (0.5 + this.z * 0.8);

    // 基础透明度受 Z 轴影响 (远处的淡)
    this.baseAlpha = 100 * this.z;
    this.alpha = this.baseAlpha;

    this.isDisturbed = isDisturbed;
    this.distortionAmount = isDisturbed ? random(0.3, 0.8) : 0;

    if (isDisturbed) {
      this.r = 200 + random(55);
      this.g = 100 + random(50);
      this.b = 150 + random(105);
    } else {
      this.r = 50 + random(50);
      this.g = 100 + random(100);
      this.b = 200 + random(55);
    }

    // 模拟 3D 透视：远处的波纹稍微向上偏移（往地平线靠拢）
    this.displayY = this.y - (1 - this.z) * height * 0.1;
  }

  update() {
    this.radius += this.speed;
    // 使用动态的 baseAlpha 映射透明度
    this.alpha = map(this.radius, 0, this.maxRadius, this.baseAlpha, 0);

    if (!this.isDisturbed && distortion > 0.2) {
      this.alpha *= 1 - distortion * 0.5;
    }
  }

  display() {
    noFill();
    strokeWeight(1.5 * this.z); // 远处的线条更细

    let currentAlpha = this.alpha * (1 - noiseLevel * 0.3);

    if (this.isDisturbed || distortion > 0.3) {
      stroke(this.r, this.g, this.b, currentAlpha);

      let points = 16;
      let noiseFactor = this.isDisturbed ? 15 : 10 * distortion;

      beginShape();
      for (let i = 0; i < points; i++) {
        let angle = map(i, 0, points, 0, TWO_PI);
        let rOffset = noise(i * 0.5, frameCount * 0.02) * noiseFactor;
        let r = this.radius + rOffset;
        let x = this.x + cos(angle) * r;
        // 绘制时使用计算好透视的 displayY
        let y = this.displayY + sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
    } else {
      stroke(this.r, this.g, this.b, currentAlpha);
      ellipse(this.x, this.displayY, this.radius * 2);
    }

    if (this.radius > 30 && random() < 0.3) {
      stroke(this.r, this.g, this.b, currentAlpha * 0.3);
      ellipse(this.x, this.displayY, this.radius * 1.5);
    }
  }
}
