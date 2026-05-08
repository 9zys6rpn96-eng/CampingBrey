import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminApp from "./AdminApp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

