/* 
~ Setting up the vite:-

  1] npm i --> install all the npm packages 

  2] Use the snippet rfc.

  3] npm install vite-plugin-eslint --save-dev

  4] Add these two lines of code in rules: {...} of .eslintrc.cjs file, to show yellow underline instead of red:
     'no-unused-vars': 'warn',
     'react/prop-types': 'off', 

^ Parent Route Context:
  When you define an 'index' route, it is always nested inside a 'parent' route. In the case of the 
  below code, the parent route is the base route (/).
    
^ Default Route Matching:
  1] When the 'parent' route is matched, and no other child routes are matched, the 'index' route is the one 
     that gets matched by default.

  2] The 'index' route (<Route index element={<Navbar />} />) matches the 'base' URL by default because 
     it is designed to match when the 'parent' route (in this case, the root route '/') is matched and
     no other 'child' routes are matched.
  
  3] The element={<Navbar />} specifies that the 'Navbar' component should be rendered for this route.

~ Installing Chakra UI:-

1] it is a component library.
2] npm i @chakra-ui/react @emotion/react @emotion/styled framer-motion

~ Vite setup:- 
  
  ✅ Environment Variable Behavior

     Command	         Environment file loaded
     npm run dev	     .env, .env.development
     npm run build	   .env, .env.production
     npm run preview	 .env, .env.production

*/

// import { Button } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";

import ChatProvider from "./context/ChatProvider";
import AppLayout from "./components/AppLayout";

function App() {
  console.log("App component");
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ChatProvider>
                <AppLayout />
              </ChatProvider>
            }
          >
            <Route path="/" index element={<HomePage />} />
            <Route path="/chats" element={<ChatPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
