import { Input, useToast, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import styles from "./UploadBox.module.css";
import Axios from "axios";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function UploadBox({ onCloseBox, messages, onSetMessages }) {
  const [image, setImage] = useState(null);
  const [sendingImageMessage, setSendingImageMessage] = useState(false);

  console.log("UploadBox Component");
  console.log({ image });

  const {
    selectedChat,
    fetchChatsAgain,
    setFetchChatsAgain,
    socket,
    onlineUsers,
    user,
  } = useChatContext();

  const toast = useToast();

  async function handleNotificationsForOfflineUsers(
    onlineUsersArr,
    messObj,
    loggedInUser
  ) {
    let otherUserId =
      loggedInUser?._id === messObj.chat.users[0]?.id
        ? messObj.chat.users[1].id
        : messObj.chat.users[0].id;

    let userOnline = onlineUsersArr.includes(otherUserId.toString());

    if (!userOnline) {
      //Logic for creating a Notification document.
      try {
        const { data } = Axios.post(
          `${API_BASE_URL}/api/notification/create`,
          { messageId: messObj.id, userId: otherUserId },
          { withCredentials: true }
        );

        console.log({ notificationCreated: data });
      } catch (err) {
        console.log(err.message);
      }
    }
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

  async function sendImageMessage(e) {
    e.preventDefault();

    if (image === null) return;

    //Extract data from the form fields.
    const formdata = new FormData(e.currentTarget);

    //Converting the form data into actual JS object.
    const data = Object.fromEntries(formdata);

    console.log({ imageData: data });

    // Check if the 'pic' is a valid File object or not.
    if (data.pic instanceof File && data.pic?.name) {
      let imageUrl = await uploadImageToCloudinary();

      console.log({ imageUrl });

      if (!imageUrl) {
        return;
      }

      //Logic to create a 'message' doc. containing 'imageUrl' & hence updating the coressp. 'chat' doc.
      try {
        setSendingImageMessage(true);

        const { data } = await Axios.post(
          `${API_BASE_URL}/api/message/imgmessage`,
          { content: "", chatId: selectedChat.id, imageURL: imageUrl },
          { withCredentials: true }
        );

        console.log({ messageImage: data });
        localStorage.setItem("messages", JSON.stringify([...messages, data]));
        onSetMessages([...messages, data]);
        setFetchChatsAgain(!fetchChatsAgain);

        //       socket.emit("new message", data);

        socket.publish({
          destination: "/app/chat/send",
          body: JSON.stringify(data), // `data` is your `MessageDTOFE` object
        });

        handleNotificationsForOfflineUsers(onlineUsers, data, user);

        toast({
          title: "Message with Image sent Successfully !!",
          status: "success",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
        onCloseBox(false);
        e.target.reset();
      } catch (err) {
        console.log(err.message);
        toast({
          title: "Error Occured !!",
          description: `Unable to send the Message (Server Issue)`,
          status: "error",
          duration: "4000",
          isClosable: true,
          position: "top",
        });
      } finally {
        setSendingImageMessage(false);
      }
    } else {
      toast({
        title: "Warning alert !!",
        description: `Please upload an appropriate Image File !!!`,
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top",
      });
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.innerModal}>
          <form onSubmit={sendImageMessage} className={styles.imageBOX}>
            <label>📷 Upload Image</label>
            <Input
              type="file"
              p={1.5}
              accept="image/*"
              name="pic"
              onChange={(e) => setImage(e.target.files[0])}
            />
            {sendingImageMessage ? (
              <Spinner
                size="sm"
                thickness="3px"
                speed="0.45s"
                color="#63E6BE"
                emptyColor="gray.200"
                position="absolute"
                className={styles.spinnerMessage}
              />
            ) : (
              <button className={styles.imageBtn}>Send Image ▶ </button>
            )}
          </form>
          <button className={styles.closeBtn} onClick={() => onCloseBox(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadBox;
