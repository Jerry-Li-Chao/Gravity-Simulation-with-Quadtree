let particles = [];
let attractors = [];
let explosionForce = 200; // Adjust this value to change the strength of the explosion
let explosionRadius = 100; // Adjust this value to change the radius of the explosion
let minCapacity = 4;
let maxCapacity = 64;
let showQuadTree = false; // New variable to control QuadTree visibility
let toggleButton; // New variable for the toggle button
let particleCount = 800; // Number of particles
let isTouchDevice = false;

function setup() {
  // 90% of browser window size
  createCanvas(windowWidth * 0.95, windowHeight * 0.95);

  for (let i = 0; i < particleCount; i++) {
    // check if using mobile device or computer browser
    if (windowWidth < 600) {
      particles[i] = new Particle(
        random(width),
        random(height),
        random(0.5, 3)
      );
    } else {
      particles[i] = new Particle(
        random(width),
        random(height),
        random(0.5, 5)
      );
    }
  }

  // Create toggle button
  toggleButton = createButton("Toggle QuadTree");
  toggleButton.position(10, height - 40);
  toggleButton.mousePressed(toggleQuadTree);
  toggleButton.touchStarted(toggleQuadTree); // Add touch event listener to the button

  // Create multiple attractors
  // attractors.push(
  //   new Attractor(
  //     width / 3,
  //     height / 2,
  //     5,
  //     windowWidth * 0.03,
  //     true,
  //     random(2, -2),
  //     random(2, -2)
  //   )
  // ); // Attracting

  // attractors.push(
  //   new Attractor(
  //     (2 * width) / 3,
  //     height / 2,
  //     40,
  //     windowWidth * 0.03,
  //     false,
  //     random(2, 4),
  //     random(2, 4)
  //   )
  // ); // Repelling
}

function draw() {
  background(0);

  // Count highlighted particles
  let highlightedCount = Particle.countHighlighted(particles);

  // Calculate dynamic capacity
  let clusterFactor = Math.min(1, highlightedCount / (particles.length * 0.6));
  let dynamicCapacity = calculatePowerOf2Capacity(clusterFactor);

  let boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
  let qtree = new QuadTree(boundary, dynamicCapacity);

  // Display and move attractors
  for (let attractor of attractors) {
    attractor.move();
    attractor.displayAttractor();
    // attractor.displayInfluenceRadius();
  }

  for (let p of particles) {
    let point = new Point(p.x, p.y, p);
    qtree.insert(point);

    // Apply attractor forces using QuadTree
    for (let attractor of attractors) {
      attractor.applyForce(qtree);
    }
    p.move(particles, qtree);
    p.render();

    // Reset collisions and highlights for the next frame
    p.resetCollisions();
  }

  // Only show QuadTree if showQuadTree is true
  if (showQuadTree) {
    qtree.show();
  }

  // Optionally, visualize the explosion radius when mouse is pressed or touch is active
  if (mouseIsPressed || (touches && touches.length > 0)) {
    if (!isOverInteractiveElement()) {
      noFill();
      stroke(255, 0, 0);
      ellipse(mouseX, mouseY, explosionRadius * 2);
    }
  }

  // display and update frame rate at the top left corner
  fill(255);
  noStroke();
  text("FPS: " + floor(frameRate()), 10, 20);
  text(`QuadTree Capacity: ${dynamicCapacity}`, 10, 40);
  text(`Clustered Particles: ${highlightedCount}/${particleCount}`, 10, 60);
  text(
    `Total Kenetic Energy of the System: ${floor(
      Particle.totalKeneticEnergy(particles)
    )}`,
    10,
    80
  );

  text(`Collision Checks/sec: ${maxCollisionCount}`, 10, 100);
  // clear the collision count every second
  if (frameCount % 60 === 0) {
    maxCollisionCount = collisionCount;
    collisionCount = 0;
  }
}

// New function to check if the mouse is over the button
function isMouseOverButton() {
  // console.log(`MouseX: ${mouseX}, MouseY: ${mouseY}`);
  // console.log(`ButtonX: ${toggleButton.x}, ButtonY: ${toggleButton.y}`);
  // console.log(
  //   `ButtonWidth: ${toggleButton.width}, ButtonHeight: ${toggleButton.height}`
  // );
  return (
    mouseX > toggleButton.x - 8 &&
    mouseX < toggleButton.x + toggleButton.width + 2 &&
    mouseY > toggleButton.y - 6 &&
    mouseY < toggleButton.y + toggleButton.height + 2
  );
}

function mousePressed() {
  if (!isTouchDevice && !isOverInteractiveElement()) {
    handleInteraction(mouseX, mouseY);
  }
}

function touchStarted() {
  isTouchDevice = true;
  if (!isOverInteractiveElement()) {
    handleInteraction();
    // Prevent default touch behavior only if not over the button
    return false;
  }
  // Allow default touch behavior (like button clicks) if over an interactive element
  return true;
}

function handleInteraction(x, y) {
  for (let p of particles) {
    p.applyExplosionForce(x, y, explosionForce, explosionRadius);
  }
}

function isOverInteractiveElement() {
  let x = mouseX;
  let y = mouseY;

  // Use the first touch point if available
  if (touches && touches.length > 0) {
    x = touches[0].x;
    y = touches[0].y;
  }

  return (
    x > toggleButton.x - 8 &&
    x < toggleButton.x + toggleButton.width + 2 &&
    y > toggleButton.y - 6 &&
    y < toggleButton.y + toggleButton.height + 2
  );
}

function calculatePowerOf2Capacity(clusterFactor) {
  // Calculate the raw capacity value
  let rawCapacity = maxCapacity - (maxCapacity - minCapacity) * clusterFactor;

  // Find the nearest power of 2
  let powerOf2Capacity = Math.pow(2, Math.round(Math.log2(rawCapacity)));

  // Ensure the result is within the min and max bounds
  return Math.max(minCapacity, Math.min(maxCapacity, powerOf2Capacity));
}

// New function to toggle QuadTree visibility
function toggleQuadTree() {
  showQuadTree = !showQuadTree;
}
