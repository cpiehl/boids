
// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const DRAW_TRAIL = false;

let lastTimestamp = 0;

const numBoids = 500;
const numBigBoids = 1;
const visualRange = 75;  // The distance that boids will start to flock
const visualRange2 = visualRange * visualRange;

const centeringFactor = 0.005; // adjust velocity by this %
const minDistance2 = 400; // The distance to stay away from other boids squared
const avoidFactor = 0.02; // Adjust velocity by this %
const predatorDistance2 = 10000; // The distance to stay away from predator boids squared
const matchingFactor = 0.05; // Adjust by this % of average velocity
const speedLimit = 15;

const margin = 100; // The distance from edge of screen to turn around
const turnFactor = 0.5; // How fast to turn around

var boids = [];
var bigboids = [];

function initBoids() {
  for (var i = 0; i < numBoids; i += 1) {
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
    };
  }
  for (var i = 0; i < numBigBoids; i += 1) {
    bigboids[bigboids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
    };
  }
}

function distance2(boid1, boid2) {
  return (boid1.x - boid2.x) * (boid1.x - boid2.x) +
  (boid1.y - boid2.y) * (boid1.y - boid2.y);
}

function distance(boid1, boid2) {
  return Math.sqrt(distance2(boid1, boid2));
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => distance2(boid, a) - distance2(boid, b));
  // Return the `n` closest
  return sorted.slice(1, n + 1);
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {

  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - margin) {
    boid.dy -= turnFactor;
  }
}

// Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid, range2) {

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance2(boid, otherBoid) < range2) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }
}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
  let moveX = 0;
  let moveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (distance2(boid, otherBoid) < minDistance2) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

function avoidPredator(boid) {
  let moveX = 0;
  let moveY = 0;
  for (let bigboid of bigboids) {
    if (distance2(boid, bigboid) < predatorDistance2) {
      moveX += boid.x - bigboid.x;
      moveY += boid.y - bigboid.y;
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {

  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance2(boid, otherBoid) < visualRange2) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}

function drawBoid(ctx, boid, color) {
  if (!color) color = "#558cf4";
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (DRAW_TRAIL) {
    ctx.strokeStyle = "#558cf466";
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

// Main animation loop
function animationLoop(timestamp) {
  var duration = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);

  // Update each boid
  for (let boid of boids) {
    // Update the velocities according to each rule
    flyTowardsCenter(boid, visualRange2);
    avoidOthers(boid);
    avoidPredator(boid);
    matchVelocity(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);

    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    if (DRAW_TRAIL) {
      boid.history.push([boid.x, boid.y])
      boid.history = boid.history.slice(-50);
    }

    drawBoid(ctx, boid);
  }

  for (let bigboid of bigboids) {
    flyTowardsCenter(bigboid, 4 * visualRange2);
    matchVelocity(bigboid);
    limitSpeed(bigboid);
    keepWithinBounds(bigboid);
    bigboid.x += bigboid.dx;
    bigboid.y += bigboid.dy;
    if (DRAW_TRAIL) {
      bigboid.history.push([bigboid.x, bigboid.y])
      bigboid.history = bigboid.history.slice(-50);
    }
    drawBoid(ctx, bigboid, "red");
  }

  ctx.fillStyle = "white";
  ctx.font = "30px Consolas";
  ctx.fillText(`FPS: ${(1000/duration).toFixed(2)}`, 10, 50);

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};
