import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";

import { useState } from "react";

import { useToast } from "@chakra-ui/react";

import Axios from "axios";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function SignUp() {
  const [show, setShow] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(null);
  const [formErrors, setFormErrors] = useState({}); // New state for field errors
  console.log("SignUp component");

  const toast = useToast();
  const navigate = useNavigate();

  const { setUser, setJwtToken, handleWebSocketConnection } = useChatContext();

  function handleSignUpWithoutPic(data, e, isPic) {
    isPic ? "" : setUploading(true);
    const uploadData = isPic ? { ...data, pic: isPic } : data;
    console.log({ uploadData });

    //Sending SingUp data without pic, to the backend.
    // Axios.post(
    //   "http://localhost:5000/api/user/",
    //   {
    //     ...uploadData,
    //   },
    //   {
    //     withCredentials: true, // This option is necessary to include cookies in the request
    //   }
    // )

    Axios.post(
      `${API_BASE_URL}/api/user/register`,
      {
        ...uploadData,
      },
      {
        withCredentials: true, // This option is necessary to include cookies in the request
      }
    )
      .then((res) => {
        console.log(res);

        const { token, user } = res.data;

        localStorage.setItem("userInfo", JSON.stringify(user));
        localStorage.setItem("JwtToken", JSON.stringify(token));

        handleWebSocketConnection(token, user);

        setUser(user);
        setJwtToken(token);

        toast({
          title: "Success",
          description: "Your account has been created successfully.",
          status: "success",
          duration: 9000,
          isClosable: true,
        });

        setFormErrors({});
        e.target.reset();
        navigate("/chats");
      })
      .catch((err) => {
        // throw new Error("Failed to create the Account !!!");
        // Check for errorMap in the response
        // const errorMap = err?.response?.data?.errorMap;
        const errorMap = err?.response?.data;

        if (errorMap) {
          setFormErrors(errorMap);
        } else {
          toast({
            title: "Sign Up Failed",
            description: "Something went wrong. Please try again.",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        }
      })
      .finally(() => {
        setUploading(false);
      });

    /*
      The finally block now has a proper function with () => {}, which ensures that it executes whether the 
      promise is resolved or rejected. 
    */
  }

  function handleClick() {
    console.log("handleClick");
    setShow((sh) => !sh);
  }

  async function uploadImageToCloudinary() {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "chat-app"); // Use your Cloudinary upload preset
    formData.append("cloud_name", "dizk5mov0");

    const cloud_name = "dizk5mov0";

    try {
      const response = await Axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, // Your Cloudinary endpoint
        formData
      );

      return response.data.secure_url; // Get the uploaded image URL
    } catch (error) {
      console.error("Error uploading image", error);
      return null;
    }
  }

  async function submitHandler(e) {
    console.log("submitHandler");
    e.preventDefault();

    //Logic for extracting the entered data into form fields
    const formData = new FormData(e.currentTarget);

    const data = Object.fromEntries(formData); //here

    console.log(data);

    // Check if the pic is a valid File object
    if (!(data.pic instanceof File && data.pic?.name)) {
      console.log("File is not uploaded");
      handleSignUpWithoutPic(data, e, "");
      return;
    }

    setUploading(true);
    const imageUrl = await uploadImageToCloudinary();

    if (!imageUrl) {
      toast({
        title: "Image Upload Failed",
        description: "There was an error uploading your image.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });

      setUploading(false);
      return;
    }

    console.log(data);
    console.log("Form Data with Image URL:", { ...data, pic: imageUrl });

    //Connecting to backend (sending the signup details to backend)
    handleSignUpWithoutPic(data, e, imageUrl);
  }

  /*
     The 'VStack' component from Chakra UI stacks its child components vertically with a spacing of 5 units 
     between each item.

     The color="#000" property sets the color of text within the stack to black.
  
  */

  return (
    <form onSubmit={submitHandler}>
      <VStack spacing={5} color="#000">
        <FormControl id="first-name" isRequired isInvalid={!!formErrors.name}>
          <FormLabel>Name</FormLabel>
          <Input placeholder="Enter Your Name" name="name" />
          <FormErrorMessage>{formErrors.name}</FormErrorMessage>
        </FormControl>

        <FormControl id="email" isRequired isInvalid={!!formErrors.email}>
          <FormLabel>Enter your Email</FormLabel>
          <Input type="email" placeholder="Enter Your Email" name="email" />
          <FormErrorMessage>{formErrors.email}</FormErrorMessage>
        </FormControl>

        <FormControl id="password" isRequired isInvalid={!!formErrors.password}>
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
          <FormErrorMessage>{formErrors.password}</FormErrorMessage>
        </FormControl>

        <FormControl
          id="confirmpassword"
          isRequired
          isInvalid={!!formErrors.confirmpassword}
        >
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              type={show ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmpassword"
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? "HIDE" : "SHOW"}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formErrors.confirmpassword}</FormErrorMessage>
        </FormControl>

        <FormControl id="pic">
          <FormLabel>Upload Your Picture</FormLabel>
          <Input
            type="file"
            p={1.5}
            accept="image/*"
            name="pic"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={uploading}
          disabled={uploading}
          style={{ marginTop: "15px" }}
        >
          Sign Up
        </Button>
      </VStack>
    </form>
  );
}

export default SignUp;

/*
Cloudinary details:-
API SECRET:- uGGbKm0fGypC1uRiVkgEjkAQFI4

API KEY:- 366232297987877

Your cloud name is: dizk5mov0.

CLOUDINARY_URL=cloudinary://<366232297987877>:<uGGbKm0fGypC1uRiVkgEjkAQFI4>@dizk5mov0


"https://api.cloudinary.com/v1_1/your_cloudinary_cloud_name/image/upload"

https://cloudinary-marketing-res.cloudinary.com/image/upload/w_1000/q_auto/f_auto/landmannalaugar_iceland.jpg

npm install @cloudinary/react @cloudinary/url-gen

*/

/*
  
? 🔍 Code :- 
 
     const formData = new FormData(e.currentTarget);
     const data = Object.fromEntries(formData);

    🧠 What Is Happening?

       You're extracting all the form input values from a submitted HTML '<form>' and converting them into 
       a plain JavaScript object.

       This is a modern, concise way of gathering form data—especially helpful when you have many form 
       fields (e.g., name, email, password, file input, etc.).  

    🔧 1. 'new FormData(e.currentTarget)' :-
     
       ✅ Purpose:
        Creates a 'FormData' object from the form element.
            
       🧬 What is 'e.currentTarget'?

          It refers to the form DOM element that triggered the 'submit' event. 

*              <form onSubmit={submitHandler}>
?                <input name="name" value="Alice" />
?                <input name="email" value="alice@example.com" />
?                <input name="password" value="secret123" />
?                <input name="pic" type="file" />
*              </form>

        💡 How 'FormData' Works:
           
!           It automatically collects all '<input>', '<select>', and '<textarea>' values within the form 
!           that have a 'name' attribute.

            You can inspect it like this:
            
?              const formData = new FormData(e.currentTarget);
*              for (let [key, value] of formData.entries()) {
~                console.log(key, value);
*              }

            This would output:

             name       Alice
             email      alice@example.com
             password   secret123
             pic        File { ... }
 
        🧰 2. 'Object.fromEntries(formData)' :-
         
           ✅ Purpose:
             Converts 'formData', which is an iterable of key-value pairs, into a plain JavaScript object. 

           🔍 Example:

!               const entries = [
?                 ["name", "Alice"],
?                 ["email", "alice@example.com"],
?                 ["password", "secret123"]
!               ];

*               const data = Object.fromEntries(entries);
*               console.log(data);  

            💎 Output:
               
!               {
!                  name: "Alice",
!                  email: "alice@example.com",
!                  password: "secret123"
!               }  

             So when used with 'FormData', it gives:             
*              const data = Object.fromEntries(formData);

             ✅ Now 'data' is:

?                {
~                   name: "Alice",
~                   email: "alice@example.com",
~                   password: "secret123",
~                   pic: File { ... }
?                }

--------------------------------------------------------------------------------------------------------------------

!  data.pic?.name

     This is optional chaining (?.) and property access.

       1. It safely tries to access 'name' from 'data.pic':
       
       2. If 'data.pic' is null or undefined, it won't throw an error, just returns undefined.

       3. If it's a 'File', then '.name' returns the file's name (like "profile.jpg").



*/
