import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeniusSearch from "@/components/GeniusSearch";
import SpotifySearch from "@/components/SpotifySearch";

export default function MusicPanel() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <Tabs defaultValue="genius">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Musique</h2>
          <TabsList>
            <TabsTrigger value="genius">Genius</TabsTrigger>
            <TabsTrigger value="spotify">Spotify</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="genius">
          <GeniusSearch />
        </TabsContent>
        <TabsContent value="spotify">
          <SpotifySearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
