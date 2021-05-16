'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });

const THREAD_SCHEMA = new mongoose.Schema({
  text: String,
  created_on: {type: Date, default: Date.now},
  bumped_on: {type: Date, default: Date.now},
  reported: {type: Boolean, default: false},
  delete_password: String,
  replies: [{
    _id: mongoose.Schema.Types.ObjectId,
    text: String,
    created_on: Date,
    delete_password: String,
    reported: Boolean
  }],
  replycount: {type: Number, default: 0}
});

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post((req, res) => {
      // console.log(req.body);
      const { board } = req.params;
      const { text, delete_password } = req.body;

      const THREAD = mongoose.model(board, THREAD_SCHEMA);

      bcrypt.hash(delete_password, 12, (err, hash) => {
        if(err) return console.log(err);
        THREAD.create({ text, delete_password: hash}, (err, data) => {
          if(err) return console.log(err);
          
          console.log('New thread posted: ', data._id);
          return res.redirect(`/b/${board}/`);
        });
      });
    })
    .get((req, res) => {
      const { board } = req.params;
      console.log(req.params);
      const THREAD = mongoose.model(board, THREAD_SCHEMA);

      THREAD.find({}, (err, thread) => {
        if(err) return console.log(err);

        // cleaning replies array to show only the latest 3 replies, dropping passwords and reported
        let return_thread = [];

        thread.forEach(thr => {
          const { _id, text, created_on, bumped_on, replycount } = thr;
          let replies = [];

          thr.replies.slice(-3).forEach(reply => {
            const { _id, text, created_on } = reply;
            replies.push({ _id, text, created_on });
          });

          return_thread.push({ _id, text, created_on, bumped_on, replycount, replies });          
        });

        return res.json(return_thread.reverse());
      });
    })
    .delete((req, res) => {
      const { board } = req.params;
      const { thread_id, delete_password } = req.body;

      const THREAD = mongoose.model(board, THREAD_SCHEMA);

      THREAD.findById(thread_id, (err, data) => {
        if(err) return console.log(err);
        console.log('password equal? ', bcrypt.compareSync(delete_password, data.delete_password));
        if(data && bcrypt.compareSync(delete_password, data.delete_password)) {
          THREAD.findByIdAndDelete(thread_id, (err, d) => {
            if(err) return console.log(err);
            console.log(`thread_id "${thread_id}" from board "${board}" has been deleted.`);
            return res.send('success');
          });
        }
        else return res.send('incorrect password')
      });
    })
    .put((req, res) => {
      
    });
      
  app.route('/api/replies/:board')
    .post((req, res) => {
      // console.log(req.body);
      const { board } = req.params;
      const { thread_id, text, delete_password } = req.body;

      const THREAD = mongoose.model(board, THREAD_SCHEMA);

      bcrypt.hash(delete_password, 12, (err, rep_hash) => {
        if(err) return console.log(err);

        THREAD.findById(thread_id, (err, thread) => {
          let reply = {
            _id: mongoose.Types.ObjectId(),
            text,
            created_on: Date.now(),
            delete_password: rep_hash,
            reported: false
          };

          thread.replies.push(reply);
          thread.replycount = thread.replies.length;

          thread.save((err, data) => {
            if(err) return console.log(err);

            // console.log(data);
            console.log(`A reply has been added to thread_id "${thread_id}" in board "${board}"`);
            return res.redirect(`/b/${board}/${thread_id}`);
          });
        });
      });
    })
    .get((req, res) => {
      const { board } = req.params;
      const { thread_id } = req.query;
      
      const THREAD = mongoose.model(board, THREAD_SCHEMA);

      THREAD.findById(thread_id, (err, thread) => {
        if(err) return console.log(err);

        const { _id, text, created_on, bumped_on } = thread;
        let replies = [];

        thread.replies.forEach(reply => {
          const { _id, text, created_on } = reply;

          replies.push({ _id, text, created_on });          
        });

        console.log(`Data from thread_id "${thread_id} received.`);
        return res.json({ _id, text, created_on, bumped_on, replies });
      });
    })
    .delete((req, res) => {
      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;
      
      const THREAD = mongoose.model(board, THREAD_SCHEMA);

      THREAD.findById(thread_id, (err, thread) => {
        if(err) return console.log(err);
        if(thread) {
          let delIndex = thread.replies.findIndex(reply => reply._id == reply_id);
          if(delIndex >= 0 && bcrypt.compareSync(delete_password, thread.replies[delIndex].delete_password)) {
            thread.replies[delIndex].text = '[deleted]'; 
            thread.save((err, data) => {
              if(err) return console.log(err);
              res.send('success');
            });
          }
          else return res.send('incorrect password');
        }
        else return res.send('incorrect password');
      });
    })
    .put((req, res) => {
      
    });

};
