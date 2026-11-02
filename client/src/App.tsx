import { useState } from "react";
import Dashboard from "./Components/Dashboard.tsx";
import Inbox from "./Components/Inbox.tsx";
import Layout from "./Pages/Layout.tsx";

type Page = "dashboard" | "inbox";

export default function App() {
	const [currentPage, setCurrentPage] = useState<Page>(() =>
		window.location.pathname.toLowerCase().includes("inbox") ? "inbox" : "dashboard",
	);

	const changePage = (page: Page) => {
		setCurrentPage(page);
	};

	return (
		<Layout currentPage={currentPage} onPageChange={changePage}>
			{currentPage === "dashboard" && <Dashboard />}
			{currentPage === "inbox" && <Inbox />}
		</Layout>
	);
}