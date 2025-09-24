// its middlewear to handle reducer call to update a state

import { postData } from "../../../backend/api";
import CustomRoutes from "../../../components/project/router/custom";

const fetchLogin = (data, predata = null) => {
  return async (dispatch) => {
    try {
      // Dispatch loading state
      dispatch({ type: "FETCH_USER_LOGIN_LOADING" });

      // Determine the response to use
      const response = predata ? predata : await postData(data, "auth/login");

      // Check if the response is successful
      if (response.status === 200) {
        if (response.data.success) {
          // Find the current menu item for the dashboard or the first item without a submenu
          let currentMenu = response.data.menu.find((item) => item.path === "/dashboard") || response.data.menu.find((item) => !item.submenu);

          // Prepare the data to dispatch
          const payloadData = {
            ...response.data,
            menu: [...response.data.menu, ...CustomRoutes()],
          };

          // Dispatch actions to update the state
          dispatch({ type: "MENU_STATUS", payload: false });
          dispatch({ type: "SELECTED_MENU", payload: currentMenu ?? { label: "dashboard", icon: "dashboard" } });
          dispatch({ type: "CURRENT_MENU", payload: currentMenu?.label ?? "dashboard" });
          dispatch({ type: "FETCH_USER_LOGIN_SUCCESS", payload: payloadData });
        } else {
          // Dispatch error if login is unsuccessful
          dispatch({
            type: "FETCH_USER_LOGIN_ERROR",
            payload: response.data.message || "Something went wrong!",
          });
        }
      } else {
        // Handle unexpected response status
        dispatch({
          type: "FETCH_USER_LOGIN_ERROR",
          payload: "Unexpected response status: validationFailed",
        });
      }
    } catch (error) {
      // Handle any errors that occur during the fetch
      dispatch({
        type: "FETCH_USER_LOGIN_ERROR",
        payload: error.message || "An error occurred while logging in.",
      });
    }
  };
};
const clearLogin = () => {
  return (dispatch) => {
    dispatch({
      type: "CLEAR_USER_LOGIN",
    });
  };
};
const clearLoginSession = () => {
  return (dispatch) => {
    dispatch({
      type: "CLEAR_USER_LOGIN_SESSION",
    });
  };
};
const udpateLogin = (data) => {
  return (dispatch) => {
    dispatch({
      type: "FETCH_USER_LOGIN_SUCCESS",
      payload: data,
    });
  };
};
export { fetchLogin, clearLogin, clearLoginSession, udpateLogin };
