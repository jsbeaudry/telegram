var mongoose = require("mongoose");

var database = require("../config/database");

var User = require("../models/user");

mongoose.connect(database.url);

//get all user data from db
const find = async (filter) => {
  try {
    const res = await User.find(filter);
    return res;
  } catch (error) {
    return { error: true };
  }
};

// create user and send back all users after creation
const create = async (body) => {
  // create mongose method to create a new user
  try {
    const resFind = await User.find({});
    if (resFind.length > 0) return { result: "Already exist" };

    const res = await User.create(body);
    if (res && res._id) return res;
  } catch (error) {
    return { error: true };
  }
};

// get a user with ID of 1
const findById = async (id) => {
  try {
    const res = await User.findById(id);

    if (res && res._id) return res;
  } catch (error) {
    return { error: true };
  }
};

// delete a user by _id
const remove = async (id) => {
  try {
    await User.deleteOne({
      _id: id,
    });
    return { deleted: true };
  } catch (error) {
    return { deleted: true, error: true };
  }
};

// create user and send back all users after creation
const update = async (id, body) => {
  try {
    const res = await User.findOneAndUpdate({ id: id }, body);
    if (res && res._id) return res;
  } catch (error) {
    return { error: true };
  }
};

module.exports = { find, create, findById, remove, update };
