// YouTube Thumbnail Generator
// This script creates a canvas element that can be used to generate a thumbnail
// Run this in the browser console to generate the thumbnail

function createYouTubeThumbnail() {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative elements
  // Green circles for eco theme
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(200, 150, 300, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(1100, 600, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Add grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Main title
  ctx.font = 'bold 80px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('CarbonledgerAI', canvas.width / 2, 200);
  
  // Tagline
  ctx.font = '40px Arial';
  ctx.fillStyle = '#10b981';
  ctx.fillText('AI-Powered Carbon Credit System', canvas.width / 2, 270);
  
  // Feature boxes
  const features = [
    { icon: '🤖', text: 'AI Recommendations' },
    { icon: '⛓️', text: 'Blockchain Verified' },
    { icon: '📊', text: 'Carbon Analytics' },
    { icon: '🌱', text: 'Sustainable Impact' }
  ];
  
  const boxWidth = 250;
  const boxHeight = 100;
  const startX = (canvas.width - (boxWidth * features.length + 20 * (features.length - 1))) / 2;
  
  features.forEach((feature, index) => {
    const x = startX + index * (boxWidth + 20);
    const y = 350;
    
    // Box
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // Icon
    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(feature.icon, x + boxWidth / 2, y + 45);
    
    // Text
    ctx.font = 'bold 20px Arial';
    ctx.fillText(feature.text, x + boxWidth / 2, y + 80);
  });
  
  // "Built with" badge
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 150, 500, 300, 80, 40);
  ctx.fill();
  ctx.stroke();
  
  // Bolt text
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('Built with Bolt.new', canvas.width / 2, 550);
  
  // "Production Ready" badge
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(canvas.width - 300, 50, 250, 60, 30);
  ctx.fill();
  
  ctx.font = 'bold 30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('PRODUCTION READY', canvas.width - 175, 90);
  
  // Download link
  const link = document.createElement('a');
  link.download = 'carbonledgerai-thumbnail.png';
  link.href = canvas.toDataURL('image/png');
  link.textContent = 'Download Thumbnail';
  link.style.display = 'block';
  link.style.marginTop = '20px';
  link.style.color = 'blue';
  document.body.appendChild(link);
  
  return {
    canvas,
    download: () => link.click()
  };
}

// Create and show the thumbnail
const thumbnail = createYouTubeThumbnail();
console.log('Thumbnail created! Click the download link below the canvas or run thumbnail.download() to download.');