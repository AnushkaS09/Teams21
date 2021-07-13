import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form, DropdownButton, Dropdown, Modal } from 'react-bootstrap';
import './chatRoom.css';
import socket from "socket.io-client/lib/socket";

const ChatRoom = (props) => {
    const roomID = props.match.params.roomID;
    const socketRef = useRef();
    const formRef = useRef();
    const [liveChat, setliveChat] = useState("");
    const [chatArea, setchatArea] = useState([]);
    useEffect(() => {
        socketRef.current = io.connect("https://ms-teams-2.herokuapp.com/");
        if (typeof props.location.state == 'undefined') {
            props.history.push('/');
            return;
        }
        console.log(roomID);
        // socketRef.current = io.connect("/");
        socketRef.current.emit("join chat room", roomID);
        socketRef.current.emit("user name", props.location.state.UserIdentity);
        socketRef.current.on("sendPreviousMsg", payload => {
            setchatArea(payload);
            console.log(payload);
        })
        socketRef.current.emit("getPreviousMsg", []);
    }, [])

    function joinVideoCall() {
        socketRef.current.srcObject=null;
        socketRef.current.disconnect();
        props.history.push({ pathname: `/room/${props.match.params.roomID}`, state: { mute: props.location.state.mute, video: props.location.state.video, UserIdentity: props.location.state.UserIdentity } });
    }
    function sendText(e) {
        console.log(liveChat);
        socketRef.current.emit("sendText", liveChat);
        setliveChat("");
    }
    function newText(e) {
        // console.log(e.target.value);
        setliveChat(e.target.value);
    }
    function callDisconnect(e) {
        props.history.push('/');
    }
    return (
        <div className="wrapperChatRoom">
            <div class="chatContainerChatRoom p-0">

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
                                <div class="input-group newChatMessageDivCreateRoom">
                                    <input class="form-control" type="text" value={liveChat} placeholder="Type the message here" onChange={newText} />
                                    <Button onClick={sendText}>Send</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="joinButtons">
                <Button variant="secondary" onClick={joinVideoCall}>
                    Join Video Room
                </Button>
				<Button className= "callDisconnectButton" variant="secondary" onClick={(e)=>{navigator.clipboard.writeText(roomID)}}>
                    Copy Room ID
                </Button>
                <Button className= "callDisconnectButton" variant="danger" onClick={callDisconnect}>
                    Disconnect
                </Button>
            </div>
        </div>
    )

}

export default ChatRoom;