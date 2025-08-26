const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    encryptedPath: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    size: Number,
    hash: String, // optional SHA256 or similar

    uuid: { type: String, required: true, unique: true },

    public: { type: Boolean, default: false },
    downloadToken: { type: String, unique: true, sparse: true },

    expiresAt: { type: Date, default: null },
    autoDelete: { type: Boolean, default: false },

    requiresPassword: { type: Boolean, default: false },
    downloadPassword: { type: String, default: null },

    otpProtected: { type: Boolean, default: false },
    passwordProtected: { type: Boolean, default: false },
    passwordHash: { type: String },

    downloadCount: { type: Number, default: 0 },

    maxDownloads: { type: Number, default: null },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mimeType: String,

    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
