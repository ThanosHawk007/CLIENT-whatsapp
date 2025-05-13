import { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";

import { useToast } from "@chakra-ui/react";
import Axios from "axios";
// import axios from "./axiosConfig";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  console.log("Login Component");

  const { setUser, setJwtToken, handleWebSocketConnection } = useChatContext();

  const navigate = useNavigate();

  function handleClick() {
    console.log("handleClick");
    setShow((sh) => !sh);
  }

  function submitHandler(e) {
    console.log("submitHandler");
    e.preventDefault();

    //Logic for extracting the entered data into form fields
    const formData = new FormData(e.currentTarget);

    //data variable, then will contain an object having the collected input field's data.
    const data = Object.fromEntries(formData); //here

    console.log(data);

    //Logic to send Login Details to the backend .
    setLoading(true);

    Axios.post(`${API_BASE_URL}/api/user/login`, data, {
      withCredentials: true, // This option is necessary to include cookies in the request
    })
      .then((res) => {
        console.log(res.data);
        const { token, user } = res.data;
        localStorage.setItem("userInfo", JSON.stringify(user));
        localStorage.setItem("JwtToken", JSON.stringify(token));

        toast({
          title: "Success",
          description: "Login Successfull",
          status: "success",
          duration: 9000,
          isClosable: true,
        });

        handleWebSocketConnection(token, user);
        e.target.reset();
        setUser(user);
        setJwtToken(token);
        setLoading(false);
        navigate("/chats");
      })
      .catch((err) => {
        console.log(err);

        toast({
          title: "Login Unsuccessfull",
          description: "Login Details are Wrong",
          status: "error",
          duration: 9000,
          isClosable: true,
        });

        setLoading(false);
      });
  }

  function handleGuest(e) {
    e.preventDefault;
    const email = "admin@eazyschool.com";
    const password = "admin";

    const guestDetails = {
      email,
      password,
    };

    console.log(guestDetails);

    //Logic to send Guest Login Details to the backend .
    setLoading(true);

    Axios.post(
      `${API_BASE_URL}/api/user/guest`,
      { ...guestDetails },
      { withCredentials: true } // This option is necessary to include cookies in the request
    )
      .then((res) => {
        console.log(res.data);
        const { token, user } = res.data;
        localStorage.setItem("userInfo", JSON.stringify(user));
        localStorage.setItem("JwtToken", JSON.stringify(token));

        toast({
          title: "Success",
          description: "Login Successfull",
          status: "success",
          duration: 9000,
          isClosable: true,
        });

        handleWebSocketConnection(token, user);
        setUser(user);

        setJwtToken(token);
        setLoading(false);
        navigate("/chats");
      })
      .catch((err) => {
        console.log(err);

        toast({
          title: "Login Unsuccessfull",
          description: "Login Details are Wrong",
          status: "error",
          duration: 9000,
          isClosable: true,
        });

        setLoading(false);
      });
  }

  // useEffect(() => {
  //   async function initialSetup() {
  //     // Do this once when your app or login page loads
  //     await Axios.get("http://localhost:8080/api/csrf", {
  //       withCredentials: true,
  //     }); // or any public GET endpoint

  //     // This sets the XSRF-TOKEN cookie in the browser
  //   }

  //   initialSetup();
  // }, []);

  return (
    <form onSubmit={submitHandler}>
      <VStack spacing={5} color="#000">
        <FormControl id="email" isRequired>
          <FormLabel>Enter your Email</FormLabel>
          <Input type="email" placeholder="Enter Your Email" name="email" />
        </FormControl>

        <FormControl id="password" isRequired>
          <FormLabel>Enter your Password</FormLabel>
          <InputGroup>
            <Input
              type={show ? "text" : "password"}
              placeholder="Enter Your Password"
              name="password"
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? "HIDE" : "SHOW"}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={loading} // Shows loading spinner when uploading is true
          disabled={loading} // Disables the button when uploading is true
          style={{ marginTop: "15px" }}
        >
          Login In
        </Button>

        <Button
          variant="solid"
          colorScheme="red"
          width="100%"
          isLoading={loading} // Shows loading spinner when uploading is true
          disabled={loading} // Disables the button when uploading is true
          onClick={handleGuest}
        >
          Login as a Guest User !!!
        </Button>
      </VStack>
    </form>
  );
}

export default Login;
