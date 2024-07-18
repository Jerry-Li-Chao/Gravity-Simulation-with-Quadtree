// Coefficient of restitution (1 = perfectly elastic, 0 = perfectly inelastic)
let cor = 0.9;
let gravityRange = 100;
// Gravitational constant (increased for stronger effect)
let G = 4;
let collisionCount = 0;
let maxCollisionCount = 0;

class Particle {
  constructor(x, y, mass = 2) {
    this.x = x;
    this.y = y;
    this.r = 4 * Math.sqrt(mass); // Radius proportional to square root of mass
    this.mass = mass;
    this.highlight = false;

    this.vx = Math.random(-3, 3); // Random initial velocity
    this.vy = Math.random(-3, 3); // Random initial velocity

    this.ax = 0; // Acceleration in x direction
    this.ay = 0; // Acceleration in y direction

    this.maxSpeed = 8; // Maximum speed limit

    this.collided = new Set();
  }

  static totalKeneticEnergy(particles) {
    let sum = 0;
    for (let p of particles) {
      let speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      let ke = 0.5 * p.mass * speed * speed;
      sum += ke;
    }
    return sum;
  }

  static countHighlighted(particles) {
    return particles.filter((p) => p.highlight).length;
  }

  applyForce(fx, fy) {
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  }

  applyExplosionForce(centerX, centerY, force, radius) {
    let dx = this.x - centerX;
    let dy = this.y - centerY;
    let distance = dist(this.x, this.y, centerX, centerY);

    // Only apply force if the particle is within the explosion radius
    if (distance <= radius) {
      // Avoid division by zero and very small distances
      if (distance < 1) distance = 1;

      // Calculate force magnitude (decreases linearly with distance)
      let forceMagnitude = force * (1 - distance / radius);

      // Calculate force components
      let fx = (dx / distance) * forceMagnitude;
      let fy = (dy / distance) * forceMagnitude;

      // Apply force
      this.applyForce(fx, fy);
    }
  }

  attractTo(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distanceSq = dx * dx + dy * dy;
    let distance = Math.sqrt(distanceSq);

    // Calculate gravitational force
    let force = (G * (this.mass * other.mass)) / distanceSq;

    // Calculate force components
    let fx = (force * dx) / distance;
    let fy = (force * dy) / distance;

    // Apply force
    this.applyForce(fx, fy);
  }

  limitSpeed() {
    let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }
  }

  intersects(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    return d < this.r + other.r;
  }

  resolveCollision(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distance = dist(this.x, this.y, other.x, other.y);

    // Separate particles
    let overlap = (this.r + other.r - distance) / 2;
    let separationX = (dx / distance) * overlap;
    let separationY = (dy / distance) * overlap;

    this.x -= separationX;
    this.y -= separationY;
    other.x += separationX;
    other.y += separationY;

    // Normal vector
    let nx = dx / distance;
    let ny = dy / distance;

    // Tangent vector
    let tx = -ny;
    let ty = nx;

    // Dot product tangent
    let dpTan1 = this.vx * tx + this.vy * ty;
    let dpTan2 = other.vx * tx + other.vy * ty;

    // Dot product normal
    let dpNorm1 = this.vx * nx + this.vy * ny;
    let dpNorm2 = other.vx * nx + other.vy * ny;

    // Conservation of momentum in 1D
    let m1 =
      (dpNorm1 * (this.mass - other.mass) + 2 * other.mass * dpNorm2) /
      (this.mass + other.mass);
    let m2 =
      (dpNorm2 * (other.mass - this.mass) + 2 * this.mass * dpNorm1) /
      (this.mass + other.mass);

    // Update velocities with energy loss
    this.vx = tx * dpTan1 + nx * m1 * cor;
    this.vy = ty * dpTan1 + ny * m1 * cor;
    other.vx = tx * dpTan2 + nx * m2 * cor;
    other.vy = ty * dpTan2 + ny * m2 * cor;

    // Apply speed limit after collision
    this.limitSpeed();
    other.limitSpeed();

    // Mark as collided and highlight
    this.collided.add(other);
    other.collided.add(this);
    this.highlight = true;
    other.highlight = true;
  }

  setHighlight(value) {
    this.highlight = value;
  }

  move(particles, qtree) {
    // Apply gravity from nearby particles
    let range = new Circle(this.x, this.y, gravityRange); // Increased range for gravity
    let points = qtree.query(range);

    // Update velocity based on acceleration
    this.vx += this.ax;
    this.vy += this.ay;

    // Apply speed limit
    this.limitSpeed();

    // Reset acceleration
    this.ax = 0;
    this.ay = 0;

    for (let p of points) {
      let other = p.userData;
      if (other !== this) {
        this.attractTo(other);
      }
    }

    // Boundary checking
    if (this.x - this.r < 0 || this.x + this.r > width) {
      this.vx *= -cor; // Lose some energy on collision with walls
      this.x = constrain(this.x, this.r, width - this.r);
    }
    if (this.y - this.r < 0 || this.y + this.r > height) {
      this.vy *= -cor; // Lose some energy on collision with walls
      this.y = constrain(this.y, this.r, height - this.r);
    }

    // Check collisions with other particles every 1 second
    for (let p of points) {
      let other = p.userData;
      if (
        other !== this &&
        !this.collided.has(other) &&
        this.intersects(other)
      ) {
        collisionCount++;
        this.resolveCollision(other);
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;
  }

  render() {
    noStroke();
    if (this.highlight) {
      fill(255, 0, 0, 200);
    } else {
      fill(100, 100, 255, 175); // Light blue color
    }
    ellipse(this.x, this.y, this.r * 2);
  }

  resetCollisions() {
    this.collided.clear();
    this.highlight = false;
  }
}
