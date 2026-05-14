export function drawBarChart(canvas, values, options = {}) {
  const { goal = null, labels = null } = options;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  if (!values.length) return;

  const styles = getComputedStyle(document.documentElement);
  const barColor = styles.getPropertyValue("--accent").trim() || "#e26d5c";
  const barOver = styles.getPropertyValue("--danger").trim() || "#c0392b";
  const axisColor = styles.getPropertyValue("--muted").trim() || "#888";
  const goalColor = styles.getPropertyValue("--goal").trim() || "#3aa76d";

  const padX = 8;
  const padTop = 12;
  const padBottom = labels ? 22 : 8;
  const W = cssW - padX * 2;
  const H = cssH - padTop - padBottom;

  const maxVal = Math.max(1, ...values, goal ?? 0);
  const gap = Math.max(2, Math.floor(W / values.length / 6));
  const barW = (W - gap * (values.length - 1)) / values.length;

  values.forEach((v, i) => {
    const h = (v / maxVal) * H;
    const x = padX + i * (barW + gap);
    const y = padTop + (H - h);
    ctx.fillStyle = goal != null && v > goal ? barOver : barColor;
    const r = Math.min(4, barW / 2);
    roundRect(ctx, x, y, barW, h, r);
    ctx.fill();
  });

  if (goal != null && goal > 0 && goal <= maxVal) {
    const y = padTop + H - (goal / maxVal) * H;
    ctx.strokeStyle = goalColor;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(padX + W, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (labels) {
    ctx.fillStyle = axisColor;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    labels.forEach((lab, i) => {
      const x = padX + i * (barW + gap) + barW / 2;
      ctx.fillText(lab, x, padTop + H + 4);
    });
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (h < 1) h = 1;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
