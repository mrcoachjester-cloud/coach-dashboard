import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LiveEntry from "@/pages/enter/index";
import OffenseEntry from "@/pages/enter/offense/index";
import DefenseEntry from "@/pages/enter/defense/index";
import AnalyzePage from "@/pages/analyze/index";
import UploadPage from "@/pages/upload/index";
import { RouterProvider, useLocation } from "@/lib/router";

const queryClient = new QueryClient();

function RoutedApp() {
  const [pathname] = useLocation();

  switch (pathname) {
    case "/":
      return <Home />;
    case "/enter":
      return <LiveEntry />;
    case "/enter/offense":
      return <OffenseEntry />;
    case "/enter/defense":
      return <DefenseEntry />;
    case "/analyze":
      return <AnalyzePage />;
    case "/upload":
      return <UploadPage />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider>
        <RoutedApp />
      </RouterProvider>
    </QueryClientProvider>
  );
}

export default App;
