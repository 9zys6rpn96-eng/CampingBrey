import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminApp from "./AdminApp";

function EmptyPage() {
  return <div />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmptyPage />} />
        <Route path="/buchungssystem/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

