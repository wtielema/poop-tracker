import { getMapData } from "@/app/actions/map";
import MapPageClient from "@/components/map/MapPageClient";

export default async function MapPage() {
  const data = await getMapData();

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <h1
        className="font-bold mb-4"
        style={{ fontSize: 22, color: "var(--foreground)" }}
      >
        {"\u{1F5FA}\uFE0F"} Poop Map
      </h1>

      <MapPageClient pins={data.pins} friendPins={data.friendPins} />
    </div>
  );
}
