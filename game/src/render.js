// Hushlight rendering: everything is drawn on canvas at run time — no image
// assets. Order matters: floor and lamp light first, then the true vision
// cones (raycast, so walls bite chunks out of them), then the solid cover,
// the courier and the guards, and the bushes last so they can swallow anyone
// standing inside them. HUD and screen overlays sit on top.

var HushRender = (function () {
  // Deterministic little generator so floor wear and bush shapes are the
  // same on every frame and every machine.
  function lcg(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Calm amber -> warning yellow -> alarm red, by a 0..1 value.
  function heatColor(v, alpha) {
    var r, g, b;
    if (v < 0.5) {
      var t = v / 0.5;
      r = lerp(255, 255, t); g = lerp(216, 170, t); b = lerp(120, 40, t);
    } else {
      var u = (v - 0.5) / 0.5;
      r = lerp(255, 255, u); g = lerp(170, 64, u); b = lerp(40, 44, u);
    }
    return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + alpha + ')';
  }

  function drawFloor(ctx, state) {
    var w = state.bounds.w, h = state.bounds.h;
    ctx.fillStyle = '#11151f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 24; x < w; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    ctx.stroke();
    var rand = lcg(99);
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    for (var i = 0; i < 26; i++) {
      var px = rand() * w, py = rand() * h, pr = 18 + rand() * 46;
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.55, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, w, h);
  }

  function drawLampPools(ctx, state) {
    var lamps = state.level.lamps;
    for (var i = 0; i < lamps.length; i++) {
      var lamp = lamps[i];
      var flicker = 1 + 0.025 * Math.sin(state.time * 6 + lamp.x * 0.13 + lamp.y * 0.07);
      var r = lamp.r * flicker;
      var grad = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, r);
      grad.addColorStop(0, 'rgba(255,198,98,0.20)');
      grad.addColorStop(0.6, 'rgba(255,170,80,0.07)');
      grad.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(lamp.x - r, lamp.y - r, r * 2, r * 2);
    }
    for (var j = 0; j < lamps.length; j++) {
      var l = lamps[j];
      ctx.fillStyle = '#0a0c10';
      ctx.beginPath(); ctx.arc(l.x, l.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd489';
      ctx.beginPath(); ctx.arc(l.x, l.y, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawExit(ctx, state) {
    var e = state.level.exit;
    var pulse = state.hasLedger ? 0.5 + 0.5 * Math.sin(state.time * 4) : 0;
    var grad = ctx.createRadialGradient(
      e.x + e.w / 2, e.y + e.h / 2, 4, e.x + e.w / 2, e.y + e.h / 2, e.w);
    grad.addColorStop(0, 'rgba(120,255,170,' + (state.hasLedger ? 0.30 + 0.12 * pulse : 0.13) + ')');
    grad.addColorStop(1, 'rgba(120,255,170,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w * 2, e.h * 2);
    ctx.fillStyle = 'rgba(16,40,26,0.85)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = state.hasLedger ? '#7dffab' : '#3f7d55';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
    ctx.fillStyle = state.hasLedger ? '#b8ffd2' : '#69a67c';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  }

  function drawLedger(ctx, state) {
    if (state.hasLedger) return;
    var p = state.level.ledger;
    var pulse = 0.5 + 0.5 * Math.sin(state.time * 3.2);
    var grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 30 + 6 * pulse);
    grad.addColorStop(0, 'rgba(255,205,80,0.5)');
    grad.addColorStop(1, 'rgba(255,205,80,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(p.x - 40, p.y - 40, 80, 80);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.16);
    ctx.fillStyle = '#d8a83c';
    ctx.fillRect(-12, -9, 24, 18);
    ctx.fillStyle = '#f4e3ae';
    ctx.fillRect(-12, -2, 24, 3);
    ctx.fillStyle = '#8a6420';
    ctx.fillRect(-2, -9, 4, 18);
    ctx.restore();
  }

  function drawVisionCones(ctx, state) {
    for (var i = 0; i < state.guards.length; i++) {
      var guard = state.guards[i];
      var poly = HushGuards.visionConePolygon(guard, state.blockers, state.bounds);
      ctx.beginPath();
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (var k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
      ctx.closePath();
      ctx.fillStyle = heatColor(guard.alert, 0.13 + 0.17 * guard.alert);
      ctx.fill();
      ctx.strokeStyle = heatColor(guard.alert, 0.25);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawSolids(ctx, state) {
    var walls = state.level.walls;
    for (var i = 0; i < walls.length; i++) {
      var r = walls[i];
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(r.x + 3, r.y + 5, r.w, r.h);
      ctx.fillStyle = '#39435a';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#5a6a8c';
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
    }
    var crates = state.level.crates;
    for (var j = 0; j < crates.length; j++) {
      var c = crates[j];
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(c.x + 3, c.y + 5, c.w, c.h);
      ctx.fillStyle = '#6f5230';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#543d22';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x + 3, c.y + 3);
      ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3);
      ctx.moveTo(c.x + c.w - 3, c.y + 3);
      ctx.lineTo(c.x + 3, c.y + c.h - 3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,220,160,0.10)';
      ctx.fillRect(c.x, c.y, c.w, 3);
    }
  }

  function drawBushes(ctx, state) {
    var bushes = state.level.bushes;
    for (var i = 0; i < bushes.length; i++) {
      var r = bushes[i];
      var rand = lcg(Math.round(r.x * 7 + r.y * 13));
      ctx.fillStyle = '#1e3d26';
      for (var k = 0; k < 6; k++) {
        var bx = r.x + 8 + rand() * (r.w - 16);
        var by = r.y + 8 + rand() * (r.h - 16);
        var br = 11 + rand() * 9;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(64,140,84,0.55)';
      for (var m = 0; m < 4; m++) {
        var hx = r.x + 8 + rand() * (r.w - 16);
        var hy = r.y + 6 + rand() * (r.h - 14);
        ctx.beginPath(); ctx.arc(hx, hy, 4 + rand() * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawPlayerFigure(ctx, state) {
    var p = state.player;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 9, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = p.inBush ? 0.75 : 1;
    ctx.fillStyle = '#37b8cc';
    ctx.strokeStyle = '#0d2b33';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Satchel on the back, gold once the ledger is inside it.
    var bx = p.x - Math.cos(p.facing) * 7, by = p.y - Math.sin(p.facing) * 7;
    ctx.fillStyle = state.hasLedger ? '#e8bc4a' : '#7a5a30';
    ctx.fillRect(bx - 4, by - 4, 8, 8);
    // Facing nose.
    ctx.fillStyle = '#0d2b33';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 9, p.y + Math.sin(p.facing) * 9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawGuardFigure(ctx, state, guard) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(guard.x, guard.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a3038';
    ctx.strokeStyle = '#2a0e12';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Cap brim toward the facing direction.
    ctx.strokeStyle = '#2a0e12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 13, guard.y + Math.sin(guard.facing) * 13);
    ctx.stroke();
    // The guard's own little lamp, carried at the front.
    ctx.fillStyle = '#ffd489';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.facing) * 15, guard.y + Math.sin(guard.facing) * 15, 3, 0, Math.PI * 2);
    ctx.fill();
    if (guard.alert >= 0.18) {
      var hot = guard.alert >= 0.5;
      ctx.fillStyle = hot ? '#ff5040' : '#ffb02e';
      ctx.font = '800 ' + (hot ? 20 : 16) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(hot ? '!' : '?', guard.x, guard.y - 20);
    }
  }

  function drawVignette(ctx, state) {
    var w = state.bounds.w, h = state.bounds.h;
    var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.55, w / 2, h / 2, h * 1.05);
    grad.addColorStop(0, 'rgba(2,4,8,0)');
    grad.addColorStop(1, 'rgba(2,4,8,0.42)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawHud(ctx, state) {
    var w = state.bounds.w;
    ctx.fillStyle = 'rgba(4,6,10,0.55)';
    ctx.fillRect(0, 0, w, 46);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2e7c9';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(state.level.name, 14, 20);
    ctx.font = '400 13px system-ui, sans-serif';
    ctx.fillStyle = state.hasLedger ? '#7dffab' : '#ffd489';
    ctx.fillText(state.hasLedger ? 'Reach the exit unseen' : 'Reach the ledger', 14, 39);

    // The eye: it opens and reddens as the meter climbs.
    var d = state.detection;
    var ex = w - 196, ey = 23;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(ex, ey, 14, 8 + 2 * d, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = heatColor(d, 1);
    ctx.beginPath(); ctx.arc(ex, ey, 3 + 3.5 * d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0c10';
    ctx.beginPath(); ctx.arc(ex, ey, 1.6, 0, Math.PI * 2); ctx.fill();

    // Detection meter bar.
    var bx = w - 168, bw = 152;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(bx, ey - 6, bw, 12);
    if (d > 0.005) {
      ctx.fillStyle = heatColor(d, 0.95);
      ctx.fillRect(bx, ey - 6, bw * Math.min(1, d), 12);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, ey - 6, bw, 12);

    ctx.font = '400 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(240,240,230,0.55)';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / arrows · Shift = sneak · R = restart', 14, state.bounds.h - 12);
    ctx.textAlign = 'right';
    var right = [];
    if (state.player.sneaking && state.player.moving) right.push('sneaking');
    if (state.player.inBush) right.push('hidden in the bush');
    if (state.hasLedger) right.push('ledger carried');
    ctx.fillStyle = 'rgba(255,212,137,0.8)';
    ctx.fillText(right.join(' · '), w - 14, state.bounds.h - 12);
  }

  function centerText(ctx, state, str, y, size, color, weight) {
    ctx.fillStyle = color;
    ctx.font = (weight || 700) + ' ' + size + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(str, state.bounds.w / 2, y);
  }

  function drawTitle(ctx, state) {
    ctx.fillStyle = 'rgba(4,6,12,0.74)';
    ctx.fillRect(0, 0, state.bounds.w, state.bounds.h);
    centerText(ctx, state, 'H U S H L I G H T', 190, 54, '#ffd489', 800);
    centerText(ctx, state, 'a depot, a ledger, and lamps that must not see you', 228, 17, '#f2e7c9', 400);
    centerText(ctx, state, 'Slip past the patrols, take the ledger, reach the exit gate unseen.', 292, 15, 'rgba(240,240,230,0.85)', 400);
    centerText(ctx, state, 'Move with WASD or the arrow keys. Hold Shift to sneak — slow, but hard to spot.', 320, 15, 'rgba(240,240,230,0.85)', 400);
    centerText(ctx, state, 'Crates, walls and bushes break a guard\u2019s line of sight. A full eye means caught.', 348, 15, 'rgba(240,240,230,0.85)', 400);
    centerText(ctx, state, 'Click or press Enter to begin', 428, 18, '#7dffab', 700);
  }

  function drawCaught(ctx, state) {
    ctx.fillStyle = 'rgba(60,6,6,0.55)';
    ctx.fillRect(0, 0, state.bounds.w, state.bounds.h);
    centerText(ctx, state, 'SPOTTED', 250, 48, '#ff5040', 800);
    centerText(ctx, state, 'The lamps saw what the guards could not.', 292, 16, '#f2e7c9', 400);
    centerText(ctx, state, 'Press R or click to try ' + state.level.name + ' again', 340, 16, '#ffd489', 400);
  }

  function drawBanner(ctx, state) {
    var a = Math.min(1, state.bannerLeft / 0.5, (state.bannerTotal - state.bannerLeft) / 0.4 + 0.2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = 'rgba(4,6,12,0.66)';
    ctx.fillRect(0, 218, state.bounds.w, 128);
    centerText(ctx, state, state.level.name, 272, 30, '#ffd489', 800);
    centerText(ctx, state, state.level.sub, 306, 15, '#f2e7c9', 400);
    ctx.restore();
  }

  function drawComplete(ctx, state) {
    ctx.fillStyle = 'rgba(4,10,8,0.78)';
    ctx.fillRect(0, 0, state.bounds.w, state.bounds.h);
    centerText(ctx, state, 'CLEAN GETAWAY', 208, 44, '#7dffab', 800);
    centerText(ctx, state, 'The ledger is out — and you were never there.', 248, 17, '#f2e7c9', 400);
    var secs = Math.floor(state.totalTime);
    var mm = Math.floor(secs / 60), ss = ('0' + (secs % 60)).slice(-2);
    centerText(ctx, state, 'Time ' + mm + ':' + ss + ' · Spotted ' + state.catches + (state.catches === 1 ? ' time' : ' times'), 296, 16, '#ffd489', 400);
    centerText(ctx, state, 'Press Enter or click to play again', 356, 16, '#7dffab', 700);
  }

  function drawScene(ctx, state) {
    drawFloor(ctx, state);
    drawLampPools(ctx, state);
    drawExit(ctx, state);
    drawLedger(ctx, state);
    drawVisionCones(ctx, state);
    drawSolids(ctx, state);
    drawPlayerFigure(ctx, state);
    for (var i = 0; i < state.guards.length; i++) drawGuardFigure(ctx, state, state.guards[i]);
    drawBushes(ctx, state);
    drawVignette(ctx, state);
    drawHud(ctx, state);
    if (state.mode === 'title') drawTitle(ctx, state);
    else if (state.mode === 'caught') drawCaught(ctx, state);
    else if (state.mode === 'complete') drawComplete(ctx, state);
    else if (state.mode === 'banner') drawBanner(ctx, state);
  }

  return { drawScene: drawScene, heatColor: heatColor };
})();
