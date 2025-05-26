import Message from "../models/message.model.js";
import mongoose from "mongoose";

export const createMessage = async (data) => {
  return await Message.create({
    ...data,
    conversationId: new mongoose.Types.ObjectId(data.conversationId)
  });
};

export const populateMessage = async (message) => {
  return await message.populate([
    { path: "sender", select: "_id fullName phoneNumber avatar" },
    { path: "replyTo" }
  ]);
};
