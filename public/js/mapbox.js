export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoiYW51cmFnLWMiLCJhIjoiY2twam5jZXA2MGFwMzJ1b2FneTAxZ2I3cSJ9.VNt-xXJ-a23aT9bt3lPJ7w';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11'
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
        const el = document.createElement('div');
        el.className = 'marker';
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        new mapboxgl.Popup({ offset: 30 })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
            .addTo(map);

        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
};
