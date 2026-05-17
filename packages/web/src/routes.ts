import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { LockersView } from "./views/Lockers"; 
import { PaymentsView } from "./views/Payments";
import { MedicalCertificatesView } from "./views/MedicalCertificates";
import { SportsView } from "./views/Sports";
import { HomeView } from "./views/Home";
import { DisciplinesView } from "./views/Disciplines"; 
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/lockers", 
        Component: LockersView,
      },
      {
        path: "/payments",
        Component: PaymentsView,
      },
      {
        path: "/medical-certificates",
        Component: MedicalCertificatesView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
      
      {
        path: "/disciplines",
        Component: DisciplinesView,
      },
    ],
  },
]);