window.global = window; // ✅ fixes "global is not defined" for sockjs-client

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.jsx";
import "./index.css";

/*
import * as React from 'react'

~ // 1. import `ChakraProvider` component
import { ChakraProvider } from '@chakra-ui/react'

function App() {
~  // 2. Wrap ChakraProvider at the root of your app
  return (
    <ChakraProvider>
      <TheRestOfYourApplication />
    </ChakraProvider>
  )
}

1] After installing Chakra UI, you need to set up the 'ChakraProvider' at the root of your application.
2] This can be either in your 'index.jsx', index.tsx or App.jsx depending on the framework you use.

*/

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ChakraProvider>
    <App />
  </ChakraProvider>
  // </StrictMode>,
);
