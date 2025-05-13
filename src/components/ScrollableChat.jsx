import { Avatar, Tooltip } from "@chakra-ui/react";
import { useChatContext } from "../context/ChatProvider";
import styles from "./ScrollableChat.module.css";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import Axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ScrollableChat({ messages, OnSetMessages }) {
  const {
    user,
    applyBlueTick,
    setApplyBlueTick,
    fetchChatsAgain,
    setFetchChatsAgain,
    socket,
  } = useChatContext();

  const isSameSenderMargin = (messages, m, i, userId) => {
    // console.log(i === messages.length - 1);

    if (
      i < messages.length - 1 &&
      messages[i + 1].sender.id === m.sender.id &&
      messages[i].sender.id !== userId
    )
      return 33;
    else if (
      (i < messages.length - 1 &&
        messages[i + 1].sender.id !== m.sender.id &&
        messages[i].sender.id !== userId) ||
      (i === messages.length - 1 && messages[i].sender.id !== userId)
    )
      return 0;
    else return "auto";
  };

  function isSameSender(messages, m, i, userId) {
    return (
      i < messages.length - 1 &&
      (messages[i + 1].sender.id !== m.sender.id ||
        messages[i + 1].sender.id === undefined) &&
      messages[i].sender.id !== userId
    );
  }

  const isLastMessage = (messages, i, userId) => {
    return (
      i === messages.length - 1 &&
      messages[messages.length - 1].sender.id !== userId &&
      messages[messages.length - 1].sender.id
    );
  };

  const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender.id === m.sender.id;
  };

  function extractAndFormatDate(isoString, i) {
    // Convert the ISO string to a Date object
    const date = new Date(isoString);

    // if (i !== 0) {
    //   // Add one day (24 hours) to the date
    //   date.setDate(date.getDate() + 1);
    // }

    // Extract and format the date (e.g., "25 Aug 2024")
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return formattedDate;
  }

  function extractDateAsNum(isoString) {
    // Convert the ISO string to a Date object
    const date = new Date(isoString);

    // Extract the day as an integer
    const day = date.getDate();

    return day;
  }

  function dateChanged(messages, i, m) {
    if (i === 0) {
      return true;
    }

    return (
      i < messages.length &&
      extractDateAsNum(m.createdAt) !==
        extractDateAsNum(messages[i - 1].createdAt)
    );
  }

  function extractTime(isoString) {
    // Convert the ISO string to a Date object
    const date = new Date(isoString);

    // Extract and format the time (e.g., "6:41 pm" or "1:09 am")
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return formattedTime;
  }

  //Blue Tick vs Normal Tick Logic.
  function renderReadStatus(message) {
    return applyBlueTick ? (
      <i className="fa-solid fa-check-double" style={{ color: "#63E6BE" }}></i>
    ) : (
      <i className="fa-solid fa-check"></i>
    );
  }

  //Deleting a particular message document.
  async function handleDeleteMessage(messObj, i) {
    try {
      let isLastMessage = false;
      let prevMessObjId = null;

      console.log({
        messObj: messObj?.id,
        messages: messages[messages.length - 1]?.id,
      });

      if (
        messages[messages.length - 1]?.id?.toString() === messObj.id?.toString()
      ) {
        isLastMessage = true;
        prevMessObjId = messages[i - 1]?.id || null;
      }

      console.log("handleDeleteMessage method called");
      console.log({ isLastMessage, prevMessObjId });

      const { data } = await Axios.delete(
        `${API_BASE_URL}/api/message/deletemessage/${messObj.id}`,
        {
          data: { lastMessage: isLastMessage, prevMessObjId },
          withCredentials: true,
        }
      );

      console.log({ data });
      OnSetMessages((messages) =>
        messages.filter((el) => el.id !== messObj.id)
      );
      setFetchChatsAgain(!fetchChatsAgain);

      // socket.emit("refetchingChats", data.chat);
      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data.chat), // data.chat is updated ChatDTOFE
      });

      // socket.emit("refetchMessages", data.chat);
      socket.publish({
        destination: "/app/message/refetch",
        body: JSON.stringify(data.chat),
      });
    } catch (err) {
      console.log(err.message);
    }
  }

  return (
    <div style={{ overflowX: "hidden", overflowY: "auto" }}>
      {messages.length > 0 &&
        messages.map((m, i) => (
          <>
            {dateChanged(messages, i, m) ? (
              <p className={styles.dateContainer}>
                {extractAndFormatDate(m.createdAt, i)}
              </p>
            ) : (
              ""
            )}
            <div style={{ display: "flex", alignItems: "center" }} key={m.id}>
              {(isSameSender(messages, m, i, user.id) ||
                isLastMessage(messages, i, user.id)) && (
                <Tooltip
                  label={m.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
              <span
                style={{
                  backgroundColor: `${
                    m.sender.id === user.id ? "#BEE3F8" : "#B9F5D0"
                  }`,
                  marginLeft: isSameSenderMargin(messages, m, i, user.id),
                  marginTop: isSameUser(messages, m, i, user.id) ? 3.5 : 14,
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                }}
              >
                {!m.content ? (
                  <PhotoProvider>
                    <PhotoView src={m.imgUrl}>
                      <img
                        style={{
                          height: "80px",
                          width: "80px",
                          cursor: "pointer",
                        }}
                        src={m.imgUrl}
                        alt="Zoomable"
                      />
                    </PhotoView>
                  </PhotoProvider>
                ) : (
                  m.content
                )}
                <span className={styles.timeContainer}>
                  {extractTime(m.createdAt)}
                </span>
                <span
                  className={styles.deleteContainer}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(m, i);
                  }}
                >
                  <i className="fa-solid fa-trash"></i>
                </span>
              </span>
            </div>
          </>
        ))}
    </div>
  );
}

export default ScrollableChat;

/*
1] npm install react-medium-image-zoom --force
   npm uninstall react-medium-image-zoom --force

2] Description: Another React library that provides a photo viewer with zoom capabilities. It's 
                lightweight and very responsive.

   Installation:
   npm install react-photo-view --force   

------------------------------------------------------------------------------------------------------------------   

3] 'scrollTop':
     This property represents the vertical scroll position of an element. Setting 'scrollTop' controls how 
     far down the content inside an element is scrolled.

     Setting 'scrollTop' to a specific value scrolls the container to that exact position (in pixels).
   
4] 'scrollHeight':-
     'scrollHeight' is the total height of the element's content, including the parts that are hidden if the
      content is larger than the container (i.e., it would include all the chat messages).

      By setting 'scrollTop' to 'scrollHeight', you’re setting the scroll position to the maximum height of 
      the content, which effectively scrolls the container to the bottom.  
    
5] Why This Works:-
   When the 'chatContainerRef.current.scrollTop' is set to 'chatContainerRef.current.scrollHeight', it 
   ensures the last part of the chat messages becomes visible, which is ideal when you want the user 
   to see the latest message upon opening the chat box.    

------------------------------------------------------------------------------------------------------------------

  The "en-GB" (British English) and "en-US" (American English) locales refer to regional variations in language, 
  date formats, currency symbols, and other conventions used in English-speaking regions.


1. Date and Time Format
    Date Format:
     en-GB: DD/MM/YYYY (e.g., 31/10/2024)
     en-US: MM/DD/YYYY (e.g., 10/31/2024)

    Time Format:
     Both use 12-hour and 24-hour time formats, but en-GB tends to use the 24-hour format more frequently 
     in formal settings.

2. Currency
    Currency Symbol:
     en-GB: Uses the British pound '£'
     en-US: Uses the US dollar '$'

    Currency Format:
     en-GB: Commonly '£1,234.56'
     en-US: '$1,234.56'


*/
