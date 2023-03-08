var mongoose = require("mongoose");

var database = require("../config/database");

var Message = require("../models/message");

mongoose.connect(database.url);

//get all message data from db
const findMessage = async (filter) => {
  // use mongoose to get all todos in the database
  try {
    const res = await Message.find(filter);
    return res;
  } catch (error) {
    return { error: true };
  }
};

// create message and send back all messages after creation
const createMessage = async (body) => {
  // create mongose method to create a new message
  try {
    const res = await Message.create(body);
    if (res && res._id) return res;
  } catch (error) {
    return { error: true };
  }
};

// get a message with ID of 1
const findByIdMessage = async (id) => {
  try {
    const res = await Message.findById(id);

    if (res && res._id) return res;
  } catch (error) {
    return { error: true };
  }
};

// delete a message by _id
const removeMessage = async (id) => {
  try {
    await Message.deleteOne({
      _id: id,
    });
    return { deleted: true };
  } catch (error) {
    return { deleted: true, error: true };
  }
};

// create message and send back all messages after creation
const updateMessage = async (id, body) => {
  try {
    const res = await Message.findByIdAndUpdate(id, body);
    if (res && res._id) return res;
  } catch (error) {
    return { error: true };
  }
};

module.exports = {
  findMessage,
  createMessage,
  findByIdMessage,
  removeMessage,
  updateMessage,
};
