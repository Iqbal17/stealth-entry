// Hushlight geometry: the small set of tests the whole game leans on.
// Segment intersection decides line of sight; a slab ray test decides how far
// a vision cone reaches before a wall, crate or bush stops it.

var HushGeom = (function () {
  var EPS = 0.0001;

  function dist(ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Smallest signed difference between two angles, in (-PI, PI].
  function angleDiff(a, b) {
    var d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // Do segments p1p2 and p3p4 touch or cross? Touching counts: a sight line
  // that grazes a crate corner is still blocked by the crate.
  function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
    var d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
    var d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
    var d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    var d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
           ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)) ||
           (Math.abs(d1) < EPS && pointOnSegment(cx, cy, dx, dy, ax, ay)) ||
           (Math.abs(d2) < EPS && pointOnSegment(cx, cy, dx, dy, bx, by)) ||
           (Math.abs(d3) < EPS && pointOnSegment(ax, ay, bx, by, cx, cy)) ||
           (Math.abs(d4) < EPS && pointOnSegment(ax, ay, bx, by, dx, dy));
  }

  function pointOnSegment(ax, ay, bx, by, px, py) {
    return px >= Math.min(ax, bx) - EPS && px <= Math.max(ax, bx) + EPS &&
           py >= Math.min(ay, by) - EPS && py <= Math.max(ay, by) + EPS;
  }

  // Is the straight sight line a->b blocked by this rect?
  function segmentBlockedByRect(ax, ay, bx, by, r) {
    if (pointInRect(ax, ay, r) || pointInRect(bx, by, r)) return true;
    var x2 = r.x + r.w, y2 = r.y + r.h;
    return segmentsCross(ax, ay, bx, by, r.x, r.y, x2, r.y) ||
           segmentsCross(ax, ay, bx, by, x2, r.y, x2, y2) ||
           segmentsCross(ax, ay, bx, by, x2, y2, r.x, y2) ||
           segmentsCross(ax, ay, bx, by, r.x, y2, r.x, r.y);
  }

  function lineOfSightBlocked(ax, ay, bx, by, rects) {
    for (var i = 0; i < rects.length; i++) {
      if (segmentBlockedByRect(ax, ay, bx, by, rects[i])) return true;
    }
    return false;
  }

  // Distance from (ox,oy) along unit direction (dx,dy) to the rect's surface,
  // or Infinity when the ray misses. Slab method; an origin inside the rect
  // reports the exit distance, which is what the playfield bounds need.
  function rayRectDist(ox, oy, dx, dy, r) {
    var tmin = -Infinity, tmax = Infinity, t;
    if (Math.abs(dx) < EPS) {
      if (ox < r.x || ox > r.x + r.w) return Infinity;
    } else {
      var t1 = (r.x - ox) / dx, t2 = (r.x + r.w - ox) / dx;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    }
    if (Math.abs(dy) < EPS) {
      if (oy < r.y || oy > r.y + r.h) return Infinity;
    } else {
      var t3 = (r.y - oy) / dy, t4 = (r.y + r.h - oy) / dy;
      tmin = Math.max(tmin, Math.min(t3, t4));
      tmax = Math.min(tmax, Math.max(t3, t4));
    }
    if (tmax < Math.max(tmin, 0)) return Infinity;
    t = tmin >= 0 ? tmin : tmax;
    return t >= 0 ? t : Infinity;
  }

  // Circle vs rect overlap, for pickups, the exit gate and collision tests.
  function circleRectOverlap(cx, cy, radius, r) {
    var nx = Math.max(r.x, Math.min(cx, r.x + r.w));
    var ny = Math.max(r.y, Math.min(cy, r.y + r.h));
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= radius * radius;
  }

  return {
    dist: dist,
    angleDiff: angleDiff,
    pointInRect: pointInRect,
    segmentsCross: segmentsCross,
    segmentBlockedByRect: segmentBlockedByRect,
    lineOfSightBlocked: lineOfSightBlocked,
    rayRectDist: rayRectDist,
    circleRectOverlap: circleRectOverlap,
  };
})();
