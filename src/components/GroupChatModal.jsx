import { useEffect, useState } from "react";
import styles from "./GroupChatModal.module.css";
import { Spinner, useToast } from "@chakra-ui/react";
import { useChatContext } from "../context/ChatProvider";
import Axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function GroupChatModal({ onClose }) {
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  console.log("GroupChatModal");
  console.log({ groupChatName });
  console.log({ searchResults });
  console.log({ selectedUsers });

  // When we create a group chat, we need to add it in our chats array.
  const { user, chats, setChats, setSelectedChat, socket } = useChatContext();

  async function handleSubmit() {
    if (!groupChatName.trim() && !selectedUsers.length) {
      toast({
        title: "Please fill all the fields !!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const { data } = await Axios.post(
        `${API_BASE_URL}/api/chat/group`,
        {
          name: groupChatName,
          users: selectedUsers.map((el) => el.id),
        },
        {
          withCredentials: true,
        }
      );
      console.log(data);
      setChats([data, ...chats]);
      setSelectedChat(data);
      onClose(false);

      // socket.emit("refetchingChats", data);
      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data),
      });

      toast({
        title: "New Group Chat Created !!",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "bottom",
      });
    } catch (err) {
      console.log("Group Chat Error is:-");
      console.log(err.response?.data || err.message);
      toast({
        title: "Group Chat Error !!",
        description:
          err.response?.data || "New Group Chat could not be created !!",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "bottom",
      });
    }
  }

  function handleDelete(userToDelete) {
    let updatedSelectedUsers = selectedUsers.filter(
      (el) => el.id !== userToDelete.id
    );
    setSelectedUsers(updatedSelectedUsers);
  }

  function handleSelectedUsers(userToAdd) {
    console.log(userToAdd);

    if (selectedUsers.find((el) => el.id === userToAdd.id) !== undefined) {
      toast({
        title: "User already added !!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
      return;
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
  }

  async function handleSearch() {
    if (!searchQuery.length) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await Axios.get(
        `${API_BASE_URL}/api/user?search=${searchQuery}`,
        { withCredentials: true }
      );

      console.log({ data });
      setSearchResults(data);
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error Occured !!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "top-left",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("UseEffect handleSearch");
    handleSearch();
  }, [searchQuery.length]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={() => onClose(false)}>
          &times;
        </button>
        <h1 className={styles.profileName}>Create Group Chat</h1>
        <div className={styles.modalBody}>
          <input
            type="text"
            placeholder="Group Name"
            className={styles.inputField}
            value={groupChatName}
            onChange={(e) => setGroupChatName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Add Users eg. John, Jenny, etc..."
            className={styles.inputField}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* render selected users */}
        {selectedUsers.length > 0 && (
          <div className={styles.userItemContainer}>
            {selectedUsers.map((user) => {
              return (
                <div key={user.id} className={styles.userSelectItem}>
                  <span>{user.name}</span>
                  <button
                    className={styles.userBtn}
                    onClick={() => handleDelete(user)}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* render searched users */}
        {loading ? (
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        ) : (
          searchResults.length > 0 && (
            <ul className={styles.userList}>
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className={styles.userItem}
                  onClick={() => handleSelectedUsers(user)}
                >
                  <img
                    src={user.pic}
                    alt={user.name}
                    className={styles.avatar}
                  />
                  <div>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userEmail}>Email: {user.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        <button className={styles.BtnProfile} onClick={handleSubmit}>
          Create Chat
        </button>
      </div>
    </div>
  );
}

export default GroupChatModal;
