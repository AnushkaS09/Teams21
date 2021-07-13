import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import ChatRoom from "./routes/chatRoom";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room/:roomID" component={Room} />
        <Route path="/chat/:roomID" component={ChatRoom} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
