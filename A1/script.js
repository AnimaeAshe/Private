let waves = [];
let distortion = 0;
let noiseLevel = 0;
let lastActiveTime = 0;
let idleTimeout = 3000;

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
    noiseSound.setVolume(0);
    audioReady = true;
  }

  lastActiveTime = millis();
}

function draw() {
  background(0);

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

function mousePressed() {
  if (audioReady) {
    if (!ambientSound.isPlaying()) {
      ambientSound.loop();
    }
    if (!noiseSound.isPlaying()) {
      noiseSound.loop();
    }
  }

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

    this.z = random(0.3, 1.0);

    this.radius = 5;
    this.maxRadius = random(100, 200) * sizeMultiplier * (0.7 + this.z * 0.5);
    this.speed = random(1, 2) * (0.5 + this.z * 0.8);

    this.baseAlpha = 100 * this.z;
    this.alpha = this.baseAlpha;

    this.isDisturbed = isDisturbed;
    this.distortionAmount = isDisturbed ? random(0.3, 0.8) : 0;

    if (isDisturbed) {
      let grey = 220 + random(35);
      this.r = grey;
      this.g = grey;
      this.b = grey;
    } else {
      let grey = 220 + random(35);
      this.r = grey;
      this.g = grey;
      this.b = grey;
    }

    this.displayY = this.y - (1 - this.z) * height * 0.1;
  }

  update() {
    this.radius += this.speed;
    this.alpha = map(this.radius, 0, this.maxRadius, this.baseAlpha, 0);

    if (!this.isDisturbed && distortion > 0.2) {
      this.alpha *= 1 - distortion * 0.5;
    }
  }

  display() {
    noFill();
    strokeWeight(1.0 * this.z);

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
