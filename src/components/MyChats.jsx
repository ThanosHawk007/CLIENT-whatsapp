import { useEffect, useState } from "react";
import { useChatContext } from "../context/ChatProvider";
import { useToast } from "@chakra-ui/react";
import styles from "./MyChats.module.css";

import Axios from "axios";
import GroupChatModal from "./GroupChatModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function MyChats() {
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);

  const {
    user,
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    fetchChatsAgain,
    setFetchChatsAgain,
    onlineUsers,
    setOnlineUsers,
    socket,
    applyBlueTick,
    setApplyBlueTick,
  } = useChatContext();

  let loggedUser =
    Object.keys(user || {}).length === 0
      ? JSON.parse(localStorage.getItem("userInfo"))
      : user;

  const toast = useToast();

  console.log("MyChats component");
  console.log({ chats });
  console.log({ onlineUsers });

  /*
   1] We need to fetch all the chat docs.(objects), that the logged in user is part of.
      This will in-turn give us the information about, the users with whom the logged in
      user chatted with. 
  
  */

  const fetchAllChats = async () => {
    try {
      const { data } = await Axios.get(`${API_BASE_URL}/api/chat/allchats`, {
        withCredentials: true,
      });
      console.log({ allChats: data });

      setChats(data || []);
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error Occured!!",
        description: "Failed to Load the chats",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    console.log("MyChats UseEffect");
    fetchAllChats();
  }, [fetchChatsAgain]);

  /*
  useEffect(() => {
    console.log("useEffect-2-socketUsage");

    socket.on("all users", (usersConnected) => {
      console.log({ usersConnected });
      setOnlineUsers(usersConnected);
    });

    socket.on("user online", (userId) => {
      console.log(`user connected ${userId}`);
      setOnlineUsers((prevUsers) => [...prevUsers, userId]);
    });

    socket.on("user offline", (userId) => {
      console.log(`disconnected user's ${userId}`);
      setOnlineUsers((prevUsers) => prevUsers.filter((id) => id !== userId));
    });

    socket.on("refetchChats", () => {
      setFetchChatsAgain(!fetchChatsAgain);
    });

    // socket.on("message read", () => {
    //   setApplyBlueTick(true);
    // });

    return () => {
      socket.off("all users");
      socket.off("user online");
      socket.off("user offline");
      socket.off("refetchChats");
    };
  }, [fetchChatsAgain]);

*/

  useEffect(() => {
    console.log("useEffect-MyChats-socketUsage");

    const isSocketReady = socket && socket.active && socket.connected;

    if (!isSocketReady || !user?.id) return;

    // Subscribe to all users list (sent after login/setup)
    const allUsersSubscription = socket.subscribe(
      "/user/queue/onlineUsers",
      (message) => {
        const usersConnected = JSON.parse(message.body);
        console.log("/user/queue/onlineUsers");
        console.log({ usersConnected });
        setOnlineUsers(usersConnected);
      }
    );

    // Subscribe to user online notification
    const userOnlineSubscription = socket.subscribe(
      "/topic/user/online",
      (message) => {
        const userId = message.body;
        console.log(`user connected ${userId}`);
        setOnlineUsers((prevUsers) => [...prevUsers, userId]);
      }
    );

    // Subscribe to user offline (You need to implement this on backend)
    const userOfflineSubscription = socket.subscribe(
      "/topic/user/offline",
      (message) => {
        const userId = message.body;
        console.log(`disconnected user's ${userId}`);
        setOnlineUsers((prevUsers) => prevUsers.filter((id) => id !== userId));
      }
    );

    // Subscribe to refetchChats trigger
    const refetchChatsSubscription = socket.subscribe(
      "/user/queue/refetchChats",
      (message) => {
        const payload = JSON.parse(message.body); // Parse the JSON payload

        console.log("/user/queue/refetchChats subscription", payload);

        if (payload.deletedChat) {
          console.log("Deleted Chat received:", payload.deletedChat);
          const deletedChat = payload.deletedChat;

          if (selectedChat.id === deletedChat.id) {
            setSelectedChat({}); // Clear if currently selected
          }
        } else if (payload.updatedChat) {
          console.log("Updated Chat received:", payload.updatedChat);
          const updatedChat = payload.updatedChat;

          console.log({
            updatedChatID: updatedChat.id,
            selectedChatID: selectedChat.id,
          });

          if (selectedChat.id === updatedChat.id) {
            console.log("setSelectedChat setter method called");
            setSelectedChat(updatedChat); // Replace if currently selected
          }
        }
        setFetchChatsAgain((prev) => !prev);
      }
    );

    return () => {
      allUsersSubscription.unsubscribe();
      userOnlineSubscription.unsubscribe();
      userOfflineSubscription.unsubscribe();
      refetchChatsSubscription.unsubscribe();
    };
  }, [socket, fetchChatsAgain, selectedChat?.id]);

  const getChatName = (loggedUser, users) => {
    // console.log(loggedUser);
    // console.log(users);
    // console.log(loggedUser.id === users[0].id);
    // console.log(users[1].name);
    return loggedUser.id === users[0].id ? users[1].name : users[0].name;
  };

  function handleGroupChat() {
    setShowGroupChatModal(true);
  }

  function isUserOnline(loggedInUser, users) {
    let otherUserId =
      loggedInUser.id === users[0].id ? users[1].id : users[0].id;

    console.log({ otherUser: otherUserId, loggedInUser: loggedInUser.id });

    let userOnline = onlineUsers.includes(otherUserId.toString());
    return userOnline;
  }

  function getChatImgUrl(loggedInUser, users) {
    let otherUserId = loggedInUser.id === users[0].id ? users[1] : users[0];

    return otherUserId?.pic;
  }

  async function handleDeleteChat(chatObj) {
    console.log(chatObj);

    try {
      const { data } = await Axios.delete(
        `${API_BASE_URL}/api/chat/deletechat`,
        {
          headers: { "Content-Type": "application/json" },
          data: { chatId: chatObj.id },
          withCredentials: true,
        }
      );

      console.log(data.deletedChatDoc);
      setChats(chats.filter((ct) => ct.id !== data.deletedChatDoc.id));
      //  socket.emit("refetchingChats", data);

      // Clear out chatName or set a flag to help backend identify deletion
      const deletedData = { ...data.deletedChatDoc, chatName: null };

      //💡 'socket' should be the STOMP client you connected during 'onConnect'.
      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(deletedData),
      });

      if (selectedChat.id === data.deletedChatDoc.id) {
        setSelectedChat({});
      }
      toast({
        title: "Chat Successfully Deleted!!",
        description: "Deleted Chat",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "top-left",
      });
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error Occured!!",
        description: "Failed to Delete the chat",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "bottom-left",
      });
    }
  }

  return (
    <>
      <div className={styles.myChatsContainer}>
        <div className={styles.header}>
          <h2>My Chats</h2>
          <button className={styles.newGroupButton} onClick={handleGroupChat}>
            New Group Chat +
          </button>
        </div>
        <div className={styles.chatList}>
          {/*
           <div className={styles.chatItem}>
            <span>Time</span>
            <p>Roadside Coder: yo</p>
          </div> 
          */}
          {chats.length > 0 &&
            chats.map((chat) => {
              return (
                <div
                  key={chat.id}
                  className={`${styles.chatItem} ${
                    selectedChat.id === chat.id ? styles.selecChat : ""
                  }`}
                  onClick={() => {
                    localStorage.removeItem("messages");
                    setSelectedChat(chat);
                  }}
                >
                  <span className={styles.userItem}>
                    {!chat.groupChat ? (
                      <img
                        src={getChatImgUrl(user, chat.users)}
                        alt={"profile pic"}
                        className={styles.avatar}
                      />
                    ) : (
                      <img
                        src={chat?.groupAdmin?.pic}
                        alt={"profile pic"}
                        className={styles.avatar}
                      />
                    )}
                    {!chat.groupChat
                      ? getChatName(user, chat.users)
                      : chat.chatName}
                    {!chat.groupChat ? (
                      isUserOnline(user, chat.users) ? (
                        <span className={styles.isOnline}>{"online"}</span>
                      ) : (
                        <span className={styles.isOffline}>{"offline"}</span>
                      )
                    ) : (
                      ""
                    )}
                  </span>
                  {chat?.latestMessage?.sender.email ? (
                    <p>
                      {chat.latestMessage.sender.name}:{" "}
                      {!chat.latestMessage.content
                        ? "image sent"
                        : chat.latestMessage.content}
                    </p>
                  ) : (
                    ""
                  )}
                  {!chat.groupChat && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      {showGroupChatModal && <GroupChatModal onClose={setShowGroupChatModal} />}
    </>
  );
}

export default MyChats;

/*

 <div className={styles.chatItem}>
          <span>Piyush</span>
        </div>
        <div className={styles.chatItem}>
          <span>Guest User</span>
          <p>Guest user: woooo</p>
        </div>
        <div className={styles.chatItem}>
          <span>Time</span>
          <p>Roadside Coder: yo</p>
        </div>
        <div className={styles.chatItem}>
          <span>RoadSide Coder Fam</span>
          <p>Guest User: 👏❤️❤️❤️</p>
        </div>
        <div className={styles.chatItem}>
          <span>Youtube Demo</span>
          <p>Guest User: ssup</p>
        </div>
        <div className={styles.chatItem}>
          <span>Karle Vedant Prasad</span>
          <p>hello there</p>
        </div>

*/
