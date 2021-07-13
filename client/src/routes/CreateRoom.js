//Home Page Code

import React from "react";
import { v1 as uuid } from "uuid";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form, DropdownButton, Dropdown, FormControl, Navbar, Nav } from 'react-bootstrap';
import { useState, useRef, useEffect } from "react";
import './CreateRoom.css';

const CreateRoom = (props) => {

    const [muteFlag, setMute] = useState(true);
    const [videoFlag, setVideo] = useState(true);
    const [text, setText] = useState("");
    const [userName, setUserName] = useState("");

    function create() {
        if (userName == '') {
            alert("Enter User Name!");
            return;
        }
        const id = uuid();
        console.log(userName);
        stopSharing();
        props.history.push({ pathname: `/chat/${id}`, state: { mute: muteFlag, video: videoFlag, UserIdentity: userName } });

    }

    const userVideo = useRef();
    useEffect(() => {
        navigator.mediaDevices.getUserMedia(
            {
                video: {
                    height: window.innerHeight / 2,
                    width: window.innerWidth / 2
                }, audio: true
            }).then(stream => {
                userVideo.current.srcObject = stream;
                userVideo.current.srcObject.getAudioTracks()[0].enabled = muteFlag;
                userVideo.current.srcObject.getVideoTracks()[0].enabled = videoFlag;
            })
    }, [])

    function stopSharing() {
        userVideo.current.srcObject.getTracks().forEach((track) => { track.stop() })
        userVideo.current.srcObject = null;
    }

    function MuteControl(e) {
        userVideo.current.srcObject.getAudioTracks()[0].enabled = !(userVideo.current.srcObject.getAudioTracks()[0].enabled)
        console.log(userVideo.current.srcObject.getAudioTracks()[0].enabled)
        setMute(!muteFlag);
    }

    function VideoControl(c) {
        userVideo.current.srcObject.getVideoTracks()[0].enabled = !(userVideo.current.srcObject.getVideoTracks()[0].enabled)
        console.log(userVideo.current.srcObject.getVideoTracks()[0].enabled)
        setVideo(!videoFlag);
    }

    function joinCall(e) {
        if (text == "") {
            alert("Enter Valid Meeting ID!");
            return;
        }
        else if (userName == '') {
            alert("Enter User Name!");
            return;
        }
        else {
			stopSharing();
            props.history.push({ pathname: `/chat/${text}`, state: { mute: muteFlag, video: videoFlag, UserIdentity: userName } });
		}
    }
    function joinVideo(e) {
        if (text == "") {
            alert("Enter Valid Meeting ID!");
            return;
        }
        else if (userName == '') {
            alert("Enter User Name!");
            return;
        }
        else
            props.history.push({ pathname: `/room/${text}`, state: { mute: muteFlag, video: videoFlag, UserIdentity: userName } });
    }
    function createVideo(e) {
        if (userName == '') {
            alert("Enter User Name!");
            return;
        }
        const id = uuid();
        console.log(userName);
        stopSharing();
        props.history.push({ pathname: `/room/${id}`, state: { mute: muteFlag, video: videoFlag, UserIdentity: userName } });

    }

    function newText(e) {
        setText(e.target.value);
    }

    function newUserName(e) {
        setUserName(e.target.value);
    }


    return (
        <div style={{}}>
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="/">TEAMS</Navbar.Brand>
                <Nav className="mr-auto"></Nav>
                <Form inline>
                <Form.Control className="MeetingIDBox" type="text" placeholder="Enter Meeting ID" onChange={newText} style={{margin:4}}/>
                <Form.Control className="userNameA" type="text" placeholder="User Name" onChange={newUserName} style={{margin:4}}/>
                    <DropdownButton
                alignRight
                title="Join Room"
                className="joinRoomDropdown"
                id="dropdown-menu-align-right"
                style={{}}
            >

                <Dropdown.Item onClick={joinCall}>Join Chat</Dropdown.Item>
                <Dropdown.Item onClick={joinVideo}>Join Video</Dropdown.Item>
            </DropdownButton>
                </Form>
            </Navbar>
            <div className="homePageMain">
            <div className="videoDiv">
            <video muted ref={userVideo} autoPlay playsInline style={{borderRadius: 10}}/>
            <div className="controlButtons">
            <Button variant="secondary" onClick={MuteControl} style={{ width: 50, height: 50, borderRadius: 35, padding: 2, margin: 5 }}>{ muteFlag ? <img src="https://img.icons8.com/ios-glyphs/30/000000/microphone.png" /> : <img src="https://img.icons8.com/ios-glyphs/30/000000/no-microphone.png"/>}</Button>
                <Button variant="secondary" onClick={VideoControl} style={{ width: 50, height: 50, borderRadius: 35, padding: 0, margin: 5 }}>{ videoFlag ?<img src="https://img.icons8.com/material-rounded/24/000000/video-call.png" />: <img src="https://img.icons8.com/ios-glyphs/24/000000/no-video.png"/>}</Button>
            </div>
           </div>
            <div className="formDiv">
            <h1 className="hostMeeting" >Host Meeting</h1>
                <Form.Group>
                    <Form.Control className="userNameB" type="text" placeholder="User Name" onChange={newUserName} />
                    <div className="CreateButtonDiv">

                            <Button onClick={create} style={{margin:2}}>Create Chat Room</Button>

                            <Button onClick={createVideo} style={{margin:2}}>Create Video</Button>
                        </div>
                </Form.Group>
            </div>
            </div>
        </div>
    );
};

export default CreateRoom;