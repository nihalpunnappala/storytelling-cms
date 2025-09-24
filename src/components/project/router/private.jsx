import { Route } from "react-router-dom";
import Idcard from "../pages/landing/idcard";
import ProfileSettings from "../../core/settings";
import Signup from "../../public/signup";
const CustomPrivateRoute = () => [
  <Route key="id-card" path="/my-id-card/:event/:slug" element={<Idcard key="id-card" />} />, // Add the custom redirect route here
  <Route key="profile" path="/profile-settings" element={<ProfileSettings key="profile" />} />,
  <Route key="sign-up" path="/sign-up" element={<Signup key="sign-up" hideMenu={true} hideHeader={true} />} />,
];
export default CustomPrivateRoute;
