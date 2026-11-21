// Hushlight: the courier, the ledger, and the lamps that must not see you.
// This file owns the game state and the loop; the other src files each do one
// job — levels.js the data, geometry.js the tests, guards.js the patrols and
// vision, player.js the movement, detection.js the suspicion meter,
// render.js the drawing, audio.js the synth.
//
// Modes: title -> banner -> play, with caught and complete as end states.
// A ?shot=cover|play|alarm|exit&level=N URL stages a genuine mid-game moment
// from HushShots (levels.js) for screenshots: the title is skipped, the real
// level is loaded, positions and detection values are set from data, and the
// render loop runs with the simulation held on that staged frame.

(function () {
  var BOUNDS = { x: 0, y: 0, w: 960, h: 600 };
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  var keys = { up: false, down: false, left: false, right: false, sneak: false };

  var state = {
    mode: 'title',
    time: 0,
    totalTime: 0,
    levelIndex: 0,
    level: null,
    solids: [],
    blockers: [],
    bounds: BOUNDS,
    player: null,
    guards: [],
    detection: 0,
    hasLedger: false,
    catches: 0,
    bannerLeft: 0,
    bannerTotal: 0,
    shotMode: false,
  };

  function loadLevel(index) {
    state.levelIndex = index;
    state.level = HushLevels[index];
    state.solids = state.level.walls.concat(state.level.crates);
    state.blockers = state.solids.concat(state.level.bushes);
    state.player = HushPlayer.buildPlayer(state.level.start);
    state.guards = HushGuards.buildGuards(state.level);
    state.detection = 0;
    state.hasLedger = false;
  }

  function showBanner(seconds) {
    state.mode = 'banner';
    state.bannerTotal = seconds;
    state.bannerLeft = seconds;
  }

  function startGame() {
    state.catches = 0;
    state.totalTime = 0;
    loadLevel(0);
    showBanner(1.7);
  }

  function restartLevel() {
    loadLevel(state.levelIndex);
    showBanner(0.9);
  }

  function stageShot(params) {
    var shot = HushShots[params.get('shot')];
    if (!shot) return false;
    var levelParam = parseInt(params.get('level') || '', 10);
    var levelNo = levelParam >= 1 && levelParam <= HushLevels.length ? levelParam : shot.level;
    loadLevel(levelNo - 1);
    state.player.x = shot.player.x;
    state.player.y = shot.player.y;
    state.hasLedger = !!shot.hasLedger;
    var meter = 0;
    for (var i = 0; i < shot.guards.length && i < state.guards.length; i++) {
      var staged = shot.guards[i];
      var guard = state.guards[i];
      guard.x = staged.x;
      guard.y = staged.y;
      guard.facing = staged.facing * Math.PI / 180;
      guard.baseFacing = guard.facing;
      guard.alert = staged.alert || 0;
      guard.pauseLeft = 999;
      if (guard.alert > meter) meter = guard.alert;
    }
    state.detection = meter;
    state.mode = 'play';
    state.shotMode = true;
    return true;
  }

  function soundFootsteps() {
    var i, guard, d, nearness;
    for (i = 0; i < state.guards.length; i++) {
      guard = state.guards[i];
      if (guard.footstep) {
        guard.footstep = false;
        d = HushGeom.dist(guard.x, guard.y, state.player.x, state.player.y);
        if (d < 430) {
          nearness = 1 - d / 430;
          HushAudio.step(nearness, 165 + (i % 3) * 35);
        }
      }
    }
    if (state.player.footstep) {
      state.player.footstep = false;
      HushAudio.playerStep(state.player.sneaking);
    }
  }

  function updatePlay(dt) {
    state.totalTime += dt;
    HushPlayer.updatePlayer(state.player, keys, dt, state.solids, state.level.bushes, BOUNDS);
    HushGuards.updateGuards(state.guards, dt, state.time);
    soundFootsteps();
    HushDetection.updateDetection(state, dt);

    if (state.detection >= 1) {
      state.catches += 1;
      state.mode = 'caught';
      HushAudio.caught();
      return;
    }
    if (!state.hasLedger) {
      var lp = state.level.ledger;
      if (HushGeom.dist(state.player.x, state.player.y, lp.x, lp.y) < 24) {
        state.hasLedger = true;
        HushAudio.pickup();
      }
    } else if (HushGeom.circleRectOverlap(state.player.x, state.player.y, state.player.radius, state.level.exit)) {
      if (state.levelIndex >= HushLevels.length - 1) {
        state.mode = 'complete';
        HushAudio.gameWon();
      } else {
        HushAudio.levelClear();
        loadLevel(state.levelIndex + 1);
        showBanner(1.7);
      }
    }
  }

  function update(dt) {
    state.time += dt;
    if (state.shotMode) return; // staged frame: lamps flicker, nothing moves
    if (state.mode === 'title') {
      // The depot lives behind the title: patrols walk, nobody is hunted.
      HushGuards.updateGuards(state.guards, dt, state.time);
    } else if (state.mode === 'banner') {
      state.bannerLeft -= dt;
      if (state.bannerLeft <= 0) state.mode = 'play';
    } else if (state.mode === 'play') {
      updatePlay(dt);
    }
  }

  var lastStamp = 0;
  function loop(stamp) {
    var dt = Math.min(0.033, (stamp - lastStamp) / 1000 || 0);
    lastStamp = stamp;
    update(dt);
    HushRender.drawScene(ctx, state);
    requestAnimationFrame(loop);
  }

  function primaryAction() {
    HushAudio.unlock();
    if (state.shotMode) return;
    if (state.mode === 'title') startGame();
    else if (state.mode === 'caught') restartLevel();
    else if (state.mode === 'complete') startGame();
  }

  var KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  window.addEventListener('keydown', function (e) {
    if (KEYMAP[e.code]) {
      keys[KEYMAP[e.code]] = true;
      e.preventDefault();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.sneak = true;
    } else if (e.code === 'Enter') {
      primaryAction();
    } else if (e.code === 'KeyR') {
      HushAudio.unlock();
      if (!state.shotMode && (state.mode === 'play' || state.mode === 'caught' || state.mode === 'banner')) {
        restartLevel();
      }
    }
  });
  window.addEventListener('keyup', function (e) {
    if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false;
    else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sneak = false;
  });
  canvas.addEventListener('click', primaryAction);

  loadLevel(0);
  var params = new URLSearchParams(window.location.search);
  if (params.has('shot')) stageShot(params);
  requestAnimationFrame(loop);
})();
