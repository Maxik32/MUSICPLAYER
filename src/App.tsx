import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AboutPage } from "@/pages/AboutPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { HomePage } from "@/pages/HomePage";
import { TrackPage } from "@/pages/TrackPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { PlaylistPage } from "@/pages/PlaylistPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/track/:trackId" element={<TrackPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
