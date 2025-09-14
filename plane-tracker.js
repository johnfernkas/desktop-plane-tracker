// plane-tracker.js

let LOCATIONS = [];

const bearingToCardinal = (deg) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % 8];
};

export async function loadLocations() {
  try {
    const res = await fetch('locations.json');
    LOCATIONS = await res.json();
    return LOCATIONS;
  } catch (e) {
    console.error("Failed to load locations:", e);
    return [];
  }
}

const REFRESH_INTERVAL = 5000;

const toRad = deg => deg * Math.PI / 180;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 3440.065;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const bearing = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.cos(toRad(lon2 - lon1));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const getPlaneData = async () => {
  const res = await fetch('http://localhost:3000/planes');
  return await res.json();
};

const updateUI = (nearest, distance, location) => {
  const arrow = document.getElementById("arrow");
  const distanceElem = document.getElementById("distance");
  const detailsElem = document.getElementById("details");

  if (!nearest) {
    arrow.style.transform = `rotate(0deg)`;
    arrow.style.opacity = "0.3";
    distanceElem.textContent = "-- nm";
    detailsElem.innerHTML = `<span class='details-empty'>No planes nearby</span>`;
    return;
  }

  const brng = bearing(location.lat, location.lon, nearest.lat, nearest.lon);
  const relativeBearing = (brng - location.heading + 90 + 360) % 360;
  arrow.style.transform = `rotate(${relativeBearing}deg)`;
  arrow.style.opacity = "1";

  const cardinal = bearingToCardinal(relativeBearing);
  distanceElem.innerHTML = `${cardinal} &bull; <span class="unit">${distance.toFixed(1)} nm</span>`;

  const flightId = nearest.flight?.trim() || "Unknown";
  const altitude = nearest.alt_baro ? `${nearest.alt_baro.toLocaleString()} ft` : "? ft";
  const type = nearest.t || "";
  detailsElem.innerHTML = `
    <span class='details-flight'>${flightId}</span>
    <span class='details-altitude'>${altitude}</span>
    <span class='details-type'>${type}</span>
  `;
};

export const fetchPlanes = async () => {
  try {
    const data = await getPlaneData();
    const location = LOCATIONS[0];

    if (!data.ac || data.ac.length === 0) {
      updateUI(null, null, location);
      return;
    }

    let nearest = null;
    let minDist = Infinity;

    for (const plane of data.ac) {
      if (!plane.lat || !plane.lon) continue;
      const dist = haversine(location.lat, location.lon, plane.lat, plane.lon);

      if (dist < minDist || (dist === minDist && plane.alt_baro < (nearest?.alt_baro || Infinity))) {
        nearest = plane;
        minDist = dist;
      }
    }

    if (nearest) {
      const nearestBrng = bearing(location.lat, location.lon, nearest.lat, nearest.lon);
      console.log(`Nearest plane ${nearest.flight?.trim() || "Unknown"} at bearing: ${nearestBrng.toFixed(1)}°`);
    }

    updateUI(nearest, minDist, location);

  } catch (e) {
    console.error("Error fetching plane data:", e);
    document.getElementById("details").innerHTML = `<span class='details-error'>Error fetching data</span>`;
  }
};

export const startTracking = async () => {
  await loadLocations();
  fetchPlanes();

  const arrow = document.getElementById('arrow');
  if (arrow) arrow.classList.add('active');

  setInterval(fetchPlanes, REFRESH_INTERVAL);
};
