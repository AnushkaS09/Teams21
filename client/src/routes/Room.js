//Video Room Code

import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form, DropdownButton, Dropdown, Modal, ProgressBar } from 'react-bootstrap';
import './Room.css';
import useMediaRecorder from '@wmik/use-media-recorder';
const Video = (props) => {
    const ref = useRef();
    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);
    return (
        <video playsInline autoPlay ref={ref} className="othersVideoStream" />
    );
}

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const [removed, setRemoved] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    const [screenSharing, setscreenSharing] = useState(false);
    const [liveChat, setliveChat] = useState("");
    const [chatArea, setchatArea] = useState([]);
    const [userReaction, setuserReaction] = useState('');
    const [usernames, setusernames] = useState([]);
    const [otherUserReaction, setotherUserReaction] = useState(() => new Map());
    const [PollQuestion, setPollQuestion] = useState("");
    const [PollOptionA, setPollOptionA] = useState("");
    const [PollOptionB, setPollOptionB] = useState("");
    const [PollOptionC, setPollOptionC] = useState("");
    const [roomPolls, setroomPolls] = useState([]);
    const [userResponse, setuserResponse] = useState([]);
    const [pollWindow, setPollWindow] = useState(false);
    const [TakePoll, setTakePoll] = useState(false);
    const [refresh, setRefresh] = useState(true);
    const [userMuteFlag, setuserMuteFlag] = useState(true);
    const [userVideoFlag, setuserVideoFlag] =useState(true);
    let {
		error,
		status,
		mediaBlob,
		stopRecording,
		getMediaStream,
		startRecording
	  } = useMediaRecorder({
		recordScreen: true,
		blobOptions: { type: 'video/webm' },
		mediaStreamConstraints: { audio: true, video: true }
	  });
    useEffect(() => {
        if (typeof props.location.state == 'undefined') {
            props.history.push('/');
            return;
        }
        socketRef.current = io.connect("https://ms-teams-2.herokuapp.com/");
        // socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia(
            {
                video: {
                    height: window.innerHeight / 2,
                    width: window.innerWidth / 2
                }, audio: true
            }).then(stream => {
                userVideo.current.srcObject = stream;
                userVideo.current.srcObject.getAudioTracks()[0].enabled = props.location.state ? props.location.state.mute : true;
                userVideo.current.srcObject.getVideoTracks()[0].enabled = props.location.state ? props.location.state.video : true;
                setuserMuteFlag(userVideo.current.srcObject.getAudioTracks()[0].enabled);
                setuserVideoFlag(userVideo.current.srcObject.getVideoTracks()[0].enabled);
                socketRef.current.emit("join room", roomID);
                socketRef.current.emit("user name", props.location.state.UserIdentity)
                socketRef.current.emit("getPolls", {})

                socketRef.current.on("all users", users => {
                    const peers = [];
                    users.forEach(userID => {
                        const peer = createPeer(userID, socketRef.current.id, stream);
                        peersRef.current.push({
                            peerID: userID,
                            peer,
                        })
                        peers.push({
                            peerID: userID,
                            peer
                        });
                    })
                    setPeers(peers);
                })
                socketRef.current.on("user joined", (payload) => {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    });
                    setPeers([...peersRef.current]);
                });
                socketRef.current.on("sendPoll", payload => {
                    if (payload !== null) {
                        setroomPolls(payload);
                    }
                });
                socketRef.current.on("userDisconnected", payload => {
                    const peerObj = peersRef.current.find(p => p.peerID === payload);
                    if (peerObj) {
                        peerObj.peer.destroy();
                    }
                    const peers = peersRef.current.filter(p => p.peerID !== payload);
                    peersRef.current = peers;
                    setPeers(peers)
                })
                socketRef.current.on("receiving returned signal", payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                });
                socketRef.current.on("sendPreviousMsg", payload => {
                    setchatArea(payload);
                })
                socketRef.current.on("allUserReactions", payload => {
                    setotherUserReaction(payload);
                    setRefresh(!refresh)
                });
                socketRef.current.on("setroomUserNames", payload => {
                    setusernames(payload);
                    console.log(payload)
                    setRefresh(!refresh);
                });
            })
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });
        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })
        if (screenSharing) {
            ScreenSharing(null);
        }
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })
        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })
        peer.signal(incomingSignal);

        if (screenSharing) {
            ScreenSharing(null);
        }
        return peer;
    }
    function MuteControl(e) {
        userVideo.current.srcObject.getAudioTracks()[0].enabled = !(userVideo.current.srcObject.getAudioTracks()[0].enabled)
        setRefresh(!refresh);
        setuserMuteFlag(!userMuteFlag);
    }
    function VideoControl(c) {
        userVideo.current.srcObject.getVideoTracks()[0].enabled = !(userVideo.current.srcObject.getVideoTracks()[0].enabled)
        setRefresh(!refresh);
        setuserVideoFlag(!userVideoFlag);
    }
    function putUserVideo(flag) {
        navigator.mediaDevices.getUserMedia(
            {
                video: {
                    height: window.innerHeight / 2,
                    width: window.innerWidth / 2
                }, audio: true
            }).then(stream => {
                userVideo.current.srcObject = stream;
                userVideo.current.srcObject.getAudioTracks()[0].enabled = userMuteFlag;
                userVideo.current.srcObject.getVideoTracks()[0].enabled = userVideoFlag;
                peers.forEach(peer => {
                    peer.peer.streams[0].getVideoTracks()[0].stop();
                    peer.peer.replaceTrack(peer.peer.streams[0].getVideoTracks()[0], stream.getVideoTracks()[0], peer.peer.streams[0]);
                });
                console.log(userVideo.current.srcObject);
            }

            )
        if (flag)
            setscreenSharing(!screenSharing)
    }

    function ScreenSharing(e) {
        if (screenSharing) {
            putUserVideo(false);
        }
        else {
            navigator.mediaDevices.getDisplayMedia({ cursor: false }).then(stream => {
                stopSharing();
                userVideo.current.srcObject = stream;
                setuserVideoFlag(true);
                setuserMuteFlag(false);
                stream.getVideoTracks()[0].onended = function () {
                    putUserVideo(true);
                };
                peers.forEach(peer => {
                    peer.peer.streams[0].getVideoTracks()[0].stop();
                    peer.peer.replaceTrack(peer.peer.streams[0].getVideoTracks()[0], stream.getVideoTracks()[0], peer.peer.streams[0]);
                });
            })
        }
        setscreenSharing(!screenSharing);
    }
    useEffect(() => {
        if (typeof props.location.state == 'undefined') {
            props.history.push('/');
            return;
        }
        socketRef.current.emit("getReactions", userReaction)
        socketRef.current.emit("getPolls", userReaction)
        socketRef.current.emit("getPreviousMsg", chatArea)
        if (screenSharing) {
            peers.forEach(peer => {
                peer.peer.streams[0].getVideoTracks()[0].stop();
                peer.peer.replaceTrack(peer.peer.streams[0].getVideoTracks()[0], userVideo.current.srcObject.getVideoTracks()[0], peer.peer.streams[0]);
            });
        }
    }, [peers, screenSharing])

    useEffect(() => {
        if (typeof props.location.state == 'undefined') {
            props.history.push('/');
            return;
        }
        socketRef.current.emit("setReactions", userReaction)
    }, [userReaction])
    
    function stopSharing() {
        userVideo.current.srcObject.getTracks().forEach((track) => { track.stop() })
        userVideo.current.srcObject = null;

    }
    function handelDisconnect() {
        stopSharing();
        peersRef.current.srcObject = null;
        socketRef.current.srcObject = null;
        socketRef.current.disconnect();
        props.history.push({ pathname: `/chat/${roomID}`, state: { mute: props.location.state.mute, video: props.location.state.video, UserIdentity: props.location.state.UserIdentity } });
    }
    function newText(e) {
        setliveChat(e.target.value);
    }
    function sendText(e) {
        socketRef.current.emit("sendText", liveChat);
        setliveChat("");
    }
    function handlePollSubmit() {
        socketRef.current.emit("AddPoll", { PollQuestion, PollOptionA, PollOptionB, PollOptionC })
        handleClose();
    }
    function handleTakePoll() {
        setTakePoll(true);
    }
    function submitPoll(e, id) {
        socketRef.current.emit("selectUser", { option: e.target.value, id });
        setuserResponse(value => [...value, { id: id }]);
    }
    const handleClose = () => { setPollWindow(false); setTakePoll(false) };
    const handlePollWindow = () => setPollWindow(true);
    function ReactionKey(value) {
        switch (value) {
            case "0": return null;
            case "1": return (<img className="reactionAnimation" src="https://media.giphy.com/media/ehz3LfVj7NvpY8jYUY/giphy.gif" />);
            case "2": return (<img className="reactionAnimation" src="https://media.giphy.com/media/348bJfTR7gk4E/giphy.gif" />);
            case "3": return (<img className="reactionAnimation" src="https://media.giphy.com/media/QvqG8HUi0isyBqSA9Y/giphy.gif" />);
            case "4": return (<img className="reactionAnimation" src="https://media.giphy.com/media/NZyXJ00YoHWA0g3x4x/giphy.gif" />);
        }
    }
    useEffect(() => {
        console.log("refresh");
    }, [refresh, removed])
    return (
        <div className="wrapper">
            <div className="MainContainer">
                <div className="allOthersVideo">
                    {peers.map((peer) => {
                        return (
                            <div key={peer.peerID} className="otherUserVideoStream">
                                <p className="paraTag" style={{ position: "relative", textAlign: "center", top: "100%",right: "40%",color: "white"}}>{usernames.filter(id => id.id == peer.peerID).length ? usernames.filter(id => id.id == peer.peerID)[0].name : ""}</p>
                                <Video key={peer.peerID} peer={peer.peer} className="VideoStream" />
                                <div className="otherUserReaction">{ReactionKey(otherUserReaction[peer.peerID])}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="userVideo">
                    <div className="userVideoMain">
                        <video muted ref={userVideo} autoPlay playsInline className="userStream" />
                        <p style={{position: "relative", textAlign: "center",right: "20%",color: "white"}}>You</p>
                        <div>{ReactionKey(userReaction)}</div>
                    </div>
                    <div className="userVideoUtility">
                        <div className="roomControlButton">
                            <Button variant="secondary" className="roomControlButtons" onClick={MuteControl} style={{ width: 50, height: 50, borderRadius: 35, padding: 1, margin: 4 }}>{userMuteFlag ? <img src="https://img.icons8.com/ios-glyphs/30/000000/microphone.png" /> : <img src="https://img.icons8.com/ios-glyphs/30/000000/no-microphone.png" />}</Button>
                            <Button variant="secondary" className="roomControlButtons" onClick={VideoControl} style={{ width: 50, height: 50, borderRadius: 35, padding: 1, margin: 4 }}>{userVideoFlag ? <img src="https://img.icons8.com/material-rounded/24/000000/video-call.png" /> : <img src="https://img.icons8.com/ios-glyphs/24/000000/no-video.png" />}</Button>
                            <Button variant="secondary" className="roomControlButtons" onClick={ScreenSharing} style={{ width: 50, height: 50, borderRadius: 35, padding: 1, margin: 4 }}><img src="https://img.icons8.com/ios-glyphs/30/000000/share-3.png" /></Button>
                            <Button variant="danger" className="roomControlButtons" onClick={handelDisconnect} style={{ width: 50, height: 50, borderRadius: 35, padding: 1, margin: 4 }}><img src="https://img.icons8.com/ios-glyphs/24/000000/end-call.png" /></Button>
                            
                        </div>
                        <Button variant="secondary" style={{margin: 2}}  onClick={(e) => { navigator.clipboard.writeText(roomID) }}>
                                Copy RoomID
                            </Button>
                        <DropdownButton
                            title="Reactions"
                            id="dropdown-menu-align-right"
                            onSelect={(e) => setuserReaction(e)}
                            style={{ width: 50, height: 50, borderRadius: 35, padding: 1, margin: 4 }}
                        >
                            <Dropdown.Item eventKey="1"><img className="reactionDropdown" src="https://media.giphy.com/media/ehz3LfVj7NvpY8jYUY/giphy.gif" /></Dropdown.Item>
                            <Dropdown.Item eventKey="2"><img className="reactionDropdown" src="https://media.giphy.com/media/348bJfTR7gk4E/giphy.gif" /></Dropdown.Item>
                            <Dropdown.Item eventKey="3"><img className="reactionDropdown" src="https://media.giphy.com/media/QvqG8HUi0isyBqSA9Y/giphy.gif" /></Dropdown.Item>
                            <Dropdown.Item eventKey="4"><img className="reactionDropdown" src="https://media.giphy.com/media/NZyXJ00YoHWA0g3x4x/giphy.gif" /></Dropdown.Item>
                            <Dropdown.Item eventKey="0">Clear Reaction</Dropdown.Item>
                        </DropdownButton>
                        <DropdownButton
                            title="Recording"
                            id="dropdown-menu-align-right"
                            style={{ width: 50, height: 50, borderRadius: 35, padding: 1, margin:50}}
                        >
                            <Dropdown.Item eventKey="2"><Button
							type="button"
							onClick={startRecording}
							disabled={status === 'recording'}
							>
							Start recording
							</Button></Dropdown.Item>
                            <Dropdown.Item eventKey="3"><Button
							type="button"
							onClick={e=>{stopRecording();}}
							disabled={status !== 'recording'}
							>
							Stop recording
							</Button></Dropdown.Item>
							<Dropdown.Item eventKey="4">
							<Button variant="secondary" disabled={status === 'recording'} style={{margin: 2}}  onClick={(e) => {mediaBlob==null?navigator.clipboard.writeText("No recording found"): navigator.clipboard.writeText(URL.createObjectURL(mediaBlob)); }}>
                            Recording Link 
                            </Button></Dropdown.Item>
                        </DropdownButton>
                    </div>
                </div>
                <Modal show={pollWindow} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add Poll</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Control type="text" placeholder="Enter Poll Question" onChange={(e) => setPollQuestion(e.target.value)} />
                            <br />

                            <Form.Control type="text" placeholder="Option 1" onChange={(e) => setPollOptionA(e.target.value)} />
                            <Form.Control type="text" placeholder="Option 2" onChange={(e) => setPollOptionB(e.target.value)} />
                            <Form.Control type="text" placeholder="Option 3" onChange={(e) => setPollOptionC(e.target.value)} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handlePollSubmit}>
                            Add
                        </Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={TakePoll} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Take Poll</Modal.Title>
                        <button type="button" class="btn btn-success" style={{ marginLeft: 250 }}>Live</button>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            roomPolls.map(current => {
                                return (
                                    <div>
                                        <Form>
                                            <Form.Label style={{ fontWeight: "bold" }}>{current.PollQuestion}</Form.Label>
                                            <fieldset disabled={typeof userResponse.find(poll => poll.id === current.id) !== 'undefined'}>
                                                <Form.Check
                                                    type='radio'
                                                    name={`${current.id}`}
                                                    id={`${current.id}-option1`}
                                                    label={`${current.PollOptionA}`}
                                                    value={"voteOption1"}
                                                    onChange={(e) => { submitPoll(e, current.id) }}
                                                />
                                                {(parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3)) !== 0 ? <Form.Label style={{ width: "20%" }}>{<ProgressBar now={parseInt(current.voteOption1) * 100 / (parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3))} label={`${100 * parseInt(current.voteOption1) / (parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3))}%`} />}</Form.Label> : null}
                                                <Form.Check
                                                    type='radio'
                                                    name={`${current.id}`}
                                                    id={`${current.id}-option2`}
                                                    label={`${current.PollOptionB}`}
                                                    value={"voteOption2"}
                                                    onChange={(e) => { submitPoll(e, current.id) }}
                                                />
                                                {(parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3)) !== 0 ? <Form.Label style={{ width: "20%" }}>{<ProgressBar now={parseInt(current.voteOption2) * 100 / (parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3))} label={`${100 * parseInt(current.voteOption2) / (parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3))}%`} />}</Form.Label> : null}
                                                <Form.Check
                                                    type='radio'
                                                    name={`${current.id}`}
                                                    id={`${current.id}-option3`}
                                                    label={`${current.PollOptionC}`}
                                                    value={"voteOption3"}
                                                    onChange={(e) => { submitPoll(e, current.id) }}
                                                />
                                                {(parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3)) !== 0 ? <Form.Label style={{ width: "20%" }}>{<ProgressBar now={parseInt(current.voteOption3) * 100 / (parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3))} label={`${100 * parseInt(current.voteOption3) / (parseInt(current.voteOption1) + parseInt(current.voteOption2) + parseInt(current.voteOption3))}%`} />}</Form.Label> : null}
                                            </fieldset>
                                        </Form>
                                    </div>
                                )
                            })
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
            <div class="chatContainer p-0">
                <h1 class="h3 mb-3">Chat Room</h1>
                <div class="card">
                    <div class="row g-0 chatMessageRow">
                        <div class="col chatMessageCol">
                            <div class="chatMessageOthers">
                                <div class="chat-messages">
                                    {
                                        chatArea == null ? null : chatArea.map(message => {
                                            return (<div>{
                                                message.name == props.location.state.UserIdentity ?
                                                    <div class="chat-message-right pb-4">
                                                        <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                                                            <div class="font-weight-bold mb-1">You</div>
                                                            {message.msg}
                                                        </div>
                                                    </div>
                                                    :
                                                    <div class="chat-message-left pb-4">
                                                        <div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
                                                            <div class="font-weight-bold mb-1">{message.name}</div>
                                                            {message.msg}
                                                        </div>
                                                    </div>
                                            }</div>)
                                        })
                                    }
                                </div>
                            </div>
                            <div class=" py-3 border-top newChatMessage">
                                <div class="input-group newChatMessageDiv">
                                    <input class="form-control" type="text" value={liveChat} placeholder="Type the message here" onChange={newText} />
                                    <Button onClick={sendText}>Send</Button>
                                </div>
                                <Button variant="dark" className="pollButton" onClick={handlePollWindow}>
                                    Add Poll
                                </Button>
                                <Button variant="dark" className="pollButton" onClick={handleTakePoll}>
                                    Take Poll
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Room;