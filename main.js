
const paper = document.getElementById("paper"),
      pen = paper.getContext("2d");

const get = selector => document.querySelector(selector);

const toggles = {
  sound: get("#sound-toggle")
}

const colors = [];

const initialColor = [68, 209, 201]; // Cor inicial: rgba(68, 209, 201, 1)
const finalColor = [255, 255, 255]; // Cor final: branco

const step = [
  (finalColor[0] - initialColor[0]) / 19, // R
  (finalColor[1] - initialColor[1]) / 19, // G
  (finalColor[2] - initialColor[2]) / 19  // B
];

for (let i = 0; i < 21; i++) {
  const color = [
    Math.round(initialColor[0] + step[0] * i),
    Math.round(initialColor[1] + step[1] * i),
    Math.round(initialColor[2] + step[2] * i)
  ];
  const rgbaColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
  colors.push(rgbaColor);
}


const settings = {
  startTime: new Date().getTime(), // This can be in the future
  duration: 900, // Total time for all dots to realign at the starting point
  maxCycles: Math.max(colors.length, 100), // Must be above colors.length or else...
  soundEnabled: false, // User still must interact with screen first
  pulseEnabled: true, // Pulse will only show if sound is enabled as well
  instrument: "vibraphone" // "default" | "wave" | "vibraphone"
}

const getFileName = index => {
  if(settings.instrument === "default") return `key-${index}`; 
  
  return `${settings.instrument}-key-${index}`;
}
 
const getUrl = index => `https://assets.codepen.io/1468070/${getFileName(index)}.wav`;

const handleSoundToggle = (enabled = !settings.soundEnabled) => {  
  settings.soundEnabled = enabled;
  toggles.sound.dataset.toggled = enabled;
}

document.onvisibilitychange = () => handleSoundToggle(false);

paper.onclick = () => handleSoundToggle();

let arcs = [];

const calculateVelocity = index => {  
    const numberOfCycles = settings.maxCycles - index,
          distancePerCycle = 2 * Math.PI;
  
  return (numberOfCycles * distancePerCycle) / settings.duration;
}

const calculateNextImpactTime = (currentImpactTime, velocity) => {
  return currentImpactTime + (Math.PI / velocity) * 1000;
}

const calculateDynamicOpacity = (currentTime, lastImpactTime, baseOpacity, maxOpacity, duration) => {
  const timeSinceImpact = currentTime - lastImpactTime,
        percentage = Math.min(timeSinceImpact / duration, 1),
        opacityDelta = maxOpacity - baseOpacity;
  
  return maxOpacity - (opacityDelta * percentage);
}

const determineOpacity = (currentTime, lastImpactTime, baseOpacity, maxOpacity, duration) => {
  if(!settings.pulseEnabled) return baseOpacity;
  
  return calculateDynamicOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration);
}

const calculatePositionOnArc = (center, radius, angle) => ({
  x: center.x + radius * Math.cos(angle),
  y: center.y + radius * Math.sin(angle)
});

const playKey = index => {  
  const audio = new Audio(getUrl(index));

  audio.volume = 0.15;

  audio.play();
}

const init = () => {
  arcs = colors.map((color, index) => {
    const velocity = calculateVelocity(index),
          lastImpactTime = 0,
          nextImpactTime = calculateNextImpactTime(settings.startTime, velocity);

    return {
      color,
      velocity,
      lastImpactTime,
      nextImpactTime
    }
  });
}

const drawArc = (x, y, radius, start, end, action = "stroke") => {
  pen.beginPath();
  
  pen.arc(x, y, radius, start, end);
  
  if(action === "stroke") pen.stroke();    
  else pen.fill();
}

const drawPointOnArc = (center, arcRadius, pointRadius, angle) => {
  const position = calculatePositionOnArc(center, arcRadius, angle);

  drawArc(position.x, position.y, pointRadius, 0, 2 * Math.PI, "fill");    
}

const draw = () => { // Definitely not optimized
  const currentTime = new Date().getTime(),
        elapsedTime = (currentTime - settings.startTime) / 1000;
  
  const length = Math.min(window.innerWidth, window.innerHeight) * 0.8,
        offset = (window.innerWidth - length) / 2;
  
  const start = {
    x: offset,
    y: window.innerHeight / 2
  }

  const end = {
    x: window.innerWidth - offset,
    y: window.innerHeight / 2
  }

  const center = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }

  const base = {
    length: end.x - start.x,
    minAngle: 0,
    startAngle: 0,
    maxAngle: 2 * Math.PI
  }

  base.initialRadius = base.length * 0.1;
  base.circleRadius = base.length * 0.006;
  base.clearance = base.length * 0.03;
  base.spacing = (base.length - base.initialRadius - base.clearance) / 2 / colors.length;

  paper.width = paper.clientWidth;
  paper.height = paper.clientHeight;

  pen.lineCap = "round";

  arcs.forEach((arc, index) => { 
    const radius = base.initialRadius + (base.spacing * index);

    pen.globalAlpha = determineOpacity(currentTime, arc.lastImpactTime, 0.15, 0.65, 1000);
    pen.lineWidth = base.length * 0.02;
    pen.strokeStyle = arc.color;
    
    const offset = base.circleRadius * (5 / 2) / radius;
    
    drawArc(center.x, center.y, radius, Math.PI + offset, (2 * Math.PI) - offset);
    
    drawArc(center.x, center.y, radius, offset, Math.PI - offset);
  });
  
  arcs.forEach((arc, index) => { // Draw impact points
    const radius = base.initialRadius + (base.spacing * index);

    pen.globalAlpha = determineOpacity(currentTime, arc.lastImpactTime, 0.15, 0.85, 1000);
    pen.fillStyle = arc.color;
    
    drawPointOnArc(center, radius, base.circleRadius * 0.75, Math.PI);
    
    drawPointOnArc(center, radius, base.circleRadius * 0.75, 2 * Math.PI);
  });

  arcs.forEach((arc, index) => { // Draw moving circles
    const radius = base.initialRadius + (base.spacing * index);

    pen.globalAlpha = 1;
    //pen.fillStyle = arc.color;
   pen.fillStyle = colors[1];
    
    if(currentTime >= arc.nextImpactTime) {      
      if(settings.soundEnabled) {
        playKey(index);
        arc.lastImpactTime = arc.nextImpactTime;
      }
      
      arc.nextImpactTime = calculateNextImpactTime(arc.nextImpactTime, arc.velocity);      
    }
    
    const distance = elapsedTime >= 0 ? (elapsedTime * arc.velocity) : 0,
          angle = (Math.PI + distance) % base.maxAngle;
    
    drawPointOnArc(center, radius, base.circleRadius, angle);
  });
  
  requestAnimationFrame(draw);
}

init();

draw();