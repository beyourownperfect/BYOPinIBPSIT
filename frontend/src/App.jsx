import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Repository from "./pages/Repository";
import Practice from "./pages/Practice";
import Mocks from "./pages/Mocks";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ErrorBoundary pageName="Dashboard"><Dashboard /></ErrorBoundary>
          } />
          <Route path="/repository" element={
            <ErrorBoundary pageName="Repository"><Repository /></ErrorBoundary>
          } />
          <Route path="/practice" element={
            <ErrorBoundary pageName="Practice"><Practice /></ErrorBoundary>
          } />
          <Route path="/mocks" element={
            <ErrorBoundary pageName="Mocks"><Mocks /></ErrorBoundary>
          } />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
