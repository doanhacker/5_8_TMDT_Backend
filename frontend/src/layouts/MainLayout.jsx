import Header from "../components/Header"
import GlobalCategoryRail from "../components/GlobalCategoryRail"
import Chatbot from "../components/Chatbot"
import "../styles/Chatbot.css"
import "../styles/headerEnhanced.css"
import { Outlet } from "react-router-dom"

export default function MainLayout() {
  return (
    <>
      <div className="main-layout-sticky-head">
        <Header />
        <GlobalCategoryRail />
      </div>
      <Outlet />
      <Chatbot />
    </>
  )
}