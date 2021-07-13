# Teams21
TRY OUT THE DEPLOYED APP: [Teams21](https://teams21.netlify.app/)

## How To Run This
* Make sure node and npm are installed in your system by running the commands :
 ```properties
npm -v
node -v
```
Visit [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to install the same
* Clone the repository : 
```properties
git clone https://github.com/AnushkaS09/Teams21
```
* Go into the cloned repository : 
```properties
cd Teams21
```
* Install all dependencies :
```properties
npm install
cd client
npm install
cd ..
```
* Run the server and client using the dev script :
```properties
npm run dev
```
## Agile Methodology
Details of the agile methodology including the work system snapshot, use case diagram, sprints and TDD can be found [here](https://docs.google.com/presentation/d/1wmNrxooVYPMswX1N3ziHwJMFS2-Lm44KTW4L1Nsa9ws/edit#slide=id.ge4aee7a8b5_0_3)

## Features
* Preview page: User can set the video and audio inputs before joining the call.
* Chat Room: Users can continue chating before and after the video call.
* Video Call Room
* Poll Feature: Users can Add and Take Poll, results of the poll can be seen by all users and results are saved.
* Reaction: Users can set reaction animations in between the video call.
* Screen Sharing: User can share their screen.
* Video Call Recorder: Users can record the video call.
* Chats and poll results are reatained anytime the user joins that room-id.

## Technology
* WebRTC
* Socket.io
* Express.js
* React.js
* Node.js
