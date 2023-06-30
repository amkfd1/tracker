const mongoose = require('mongoose');

const { Schema } = mongoose;

const permissionSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    description: String,
  },
  { versionKey: false }
);

const Permission = mongoose.model('Permission', permissionSchema);
