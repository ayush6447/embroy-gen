import { createBrowserRouter } from "react-router";
import { CohortView } from "./components/CohortView";
import { EmbryoDetailView } from "./components/EmbryoDetailView";
import { ComparisonView } from "./components/ComparisonView";
import { RootLayout } from "./components/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: CohortView },
      { path: "embryo/:embryoId", Component: EmbryoDetailView },
      { path: "compare", Component: ComparisonView },
    ],
  },
]);
