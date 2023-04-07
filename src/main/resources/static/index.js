let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let websocket = null;
let peer = null;

WebSocketInit();//初始化 websocket
FormInit();
ButtonFunInit();

/* WebSocket */
function WebSocketInit() {
    //判斷當前瀏覽器是否支持WebSocket
    if ('WebSocket' in window) {
        websocket = new WebSocket("wss://60.248.185.146:8999/signal/call/" + username);
    } else {
        alert("WebSocket is not supported on your browser.");
    }

    //連接發生錯誤
    websocket.onerror = function (e) {
        alert("WebSocket error.");
    };

    //連接關閉
    websocket.onclose = function () {
        console.error("WebSocket disconnect.");
    };

    //連接成功建立
    websocket.onopen = function () {
        console.log("WebSocket connect.");
    };

    //接收來自伺服器的消息
    websocket.onmessage = async function (event) {

        let obj = { type: null, sender: null, msg: null, sdp: null, ice: null };

        obj = JSON.parse(event.data);

        switch (obj.type) {
            //掛斷電話
            case 'hangup':
                if(obj.sender === 'SYSTEM'){
                    tempAlert("對象不存在", 7000);
                } else {
                    tempAlert("通話已結束", 7000);
                }
                document.getElementById('hangup').click();
                return;

            //發起通話請求
            case 'call_start':
                //只有病人會需要確認，但礙於到時候可能無法點選，所以用alert自動接聽
                //if (confirm(obj.sender + " 來電，是否接聽？") == true) {
                    tempAlert("遠距中心來電<br>通話即將開始", 6000);
                    //將連接資訊回覆給 sender
                    document.getElementById('receiver').value = obj.sender;
                    document.getElementById('receiver').style.visibility = 'hidden';//接聽後隱藏表單
                    //確認接聽，初始化 webRTC、回傳 call back
                    await delay(5);
                    WebRTCInit();
                    websocket.send(JSON.stringify({
                        type: "call_back",
                        receiver: obj.sender,
                        sender: username,
                    }));
//                } else {
//                    //拒絕通話掛掉電話
//                    websocket.send(JSON.stringify({
//                        type: "hangup",
//                        receiver: obj.sender,
//                        sender: username,
//                    }));
//                }
//                return;

            //接收到通話請求回覆，傳送 rtc offer 給對方
            case 'call_back':
                //創建本地視訊並發送 offer
                let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideo.srcObject = stream;
                stream.getTracks().forEach(track => {
                    peer.addTrack(track, stream);
                });
                //傳送 offer
                let offer = await peer.createOffer();
                let newOffer = offer.toJSON();
                newOffer["sender"] = username;
                newOffer["receiver"] = document.getElementById('receiver').value;
                websocket.send(JSON.stringify(newOffer));
                await peer.setLocalDescription(offer);//紀錄本地資訊
                return;

            //收到 rtc offer
            case 'offer':
                //將遠端資訊記錄下來，回覆 answer
                await peer.setRemoteDescription(new RTCSessionDescription({ type: obj.type, sdp: obj.sdp }));
                let answer = await peer.createAnswer();
                let newAnswer = answer.toJSON();
                newAnswer["sender"] = username;
                newAnswer["receiver"] = document.getElementById('receiver').value;
                websocket.send(JSON.stringify(newAnswer));
                await peer.setLocalDescription(answer);//紀錄本地資訊
                return;

            //遠端同意進行視訊連線, 紀錄遠端資訊
            case 'answer':
                peer.setRemoteDescription(new RTCSessionDescription({ type: obj.type, sdp: obj.sdp }));
                return;

            //寫入 ice candidate
            case '_ice':
                if (peer.currentRemoteDescription) {
                    peer.addIceCandidate(new RTCIceCandidate(obj.ice));
                }
                return;
        }

    }
}

/* WebRTC initial */
function WebRTCInit() {
    const ice = {
      "iceServers": [
        {"url": "stun:stun.l.google.com:19302"},
        // {"url": "turn:turnserver.com", "username": "user", "credential": "pass"} //範例
      ]
    };
    peer = new RTCPeerConnection(ice);
    // 紀錄 ice
    peer.onicecandidate = function (event) {
        if (event.candidate) {
            websocket.send(JSON.stringify({
                type: '_ice',
                receiver: document.getElementById('receiver').value,
                sender: username,
                ice: event.candidate
            }));
        }
    };
    // track
    peer.ontrack = function (event) {
        if (event && event.streams) {
            remoteVideo.srcObject = event.streams[0];
        }
    };
}

/*按鈕事件*/
function ButtonFunInit() {
    //點擊視訊通話
    document.getElementById('call').onclick = function (e) {
        let receiver = document.getElementById('receiver').value;
        if (!receiver) {
            tempAlert("請輸入通話對象", 3000);
            return;
        } else {
            document.getElementById('receiver').style.visibility = 'hidden';//撥打後隱藏表單
            document.getElementById('call').setAttribute("disabled", "disabled");//撥打後disable通話鍵
            tempAlert("等待接聽...", 7000);//顯示撥打訊息
        }
        if (peer == null) {
            WebRTCInit();
        }
        sendMessage(JSON.stringify({
            type: "call_start",
            sender: username,
            receiver: receiver,
        }));
    }

    //掛斷電話
    document.getElementById('hangup').onclick = function (e) {
        document.getElementById('receiver').style.visibility = 'unset';//掛掉後開啟表單
        document.getElementById('call').removeAttribute("disabled");//enable通話鍵
        if (localVideo.srcObject) {
            const videoTracks = localVideo.srcObject.getVideoTracks();
            videoTracks.forEach(videoTrack => {
                videoTrack.stop();
                localVideo.srcObject.removeTrack(videoTrack);
            });
        }
        if (remoteVideo.srcObject) {
            const videoTracks = remoteVideo.srcObject.getVideoTracks();
            videoTracks.forEach(videoTrack => {
                videoTrack.stop();
                remoteVideo.srcObject.removeTrack(videoTrack);
            });
            //掛斷同時，通知對方
            websocket.send(JSON.stringify({
                type: "hangup",
                sender: username,
                receiver: document.getElementById('receiver').value,
            }));
        }
        if (peer) {
            peer.close();
            peer = null;
        }
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
    }
}

function FormInit() {
    if(username !== 'center') {
        document.getElementById("receiver").style.display = 'none';//統一從醫院端發起通話
        document.getElementById("buttons").style.display = 'none';//統一從醫院端控制通話
    } else {
        if(target !== null) {
            //如果有指定對象，則綁定對象(不給修改)
            document.getElementById("receiver").value = target;
            document.getElementById("receiver").setAttribute("disabled", "disabled");
            document.getElementById("receiver").readOnly = true;
            document.getElementById("receiver").style.color = "#D0D0D0";
        }
    }
}

function tempAlert(msg, duration) {
 var el = document.createElement("div");
 el.setAttribute("style","position:absolute;color: white;background-color:black;font-size: 2em");
 el.innerHTML = msg;
 el.id = 'msg';
 setTimeout(function(){
  el.parentNode.removeChild(el);
 }, duration);
 document.body.appendChild(el);
}

function delay(n) {
    return new Promise((r) => {
        setTimeout(r, n * 1000);
    });
}

function sendMessage(msg) {
    // Wait until the state of the socket is not ready and send the message when it is...
    WaitForSocketConnection(websocket, function() {
        websocket.send(msg);
    });
}

// Make the function wait until the connection is made...
function waitForSocketConnection(socket, callback) {
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                if (callback != null){
                    callback();
                }
            } else {
                tempAlert("等待接聽...", 1000);
                waitForSocketConnection(socket, callback);
            }
        }, 5); // wait 5 milisecond for the connection...
}