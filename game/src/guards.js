// Hushlight guards: waypoint patrols with pauses, smooth turns, a scanning
// sway while paused, and the vision test itself. A guard sees the courier
// only inside its cone, within range, with a clear line of sight — walls,
// crates and bushes all break that line, and a courier standing in a bush is
// hidden unless the guard is nearly on top of them.

var HushGuards = (function () {
  var HALF_ANGLE = 0.56; // ~32 degrees either side of the facing direction
  var TURN_SPEED = 5.2;  // radians per second toward the travel direction
  var TOUCH_RANGE = 30;  // close enough to feel, cone or no cone

  function buildGuard(def, range) {
    var first = def.path[0];
    var second = def.path[1] || def.path[0];
    return {
      x: first[0],
      y: first[1],
      radius: 12,
      waypoints: def.path,
      wpIndex: 1 % def.path.length,
      speed: def.speed,
      pauseTime: def.pause,
      pauseLeft: 0,
      facing: Math.atan2(second[1] - first[1], second[0] - first[0]),
      baseFacing: 0,
      range: range,
      halfAngle: HALF_ANGLE,
      alert: 0,
      seesPlayer: false,
      stepLeft: 0,
      scanPhase: Math.random() * Math.PI * 2,
    };
  }

  function buildGuards(levelData) {
    var guards = [];
    for (var i = 0; i < levelData.guards.length; i++) {
      guards.push(buildGuard(levelData.guards[i], levelData.range));
    }
    return guards;
  }

  function turnToward(guard, targetAngle, dt) {
    var diff = HushGeom.angleDiff(targetAngle, guard.facing);
    var maxTurn = TURN_SPEED * dt;
    if (Math.abs(diff) <= maxTurn) guard.facing = targetAngle;
    else guard.facing += Math.sign(diff) * maxTurn;
  }

  // Advance one guard along its loop. `hearing` is the courier's position, so
  // footsteps can be sounded with distance-based volume by the caller.
  function updateGuard(guard, dt, time) {
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      // Paused at a waypoint: sway the cone slowly, scanning the lane.
      guard.facing = guard.baseFacing + Math.sin(time * 1.6 + guard.scanPhase) * 0.32;
      return;
    }
    var target = guard.waypoints[guard.wpIndex];
    var dx = target[0] - guard.x;
    var dy = target[1] - guard.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 2) {
      guard.x = target[0];
      guard.y = target[1];
      guard.baseFacing = guard.facing;
      guard.pauseLeft = guard.pauseTime;
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
      return;
    }
    turnToward(guard, Math.atan2(dy, dx), dt);
    var step = Math.min(guard.speed * dt, d);
    guard.x += (dx / d) * step;
    guard.y += (dy / d) * step;
    guard.stepLeft -= dt;
    if (guard.stepLeft <= 0) {
      guard.stepLeft = 0.34;
      guard.footstep = true; // game loop turns this into a positioned tick
    }
  }

  function updateGuards(guards, dt, time) {
    for (var i = 0; i < guards.length; i++) updateGuard(guards[i], dt, time);
  }

  // The one vision test used by both detection and (indirectly) the cone art:
  // in range, inside the cone (or within arm's reach), sight line unblocked,
  // and the courier is not swallowed by a bush.
  function guardSeesPlayer(guard, player, blockers, bushes) {
    var d = HushGeom.dist(guard.x, guard.y, player.x, player.y);
    if (d > guard.range) return false;
    if (HushGeom.lineOfSightBlocked(guard.x, guard.y, player.x, player.y, blockers)) {
      return false;
    }
    var inBush = false;
    for (var i = 0; i < bushes.length; i++) {
      if (HushGeom.pointInRect(player.x, player.y, bushes[i])) { inBush = true; break; }
    }
    if (inBush && d >= TOUCH_RANGE + 6) return false;
    if (d <= TOUCH_RANGE) return true;
    var toPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
    return Math.abs(HushGeom.angleDiff(toPlayer, guard.facing)) <= guard.halfAngle;
  }

  // The visible cone as a polygon: sweep rays across the arc and stop each at
  // the first wall, crate or bush, so the drawn cone is the true sight area.
  function visionConePolygon(guard, blockers, bounds) {
    var rays = 26;
    var points = [[guard.x, guard.y]];
    for (var i = 0; i <= rays; i++) {
      var angle = guard.facing - guard.halfAngle + (i / rays) * guard.halfAngle * 2;
      var dx = Math.cos(angle), dy = Math.sin(angle);
      var best = guard.range;
      for (var j = 0; j < blockers.length; j++) {
        var t = HushGeom.rayRectDist(guard.x, guard.y, dx, dy, blockers[j]);
        if (t < best) best = t;
      }
      var edge = HushGeom.rayRectDist(guard.x, guard.y, dx, dy, bounds);
      if (edge < best) best = edge;
      points.push([guard.x + dx * best, guard.y + dy * best]);
    }
    return points;
  }

  return {
    buildGuards: buildGuards,
    updateGuards: updateGuards,
    guardSeesPlayer: guardSeesPlayer,
    visionConePolygon: visionConePolygon,
    TOUCH_RANGE: TOUCH_RANGE,
  };
})();
