const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brcrypt = require('bcrypt');
const httpStatus = require('http-status');


const userSchema = new Schema({
  username: {
    type: String,
    trim: true,
    maxlength: 20,
    required: true
  },
  password: {
    type: String,
    minlength: 6,
    maxlength: 128,
    required: true,
  },
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    trim: true,
    lowercase: true,
    unique: true,
    required: true,
  },
  avatar: {
    type: String,
    trim: true,
    lowercase: true,
  },
  links: [
    {
      link: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
  ],
  sex: {
    type: String,
    minlength: 4,
    maxlength: 6,
    lowercase: true,
    trim: true,
    sparse: true,
  },
  age: {
    type: Number,
    sparse: true,
  },
  job: {
    type: String,
    maxlength: 30,
    trim: true,
    sparse: true,
  },
  hobbies: [
    {
      hobbie: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        maxlength: 30,
      },
    },
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  rankId: {
    type: Number,
    maxlength: 3,
    sparse: true,
  },
}, { timestamps: true });

userSchema.index({ username: 1 }, { email: 1 }, { job: 1 });

userSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();
    const hash = brcrypt.hashSync(this.password, 10);
    this.password = hash;
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.method({
});

userSchema.statics = {
}

const userModel =  mongoose.model('User', userSchema);

module.exports = {
  schema: userSchema,
  model: userModel,
}