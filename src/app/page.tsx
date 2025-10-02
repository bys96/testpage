// src/app/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setMap,
  setMarkers,
  setSelectedMarker,
  setCurrentMarker,
} from "@/store/mapSlice";
import {
  setPlaces,
  setCurrentLocation,
  setLoadingPlaces,
  Place,
} from "@/store/placeSlice";

export default function Home() {
  const dispatch = useDispatch();

  // Redux 상태
  const map = useSelector((state: RootState) => state.map.map);
  const markers = useSelector((state: RootState) => state.map.markers);
  const selectedMarker = useSelector(
    (state: RootState) => state.map.selectedMarker
  );
  const currentMarker = useSelector(
    (state: RootState) => state.map.currentMarker
  );

  const places = useSelector((state: RootState) => state.place.places);
  const loadingPlaces = useSelector(
    (state: RootState) => state.place.loadingPlaces
  );
  const currentLocation = useSelector(
    (state: RootState) => state.place.currentLocation
  );

  // refs
  const mapRef = useRef<HTMLDivElement>(null);
  const defaultMarkerImage = useRef<any>(null);
  const highlightedMarkerImage = useRef<any>(null);
  const currentLocationImage = useRef<any>(null);
  const infoWindow = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const placesCache = useRef<{ [key: string]: Place[] }>({});

  const mapdistance = 150;

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.onload = () => {
      kakao.maps.load(() => {
        if (!mapRef.current) return;

        const mapInstance = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        });
        dispatch(setMap(mapInstance));

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = new kakao.maps.LatLng(
              pos.coords.latitude,
              pos.coords.longitude
            );
            mapInstance.setCenter(loc);
            showSearchRadius(mapInstance, loc, mapdistance);
          },
          (err) => {
            console.warn("위치 가져오기 실패, 기본값 사용", err);
            showSearchRadius(mapInstance, mapInstance.getCenter(), mapdistance);
          }
        );

        showSearchRadius(mapInstance, mapInstance.getCenter(), mapdistance);

        defaultMarkerImage.current = new kakao.maps.MarkerImage(
          "https://static.thenounproject.com/png/map-marker-icon-462-512.png",
          new kakao.maps.Size(30, 30)
        );
        highlightedMarkerImage.current = new kakao.maps.MarkerImage(
          "https://static.thenounproject.com/png/map-marker-icon-122376-512.png",
          new kakao.maps.Size(30, 30)
        );
        currentLocationImage.current = new kakao.maps.MarkerImage(
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
          new kakao.maps.Size(26, 35)
        );

        infoWindow.current = new kakao.maps.InfoWindow({ zIndex: 1 });

        kakao.maps.event.addListener(mapInstance, "click", () => {
          dispatch(setSelectedMarker(null));
        });
      });
    };
    document.head.appendChild(script);
  }, []);

  // 지도 리사이즈
  useEffect(() => {
    if (!map) return;
    const handleResize = () => map.relayout();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  // 선택 마커 변경
  useEffect(() => {
    if (!map) return;

    if (selectedMarker) {
      markers.forEach((m) => {
        if (m !== selectedMarker) m.setImage(defaultMarkerImage.current);
      });
      selectedMarker.setImage(highlightedMarkerImage.current);

      const place = selectedMarker.placeData;
      const content = `
        <div style="width:250px;font-size:13px;padding:10px;box-sizing:border-box;">
          <strong>${place.name}</strong><br/>
          <span>${place.address || "주소 정보 없음"}</span><br/>
          <span>${place.phone || ""}</span><br/>
          <span>카테고리: ${place.category || "정보 없음"}</span><br/>
          <div style="display:flex;gap:5px;margin-top:5px;">
            <a href="${
              place.place_url ||
              `https://map.kakao.com/link/map/${encodeURIComponent(
                place.name
              )},${place.lat},${place.lng}`
            }" target="_blank" style="flex:1;background:#ff5a00;color:#fff;text-align:center;padding:5px 0;border-radius:3px;text-decoration:none;">상세보기</a>
            ${
              place.phone
                ? `<a href="tel:${place.phone}" style="flex:1;background:#00a0e9;color:#fff;text-align:center;padding:5px 0;border-radius:3px;text-decoration:none;">전화</a>`
                : ""
            }
          </div>
        </div>
      `;
      infoWindow.current.setContent(content);
      infoWindow.current.open(map, selectedMarker);

      map.panTo(selectedMarker.getPosition());
    } else {
      markers.forEach((m) => m.setImage(defaultMarkerImage.current));
      infoWindow.current.close();
    }
  }, [selectedMarker, map, markers]);

  const shuffleArray = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const showMarkersAndList = (selected: Place[]) => {
    if (!map) return;

    markers.forEach((m) => m.setMap(null));

    const newMarkers = selected.map((place) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(place.lat, place.lng),
        map,
        title: place.name,
        image: defaultMarkerImage.current,
      });
      marker.placeData = place;
      kakao.maps.event.addListener(marker, "click", () => {
        dispatch(setSelectedMarker(marker === selectedMarker ? null : marker));
      });
      return marker;
    });

    dispatch(setMarkers(newMarkers));
    dispatch(setPlaces(selected));
    dispatch(setSelectedMarker(null));
  };

  const showSearchRadius = (targetMap: any, center: any, radius: number) => {
    if (!targetMap) return;

    if (circleRef.current) circleRef.current.setMap(null);

    const circle = new kakao.maps.Circle({
      center,
      radius,
      strokeWeight: 1,
      strokeColor: "#000000",
      strokeOpacity: 0.8,
      strokeStyle: "dashed",
      fillOpacity: 0,
    });
    circle.setMap(targetMap);
    circleRef.current = circle;

    kakao.maps.event.addListener(targetMap, "center_changed", () => {
      if (circleRef.current)
        circleRef.current.setPosition(targetMap.getCenter());
    });
  };

  const recommendPlaces = () => {
    if (!map) return;
    map.relayout();
    dispatch(setLoadingPlaces(true));
    dispatch(setPlaces([]));
    dispatch(setSelectedMarker(null));

    const center = map.getCenter();
    const cacheKey = `${center.getLat()}_${center.getLng()}`;

    showSearchRadius(map, center, mapdistance);

    if (placesCache.current[cacheKey]?.length > 0) {
      const cachedData = placesCache.current[cacheKey];
      const selected = shuffleArray(cachedData).slice(0, 3);
      showMarkersAndList(selected);
      dispatch(setLoadingPlaces(false));
      return;
    }

    const ps = new kakao.maps.services.Places();
    let allResults: Place[] = [];

    const fetchPage = (page: number) => {
      ps.keywordSearch(
        "음식점",
        (data: any[], status: any, pagination: any) => {
          if (status === kakao.maps.services.Status.OK && data.length > 0) {
            const bounds = map.getBounds();
            const inMap = data.filter((place) =>
              bounds.contain(new kakao.maps.LatLng(place.y, place.x))
            );

            allResults = [
              ...allResults,
              ...inMap.map((p) => ({
                id: p.id,
                name: p.place_name,
                lat: p.y,
                lng: p.x,
                address: p.road_address_name || p.address_name,
                phone: p.phone,
                place_url: p.place_url,
                category: p.category_name,
              })),
            ];

            if (pagination.hasNextPage && page < 4) {
              fetchPage(page + 1);
            } else {
              if (allResults.length === 0) {
                dispatch(setLoadingPlaces(false));
                return alert("지도 안에 음식점이 없습니다.");
              }

              placesCache.current[cacheKey] = allResults;
              const selected = shuffleArray(allResults).slice(0, 3);
              showMarkersAndList(selected);
              dispatch(setLoadingPlaces(false));
            }
          } else {
            dispatch(setLoadingPlaces(false));
          }
        },
        { location: center, radius: mapdistance, page }
      );
    };

    fetchPage(1);
  };

  const moveToCurrentLocation = () => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = new kakao.maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude
        );
        map.panTo(loc);

        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(
          pos.coords.longitude,
          pos.coords.latitude,
          (result: any, status: any) => {
            if (status === kakao.maps.services.Status.OK) {
              const address =
                result[0].road_address?.address_name ||
                result[0].address?.address_name;
              dispatch(setCurrentLocation(address));
            }
          }
        );

        markers.forEach((m) => m.setMap(null));
        dispatch(setMarkers([]));
        dispatch(setPlaces([]));

        if (currentMarker) currentMarker.setMap(null);

        const marker = new kakao.maps.Marker({
          position: loc,
          map,
          image: currentLocationImage.current,
        });
        dispatch(setCurrentMarker(marker));
      },
      (err) => {
        console.error(err);
        alert("현재 위치를 가져올 수 없습니다.");
      }
    );
  };

  const handlePlaceClick = (place: Place, index: number) => {
    dispatch(setSelectedMarker(markers[index]));
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="flex-1 min-h-[50vh] md:min-h-[100vh]">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <div className="w-full md:w-80 p-4 bg-gray-100 overflow-y-auto">
        <button
          onClick={recommendPlaces}
          className="p-3 mb-3 w-full bg-yellow-500 text-white rounded shadow active:bg-yellow-600 md:hover:bg-yellow-600"
        >
          뭐 먹지?
        </button>
        <button
          onClick={moveToCurrentLocation}
          className="p-3 mb-3 w-full bg-blue-500 text-white rounded shadow active:bg-blue-600 md:hover:bg-blue-600"
        >
          현재 위치
        </button>

        {currentLocation && (
          <div className="mb-4 p-2 bg-white rounded shadow">
            <h2 className="font-bold mb-1">📍 현재 위치</h2>
            <p className="text-sm text-gray-700">{currentLocation}</p>
          </div>
        )}

        <h2 className="font-bold mb-2">🍽 추천 음식점</h2>
        <ul className="space-y-2">
          {loadingPlaces ? (
            <li>불러오는 중...</li>
          ) : (
            places.length > 0 &&
            places.map((place, idx) => (
              <li
                key={place.id}
                onClick={() => handlePlaceClick(place, idx)}
                className="p-2 bg-white rounded shadow cursor-pointer active:bg-gray-200 md:hover:bg-gray-200"
              >
                {place.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
