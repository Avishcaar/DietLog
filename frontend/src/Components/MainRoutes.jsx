import { Routes, Route } from "react-router-dom";
import { Login } from "../Pages/Login/Login";
import { Signup } from "../Pages/Signup/Signup";
import { Profile } from "../Pages/Profile";
import { Home } from "../Pages/Home";
import { PrivateRoute } from "./PrivateRoute";
import { EditProfile } from "../Pages/EditProfile/EditProfile";
import { VoiceCompanion } from "../Pages/VoiceCompanion/VoiceCompanion";
import { MealDetail } from "../Pages/MealDetail";

export const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/editprofile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/voice-companion" element={<PrivateRoute><VoiceCompanion /></PrivateRoute>} />
      <Route path="/meal/:mealId" element={<PrivateRoute><MealDetail /></PrivateRoute>} />
    </Routes>
  );
}