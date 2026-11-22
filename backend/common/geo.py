from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_KM = 6371


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    a = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return EARTH_RADIUS_KM * 2 * asin(sqrt(a))


def bounding_box(latitude: float, longitude: float, radius_km: float):
    """Return (lat_min, lat_max, lng_min, lng_max): a square that contains the circle."""
    lat_delta = radius_km / 111.0  # one degree of latitude is about 111 km everywhere
    lng_delta = radius_km / (
        111.0 * max(cos(radians(latitude)), 0.01)
    )  # degrees shrink away from the equator
    return (
        max(latitude - lat_delta, -90.0),
        min(latitude + lat_delta, 90.0),
        max(longitude - lng_delta, -180.0),
        min(longitude + lng_delta, 180.0),
    )
