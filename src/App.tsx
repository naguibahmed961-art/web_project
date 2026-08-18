import { useStore } from "./store";
import { ToastHost } from "./components/ui";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Tasks from "./pages/Tasks";
import Templates from "./pages/Templates";
import Clients from "./pages/Clients";
import Cases from "./pages/Cases";
import Accounts from "./pages/Accounts";

export default function App() {
  const sessionUserId = useStore((s) => s.sessionUserId);
  const page = useStore((s) => s.nav.page);

  return (
    <>
      {!sessionUserId ? (
        <Auth />
      ) : (
        <Layout>
          {page === "dashboard" && <Dashboard />}
          {page === "agenda" && <Agenda />}
          {page === "tasks" && <Tasks />}
          {page === "templates" && <Templates />}
          {page === "clients" && <Clients />}
          {page === "cases" && <Cases />}
          {page === "accounts" && <Accounts />}
        </Layout>
      )}
      <ToastHost />
    </>
  );
}
