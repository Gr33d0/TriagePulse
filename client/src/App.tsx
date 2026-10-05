import Layout from "./Components/Layout.tsx";
import Dashboard from "./Components/Dashboard.tsx";
import { useState } from "react";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const changePage = (page: string) => {
    setCurrentPage(page);
  }


  return (
    <Layout>
      <Dashboard />

    </Layout>
  );
}