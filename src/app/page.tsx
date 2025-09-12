// src/app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

declare var kakao: any;

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeMarker, setActiveMarker] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.onload = () => {
      kakao.maps.load(() => {
        if (!mapRef.current) return;
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        const mapInstance = new kakao.maps.Map(mapRef.current, options);
        setMap(mapInstance);
      });
    };
    document.head.appendChild(script);
  }, []);

  // 음식점 추천
  const recommendPlaces = () => {
    if (!map) return;

    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(
      "음식점",
      (data: any[], status: any) => {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
          // 지도 bounds 가져오기
          const bounds = map.getBounds();

          // 지도 안 데이터만 필터링
          const inMap = data.filter((place) => {
            const pos = new kakao.maps.LatLng(place.y, place.x);
            return bounds.contain(pos);
          });

          if (inMap.length === 0) return alert("지도 안에 음식점이 없습니다.");

          // 랜덤 3개 선택
          const shuffled = inMap.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 3);

          // 기존 마커 제거
          markers.forEach((m) => m.setMap(null));

          // 마커 생성
          const newMarkers = selected.map((place) => {
            const marker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(place.y, place.x),
              map,
              title: place.place_name,
            });
            return marker;
          });

          setMarkers(newMarkers);

          setPlaces(
            selected.map((p) => ({
              id: p.id,
              name: p.place_name,
              lat: p.y,
              lng: p.x,
            }))
          );
        }
      },
      { location: map.getCenter(), radius: 1500 }
    );
  };

  // 현재 위치 이동
  const moveToCurrentLocation = () => {
    if (!map) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const loc = new kakao.maps.LatLng(lat, lng);
        map.panTo(loc);

        // 좌표 → 주소 변환
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result: any, status: any) => {
          if (status === kakao.maps.services.Status.OK) {
            const address =
              result[0].road_address?.address_name ||
              result[0].address?.address_name;
            setCurrentLocation(address);
          }
        });

        // 현재 위치는 마커 없음
        markers.forEach((m) => m.setMap(null));
        setPlaces([]);
      },
      (err) => {
        console.error(err);
        alert("현재 위치를 가져올 수 없습니다.");
      }
    );
  };

  // 리스트 클릭 → 지도 이동 + 마커 강조
  const handlePlaceClick = (place: Place, index: number) => {
    if (!map || !markers[index]) return;

    const position = new kakao.maps.LatLng(place.lat, place.lng);

    map.panTo(position);

    // 이전 마커 원래대로
    if (activeMarker) {
      activeMarker.setImage(null);
    }

    // 클릭된 마커 강조
    const imageSrc =
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png";
    const markerImage = new kakao.maps.MarkerImage(
      imageSrc,
      new kakao.maps.Size(64, 69),
      { offset: new kakao.maps.Point(27, 69) }
    );

    markers[index].setImage(markerImage);
    setActiveMarker(markers[index]);
  };

  return (
    <div className="flex h-screen">
      {/* 지도 */}
      <div ref={mapRef} className="flex-1 min-h-[100vh]" />

      {/* 우측 패널 */}
      <div className="w-80 p-4 bg-gray-100 overflow-y-auto">
        <button
          onClick={recommendPlaces}
          className="p-3 mb-3 w-full bg-yellow-500 text-white rounded shadow hover:bg-yellow-600"
        >
          뭐 먹지?
        </button>

        <button
          onClick={moveToCurrentLocation}
          className="p-3 mb-3 w-full bg-blue-500 text-white rounded shadow hover:bg-blue-600"
        >
          현재 위치
        </button>

        {/* 현재 위치 주소 */}
        {currentLocation && (
          <div className="mb-4 p-2 bg-white rounded shadow">
            <h2 className="font-bold mb-1">📍 현재 위치</h2>
            <p className="text-sm text-gray-700">{currentLocation}</p>
          </div>
        )}

        <h2 className="font-bold mb-2">🍽 추천 음식점</h2>
        <ul className="space-y-2">
          {places.map((place, idx) => (
            <li
              key={place.id}
              onClick={() => handlePlaceClick(place, idx)}
              className="p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-200"
            >
              {place.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
