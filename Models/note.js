const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteSchema = new Schema({
  tracker: {
    type: Schema.Types.ObjectId,
    ref: 'Tracker',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  note: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TrackerNote = mongoose.model('Note', noteSchema);

const addNoteToTracker = async (trackerId, userId, note) => {
  try {
    const trackerNote = new TrackerNote({
      tracker: trackerId,
      user: userId,
      note,
    });

    const savedNote = await trackerNote.save();
    return savedNote;
  } catch (error) {
    console.error('Error adding note to tracker:', error);
    throw error;
  }
};

module.exports = TrackerNote;