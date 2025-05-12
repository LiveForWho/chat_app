import Message from "../modules/Message.js";
import User from "../modules/User.js";
import cloudinary from "../library/cloudinary.js";
import { io, userSocketMap } from "../server.js";

export const getUserForSideBar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $en: userId } }).select(
      "-password"
    );

    //Count number of message not seen
    const unseenMessage = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessage[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, user: filteredUsers, unseenMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Get all message for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    //Emit the new message to the receiver socket
    const receiverSocketId = userSocketMap(receiverId);
    if (receiverSocketId) {
      io.to(receiverId).emit("newMessage", newMessage);
    }
    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
