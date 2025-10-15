import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Match } from "@repo/types";
import { MatchList } from "./pages/MatchList";
import { Scoring } from "./pages/Scoring";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleBack = () => {
    setSelectedMatch(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {selectedMatch ? (
        <Scoring match={selectedMatch} onBack={handleBack} />
      ) : (
        <MatchList onSelectMatch={handleSelectMatch} />
      )}
    </QueryClientProvider>
  );
}

export default App;
