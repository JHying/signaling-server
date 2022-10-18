let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let websocket = null;
let peer = null;

WebSocketInit();//初始化 websocket
ButtonFunInit();

/* WebSocket */
function WebSocketInit() {
    //判斷當前瀏覽器是否支持WebSocket
    if ('WebSocket' in window) {
        websocket = new WebSocket("ws://localhost:8996/signal/call/" + username);
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

        if (obj.type !== '_ice') {
            console.log(obj.msg);
        }

        switch (obj.type) {
            //掛斷電話
            case 'hangup':
                document.getElementById('hangup').click();
                return;

            //發起通話請求
            case 'call_start':
                if (confirm(obj.sender + " 來電，是否接聽？") == true) {
                    //將連接資訊回覆給 sender
                    document.getElementById('receiver').value = obj.sender;
                    document.getElementById('receiver').style.visibility = 'hidden';//接聽後隱藏表單
                    WebRTCInit();
                    //確認接聽回傳 call back
                    websocket.send(JSON.stringify({
                        type: "call_back",
                        receiver: obj.sender,
                        sender: username,
                    }));
                } else {
                    //拒絕通話掛掉電話
                    websocket.send(JSON.stringify({
                        type: "hangup",
                        receiver: obj.sender,
                        sender: username,
                    }));
                }
                return;

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
                //創建本地視訊
                let stream2 = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideo.srcObject = stream2;
                stream2.getTracks().forEach(track => {
                    peer.addTrack(track, stream2);
                });
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
    peer = new RTCPeerConnection();
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
            alert("請輸入通話對象，再發起視訊通話！");
            return;
        } else {
            document.getElementById('receiver').style.visibility = 'hidden';//撥打後隱藏表單
        }
        if (peer == null) {
            WebRTCInit();
        }
        websocket.send(JSON.stringify({
            type: "call_start",
            sender: username,
            receiver: receiver,
        }));
    }

    //掛斷電話
    document.getElementById('hangup').onclick = function (e) {
        document.getElementById('receiver').style.visibility = 'unset';//掛掉後開啟表單
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