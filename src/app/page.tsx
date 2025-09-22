// src/app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

declare let kakao: any;

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  place_url?: string;
  category?: string;
};

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeMarker, setActiveMarker] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [currentMarker, setCurrentMarker] = useState<any>(null);

  const defaultMarkerImage = useRef<any>(null);
  const highlightedMarkerImage = useRef<any>(null);
  const currentLocationImage = useRef<any>(null);
  const infoWindow = useRef<any>(null);

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
        setMap(mapInstance);

        // 음식점 기본 마커 (검은핀)
        defaultMarkerImage.current = new kakao.maps.MarkerImage(
          "https://static.thenounproject.com/png/map-marker-icon-462-512.png",
          new kakao.maps.Size(30, 30)
        );

        // 음식점 강조 마커 (큰 파란핀)
        highlightedMarkerImage.current = new kakao.maps.MarkerImage(
          "https://static.thenounproject.com/png/map-marker-icon-122376-512.png ",
          new kakao.maps.Size(30, 30)
        );

        // 현재 위치 마커 (노란별)
        currentLocationImage.current = new kakao.maps.MarkerImage(
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
          new kakao.maps.Size(26, 35)
        );

        infoWindow.current = new kakao.maps.InfoWindow({ zIndex: 1 });

        // 지도 클릭 시 InfoWindow 닫기
        kakao.maps.event.addListener(mapInstance, "click", () => {
          if (infoWindow.current) infoWindow.current.close();
          if (activeMarker) {
            activeMarker.setImage(defaultMarkerImage.current);
            setActiveMarker(null);
          }
        });
      });
    };
    document.head.appendChild(script);
  }, []);

  const shuffleArray = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 음식점 추천
  const recommendPlaces = () => {
    if (!map) return;
    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(
      "음식점",
      (data: any[], status: any) => {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
          const bounds = map.getBounds();
          const inMap = data.filter((place) =>
            bounds.contain(new kakao.maps.LatLng(place.y, place.x))
          );
          if (inMap.length === 0) return alert("지도 안에 음식점이 없습니다.");

          const selected = shuffleArray(inMap).slice(0, 3);

          markers.forEach((m) => m.setMap(null));

          const newMarkers = selected.map((place) => {
            const marker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(place.y, place.x),
              map,
              title: place.place_name,
              image: defaultMarkerImage.current,
            });

            kakao.maps.event.addListener(marker, "click", () => {
              map.panTo(marker.getPosition());

              if (activeMarker)
                activeMarker.setImage(defaultMarkerImage.current);

              marker.setImage(highlightedMarkerImage.current);
              setActiveMarker(marker);

              const content = `
              <div style="width:250px;font-size:13px;padding:10px;box-sizing:border-box;">
                <strong>${place.place_name}</strong><br/>
                <span>${
                  place.road_address_name ||
                  place.address_name ||
                  "주소 정보 없음"
                }</span><br/>
                <span>${place.phone || ""}</span><br/>
                <span>카테고리: ${
                  place.category_name || "정보 없음"
                }</span><br/>
                <div style="display:flex;gap:5px;margin-top:5px;">
                  <a href="${
                    place.place_url ||
                    `https://map.kakao.com/link/map/${encodeURIComponent(
                      place.place_name
                    )},${place.y},${place.x}`
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
              infoWindow.current.open(map, marker);
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
              address: p.road_address_name || p.address_name,
              phone: p.phone,
              place_url: p.place_url,
              category: p.category_name,
            }))
          );

          if (activeMarker) {
            activeMarker.setImage(defaultMarkerImage.current);
            setActiveMarker(null);
          }
        }
      },
      { location: map.getCenter(), radius: 1500 }
    );
  };

  // 현재 위치
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
              setCurrentLocation(address);
            }
          }
        );

        markers.forEach((m) => m.setMap(null));
        setMarkers([]);
        setPlaces([]);

        if (currentMarker) currentMarker.setMap(null);

        const marker = new kakao.maps.Marker({
          position: loc,
          map,
          image: currentLocationImage.current,
        });
        setCurrentMarker(marker);
      },
      (err) => {
        console.error(err);
        alert("현재 위치를 가져올 수 없습니다.");
      }
    );
  };

  const handlePlaceClick = (place: Place, index: number) => {
    if (!map || !markers[index]) return;
    map.panTo(markers[index].getPosition());

    if (activeMarker) activeMarker.setImage(defaultMarkerImage.current);

    markers[index].setImage(highlightedMarkerImage.current);
    setActiveMarker(markers[index]);

    const content = `
      <div style="width:250px;font-size:13px;padding:10px;box-sizing:border-box;">
        <strong>${place.name}</strong><br/>
        <span>${place.address || "주소 정보 없음"}</span><br/>
        <span>${place.phone || ""}</span><br/>
        <span>카테고리: ${place.category || "정보 없음"}</span><br/>
        <div style="display:flex;gap:5px;margin-top:5px;">
          <a href="${
            place.place_url ||
            `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${
              place.lat
            },${place.lng}`
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
    infoWindow.current.open(map, markers[index]);
  };

  return (
    <div className="flex h-screen">
      <div ref={mapRef} className="flex-1 min-h-[100vh]" />
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
