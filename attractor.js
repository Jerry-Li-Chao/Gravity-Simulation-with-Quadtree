class Attractor {
  constructor(x, y, mass, radius, isAttracting = true, vx, vy) {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.radius = radius;
    this.influenceRadius = radius * 5; // Radius of influence
    this.isAttracting = isAttracting; // True for attraction, false for repulsion

    // Initial velocity
    this.vx = vx;
    this.vy = vy;

    // Color based on attraction/repulsion
    this.color = this.isAttracting ? color(0) : color(0);
  }

  applyForce(qtree) {
    let range = new Circle(this.x, this.y, this.influenceRadius);
    let points = qtree.query(range);

    for (let point of points) {
      let particle = point.userData;
      let dx = this.x - particle.x;
      let dy = this.y - particle.y;
      let distance = dist(this.x, this.y, particle.x, particle.y);

      if (distance < this.influenceRadius && distance > this.radius) {
        let force = this.mass / (distance * distance);
        let fx = (dx / distance) * force;
        let fy = (dy / distance) * force;

        // Reverse force direction if repelling
        if (!this.isAttracting) {
          fx *= -1;
          fy *= -1;
        }

        particle.applyForce(fx, fy);
      }
    }
  }

  move() {
    // Update position
    this.x += this.vx;
    this.y += this.vy;

    if (frameCount % 60 == 0) {
      // change direction
      this.vx += random(-1, 1);
      this.vy += random(-1, 1);
    }

    // Bounce off edges
    if (this.x - this.radius < 0 || this.x + this.radius > width) {
      this.vx *= -1;
      this.x = constrain(this.x, this.radius, width - this.radius);
    }
    if (this.y - this.radius < 0 || this.y + this.radius > height) {
      this.vy *= -1;
      this.y = constrain(this.y, this.radius, height - this.radius);
    }
  }

  displayAttractor() {
    // Draw the attractor
    fill(this.color);
    if (this.isAttracting) {
      //Black Hole
      stroke(255);
      ellipse(this.x, this.y, this.radius * 2);
    } else {
      // White Hole
      stroke(255);
      ellipse(this.x, this.y, this.radius * 2);
      stroke(255);
      fill(255);
      ellipse(this.x, this.y, this.radius * 0.5);
    }
  }

  displayInfluenceRadius() {
    // Draw the influence radius
    noFill();
    stroke(255, 100);
    strokeWeight(1);
    drawingContext.setLineDash([5, 5]);
    ellipse(this.x, this.y, this.influenceRadius * 2);
    drawingContext.setLineDash([]);
  }

  display() {
    this.displayAttractor();
    this.displayInfluenceRadius();
  }
}
