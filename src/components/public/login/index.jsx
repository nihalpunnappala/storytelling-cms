import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearLoginSession, fetchLogin } from "../../../store/actions/login";
import { GoogleLogin } from "@react-oauth/google";
import AutoForm from "../../core/autoform/AutoForm";
import { logo } from "../../../images";
import withLayout from "../layout";
import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import { projectSettings } from "../../project/brand/project";
import { postData } from "../../../backend/api";
import { useToast } from "../../core/toast";

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `goCampus`;
  }, []);

  const [formInput] = useState([
    {
      type: "text",
      placeholder: "Enter your email",
      name: "email",
      validation: "email",
      default: "",
      label: "Email",
      minimum: 5,
      maximum: 40,
      required: true,
      icon: "email",
      add: true,
    },
    {
      type: "password",
      placeholder: "Enter your password",
      name: "password",
      info: "At least one uppercase letter (A-Z) \n At least one lowercase letter (a-z) \n At least one digit (0-9) \n At least one special character (@, $, !, %, *, ?, &) \n Minimum length of 8 characters",
      default: "",
      label: "Password",
      minimum: 0,
      maximum: 16,
      required: true,
      icon: "password",
      add: true,
    },
  ]);

  useEffect(() => {
    if (user.data?.token) {
      navigate(user.data?.menu[0]?.path ?? "dashboard");
    }
    if (user.error !== null) {
      dispatch(clearLoginSession());
    }
  }, [user, navigate, dispatch]);

  const submitChange = async (post) => {
    setIsSubmitting(true);
    try {
      const response = await postData(post, "auth/login");
      if (response.status === 200) {
        if (response.data.success) {
          setError(null);
          dispatch(fetchLogin(post, response));
        } else {
          setIsSubmitting(false);
          setError(response.data.message);
        }
      } else {
        setIsSubmitting(false);
        setError(response.data.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleSuccess = async (data) => {
    if (data.credential) {
      dispatch(fetchLogin({ authenticationType: "google", credential: data.credential }));
    }
  };

  // Add Google Client ID validation
  const isValidGoogleClientId = useMemo(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    // Google Client ID pattern: numbers-letters.apps.googleusercontent.com
    const pattern = /^\d{12}-[a-z0-9]{32}\.apps\.googleusercontent\.com$/;
    return clientId && pattern.test(clientId);
  }, []);

  return (
    <PageContainer>
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="flex justify-between items-center p-6">
          <button onClick={() => (window.location.href = "https://eventhex.ai")} className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website
          </button>
        </nav>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[440px]">
            <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
              <div className="w-full">
                <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col gap-4 items-center justify-center">
                  <img src={logo} alt="event-logo" className="h-8" />
                  <p className="text-xl font-semibold text-gray">Log in to your {projectSettings.title} Account.</p>
                </div>
                {error && <div className="text-red-500 text-sm mb-2 border border-red-500 rounded-md p-2 mb-4">{error}</div>}
                <AutoForm key={`login-form`} consent={"By logging in, you agree to our security practices and notifications."} useCaptcha={false} formType="post" header="" description="" formValues={{}} formInput={formInput} submitHandler={submitChange} button={isSubmitting ? "Signing in..." : "Sign in"} isOpen={true} css="plain embed head-hide landing" plainForm={true} customClass="embed" disabled={isSubmitting} />
                <div className="relative w-full text-center my-2 mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative">
                    <span className="px-4 text-sm text-gray-500 bg-white">or</span>
                  </div>
                </div>
                {isValidGoogleClientId && (
                  <React.Fragment>
                    <div className="w-full flex justify-center">
                      <GoogleLogin onSuccess={onGoogleSuccess} onError={() => console.log("Login Failed")} useOneTap type="standard" size="large" shape="rectangular" width="100%" text="continue_with" />
                    </div>
                  </React.Fragment>
                )}
                <div className="text-center mt-6">
                  <button className="text-sm font-medium text-primary-base hover:text-primary-dark transition-colors" onClick={() => navigate("/sign-up")}>
                    Don't have an account? Sign up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageContainer>
  );
};

export default withLayout(Login);

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;

  .google-button {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }
`;
