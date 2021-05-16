const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    const board = 'functional-test-' + String(Date.now()).slice(-8);
    const text = 'functional-test text';
    const password = 'RandomizeThisPassword';
    let thread_id;

    test('Creating a new thread: POST request to /api/threads/{board}', done => {
        chai.request(server)
            .post(`/api/threads/${board}/`)
            .send({ board, text, delete_password: password })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.include(res.redirects[0], `/b/${board}`, 'Response should redirect you to the board\'s page');
                done();
            });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', done => {
        chai.request(server)
            .get(`/api/threads/${board}/`)
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10, 'Threads returned should only be the 10 most recent threads.');
                assert.isAtMost(res.body[0].replies.length, 3, 'The replies shown should only be the 3 most recent.');
                thread_id = res.body[0]._id;
                done();
            });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', done => {
        chai.request(server)
            .put(`/api/threads/${board}/`)
            .send({ thread_id })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'successfully reported');
                done();
            });
    });

    test('Creating a new reply: POST request to /api/replies/{board}', done => {
        chai.request(server)
            .post(`/api/replies/${board}/`)
            .send({ thread_id, text, delete_password: password })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.include(res.redirects[0], `/b/${board}/${thread_id}`, 'Response should redirect you to the threads\'s page');
                done();
            });
    });

    let reply_id;
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', done => {
        chai.request(server)
            .get(`/api/replies/${board}?thread_id=${thread_id}`)
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body.replies[res.body.replies.length - 1].text, text);
                reply_id = res.body.replies[res.body.replies.length - 1]._id;
                done();
            });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', done => {
        chai.request(server)
            .put(`/api/replies/${board}`)
            .send({ thread_id, reply_id })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'successfully reported', 'Response text is not official');
                done();
            });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', done => {
        chai.request(server)
            .delete(`/api/replies/${board}`)
            .send({ thread_id, reply_id, delete_password: 'wrongPasswordooo' })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', done => {
        chai.request(server)
            .delete(`/api/replies/${board}`)
            .send({ thread_id, reply_id, delete_password: password })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            });
    })

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', done => {
        chai.request(server)
            .delete(`/api/threads/${board}/`)
            .send({ thread_id, delete_password: 'wrongPassword' })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', done => {
        chai.request(server)
        .delete(`/api/threads/${board}/`)
        .send({ thread_id, delete_password: password })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
    });
});
