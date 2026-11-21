// Hushlight courier: WASD / arrow movement with axis-separated collision
// against walls and crates (bushes never block), a full-speed walk and a
// Shift-held sneak that trades speed for a much quieter presence.

var HushPlayer = (function () {
  var WALK_SPEED = 152;
  var SNEAK_SPEED = 78;
  var RADIUS = 11;

  function buildPlayer(start) {
    return {
      x: start.x,
      y: start.y,
      radius: RADIUS,
      facing: -Math.PI / 2,
      moving: false,
      sneaking: false,
      inBush: false,
      stepLeft: 0,
    };
  }

  function hitsSolid(x, y, solids) {
    for (var i = 0; i < solids.length; i++) {
      if (HushGeom.circleRectOverlap(x, y, RADIUS, solids[i])) return true;
    }
    return false;
  }

  // keys: {up,down,left,right,sneak} booleans from the input handler.
  // bounds: the playfield rect; the courier is clamped inside it.
  function updatePlayer(player, keys, dt, solids, bushes, bounds) {
    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    player.sneaking = !!keys.sneak;
    player.moving = dx !== 0 || dy !== 0;
    if (player.moving) {
      var len = Math.sqrt(dx * dx + dy * dy);
      var speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
      var vx = (dx / len) * speed * dt;
      var vy = (dy / len) * speed * dt;
      player.facing = Math.atan2(dy, dx);
      // Axis-separated: slide along walls instead of sticking to them.
      if (!hitsSolid(player.x + vx, player.y, solids)) player.x += vx;
      if (!hitsSolid(player.x, player.y + vy, solids)) player.y += vy;
      player.x = Math.max(bounds.x + RADIUS, Math.min(bounds.x + bounds.w - RADIUS, player.x));
      player.y = Math.max(bounds.y + RADIUS, Math.min(bounds.y + bounds.h - RADIUS, player.y));
      player.stepLeft -= dt;
      if (player.stepLeft <= 0) {
        player.stepLeft = player.sneaking ? 0.42 : 0.3;
        player.footstep = true;
      }
    }
    player.inBush = false;
    for (var i = 0; i < bushes.length; i++) {
      if (HushGeom.pointInRect(player.x, player.y, bushes[i])) { player.inBush = true; break; }
    }
    return player;
  }

  return {
    buildPlayer: buildPlayer,
    updatePlayer: updatePlayer,
    WALK_SPEED: WALK_SPEED,
    SNEAK_SPEED: SNEAK_SPEED,
  };
})();
