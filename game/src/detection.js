// Hushlight detection: each guard carries its own suspicion, 0..1. It fills
// while that guard truly sees the courier — faster the closer the courier is
// and the louder they move — and drains when unseen, so a near miss can still
// be recovered by breaking line of sight. The HUD meter is the highest
// guard's suspicion; any guard reaching 1 means the courier is caught.

var HushDetection = (function () {
  var DECAY_PER_SECOND = 0.38;

  function fillRate(guard, player) {
    var d = HushGeom.dist(guard.x, guard.y, player.x, player.y);
    var closeness = 1 - d / guard.range; // 0 at the cone's edge, 1 at the guard
    var rate = 0.45 + 1.25 * closeness;
    if (player.sneaking) rate *= 0.32;       // quiet feet, low profile
    else if (!player.moving) rate *= 0.55;   // standing still helps a little
    return rate;
  }

  // Mutates each guard's alert/seesPlayer; returns the level-wide meter.
  function updateDetection(state, dt) {
    var meter = 0;
    for (var i = 0; i < state.guards.length; i++) {
      var guard = state.guards[i];
      guard.seesPlayer = HushGuards.guardSeesPlayer(
        guard, state.player, state.blockers, state.level.bushes);
      if (guard.seesPlayer) {
        guard.alert = Math.min(1, guard.alert + fillRate(guard, state.player) * dt);
      } else {
        guard.alert = Math.max(0, guard.alert - DECAY_PER_SECOND * dt);
      }
      if (guard.alert > meter) meter = guard.alert;
    }
    state.detection = meter;
    return meter;
  }

  return { updateDetection: updateDetection };
})();
