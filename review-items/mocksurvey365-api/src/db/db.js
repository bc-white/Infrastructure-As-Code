const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");

const connect_to_db = async () => {
  mongoose
    .connect(
      CONSTANTS.DB,
      {}
    )
    .then(() => {
      console.log("✅ Connected to MongoDB");
    })
    .catch((e) => console.log(e));
};

const str_to_obj_id = (str) => {
  return mongoose.Types.ObjectId(str);
};

const generate_object_id = () => {
  return new mongoose.Types.ObjectId();
};

const generate_uuid = () => {
  return generate_object_id().toString();
};

module.exports = {
  connect_to_db,
  str_to_obj_id,
  generate_object_id,
  generate_uuid,
};
