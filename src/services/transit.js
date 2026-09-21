const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const fetch = require('node-fetch');

async function getNextArrivals(stopId) {
  if (!process.env.GTFS_FEED_URL) {
    return null; // no feed configured — caller handles the fallback message
  }

  try {
    const response = await fetch(process.env.GTFS_FEED_URL);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const arrivals = [];
    feed.entity.forEach((entity) => {
      if (entity.tripUpdate) {
        entity.tripUpdate.stopTimeUpdate.forEach((stu) => {
          if (stu.stopId === stopId && stu.arrival) {
            arrivals.push(new Date(stu.arrival.time * 1000));
          }
        });
      }
    });
    return arrivals.sort((a, b) => a - b).slice(0, 3);
  } catch (err) {
    console.error('GTFS-Realtime fetch failed:', err.message);
    return null;
  }
}

function formatArrivals(arrivals, stopName) {
  if (arrivals === null) {
    return `Nearest stop: ${stopName} (live arrivals unavailable right now)`;
  }
  if (!arrivals.length) {
    return `${stopName} — no upcoming arrivals found.`;
  }
  const now = Date.now();
  const times = arrivals
    .map((a) => Math.max(0, Math.round((a.getTime() - now) / 60000)))
    .map((min) => (min === 0 ? 'now' : `${min} min`))
    .join(', ');
  return `${stopName} — next arrivals: ${times}`;
}

module.exports = { getNextArrivals, formatArrivals };
